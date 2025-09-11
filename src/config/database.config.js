import mongoose from "mongoose";

import { logger } from "./logger.config.js";
import { commonUtils } from "#utils/index.js";
import { env } from "./env.config.js";

let isConnected = false;

const { asyncHandler } = commonUtils;

const { DATABASE_URI, DATABASE_NAME } = env;

const DB_CONNECTION_STRING = `${DATABASE_URI}/${DATABASE_NAME}`;

export const connectDatabase = asyncHandler(async () => {
  if (isConnected) {
    logger.warn("Using existing Database connection".warning);
    return;
  }

  const connection = await mongoose.connect(DB_CONNECTION_STRING, {
    serverSelectionTimeoutMS: 5000,
  });

  isConnected = !!connection.connections[0].readyState;
  logger.info(`[connected] Database (url: ${DB_CONNECTION_STRING})`.database);

  const db = mongoose.connection;

  db.on("disconnected", () => {
    logger.info("[disconnected] Database".error);

    isConnected = false;
  });

  process.on("SIGINT", async () => {
    await db.close();

    logger.info("[connection_closed] Database".info);

    process.exit(0);
  });

  db.on("error", (error) => {
    logger.error(
      `[connection_failed] Database (error: ${error.message})`.error,
    );

    process.exit(1);
  });
});
