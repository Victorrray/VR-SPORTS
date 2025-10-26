const { logError } = require('../config/logger');
const { captureException } = require('../config/sentry');

/**
 * Centralized error handler middleware
 * Should be added LAST in the middleware chain
 */
function errorHandler(err, req, res, next) {
  // Generate unique request ID for tracking
  const requestId = req.id || `err-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Determine error status code
  const status = err.status || err.statusCode || 500;
  const isDevelopment = process.env.NODE_ENV !== 'production';

  // Log the error
  logError(err, {
    requestId,
    path: req.path,
    method: req.method,
    userId: req.__userId || 'anonymous',
    ip: req.ip,
    status,
  });

  // Capture in Sentry
  if (process.env.SENTRY_DSN) {
    captureException(err, {
      requestId,
      path: req.path,
      method: req.method,
      userId: req.__userId,
      status,
    });
  }

  // Build error response
  const errorResponse = {
    error: {
      message: err.message || 'Internal Server Error',
      code: err.code || 'INTERNAL_ERROR',
      requestId,
      ...(isDevelopment && { stack: err.stack }),
    },
  };

  // Send response
  res.status(status).json(errorResponse);
}

/**
 * Async error wrapper for Express route handlers
 * Usage: app.get('/route', asyncHandler(async (req, res) => { ... }))
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * 404 handler - should be added after all routes
 */
function notFoundHandler(req, res) {
  res.status(404).json({
    error: {
      message: 'Route not found',
      code: 'NOT_FOUND',
      path: req.path,
      method: req.method,
    },
  });
}

module.exports = {
  errorHandler,
  asyncHandler,
  notFoundHandler,
};
