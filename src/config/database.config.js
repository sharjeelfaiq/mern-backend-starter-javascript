import mongoose from "mongoose";

import { logger } from "./logger.config.js";
import { globalUtils } from "#utils/index.js";
import { DATABASE_URI } from "#constants/index.js";

let isConnected = false;

const { asyncHandler } = globalUtils;

export const connectDatabase = asyncHandler(async () => {
  if (isConnected) {
    logger.warn("Using existing Database connection".warning);
    return;
  }

  const connection = await mongoose.connect(DATABASE_URI, {
    serverSelectionTimeoutMS: 5000,
  });

  isConnected = !!connection.connections[0].readyState;
  logger.info(`[connected] Database (url: ${DATABASE_URI})`.database);

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
      `[connection_failed] Database (error: ${error.message})`.error
    );

    process.exit(1);
  });
});
