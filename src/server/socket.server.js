import { Server as SocketIOServer } from "socket.io";

import { logger } from "#config/logger.config.js";
import { env } from "#config/env.config.js";
import { httpServer } from "./app.js";

const { FRONTEND_URL } = env;

const createSocketServer = (httpServer) => {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: FRONTEND_URL,
    },
  });

  io.on("connection", (socket) => {
    logger.info(`[connected] Socket (socket id: ${socket.id})`.socket);

    socket.on("connect_error", (error) => {
      logger.error(
        `[connection_failed] Socket (error: ${error.message})`.error,
      );
    });

    socket.on("error", (error) => {
      logger.error(`[runtime_error] Socket (error: ${error.message})`.error);
    });

    socket.on("disconnect", (reason) => {
      logger.info(`[disconnected] Socket (reason: ${reason})`.socket);
    });
  });

  return io;
};

export const io = createSocketServer(httpServer);
