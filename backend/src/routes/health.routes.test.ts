import { describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";
import { ApiError } from "@/utils/ApiError.js";
import { sendError, sendSuccess } from "@/utils/apiResponse.js";
import { errorHandler, notFoundHandler } from "@/middleware/errorHandler.js";

describe("API Response Utilities", () => {
  it("sendSuccess should send a standard success JSON envelope", () => {
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as unknown as Response;

    sendSuccess(res, { status: "ok" }, "Success message", 200);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: { status: "ok" },
      message: "Success message",
    });
  });

  it("sendError should send a standard error JSON envelope", () => {
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as unknown as Response;

    sendError(res, 400, "VALIDATION_ERROR", "Invalid input", { field: "username" });

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid input",
        details: { field: "username" },
      },
    });
  });
});

describe("ApiError Class", () => {
  it("ApiError static helpers should construct errors with correct status and code", () => {
    const badRequest = ApiError.badRequest("Bad data", { foo: "bar" });
    expect(badRequest.statusCode).toBe(400);
    expect(badRequest.code).toBe("VALIDATION_ERROR");
    expect(badRequest.message).toBe("Bad data");
    expect(badRequest.details).toEqual({ foo: "bar" });

    const unauthorized = ApiError.unauthorized();
    expect(unauthorized.statusCode).toBe(401);
    expect(unauthorized.code).toBe("UNAUTHORIZED");

    const notFound = ApiError.notFound("Item not found");
    expect(notFound.statusCode).toBe(404);
    expect(notFound.code).toBe("NOT_FOUND");
  });
});

describe("Error Handling Middleware", () => {
  it("errorHandler should catch ApiError and format response accordingly", () => {
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as unknown as Response;
    const req = { path: "/api/v1/test" } as Request;
    const next = vi.fn();

    const err = ApiError.notFound("Test resource not found");
    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: "NOT_FOUND",
        message: "Test resource not found",
      },
    });
  });

  it("notFoundHandler should return 404 with route information", () => {
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as unknown as Response;
    const req = { method: "GET", originalUrl: "/api/v1/unknown" } as Request;

    notFoundHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: "NOT_FOUND",
        message: "Route not found: GET /api/v1/unknown",
      },
    });
  });
});
