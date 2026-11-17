import { Router } from "express";
import { analyticsController } from "@/controllers/analytics.controller.js";
import { authenticate } from "@/middleware/auth.js";
import { asyncHandler } from "@/utils/asyncHandler.js";

const router = Router();

router.use(authenticate);

router.get("/overview", asyncHandler(analyticsController.getOverview));
router.get("/categories", asyncHandler(analyticsController.getByCategory));
router.get("/departments", asyncHandler(analyticsController.getByDepartment));

export default router;
