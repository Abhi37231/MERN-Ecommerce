/**
 * reviewRoutes.js — Standalone Review Routes
 *
 * Review creation and listing live under /products/:productId/reviews in productRoutes.
 * This file handles standalone review operations by review ID.
 *
 * PUT    /api/v1/reviews/:id           — updateReview (private, owner)
 * DELETE /api/v1/reviews/:id           — deleteReview (private, owner/admin)
 * PATCH  /api/v1/reviews/:id/helpful   — markReviewHelpful (private)
 * PATCH  /api/v1/reviews/:id/approve   — approveReview (admin)
 */

const express = require('express');
const router = express.Router();

const reviewController = require('../controllers/reviewController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, authorize('admin'), reviewController.getAllReviews);
router.put('/:id', protect, reviewController.updateReview);
router.delete('/:id', protect, reviewController.deleteReview);
router.patch('/:id/helpful', protect, reviewController.markReviewHelpful);
router.patch('/:id/approve', protect, authorize('admin'), reviewController.approveReview);

module.exports = router;
