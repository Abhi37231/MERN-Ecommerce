/**
 * couponController.js — Coupon Controller
 *
 * POST   /api/v1/coupons/validate   — validateCoupon (private)
 * GET    /api/v1/coupons            — getAllCoupons (admin)
 * POST   /api/v1/coupons            — createCoupon (admin)
 * PUT    /api/v1/coupons/:id        — updateCoupon (admin)
 * DELETE /api/v1/coupons/:id        — deleteCoupon (admin)
 */

const Coupon = require('../models/Coupon');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { sendSuccess, paginate } = require('../utils/apiResponse');

/**
 * @desc    Validate a coupon code (check if it's usable by the current user)
 * @route   POST /api/v1/coupons/validate
 * @access  Private
 */
const validateCoupon = asyncHandler(async (req, res, next) => {
  const { code, subtotal } = req.body;

  const coupon = await Coupon.findOne({ code: code?.toUpperCase() });

  if (!coupon || !coupon.isValid) {
    return next(new AppError('This coupon code is invalid or has expired.', 400));
  }

  if (!coupon.canUserUse(req.user._id)) {
    return next(new AppError('You have already used this coupon the maximum number of times.', 400));
  }

  if (subtotal !== undefined && subtotal < coupon.minOrderAmount) {
    return next(
      new AppError(
        `A minimum order of ₹${coupon.minOrderAmount} is required to use this coupon.`,
        400
      )
    );
  }

  const discount = subtotal ? coupon.calculateDiscount(Number(subtotal)) : null;

  sendSuccess(res, 200, 'Coupon is valid!', {
    coupon: {
      code: coupon.code,
      description: coupon.description,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minOrderAmount: coupon.minOrderAmount,
      maxDiscountAmount: coupon.maxDiscountAmount,
    },
    discount,
  });
});

/**
 * @desc    Get all coupons (admin)
 * @route   GET /api/v1/coupons
 * @access  Admin
 */
const getAllCoupons = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 20);
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.active === 'true') filter.isActive = true;
  if (req.query.active === 'false') filter.isActive = false;

  const [coupons, total] = await Promise.all([
    Coupon.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Coupon.countDocuments(filter),
  ]);

  sendSuccess(res, 200, 'Coupons retrieved.', { coupons }, paginate(page, limit, total));
});

/**
 * @desc    Create a new coupon (admin)
 * @route   POST /api/v1/coupons
 * @access  Admin
 */
const createCoupon = asyncHandler(async (req, res, next) => {
  const coupon = await Coupon.create(req.body);
  sendSuccess(res, 201, 'Coupon created successfully.', { coupon });
});

/**
 * @desc    Update a coupon (admin)
 * @route   PUT /api/v1/coupons/:id
 * @access  Admin
 */
const updateCoupon = asyncHandler(async (req, res, next) => {
  const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!coupon) return next(new AppError('Coupon not found.', 404));
  sendSuccess(res, 200, 'Coupon updated.', { coupon });
});

/**
 * @desc    Delete a coupon (admin)
 * @route   DELETE /api/v1/coupons/:id
 * @access  Admin
 */
const deleteCoupon = asyncHandler(async (req, res, next) => {
  const coupon = await Coupon.findByIdAndDelete(req.params.id);
  if (!coupon) return next(new AppError('Coupon not found.', 404));
  sendSuccess(res, 200, 'Coupon deleted.');
});

module.exports = {
  validateCoupon,
  getAllCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
};
