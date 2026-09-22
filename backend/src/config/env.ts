import "dotenv/config";
import { z } from "zod";

/**
 * Centralized, validated environment configuration.
 * Fail fast at startup if required variables are missing/invalid,
 * instead of discovering it deep inside a request handler later.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  BACKEND_PORT: z.coerce.number().int().positive().default(4000),
  API_BASE_PATH: z.string().default("/api/v1"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),

  // Phase 2+ (optional for now, validated loosely so Phase 1 can boot without them)
  DATABASE_URL: z.string().optional(),

  // Phase 3+ (optional for now)
  JWT_ACCESS_SECRET: z.string().optional(),
  JWT_REFRESH_SECRET: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment configuration:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;