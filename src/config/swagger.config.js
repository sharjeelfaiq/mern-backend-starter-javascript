import swaggerJSDoc from "swagger-jsdoc";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

import { env } from "#config/env.config.js";

const { BACKEND_URL } = env;

const __dirname = dirname(fileURLToPath(import.meta.url));

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Title",
      version: "1.0.0",
      description: "RESTful API",
    },
    servers: [
      {
        url: BACKEND_URL,
        description: "RESTful API",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  // Paths to API docs are in their dedicated folders, like auth docs in swagger/auth/*.yaml
  apis: [join(__dirname, "../docs/swagger/*.yaml")],
};

export const swaggerSpec = swaggerJSDoc(swaggerOptions);
