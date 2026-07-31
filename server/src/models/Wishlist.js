/**
 * Wishlist.js — Wishlist Mongoose Model
 *
 * Why this model exists:
 *  Users can save products they're interested in but not ready to buy.
 *  One wishlist per user, containing an array of product references.
 *
 * Key design decisions:
 *  - One wishlist per user (unique: true on user field)
 *  - products[]: simple array of ObjectId refs, no quantity or variant
 *  - The toggle operation (add if not exists, remove if exists) is
 *    handled in the controller using $addToSet and $pull operators
 */

const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Wishlist must belong to a user'],
      unique: true,
      // Note: `unique: true` auto-creates an index
    },
    products: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Virtuals ────────────────────────────────────────────────────────────────

/** Total number of items in wishlist */
wishlistSchema.virtual('totalItems').get(function () {
  return this.products.length;
});

const Wishlist = mongoose.model('Wishlist', wishlistSchema);
module.exports = Wishlist;
