/**
 * productRoutes.js — Product API Routes
 *
 * GET    /api/v1/products                — getProducts (public)
 * GET    /api/v1/products/featured       — getFeaturedProducts (public)
 * GET    /api/v1/products/trending       — getTrendingProducts (public)
 * GET    /api/v1/products/new-arrivals   — getNewArrivals (public)
 * GET    /api/v1/products/low-stock      — getLowStockProducts (admin)
 * GET    /api/v1/products/:slug          — getProductBySlug (public)
 * GET    /api/v1/products/:id/related    — getRelatedProducts (public)
 * POST   /api/v1/products               — createProduct (admin)
 * PUT    /api/v1/products/:id           — updateProduct (admin)
 * DELETE /api/v1/products/:id           — deleteProduct (admin)
 * PATCH  /api/v1/products/:id/stock     — updateStock (admin)
 *
 * Note: Specific routes (featured, trending, etc.) MUST be defined
 * before /:slug or Express will try to match "featured" as a slug.
 */

const express = require('express');
const router = express.Router();

const productController = require('../controllers/productController');
const reviewController = require('../controllers/reviewController');
const { protect, authorize, optionalAuth } = require('../middleware/auth');
const { uploadProductImages, uploadReviewImages, handleUpload } = require('../config/multer');
const asyncHandler = require('../utils/asyncHandler');

// ─── Upload middleware ─────────────────────────────────────────────────────────
const uploadImages = asyncHandler(async (req, res, next) => {
  await handleUpload(uploadProductImages)(req, res);
  next();
});

const uploadReviews = asyncHandler(async (req, res, next) => {
  await handleUpload(uploadReviewImages)(req, res);
  next();
});

// ─── Public Routes (specific paths first) ────────────────────────────────────
router.get('/featured', productController.getFeaturedProducts);
router.get('/trending', productController.getTrendingProducts);
router.get('/new-arrivals', productController.getNewArrivals);

// ─── Admin Only ───────────────────────────────────────────────────────────────
router.get('/low-stock', protect, authorize('admin'), productController.getLowStockProducts);
router.get('/restock-requests', protect, authorize('admin'), productController.getRestockRequests);
router.delete('/restock-requests/:id', protect, authorize('admin'), productController.deleteRestockRequest);

// ─── Public (dynamic params — must come after specific paths) ────────────────
router.get('/', optionalAuth, productController.getProducts);
router.get('/:slug', productController.getProductBySlug);
router.get('/:id/related', productController.getRelatedProducts);

// ─── Authenticated ─────────────────────────────────────────────────────────────
router.post('/:id/restock', protect, productController.requestRestock);

// ─── Nested Review Routes ─────────────────────────────────────────────────────
router.get('/:productId/reviews', reviewController.getProductReviews);
router.post('/:productId/reviews', protect, uploadReviews, reviewController.createReview);

// ─── Admin CRUD ───────────────────────────────────────────────────────────────
router.post('/', protect, authorize('admin'), uploadImages, productController.createProduct);
router.put('/:id', protect, authorize('admin'), uploadImages, productController.updateProduct);
router.delete('/:id', protect, authorize('admin'), productController.deleteProduct);
router.patch('/:id/stock', protect, authorize('admin'), productController.updateStock);

module.exports = router;
