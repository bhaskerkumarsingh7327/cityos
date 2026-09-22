/**
 * Standardized application error.
 * Thrown anywhere in the app; caught centrally by errorHandler middleware.
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(statusCode: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace?.(this, this.constructor);
  }

  static badRequest(message: string, details?: unknown) {
    return new ApiError(400, "VALIDATION_ERROR", message, details);
  }

  static unauthorized(message = "Unauthorized") {
    return new ApiError(401, "UNAUTHORIZED", message);
  }

  static forbidden(message = "Forbidden") {
    return new ApiError(403, "FORBIDDEN", message);
  }

  static notFound(message = "Resource not found") {
    return new ApiError(404, "NOT_FOUND", message);
  }

  static conflict(message: string, details?: unknown) {
    return new ApiError(409, "CONFLICT", message, details);
  }

  static tooManyRequests(message = "Too many requests") {
    return new ApiError(429, "RATE_LIMITED", message);
  }

  static internal(message = "Internal server error") {
    return new ApiError(500, "INTERNAL_ERROR", message);
  }
}