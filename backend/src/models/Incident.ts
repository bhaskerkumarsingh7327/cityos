import mongoose, { Document, Model, Schema } from "mongoose";

export type IncidentStatus =
  | "REPORTED"
  | "AI_PROCESSING"
  | "UNDER_REVIEW"
  | "VERIFIED"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "CITIZEN_VERIFICATION"
  | "CLOSED"
  | "REJECTED"
  | "REOPENED"
  | "CANCELLED";

export type IncidentPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface IIncidentMedia {
  mediaId: string;
  url: string;
  storageKey?: string;
  mimeType: string;
  phase: "initial" | "before" | "after";
  uploadedAt: Date;
}

export interface IStatusHistoryItem {
  fromStatus: IncidentStatus;
  toStatus: IncidentStatus;
  changedBy: mongoose.Types.ObjectId;
  reason?: string;
  timestamp: Date;
}

export interface IIncident extends Document {
  incidentNumber: string;
  title: string;
  description: string;
  reporter: mongoose.Types.ObjectId;
  category: mongoose.Types.ObjectId;
  status: IncidentStatus;
  priority: IncidentPriority;
  priorityScore: number;
  priorityFactors?: {
    severityScore: number;
    safetyScore: number;
    repeatFactor: number;
    unresolvedAgingScore: number;
    explanation: string;
  };
  aiAnalysis?: {
    category?: string;
    confidence: number;
    severity?: IncidentPriority;
    detectedObjects?: string[];
    processedAt: Date;
  };
  location: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude] - GeoJSON standard
  };
  address?: string;
  ward?: mongoose.Types.ObjectId;
  zone?: string;
  department?: mongoose.Types.ObjectId;
  assignedWorker?: mongoose.Types.ObjectId;
  media: IIncidentMedia[];
  duplicateClusterId?: mongoose.Types.ObjectId;
  isMasterDuplicate: boolean;
  resolution?: {
    resolvedBy?: mongoose.Types.ObjectId;
    resolutionNotes?: string;
    resolvedAt?: Date;
    citizenFeedback?: {
      satisfied: boolean;
      comments?: string;
      verifiedAt: Date;
    };
  };
  statusHistory: IStatusHistoryItem[];
  createdAt: Date;
  updatedAt: Date;
}

const IncidentSchema = new Schema<IIncident>(
  {
    incidentNumber: {
      type: String,
      required: true,
      unique: true,
    },
    title: {
      type: String,
      required: [true, "Incident title is required"],
      trim: true,
      maxlength: 150,
    },
    description: {
      type: String,
      required: [true, "Incident description is required"],
      trim: true,
      maxlength: 2000,
    },
    reporter: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "IncidentCategory",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: [
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
      ],
      default: "REPORTED",
      index: true,
    },
    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      default: "MEDIUM",
      index: true,
    },
    priorityScore: {
      type: Number,
      default: 50,
      min: 0,
      max: 100,
      index: true,
    },
    priorityFactors: {
      severityScore: Number,
      safetyScore: Number,
      repeatFactor: Number,
      unresolvedAgingScore: Number,
      explanation: String,
    },
    aiAnalysis: {
      category: String,
      confidence: Number,
      severity: {
        type: String,
        enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      },
      detectedObjects: [String],
      processedAt: Date,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
        validate: {
          validator: (coords: number[]) =>
            Array.isArray(coords) &&
            coords.length === 2 &&
            coords[0] >= -180 &&
            coords[0] <= 180 &&
            coords[1] >= -90 &&
            coords[1] <= 90,
          message:
            "Invalid GeoJSON coordinates: must be [longitude, latitude] within valid WGS84 bounds",
        },
      },
    },
    address: {
      type: String,
      trim: true,
    },
    ward: {
      type: Schema.Types.ObjectId,
      ref: "Ward",
      index: true,
    },
    zone: {
      type: String,
      trim: true,
      index: true,
    },
    department: {
      type: Schema.Types.ObjectId,
      ref: "Department",
      index: true,
    },
    assignedWorker: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    media: [
      {
        mediaId: { type: String, required: true },
        url: { type: String, required: true },
        storageKey: String,
        mimeType: { type: String, required: true },
        phase: {
          type: String,
          enum: ["initial", "before", "after"],
          default: "initial",
        },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    duplicateClusterId: {
      type: Schema.Types.ObjectId,
      ref: "Incident",
      index: true,
    },
    isMasterDuplicate: {
      type: Boolean,
      default: false,
      index: true,
    },
    resolution: {
      resolvedBy: { type: Schema.Types.ObjectId, ref: "User" },
      resolutionNotes: String,
      resolvedAt: Date,
      citizenFeedback: {
        satisfied: Boolean,
        comments: String,
        verifiedAt: Date,
      },
    },
    statusHistory: [
      {
        fromStatus: { type: String, required: true },
        toStatus: { type: String, required: true },
        changedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
        reason: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret: Record<string, unknown>) {
        delete ret.__v;
        return ret;
      },
    },
  },
);

IncidentSchema.index({ location: "2dsphere" });
IncidentSchema.index({ status: 1, department: 1, priority: -1 });
IncidentSchema.index({ reporter: 1, createdAt: -1 });
IncidentSchema.index({ assignedWorker: 1, status: 1 });
IncidentSchema.index({ category: 1, createdAt: -1 });

export const Incident: Model<IIncident> =
  mongoose.models.Incident || mongoose.model<IIncident>("Incident", IncidentSchema);
