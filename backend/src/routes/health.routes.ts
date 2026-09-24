import { Router } from "express";
import { prisma } from "@/lib/prisma.js";
import { sendSuccess } from "@/utils/apiResponse.js";
import { asyncHandler } from "@/utils/asyncHandler.js";

const router = Router();

/**
 * GET /api/v1/health
 * Basic liveness check. Also verifies database connectivity by running
 * a trivial query, so we know Prisma <-> PostgreSQL is actually working.
 */
router.get(
  "/",
  asyncHandler(async (_req, res) => {
    let databaseStatus = "unknown";

    try {
      await prisma.$queryRaw`SELECT 1`;
      databaseStatus = "connected";
    } catch {
      databaseStatus = "disconnected";
    }

    sendSuccess(res, {
      status: "ok",
      service: "cityos-backend",
      database: databaseStatus,
      timestamp: new Date().toISOString(),
      uptimeSeconds: process.uptime(),
    });
  }),
);

export default router;