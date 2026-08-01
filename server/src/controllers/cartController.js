/**
 * cartController.js — Shopping Cart Controller
 *
 * GET    /api/v1/cart          — getCart (private)
 * POST   /api/v1/cart/add      — addToCart (private)
 * PUT    /api/v1/cart/update   — updateCartItem (private)
 * DELETE /api/v1/cart/:itemId  — removeFromCart (private)
 * DELETE /api/v1/cart          — clearCart (private)
 * POST   /api/v1/cart/coupon   — applyCoupon (private)
 * DELETE /api/v1/cart/coupon   — removeCoupon (private)
 */

const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/apiResponse');

/**
 * Helper: Get or create user's cart with populated products.
 */
const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId }).populate({
    path: 'items.product',
    select: 'name images price discountPercentage stock isActive slug codAvailable',
  });

  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }
  return cart;
};

/**
 * @desc    Get user's cart
 * @route   GET /api/v1/cart
 * @access  Private
 */
const getCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  sendSuccess(res, 200, 'Cart retrieved.', { cart });
});

/**
 * @desc    Add item to cart
 * @route   POST /api/v1/cart/add
 * @access  Private
 */
const addToCart = asyncHandler(async (req, res, next) => {
  const { productId, quantity = 1, variant } = req.body;

  const product = await Product.findById(productId);
  if (!product) return next(new AppError('Product not found.', 404));
  if (!product.isActive) return next(new AppError('Product is no longer available.', 400));
  if (product.stock < 1) return next(new AppError('Product is out of stock.', 400));

  const cart = await getOrCreateCart(req.user._id);

  // Check if item already in cart (match by product + variant)
  const existingItemIndex = cart.items.findIndex(
    (item) =>
      item.product._id.toString() === productId &&
      JSON.stringify(item.variant) === JSON.stringify(variant || {})
  );

  if (existingItemIndex > -1) {
    const newQty = cart.items[existingItemIndex].quantity + quantity;
    if (newQty > 10) return next(new AppError('Maximum 10 units per item allowed.', 400));
    if (newQty > product.stock) {
      return next(new AppError(`Only ${product.stock} units available in stock.`, 400));
    }
    cart.items[existingItemIndex].quantity = newQty;
  } else {
    const discountedPrice =
      product.discountPercentage > 0
        ? Math.round(product.price * (1 - product.discountPercentage / 100))
        : product.price;

    cart.items.push({
      product: productId,
      name: product.name,
      image: product.images[0]?.url || '',
      price: product.price,
      discountedPrice,
      quantity,
      variant: variant || {},
    });
  }

  await cart.save();
  await cart.populate({
    path: 'items.product',
    select: 'name images price discountPercentage stock isActive slug codAvailable',
  });

  sendSuccess(res, 200, 'Item added to cart.', { cart });
});

/**
 * @desc    Update cart item quantity
 * @route   PUT /api/v1/cart/update
 * @access  Private
 */
const updateCartItem = asyncHandler(async (req, res, next) => {
  const { itemId, quantity } = req.body;

  if (!quantity || quantity < 1) {
    return next(new AppError('Quantity must be at least 1.', 400));
  }

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) return next(new AppError('Cart not found.', 404));

  const item = cart.items.id(itemId);
  if (!item) return next(new AppError('Item not found in cart.', 404));

  // Validate against current stock
  const product = await Product.findById(item.product);
  if (product && quantity > product.stock) {
    return next(new AppError(`Only ${product.stock} units available.`, 400));
  }

  item.quantity = quantity;
  await cart.save();

  await cart.populate({
    path: 'items.product',
    select: 'name images price discountPercentage stock isActive slug codAvailable',
  });

  sendSuccess(res, 200, 'Cart updated.', { cart });
});

/**
 * @desc    Remove item from cart
 * @route   DELETE /api/v1/cart/:itemId
 * @access  Private
 */
const removeFromCart = asyncHandler(async (req, res, next) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) return next(new AppError('Cart not found.', 404));

  cart.items = cart.items.filter(
    (item) => item._id.toString() !== req.params.itemId
  );

  await cart.save();
  sendSuccess(res, 200, 'Item removed from cart.', { cart });
});

/**
 * @desc    Clear entire cart
 * @route   DELETE /api/v1/cart
 * @access  Private
 */
const clearCart = asyncHandler(async (req, res, next) => {
  const cart = await Cart.findOneAndUpdate(
    { user: req.user._id },
    { items: [], coupon: null, couponDiscount: 0, couponCode: null },
    { new: true }
  );
  sendSuccess(res, 200, 'Cart cleared.', { cart });
});

/**
 * @desc    Apply a coupon code to cart
 * @route   POST /api/v1/cart/coupon
 * @access  Private
 */
const applyCoupon = asyncHandler(async (req, res, next) => {
  const { code } = req.body;

  const coupon = await Coupon.findOne({ code: code.toUpperCase() });

  if (!coupon || !coupon.isValid) {
    return next(new AppError('Invalid or expired coupon code.', 400));
  }

  if (!coupon.canUserUse(req.user._id)) {
    return next(new AppError('You have reached the usage limit for this coupon.', 400));
  }

  const cart = await Cart.findOne({ user: req.user._id }).populate({
    path: 'items.product',
    select: 'price discountPercentage stock',
  });

  if (!cart || cart.items.length === 0) {
    return next(new AppError('Your cart is empty.', 400));
  }

  const subtotal = cart.subtotal;

  if (subtotal < coupon.minOrderAmount) {
    return next(
      new AppError(
        `Minimum order amount of ₹${coupon.minOrderAmount} required for this coupon.`,
        400
      )
    );
  }

  const discount = coupon.calculateDiscount(subtotal);

  cart.coupon = coupon._id;
  cart.couponCode = coupon.code;
  cart.couponDiscount = discount;
  await cart.save();

  sendSuccess(res, 200, `Coupon "${coupon.code}" applied! You save ₹${discount.toFixed(2)}.`, {
    cart,
    discount,
    couponCode: coupon.code,
  });
});

/**
 * @desc    Remove applied coupon from cart
 * @route   DELETE /api/v1/cart/coupon
 * @access  Private
 */
const removeCoupon = asyncHandler(async (req, res, next) => {
  const cart = await Cart.findOneAndUpdate(
    { user: req.user._id },
    { coupon: null, couponCode: null, couponDiscount: 0 },
    { new: true }
  );
  sendSuccess(res, 200, 'Coupon removed.', { cart });
});

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  applyCoupon,
  removeCoupon,
};
