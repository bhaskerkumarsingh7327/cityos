import mongoose from "mongoose";
import { Incident, type IIncident } from "@/models/Incident.js";
import { logger } from "@/utils/logger.js";

interface FindDuplicateParams {
  longitude: number;
  latitude: number;
  categoryId: mongoose.Types.ObjectId | string;
  maxDistanceMeters?: number; // default 75 meters
  lookbackDays?: number; // default 7 days
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  masterIncident?: IIncident;
  distanceMeters?: number;
}

/**
 * Detects whether a newly reported incident is a duplicate of an existing unresolved incident.
 * Uses MongoDB geospatial queries ($geoWithin with $centerSphere or $near) and category matching.
 */
export async function detectDuplicateIncident(
  params: FindDuplicateParams,
): Promise<DuplicateCheckResult> {
  const { longitude, latitude, categoryId, maxDistanceMeters = 75, lookbackDays = 7 } = params;

  const sinceDate = new Date();
  sinceDate.setDate(sinceDate.getDate() - lookbackDays);

  // Earth radius in meters approximately 6,378,100
  const radians = maxDistanceMeters / 6378100;

  try {
    // Find active (unresolved) incidents of the same category within distance radians
    const nearbyIncidents = await Incident.find({
      category: categoryId,
      status: {
        $nin: ["RESOLVED", "CLOSED", "REJECTED", "CANCELLED"],
      },
      createdAt: { $gte: sinceDate },
      location: {
        $geoWithin: {
          $centerSphere: [[longitude, latitude], radians],
        },
      },
    })
      .sort({ createdAt: 1 }) // The oldest open report serves as the Master
      .limit(1);

    if (nearbyIncidents.length > 0) {
      const master = nearbyIncidents[0];
      logger.info("Duplicate incident detected", {
        masterIncidentNumber: master.incidentNumber,
        newCoordinates: [longitude, latitude],
        masterCoordinates: master.location.coordinates,
      });

      return {
        isDuplicate: true,
        masterIncident: master,
      };
    }

    return { isDuplicate: false };
  } catch (error) {
    logger.warn("Duplicate detection query failed; proceeding as independent incident", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return { isDuplicate: false };
  }
}
