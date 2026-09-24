import { PrismaClient } from "@prisma/client";

/**
 * Single shared Prisma Client instance for the whole app.
 * Prevents creating multiple connections during hot-reload in development.
 */
export const prisma = new PrismaClient();