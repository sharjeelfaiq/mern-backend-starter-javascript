import "./helpers/env.js";
import assert from "node:assert/strict";
import { afterEach, mock, test } from "node:test";
import mongoose from "mongoose";

import { healthService } from "#api/health/health.service.js";
import { logger } from "#lib/logger.lib.js";

const stubbed = ["readyState", "db"];

afterEach(() => {
  mock.restoreAll();
  for (const name of stubbed) delete mongoose.connection[name];
});

const stubDatabase = ({ readyState, ping }) => {
  const value = { readyState, db: { admin: () => ({ ping }) } };
  for (const name of stubbed) {
    Object.defineProperty(mongoose.connection, name, {
      configurable: true,
      get: () => value[name],
    });
  }
};

test("checkHealth succeeds when the database answers a ping", async () => {
  const ping = mock.fn(async () => ({ ok: 1 }));
  stubDatabase({ readyState: 1, ping });

  const result = await healthService.checkHealth();

  assert.equal(result.status, "success");
  assert.equal(ping.mock.callCount(), 1);
});

test("checkHealth reports 503 when the database is disconnected", async () => {
  const ping = mock.fn(async () => ({ ok: 1 }));
  stubDatabase({ readyState: 0, ping });

  await assert.rejects(healthService.checkHealth(), { status: 503 });
  assert.equal(ping.mock.callCount(), 0);
});

test("checkHealth reports 503 and logs when the ping fails", async () => {
  mock.method(logger, "error", () => {});
  stubDatabase({
    readyState: 1,
    ping: async () => {
      throw new Error("ping failed");
    },
  });

  await assert.rejects(healthService.checkHealth(), { status: 503 });
});

test("checkDetailedHealth reports runtime and configuration status", async () => {
  stubDatabase({ readyState: 1, ping: async () => ({ ok: 1 }) });

  const { data } = await healthService.checkDetailedHealth();

  assert.equal(data.database.status, "healthy");
  assert.equal(data.memory.status, "normal");
  assert.equal(data.environment, "Development");
  assert.deepEqual(data.urls, {
    backend: "http://localhost:8000",
    frontend: "http://localhost:3000",
  });
  assert.deepEqual(data.configured, {
    database: true,
    jwt: true,
    cloudinary: true,
    email: true,
  });
  assert.doesNotMatch(JSON.stringify(data), /unit-test-secret/);
});

test("checkDetailedHealth reports 503 when the database is down", async () => {
  stubDatabase({ readyState: 0, ping: async () => ({ ok: 1 }) });

  await assert.rejects(healthService.checkDetailedHealth(), { status: 503 });
});
