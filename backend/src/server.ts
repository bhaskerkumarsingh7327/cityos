import { createServer } from "node:http";
import { Server as SocketIOServer } from "socket.io";
import { createApp } from "@/app.js";
import { env } from "@/config/env.js";
import { connectDatabase, disconnectDatabase, isDatabaseConnected } from "@/lib/db.js";
import { registerSocketServer } from "@/lib/socket.js";
import { logger } from "@/utils/logger.js";

const app = createApp();
const httpServer = createServer(app);

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: env.CORS_ORIGIN,
    credentials: true,
  },
});

registerSocketServer(io);

io.on("connection", (socket) => {
  logger.debug("Socket client connected", { socketId: socket.id });

  socket.on("join-room", (room: string) => {
    socket.join(room);
    logger.debug(`Socket joined room: ${room}`, { socketId: socket.id });
  });

  socket.on("disconnect", () => {
    logger.debug("Socket client disconnected", { socketId: socket.id });
  });
});

async function startServer() {
  try {
    // Attempt MongoDB connection (non-fatal in testing/mock environments)
    await connectDatabase().catch((err) => {
      logger.warn("Initial MongoDB connection attempt deferred", { error: err.message });
    });

    httpServer.listen(env.BACKEND_PORT, () => {
      logger.info(`CityOS Backend running on http://localhost:${env.BACKEND_PORT}`);
      logger.info(`REST API Base URL: http://localhost:${env.BACKEND_PORT}${env.API_BASE_PATH}`);
      logger.info(
        `MongoDB Database: ${isDatabaseConnected() ? "CONNECTED ✅" : "DISCONNECTED ❌"}`,
      );
    });
  } catch (error) {
    logger.error("Failed to start server", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    process.exit(1);
  }
}

// Graceful shutdown
async function shutdown(signal: string) {
  logger.info(`Received ${signal}, shutting down gracefully...`);
  httpServer.close(async () => {
    await disconnectDatabase().catch(() => {});
    logger.info("HTTP server and database connections closed.");
    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

startServer();

export { io };
