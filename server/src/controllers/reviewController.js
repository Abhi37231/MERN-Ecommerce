/**
 * reviewController.js — Review Controller
 *
 * GET    /products/:productId/reviews    — getProductReviews (public)
 * POST   /products/:productId/reviews    — createReview (private)
 * PUT    /reviews/:id                    — updateReview (private, owner)
 * DELETE /reviews/:id                    — deleteReview (private, owner/admin)
 * PATCH  /reviews/:id/helpful            — markReviewHelpful (private)
 * PATCH  /reviews/:id/approve            — approveReview (admin)
 */

const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { sendSuccess, paginate } = require('../utils/apiResponse');

/**
 * @desc    Get all reviews across all products (Admin)
 * @route   GET /api/v1/reviews
 * @access  Admin
 */
const getAllReviews = asyncHandler(async (req, res, next) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 20);
  const skip = (page - 1) * limit;

  const [reviews, total] = await Promise.all([
    Review.find()
      .populate('user', 'firstName lastName avatar email')
      .populate('product', 'name slug images')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Review.countDocuments(),
  ]);

  sendSuccess(res, 200, 'All reviews retrieved.', { reviews }, paginate(page, limit, total));
});

/**
 * @desc    Get all approved reviews for a product
 * @route   GET /api/v1/products/:productId/reviews
 * @access  Public
 */
const getProductReviews = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.productId);
  if (!product) return next(new AppError('Product not found.', 404));

  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(20, parseInt(req.query.limit) || 10);
  const skip = (page - 1) * limit;

  const filter = { product: req.params.productId, isApproved: true };

  // Rating filter
  if (req.query.rating) {
    filter.rating = Number(req.query.rating);
  }

  // Sort
  const sortMap = {
    newest: { createdAt: -1 },
    helpful: { helpfulVotes: -1 },
    rating_high: { rating: -1 },
    rating_low: { rating: 1 },
  };
  const sort = sortMap[req.query.sortBy] || { createdAt: -1 };

  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .populate('user', 'firstName lastName avatar')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Review.countDocuments(filter),
  ]);

  // Rating summary (1-5 star distribution)
  const ratingSummary = await Review.aggregate([
    { $match: { product: product._id, isApproved: true } },
    { $group: { _id: '$rating', count: { $sum: 1 } } },
    { $sort: { _id: -1 } },
  ]);

  sendSuccess(
    res,
    200,
    'Reviews retrieved.',
    { reviews, ratingSummary },
    paginate(page, limit, total)
  );
});

/**
 * @desc    Create a review (one per user per product)
 * @route   POST /api/v1/products/:productId/reviews
 * @access  Private
 */
const createReview = asyncHandler(async (req, res, next) => {
  const { rating, title, comment } = req.body;

  const product = await Product.findById(req.params.productId);
  if (!product) return next(new AppError('Product not found.', 404));

  // Check if user already reviewed this product
  const existingReview = await Review.findOne({
    product: req.params.productId,
    user: req.user._id,
  });
  if (existingReview) {
    return next(new AppError('You have already reviewed this product.', 400));
  }

  // Check if user is a verified purchaser (optional — adds credibility)
  const hasOrdered = await Order.exists({
    user: req.user._id,
    'items.product': req.params.productId,
    status: 'delivered',
  });

  // Extract uploaded images
  let images = [];
  if (req.files && req.files.length > 0) {
    images = req.files.map(file => ({
      url: file.path,
      publicId: file.filename,
    }));
  }

  const review = await Review.create({
    product: req.params.productId,
    user: req.user._id,
    rating: Number(rating),
    title,
    comment,
    images,
    isVerifiedPurchase: !!hasOrdered,
  });

  await review.populate('user', 'firstName lastName avatar');
  sendSuccess(res, 201, 'Review submitted successfully.', { review });
});

/**
 * @desc    Update own review
 * @route   PUT /api/v1/reviews/:id
 * @access  Private (owner)
 */
const updateReview = asyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.id);

  if (!review) return next(new AppError('Review not found.', 404));

  // Only the review owner or admin can update it
  if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new AppError('You can only edit your own reviews.', 403));
  }

  const { rating, title, comment } = req.body;
  if (rating) review.rating = Number(rating);
  if (title) review.title = title;
  if (comment) review.comment = comment;

  await review.save();
  sendSuccess(res, 200, 'Review updated.', { review });
});

/**
 * @desc    Delete a review
 * @route   DELETE /api/v1/reviews/:id
 * @access  Private (owner or admin)
 */
const deleteReview = asyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.id);
  if (!review) return next(new AppError('Review not found.', 404));

  const isOwner = review.user.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isAdmin) {
    return next(new AppError('You are not authorized to delete this review.', 403));
  }

  await review.deleteOne();
  // Rating recalculation happens via post('findOneAndDelete') hook in Review model
  sendSuccess(res, 200, 'Review deleted.');
});

/**
 * @desc    Mark a review as helpful
 * @route   PATCH /api/v1/reviews/:id/helpful
 * @access  Private
 */
const markReviewHelpful = asyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.id);
  if (!review) return next(new AppError('Review not found.', 404));

  const userId = req.user._id;
  const alreadyVoted = review.helpfulVotedBy.includes(userId);

  if (alreadyVoted) {
    // Toggle off (un-vote)
    review.helpfulVotedBy.pull(userId);
    review.helpfulVotes = Math.max(0, review.helpfulVotes - 1);
  } else {
    review.helpfulVotedBy.push(userId);
    review.helpfulVotes += 1;
  }

  await review.save();
  sendSuccess(res, 200, alreadyVoted ? 'Vote removed.' : 'Marked as helpful.', {
    helpfulVotes: review.helpfulVotes,
  });
});

/**
 * @desc    Approve or unapprove a review (admin)
 * @route   PATCH /api/v1/reviews/:id/approve
 * @access  Admin
 */
const approveReview = asyncHandler(async (req, res, next) => {
  const review = await Review.findByIdAndUpdate(
    req.params.id,
    { isApproved: req.body.isApproved },
    { new: true }
  );
  if (!review) return next(new AppError('Review not found.', 404));

  // Recalculate ratings after approval status changes
  await Review.calcAverageRatings(review.product);

  sendSuccess(res, 200, 'Review approval status updated.', { review });
});

module.exports = {
  getAllReviews,
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
  markReviewHelpful,
  approveReview,
};
