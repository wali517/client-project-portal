import rateLimit from 'express-rate-limit';
import env from '../config/env.js';

const handler = (_req, res) =>
  res.status(429).json({ success: false, message: 'Too many requests. Please try again later.', errors: [] });

export const globalLimiter = rateLimit({
  windowMs: env.rateLimitWindowMin * 60 * 1000,
  max: env.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.isTest,
  handler,
});

export const authLimiter = rateLimit({
  windowMs: env.rateLimitWindowMin * 60 * 1000,
  max: env.authRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  skip: () => env.isTest,
  handler,
});

export default globalLimiter;
