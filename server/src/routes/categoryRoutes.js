/**
 * categoryRoutes.js — Category API Routes
 *
 * GET    /api/v1/categories           — getCategories (public)
 * GET    /api/v1/categories/:slug     — getCategoryBySlug (public)
 * POST   /api/v1/categories           — createCategory (admin)
 * PUT    /api/v1/categories/:id       — updateCategory (admin)
 * DELETE /api/v1/categories/:id       — deleteCategory (admin)
 */

const express = require('express');
const router = express.Router();

const categoryController = require('../controllers/categoryController');
const { protect, authorize } = require('../middleware/auth');
const { uploadCategoryImage, handleUpload } = require('../config/multer');
const asyncHandler = require('../utils/asyncHandler');

// Public routes
router.get('/', categoryController.getCategories);
router.get('/:slug', categoryController.getCategoryBySlug);

// Admin routes (protect + authorize wraps all below)
router.use(protect, authorize('admin'));

router.post(
  '/',
  asyncHandler(async (req, res, next) => {
    await handleUpload(uploadCategoryImage)(req, res);
    next();
  }),
  categoryController.createCategory
);

router.put(
  '/:id',
  asyncHandler(async (req, res, next) => {
    await handleUpload(uploadCategoryImage)(req, res);
    next();
  }),
  categoryController.updateCategory
);

router.delete('/:id', categoryController.deleteCategory);

module.exports = router;
