import createError from "http-errors";

import { tokenUtils, sendEmail } from "#utils/index.js";
import { dataAccess } from "#data-access/index.js";
import { FRONTEND_URL } from "#constants/index.js";

const { read, update, remove } = dataAccess;

export const emailServices = {
  checkVerificationToken: async (requestQuery) => {
    const { verificationToken } = requestQuery;

    if (!verificationToken || typeof verificationToken !== "string") {
      throw createError(
        400,
        "Verification token is required and must be a string"
      );
    }

    const decodedToken = tokenUtils.verify(verificationToken);

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

    const verificationToken = tokenUtils.generate(
      { id: user._id },
      "verificationToken"
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
      success: true,
      message: "Verification email sent successfully",
    };
  },
};
