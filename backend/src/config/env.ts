import "dotenv/config";
import { z } from "zod";

/**
 * Validated environment configuration.
 * Validates required configuration keys at startup using Zod.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  BACKEND_PORT: z.coerce.number().int().positive().default(4000),
  API_BASE_PATH: z.string().default("/api/v1"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),

  // Database Connection
  MONGODB_URI: z.string().default("mongodb://localhost:27017/cityos"),

  // Authentication Secrets
  JWT_ACCESS_SECRET: z.string().optional(),
  JWT_REFRESH_SECRET: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error("Configuration Error: Invalid environment variables:");
  // eslint-disable-next-line no-console
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
