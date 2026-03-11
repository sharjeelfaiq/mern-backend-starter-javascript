import { commonUtils } from "#utils/common.utils.js";
import { authServices } from "./auth.services.js";

const { routesAsyncHandler } = commonUtils;

export const authControllers = {
  signUp: routesAsyncHandler(async (request, response) => {
    const requestBody = request.body;
    const responseBody = await authServices.signUp(requestBody);
    response.status(201).json(responseBody);
  }),

  signIn: routesAsyncHandler(async (request, response) => {
    const requestBody = request.body;
    const responseBody = await authServices.signIn(requestBody);
    response.status(200).json(responseBody);
  }),

  signOut: routesAsyncHandler(async (request, response) => {
    const requestHeaders = request.headers;
    const responseBody = await authServices.signOut(requestHeaders);
    response.status(200).json(responseBody);
  }),

  requestPasswordReset: routesAsyncHandler(async (request, response) => {
    const requestBody = request.body;
    const responseBody = await authServices.requestPasswordReset(requestBody);
    response.status(200).json(responseBody);
  }),

  updatePassword: routesAsyncHandler(async (request, response) => {
    const requestBody = request.body;
    const responseBody = await authServices.updatePassword(requestBody);
    response.status(200).json(responseBody);
  }),
};
