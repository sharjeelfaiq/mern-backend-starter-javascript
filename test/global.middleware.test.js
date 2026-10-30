import "./helpers/env.js";
import assert from "node:assert/strict";
import { after, afterEach, before, test } from "node:test";
import express from "express";
import createError from "http-errors";

import {
  applyGlobalMiddleware,
  serializeError,
} from "#middlewares/global.middleware.js";
import { setErrorReporter } from "#lib/errorReporter.lib.js";

let server;
let base;

before(async () => {
  const app = express();
  const router = express.Router();
  router.post("/echo", (req, res) => res.json(req.body));
  router.get("/item/:id", (req, res) => res.json({ id: req.params.id }));
  router.get("/conflict", () => {
    throw createError(409, "already exists");
  });
  router.get("/boom", () => {
    throw new Error("internal failure");
  });
  applyGlobalMiddleware(app, router);
  server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

afterEach(() => setErrorReporter(null));

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

test("5xx errors are forwarded to the registered reporter", async () => {
  const reports = [];
  setErrorReporter((error, context) => {
    reports.push({ message: error.message, context });
  });

  const response = await request("/boom?x=1");

  assert.equal(response.status, 500);
  assert.equal(reports.length, 1);
  assert.equal(reports[0].message, "internal failure");
  assert.deepEqual(reports[0].context, {
    status: 500,
    method: "GET",
    path: "/boom?x=1",
    dsn: "",
  });
});

test("4xx errors and unknown routes are not reported", async () => {
  let calls = 0;
  setErrorReporter(() => {
    calls += 1;
  });

  assert.equal((await request("/conflict")).status, 409);
  assert.equal((await request("/missing")).status, 404);
  assert.equal(calls, 0);
});

test("a failing reporter does not change the error response", async () => {
  setErrorReporter(async () => {
    throw new Error("reporter down");
  });

  const response = await request("/boom");

  assert.equal(response.status, 500);
  assert.equal((await response.json()).message, "internal failure");
});
