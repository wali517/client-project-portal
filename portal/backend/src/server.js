import app from './app.js';
import env from './config/env.js';
import connectDB from './config/db.js';
import logger from './utils/logger.js';

const start = async () => {
  try {
    await connectDB();
    const server = app.listen(env.port, () => {
      logger.info(`API listening on http://localhost:${env.port} (${env.nodeEnv})`);
    });

    const shutdown = (signal) => {
      logger.info(`${signal} received, shutting down`);
      server.close(() => process.exit(0));
    };
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (error) {
    logger.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

start();
