import cors from "cors";
import express, { type Application } from "express";
import helmet from "helmet";
import morgan from "morgan";

import { env } from "@/config/env.js";
import { errorHandler, notFoundHandler } from "@/middleware/errorHandler.js";
import { generalRateLimiter } from "@/middleware/rateLimiter.js";
import apiRouter from "@/routes/index.js";

/**
 * Builds and returns the configured Express application.
 * Kept separate from server.ts so it can be imported directly in tests
 * (Supertest) without binding a real port.
 */
export function createApp(): Application {
  const app = express();

  // --- Security & core middleware ---
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "5mb" }));
  app.use(express.urlencoded({ extended: true }));

  app.use(generalRateLimiter);

  // --- Logging ---
  app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

  // --- Routes ---
  app.use(env.API_BASE_PATH, apiRouter);

  // --- 404 + centralized error handling (must be last) ---
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}