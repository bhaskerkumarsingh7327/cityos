import { Router } from "express";
import { sendSuccess } from "@/utils/apiResponse.js";
import { asyncHandler } from "@/utils/asyncHandler.js";

const router = Router();

/**
 * GET /api/v1/health
 * Basic liveness check for Phase 1. Will be extended in Phase 2 to also
 * verify DB connectivity, and later Redis/AI-service connectivity.
 */
router.get(
  "/",
  asyncHandler(async (_req, res) => {
    sendSuccess(res, {
      status: "ok",
      service: "cityos-backend",
      timestamp: new Date().toISOString(),
      uptimeSeconds: process.uptime(),
    });
  }),
);

export default router;