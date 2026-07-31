/**
 * wishlistController.js — Wishlist Controller
 *
 * GET    /api/v1/wishlist         — getWishlist (private)
 * POST   /api/v1/wishlist/toggle  — toggleWishlist (private)
 * DELETE /api/v1/wishlist/:id     — removeFromWishlist (private)
 * DELETE /api/v1/wishlist         — clearWishlist (private)
 */

const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/apiResponse');

/**
 * @desc    Get user's wishlist
 * @route   GET /api/v1/wishlist
 * @access  Private
 */
const getWishlist = asyncHandler(async (req, res) => {
  let wishlist = await Wishlist.findOne({ user: req.user._id }).populate({
    path: 'products',
    select: 'name slug images price discountPercentage ratingsAverage stock isActive brand',
    populate: { path: 'category', select: 'name slug' },
  });

  if (!wishlist) {
    wishlist = await Wishlist.create({ user: req.user._id, products: [] });
  }

  sendSuccess(res, 200, 'Wishlist retrieved.', { wishlist });
});

/**
 * @desc    Toggle product in/out of wishlist
 * @route   POST /api/v1/wishlist/toggle
 * @access  Private
 */
const toggleWishlist = asyncHandler(async (req, res, next) => {
  const { productId } = req.body;

  const product = await Product.findById(productId);
  if (!product) return next(new AppError('Product not found.', 404));

  let wishlist = await Wishlist.findOne({ user: req.user._id });
  if (!wishlist) {
    wishlist = await Wishlist.create({ user: req.user._id, products: [] });
  }

  const isWishlisted = wishlist.products.includes(productId);

  if (isWishlisted) {
    wishlist.products.pull(productId);
    await wishlist.save();
    sendSuccess(res, 200, 'Removed from wishlist.', { isWishlisted: false });
  } else {
    wishlist.products.addToSet(productId);
    await wishlist.save();
    sendSuccess(res, 200, 'Added to wishlist.', { isWishlisted: true });
  }
});

/**
 * @desc    Remove a specific product from wishlist
 * @route   DELETE /api/v1/wishlist/:productId
 * @access  Private
 */
const removeFromWishlist = asyncHandler(async (req, res, next) => {
  const wishlist = await Wishlist.findOneAndUpdate(
    { user: req.user._id },
    { $pull: { products: req.params.productId } },
    { new: true }
  );

  if (!wishlist) return next(new AppError('Wishlist not found.', 404));
  sendSuccess(res, 200, 'Removed from wishlist.', { wishlist });
});

/**
 * @desc    Clear entire wishlist
 * @route   DELETE /api/v1/wishlist
 * @access  Private
 */
const clearWishlist = asyncHandler(async (req, res) => {
  const wishlist = await Wishlist.findOneAndUpdate(
    { user: req.user._id },
    { products: [] },
    { new: true }
  );
  sendSuccess(res, 200, 'Wishlist cleared.', { wishlist });
});

module.exports = {
  getWishlist,
  toggleWishlist,
  removeFromWishlist,
  clearWishlist,
};
