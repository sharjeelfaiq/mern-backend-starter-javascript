import { notificationRepository } from "./notification.repository.js";
import createError from "http-errors";

export const notificationService = {
  getNotificationsByUserId: async (requestParams) => {
    const { userId } = requestParams;

    const userNotifications = await notificationRepository.getByUserId(userId);

    if (!userNotifications) {
      throw createError(500, "Notification retrieval failed");
    }

    return {
      status: "success",
      message: "Notifications retrieved successfully",
      data: userNotifications,
    };
  },

  updateNotificationById: async (requestParams, userId) => {
    const { notiId } = requestParams;

    const updatedNotification = await notificationRepository.updateReadStatus({
      notificationId: notiId,
      userId,
      read: true,
    });

    if (!updatedNotification) {
      throw createError(404, "Notification not found");
    }

    return {
      status: "success",
      message: "Notification updated successfully",
      data: updatedNotification,
    };
  },
};
