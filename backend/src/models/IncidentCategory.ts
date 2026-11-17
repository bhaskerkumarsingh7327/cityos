import mongoose, { Document, Model, Schema } from "mongoose";

export interface IIncidentCategory extends Document {
  name: string;
  slug: string;
  description: string;
  defaultDepartment?: mongoose.Types.ObjectId;
  defaultSeverity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  slaHours: number;
  icon?: string;
  isActive: boolean;
}

const IncidentCategorySchema = new Schema<IIncidentCategory>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    defaultDepartment: {
      type: Schema.Types.ObjectId,
      ref: "Department",
    },
    defaultSeverity: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      default: "MEDIUM",
    },
    slaHours: {
      type: Number,
      default: 48,
    },
    icon: {
      type: String,
      default: "alert-circle",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
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

export const IncidentCategory: Model<IIncidentCategory> =
  mongoose.models.IncidentCategory ||
  mongoose.model<IIncidentCategory>("IncidentCategory", IncidentCategorySchema);
