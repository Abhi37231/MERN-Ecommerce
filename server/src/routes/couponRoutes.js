/**
 * couponRoutes.js — Coupon API Routes
 *
 * POST   /api/v1/coupons/validate   — validateCoupon (private)
 * GET    /api/v1/coupons            — getAllCoupons (admin)
 * POST   /api/v1/coupons            — createCoupon (admin)
 * PUT    /api/v1/coupons/:id        — updateCoupon (admin)
 * DELETE /api/v1/coupons/:id        — deleteCoupon (admin)
 */

const express = require('express');
const router = express.Router();
const couponController = require('../controllers/couponController');
const { protect, authorize } = require('../middleware/auth');

// User routes
router.post('/validate', protect, couponController.validateCoupon);

// Admin routes
router.use(protect, authorize('admin'));
router.get('/', couponController.getAllCoupons);
router.post('/', couponController.createCoupon);
router.put('/:id', couponController.updateCoupon);
router.delete('/:id', couponController.deleteCoupon);

module.exports = router;
