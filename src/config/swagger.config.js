import swaggerJSDoc from "swagger-jsdoc";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

import { env } from "#config/env.config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const { NODE_ENV, BACKEND_URL } = env;

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Backend API v1.0.0",
      version: "1.0.0",
      description:
        "Current runtime blocker: xss-clean and express-mongo-sanitize are incompatible with Express 5, so tested HTTP routes return 500. The operations below describe intended behavior after both issues are fixed.",
    },
    servers: [
      {
        url: BACKEND_URL,
        description:
          NODE_ENV === "production"
            ? "Production server"
            : "Development server",
      },
    ],
  },
  apis: [path.join(__dirname, "../../swagger/api.swagger.yaml")],
};

export const swaggerConfig = swaggerJSDoc(options);
