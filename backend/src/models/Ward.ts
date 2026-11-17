import mongoose, { Document, Model, Schema } from "mongoose";

export interface IWard extends Document {
  name: string;
  wardNumber: number;
  zone: string;
  population?: number;
  boundary: {
    type: "Polygon" | "MultiPolygon";
    coordinates: number[][][] | number[][][][];
  };
  isActive: boolean;
}

const WardSchema = new Schema<IWard>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    wardNumber: {
      type: Number,
      required: true,
      unique: true,
    },
    zone: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    population: {
      type: Number,
      default: 0,
    },
    boundary: {
      type: {
        type: String,
        enum: ["Polygon", "MultiPolygon"],
        required: true,
        default: "Polygon",
      },
      coordinates: {
        type: Schema.Types.Mixed,
        required: true,
      },
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

WardSchema.index({ boundary: "2dsphere" });

export const Ward: Model<IWard> = mongoose.models.Ward || mongoose.model<IWard>("Ward", WardSchema);
