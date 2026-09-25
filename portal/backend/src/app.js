import path from 'node:path';
import express from 'express';
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

const allowedOrigins = [
  'http://localhost:5173',
  'https://frontend-theta-khaki-99.vercel.app',
];

app.use((req, res, next) => {
  const origin = req.headers.origin;

  const isVercelFrontend =
    origin &&
    /^https:\/\/frontend-[a-z0-9-]+\.vercel\.app$/.test(origin);

  if (allowedOrigins.includes(origin) || isVercelFrontend) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS'
  );

  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type,Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
});

app.use(helmet());
app.use(express.json({ limit: '1mb' }));
app.use(
  express.urlencoded({
    extended: true,
    limit: '1mb',
  })
);

if (!env.isTest) {
  app.use(
    morgan(env.isProduction ? 'combined' : 'dev')
  );
}
app.use('/api', globalLimiter);
app.use('/uploads', express.static(path.resolve(env.uploadDir || 'uploads')));
app.use('/api', routes);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
