import express from "express";

import { notificationController } from "./notification.controller.js";
import { requireOwner } from "#middlewares/auth.middleware.js";

export const notificationRoutes = express.Router();

notificationRoutes
  .get(
    "/:userId",
    requireOwner("userId"),
    notificationController.getNotificationsByUserId,
  )
  .patch("/:notiId", notificationController.updateNotificationById);
