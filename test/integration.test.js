import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { MongoMemoryServer } from "mongodb-memory-server";

let mongo;
let server;
let base;
let UserModel;
let NotificationModel;
let OtpModel;
let setTestEmailSender;
let generateToken;
let sent = [];

before(async () => {
  mongo = await MongoMemoryServer.create();
  Object.assign(process.env, {
    NODE_ENV: "test",
    DATABASE_URI: mongo.getUri(),
    FRONTEND_URL: "http://localhost:3000",
    BACKEND_URL: "http://localhost:8000",
    JWT_SECRET_KEY: "integration-test-secret",
    JWT_SHORT_EXPIRY: "15m",
    JWT_LONG_EXPIRY: "7d",
    COOKIE_NAME: "access_token",
    COOKIE_HTTP_ONLY: "true",
    COOKIE_SAME_SITE: "lax",
    COOKIE_PATH: "/",
    COOKIE_SHORT_EXPIRY: "900000",
    COOKIE_LONG_EXPIRY: "604800000",
    EMAIL_HOST: "localhost",
    EMAIL_SERVICE: "test",
    EMAIL_PORT: "587",
    USER_EMAIL: "test@example.com",
    USER_PASSWORD: "test-password",
    CLOUDINARY_CLOUD_NAME: "test",
    CLOUDINARY_API_KEY: "test",
    CLOUDINARY_API_SECRET: "test",
  });
  const [
    { app, httpServer },
    { router },
    { applyGlobalMiddleware },
    email,
    token,
    user,
    notification,
    otp,
  ] = await Promise.all([
    import("../src/server/app.js"),
    import("../src/api/index.js"),
    import("../src/middlewares/global.middleware.js"),
    import("../src/lib/email.lib.js"),
    import("../src/lib/token.lib.js"),
    import("../src/api/user/user.model.js"),
    import("../src/api/notification/notification.model.js"),
    import("../src/api/otp/otp.model.js"),
  ]);
  UserModel = user.UserModel;
  NotificationModel = notification.NotificationModel;
  OtpModel = otp.OtpModel;
  setTestEmailSender = email.setTestEmailSender;
  generateToken = token.generateToken;
  setTestEmailSender(async (type, options) => {
    sent.push({ type, options });
    return true;
  });
  await mongoose.connect(mongo.getUri());
  applyGlobalMiddleware(app, router);
  await new Promise((resolve) => httpServer.listen(0, "127.0.0.1", resolve));
  server = httpServer;
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server?.listening) await new Promise((resolve) => server.close(resolve));
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});

const request = async (path, { method = "GET", body, cookie } = {}) => {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: {
      ...(body ? { "content-type": "application/json" } : {}),
      ...(cookie ? { cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  return {
    status: response.status,
    body:
      text && response.headers.get("content-type")?.includes("application/json")
        ? JSON.parse(text)
        : text,
    cookie: response.headers.get("set-cookie"),
  };
};

const makeUser = async (email) =>
  UserModel.create({
    firstName: "Test",
    lastName: "Person",
    email,
    password: await bcrypt.hash("password123", 4),
    isEmailVerified: true,
  });

const authCookie = (user) => `access_token=${generateToken(user._id)}`;

test("HTTP smoke, global validation, and access cookies", async (t) => {
  await t.test("health and docs", async () => {
    assert.equal((await request("/health")).status, 200);
    assert.equal((await request("/health/details")).status, 401);
    assert.equal((await request("/api-docs/")).status, 200);
    assert.equal((await request("/health?%24where=x")).status, 400);
    assert.equal(
      (
        await request("/api/v1/auth/forgot-password", {
          method: "POST",
          body: { email: "<script>alert(1)</script>" },
        })
      ).status,
      400,
    );
  });
  const user = await makeUser("auth@example.com");
  await t.test("cookie lifetime and invalid credentials", async () => {
    assert.equal(
      (
        await request(`/api/v1/users/${user.id}`, {
          cookie: "access_token=invalid",
        })
      ).status,
      401,
    );
    for (const [remember, seconds] of [
      [false, 900],
      [true, 604800],
    ]) {
      const result = await request("/api/v1/auth/signin", {
        method: "POST",
        body: {
          email: user.email,
          password: "password123",
          isRemembered: remember,
        },
      });
      assert.equal(result.status, 200);
      assert.match(result.cookie, new RegExp(`Max-Age=${seconds}`));
      assert.equal(
        (
          await request("/health/details", {
            cookie: result.cookie.split(";")[0],
          })
        ).status,
        200,
      );
    }
  });
  await t.test(
    "ownership, editable fields, and public response hashes",
    async () => {
      const other = await makeUser("other@example.com");
      const notification = await NotificationModel.create({
        user: other._id,
        message: "private",
      });
      const cookie = authCookie(user);
      assert.equal(
        (
          await request(`/api/v1/users/${other.id}`, {
            method: "PATCH",
            body: { firstName: "Changed" },
            cookie,
          })
        ).status,
        403,
      );
      assert.equal(
        (
          await request(`/api/v1/users/${user.id}`, {
            method: "PATCH",
            body: { password: "plaintext", isEmailVerified: false },
            cookie,
          })
        ).status,
        400,
      );
      const updated = await request(`/api/v1/users/${user.id}`, {
        method: "PATCH",
        body: { firstName: "Updated" },
        cookie,
      });
      assert.equal(updated.status, 200);
      assert.equal(updated.body.data.firstName, "Updated");
      for (const path of ["/api/v1/users", `/api/v1/users/${user.id}`]) {
        const result = await request(path, { cookie });
        assert.equal(result.status, 200);
        assert.doesNotMatch(JSON.stringify(result.body), /password/);
      }
      assert.equal(
        (await request(`/api/v1/notifications/${other.id}`, { cookie })).status,
        403,
      );
      const ownerList = await request(`/api/v1/notifications/${other.id}`, {
        cookie: authCookie(other),
      });
      assert.equal(ownerList.status, 200);
      assert.equal(ownerList.body.data.length, 1);
      assert.equal(
        (
          await request(`/api/v1/notifications/${notification.id}`, {
            method: "PATCH",
            cookie,
          })
        ).status,
        404,
      );
      assert.equal(
        (
          await request(`/api/v1/notifications/${notification.id}`, {
            method: "PATCH",
            cookie: authCookie(other),
          })
        ).status,
        200,
      );
    },
  );
});

test("recovery tokens, OTP consumption, and delivery cleanup", async (t) => {
  const user = await makeUser("recovery@example.com");
  await t.test("JWT purposes and expiry", async () => {
    assert.equal(
      (
        await request("/api/v1/auth/forgot-password", {
          method: "POST",
          body: { email: user.email },
        })
      ).status,
      200,
    );
    const reset = sent.at(-1).options.resetToken;
    assert.equal(
      (await request("/health/details", { cookie: `access_token=${reset}` }))
        .status,
      401,
    );
    for (const token of [
      "invalid",
      authCookie(user).split("=")[1],
      generateToken(user._id, false, "email-verification"),
    ]) {
      assert.notEqual(
        (
          await request("/api/v1/auth/reset-password", {
            method: "PATCH",
            body: { token, password: "newpassword" },
          })
        ).status,
        200,
      );
    }
    const jwt = (await import("jsonwebtoken")).default;
    const expired = jwt.sign(
      { id: user.id, purpose: "password-reset" },
      process.env.JWT_SECRET_KEY,
      { expiresIn: -1 },
    );
    assert.notEqual(
      (
        await request("/api/v1/auth/reset-password", {
          method: "PATCH",
          body: { token: expired, password: "newpassword" },
        })
      ).status,
      200,
    );
    assert.equal(
      (
        await request("/api/v1/auth/reset-password", {
          method: "PATCH",
          body: { token: reset, password: "newpassword" },
        })
      ).status,
      200,
    );
    const signup = await request("/api/v1/auth/signup", {
      method: "POST",
      body: {
        firstName: "Fresh",
        lastName: "Person",
        email: "fresh@example.com",
        password: "password123",
      },
    });
    assert.equal(signup.status, 201);
    const verification = sent.at(-1).options.verificationToken;
    assert.equal(
      (await request(`/api/v1/email/verify-email/${generateToken(user._id)}`))
        .status,
      401,
    );
    assert.equal(
      (await request(`/api/v1/email/verify-email/${verification}`)).status,
      200,
    );
  });
  await t.test(
    "OTP expires and is consumed once under concurrency",
    async () => {
      const hash = await bcrypt.hash("123456", 4);
      await OtpModel.create({
        userId: user._id,
        otpHash: hash,
        expiresAt: new Date(Date.now() - 1000),
      });
      assert.equal(
        (
          await request("/api/v1/otp/verify", {
            method: "POST",
            body: { email: user.email, otp: "123456" },
          })
        ).status,
        400,
      );
      await OtpModel.create({
        userId: user._id,
        otpHash: hash,
        expiresAt: new Date(Date.now() + 60000),
      });
      const results = await Promise.all(
        Array.from({ length: 2 }, () =>
          request("/api/v1/otp/verify", {
            method: "POST",
            body: { email: user.email, otp: "123456" },
          }),
        ),
      );
      assert.deepEqual(results.map((item) => item.status).sort(), [200, 400]);
      assert.equal(
        (
          await request("/api/v1/otp/verify", {
            method: "POST",
            body: { email: user.email, otp: "123456" },
          })
        ).status,
        400,
      );
    },
  );
  await t.test("failed email leaves no signup user or OTP", async () => {
    setTestEmailSender(async () => {
      throw new Error("delivery failed");
    });
    try {
      assert.equal(
        (
          await request("/api/v1/auth/signup", {
            method: "POST",
            body: {
              firstName: "Test",
              lastName: "Person",
              email: "failed@example.com",
              password: "password123",
            },
          })
        ).status,
        500,
      );
      assert.equal(
        await UserModel.countDocuments({ email: "failed@example.com" }),
        0,
      );
      assert.equal(
        (
          await request("/api/v1/otp/send", {
            method: "POST",
            body: { email: user.email },
          })
        ).status,
        500,
      );
      assert.equal(
        await OtpModel.countDocuments({
          userId: user._id,
          expiresAt: { $gt: new Date() },
        }),
        0,
      );
    } finally {
      setTestEmailSender(async (type, options) => {
        sent.push({ type, options });
        return true;
      });
    }
  });
});
