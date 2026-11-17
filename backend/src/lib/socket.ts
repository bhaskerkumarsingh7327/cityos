import type { Server as SocketIOServer } from "socket.io";
import { logger } from "@/utils/logger.js";

let ioInstance: SocketIOServer | null = null;

export function registerSocketServer(io: SocketIOServer): void {
  ioInstance = io;
  logger.info("Socket.IO server registered for real-time dispatch");
}

export function emitRealTimeEvent(eventName: string, data: unknown, room?: string): void {
  if (!ioInstance) {
    logger.debug(`Socket.IO not initialized; skipping emit for event: ${eventName}`);
    return;
  }

  if (room) {
    ioInstance.to(room).emit(eventName, data);
  } else {
    ioInstance.emit(eventName, data);
  }

  logger.debug(`Real-time event emitted: ${eventName}`, { room });
}
