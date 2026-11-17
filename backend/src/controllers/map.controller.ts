import type { Request, Response } from "express";
import { z } from "zod";
import { Incident } from "@/models/Incident.js";
import { ApiError } from "@/utils/ApiError.js";
import { sendSuccess } from "@/utils/apiResponse.js";

const nearbyQuerySchema = z.object({
  longitude: z.coerce.number().min(-180).max(180),
  latitude: z.coerce.number().min(-90).max(90),
  maxDistance: z.coerce.number().positive().default(5000), // default 5km
  limit: z.coerce.number().positive().max(100).default(50),
});

export const mapController = {
  /**
   * Spatial query: Find incidents near a coordinate using MongoDB $near with 2dsphere index
   */
  async getNearbyIncidents(req: Request, res: Response) {
    const parse = nearbyQuerySchema.safeParse(req.query);
    if (!parse.success) {
      throw ApiError.badRequest("Invalid coordinates", parse.error.flatten().fieldErrors);
    }

    const { longitude, latitude, maxDistance, limit } = parse.data;

    const incidents = await Incident.find({
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [longitude, latitude],
          },
          $maxDistance: maxDistance,
        },
      },
    })
      .populate("category", "name slug icon")
      .populate("department", "name code")
      .limit(limit);

    sendSuccess(
      res,
      {
        center: [longitude, latitude],
        radiusMeters: maxDistance,
        count: incidents.length,
        incidents,
      },
      "Nearby incidents found",
    );
  },

  /**
   * Return GeoJSON FeatureCollection formatted specifically for MapLibre GL JS
   */
  async getGeoJSON(req: Request, res: Response) {
    const { status, category } = req.query;
    const filter: Record<string, unknown> = {};

    if (status) filter.status = status;
    if (category) filter.category = category;

    const incidents = await Incident.find(filter)
      .populate("category", "name slug")
      .populate("department", "name code")
      .lean();

    const features = incidents.map((inc) => ({
      type: "Feature" as const,
      geometry: inc.location,
      properties: {
        id: inc._id.toString(),
        incidentNumber: inc.incidentNumber,
        title: inc.title,
        status: inc.status,
        priority: inc.priority,
        priorityScore: inc.priorityScore,
        category:
          typeof inc.category === "object" && inc.category !== null
            ? (inc.category as { name?: string }).name
            : undefined,
        department:
          typeof inc.department === "object" && inc.department !== null
            ? (inc.department as { code?: string }).code
            : undefined,
        createdAt: inc.createdAt,
      },
    }));

    const featureCollection = {
      type: "FeatureCollection" as const,
      features,
    };

    sendSuccess(res, featureCollection, "GeoJSON FeatureCollection retrieved");
  },

  /**
   * Geographic hotspot detection using spatial density aggregation
   */
  async getHotspots(_req: Request, res: Response) {
    // Aggregate incidents grouped by truncated coordinates (approx 100m grid cell)
    const hotspots = await Incident.aggregate([
      {
        $match: {
          status: { $nin: ["RESOLVED", "CLOSED", "REJECTED", "CANCELLED"] },
        },
      },
      {
        $project: {
          category: 1,
          lngGrid: { $round: [{ $arrayElemAt: ["$location.coordinates", 0] }, 3] },
          latGrid: { $round: [{ $arrayElemAt: ["$location.coordinates", 1] }, 3] },
        },
      },
      {
        $group: {
          _id: { lng: "$lngGrid", lat: "$latGrid" },
          count: { $sum: 1 },
          categories: { $addToSet: "$category" },
        },
      },
      {
        $match: {
          count: { $gte: 2 }, // At least 2 active incidents in same cell
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $limit: 20,
      },
    ]);

    sendSuccess(res, { hotspots }, "Geographic hotspots calculated");
  },
};
