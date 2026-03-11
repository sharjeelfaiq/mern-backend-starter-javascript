import { commonUtils } from "#utils/common.utils.js";
import { notificationServices } from "./notification.services.js";

const { routesAsyncHandler } = commonUtils;

export const notificationControllers = {
  getNotificationsByUserId: routesAsyncHandler(async (request, response) => {
    const requestParams = request.params;
    const responseBody =
      await notificationServices.getNotificationsByUserId(requestParams);
    response.status(200).json(responseBody);
  }),

  updateNotificationById: routesAsyncHandler(async (request, response) => {
    const requestParams = request.params;
    const responseBody =
      await notificationServices.updateNotificationById(requestParams);
    response.status(200).json(responseBody);
  }),
};
