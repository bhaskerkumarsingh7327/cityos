import mongoose, { Document, Model, Schema } from "mongoose";

export type UserRole =
  "CITIZEN" | "FIELD_WORKER" | "OFFICER" | "DEPARTMENT_ADMIN" | "CITY_ADMIN" | "SUPER_ADMIN";

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  phone?: string;
  department?: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },
    passwordHash: {
      type: String,
      required: [true, "Password hash is required"],
      select: false,
    },
    role: {
      type: String,
      enum: ["CITIZEN", "FIELD_WORKER", "OFFICER", "DEPARTMENT_ADMIN", "CITY_ADMIN", "SUPER_ADMIN"],
      default: "CITIZEN",
      index: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    department: {
      type: Schema.Types.ObjectId,
      ref: "Department",
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret: Record<string, unknown>) {
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
      },
    },
  },
);

UserSchema.index({ role: 1, department: 1 });

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
