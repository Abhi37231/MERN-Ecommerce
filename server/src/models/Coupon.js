/**
 * Coupon.js — Coupon Mongoose Model
 *
 * Why this model exists:
 *  Coupons allow merchants to offer promotional discounts.
 *  Two discount types are supported:
 *   - 'percentage': e.g. 20% off (value = 20)
 *   - 'fixed': e.g. ₹200 off (value = 200)
 *
 * Key design decisions:
 *  - code: uppercase, unique coupon code (SAVE20, FIRST50, etc.)
 *  - usageLimit: maximum number of times the coupon can be used in total
 *  - usageLimitPerUser: each user can use the coupon at most N times
 *  - usedCount: how many times it has been used (incremented on order)
 *  - usedBy[]: tracks which users have used it (for per-user limit enforcement)
 *  - minOrderAmount: minimum cart value to apply coupon
 *  - maxDiscountAmount: cap on percentage discounts (e.g. max ₹500 off)
 *  - expiresAt: coupon automatically becomes invalid after this date
 */

const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Coupon code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: [20, 'Coupon code cannot exceed 20 characters'],
      match: [/^[A-Z0-9]+$/, 'Coupon code can only contain letters and numbers'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [200, 'Description cannot exceed 200 characters'],
    },
    discountType: {
      type: String,
      required: [true, 'Discount type is required'],
      enum: {
        values: ['percentage', 'fixed'],
        message: 'Discount type must be "percentage" or "fixed"',
      },
    },
    discountValue: {
      type: Number,
      required: [true, 'Discount value is required'],
      min: [0, 'Discount value cannot be negative'],
    },
    minOrderAmount: {
      type: Number,
      default: 0,
      min: [0, 'Minimum order amount cannot be negative'],
    },
    maxDiscountAmount: {
      type: Number,
      default: null, // null = no cap
      min: [0, 'Maximum discount cannot be negative'],
    },
    usageLimit: {
      type: Number,
      default: null, // null = unlimited
      min: [1, 'Usage limit must be at least 1'],
    },
    usageLimitPerUser: {
      type: Number,
      default: 1,
      min: [1, 'Per-user limit must be at least 1'],
    },
    usedCount: {
      type: Number,
      default: 0,
    },
    usedBy: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        usedAt: { type: Date, default: Date.now },
        count: { type: Number, default: 1 },
      },
    ],
    applicableProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      },
    ], // empty = applies to all products
    applicableCategories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
      },
    ], // empty = applies to all categories
    startsAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: [true, 'Expiry date is required'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);



// ─── Virtuals ────────────────────────────────────────────────────────────────

/** Whether the coupon is currently valid (active + not expired + not exhausted) */
couponSchema.virtual('isValid').get(function () {
  const now = new Date();
  const notExpired = this.expiresAt > now;
  const notStartedYet = this.startsAt > now;
  const notExhausted =
    this.usageLimit === null || this.usedCount < this.usageLimit;
  return this.isActive && notExpired && !notStartedYet && notExhausted;
});

// ─── Instance Methods ─────────────────────────────────────────────────────────

/**
 * Calculate the discount amount for a given order subtotal.
 * Respects maxDiscountAmount cap for percentage discounts.
 * @param {number} subtotal - Cart subtotal in rupees
 */
couponSchema.methods.calculateDiscount = function (subtotal) {
  if (subtotal < this.minOrderAmount) return 0;

  let discount = 0;
  if (this.discountType === 'percentage') {
    discount = (subtotal * this.discountValue) / 100;
    if (this.maxDiscountAmount !== null) {
      discount = Math.min(discount, this.maxDiscountAmount);
    }
  } else {
    // 'fixed'
    discount = this.discountValue;
  }

  return Math.min(discount, subtotal); // can't discount more than the total
};

/**
 * Check if a specific user can use this coupon.
 * @param {string} userId - MongoDB ObjectId as string
 */
couponSchema.methods.canUserUse = function (userId) {
  const userUsage = this.usedBy.find(
    (entry) => entry.user.toString() === userId.toString()
  );
  if (!userUsage) return true; // User hasn't used it yet
  return userUsage.count < this.usageLimitPerUser;
};

const Coupon = mongoose.model('Coupon', couponSchema);
module.exports = Coupon;
