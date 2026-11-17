import mongoose, { Document, Model, Schema } from "mongoose";

export interface IRefreshToken extends Document {
  user: mongoose.Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  revoked: boolean;
  revokedAt?: Date;
  createdAt: Date;
}

const RefreshTokenSchema = new Schema<IRefreshToken>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // TTL Index: MongoDB automatically purges expired tokens
    },
    revoked: {
      type: Boolean,
      default: false,
      index: true,
    },
    revokedAt: {
      type: Date,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

export const RefreshToken: Model<IRefreshToken> =
  mongoose.models.RefreshToken || mongoose.model<IRefreshToken>("RefreshToken", RefreshTokenSchema);
