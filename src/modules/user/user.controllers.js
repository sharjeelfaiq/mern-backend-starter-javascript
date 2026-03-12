import { routeHandler } from "#lib/utils.lib.js";
import { userServices } from "./user.services.js";

export const userControllers = {
  getUsers: routeHandler(async (_request, response) => {
    const responseBody = await userServices.getUsers();
    response.status(200).json(responseBody);
  }),

  getById: routeHandler(async (request, response) => {
    const requestParams = request.params;
    const responseBody = await userServices.getById(requestParams);
    response.status(200).json(responseBody);
  }),

  updateById: routeHandler(async (request, response) => {
    const requestParams = request.params;
    const requestFiles = request.files;
    const requestBody = request.body;
    const responseBody = await userServices.updateById(
      requestParams,
      requestFiles,
      requestBody,
    );
    response.status(200).json(responseBody);
  }),

  deleteById: routeHandler(async (request, response) => {
    const requestParams = request.params;
    const responseBody = await userServices.deleteById(requestParams);
    response.status(204).json(responseBody);
  }),
};
