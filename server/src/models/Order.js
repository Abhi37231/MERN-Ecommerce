/**
 * Order.js — Order Mongoose Model
 *
 * Why this model exists:
 *  Represents a completed purchase transaction. Once an order is created:
 *   - Cart is cleared
 *   - Product stock is decremented
 *   - An email confirmation is sent
 *
 * Key design decisions:
 *  - orderNumber: human-readable unique identifier (e.g. SS-2024-001234)
 *    generated via pre-save hook, separate from MongoDB _id
 *  - items[]: snapshot of products at time of order (name, price, image)
 *    This is critical — if a product is deleted or its price changes,
 *    historical orders remain accurate
 *  - shippingAddress: embedded address snapshot (not a ref)
 *    Same reason — if user edits/deletes their address, order is unaffected
 *  - payment: tracks payment method, status, and transaction ID
 *  - statusHistory[]: complete timeline of status changes (like tracking)
 *  - estimatedDelivery: set when order ships
 *
 * Status flow:
 *  pending → confirmed → processing → shipped → delivered
 *                    ↘ cancelled (at any point before shipped)
 */

const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
    },
    // Snapshot fields (preserve historical data)
    name: { type: String, required: true },
    image: { type: String },
    price: { type: Number, required: true },
    discountedPrice: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    variant: {
      size: String,
      color: String,
    },
    sku: { type: String },
  },
  { _id: true }
);

const statusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    comment: { type: String },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const shippingAddressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    addressLine1: { type: String, required: true },
    addressLine2: { type: String },
    landmark: { type: String },
    tal: { type: String },
    dist: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    country: { type: String, default: 'India' },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Order must belong to a user'],
      index: true,
    },
    items: {
      type: [orderItemSchema],
      validate: {
        validator: (v) => v.length > 0,
        message: 'Order must have at least one item',
      },
    },
    shippingAddress: {
      type: shippingAddressSchema,
      required: [true, 'Shipping address is required'],
    },

    // ─── Pricing ─────────────────────────────────────────────────────────
    subtotal: { type: Number, required: true },
    shippingCost: { type: Number, default: 0 },
    couponDiscount: { type: Number, default: 0 },
    couponCode: { type: String },
    taxAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },

    // ─── Payment ─────────────────────────────────────────────────────────
    payment: {
      method: {
        type: String,
        enum: {
          values: ['cod', 'razorpay', 'upi'],
          message: 'Invalid payment method',
        },
        default: 'cod',
      },
      status: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded'],
        default: 'pending',
      },
      transactionId: { type: String },
      paidAt: { type: Date },
    },

    // ─── Razorpay Details ────────────────────────────────────────────────
    razorpayOrderId: { type: String, default: null },
    razorpayPaymentId: { type: String, default: null },
    razorpaySignature: { type: String, default: null },

    // ─── Order Status ─────────────────────────────────────────────────────
    status: {
      type: String,
      enum: {
        values: ['pending', 'confirmed', 'processing', 'packed', 'shipped', 'delivered', 'cancelled', 'refunded'],
        message: 'Invalid order status',
      },
      default: 'pending',
    },
    statusHistory: [statusHistorySchema],

    // ─── Shipping ─────────────────────────────────────────────────────────
    trackingNumber: { type: String },
    trackingUrl: { type: String },
    shippingProvider: { type: String },
    estimatedDelivery: { type: Date },
    deliveredAt: { type: Date },
    cancelledAt: { type: Date },
    cancellationReason: { type: String },

    // ─── Notes ────────────────────────────────────────────────────────────
    customerNote: { type: String, maxlength: 500 },
    adminNote: { type: String, maxlength: 500 },

    isReviewed: {
      type: Boolean,
      default: false, // set true when user submits a review
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ─────────────────────────────────────────────────────────────────
// Note: orderNumber index is auto-created by the `unique: true` constraint
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ 'payment.status': 1 });

// ─── Pre-save Hook — Generate order number ───────────────────────────────────

/**
 * Generate a unique, human-readable order number.
 * Format: SS-YYYY-XXXXXX (e.g. SS-2024-004821)
 * Uses the document count + 1 as the sequence.
 */
orderSchema.pre('save', async function (next) {
  if (!this.isNew) return next();

  try {
    const lastOrder = await this.constructor.findOne().sort({ createdAt: -1 });
    let sequenceNum = 1;
    
    if (lastOrder && lastOrder.orderNumber) {
      const parts = lastOrder.orderNumber.split('-');
      if (parts.length === 3) {
        const parsed = parseInt(parts[2], 10);
        if (!isNaN(parsed)) {
          sequenceNum = parsed + 1;
        }
      }
    } else {
      const count = await this.constructor.countDocuments();
      sequenceNum = count + 1;
    }

    const year = new Date().getFullYear();
    const sequence = String(sequenceNum).padStart(6, '0');
    this.orderNumber = `SS-${year}-${sequence}`;

    // Add initial status to history
    this.statusHistory.push({
      status: this.status,
      comment: 'Order placed successfully',
      updatedAt: new Date(),
    });
    
    next();
  } catch (error) {
    next(error);
  }
});

// ─── Virtuals ────────────────────────────────────────────────────────────────

/** Total quantity of items in this order */
orderSchema.virtual('totalItems').get(function () {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
