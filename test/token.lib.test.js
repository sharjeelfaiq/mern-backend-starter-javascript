import "./helpers/env.js";
import assert from "node:assert/strict";
import { afterEach, mock, test } from "node:test";
import jwt from "jsonwebtoken";

import { generateToken, verifyToken } from "#lib/token.lib.js";

afterEach(() => mock.restoreAll());

const lifetimeSeconds = (token) => {
  const { iat, exp } = jwt.decode(token);
  return exp - iat;
};

test("generateToken embeds the user id and defaults to the access purpose", () => {
  const decoded = verifyToken(generateToken("user-1"));

  assert.equal(decoded.id, "user-1");
  assert.equal(decoded.purpose, "access");
});

test("remembered tokens live longer than short-lived ones", () => {
  assert.equal(lifetimeSeconds(generateToken("u", false)), 15 * 60);
  assert.equal(lifetimeSeconds(generateToken("u", true)), 7 * 24 * 60 * 60);
});

test("verifyToken rejects a token issued for another purpose", () => {
  const token = generateToken("user-1", false, "password-reset");

  assert.throws(() => verifyToken(token), { status: 401 });
  assert.equal(verifyToken(token, "password-reset").id, "user-1");
});

test("verifyToken rejects tampered and malformed tokens", () => {
  const forged = jwt.sign({ id: "user-1", purpose: "access" }, "wrong-secret");

  assert.throws(() => verifyToken(forged), { status: 401 });
  assert.throws(() => verifyToken("not-a-jwt"), { status: 401 });
});

test("verifyToken rejects an expired token", () => {
  const expired = jwt.sign(
    { id: "user-1", purpose: "access" },
    process.env.JWT_SECRET_KEY,
    { expiresIn: -10 },
  );

  assert.throws(() => verifyToken(expired), { status: 401 });
});

test("generateToken surfaces signing failures as a 500", () => {
  mock.method(jwt, "sign", () => {
    throw new Error("signing unavailable");
  });

  assert.throws(() => generateToken("user-1"), { status: 500 });
});
