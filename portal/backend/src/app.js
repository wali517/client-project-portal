import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import env from './config/env.js';
import routes from './routes/index.js';
import { globalLimiter } from './middleware/rateLimiter.js';
import {
  errorHandler,
  notFoundHandler,
} from './middleware/errorHandler.js';

const app = express();

app.set('trust proxy', 1);

/**
 * Allowed frontend origins.
 *
 * CLIENT_URL can contain multiple comma-separated URLs.
 * The current production frontend is also included explicitly
 * so CORS continues to work even if the Vercel environment
 * variable has not been updated yet.
 */
const allowedOrigins = [
  ...env.clientUrl
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean),

  'https://frontend-theta-khaki-99.vercel.app',
];

const uniqueAllowedOrigins = [...new Set(allowedOrigins)];

/**
 * Security headers
 */
app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: 'cross-origin',
    },
  })
);

/**
 * CORS
 */
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no Origin header.
      // This is useful for curl/server-to-server requests.
      if (!origin) {
        return callback(null, true);
      }

      if (uniqueAllowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(
        new Error(`CORS blocked origin: ${origin}`)
      );
    },

    credentials: true,

    methods: [
      'GET',
      'HEAD',
      'PUT',
      'PATCH',
      'POST',
      'DELETE',
      'OPTIONS',
    ],

    allowedHeaders: [
      'Content-Type',
      'Authorization',
    ],

    optionsSuccessStatus: 204,
  })
);

/**
 * Explicitly handle CORS preflight requests.
 */
app.options('*', cors({
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }

    if (uniqueAllowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(
      new Error(`CORS blocked origin: ${origin}`)
    );
  },

  credentials: true,

  methods: [
    'GET',
    'HEAD',
    'PUT',
    'PATCH',
    'POST',
    'DELETE',
    'OPTIONS',
  ],

  allowedHeaders: [
    'Content-Type',
    'Authorization',
  ],

  optionsSuccessStatus: 204,
}));

/**
 * Request body parsing
 */
app.use(express.json({ limit: '1mb' }));

app.use(
  express.urlencoded({
    extended: true,
    limit: '1mb',
  })
);

/**
 * Logging
 */
if (!env.isTest) {
  app.use(
    morgan(env.isProduction ? 'combined' : 'dev')
  );
}

/**
 * API rate limiting
 */
app.use('/api', globalLimiter);

/**
 * API routes
 */
app.use('/api', routes);

/**
 * 404 handler
 */
app.use(notFoundHandler);

/**
 * Global error handler
 */
app.use(errorHandler);

export default app;