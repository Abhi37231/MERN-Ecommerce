/**
 * generateToken — Cryptographic token generator.
 *
 * Why: Used for email verification tokens and password reset tokens.
 *      We generate a random raw token, hash it before storing in MongoDB
 *      (so even if the DB is compromised, tokens can't be replayed),
 *      and send the raw unhashed token to the user via email.
 *
 * Pattern:
 *   const { rawToken, hashedToken, expiresAt } = generateToken();
 *   user.passwordResetToken = hashedToken;
 *   user.passwordResetExpires = expiresAt;
 *   await user.save();
 *   // Send rawToken via email
 */
const crypto = require('crypto');

/**
 * Generate a random token for email verification or password reset.
 * @param {number} expiresInMinutes - Token validity window (default: 10 min)
 * @returns {{ rawToken: string, hashedToken: string, expiresAt: Date }}
 */
const generateToken = (expiresInMinutes = 10) => {
  // 32 bytes → 64 hex characters
  const rawToken = crypto.randomBytes(32).toString('hex');

  // SHA-256 hash stored in DB (prevents token theft from DB breach)
  const hashedToken = crypto
    .createHash('sha256')
    .update(rawToken)
    .digest('hex');

  const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

  return { rawToken, hashedToken, expiresAt };
};

/**
 * Hash a raw token for database lookup.
 * Used when verifying tokens from requests.
 * @param {string} rawToken - The token received from the user (via URL or email)
 */
const hashToken = (rawToken) => {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
};

module.exports = { generateToken, hashToken };
