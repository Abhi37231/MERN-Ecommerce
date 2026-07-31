/**
 * orderRoutes.js — Order API Routes
 *
 * POST   /api/v1/orders               — createOrder (private)
 * GET    /api/v1/orders/my-orders     — getMyOrders (private)
 * GET    /api/v1/orders/:id           — getOrderById (private)
 * GET    /api/v1/orders               — getAllOrders (admin)
 * PATCH  /api/v1/orders/:id/status    — updateOrderStatus (admin)
 * PATCH  /api/v1/orders/:id/payment   — updatePaymentStatus (admin)
 */

const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');

// Apply protect middleware to all routes below
router.use(protect);

// Admin explicit routes (must be before /:id to avoid ID conflict)
router.get('/analytics', authorize('admin'), orderController.getOrderAnalytics);
router.patch('/bulk-update', authorize('admin'), orderController.bulkUpdateOrders);

router.post('/', orderController.createOrder);
router.get('/my-orders', orderController.getMyOrders);
router.get('/:id', orderController.getOrderById);
router.patch('/:id/cancel', orderController.cancelMyOrder);

// Admin only routes (applies to all below)
router.use(authorize('admin'));
router.get('/', orderController.getAllOrders);
router.patch('/:id/status', orderController.updateOrderStatus);
router.patch('/:id/payment', orderController.updatePaymentStatus);
router.patch('/:id/admin-note', orderController.updateAdminNote);

module.exports = router;
