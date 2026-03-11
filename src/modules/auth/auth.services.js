import createError from "http-errors";

import { tokenUtils } from "#utils/token.utils.js";
import { passwordUtils } from "#utils/password.utils.js";
import { sendEmail } from "#utils/mail.utils.js";
import { repository } from "#repository/index.js";
import { env } from "#config/env.config.js";

const { write, read, update, remove } = repository;
const { BACKEND_URL } = env;

export const authServices = {
  signUp: async (requestBody) => {
    const { email, password, role } = requestBody;

    const existingEmail = await read.userByEmail(email);

    if (existingEmail) {
      throw createError(400, "A user with this email already exists.");
    }

    const hashedPassword = await passwordUtils.hash(password, { rounds: 12 });

    const registrationData = {
      email,
      password: hashedPassword,
      role,
    };

    const newUser = await write.user(registrationData);

    if (!newUser) {
      remove.user(newUser._id);

      throw createError(500, "Failed to create a new user.");
    }

    const verificationToken = tokenUtils.generate(
      { id: newUser._id },
      "verificationToken",
    );

    if (!verificationToken) {
      throw createError(500, "An error occurred while generating the token.");
    }

    if (!BACKEND_URL) {
      throw createError(500, "Backend URL is not defined.");
    }

    const sentEmail = await sendEmail("verification-email", {
      email,
      subject: "Welcome - Verify your email",
      BACKEND_URL,
      verificationToken,
    });

    if (!sentEmail) {
      throw createError(500, "Failed to send the welcome email.");
    }

    return {
      status: "success",
      message: "Signed up successfully. Please verify your email address.",
    };
  },

  signIn: async (requestBody) => {
    const { email, password } = requestBody;

    const user = await read.userByEmail(email);

    if (!user) {
      throw createError(401, "Invalid credentials.");
    }

    const userId = user._id;

    if (!user.isEmailVerified) {
      // Generate new verification token
      const verificationToken = tokenUtils.generate(
        { id: userId },
        "verificationToken",
      );

      if (!verificationToken) {
        throw createError(500, "An error occurred while generating the token.");
      }

      // Send verification email
      const sentEmail = await sendEmail("verification-email", {
        email,
        subject: "Welcome - Verify your email",
        verificationToken,
      });

      if (!sentEmail) {
        throw createError(500, "Failed to send the verification email.");
      }

      // Then throw error informing the user
      throw createError(
        403,
        "Email not verified. A new verification link has been sent to your inbox.",
      );
    }

    const isPasswordValid = await passwordUtils.compare(
      password,
      user.password,
    );

    if (!isPasswordValid) {
      throw createError(401, "Invalid credentials.");
    }

    const accessToken = tokenUtils.generate(
      { id: userId, role: user.role },
      "accessToken",
    );

    if (!accessToken) {
      throw createError(500, "Token generation failed.");
    }

    const data = {
      id: userId,
      role: user.role,
      accessToken,
    };

    return {
      status: "success",
      message: "Signed in successfully.",
      data,
    };
  },

  signOut: async (requestHeaders) => {
    const { authorization } = requestHeaders;

    const accessToken = authorization
      ? authorization.replace("Bearer ", "")
      : "";

    const existingBlacklistedToken = await read.blacklistedToken(accessToken);

    if (existingBlacklistedToken) {
      throw createError(400, "Token is already blacklisted.");
    }

    const decodedToken = tokenUtils.verify(accessToken);
    const { id } = decodedToken;

    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).getTime(); // 1-hour expiration

    const blacklistedTokenData = {
      accessToken,
      userId: id,
      expiresAt,
    };

    const blacklistedToken = await write.blacklistedToken(blacklistedTokenData);

    if (!blacklistedToken) {
      throw createError(
        500,
        "An error occurred while blacklisting the accessToken.",
      );
    }

    return {
      status: "success",
      message: "Signed out successfully.",
    };
  },

  requestPasswordReset: async (requestBody) => {
    const { email } = requestBody;

    const existingUser = await read.userByEmail(email);

    if (!existingUser) {
      throw createError(404, "User not found");
    }

    const resetToken = tokenUtils.generate(
      { id: existingUser._id },
      "passwordResetToken",
    );

    if (!resetToken) {
      throw createError(500, "Failed to generate reset token");
    }

    const sentEmail = await sendEmail("reset-password", {
      email,
      subject: "Reset your password",
      resetToken,
    });

    if (!sentEmail) {
      throw createError(500, "Failed to send reset password email");
    }

    return {
      status: "success",
      message: "Reset password email sent successfully.",
    };
  },

  updatePassword: async (requestBody) => {
    const { password, resetToken } = requestBody;

    const decodedToken = tokenUtils.verify(resetToken);

    const { id } = decodedToken;

    const existingUser = await read.userById(id);

    if (!existingUser) {
      throw createError(404, "User not found");
    }

    const hashedPassword = await passwordUtils.hash(password, { rounds: 12 });

    const isPasswordUpdated = await update.userById(id, {
      password: hashedPassword,
    });

    if (!isPasswordUpdated) {
      throw createError(500, "Password update failed");
    }

    return {
      status: "success",
      message: "Password updated successfully.",
    };
  },
};
