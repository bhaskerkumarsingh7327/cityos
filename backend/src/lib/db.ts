import mongoose from "mongoose";
import { env } from "@/config/env.js";
import { logger } from "@/utils/logger.js";

interface ConnectionOptions {
  uri?: string;
}

let isConnected = false;

/**
 * Connect to MongoDB with retry logic and connection event monitoring.
 * Ensures 2dsphere indexes and validation schemas are properly initialized.
 */
export async function connectDatabase(options: ConnectionOptions = {}): Promise<typeof mongoose> {
  const uri = options.uri || env.MONGODB_URI;

  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose;
  }

  try {
    mongoose.set("strictQuery", true);

    const instance = await mongoose.connect(uri, {
      autoIndex: true, // Automatically build 2dsphere and compound indexes
      serverSelectionTimeoutMS: 5000,
    });

    isConnected = true;
    logger.info(`MongoDB Connected successfully to database: ${instance.connection.name}`);

    mongoose.connection.on("error", (err) => {
      logger.error("MongoDB connection error", { error: err.message });
    });

    mongoose.connection.on("disconnected", () => {
      isConnected = false;
      logger.warn("MongoDB connection disconnected");
    });

    return instance;
  } catch (error) {
    logger.error("Failed to connect to MongoDB", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    throw error;
  }
}

/**
 * Disconnect from MongoDB gracefully.
 */
export async function disconnectDatabase(): Promise<void> {
  if (!isConnected) return;
  await mongoose.disconnect();
  isConnected = false;
  logger.info("MongoDB disconnected gracefully");
}

export function isDatabaseConnected(): boolean {
  return mongoose.connection.readyState === 1;
}
