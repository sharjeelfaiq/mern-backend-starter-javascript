import jwt from "jsonwebtoken";
import createError from "http-errors";

import { env } from "#config/env.config.js";
import { logger } from "#lib/logger.lib.js";

const { JWT_SECRET_KEY, JWT_SHORT_EXPIRY, JWT_LONG_EXPIRY } = env;

export const generateToken = (
  userId,
  isRemembered = false,
  purpose = "access",
) => {
  try {
    const expiry = isRemembered ? JWT_LONG_EXPIRY : JWT_SHORT_EXPIRY;
    return jwt.sign({ id: userId, purpose }, JWT_SECRET_KEY, {
      expiresIn: expiry,
    });
  } catch (error) {
    logger.error(`An error occurred while generating the token: ${error}.`);
    throw createError(500, "An error occurred while generating the token.");
  }
};

export const verifyToken = (token, purpose = "access") => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET_KEY);
    if (decoded.purpose !== purpose) throw new Error("Wrong token purpose");
    return decoded;
  } catch (error) {
    logger.error(`An error occurred while decoding the token: ${error}.`);
    throw createError(401, "An error occurred while decoding the token.");
  }
};
