/**
 * validate.js — express-validator error aggregation middleware.
 *
 * Why: express-validator decorates the request with validation errors.
 *      This middleware collects those errors and returns a structured
 *      400 response before the controller ever runs.
 *
 * Usage (in route file):
 *   const { body } = require('express-validator');
 *   const validate = require('../middleware/validate');
 *
 *   router.post('/register',
 *     [
 *       body('email').isEmail().withMessage('Please provide a valid email'),
 *       body('password').isLength({ min: 8 }).withMessage('Password must be 8+ characters'),
 *     ],
 *     validate,
 *     authController.register
 *   );
 */
const { validationResult } = require('express-validator');
const AppError = require('../utils/AppError');

const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    // Map errors to a clean array of { field, message }
    const formattedErrors = errors.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg,
    }));

    // Return validation error with all field errors
    return res.status(400).json({
      success: false,
      status: 'fail',
      message: 'Validation failed. Please check your input.',
      errors: formattedErrors,
    });
  }

  next();
};

module.exports = validate;
