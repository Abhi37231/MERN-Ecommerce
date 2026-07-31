/**
 * userRoutes.js — User API Routes
 *
 * GET    /api/v1/users              — getAllUsers (admin)
 * GET    /api/v1/users/:id          — getUserById (admin)
 * PUT    /api/v1/users/:id          — updateUser (admin)
 * DELETE /api/v1/users/:id          — deleteUser (admin)
 *
 * Address endpoints (For currently logged in user)
 * POST   /api/v1/users/address      — addAddress (private)
 * GET    /api/v1/users/address      — getAddresses (private)
 * PUT    /api/v1/users/address/:id  — updateAddress (private)
 * DELETE /api/v1/users/address/:id  — deleteAddress (private)
 */

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// ─── Address Routes (Logged in user) ──────────────────────────────────────────
router.post('/address', userController.addAddress);
router.get('/address', userController.getAddresses);
router.put('/address/:id', userController.updateAddress);
router.delete('/address/:id', userController.deleteAddress);

// ─── Admin User Management Routes ─────────────────────────────────────────────
router.use(authorize('admin'));
router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

module.exports = router;
