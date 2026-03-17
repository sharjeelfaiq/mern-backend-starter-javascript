import { handlePromise } from "#lib/promise.lib.js";
import { notificationServices } from "./notification.services.js";

export const notificationControllers = {
  getNotificationsByUserId: handlePromise(async (request, response) => {
    const requestParams = request.params;
    const responseBody =
      await notificationServices.getNotificationsByUserId(requestParams);
    response.status(200).json(responseBody);
  }),

  updateNotificationById: handlePromise(async (request, response) => {
    const requestParams = request.params;
    const responseBody =
      await notificationServices.updateNotificationById(requestParams);
    response.status(200).json(responseBody);
  }),
};
