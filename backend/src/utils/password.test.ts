import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/utils/password.js";

describe("Password Hashing with Argon2", () => {
  it("should securely hash a password and verify correctly", async () => {
    const raw = "SecurePass@2026!";
    const hash = await hashPassword(raw);

    expect(hash).toBeDefined();
    expect(hash).not.toBe(raw);
    expect(hash.startsWith("$argon2id$")).toBe(true);

    const match = await verifyPassword(raw, hash);
    expect(match).toBe(true);

    const mismatch = await verifyPassword("WrongPassword123", hash);
    expect(mismatch).toBe(false);
  });
});
