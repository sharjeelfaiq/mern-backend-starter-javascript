import "./helpers/env.js";
import assert from "node:assert/strict";
import fs from "node:fs";
import { afterEach, mock, test } from "node:test";

import { deleteFile } from "#lib/file.lib.js";
import { logger } from "#lib/logger.lib.js";

afterEach(() => mock.restoreAll());

test("deleteFile unlinks an existing file and logs it", () => {
  mock.method(fs, "existsSync", () => true);
  const unlink = mock.method(fs, "unlinkSync", () => {});
  const info = mock.method(logger, "info", () => {});

  deleteFile("/tmp/avatar.png");

  assert.deepEqual(unlink.mock.calls[0].arguments, ["/tmp/avatar.png"]);
  assert.match(info.mock.calls[0].arguments[0], /File deleted/);
});

test("deleteFile warns instead of throwing when the file is missing", () => {
  mock.method(fs, "existsSync", () => false);
  const unlink = mock.method(fs, "unlinkSync", () => {});
  const warn = mock.method(logger, "warn", () => {});

  deleteFile("/tmp/missing.png");

  assert.equal(unlink.mock.callCount(), 0);
  assert.match(warn.mock.calls[0].arguments[0], /File not found/);
});
