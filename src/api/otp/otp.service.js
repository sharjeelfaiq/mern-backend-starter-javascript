import createError from "http-errors";
import bcrypt from "bcryptjs";

import { generateOtp } from "#lib/otp.lib.js";
import { sendEmail } from "#lib/email.lib.js";
import { otpRepository } from "./otp.repository.js";
import { userRepository } from "../user/user.repository.js";

export const otpService = {
  send: async ({ email }) => {
    const existingUser = await userRepository.findUserByEmail(email);
    if (!existingUser)
      throw createError(400, "A user with this email does not exist.");

    const { rawOtp, hashedOtp, expiresAt } = await generateOtp();

    const isOtpCreated = await otpRepository.createOtp({
      otpHash: hashedOtp,
      userId: existingUser._id,
      expiresAt,
    });

    if (!isOtpCreated) throw new Error("Failed to create OTP.");

    let delivered;
    try {
      delivered = await sendEmail("otp-email", {
        email,
        subject: "Password Reset Code",
        otpCode: rawOtp,
      });
    } catch (error) {
      await otpRepository.deleteOtp(isOtpCreated._id);
      throw error;
    }
    if (!delivered) {
      await otpRepository.deleteOtp(isOtpCreated._id);
      throw createError(500, "Failed to send OTP email");
    }

    return { success: true, message: "Password reset code sent successfully" };
  },

  verify: async ({ email, otp: receivedOtp }) => {
    const existingUser = await userRepository.findUserByEmail(email);
    if (!existingUser)
      throw createError(400, "A user with this email does not exist.");

    const existingOtps = await otpRepository.findOtpByUserId(existingUser._id);

    if (!existingOtps || !existingOtps.length)
      throw createError(400, "Invalid OTP");

    for (const existingOtp of existingOtps) {
      if (existingOtp.expiresAt <= new Date()) continue;
      if (await bcrypt.compare(receivedOtp, existingOtp.otpHash)) {
        const consumed = await otpRepository.consumeOtp(
          existingOtp._id,
          existingUser._id,
        );
        if (consumed) return { success: true, message: "OTP Verified" };
      }
    }
    throw createError(400, "Invalid OTP");
  },
};
