/**
 * Review.js — Review Mongoose Model
 *
 * Why this model exists:
 *  Stores customer reviews and ratings for products. After each review
 *  is created/updated/deleted, a post-save hook recalculates and
 *  updates the product's ratingsAverage and ratingsCount fields.
 *
 * Key design decisions:
 *  - One review per user per product (compound unique index)
 *  - Static method calcAverageRatings: aggregates all reviews for a product
 *    and updates the Product document — denormalization for query speed
 *  - helpfulVotes: users can mark reviews as helpful
 *  - isVerifiedPurchase: set to true if the user actually ordered this product
 *  - images[]: customers can upload review photos
 */

const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Review must belong to a product'],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user'],
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    title: {
      type: String,
      trim: true,
      maxlength: [100, 'Review title cannot exceed 100 characters'],
    },
    comment: {
      type: String,
      required: [true, 'Review comment is required'],
      trim: true,
      minlength: [10, 'Comment must be at least 10 characters'],
      maxlength: [2000, 'Comment cannot exceed 2000 characters'],
    },
    images: [
      {
        url: { type: String },
        publicId: { type: String },
      },
    ],
    isVerifiedPurchase: {
      type: Boolean,
      default: false,
    },
    helpfulVotes: {
      type: Number,
      default: 0,
    },
    helpfulVotedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    isApproved: {
      type: Boolean,
      default: true, // Auto-approve; set false to require admin moderation
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ─────────────────────────────────────────────────────────────────

/** Each user can only review a product once */
reviewSchema.index({ product: 1, user: 1 }, { unique: true });
reviewSchema.index({ product: 1, isApproved: 1, createdAt: -1 });

// ─── Static Methods ───────────────────────────────────────────────────────────

/**
 * Recalculate and update product's ratingsAverage + ratingsCount.
 * Called after every create, update, or delete operation on a review.
 */
reviewSchema.statics.calcAverageRatings = async function (productId) {
  const stats = await this.aggregate([
    { $match: { product: productId, isApproved: true } },
    {
      $group: {
        _id: '$product',
        count: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  const Product = require('./Product');

  if (stats.length > 0) {
    await Product.findByIdAndUpdate(productId, {
      ratingsCount: stats[0].count,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    // No reviews remaining → reset to defaults
    await Product.findByIdAndUpdate(productId, {
      ratingsCount: 0,
      ratingsAverage: 0,
    });
  }
};

// ─── Post-save Hook ───────────────────────────────────────────────────────────

/** Recalculate ratings after a review is saved (created or updated) */
reviewSchema.post('save', function () {
  this.constructor.calcAverageRatings(this.product);
});

/** Recalculate ratings after a review is deleted */
reviewSchema.post('findOneAndDelete', function (doc) {
  if (doc) doc.constructor.calcAverageRatings(doc.product);
});

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
