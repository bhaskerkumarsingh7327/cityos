import { Router } from "express";
import analyticsRoutes from "@/routes/analytics.routes.js";
import authRoutes from "@/routes/auth.routes.js";
import healthRoutes from "@/routes/health.routes.js";
import incidentRoutes from "@/routes/incident.routes.js";
import mapRoutes from "@/routes/map.routes.js";
import workerRoutes from "@/routes/worker.routes.js";

const router = Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/incidents", incidentRoutes);
router.use("/maps", mapRoutes);
router.use("/workers", workerRoutes);
router.use("/analytics", analyticsRoutes);

export default router;
