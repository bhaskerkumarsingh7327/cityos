import mongoose, { Document, Model, Schema } from "mongoose";

export interface IAuditLog extends Document {
  actor: mongoose.Types.ObjectId;
  action: string;
  entity: string;
  entityId: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    actor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    entity: {
      type: String,
      required: true,
      index: true,
    },
    entityId: {
      type: String,
      required: true,
      index: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
    ipAddress: String,
    userAgent: String,
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
  },
);

AuditLogSchema.index({ entity: 1, entityId: 1, timestamp: -1 });

export const AuditLog: Model<IAuditLog> =
  mongoose.models.AuditLog || mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);
