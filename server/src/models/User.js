/**
 * User.js — User Mongoose Model
 *
 * Why this model exists:
 *  Stores all user account data including authentication fields,
 *  profile info, role-based access control, and security tokens.
 *
 * Key design decisions:
 *  - Password is hashed with bcrypt (pre-save hook) — never stored in plain text
 *  - Password is excluded from all queries by default (select: false)
 *  - Separate token fields for email verification and password reset
 *    (these store hashed tokens, not raw tokens)
 *  - passwordChangedAt tracks when the password was last changed so
 *    JWTs issued before that time are automatically invalidated
 *  - roles: 'user' (default) and 'admin'
 *
 * Indexes:
 *  - email: unique + indexed (primary lookup field)
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxlength: [50, 'First name cannot exceed 50 characters'],
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      maxlength: [50, 'Last name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    phone: {
      type: String,
      trim: true,
      match: [/^[6-9]\d{9}$/, 'Please provide a valid 10-digit Indian phone number'],
    },
    avatar: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' }, // Cloudinary public_id for deletion
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Never returned in queries unless explicitly selected
    },
    role: {
      type: String,
      enum: {
        values: ['user', 'admin'],
        message: 'Role must be either "user" or "admin"',
      },
      default: 'user',
    },

    // ─── Email Verification ─────────────────────────────────────────────
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      select: false, // hashed token, never exposed in API
    },
    emailVerificationExpires: {
      type: Date,
      select: false,
    },

    // ─── Password Reset ──────────────────────────────────────────────────
    passwordResetToken: {
      type: String,
      select: false, // hashed token, never exposed in API
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
    passwordChangedAt: {
      type: Date,
      select: false,
    },

    // ─── Account Status ──────────────────────────────────────────────────
    isActive: {
      type: Boolean,
      default: true,
      select: false, // used internally, not exposed
    },

    // ─── Refresh Token (for token rotation) ─────────────────────────────
    refreshToken: {
      type: String,
      select: false,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ─────────────────────────────────────────────────────────────────
// Note: email index is auto-created by the `unique: true` constraint
userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });

// ─── Virtuals ────────────────────────────────────────────────────────────────

/** Full name — computed from firstName + lastName */
userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// ─── Pre-save Hooks ───────────────────────────────────────────────────────────

/**
 * Hash password before saving.
 * Only runs if the password field is modified (prevents re-hashing on profile updates).
 */
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  // Cost factor 12: good balance of security vs. performance
  this.password = await bcrypt.hash(this.password, 12);
});

/**
 * Set passwordChangedAt when password is modified (not on new user creation).
 * Subtract 1 second to handle timestamp precision edge cases with JWT iat.
 */
userSchema.pre('save', async function () {
  if (!this.isModified('password') || this.isNew) return;
  this.passwordChangedAt = Date.now() - 1000;
});

/**
 * Filter out inactive users from all find queries.
 * Soft-delete pattern: isActive=false users are "deleted" but data is preserved.
 */
userSchema.pre(/^find/, async function () {
  this.find({ isActive: { $ne: false } });
});

// ─── Instance Methods ─────────────────────────────────────────────────────────

/**
 * Compare a plain password with the hashed password stored in DB.
 * @param {string} candidatePassword - The plain text password from login request
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

/**
 * Check if password was changed after the JWT was issued.
 * @param {number} jwtTimestamp - The `iat` (issued at) from the JWT payload
 */
userSchema.methods.changedPasswordAfter = function (jwtTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return jwtTimestamp < changedTimestamp;
  }
  return false; // Password never changed
};

const User = mongoose.model('User', userSchema);
module.exports = User;
