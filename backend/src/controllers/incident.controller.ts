import type { Request, Response } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { emitRealTimeEvent } from "@/lib/socket.js";
import { Incident, IncidentCategory, User, type IncidentStatus } from "@/models/index.js";
import { detectDuplicateIncident } from "@/services/duplicateDetection.js";
import { enqueueIncidentAIJob } from "@/services/incidentQueue.js";
import { validateStatusTransition } from "@/services/incidentStateMachine.js";
import { ApiError } from "@/utils/ApiError.js";
import { sendSuccess } from "@/utils/apiResponse.js";

const createIncidentSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(150),
  description: z.string().min(10, "Description must be at least 10 characters").max(2000),
  category: z.string().min(1, "Category ID is required"),
  coordinates: z
    .array(z.number())
    .length(2, "Coordinates must be [longitude, latitude]")
    .refine(
      ([lng, lat]) => lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90,
      "Coordinates must be valid WGS84 [longitude, latitude]",
    ),
  address: z.string().optional(),
  mediaUrl: z.string().url().optional(),
});

const updateStatusSchema = z.object({
  status: z.enum([
    "REPORTED",
    "AI_PROCESSING",
    "UNDER_REVIEW",
    "VERIFIED",
    "ASSIGNED",
    "IN_PROGRESS",
    "RESOLVED",
    "CITIZEN_VERIFICATION",
    "CLOSED",
    "REJECTED",
    "REOPENED",
    "CANCELLED",
  ]),
  reason: z.string().optional(),
});

const assignSchema = z.object({
  departmentId: z.string().optional(),
  workerId: z.string().optional(),
  notes: z.string().optional(),
});

const verifyResolutionSchema = z.object({
  satisfied: z.boolean(),
  comments: z.string().optional(),
});

export const incidentController = {
  /**
   * Create a new incident report
   */
  async create(req: Request, res: Response) {
    if (!req.user) throw ApiError.unauthorized();

    const parse = createIncidentSchema.safeParse(req.body);
    if (!parse.success) {
      throw ApiError.badRequest("Validation failed", parse.error.flatten().fieldErrors);
    }

    const { title, description, category: categoryId, coordinates, address, mediaUrl } = parse.data;

    const categoryDoc = mongoose.isValidObjectId(categoryId)
      ? await IncidentCategory.findById(categoryId)
      : await IncidentCategory.findOne({ slug: categoryId });
    if (!categoryDoc) {
      throw ApiError.notFound(`Incident category '${categoryId}' not found`);
    }

    const [longitude, latitude] = coordinates;

    // Check for existing duplicate incidents within geographic proximity
    const duplicateCheck = await detectDuplicateIncident({
      longitude,
      latitude,
      categoryId,
    });

    // Generate unique incident number (INC-YYYYMM-XXXX)
    const datePrefix = new Date().toISOString().slice(0, 7).replace("-", "");
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const incidentNumber = `INC-${datePrefix}-${randomSuffix}`;

    const media = mediaUrl
      ? [
          {
            mediaId: `media-${Date.now()}`,
            url: mediaUrl,
            mimeType: "image/jpeg",
            phase: "initial" as const,
            uploadedAt: new Date(),
          },
        ]
      : [];

    const incident = await Incident.create({
      incidentNumber,
      title,
      description,
      reporter: req.user._id,
      category: categoryDoc._id,
      status: "AI_PROCESSING",
      department: categoryDoc.defaultDepartment,
      location: {
        type: "Point",
        coordinates: [longitude, latitude],
      },
      address,
      media,
      duplicateClusterId: duplicateCheck.isDuplicate
        ? duplicateCheck.masterIncident?._id
        : undefined,
      isMasterDuplicate: !duplicateCheck.isDuplicate,
      statusHistory: [
        {
          fromStatus: "REPORTED",
          toStatus: "AI_PROCESSING",
          changedBy: req.user._id,
          reason: duplicateCheck.isDuplicate
            ? `Reported (Linked to Duplicate Cluster: ${duplicateCheck.masterIncident?.incidentNumber})`
            : "Initial report created",
          timestamp: new Date(),
        },
      ],
    });

    // Asynchronously trigger AI classification and priority calculation
    enqueueIncidentAIJob(incident.id, mediaUrl, categoryDoc.slug);

    // Broadcast real-time incident event via Socket.IO
    emitRealTimeEvent("incident.created", {
      incidentId: incident.id,
      incidentNumber: incident.incidentNumber,
      title: incident.title,
      category: categoryDoc.name,
      location: incident.location,
    });

    sendSuccess(
      res,
      incident,
      duplicateCheck.isDuplicate
        ? "Incident reported successfully (Linked to existing nearby issue)"
        : "Incident reported successfully",
      201,
    );
  },

  /**
   * List incidents with filters & pagination
   */
  async list(req: Request, res: Response) {
    const {
      status,
      priority,
      category,
      department,
      reporter,
      page = "1",
      limit = "20",
    } = req.query;

    const filter: Record<string, unknown> = {};

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;
    if (department) filter.department = department;
    if (reporter) filter.reporter = reporter;

    // Citizens can see their own reports by default if query requested
    if (req.user?.role === "CITIZEN" && req.query.mine === "true") {
      filter.reporter = req.user._id;
    }

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [incidents, total] = await Promise.all([
      Incident.find(filter)
        .populate("reporter", "name email phone")
        .populate("category", "name slug icon")
        .populate("department", "name code")
        .populate("assignedWorker", "name email phone")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Incident.countDocuments(filter),
    ]);

    sendSuccess(
      res,
      {
        incidents,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      },
      "Incidents retrieved",
    );
  },

  /**
   * Get single incident details
   */
  async getById(req: Request, res: Response) {
    const { id } = req.params;

    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const query = isObjectId ? { _id: id } : { incidentNumber: id };

    const incident = await Incident.findOne(query)
      .populate("reporter", "name email phone")
      .populate("category", "name slug icon defaultSeverity slaHours")
      .populate("department", "name code contactEmail")
      .populate("assignedWorker", "name email phone")
      .populate("statusHistory.changedBy", "name role");

    if (!incident) {
      throw ApiError.notFound("Incident not found");
    }

    sendSuccess(res, incident, "Incident details retrieved");
  },

  /**
   * Update incident status using state machine validation
   */
  async updateStatus(req: Request, res: Response) {
    if (!req.user) throw ApiError.unauthorized();

    const { id } = req.params;
    const parse = updateStatusSchema.safeParse(req.body);
    if (!parse.success) {
      throw ApiError.badRequest("Validation failed", parse.error.flatten().fieldErrors);
    }

    const { status: targetStatus, reason } = parse.data;

    const incident = await Incident.findById(id);
    if (!incident) {
      throw ApiError.notFound("Incident not found");
    }

    // Validate state machine rule
    validateStatusTransition(incident.status, targetStatus as IncidentStatus, req.user.role);

    const oldStatus = incident.status;
    incident.status = targetStatus as IncidentStatus;

    incident.statusHistory.push({
      fromStatus: oldStatus,
      toStatus: targetStatus as IncidentStatus,
      changedBy: req.user._id,
      reason: reason || `Status changed from ${oldStatus} to ${targetStatus}`,
      timestamp: new Date(),
    });

    await incident.save();

    // Emit real-time events
    emitRealTimeEvent("incident.status_changed", {
      incidentId: incident.id,
      incidentNumber: incident.incidentNumber,
      fromStatus: oldStatus,
      toStatus: targetStatus,
    });

    if (targetStatus === "RESOLVED") {
      emitRealTimeEvent("incident.resolved", {
        incidentId: incident.id,
        incidentNumber: incident.incidentNumber,
      });
    }

    sendSuccess(res, incident, `Incident status updated to ${targetStatus}`);
  },

  /**
   * Assign department and/or field worker
   */
  async assign(req: Request, res: Response) {
    if (!req.user) throw ApiError.unauthorized();

    const { id } = req.params;
    const parse = assignSchema.safeParse(req.body);
    if (!parse.success) {
      throw ApiError.badRequest("Validation failed", parse.error.flatten().fieldErrors);
    }

    const { departmentId, workerId, notes } = parse.data;

    const incident = await Incident.findById(id);
    if (!incident) {
      throw ApiError.notFound("Incident not found");
    }

    if (workerId) {
      const worker = mongoose.isValidObjectId(workerId)
        ? await User.findById(workerId)
        : await User.findOne({ role: "FIELD_WORKER", isActive: true });
      if (!worker || worker.role !== "FIELD_WORKER") {
        throw ApiError.badRequest("Assigned user must be a valid active FIELD_WORKER");
      }
      incident.assignedWorker = worker._id;
    } else {
      const defaultWorker = await User.findOne({ role: "FIELD_WORKER", isActive: true });
      if (defaultWorker) incident.assignedWorker = defaultWorker._id;
    }

    if (departmentId) {
      incident.department = new mongoose.Types.ObjectId(departmentId);
    }

    const oldStatus = incident.status;
    incident.status = "ASSIGNED";

    incident.statusHistory.push({
      fromStatus: oldStatus,
      toStatus: "ASSIGNED",
      changedBy: req.user._id,
      reason: notes || "Assigned by officer",
      timestamp: new Date(),
    });

    await incident.save();

    emitRealTimeEvent("incident.assigned", {
      incidentId: incident.id,
      incidentNumber: incident.incidentNumber,
      workerId: incident.assignedWorker,
      departmentId: incident.department,
    });

    sendSuccess(res, incident, "Incident successfully assigned");
  },

  /**
   * Citizen resolution verification workflow (Accept or Reopen)
   */
  async verifyResolution(req: Request, res: Response) {
    if (!req.user) throw ApiError.unauthorized();

    const { id } = req.params;
    const parse = verifyResolutionSchema.safeParse(req.body);
    if (!parse.success) {
      throw ApiError.badRequest("Validation failed", parse.error.flatten().fieldErrors);
    }

    const { satisfied, comments } = parse.data;

    const incident = await Incident.findById(id);
    if (!incident) throw ApiError.notFound("Incident not found");

    if (incident.status !== "RESOLVED" && incident.status !== "CITIZEN_VERIFICATION") {
      throw ApiError.badRequest("Only resolved incidents can undergo citizen verification.");
    }

    incident.resolution = {
      ...incident.resolution,
      citizenFeedback: {
        satisfied,
        comments,
        verifiedAt: new Date(),
      },
    };

    const oldStatus = incident.status;
    const newStatus: IncidentStatus = satisfied ? "CLOSED" : "REOPENED";
    incident.status = newStatus;

    incident.statusHistory.push({
      fromStatus: oldStatus,
      toStatus: newStatus,
      changedBy: req.user._id,
      reason: satisfied
        ? "Citizen confirmed resolution satisfaction"
        : `Citizen rejected resolution: ${comments || "Unsatisfied"}`,
      timestamp: new Date(),
    });

    await incident.save();

    emitRealTimeEvent("incident.status_changed", {
      incidentId: incident.id,
      incidentNumber: incident.incidentNumber,
      fromStatus: oldStatus,
      toStatus: newStatus,
    });

    sendSuccess(
      res,
      incident,
      satisfied ? "Resolution confirmed; incident closed" : "Incident reopened for review",
    );
  },
};
