import createError from "http-errors";
import bcrypt from "bcryptjs";

import { generateToken, verifyToken } from "#lib/token.lib.js";
import { sendEmail } from "#lib/email.lib.js";
import { userRepository } from "#repository/user.repository.js";

export const authService = {
  signup: async ({ firstName, lastName, email, password }) => {
    const existingUser = await userRepository.findUserByEmail(email);
    if (existingUser)
      throw createError(400, "A user with this email already exists.");

    const newUser = await userRepository.createUser(
      firstName,
      lastName,
      email,
      password,
    );
    if (!newUser) throw createError(500, "Failed to create a new user.");

    const verificationToken = generateToken(newUser._id);
    if (!verificationToken) {
      await userRepository.deleteUserById(newUser._id);
      throw createError(500, "An error occurred while generating the token.");
    }

    const isEmailSent = await sendEmail("verification-email", {
      email,
      subject: "Verify Your Email Address",
      verificationToken,
    });
    if (!isEmailSent) {
      await userRepository.deleteUserById(newUser._id);
      throw createError(500, "Failed to send the welcome email.");
    }

    return {
      message:
        "User registered successfully. Please verify your email address.",
    };
  },

  signin: async ({ email, password, isRemembered }) => {
    const existingUser = await userRepository.findUserByEmail(email);

    if (!existingUser) throw createError(401, "Invalid email or password.");

    const isValid = await existingUser.comparePassword(password);

    if (!isValid) throw createError(401, "Invalid email or password.");

    const token = generateToken(
      existingUser._id,
      existingUser.role,
      isRemembered,
    );

    if (!token) throw createError(500, "Token generation failed");

    return {
      message: "Sign-in successful",
      data: {
        id: existingUser._id,
        name: `${existingUser.firstName} ${existingUser.lastName}`,
        token,
      },
    };
  },

  signOut: async (token) => {
    const decoded = verifyToken(token);

    if (!decoded)
      throw createError(401, "The provided token is invalid or expired.");

    return {
      message: "Sign-out successful. The token has been invalidated.",
    };
  },

  resetPassword: async ({ email, newPassword }) => {
    const existingUser = await userRepository.findUserByEmail(email);

    if (!existingUser) throw createError(404, "User not found");

    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash(newPassword, salt);

    const isPasswordUpdated = await userRepository.updateUserById(
      existingUser._id,
      { password },
    );

    if (!isPasswordUpdated) throw createError(500, "Password update failed");

    return {
      status: true,
      message: "Password updated successfully.",
    };
  },
};
