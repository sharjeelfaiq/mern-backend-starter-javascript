import createError from "http-errors";

import { generateToken, verifyToken } from "#lib/token.lib.js";
import { sendEmail } from "#lib/mail.lib.js";
import { repository } from "#repository/index.js";
import { env } from "#config/env.config.js";

const { read, update, remove } = repository;
const { FRONTEND_URL } = env;

export const emailServices = {
  checkVerificationToken: async (requestQuery) => {
    const { verificationToken } = requestQuery;

    if (!verificationToken || typeof verificationToken !== "string") {
      throw createError(
        400,
        "Verification token is required and must be a string",
      );
    }

    const decodedToken = verifyToken(verificationToken);

    const { id } = decodedToken;

    if (!id) {
      throw createError(400, "Token does not contain the user id");
    }

    const isUserUpdated = await update.userById(id, {
      isEmailVerified: true,
    });

    if (!isUserUpdated) {
      throw createError(500, "An error occurred while verifying the email");
    }

    if (!FRONTEND_URL) {
      throw createError(500, "Frontend URL is not defined");
    }

    const sentEmail = await sendEmail("verification-notification", {
      FRONTEND_URL,
    });

    if (!sentEmail) {
      throw createError(500, "Failed to send the verification email.");
    }

    return sentEmail;
  },

  sendVerificationToken: async (requestBody) => {
    const { email } = requestBody;

    const user = await read.userByEmail(email);

    if (!user) {
      throw createError(404, "User not found");
    }

    const verificationToken = generateToken(
      { id: user._id },
      "verificationToken",
    );

    if (!verificationToken) {
      await remove.userById(user._id.toString());
      throw createError(500, "An error occurred while generating the token.");
    }

    const sentEmail = await sendEmail("verification-email", {
      email,
      subject: "Welcome - Verify your email",
      verificationToken,
    });

    if (!sentEmail) {
      await remove.userById(user._id.toString());
      throw createError(500, "Failed to send the welcome email.");
    }

    return {
      status: "success",
      message: "Verification email sent successfully",
    };
  },
};
