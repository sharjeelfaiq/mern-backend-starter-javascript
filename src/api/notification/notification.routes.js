import express from "express";

import { notificationControllers } from "./notification.controllers.js";

export const notificationRoutes = express.Router();

notificationRoutes
  .get("/:userId", notificationControllers.getNotificationsByUserId)
  .patch("/:notiId", notificationControllers.updateNotificationById);
