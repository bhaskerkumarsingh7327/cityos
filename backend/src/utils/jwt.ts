import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { env } from "@/config/env.js";
import type { UserRole } from "@/models/User.js";

const ACCESS_SECRET = env.JWT_ACCESS_SECRET || "cityos-dev-access-secret-32-chars-long-min!";

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  department?: string;
}

/**
 * Generate a short-lived JWT access token (15 minutes).
 */
export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, ACCESS_SECRET, {
    expiresIn: "15m",
  });
}

/**
 * Generate an opaque random refresh token string and its expiration (7 days).
 */
export function generateRefreshTokenString(): { token: string; expiresAt: Date } {
  const token = crypto.randomBytes(40).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  return { token, expiresAt };
}

/**
 * Hash a refresh token before persisting to MongoDB (avoids plaintext token exposure).
 */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Verify an access token and return the decoded payload.
 */
export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, ACCESS_SECRET) as TokenPayload;
}
