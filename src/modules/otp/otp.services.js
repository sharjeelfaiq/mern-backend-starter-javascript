import createError from "http-errors";
import bcrypt from "bcryptjs";

import { generateOTP } from "#lib/otp.lib.js";
import { sendEmail } from "#lib/mail.lib.js";
import { repository } from "#repository/index.js";

const { write, read } = repository;

export const otpServices = {
  send: async (requestBody) => {
    const { email } = requestBody;

    const existingUser = await read.userByEmail(email);
    if (!existingUser) {
      throw createError(404, "User not found.");
    }

    const { rawOTP, hashedOTP, expiresAt } = await generateOTP();

    const otpData = {
      otpHash: hashedOTP,
      id: existingUser._id,
      expiresAt,
    };

    const isOTPSaved = await write.otp(otpData);

    if (!isOTPSaved) {
      remove.otp(existingUser._id);

      throw createError(500, "Failed to save OTP.");
    }

    const sentEmail = await sendEmail("otp-email", {
      email,
      subject: "Here's your OTP",
      rawOTP,
    });

    if (!sentEmail) {
      throw createError(500, "Failed to send email.");
    }

    return {
      status: "success",
      message: "OTP sent successfully",
    };
  },

  verify: async (requestBody) => {
    const { email, otp } = requestBody;

    const existingUser = await read.userByEmail(email);
    if (!existingUser) {
      throw createError(404, "User not found.");
    }

    const existingOTPs = await read.otp(existingUser._id.toString());

    if (!existingOTPs || !existingOTPs.length) {
      throw createError(400, "Invalid OTP");
    }

    const comparisonResults = await Promise.all(
      existingOTPs.map((existingOTP) =>
        bcrypt.compare(otp, existingOTP.otpHash),
      ),
    );

    const isOTPValid = comparisonResults.some((result) => result === true);

    if (!isOTPValid) {
      throw createError(400, "Invalid OTP");
    }

    return {
      status: "success",
      message: "OTP verified successfully",
    };
  },
};
