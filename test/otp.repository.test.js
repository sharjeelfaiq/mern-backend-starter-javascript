import "./helpers/env.js";
import assert from "node:assert/strict";
import { afterEach, mock, test } from "node:test";

import { OtpModel } from "#api/otp/otp.model.js";
import { otpRepository } from "#api/otp/otp.repository.js";

afterEach(() => mock.restoreAll());

test("createOtp stores only the hash, owner and expiry", async () => {
  const expiresAt = new Date();
  const create = mock.method(OtpModel, "create", async (doc) => doc);

  await otpRepository.createOtp({
    otpHash: "hash",
    userId: "user-1",
    expiresAt,
  });

  assert.deepEqual(create.mock.calls[0].arguments[0], {
    otpHash: "hash",
    userId: "user-1",
    expiresAt,
  });
});

test("findOtpByUserId filters by user", async () => {
  const find = mock.method(OtpModel, "find", async () => []);

  await otpRepository.findOtpByUserId("user-1");

  assert.deepEqual(find.mock.calls[0].arguments, [{ userId: "user-1" }]);
});

test("consumeOtp deletes only an unexpired code owned by the user", async () => {
  const del = mock.method(OtpModel, "findOneAndDelete", async () => null);
  const before = Date.now();

  await otpRepository.consumeOtp("otp-1", "user-1");

  const [filter] = del.mock.calls[0].arguments;
  assert.equal(filter._id, "otp-1");
  assert.equal(filter.userId, "user-1");
  assert.equal(filter.expiresAt.$gt instanceof Date, true);
  assert.equal(filter.expiresAt.$gt.getTime() >= before, true);
});

test("deleteOtp deletes by id", async () => {
  const del = mock.method(OtpModel, "findByIdAndDelete", async () => null);

  await otpRepository.deleteOtp("otp-1");

  assert.deepEqual(del.mock.calls[0].arguments, ["otp-1"]);
});
