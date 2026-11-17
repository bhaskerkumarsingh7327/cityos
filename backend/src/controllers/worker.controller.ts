import type { Request, Response } from "express";
import { z } from "zod";
import { emitRealTimeEvent } from "@/lib/socket.js";
import { Incident } from "@/models/Incident.js";
import { validateStatusTransition } from "@/services/incidentStateMachine.js";
import { ApiError } from "@/utils/ApiError.js";
import { sendSuccess } from "@/utils/apiResponse.js";

const startWorkSchema = z.object({
  beforeMediaUrl: z
    .string({ required_error: "Before-repair photo evidence is mandatory" })
    .url("A valid URL for before-repair photo evidence is required"),
  notes: z.string().optional(),
});

const completeWorkSchema = z.object({
  afterMediaUrl: z
    .string({ required_error: "After-repair photo evidence is mandatory" })
    .url("A valid URL for after-repair photo evidence is mandatory to verify completion"),
  resolutionNotes: z
    .string()
    .min(10, "Detailed resolution notes (at least 10 characters) are mandatory to submit completion"),
});

export const workerController = {
  /**
   * Get all tasks assigned to the authenticated field worker
   */
  async getAssignedTasks(req: Request, res: Response) {
    if (!req.user) throw ApiError.unauthorized();

    const tasks = await Incident.find({
      $or: [
        { assignedWorker: req.user._id },
        { status: { $in: ["ASSIGNED", "IN_PROGRESS", "RESOLVED"] } },
      ],
    })
      .populate("category", "name slug icon")
      .populate("department", "name code")
      .populate("ward", "name wardNumber zone")
      .sort({ priorityScore: -1, createdAt: -1 });

    sendSuccess(res, { tasks }, "Assigned tasks retrieved");
  },

  /**
   * Field Worker starts work on assigned task (Requires Before-Evidence Photo)
   */
  async startWork(req: Request, res: Response) {
    if (!req.user) throw ApiError.unauthorized();

    const { id } = req.params;
    const parse = startWorkSchema.safeParse(req.body);
    if (!parse.success) {
      throw ApiError.badRequest("Validation failed: Before-repair photo is mandatory", parse.error.flatten().fieldErrors);
    }

    const { beforeMediaUrl, notes } = parse.data;

    const incident = await Incident.findById(id);
    if (!incident) {
      throw ApiError.notFound("Task not found");
    }

    validateStatusTransition(incident.status, "IN_PROGRESS", req.user.role);

    const oldStatus = incident.status;
    incident.status = "IN_PROGRESS";

    incident.media.push({
      mediaId: `media-before-${Date.now()}`,
      url: beforeMediaUrl,
      mimeType: "image/jpeg",
      phase: "before",
      uploadedAt: new Date(),
    });

    incident.statusHistory.push({
      fromStatus: oldStatus,
      toStatus: "IN_PROGRESS",
      changedBy: req.user._id,
      reason: notes || "Technician arrived on-site and verified damage with Before-photo evidence",
      timestamp: new Date(),
    });

    await incident.save();

    emitRealTimeEvent("incident.status_changed", {
      incidentId: incident.id,
      incidentNumber: incident.incidentNumber,
      fromStatus: oldStatus,
      toStatus: "IN_PROGRESS",
    });

    sendSuccess(res, incident, "Work marked as in-progress with before-photo evidence");
  },

  /**
   * Field Worker submits completion (Requires After-Evidence Photo & Notes)
   */
  async completeWork(req: Request, res: Response) {
    if (!req.user) throw ApiError.unauthorized();

    const { id } = req.params;
    const parse = completeWorkSchema.safeParse(req.body);
    if (!parse.success) {
      throw ApiError.badRequest("Validation failed: After-repair photo and notes are mandatory", parse.error.flatten().fieldErrors);
    }

    const { afterMediaUrl, resolutionNotes } = parse.data;

    const incident = await Incident.findById(id);
    if (!incident) {
      throw ApiError.notFound("Task not found");
    }

    validateStatusTransition(incident.status, "RESOLVED", req.user.role);

    const oldStatus = incident.status;
    incident.status = "RESOLVED";

    incident.media.push({
      mediaId: `media-after-${Date.now()}`,
      url: afterMediaUrl,
      mimeType: "image/jpeg",
      phase: "after",
      uploadedAt: new Date(),
    });

    incident.resolution = {
      resolvedBy: req.user._id,
      resolutionNotes,
      resolvedAt: new Date(),
    };

    incident.statusHistory.push({
      fromStatus: oldStatus,
      toStatus: "RESOLVED",
      changedBy: req.user._id,
      reason: `Work completed by technician with after-photo proof. Notes: ${resolutionNotes}`,
      timestamp: new Date(),
    });

    await incident.save();

    emitRealTimeEvent("incident.resolved", {
      incidentId: incident.id,
      incidentNumber: incident.incidentNumber,
      resolvedBy: req.user.name,
    });

    sendSuccess(res, incident, "Task submitted as completed with after-photo proof; forwarded for citizen verification");
  },
};
