const express = require('express');
const {
  createRequest,
  getMyRequests,
  getAllRequests,
  updateRequestStatus,
  acceptQuote,
  addMessage,
  deleteRequest,
} = require('../controllers/customRequestController');
const { protect, authorize } = require('../middleware/auth');
const { uploadReferenceImages, handleUpload } = require('../config/multer');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

const uploadImages = asyncHandler(async (req, res, next) => {
  await handleUpload(uploadReferenceImages)(req, res);
  next();
});

// User routes
router.use(protect);

router.post('/', uploadImages, createRequest);
router.get('/my-requests', getMyRequests);
router.post('/:id/accept', acceptQuote);
router.post('/:id/messages', addMessage);

// Admin routes
router.use(authorize('admin'));
router.get('/', getAllRequests);
router.put('/:id', updateRequestStatus);
router.delete('/:id', deleteRequest);

module.exports = router;
