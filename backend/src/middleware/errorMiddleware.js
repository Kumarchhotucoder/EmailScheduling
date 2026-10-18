import { logger } from '../utils/logger.js';
import { errorResponse } from '../utils/response.js';

export function notFoundHandler(req, res, _next) {
  return errorResponse(res, `Route not found: ${req.method} ${req.originalUrl}`, 404);
}

export function errorHandler(err, _req, res, _next) {
  logger.error(`Unhandled error: ${err.message}`, err.stack);

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => e.message);
    return errorResponse(res, 'Validation error', 400, errors);
  }

  // Mongoose Duplicate Key Error (e.g. unique email)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return errorResponse(res, `A record with that ${field} already exists.`, 409);
  }

  // Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    return errorResponse(res, `Invalid ID format for ${err.path}`, 400);
  }

  // JWT errors caught here if thrown
  if (err.name === 'JsonWebTokenError') {
    return errorResponse(res, 'Invalid token authorization', 401);
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  return errorResponse(res, message, statusCode);
}
