import winston from "winston";

import { isProdEnv } from "#constants/index.js";

const createLogger = () => {
  const levels = { error: 0, warn: 1, info: 2, debug: 3 };
  const colors = { error: "red", warn: "yellow", info: "green", debug: "blue" };

  winston.addColors(colors);

  return winston.createLogger({
    levels,
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
          winston.format.printf(
            ({ level, message, timestamp }) =>
              `${timestamp} [${level}]: ${message}`,
          ),
        ),
        level: isProdEnv ? "warn" : "debug",
        handleExceptions: true,
      }),
    ],
    exitOnError: false,
  });
};

export const logger = createLogger();
