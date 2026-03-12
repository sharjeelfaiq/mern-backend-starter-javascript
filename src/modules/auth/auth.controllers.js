import { routeHandler } from "#lib/utils.lib.js";
import { authServices } from "./auth.services.js";

export const authControllers = {
  signUp: routeHandler(async (request, response) => {
    const requestBody = request.body;
    const responseBody = await authServices.signUp(requestBody);
    response.status(201).json(responseBody);
  }),

  signIn: routeHandler(async (request, response) => {
    const requestBody = request.body;
    const responseBody = await authServices.signIn(requestBody);
    response.status(200).json(responseBody);
  }),

  signOut: routeHandler(async (request, response) => {
    const requestHeaders = request.headers;
    const responseBody = await authServices.signOut(requestHeaders);
    response.status(200).json(responseBody);
  }),

  requestPasswordReset: routeHandler(async (request, response) => {
    const requestBody = request.body;
    const responseBody = await authServices.requestPasswordReset(requestBody);
    response.status(200).json(responseBody);
  }),

  updatePassword: routeHandler(async (request, response) => {
    const requestBody = request.body;
    const responseBody = await authServices.updatePassword(requestBody);
    response.status(200).json(responseBody);
  }),
};
