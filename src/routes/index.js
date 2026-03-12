import express from "express";

import { verifyAccessToken } from "#middleware/validator.js";

// Parent router
const appRouter = express.Router();

// Health routes
appRouter.use("/health", async (req, res, next) => {
  const { healthRoutes } = await import("#modules/health/index.js");
  return healthRoutes(req, res, next);
});

// V1 router
const v1Router = express.Router();

appRouter.use("/api/v1", async (req, res, next) => {
  return v1Router(req, res, next);
});

// V1 routes
v1Router.use("/auth", async (req, res, next) => {
  const { authRoutes } = await import("#modules/auth/index.js");
  return authRoutes(req, res, next);
});

v1Router.use("/email", async (req, res, next) => {
  const { emailRoutes } = await import("#modules/email/index.js");
  return emailRoutes(req, res, next);
});

v1Router.use("/notifications", verifyAccessToken, async (req, res, next) => {
  const { notificationRoutes } = await import("#modules/notification/index.js");
  return notificationRoutes(req, res, next);
});

v1Router.use("/otp", async (req, res, next) => {
  const { otpRoutes } = await import("#modules/otp/index.js");
  return otpRoutes(req, res, next);
});

v1Router.use("/users", verifyAccessToken, async (req, res, next) => {
  const { userRoutes } = await import("#modules/user/index.js");
  return userRoutes(req, res, next);
});

export default appRouter;
