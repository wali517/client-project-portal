import multer from 'multer';
import mongoose from 'mongoose';
import env from '../config/env.js';
import ApiError from '../utils/ApiError.js';
import logger from '../utils/logger.js';
import { sendError } from '../utils/apiResponse.js';

export const notFoundHandler = (req, _res, next) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, _req, res, _next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Something went wrong';
  let errors = err.errors || [];

  if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 422;
    message = 'Validation failed';
    errors = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
  } else if (err instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = `Invalid value for ${err.path}`;
  } else if (err?.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `A record with this ${field} already exists`;
    errors = [{ field, message }];
  } else if (err instanceof multer.MulterError) {
    statusCode = 400;
    message =
      err.code === 'LIMIT_FILE_SIZE'
        ? `File is larger than the ${env.maxFileSizeMb}MB limit`
        : `File upload failed: ${err.message}`;
  }

  if (statusCode >= 500) {
    logger.error(err.message, env.isProduction ? '' : err.stack);
  }

  const payload = { statusCode, message, errors };
  if (!env.isProduction && statusCode >= 500) payload.errors = [{ field: 'server', message: err.message }];

  return sendError(res, payload);
};

export default errorHandler;
