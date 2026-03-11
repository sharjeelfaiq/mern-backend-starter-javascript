import { NotificationModel } from "#models/notification.model.js";

export const notificationRepository = {
  read: {
    notificationByUserId: (userId) => {
      return NotificationModel.find({ user: userId })
        .sort({ createdAt: -1 }) // Descending order = latest first
        .exec();
    },
  },

  write: {
    notification: (data) => {
      const { userId, message } = data;

      return NotificationModel.create({
        user: userId,
        message,
      });
    },
  },

  update: {
    notificationById: (data) => {
      const { notiId, readStatus } = data;

      return NotificationModel.findByIdAndUpdate(
        notiId,
        { $set: { read: readStatus } },
        { new: true, runValidators: true }, // returns the updated document
      ).exec();
    },
  },
};
