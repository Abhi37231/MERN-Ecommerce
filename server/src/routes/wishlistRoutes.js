/**
 * wishlistRoutes.js — Wishlist API Routes
 *
 * GET    /api/v1/wishlist         — getWishlist (private)
 * POST   /api/v1/wishlist/toggle  — toggleWishlist (private)
 * DELETE /api/v1/wishlist/:id     — removeFromWishlist (private)
 * DELETE /api/v1/wishlist         — clearWishlist (private)
 */

const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlistController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', wishlistController.getWishlist);
router.post('/toggle', wishlistController.toggleWishlist);
router.delete('/:productId', wishlistController.removeFromWishlist);
router.delete('/', wishlistController.clearWishlist);

module.exports = router;
