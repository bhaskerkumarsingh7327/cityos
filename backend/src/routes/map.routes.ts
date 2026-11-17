import { Router } from "express";
import { mapController } from "@/controllers/map.controller.js";
import { asyncHandler } from "@/utils/asyncHandler.js";

const router = Router();

router.get("/nearby", asyncHandler(mapController.getNearbyIncidents));
router.get("/geojson", asyncHandler(mapController.getGeoJSON));
router.get("/hotspots", asyncHandler(mapController.getHotspots));

export default router;
