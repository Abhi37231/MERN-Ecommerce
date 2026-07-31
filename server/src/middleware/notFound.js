/**
 * notFound.js — 404 catch-all middleware.
 *
 * Why: Express only calls error handlers when next(err) is called.
 *      If a request reaches here, no route matched it.
 *      We create a descriptive AppError and pass it to errorHandler.
 *
 * Must be registered AFTER all routes in app.js.
 */
const AppError = require('../utils/AppError');

const notFound = (req, res, next) => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
};

module.exports = notFound;
