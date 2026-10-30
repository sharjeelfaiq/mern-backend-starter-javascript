import "./helpers/env.js";
import assert from "node:assert/strict";
import { afterEach, mock, test } from "node:test";

import { reportError, setErrorReporter } from "#lib/errorReporter.lib.js";
import { logger } from "#lib/logger.lib.js";

afterEach(() => {
  setErrorReporter(null);
  mock.restoreAll();
});

test("reportError does nothing without a registered reporter", async () => {
  await assert.doesNotReject(reportError(new Error("x"), { status: 500 }));
});

test("reportError passes the error, context and configured DSN to the reporter", async () => {
  const reporter = mock.fn(async () => {});
  setErrorReporter(reporter);
  const error = new Error("boom");

  await reportError(error, { status: 503, method: "POST", path: "/x" });

  assert.deepEqual(reporter.mock.calls[0].arguments, [
    error,
    { status: 503, method: "POST", path: "/x", dsn: "" },
  ]);
});

test("reportError swallows and logs reporter failures", async () => {
  const log = mock.method(logger, "error", () => {});
  setErrorReporter(() => {
    throw new Error("reporter down");
  });

  await assert.doesNotReject(reportError(new Error("x"), { status: 500 }));
  assert.match(log.mock.calls[0].arguments[0], /reporter down/);
});

test("a removed reporter stops receiving errors", async () => {
  const reporter = mock.fn();
  setErrorReporter(reporter);
  setErrorReporter(null);

  await reportError(new Error("x"), { status: 500 });

  assert.equal(reporter.mock.callCount(), 0);
});
