import { routeHandler } from "#lib/utils.lib.js";
import { emailServices } from "./email.services.js";

export const emailControllers = {
  checkVerificationToken: routeHandler(async (request, response) => {
    const requestQuery = request.query;
    const responseBody =
      await emailServices.checkVerificationToken(requestQuery);
    response.status(200).send(responseBody);
  }),

  sendVerificationToken: routeHandler(async (request, response) => {
    const requestBody = request.body;
    const responseBody = await emailServices.sendVerificationToken(requestBody);
    response.status(200).json(responseBody);
  }),
};
