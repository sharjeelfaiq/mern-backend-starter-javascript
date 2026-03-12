import { routeHandler } from "#lib/utils.lib.js";
import { healthServices } from "./health.services.js";

export const healthControllers = {
  checkHealth: routeHandler(async (_request, response) => {
    const responseBody = await healthServices.checkHealth();
    response.status(200).json(responseBody);
  }),

  checkDetailedHealth: routeHandler(async (_request, response) => {
    const responseBody = await healthServices.checkDetailedHealth();
    response.status(200).json(responseBody);
  }),
};
