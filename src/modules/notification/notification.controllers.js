import { routeHandler } from "#lib/utils.lib.js";
import { notificationServices } from "./notification.services.js";

export const notificationControllers = {
  getNotificationsByUserId: routeHandler(async (request, response) => {
    const requestParams = request.params;
    const responseBody =
      await notificationServices.getNotificationsByUserId(requestParams);
    response.status(200).json(responseBody);
  }),

  updateNotificationById: routeHandler(async (request, response) => {
    const requestParams = request.params;
    const responseBody =
      await notificationServices.updateNotificationById(requestParams);
    response.status(200).json(responseBody);
  }),
};
