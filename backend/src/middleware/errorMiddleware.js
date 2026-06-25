const logger = require('../utils/logger');

function notFoundMiddleware(req, res, _next) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`,
    code: 404
  });
}

function errorMiddleware(error, req, res, _next) {
  const statusCode = error.statusCode || 500;

  if (statusCode >= 500) {
    logger.error(`[Error] ${error.message}`, { stack: error.stack });
  }

  res.status(statusCode).json({
    success: false,
    message: error.message || "Server Error",
    code: statusCode
  });
}

module.exports = {
  notFoundMiddleware,
  errorMiddleware
};
