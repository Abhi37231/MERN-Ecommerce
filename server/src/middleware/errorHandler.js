const AppError = require("../utils/AppError");

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: "${err.value}".`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  return new AppError(errors.join(". "), 400);
};

const handleDuplicateKeyDB = (err) => {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];

  return new AppError(
    `"${value}" already exists for "${field}".`,
    409
  );
};

const handleJWTError = () =>
  new AppError("Invalid token. Please login again.", 401);

const handleJWTExpiredError = () =>
  new AppError("Your token has expired. Please login again.", 401);

const sendErrorDev = (err, res) => {
  console.log("\n========== SERVER ERROR ==========");
  console.error(err);
  console.log("==================================\n");
  require('fs').appendFileSync('error.log', 'TYPE: ' + typeof err + '\nINSPECT: ' + require('util').inspect(err) + '\nSTACK: ' + err.stack + '\n\n');

  res.status(err.statusCode || 500).json({
    success: false,
    status: err.status || "error",
    message: err.message,
    error: err.name,
    stack: err.stack,
  });
};

const sendErrorProd = (err, res) => {
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  console.log("\n========== SERVER ERROR ==========");
  console.error(err);
  console.log("==================================\n");
  require('fs').appendFileSync('error.log', require('util').inspect(err) + '\n\n' + err.stack + '\n');

  return res.status(500).json({
    success: false,
    status: 'error',
    message: err.message || "Internal Server Error",
  });
};

const errorHandler = (err, req, res, next) => {
  require('fs').appendFileSync('error.log', 'ORIGINAL STACK:\n' + err.stack + '\n\n');
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  let error = { ...err };
  error.message = err.message;

  if (err.name === "CastError") error = handleCastErrorDB(err);
  if (err.name === "ValidationError") error = handleValidationErrorDB(err);
  if (err.code === 11000) error = handleDuplicateKeyDB(err);
  if (err.name === "JsonWebTokenError") error = handleJWTError();
  if (err.name === "TokenExpiredError") error = handleJWTExpiredError();

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(error, res);
  } else {
    sendErrorProd(error, res);
  }
};

module.exports = errorHandler;