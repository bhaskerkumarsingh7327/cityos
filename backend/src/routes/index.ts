import { Router } from "express";
import healthRoutes from "@/routes/health.routes.js";

/**
 * Root router mounted at env.API_BASE_PATH (/api/v1).
 * Future phases will add:
 *   /auth        (Phase 3)
 *   /users       (Phase 3)
 *   /incidents   (Phase 4)
 *   /departments (Phase 4)
 *   /workers     (Phase 10)
 *   /analytics   (Phase 11)
 *   /notifications (Phase 6)
 *   /maps        (Phase 5)
 */
const router = Router();

router.use("/health", healthRoutes);

export default router;