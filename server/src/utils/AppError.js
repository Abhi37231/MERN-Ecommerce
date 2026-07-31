/**
 * AppError — Custom error class for operational errors.
 *
 * Extends the native Error class to include:
 *  - statusCode: HTTP status code (e.g. 400, 401, 404, 500)
 *  - status:     'fail' for 4xx, 'error' for 5xx
 *  - isOperational: true → known, expected errors we can send to the client
 *
 * Usage:
 *   throw new AppError('Resource not found', 404);
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    // Capture stack trace, excluding AppError constructor from it
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
