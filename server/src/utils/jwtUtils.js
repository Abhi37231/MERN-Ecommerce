/**
 * jwtUtils — JWT token generation and verification helpers.
 *
 * Why: Centralizing JWT logic here means every part of the app uses
 *      the same signing algorithm, expiry, and secret. Changing any
 *      JWT parameter only requires editing this one file.
 *
 * Strategy:
 *  - Access Token:  Short-lived (15m), stored in httpOnly cookie
 *  - Refresh Token: Long-lived (7d), stored in httpOnly cookie
 *    → If access token expires, the client hits /auth/refresh-token
 *      to silently obtain a new access token using the refresh token.
 *    → This avoids storing tokens in localStorage (XSS vulnerability).
 */
const jwt = require('jsonwebtoken');
const AppError = require('./AppError');

const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh';

const ACCESS_TOKEN_EXPIRES = process.env.JWT_ACCESS_EXPIRES || '15m';
const REFRESH_TOKEN_EXPIRES = process.env.JWT_REFRESH_EXPIRES || '7d';

/**
 * Generate a signed JWT access token for a user.
 * @param {string} userId - MongoDB ObjectId as string
 * @param {string} role   - User role ('user' | 'admin')
 */
const generateAccessToken = (userId, role) => {
  return jwt.sign({ id: userId, role }, ACCESS_TOKEN_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES,
  });
};

/**
 * Generate a signed JWT refresh token for a user.
 * @param {string} userId - MongoDB ObjectId as string
 */
const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES,
  });
};

/**
 * Verify and decode an access token.
 * Throws AppError(401) if invalid or expired.
 */
const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, ACCESS_TOKEN_SECRET);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new AppError('Access token has expired. Please refresh your session.', 401);
    }
    throw new AppError('Invalid access token.', 401);
  }
};

/**
 * Verify and decode a refresh token.
 * Throws AppError(401) if invalid or expired.
 */
const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, REFRESH_TOKEN_SECRET);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new AppError('Session has expired. Please log in again.', 401);
    }
    throw new AppError('Invalid refresh token.', 401);
  }
};

/**
 * Cookie options for httpOnly JWT cookies.
 * httpOnly: prevents JavaScript access (XSS protection)
 * secure:   only sent over HTTPS (set in production)
 * sameSite: CSRF protection
 */
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
};

const accessTokenCookieOptions = {
  ...cookieOptions,
  maxAge: 15 * 60 * 1000, // 15 minutes in ms
};

const refreshTokenCookieOptions = {
  ...cookieOptions,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
};

/**
 * Set both access and refresh token cookies on the response.
 * @param {object} res - Express response object
 * @param {string} accessToken
 * @param {string} refreshToken
 */
const setTokenCookies = (res, accessToken, refreshToken) => {
  res.cookie('accessToken', accessToken, accessTokenCookieOptions);
  res.cookie('refreshToken', refreshToken, refreshTokenCookieOptions);
};

/**
 * Clear both token cookies (on logout).
 * @param {object} res - Express response object
 */
const clearTokenCookies = (res) => {
  res.clearCookie('accessToken', cookieOptions);
  res.clearCookie('refreshToken', cookieOptions);
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  setTokenCookies,
  clearTokenCookies,
};
