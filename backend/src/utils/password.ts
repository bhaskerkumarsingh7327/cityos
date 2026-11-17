import argon2 from "argon2";

/**
 * Argon2id password hashing following security best practices.
 */
export async function hashPassword(plainPassword: string): Promise<string> {
  return argon2.hash(plainPassword, {
    type: argon2.argon2id,
    memoryCost: 65536, // 64 MB
    timeCost: 3,
    parallelism: 4,
  });
}

/**
 * Verify a plaintext password against an Argon2 hash.
 */
export async function verifyPassword(plainPassword: string, hash: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, plainPassword);
  } catch {
    return false;
  }
}
