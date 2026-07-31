/**
 * Cart.js — Cart Mongoose Model
 *
 * Why this model exists:
 *  Each user has one persistent cart. Items persist across sessions
 *  (unlike localStorage). When the user logs in on a different device,
 *  their cart is intact.
 *
 * Key design decisions:
 *  - One cart per user (user field has unique constraint)
 *  - items[] embeds product snapshot at time of adding (price, name)
 *    plus a reference to the product for real-time stock checks
 *  - coupon: reference to an applied coupon document
 *  - Computed totals (subtotal, discount, total) are virtual — they're
 *    always recalculated, never stored, to ensure they're always current
 *    even if the product price changes
 *  - When a user adds a product that's already in the cart,
 *    the controller updates the quantity instead of adding a duplicate
 */

const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Cart item must reference a product'],
    },
    // Snapshot of product details at time of adding to cart
    name: { type: String, required: true },
    image: { type: String },
    price: { type: Number, required: true, min: 0 },
    discountedPrice: { type: Number, required: true, min: 0 },

    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
      max: [10, 'Cannot add more than 10 of the same item'],
      default: 1,
    },

    // Variant selected (if product has variants)
    variant: {
      size: String,
      color: String,
      colorHex: String,
    },
  },
  { _id: true, timestamps: true }
);

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Cart must belong to a user'],
      unique: true,
      // Note: `unique: true` auto-creates an index
    },
    items: [cartItemSchema],
    coupon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Coupon',
      default: null,
    },
    // Coupon discount snapshot (so we don't refetch coupon on every request)
    couponDiscount: {
      type: Number,
      default: 0,
    },
    couponCode: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Virtuals ────────────────────────────────────────────────────────────────

/** Total number of items in cart */
cartSchema.virtual('totalItems').get(function () {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

/** Subtotal (before coupon discount) */
cartSchema.virtual('subtotal').get(function () {
  return this.items.reduce(
    (sum, item) => sum + item.discountedPrice * item.quantity,
    0
  );
});

/** Final total (after coupon discount) */
cartSchema.virtual('total').get(function () {
  const subtotal = this.subtotal;
  return Math.max(0, subtotal - (this.couponDiscount || 0));
});

const Cart = mongoose.model('Cart', cartSchema);
module.exports = Cart;
