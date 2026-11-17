import { Router } from "express";
import { incidentController } from "@/controllers/incident.controller.js";
import { authenticate, authorize } from "@/middleware/auth.js";
import { asyncHandler } from "@/utils/asyncHandler.js";

const router = Router();

// All incident routes require authentication
router.use(authenticate);

// Citizen & Staff: Create & List
router.post("/", asyncHandler(incidentController.create));
router.get("/", asyncHandler(incidentController.list));
router.get("/:id", asyncHandler(incidentController.getById));

// Status lifecycle transitions (RBAC controlled inside state machine)
router.patch("/:id/status", asyncHandler(incidentController.updateStatus));

// Department / Worker Assignment (Officers & Admins)
router.post(
  "/:id/assign",
  authorize("OFFICER", "DEPARTMENT_ADMIN", "CITY_ADMIN", "SUPER_ADMIN"),
  asyncHandler(incidentController.assign),
);

// Citizen Resolution Verification
router.post("/:id/verify-resolution", asyncHandler(incidentController.verifyResolution));

export default router;
