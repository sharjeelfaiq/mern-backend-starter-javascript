import "./helpers/env.js";
import assert from "node:assert/strict";
import { afterEach, mock, test } from "node:test";
import bcrypt from "bcryptjs";

import { authService } from "#api/auth/auth.service.js";
import { setTestEmailSender } from "#lib/email.lib.js";
import { generateToken, verifyToken } from "#lib/token.lib.js";
import { userRepository } from "#api/user/user.repository.js";

const signup = () =>
  authService.signup({
    firstName: "Ada",
    lastName: "L",
    email: "a@test.dev",
    password: "Passw0rd!",
  });

afterEach(() => mock.restoreAll());

test("signup rejects a duplicate email", async () => {
  mock.method(userRepository, "findUserByEmail", async () => ({}));
  await assert.rejects(signup(), { status: 400 });
});

test("signup hashes the password and emails a verification token", async () => {
  const sent = [];
  setTestEmailSender(async (type, options) => {
    sent.push({ type, options });
    return true;
  });
  mock.method(userRepository, "findUserByEmail", async () => null);
  const create = mock.method(userRepository, "createUser", async () => ({
    _id: "u1",
  }));

  await signup();

  const storedHash = create.mock.calls[0].arguments[3];
  assert.equal(await bcrypt.compare("Passw0rd!", storedHash), true);
  assert.equal(sent[0].type, "verification-email");
  assert.equal(
    verifyToken(sent[0].options.verificationToken, "email-verification").id,
    "u1",
  );
});

test("signup deletes the new user when the email is not delivered", async () => {
  mock.method(userRepository, "findUserByEmail", async () => null);
  mock.method(userRepository, "createUser", async () => ({ _id: "u1" }));
  const del = mock.method(userRepository, "deleteUserById", async () => null);

  setTestEmailSender(async () => false);
  await assert.rejects(signup(), { status: 500 });
  setTestEmailSender(async () => {
    throw new Error("smtp down");
  });
  await assert.rejects(signup(), /smtp down/);

  assert.equal(del.mock.callCount(), 2);
});

test("signup fails when the user cannot be created", async () => {
  mock.method(userRepository, "findUserByEmail", async () => null);
  mock.method(userRepository, "createUser", async () => null);
  await assert.rejects(signup(), { status: 500 });
});

test("signin enforces credentials and email verification", async () => {
  const password = await bcrypt.hash("Passw0rd!", 4);
  const find = mock.method(
    userRepository,
    "findUserByEmailOrUsername",
    async () => null,
  );
  const signin = (p) =>
    authService.signin({ email: "a@test.dev", password: p });

  await assert.rejects(signin("Passw0rd!"), { status: 401 }); // unknown user

  find.mock.mockImplementation(async () => ({ _id: "u1", password }));
  await assert.rejects(signin("wrong"), { status: 401 });
  await assert.rejects(signin("Passw0rd!"), { status: 403 }); // unverified
});

test("signin issues an access token for a verified user", async () => {
  const password = await bcrypt.hash("Passw0rd!", 4);
  mock.method(userRepository, "findUserByEmailOrUsername", async () => ({
    _id: "u1",
    password,
    firstName: "Ada",
    lastName: "L",
    isEmailVerified: true,
  }));

  const result = await authService.signin({
    email: "a@test.dev",
    password: "Passw0rd!",
  });

  assert.equal(result.data.name, "Ada L");
  assert.equal(verifyToken(result.token).id, "u1");
});

test("signOut requires a valid access token", async () => {
  await assert.rejects(authService.signOut(), { status: 400 });
  await assert.rejects(authService.signOut("garbage"), { status: 401 });
  await assert.rejects(
    authService.signOut(generateToken("u1", false, "password-reset")),
    { status: 401 },
  );
  const ok = await authService.signOut(generateToken("u1"));
  assert.equal(ok.message, "Sign-out successful.");
});

test("forgotPassword mails a password-reset token", async () => {
  const sent = [];
  setTestEmailSender(async (type, options) => {
    sent.push({ type, options });
    return true;
  });
  const find = mock.method(userRepository, "findUserByEmail", async () => null);

  await assert.rejects(authService.forgotPassword({ email: "a@test.dev" }), {
    status: 404,
  });

  find.mock.mockImplementation(async () => ({ _id: "u1" }));
  await authService.forgotPassword({ email: "a@test.dev" });
  assert.equal(
    verifyToken(sent[0].options.resetToken, "password-reset").id,
    "u1",
  );

  setTestEmailSender(async () => false);
  await assert.rejects(authService.forgotPassword({ email: "a@test.dev" }), {
    status: 500,
  });
});

test("resetPassword only accepts password-reset tokens and stores a hash", async () => {
  await assert.rejects(
    authService.resetPassword({
      token: generateToken("u1"),
      password: "NewPassw0rd!",
    }),
    { status: 401 },
  );

  const token = generateToken("u1", false, "password-reset");
  const find = mock.method(userRepository, "findUserById", async () => null);
  await assert.rejects(
    authService.resetPassword({ token, password: "NewPassw0rd!" }),
    { status: 404 },
  );

  find.mock.mockImplementation(async () => ({ email: "a@test.dev" }));
  const update = mock.method(
    userRepository,
    "updateUserPasswordByEmail",
    async () => ({}),
  );
  await authService.resetPassword({ token, password: "NewPassw0rd!" });
  const [email, hash] = update.mock.calls[0].arguments;
  assert.equal(email, "a@test.dev");
  assert.equal(await bcrypt.compare("NewPassw0rd!", hash), true);

  update.mock.mockImplementation(async () => null);
  await assert.rejects(
    authService.resetPassword({ token, password: "NewPassw0rd!" }),
    { status: 500 },
  );
});
