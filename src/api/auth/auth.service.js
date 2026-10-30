import createError from "http-errors";
import bcrypt from "bcryptjs";

import { env } from "#config/env.config.js";
import { generateToken, verifyToken } from "#lib/token.lib.js";
import { sendEmail } from "#lib/email.lib.js";
import { userRepository } from "../user/user.repository.js";

const { BACKEND_URL, FRONTEND_URL } = env;

/**
 * @typedef {object} SignupInput
 * @property {string} firstName
 * @property {string} lastName
 * @property {string} email
 * @property {string} password
 * @property {string} [username]
 */

/**
 * @typedef {object} SigninInput
 * @property {string} [email]
 * @property {string} [username]
 * @property {string} password
 * @property {boolean} [isRemembered]
 */

export const authService = {
  /**
   * Registers a user and sends the email verification link. The user is
   * removed again if the token or the email cannot be produced.
   * @param {SignupInput} input
   * @returns {Promise<{ message: string }>}
   */
  signup: async ({ firstName, lastName, email, password, username }) => {
    const existingUser = await userRepository.findUserByEmail(email);
    if (existingUser)
      throw createError(400, "A user with this email already exists.");

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await userRepository.createUser(
      firstName,
      lastName,
      email,
      hashedPassword,
      username,
    );
    if (!newUser) throw createError(500, "Failed to create a new user.");

    const verificationToken = generateToken(
      newUser._id,
      false,
      "email-verification",
    );
    if (!verificationToken) {
      await userRepository.deleteUserById(newUser._id);
      throw createError(500, "An error occurred while generating the token.");
    }

    let isEmailSent;
    try {
      isEmailSent = await sendEmail("verification-email", {
        email,
        subject: "Verify Your Email Address",
        verificationToken,
        BACKEND_URL,
      });
    } catch (error) {
      await userRepository.deleteUserById(newUser._id);
      throw error;
    }
    if (!isEmailSent) {
      await userRepository.deleteUserById(newUser._id);
      throw createError(500, "Failed to send the welcome email.");
    }

    return {
      message:
        "User registered successfully. Please verify your email address.",
    };
  },

  /**
   * @param {SigninInput} input
   * @returns {Promise<{ message: string, token: string, data: { id: unknown, name: string } }>}
   */
  signin: async ({ email, username, password, isRemembered }) => {
    const existingUser = await userRepository.findUserByEmailOrUsername({
      email,
      username,
    });
    if (!existingUser) throw createError(401, "Invalid email or password.");

    const isValid = await bcrypt.compare(password, existingUser.password);
    if (!isValid) throw createError(401, "Invalid email or password.");

    const isEmailVerified = existingUser.isEmailVerified;
    if (!isEmailVerified)
      throw createError(403, "Please verify your email address to sign in.");

    const token = generateToken(existingUser._id, isRemembered);
    if (!token) throw createError(500, "Token generation failed");

    return {
      message: "Sign-in successful",
      token,
      data: {
        id: existingUser._id,
        name: `${existingUser.firstName} ${existingUser.lastName}`,
      },
    };
  },

  /**
   * @param {string | undefined} token Access token read from the cookie.
   * @returns {Promise<{ message: string }>}
   */
  signOut: async (token) => {
    if (!token) throw createError(400, "No token found");

    const decoded = verifyToken(token);

    if (!decoded)
      throw createError(401, "The provided token is invalid or expired.");

    return {
      message: "Sign-out successful.",
    };
  },

  /**
   * @param {{ email: string }} input
   * @returns {Promise<{ status: boolean, message: string }>}
   */
  forgotPassword: async ({ email }) => {
    const existingUser = await userRepository.findUserByEmail(email);
    if (!existingUser) throw createError(404, "User not found");

    const resetToken = generateToken(existingUser._id, false, "password-reset");
    if (!resetToken)
      throw createError(500, "Failed to generate password reset token.");

    const isEmailSent = await sendEmail("reset-password", {
      email,
      subject: "Password Reset Request",
      resetToken,
      FRONTEND_URL,
    });
    if (!isEmailSent)
      throw createError(
        500,
        "Failed to send the password reset email. Please try again later.",
      );

    return {
      status: true,
      message: "Password reset link sent to your email.",
    };
  },

  /**
   * @param {{ token: string, password: string }} input
   * @returns {Promise<{ status: boolean, message: string }>}
   */
  resetPassword: async ({ token, password }) => {
    const decoded = verifyToken(token, "password-reset");
    if (!decoded)
      throw createError(400, "The password reset token is invalid or expired.");

    const userId = decoded.id;
    const existingUser = await userRepository.findUserById(userId);
    if (!existingUser) throw createError(404, "User not found");

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const isUpdated = await userRepository.updateUserPasswordByEmail(
      existingUser.email,
      hashedPassword,
    );
    if (!isUpdated)
      throw createError(500, "Failed to reset the password. Please try again.");

    return {
      status: true,
      message: "Password has been reset successfully.",
    };
  },
};
