/**
 * razorpayService.js — Razorpay Payment Gateway Service
 *
 * Why this service exists:
 *  Encapsulates all Razorpay SDK interactions in one place. Controllers
 *  don't call Razorpay directly — they use this service. This makes it
 *  easy to maintain and test payment logic independently.
 *
 * Key responsibilities:
 *  - Create Razorpay orders (for initiating payments)
 *  - Verify payment signatures (server-side, never trust frontend)
 *  - Fetch payment details from Razorpay
 *  - Generate transaction IDs for database storage
 *
 * Environment variables required:
 *  RAZORPAY_KEY_ID      — Test/Live key ID from Razorpay Dashboard
 *  RAZORPAY_KEY_SECRET  — Test/Live key secret from Razorpay Dashboard
 *
 * Note: Initialization is lazy — the Razorpay instance is created only
 *       when the first API call is made. This allows the server to
 *       start without Razorpay credentials configured.
 */

const Razorpay = require('razorpay');
const crypto = require('crypto');
const AppError = require('../utils/AppError');

// ─── Lazy Initialization ─────────────────────────────────────────────────────

let _razorpay = null;

/**
 * Get or create the Razorpay instance.
 * Throws a clear error if credentials are missing from .env.
 */
const getRazorpay = () => {
  if (!_razorpay) {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new AppError(
        'Razorpay is not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your .env file.',
        500
      );
    }
    _razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return _razorpay;
};

// ─── Service Functions ───────────────────────────────────────────────────────

/**
 * Create a Razorpay order for payment.
 *
 * @param {object} params
 * @param {number} params.amount      - Amount in INR (will be converted to paise)
 * @param {string} params.currency    - Currency code (default: 'INR')
 * @param {string} params.receipt     - Unique receipt ID (typically orderNumber)
 * @param {object} params.notes       - Additional metadata (userId, orderId)
 * @returns {Promise<object>} Razorpay order object
 */
const createOrder = async ({ amount, currency = 'INR', receipt, notes = {} }) => {
  try {
    const razorpay = getRazorpay();
    const options = {
      amount: Math.round(amount * 100), // Razorpay expects paise
      currency,
      receipt,
      notes,
      payment_capture: 1, // Auto-capture payment
    };

    const order = await razorpay.orders.create(options);
    return {
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      status: order.status,
    };
  } catch (error) {
    throw new AppError(`Razorpay order creation failed: ${error.message}`, 500);
  }
};

/**
 * Verify Razorpay payment signature.
 * This MUST happen on the server — never trust the frontend payment status.
 *
 * @param {object} params
 * @param {string} params.orderId       - Razorpay order ID (order_...)
 * @param {string} params.paymentId     - Razorpay payment ID (pay_...)
 * @param {string} params.signature     - Razorpay signature from webhook/callback
 * @returns {boolean} Whether signature is valid
 */
const verifyPayment = ({ orderId, paymentId, signature }) => {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    return expectedSignature === signature;
  } catch (error) {
    return false;
  }
};

/**
 * Fetch payment details from Razorpay by payment ID.
 *
 * @param {string} paymentId - Razorpay payment ID (pay_...)
 * @returns {Promise<object>} Razorpay payment object
 */
const getPaymentById = async (paymentId) => {
  try {
    const razorpay = getRazorpay();
    const payment = await razorpay.payments.fetch(paymentId);
    return payment;
  } catch (error) {
    throw new AppError(`Failed to fetch payment details: ${error.message}`, 500);
  }
};

/**
 * Fetch all payments for a Razorpay order.
 *
 * @param {string} orderId - Razorpay order ID (order_...)
 * @returns {Promise<Array>} Array of Razorpay payment objects
 */
const getPaymentsForOrder = async (orderId) => {
  try {
    const razorpay = getRazorpay();
    const payments = await razorpay.orders.fetchPayments(orderId);
    return payments.items || payments;
  } catch (error) {
    throw new AppError(`Failed to fetch payments for order: ${error.message}`, 500);
  }
};

/**
 * Generate a unique transaction ID for database records.
 * Format: TXN-YYYYMMDD-XXXXXXXX (alphanumeric)
 *
 * @param {string} orderId - MongoDB Order ID (shortened form)
 * @returns {string} Unique transaction ID
 */
const generateTransactionId = (orderId = '') => {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  const shortId = orderId.toString().slice(-6).toUpperCase();
  return `TXN-${dateStr}-${shortId || random}`;
};

module.exports = {
  createOrder,
  verifyPayment,
  getPaymentById,
  getPaymentsForOrder,
  generateTransactionId,
};
