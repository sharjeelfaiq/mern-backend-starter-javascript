import "./helpers/env.js";
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import express from "express";

import {
  applyGlobalMiddleware,
  serializeError,
} from "#middlewares/global.middleware.js";

let server;
let base;

before(async () => {
  const app = express();
  const router = express.Router();
  router.post("/echo", (req, res) => res.json(req.body));
  router.get("/item/:id", (req, res) => res.json({ id: req.params.id }));
  router.get("/boom", () => {
    throw new Error("internal failure");
  });
  applyGlobalMiddleware(app, router);
  server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server?.listening) await new Promise((resolve) => server.close(resolve));
});

const request = (path, options) => fetch(`${base}${path}`, options);

test("global validation rejects nested unsafe fields and HTML markup", async () => {
  const unsafeBodies = [
    { nested: { $where: "x" } },
    { nested: [{ "a.b": 1 }] },
    { nested: { constructor: "x" } },
    { text: "<script>bad</script>" },
  ];
  for (const body of unsafeBodies) {
    const result = await request("/echo", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    assert.equal(result.status, 400);
  }
  assert.equal((await request("/item/one?name%2Efirst=x")).status, 400);
  assert.equal((await request("/item/one?name=Ada")).status, 200);
});

test("metrics require the operator token and count requests and errors", async () => {
  assert.equal((await request("/metrics")).status, 401);
  assert.equal(
    (await request("/metrics", { headers: { authorization: "Bearer bad" } }))
      .status,
    401,
  );
  assert.equal((await request("/boom")).status, 500);
  const response = await request("/metrics", {
    headers: { authorization: "Bearer unit-metrics-secret" },
  });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  const metrics = await response.json();
  assert.equal(metrics.errors.client >= 2, true);
  assert.equal(metrics.errors.server >= 1, true);
  assert.equal(
    metrics.requests.some(
      (item) => item.route === "/boom" && item.status === 500,
    ),
    true,
  );
  assert.equal(
    metrics.requests.every((item) => item.totalDurationMs >= 0),
    true,
  );
  assert.doesNotMatch(
    JSON.stringify(metrics),
    /unit-metrics-secret|internal failure/,
  );
});

test("production error serialization omits stacks", () => {
  const error = new Error("failure");
  assert.equal(serializeError(error, "production").stack, undefined);
  assert.equal(serializeError(error, "test").stack, error.stack);
});
