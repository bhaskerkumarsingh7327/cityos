import rateLimit from "express-rate-limit";

/**
 * General API rate limiter to protect public endpoints
 * from abuse, brute-force attempts, and excessive bursts.
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
