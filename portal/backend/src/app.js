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
const frontendOrigin = 'https://frontend-theta-khaki-99.vercel.app';

app.use(
  cors({
    origin: frontendOrigin,
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
);/**
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