import "./helpers/env.js";
import assert from "node:assert/strict";
import { test } from "node:test";
import bcrypt from "bcryptjs";

import { generateOtp } from "#lib/otp.lib.js";

test("generateOtp returns a six digit code and a matching bcrypt hash", async () => {
  const { rawOtp, hashedOtp } = await generateOtp();

  assert.match(rawOtp, /^\d{6}$/);
  assert.notEqual(hashedOtp, rawOtp);
  assert.equal(await bcrypt.compare(rawOtp, hashedOtp), true);
  assert.equal(await bcrypt.compare("000000", hashedOtp), false);
});

test("generateOtp expires the code in about five minutes", async () => {
  const before = Date.now();
  const { expiresAt } = await generateOtp();
  const ttl = expiresAt.getTime() - before;

  assert.equal(expiresAt instanceof Date, true);
  assert.equal(ttl >= 5 * 60 * 1000 && ttl < 5 * 60 * 1000 + 5000, true);
});

test("generateOtp issues a fresh salt for each hash", async () => {
  const first = await generateOtp();
  const second = await generateOtp();

  assert.notEqual(first.hashedOtp, second.hashedOtp);
});
