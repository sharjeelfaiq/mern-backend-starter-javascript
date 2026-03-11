import appRouter from "#routes/index.js";
import { setupMiddleware } from "#middleware/index.js";
import { env } from "#config/env.config.js";
import { connectDatabase } from "#config/database.config.js";
import { logger } from "#config/logger.config.js";

const { PORT, BACKEND_URL } = env;

export const createBackendServer = async (server, app) => {
  await connectDatabase();

  setupMiddleware(app, appRouter);

  server.listen(PORT || 5000, () => {
    logger.info(`[connected] Backend (url: ${BACKEND_URL})`.server);
  });
};
