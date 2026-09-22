import type { Response } from "express";

/**
 * Enforces the consistent success/error response shape defined in the
 * CityOS API design spec (section 35).
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