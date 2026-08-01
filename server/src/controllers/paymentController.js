/**
 * paymentController.js — Razorpay Payment Controller
 *
 * POST   /api/v1/payment/create-order   — Create Razorpay order
 * POST   /api/v1/payment/verify         — Verify payment signature
 * GET    /api/v1/payment/history        — Get user's payment history
 */

const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const SiteSettings = require('../models/SiteSettings');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { sendSuccess, paginate } = require('../utils/apiResponse');
const { sendEmail, orderConfirmationTemplate } = require('../utils/sendEmail');
const {
  createOrder: createRazorpayOrder,
  verifyPayment,
  generateTransactionId,
} = require('../services/razorpayService');

/**
 * @desc    Create a Razorpay order for checkout
 * @route   POST /api/v1/payment/create-order
 * @access  Private
 */
const createRazorpayOrderCtrl = asyncHandler(async (req, res, next) => {
  // 1. Get user cart
  const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');

  if (!cart || cart.items.length === 0) {
    return next(new AppError('Your cart is empty.', 400));
  }

  // 2. Validate stock for all items
  for (const item of cart.items) {
    if (!item.product) {
      return next(new AppError(`A product "${item.name}" no longer exists.`, 400));
    }
    if (item.product.stock < item.quantity) {
      return next(new AppError(`Insufficient stock for "${item.name}". Available: ${item.product.stock}`, 400));
    }
  }

  // 3. Get Site Settings for Shipping and Tax
  const settings = await SiteSettings.findOne() || {};
  const baseShippingCost = settings.shippingCost ?? 50;
  const freeShippingThreshold = settings.freeShippingThreshold ?? 1000;
  const gstRate = settings.gstPercentage ?? 0;

  // 4. Calculate totals
  const subtotal = cart.subtotal;
  const couponDiscount = cart.couponDiscount || 0;
  const discountedSubtotal = Math.max(0, subtotal - couponDiscount);

  const shippingCost = discountedSubtotal > freeShippingThreshold ? 0 : baseShippingCost;
  const taxAmount = discountedSubtotal * (gstRate / 100);
  const totalAmount = discountedSubtotal + shippingCost + taxAmount;

  // 4. Validate minimum amount (Razorpay minimum is 100 paise = ₹1)
  if (totalAmount < 1) {
    return next(new AppError('Order amount must be at least ₹1.', 400));
  }

  // 5. Create order items snapshot
  const orderItems = cart.items.map(item => ({
    product: item.product._id,
    name: item.name,
    image: item.image,
    price: item.price,
    discountedPrice: item.discountedPrice,
    quantity: item.quantity,
    variant: item.variant,
    sku: item.product.sku,
  }));

  // 6. Create a pending order in DB
  const order = await Order.create({
    user: req.user._id,
    items: orderItems,
    shippingAddress: req.body.shippingAddress,
    subtotal,
    shippingCost,
    couponDiscount,
    couponCode: cart.couponCode,
    taxAmount,
    totalAmount,
    payment: {
      method: 'razorpay',
      status: 'pending',
    },
    status: 'pending',
    customerNote: req.body.customerNote || '',
  });

  // 7. Create Razorpay order
  const receipt = order.orderNumber;
  const razorpayOrder = await createRazorpayOrder({
    amount: totalAmount,
    currency: 'INR',
    receipt,
    notes: {
      userId: req.user._id.toString(),
      orderId: order._id.toString(),
    },
  });

  // 8. Save Razorpay order ID to the order
  order.razorpayOrderId = razorpayOrder.id;
  await order.save();

  sendSuccess(res, 201, 'Razorpay order created successfully.', {
    order: {
      _id: order._id,
      orderNumber: order.orderNumber,
      totalAmount: order.totalAmount,
      status: order.status,
    },
    razorpay: {
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    },
  });
});

/**
 * @desc    Verify Razorpay payment signature
 * @route   POST /api/v1/payment/verify
 * @access  Private
 */
const verifyPaymentCtrl = asyncHandler(async (req, res, next) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    orderId, // MongoDB Order ID
  } = req.body;

  // Validate required fields
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
    return next(new AppError('Missing payment verification fields.', 400));
  }

  // Verify signature server-side
  const isValid = verifyPayment({
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    signature: razorpay_signature,
  });

  if (!isValid) {
    return next(new AppError('Payment verification failed. Invalid signature.', 400));
  }

  // Find the order
  const order = await Order.findById(orderId);
  if (!order) {
    return next(new AppError('Order not found.', 404));
  }

  // Ensure this order belongs to the current user
  if (order.user.toString() !== req.user._id.toString()) {
    return next(new AppError('Unauthorized to verify this payment.', 403));
  }

  // Prevent double verification
  if (order.payment.status === 'paid') {
    return next(new AppError('Payment already verified.', 400));
  }

  // Generate transaction ID
  const transactionId = generateTransactionId(order._id);

  // Update order with payment details
  order.razorpayPaymentId = razorpay_payment_id;
  order.razorpaySignature = razorpay_signature;
  order.payment.status = 'paid';
  order.payment.transactionId = transactionId;
  order.payment.paidAt = new Date();
  order.status = 'confirmed';

  // Add status history entry
  order.statusHistory.push({
    status: 'confirmed',
    comment: 'Payment received and verified successfully.',
    updatedBy: req.user._id,
    updatedAt: new Date(),
  });

  await order.save();

  // Update coupon usage count if coupon was applied
  if (order.couponCode) {
    const coupon = await Coupon.findOne({ code: order.couponCode });
    if (coupon) {
      coupon.usedCount += 1;
      const userUsage = coupon.usedBy.find(
        (entry) => entry.user.toString() === req.user._id.toString()
      );
      if (userUsage) {
        userUsage.count += 1;
      } else {
        coupon.usedBy.push({ user: req.user._id });
      }
      await coupon.save();
    }
  }

  // Decrement product stock and increment sold count
  for (const item of order.items) {
    if (item.product) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity, soldCount: item.quantity },
      });
    }
  }

  // Clear the user's cart
  await Cart.findOneAndUpdate(
    { user: req.user._id },
    { items: [], coupon: null, couponCode: null, couponDiscount: 0 }
  );

  // Send confirmation email (fire-and-forget)
  try {
    sendEmail({
      to: req.user.email,
      subject: `Order Confirmed - ${order.orderNumber}`,
      html: orderConfirmationTemplate(
        req.user.firstName,
        order.orderNumber,
        order.totalAmount
      ),
    }).catch(emailError => console.error('Order confirmation email failed in background:', emailError.message));
  } catch (emailError) {
    console.error('Order confirmation email failed synchronously:', emailError.message);
  }

  sendSuccess(res, 200, 'Payment verified successfully. Order confirmed.', { order });
});

/**
 * @desc    Get payment history for the logged-in user
 * @route   GET /api/v1/payment/history
 * @access  Private
 */
const getPaymentHistory = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 20);
  const skip = (page - 1) * limit;

  const filter = {
    user: req.user._id,
    'payment.method': 'razorpay',
  };

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .select('orderNumber totalAmount payment status createdAt razorpayPaymentId razorpayOrderId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Order.countDocuments(filter),
  ]);

  sendSuccess(
    res,
    200,
    'Payment history retrieved.',
    { payments: orders },
    paginate(page, limit, total)
  );
});

module.exports = {
  createRazorpayOrderCtrl,
  verifyPaymentCtrl,
  getPaymentHistory,
};
