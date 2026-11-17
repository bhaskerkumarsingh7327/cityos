import { Router } from "express";
import { isDatabaseConnected } from "@/lib/db.js";
import { sendSuccess } from "@/utils/apiResponse.js";
import { asyncHandler } from "@/utils/asyncHandler.js";

const router = Router();

/**
 * GET /api/v1/health
 * Production health check endpoint reporting service, database, and process metrics.
 */
router.get(
  "/",
  asyncHandler(async (_req, res) => {
    sendSuccess(res, {
      status: "ok",
      service: "cityos-backend",
      version: "0.1.0",
      database: isDatabaseConnected() ? "connected" : "disconnected",
      timestamp: new Date().toISOString(),
      uptimeSeconds: process.uptime(),
    });
  }),
);

export default router;
