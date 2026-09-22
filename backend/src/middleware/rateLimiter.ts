import rateLimit from "express-rate-limit";

/**
 * General-purpose API rate limiter.
 * Stricter limiters (e.g. for /auth/login) will be added in Phase 3.
 */
export const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: "RATE_LIMITED",
      message: "Too many requests. Please try again later.",
    },
  },
});