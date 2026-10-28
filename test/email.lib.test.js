import "./helpers/env.js";
import assert from "node:assert/strict";
import { afterEach, mock, test } from "node:test";
import nodemailer from "nodemailer";

import { sendEmail } from "#lib/email.lib.js";

// No test sender is installed in this file, so sendEmail runs for real up to the SMTP transport.
const sendMail = mock.fn(async () => ({ accepted: ["a@test.dev"] }));
mock.method(nodemailer, "createTransport", () => ({ sendMail }));

afterEach(() => sendMail.mock.resetCalls());

test("sendEmail rejects unsupported template types", async () => {
  await assert.rejects(
    sendEmail("nope", { email: "a@test.dev", subject: "s" }),
    { status: 400 },
  );
});

test("sendEmail requires a recipient and subject", async () => {
  await assert.rejects(sendEmail("otp-email", { subject: "s" }), {
    status: 400,
  });
  await assert.rejects(sendEmail("otp-email", { email: "a@test.dev" }), {
    status: 400,
  });
});

test("sendEmail renders the template with HTML-escaped variables", async () => {
  await sendEmail("otp-email", {
    email: "a@test.dev",
    subject: "Code",
    otpCode: "<b>123456</b>",
  });

  const message = sendMail.mock.calls[0].arguments[0];
  assert.equal(message.to, "a@test.dev");
  assert.equal(message.from, "sender@test.dev");
  assert.match(message.html, /&lt;b&gt;123456&lt;\/b&gt;/);
  assert.doesNotMatch(message.html, /<b>123456<\/b>/);
});

test("sendEmail maps transport failures to a 500", async () => {
  sendMail.mock.mockImplementationOnce(async () => {
    throw new Error("connection refused");
  });
  await assert.rejects(
    sendEmail("otp-email", {
      email: "a@test.dev",
      subject: "s",
      otpCode: "1",
    }),
    { status: 500, message: "Failed to send email." },
  );
});
