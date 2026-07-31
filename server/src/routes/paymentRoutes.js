/**
 * paymentRoutes.js — Payment API Routes (Razorpay)
 *
 * POST   /api/v1/payment/create-order   — Create Razorpay order (private)
 * POST   /api/v1/payment/verify         — Verify payment signature (private)
 * GET    /api/v1/payment/history        — Get payment history (private)
 */

const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

// All payment routes require authentication
router.use(protect);

router.post('/create-order', paymentController.createRazorpayOrderCtrl);
router.post('/verify', paymentController.verifyPaymentCtrl);
router.get('/history', paymentController.getPaymentHistory);

module.exports = router;
