import morgan from "morgan";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import compression from "compression";
import { rateLimit } from "express-rate-limit";
import swaggerUi from "swagger-ui-express";
import cookieParser from "cookie-parser";
import createError from "http-errors";

import { env } from "#config/env.config.js";
import { logger } from "#lib/logger.lib.js";
import { reportError } from "#lib/errorReporter.lib.js";
import { getMetrics, requestMetrics } from "#lib/metrics.lib.js";
import { swaggerConfig } from "#config/swagger.config.js";

const { NODE_ENV } = env;

const corsOptions = {
  origin: true,
  credentials: true,
};

const serializeError = (err, nodeEnv = NODE_ENV) => {
  const errorResponse = {
    status: err.statusCode || 500,
    message: err.message || "Something went wrong",
  };

  if (nodeEnv !== "production") {
    errorResponse.stack = err.stack;
  }

  return errorResponse;
};

// eslint-disable-next-line no-unused-vars
const errorHandler = async (err, req, res, __) => {
  const errorResponse = serializeError(err);

  logger.error(JSON.stringify(errorResponse, null, 2));
  if (errorResponse.status >= 500) {
    await reportError(err, {
      status: errorResponse.status,
      method: req.method,
      path: req.originalUrl,
    });
  }
  res.status(errorResponse.status).json(errorResponse);
};

const invalidPromiseHandler = (req, res) => {
  res.status(404).json({ message: "Endpoint not found" });
};

// Express 5 exposes req.query as a getter. Validate in place instead of
// assigning to it (as the legacy sanitizers do).
const rejectUnsafeKeys = (value) => {
  if (typeof value === "string" && /<[^>]*>/.test(value)) {
    throw createError(400, "HTML markup is not allowed in request data");
  }
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    if (
      key.startsWith("$") ||
      key.includes(".") ||
      ["__proto__", "constructor", "prototype"].includes(key)
    ) {
      throw createError(400, "Unsafe request field name");
    }
    rejectUnsafeKeys(child);
  }
};

const validateRequestData = (req, _res, next) => {
  rejectUnsafeKeys(req.body);
  rejectUnsafeKeys(req.query);
  rejectUnsafeKeys(req.params);
  next();
};

const applyGlobalMiddleware = (app, router) => {
  app.use(requestMetrics);
  app.use(morgan("dev"));
  app.use(cors(corsOptions));
  app.use(cookieParser());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(helmet());
  app.use(compression());
  app.use(validateRequestData);
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
    }),
  );
  app.get("/metrics", getMetrics);
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerConfig));
  app.use(router);
  app.use(invalidPromiseHandler);
  app.use(errorHandler);
};

export { applyGlobalMiddleware, serializeError };
