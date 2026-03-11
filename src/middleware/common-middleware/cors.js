import { env } from "#config/env.config.js";

const { FRONTEND_URL } = env;

export const corsOptions = {
  origin: FRONTEND_URL,
  credentials: true,
};
