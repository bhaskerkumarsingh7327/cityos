import { describe, expect, it } from "vitest";
import {
  generateAccessToken,
  generateRefreshTokenString,
  hashToken,
  verifyAccessToken,
} from "@/utils/jwt.js";

describe("JWT & Token Management", () => {
  it("generates and verifies valid access tokens", () => {
    const payload = {
      userId: "64f1234567890abcdef12345",
      email: "officer@cityos.local",
      role: "OFFICER" as const,
      department: "PWD",
    };

    const token = generateAccessToken(payload);
    expect(typeof token).toBe("string");

    const decoded = verifyAccessToken(token);
    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.email).toBe(payload.email);
    expect(decoded.role).toBe(payload.role);
    expect(decoded.department).toBe(payload.department);
  });

  it("generates opaque refresh tokens and computes deterministic SHA-256 hashes", () => {
    const { token, expiresAt } = generateRefreshTokenString();

    expect(token).toBeDefined();
    expect(token.length).toBe(80); // 40 bytes hex = 80 chars
    expect(expiresAt.getTime()).toBeGreaterThan(Date.now());

    const hash1 = hashToken(token);
    const hash2 = hashToken(token);
    expect(hash1).toBe(hash2);
    expect(hash1.length).toBe(64); // SHA-256 hex = 64 chars
  });
});
