import cors from "cors";
import helmet from "helmet";
import xss from "xss-clean";
import morgan from "morgan";
import express from "express";
import swaggerUi from "swagger-ui-express";
import compression from "compression";
import mongoSanitize from "express-mongo-sanitize";

import { logTheme } from "./colors.js";
import { corsOptions } from "./cors.js";
import { errorHandler } from "./error-handler.js";
import { apiRateLimiter } from "./rate-limiter.js";
import { invalidRouteHandler } from "./invalid-route-handler.js";
import { swaggerSpec } from "#config/swagger.config.js";

export const setupMiddleware = (app, appRouter) => {
  app.use(morgan("common")); // Log HTTP requests ✅ Always keep

  app.use(helmet()); // Set secure HTTP headers ✅ Always keep

  app.use(apiRateLimiter); // Apply rate limiting ⚠️ Only for public APIs

  app.use(xss()); // Prevent XSS attacks ⚠️ Only if rendering HTML with user input

  app.use(mongoSanitize()); // Prevent NoSQL injection ⚠️ Only if using MongoDB

  app.use(cors(corsOptions)); // Enable CORS ✅ Always keep

  app.use(express.json({ limit: "10mb" })); // Parse JSON requests ✅ Always keep

  app.use(express.urlencoded({ extended: true, limit: "10mb" })); // Parse URL-encoded requests ✅ Always keep

  app.use(compression()); // Compress responses ✅ Always keep

  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec)); // Serve API docs ⚠️ Only if API docs needed

  app.use(appRouter); // Register routes ✅ Always keep

  app.use(invalidRouteHandler); // Handle 404 errors ✅ Always keep

  app.use(errorHandler); // Handle server errors ✅ Always keep
};
