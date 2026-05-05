import createError from "http-errors";

import { verifyToken, generateToken } from "#lib/token.lib.js";
import { sendEmail } from "#lib/email.lib.js";
import { userRepository } from "#repository/user.repository.js";

const { read, update, remove } = userRepository;

export const emailService = {
  send: async ({ email }) => {
    const user = await read.userByEmail(email);
    if (!user) throw createError(404, "User not found");

    const verificationToken = generateToken(user._id);
    if (!verificationToken) {
      await remove.userById(user._id);
      throw createError(500, "An error occurred while generating the token.");
    }

    const isEmailSent = await sendEmail("verification-email", {
      email,
      subject: "Verify Your Email Address",
      verificationToken,
    });
    if (!isEmailSent) {
      await remove.userById(user._id);
      throw createError(500, "Failed to send the welcome email.");
    }

    return { message: "Verification email sent successfully" };
  },

  verify: async ({ verificationToken }) => {
    const decoded = verifyToken(verificationToken);
    if (!decoded) throw createError(400, "Invalid token");

    const id = decoded.id;
    if (!id) throw createError(400, "Token does not contain the user id");

    const isUserUpdated = await update.userById(id, {
      isEmailVerified: true,
    });
    if (!isUserUpdated)
      throw createError(500, "An error occurred while verifying the email");

    sendEmail("verification-success", {
      email: user.email,
      subject: "Email Verification Successful",
    });

    return { message: "Email verified successfully" };
  },
};
