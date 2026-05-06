import express from "express";

import { healthControllers } from "./health.controllers.js";
import { verifyAccessToken } from "#middleware/auth.middleware.js";

export const healthRoutes = express.Router();

healthRoutes
  .get("/", healthControllers.checkHealth)
  .get("/details", verifyAccessToken, healthControllers.checkDetailedHealth);
