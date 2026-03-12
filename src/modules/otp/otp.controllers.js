import { routeHandler } from "#lib/utils.lib.js";
import { otpServices } from "./otp.services.js";

export const otpControllers = {
  send: routeHandler(async (request, response) => {
    const requestBody = request.body;
    const responseBody = await otpServices.send(requestBody);
    response.status(200).json(responseBody);
  }),

  verify: routeHandler(async (request, response) => {
    const requestBody = request.body;
    const responseBody = await otpServices.verify(requestBody);
    response.status(200).json(responseBody);
  }),
};
