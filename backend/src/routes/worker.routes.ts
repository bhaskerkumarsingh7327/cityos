import { Router } from "express";
import { workerController } from "@/controllers/worker.controller.js";
import { authenticate, authorize } from "@/middleware/auth.js";
import { asyncHandler } from "@/utils/asyncHandler.js";

const router = Router();

router.use(authenticate);
router.use(authorize("FIELD_WORKER", "OFFICER", "CITY_ADMIN", "SUPER_ADMIN"));

router.get("/tasks", asyncHandler(workerController.getAssignedTasks));
router.post("/tasks/:id/start", asyncHandler(workerController.startWork));
router.post("/tasks/:id/complete", asyncHandler(workerController.completeWork));

export default router;
