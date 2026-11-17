import type { Response } from "express";

/**
 * Standardized API response format for all JSON endpoints:
 * Success: { success: true, data: T, message: string }
 * Error:   { success: false, error: { code, message, details } }
 */
export function sendSuccess<T>(res: Response, data: T, message = "Success", statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    data,
    message,
  });
}

export function sendError(
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  details?: unknown,
) {
  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
  });
}
