/**
 * auth.js — Authentication & Authorization middleware.
 *
 * Why: These middleware functions protect routes that require:
 *   1. A valid JWT (protect) — "are you logged in?"
 *   2. A specific role (authorize) — "are you an admin?"
 *
 * Token extraction strategy (in order of priority):
 *   1. httpOnly cookie ('accessToken') — most secure, preferred
 *   2. Authorization header ('Bearer <token>') — for API clients, Postman
 *
 * How it works:
 *   protect → verifies JWT → attaches req.user
 *   authorize('admin') → checks req.user.role
 */
const User = require('../models/User');
const { verifyAccessToken } = require('../utils/jwtUtils');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * protect — Verifies the JWT and attaches the authenticated user to req.user.
 *
 * Usage: router.get('/profile', protect, getProfile);
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // 1. Check httpOnly cookie first (browser clients)
  if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }
  // 2. Fallback: Authorization header (API clients, Postman)
  else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('Not authenticated. Please log in to access this resource.', 401));
  }

  // Verify and decode the JWT
  const decoded = verifyAccessToken(token);

  // Fetch the user from DB (ensures user still exists and hasn't been deleted)
  const currentUser = await User.findById(decoded.id).select('+passwordChangedAt');

  if (!currentUser) {
    return next(new AppError('The user belonging to this token no longer exists.', 401));
  }

  // Check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('Password was recently changed. Please log in again.', 401)
    );
  }

  // Attach user to request for downstream middleware and controllers
  req.user = currentUser;
  next();
});

/**
 * authorize — Role-based access control.
 * Must be used AFTER protect (requires req.user to be set).
 *
 * Usage: router.delete('/users/:id', protect, authorize('admin'), deleteUser);
 *
 * @param {...string} roles - Allowed roles (e.g. 'admin', 'user')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          `Access denied. Role "${req.user.role}" is not authorized to perform this action.`,
          403
        )
      );
    }
    next();
  };
};

/**
 * optionalAuth — Like protect, but doesn't fail if no token is present.
 * Used for routes that behave differently for logged-in vs. guest users.
 * E.g., product listing can show wishlist status for logged-in users.
 */
const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;

  if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  } else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) return next(); // No token → continue as guest

  try {
    const decoded = verifyAccessToken(token);
    const currentUser = await User.findById(decoded.id);
    if (currentUser) req.user = currentUser;
  } catch (_) {
    // Invalid token → continue as guest (don't throw)
  }

  next();
});

module.exports = { protect, authorize, optionalAuth };
