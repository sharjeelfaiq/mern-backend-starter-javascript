import "./helpers/env.js";
import assert from "node:assert/strict";
import { afterEach, mock, test } from "node:test";

import { emailService } from "#api/email/email.service.js";
import { userRepository } from "#api/user/user.repository.js";
import { setTestEmailSender } from "#lib/email.lib.js";
import { generateToken, verifyToken } from "#lib/token.lib.js";

const user = { _id: "user-1", email: "a@test.dev" };
let sent;

const captureEmail = (result = true) => {
  sent = [];
  setTestEmailSender(async (type, options) => {
    sent.push({ type, options });
    return result;
  });
};

afterEach(() => mock.restoreAll());

test("send rejects an unknown email without mailing anything", async () => {
  captureEmail();
  mock.method(userRepository, "findUserByEmail", async () => null);

  await assert.rejects(emailService.send({ email: user.email }), {
    status: 404,
  });
  assert.equal(sent.length, 0);
});

test("send mails a verification token that only works for email verification", async () => {
  captureEmail();
  mock.method(userRepository, "findUserByEmail", async () => user);

  const result = await emailService.send({ email: user.email });

  assert.equal(result.message, "Verification email sent successfully");
  assert.equal(sent[0].type, "verification-email");
  assert.equal(sent[0].options.email, user.email);
  assert.equal(sent[0].options.BACKEND_URL, "http://localhost:8000");
  const { verificationToken } = sent[0].options;
  assert.equal(
    verifyToken(verificationToken, "email-verification").id,
    user._id,
  );
  assert.throws(() => verifyToken(verificationToken), { status: 401 });
});

test("send fails with 500 when delivery fails", async () => {
  captureEmail(false);
  mock.method(userRepository, "findUserByEmail", async () => user);

  await assert.rejects(emailService.send({ email: user.email }), {
    status: 500,
  });
});

test("verify rejects a token issued for another purpose", async () => {
  captureEmail();
  const token = generateToken(user._id, false, "access");

  await assert.rejects(emailService.verify({ verificationToken: token }), {
    status: 401,
  });
  assert.equal(sent.length, 0);
});

test("verify marks the user verified and sends a confirmation", async () => {
  captureEmail();
  const token = generateToken(user._id, false, "email-verification");
  const update = mock.method(
    userRepository,
    "updateUserById",
    async () => user,
  );
  mock.method(userRepository, "findUserById", async () => user);

  const result = await emailService.verify({ verificationToken: token });

  assert.deepEqual(update.mock.calls[0].arguments, [
    user._id,
    { isEmailVerified: true },
  ]);
  assert.equal(result.message, "Email verified successfully");
  assert.equal(sent[0].type, "verification-success");
  assert.equal(sent[0].options.FRONTEND_URL, "http://localhost:3000");
});

test("verify fails with 500 when the update does not apply", async () => {
  captureEmail();
  const token = generateToken(user._id, false, "email-verification");
  mock.method(userRepository, "updateUserById", async () => null);

  await assert.rejects(emailService.verify({ verificationToken: token }), {
    status: 500,
  });
  assert.equal(sent.length, 0);
});

test("verify fails with 404 when the user disappears after the update", async () => {
  captureEmail();
  const token = generateToken(user._id, false, "email-verification");
  mock.method(userRepository, "updateUserById", async () => user);
  mock.method(userRepository, "findUserById", async () => null);

  await assert.rejects(emailService.verify({ verificationToken: token }), {
    status: 404,
  });
});
