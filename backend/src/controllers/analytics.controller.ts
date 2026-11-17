import type { Request, Response } from "express";
import { Incident } from "@/models/Incident.js";
import { sendSuccess } from "@/utils/apiResponse.js";

export const analyticsController = {
  /**
   * Real MongoDB aggregation pipeline for operational overview KPIs
   */
  async getOverview(_req: Request, res: Response) {
    const [statusCounts, priorityCounts, resolutionStats] = await Promise.all([
      Incident.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),
      Incident.aggregate([
        {
          $group: {
            _id: "$priority",
            count: { $sum: 1 },
          },
        },
      ]),
      Incident.aggregate([
        {
          $match: {
            status: { $in: ["RESOLVED", "CLOSED"] },
            "resolution.resolvedAt": { $exists: true },
          },
        },
        {
          $project: {
            resolutionTimeHours: {
              $divide: [
                { $subtract: ["$resolution.resolvedAt", "$createdAt"] },
                1000 * 60 * 60, // Convert ms to hours
              ],
            },
          },
        },
        {
          $group: {
            _id: null,
            avgResolutionHours: { $avg: "$resolutionTimeHours" },
            resolvedCount: { $sum: 1 },
          },
        },
      ]),
    ]);

    const statusMap: Record<string, number> = {};
    let total = 0;
    statusCounts.forEach((s) => {
      statusMap[s._id] = s.count;
      total += s.count;
    });

    const openCount =
      total -
      ((statusMap.RESOLVED || 0) +
        (statusMap.CLOSED || 0) +
        (statusMap.REJECTED || 0) +
        (statusMap.CANCELLED || 0));

    sendSuccess(
      res,
      {
        totalIncidents: total,
        openIncidents: Math.max(0, openCount),
        resolvedIncidents: (statusMap.RESOLVED || 0) + (statusMap.CLOSED || 0),
        criticalIncidents: priorityCounts.find((p) => p._id === "CRITICAL")?.count || 0,
        avgResolutionHours: Math.round((resolutionStats[0]?.avgResolutionHours || 0) * 10) / 10,
        statusBreakdown: statusMap,
      },
      "Overview analytics retrieved",
    );
  },

  /**
   * Incidents grouped by category
   */
  async getByCategory(_req: Request, res: Response) {
    const categoryStats = await Incident.aggregate([
      {
        $lookup: {
          from: "incident_categories",
          localField: "category",
          foreignField: "_id",
          as: "cat",
        },
      },
      {
        $unwind: "$cat",
      },
      {
        $group: {
          _id: "$cat.name",
          slug: { $first: "$cat.slug" },
          count: { $sum: 1 },
          avgPriorityScore: { $avg: "$priorityScore" },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    sendSuccess(res, { categories: categoryStats }, "Category analytics retrieved");
  },

  /**
   * Incidents grouped by department
   */
  async getByDepartment(_req: Request, res: Response) {
    const departmentStats = await Incident.aggregate([
      {
        $lookup: {
          from: "departments",
          localField: "department",
          foreignField: "_id",
          as: "dept",
        },
      },
      {
        $unwind: "$dept",
      },
      {
        $group: {
          _id: "$dept.name",
          code: { $first: "$dept.code" },
          count: { $sum: 1 },
          openCount: {
            $sum: {
              $cond: [{ $in: ["$status", ["RESOLVED", "CLOSED", "REJECTED"]] }, 0, 1],
            },
          },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    sendSuccess(res, { departments: departmentStats }, "Department analytics retrieved");
  },
};
