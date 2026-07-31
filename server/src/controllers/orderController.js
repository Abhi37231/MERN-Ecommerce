/**
 * orderController.js — Order Controller
 *
 * POST   /api/v1/orders               — createOrder (private, COD)
 * GET    /api/v1/orders/my-orders     — getMyOrders (private)
 * GET    /api/v1/orders/:id           — getOrderById (private)
 * GET    /api/v1/orders               — getAllOrders (admin)
 * PATCH  /api/v1/orders/:id/status    — updateOrderStatus (admin)
 * PATCH  /api/v1/orders/:id/payment   — updatePaymentStatus (admin)
 *
 * Note: Razorpay payment orders are handled in paymentController.
 *       This controller handles standard Cash on Delivery (COD) orders.
 */

const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { sendSuccess, paginate } = require('../utils/apiResponse');
const { sendEmail, orderConfirmationTemplate } = require('../utils/sendEmail');

/**
 * @desc    Create new order (COD)
 * @route   POST /api/v1/orders
 * @access  Private
 */
const createOrder = asyncHandler(async (req, res, next) => {
  const { shippingAddress, paymentMethod, customerNote } = req.body;

  if (!shippingAddress) {
    return next(new AppError('Shipping address is required.', 400));
  }

  // 1. Get user cart
  const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');

  if (!cart || cart.items.length === 0) {
    return next(new AppError('Your cart is empty.', 400));
  }

  // 2. Validate stock for all items
  for (const item of cart.items) {
    if (!item.product) {
       return next(new AppError('A product in your cart no longer exists.', 400));
    }
    if (item.product.stock < item.quantity) {
      return next(new AppError(`Insufficient stock for ${item.name}.`, 400));
    }
  }

  // 3. Calculate Totals
  const subtotal = cart.subtotal;
  const couponDiscount = cart.couponDiscount || 0;
  const shippingCost = subtotal > 1000 ? 0 : 50; // Free shipping over 1000
  const taxAmount = 0; // Assuming tax is included in price for now
  const totalAmount = subtotal - couponDiscount + shippingCost + taxAmount;

  // 4. Create Order Items from Cart Snapshot
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

  // 5. Build Order Document
  const order = await Order.create({
    user: req.user._id,
    items: orderItems,
    shippingAddress,
    subtotal,
    shippingCost,
    couponDiscount,
    couponCode: cart.couponCode,
    taxAmount,
    totalAmount,
    payment: {
      method: paymentMethod || 'cod',
      status: paymentMethod === 'cod' ? 'pending' : 'pending',
    },
    customerNote,
    status: 'pending',
  });

  // 6. Update Product Stock and Sold Count
  for (const item of cart.items) {
    await Product.findByIdAndUpdate(item.product._id, {
      $inc: { stock: -item.quantity, soldCount: item.quantity }
    });
  }

  // 7. Clear Cart
  await Cart.findOneAndUpdate(
    { user: req.user._id },
    { items: [], coupon: null, couponCode: null, couponDiscount: 0 }
  );

  // 8. Send Confirmation Email (Async)
  try {
    await sendEmail({
      to: req.user.email,
      subject: `Order Confirmation - ${order.orderNumber}`,
      html: orderConfirmationTemplate(req.user.firstName, order.orderNumber, order.totalAmount)
    });
  } catch (error) {
    console.error('Order confirmation email failed:', error);
  }

  sendSuccess(res, 201, 'Order placed successfully.', { order });
});

/**
 * @desc    Get logged in user orders
 * @route   GET /api/v1/orders/my-orders
 * @access  Private
 */
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  sendSuccess(res, 200, 'Orders retrieved.', { orders });
});

/**
 * @desc    Get order by ID
 * @route   GET /api/v1/orders/:id
 * @access  Private
 */
const getOrderById = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id).populate('user', 'firstName lastName email');

  if (!order) {
    return next(new AppError('Order not found.', 404));
  }

  // Ensure user is authorized to view this order
  if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new AppError('Not authorized to view this order.', 403));
  }

  sendSuccess(res, 200, 'Order retrieved.', { order });
});

/**
 * @desc    Cancel order by customer
 * @route   PATCH /api/v1/orders/:id/cancel
 * @access  Private
 */
const cancelMyOrder = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new AppError('Order not found.', 404));
  }

  // Ensure order belongs to user
  if (order.user.toString() !== req.user._id.toString()) {
    return next(new AppError('Not authorized to cancel this order.', 403));
  }

  // Ensure order is pending
  if (order.status !== 'pending' && order.status !== 'confirmed') {
    return next(new AppError(`Order cannot be cancelled in ${order.status} state.`, 400));
  }

  order.status = 'cancelled';
  order.cancelledAt = Date.now();
  order.cancellationReason = 'Cancelled by customer';
  
  // Refund stock
  for(const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.quantity, soldCount: -item.quantity }
      });
  }

  order.statusHistory.push({
    status: 'cancelled',
    comment: 'Order cancelled by customer',
    updatedBy: req.user._id,
    updatedAt: Date.now()
  });

  await order.save();

  sendSuccess(res, 200, 'Order cancelled successfully.', { order });
});

/**
 * @desc    Get all orders (Admin)
 * @route   GET /api/v1/orders
 * @access  Admin
 */
const getAllOrders = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 20);
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.status && req.query.status !== 'all') filter.status = req.query.status;
  if (req.query.paymentStatus && req.query.paymentStatus !== 'all') filter['payment.status'] = req.query.paymentStatus;
  if (req.query.paymentMethod && req.query.paymentMethod !== 'all') filter['payment.method'] = req.query.paymentMethod;

  // Date filtering
  if (req.query.startDate && req.query.endDate) {
      filter.createdAt = {
          $gte: new Date(req.query.startDate),
          $lte: new Date(req.query.endDate)
      };
  } else if (req.query.dateFilter) {
      const now = new Date();
      if (req.query.dateFilter === 'today') {
          now.setHours(0,0,0,0);
          filter.createdAt = { $gte: now };
      } else if (req.query.dateFilter === 'yesterday') {
          const yesterday = new Date(now);
          yesterday.setDate(yesterday.getDate() - 1);
          yesterday.setHours(0,0,0,0);
          const endYesterday = new Date(yesterday);
          endYesterday.setHours(23,59,59,999);
          filter.createdAt = { $gte: yesterday, $lte: endYesterday };
      } else if (req.query.dateFilter === 'last7days') {
          const last7 = new Date(now);
          last7.setDate(last7.getDate() - 7);
          filter.createdAt = { $gte: last7 };
      } else if (req.query.dateFilter === 'last30days') {
          const last30 = new Date(now);
          last30.setDate(last30.getDate() - 30);
          filter.createdAt = { $gte: last30 };
      } else if (req.query.dateFilter === 'thisMonth') {
          const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
          filter.createdAt = { $gte: firstDay };
      }
  }

  // Search
  if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      
      // Find matching users first
      const User = require('../models/User');
      const matchingUsers = await User.find({
          $or: [
              { firstName: searchRegex },
              { lastName: searchRegex },
              { email: searchRegex },
              { phone: searchRegex }
          ]
      }).select('_id');
      const userIds = matchingUsers.map(u => u._id);

      // Now filter orders
      filter.$or = [
          { orderNumber: searchRegex },
          { user: { $in: userIds } },
          { 'shippingAddress.phone': searchRegex },
          { 'shippingAddress.fullName': searchRegex }
      ];
  }

  // Sorting
  let sortOption = { createdAt: -1 };
  if (req.query.sort) {
      if (req.query.sort === 'oldest') sortOption = { createdAt: 1 };
      if (req.query.sort === 'highest') sortOption = { totalAmount: -1 };
      if (req.query.sort === 'lowest') sortOption = { totalAmount: 1 };
  }

  const [orders, total] = await Promise.all([
    Order.find(filter).populate('user', 'firstName lastName email').sort(sortOption).skip(skip).limit(limit),
    Order.countDocuments(filter)
  ]);

  sendSuccess(res, 200, 'Orders retrieved.', { orders }, paginate(page, limit, total));
});

/**
 * @desc    Update order status
 * @route   PATCH /api/v1/orders/:id/status
 * @access  Admin
 */
const updateOrderStatus = asyncHandler(async (req, res, next) => {
  const { status, comment, trackingNumber, trackingUrl, shippingProvider } = req.body;

  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new AppError('Order not found.', 404));
  }

  if (order.status === 'delivered') {
    return next(new AppError('Cannot update status of a delivered order.', 400));
  }
  
  if (order.status === 'cancelled') {
      return next(new AppError('Cannot update status of a cancelled order.', 400));
  }

  // Valid state transitions could be enforced here

  order.status = status;
  
  // Track shipping info if provided
  if (trackingNumber) order.trackingNumber = trackingNumber;
  if (trackingUrl) order.trackingUrl = trackingUrl;
  if (shippingProvider) order.shippingProvider = shippingProvider;
  
  if (status === 'delivered') order.deliveredAt = Date.now();
  if (status === 'cancelled') {
      order.cancelledAt = Date.now();
      order.cancellationReason = comment;
      
      // Refund stock
      for(const item of order.items) {
          await Product.findByIdAndUpdate(item.product, {
              $inc: { stock: item.quantity, soldCount: -item.quantity }
          });
      }
  }

  order.statusHistory.push({
    status,
    comment,
    updatedBy: req.user._id,
    updatedAt: Date.now()
  });

  await order.save();

  sendSuccess(res, 200, 'Order status updated.', { order });
});

/**
 * @desc    Update payment status
 * @route   PATCH /api/v1/orders/:id/payment
 * @access  Admin
 */
const updatePaymentStatus = asyncHandler(async (req, res, next) => {
    const { status, transactionId } = req.body;
    
    const order = await Order.findById(req.params.id);
    if(!order) return next(new AppError('Order not found', 404));
    
    order.payment.status = status;
    if(transactionId) order.payment.transactionId = transactionId;
    if(status === 'paid') order.payment.paidAt = Date.now();
    
    await order.save();
    
    sendSuccess(res, 200, 'Payment status updated', { order });
});

/**
 * @desc    Get order analytics
 * @route   GET /api/v1/orders/analytics
 * @access  Admin
 */
const getOrderAnalytics = asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [todayOrdersCount, todayRevenueResult, stats, statusCounts] = await Promise.all([
    Order.countDocuments({ createdAt: { $gte: today } }),
    Order.aggregate([
      { $match: { createdAt: { $gte: today }, status: { $ne: 'cancelled' } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]),
    Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $group: { _id: null, avgAmount: { $avg: '$totalAmount' } } }
    ]),
    Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ])
  ]);

  const todayRevenue = todayRevenueResult[0]?.total || 0;
  const avgOrderValue = stats[0]?.avgAmount || 0;

  const topCustomers = await Order.aggregate([
    { $match: { status: { $ne: 'cancelled' } } },
    { $group: { _id: '$user', totalSpent: { $sum: '$totalAmount' }, ordersCount: { $sum: 1 } } },
    { $sort: { totalSpent: -1 } },
    { $limit: 1 },
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
    { $unwind: '$user' },
    { $project: { name: { $concat: ['$user.firstName', ' ', '$user.lastName'] }, totalSpent: 1 } }
  ]);

  const repeatCustomersCount = await Order.aggregate([
    { $group: { _id: '$user', count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } },
    { $count: 'repeat' }
  ]);

  const analytics = {
    todayOrders: todayOrdersCount,
    todayRevenue,
    avgOrderValue,
    topCustomer: topCustomers[0] || null,
    repeatCustomers: repeatCustomersCount[0]?.repeat || 0,
    statusCounts: statusCounts.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
    }, {})
  };

  sendSuccess(res, 200, 'Order analytics retrieved', { analytics });
});

/**
 * @desc    Bulk update order statuses
 * @route   PATCH /api/v1/orders/bulk-update
 * @access  Admin
 */
const bulkUpdateOrders = asyncHandler(async (req, res, next) => {
  const { orderIds, status } = req.body;
  
  if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
    return next(new AppError('Please provide order IDs', 400));
  }

  const orders = await Order.find({
    _id: { $in: orderIds },
    status: { $nin: ['delivered', 'cancelled'] }
  });

  const updates = [];
  for (const order of orders) {
    order.status = status;
    order.statusHistory.push({
      status,
      comment: 'Bulk status update',
      updatedBy: req.user._id,
      updatedAt: Date.now()
    });
    if (status === 'delivered') order.deliveredAt = Date.now();
    if (status === 'cancelled') {
        order.cancelledAt = Date.now();
        order.cancellationReason = 'Cancelled via bulk action';
        for(const item of order.items) {
            updates.push(Product.findByIdAndUpdate(item.product, {
                $inc: { stock: item.quantity, soldCount: -item.quantity }
            }));
        }
    }
    updates.push(order.save());
  }

  await Promise.all(updates);
  sendSuccess(res, 200, `${orders.length} orders updated successfully.`);
});

/**
 * @desc    Update order admin note
 * @route   PATCH /api/v1/orders/:id/admin-note
 * @access  Admin
 */
const updateAdminNote = asyncHandler(async (req, res, next) => {
  const { adminNote } = req.body;
  const order = await Order.findById(req.params.id);
  
  if (!order) return next(new AppError('Order not found', 404));
  
  order.adminNote = adminNote;
  await order.save();
  
  sendSuccess(res, 200, 'Admin note updated', { order });
});

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelMyOrder,
  getAllOrders,
  updateOrderStatus,
  updatePaymentStatus,
  getOrderAnalytics,
  bulkUpdateOrders,
  updateAdminNote
};
