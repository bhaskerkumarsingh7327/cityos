import type { NextFunction, Request, Response } from "express";
import { ApiError } from "@/utils/ApiError.js";
import { sendError } from "@/utils/apiResponse.js";
import { logger } from "@/utils/logger.js";

/**
 * Catches errors from every route/middleware and formats them using the
 * standard { success: false, error: {...} } response contract.
 * Must be registered LAST, after all routes.
 */
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
) {
  if (err instanceof ApiError) {
    if (err.statusCode >= 500) {
      logger.error(err.message, { path: req.path, code: err.code, stack: err.stack });
    }
    return sendError(res, err.statusCode, err.code, err.message, err.details);
  }

  const message = err instanceof Error ? err.message : "Unknown error";
  logger.error("Unhandled error", {
    path: req.path,
    message,
    stack: err instanceof Error ? err.stack : undefined,
  });

  return sendError(res, 500, "INTERNAL_ERROR", "Something went wrong. Please try again later.");
}

/**
 * Catches requests to routes that don't exist.
 */
export function notFoundHandler(req: Request, res: Response) {
  return sendError(res, 404, "NOT_FOUND", `Route not found: ${req.method} ${req.originalUrl}`);
}