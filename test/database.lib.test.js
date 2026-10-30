import "./helpers/env.js";
import assert from "node:assert/strict";
import { afterEach, mock, test } from "node:test";
import mongoose from "mongoose";

import { connectDatabase } from "#lib/database.lib.js";
import { logger } from "#lib/logger.lib.js";

const sigintBefore = process.listeners("SIGINT");

afterEach(() => {
  mock.restoreAll();
  for (const listener of process.listeners("SIGINT")) {
    if (!sigintBefore.includes(listener)) process.off("SIGINT", listener);
  }
  mongoose.connection.removeAllListeners("error");
  mongoose.connection.removeAllListeners("disconnected");
});

test("connectDatabase reuses a live connection and reconnects after a disconnect", async () => {
  const connect = mock.method(mongoose, "connect", async () => ({
    connections: [{ readyState: 1 }],
  }));
  const warn = mock.method(logger, "warn", () => {});
  mock.method(logger, "error", () => {});

  await connectDatabase();
  await connectDatabase();

  assert.equal(connect.mock.callCount(), 1);
  assert.deepEqual(connect.mock.calls[0].arguments, [
    "mongodb://127.0.0.1:27017/unit-test",
    { serverSelectionTimeoutMS: 8000 },
  ]);
  assert.equal(warn.mock.callCount(), 1);
  assert.match(warn.mock.calls[0].arguments[0], /Using existing MongoDB/);

  mongoose.connection.emit("disconnected");
  await connectDatabase();

  assert.equal(connect.mock.callCount(), 2);
});
