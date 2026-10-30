import "./helpers/env.js";
import assert from "node:assert/strict";
import { test } from "node:test";

import { getCookieOptions } from "#lib/cookie.lib.js";

test("short-lived cookies use the short expiry and configured attributes", () => {
  assert.deepEqual(getCookieOptions(), {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    maxAge: 900000,
    path: "/",
  });
});

test("remembered cookies use the long expiry", () => {
  assert.equal(getCookieOptions(true).maxAge, 604800000);
});
