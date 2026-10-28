import "./helpers/env.js";
import assert from "node:assert/strict";
import { afterEach, mock, test } from "node:test";
import bcrypt from "bcryptjs";

import { setTestEmailSender } from "#lib/email.lib.js";
import { otpRepository } from "#api/otp/otp.repository.js";
import { otpService } from "#api/otp/otp.service.js";
import { userRepository } from "#api/user/user.repository.js";

const user = { _id: "user-1", email: "a@test.dev" };

afterEach(() => mock.restoreAll());

test("send rejects an unknown email without creating an OTP", async () => {
  mock.method(userRepository, "findUserByEmail", async () => null);
  const create = mock.method(otpRepository, "createOtp", async () => ({}));

  await assert.rejects(otpService.send({ email: user.email }), {
    status: 400,
  });
  assert.equal(create.mock.callCount(), 0);
});

test("send stores a hashed OTP and mails the raw code", async () => {
  const sent = [];
  setTestEmailSender(async (type, options) => sent.push({ type, options }));
  mock.method(userRepository, "findUserByEmail", async () => user);
  const create = mock.method(otpRepository, "createOtp", async (o) => ({
    _id: "otp-1",
    ...o,
  }));

  const result = await otpService.send({ email: user.email });

  assert.equal(result.success, true);
  const { otpHash, userId } = create.mock.calls[0].arguments[0];
  assert.equal(userId, user._id);
  assert.equal(await bcrypt.compare(sent[0].options.otpCode, otpHash), true);
  assert.notEqual(otpHash, sent[0].options.otpCode);
});

test("send removes the OTP when delivery fails or throws", async () => {
  mock.method(userRepository, "findUserByEmail", async () => user);
  mock.method(otpRepository, "createOtp", async () => ({ _id: "otp-1" }));
  const del = mock.method(otpRepository, "deleteOtp", async () => null);

  setTestEmailSender(async () => false);
  await assert.rejects(otpService.send({ email: user.email }), { status: 500 });

  setTestEmailSender(async () => {
    throw new Error("smtp down");
  });
  await assert.rejects(otpService.send({ email: user.email }), /smtp down/);

  assert.equal(del.mock.callCount(), 2);
  assert.equal(del.mock.calls[0].arguments[0], "otp-1");
});

test("send fails when the OTP cannot be persisted", async () => {
  mock.method(userRepository, "findUserByEmail", async () => user);
  mock.method(otpRepository, "createOtp", async () => null);

  await assert.rejects(
    otpService.send({ email: user.email }),
    /Failed to create OTP/,
  );
});

test("verify accepts a valid code and consumes it once", async () => {
  const otpHash = await bcrypt.hash("123456", 4);
  mock.method(userRepository, "findUserByEmail", async () => user);
  mock.method(otpRepository, "findOtpByUserId", async () => [
    { _id: "otp-1", otpHash, expiresAt: new Date(Date.now() + 60_000) },
  ]);
  const consume = mock.method(otpRepository, "consumeOtp", async () => ({}));

  const result = await otpService.verify({ email: user.email, otp: "123456" });

  assert.equal(result.message, "OTP Verified");
  assert.deepEqual(consume.mock.calls[0].arguments, ["otp-1", user._id]);
});

test("verify rejects wrong, expired, already-consumed, or missing codes", async () => {
  const otpHash = await bcrypt.hash("123456", 4);
  const future = new Date(Date.now() + 60_000);
  mock.method(userRepository, "findUserByEmail", async () => user);
  const find = mock.method(otpRepository, "findOtpByUserId", async () => []);
  const consume = mock.method(otpRepository, "consumeOtp", async () => null);
  const verify = (otp) => otpService.verify({ email: user.email, otp });

  await assert.rejects(verify("123456"), { status: 400 }); // none stored

  find.mock.mockImplementation(async () => [
    { _id: "1", otpHash, expiresAt: future },
  ]);
  await assert.rejects(verify("000000"), { status: 400 }); // wrong code
  assert.equal(consume.mock.callCount(), 0);

  find.mock.mockImplementation(async () => [
    { _id: "1", otpHash, expiresAt: new Date(Date.now() - 1) },
  ]);
  await assert.rejects(verify("123456"), { status: 400 }); // expired
  assert.equal(consume.mock.callCount(), 0);

  find.mock.mockImplementation(async () => [
    { _id: "1", otpHash, expiresAt: future },
  ]);
  await assert.rejects(verify("123456"), { status: 400 }); // lost the race
  assert.equal(consume.mock.callCount(), 1);
});

test("verify rejects an unknown email", async () => {
  mock.method(userRepository, "findUserByEmail", async () => null);
  await assert.rejects(otpService.verify({ email: "x@test.dev", otp: "1" }), {
    status: 400,
  });
});
