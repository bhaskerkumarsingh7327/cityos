import type { NextFunction, Request, RequestHandler, Response } from "express";

/**
 * Wraps an async Express handler so any thrown/rejected error is
 * forwarded to next() and caught by the centralized errorHandler,
 * instead of crashing the process or requiring try/catch everywhere.
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}