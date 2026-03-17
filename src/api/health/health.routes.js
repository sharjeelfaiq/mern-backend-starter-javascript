import express from "express";

import { healthControllers } from "./health.controllers.js";
import { verifyAccessToken } from "#middleware/validator.js";

export const healthRoutes = express.Router();

healthRoutes
  .get("/public", healthControllers.checkHealth)
  .get("/private", verifyAccessToken, healthControllers.checkDetailedHealth);
