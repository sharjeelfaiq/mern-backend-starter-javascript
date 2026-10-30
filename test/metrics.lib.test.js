import "./helpers/env.js";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { test } from "node:test";

import { getMetrics, requestMetrics } from "#lib/metrics.lib.js";

const fakeResponse = (statusCode = 200) => {
  const res = new EventEmitter();
  res.statusCode = statusCode;
  res.headers = {};
  res.body = undefined;
  res.set = (name, value) => {
    res.headers[name.toLowerCase()] = value;
  };
  res.sendStatus = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (payload) => {
    res.body = payload;
    return res;
  };
  return res;
};

const record = (req, statusCode) => {
  const res = fakeResponse(statusCode);
  let called = false;
  requestMetrics(req, res, () => {
    called = true;
  });
  assert.equal(called, true);
  res.emit("finish");
};

const read = (authorization) => {
  const res = fakeResponse();
  getMetrics({ get: () => authorization }, res);
  return res;
};

test("requestMetrics aggregates by method, route and status", () => {
  const req = {
    method: "GET",
    baseUrl: "/api/v1/users",
    route: { path: "/:id" },
  };
  record(req, 200);
  record(req, 200);
  record(req, 404);

  const { body } = read("Bearer unit-metrics-secret");
  const ok = body.requests.find(
    (item) => item.route === "/api/v1/users/:id" && item.status === 200,
  );

  assert.equal(ok.method, "GET");
  assert.equal(ok.count, 2);
  assert.equal(body.errors.client >= 1, true);
});

test("unmatched routes and unknown methods use fixed labels", () => {
  record({ method: "BREW", baseUrl: "", route: undefined }, 500);

  const { body } = read("Bearer unit-metrics-secret");
  const series = body.requests.find((item) => item.method === "OTHER");

  assert.equal(series.route, "<unmatched>");
  assert.equal(body.errors.server >= 1, true);
});

test("getMetrics rejects missing, malformed and wrong credentials", () => {
  for (const header of [
    undefined,
    "unit-metrics-secret",
    "Basic unit-metrics-secret",
    "Bearer wrong",
    "Bearer ",
  ]) {
    const res = read(header);
    assert.equal(res.statusCode, 401);
    assert.equal(res.headers["cache-control"], "no-store");
    assert.equal(res.body, undefined);
  }
});

test("getMetrics reports uptime for an authorized operator", () => {
  const { body, statusCode } = read("Bearer unit-metrics-secret");

  assert.equal(statusCode, 200);
  assert.equal(Number.isInteger(body.uptimeSeconds), true);
  assert.equal(Array.isArray(body.requests), true);
});
