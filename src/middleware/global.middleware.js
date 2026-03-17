import morgan from "morgan";
import cors from "cors";
import express from "express";
import swaggerUi from "swagger-ui-express";
import cookieParser from "cookie-parser";

import { env } from "#config/env.config.js";
import { logger } from "#lib/logger.lib.js";
import { swaggerConfig } from "#config/swagger.config.js";

const { NODE_ENV } = env;

const corsOptions = {
  origin: true,
  credentials: true,
};

// eslint-disable-next-line no-unused-vars
const errorHandler = async (err, _, res, __) => {
  const is_development = NODE_ENV === "development";

  const errorResponse = {
    status: err.statusCode || 500,
    message: err.message || "Something went wrong",
    stack: is_development ? err.stack : "No stack trace available",
  };

  logger.error(JSON.stringify(errorResponse, null, 2));
  res.status(errorResponse.status).json(errorResponse);
};

const invalidPromiseHandler = (req, res) => {
  res.status(404).json({ message: "Endpoint not found" });
};

const applyGlobalMiddleware = (app, router) => {
  app.use(morgan("dev"));
  app.use(cors(corsOptions));
  app.use(cookieParser());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerConfig));
  app.use(router);
  app.use(invalidPromiseHandler);
  app.use(errorHandler);
};

export { applyGlobalMiddleware };
