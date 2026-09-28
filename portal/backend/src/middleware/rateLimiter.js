import rateLimit from "express-rate-limit";
import env from "../config/env.js";

const handler = (_req, res) =>
  res
    .status(429)
    .json({
      success: false,
      message: "Too many requests. Please try again in a few moments.",
      errors: [],
    });

export const globalLimiter = rateLimit({
  windowMs: env.rateLimitWindowMin * 60 * 1000,
  max: env.rateLimitMax || 5000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => env.isTest || req.method === "OPTIONS",
  handler,
});

export const authLimiter = rateLimit({
  windowMs: env.rateLimitWindowMin * 60 * 1000,
  max: env.authRateLimitMax || 200,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  skip: (req) => env.isTest || req.method === "OPTIONS",
  handler,
});

export default globalLimiter;
