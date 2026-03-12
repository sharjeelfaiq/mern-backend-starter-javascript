import createError from "http-errors";
import bcrypt from "bcryptjs";

// --- Hashing ---
export const hash = async (password, options = {}) => {
  const { rounds = 12 } = options;

  if (!password) throw createError(400, "Password is required for hashing");
  if (Buffer.byteLength(password, "utf8") > 72)
    throw createError(400, "Password exceeds maximum length of 72 UTF-8 bytes");

  try {
    const salt = await bcrypt.genSalt(rounds);
    return await bcrypt.hash(password, salt);
  } catch (error) {
    throw createError(500, `Failed to hash password: ${error.message}`);
  }
};

// --- Comparison ---
export const compare = async (password, hash) => {
  if (!password) throw createError(400, "Password is required for comparison");
  if (!hash) throw createError(400, "Hash is required for comparison");

  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    throw createError(500, `Failed to compare password: ${error.message}`);
  }
};

// --- Salt Generation ---
export const genSaltSync = (rounds = 12) => {
  try {
    return bcrypt.genSaltSync(rounds);
  } catch (error) {
    throw createError(500, `Failed to generate salt: ${error.message}`);
  }
};

export const genSalt = async (rounds = 12) => {
  try {
    return await bcrypt.genSalt(rounds);
  } catch (error) {
    throw createError(500, `Failed to generate salt: ${error.message}`);
  }
};

// --- Hash Info ---
export const getHashInfo = (hash) => {
  if (!hash) throw createError(400, "Hash is required");

  try {
    const rounds = bcrypt.getRounds(hash);
    const salt = bcrypt.getSalt(hash);
    return { hash, rounds, salt };
  } catch (error) {
    throw createError(400, `Invalid hash format: ${error.message}`);
  }
};
