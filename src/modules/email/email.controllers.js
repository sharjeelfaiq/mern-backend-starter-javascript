import { commonUtils } from "#utils/common.utils.js";
import { emailServices } from "./email.services.js";

const { routesAsyncHandler } = commonUtils;

export const emailControllers = {
  checkVerificationToken: routesAsyncHandler(async (request, response) => {
    const requestQuery = request.query;
    const responseBody =
      await emailServices.checkVerificationToken(requestQuery);
    response.status(200).send(responseBody);
  }),

  sendVerificationToken: routesAsyncHandler(async (request, response) => {
    const requestBody = request.body;
    const responseBody = await emailServices.sendVerificationToken(requestBody);
    response.status(200).json(responseBody);
  }),
};
