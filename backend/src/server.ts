import { createServer } from "node:http";
import { Server as SocketIOServer } from "socket.io";

import { createApp } from "@/app.js";
import { env } from "@/config/env.js";
import { logger } from "@/utils/logger.js";

const app = createApp();
const httpServer = createServer(app);

/**
 * Socket.IO is initialized here in Phase 1 so the transport exists from
 * the start, but no real-time event handlers are wired up until Phase 6.
 */
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: env.CORS_ORIGIN,
    credentials: true,
  },
});

io.on("connection", (socket) => {
  logger.debug("Socket connected", { socketId: socket.id });

  socket.on("disconnect", () => {
    logger.debug("Socket disconnected", { socketId: socket.id });
  });
});

httpServer.listen(env.BACKEND_PORT, () => {
  logger.info(`CityOS backend listening on port ${env.BACKEND_PORT}`, {
    env: env.NODE_ENV,
    apiBasePath: env.API_BASE_PATH,
  });
});

// Graceful shutdown
function shutdown(signal: string) {
  logger.info(`Received ${signal}, shutting down gracefully...`);
  httpServer.close(() => {
    logger.info("HTTP server closed.");
    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

export { io };