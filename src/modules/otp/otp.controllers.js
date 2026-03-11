import { commonUtils } from "#utils/common.utils.js";
import { otpServices } from "./otp.services.js";

const { routesAsyncHandler } = commonUtils;

export const otpControllers = {
  send: routesAsyncHandler(async (request, response) => {
    const requestBody = request.body;
    const responseBody = await otpServices.send(requestBody);
    response.status(200).json(responseBody);
  }),

  verify: routesAsyncHandler(async (request, response) => {
    const requestBody = request.body;
    const responseBody = await otpServices.verify(requestBody);
    response.status(200).json(responseBody);
  }),
};
