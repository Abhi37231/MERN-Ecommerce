const CustomRequest = require('../models/CustomRequest');
const Order = require('../models/Order');
const cloudinary = require('../config/cloudinary');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/apiResponse');

/**
 * @desc    Create a new custom request
 * @route   POST /api/v1/custom-requests
 * @access  Private (User)
 */
const createRequest = asyncHandler(async (req, res, next) => {
  const { color, size, material, notes } = req.body;

  // Handle uploaded reference images
  const referenceImages = req.files
    ? req.files.map((file) => ({
        url: file.path,
        publicId: file.filename,
      }))
    : [];

  if (referenceImages.length === 0) {
    return next(new AppError('Please provide at least one reference image', 400));
  }

  const customRequest = await CustomRequest.create({
    user: req.user._id,
    referenceImages,
    specifications: {
      color,
      size,
      material,
      notes,
    },
  });

  sendSuccess(res, 201, 'Custom request submitted successfully.', { customRequest });
});

/**
 * @desc    Get user's custom requests
 * @route   GET /api/v1/custom-requests/my-requests
 * @access  Private (User)
 */
const getMyRequests = asyncHandler(async (req, res, next) => {
  const requests = await CustomRequest.find({ user: req.user._id }).sort({ createdAt: -1 });
  sendSuccess(res, 200, 'Requests retrieved.', { requests });
});

/**
 * @desc    Get all custom requests (Admin)
 * @route   GET /api/v1/custom-requests
 * @access  Private (Admin)
 */
const getAllRequests = asyncHandler(async (req, res, next) => {
  const requests = await CustomRequest.find()
    .populate('user', 'firstName lastName email')
    .sort({ createdAt: -1 });
  sendSuccess(res, 200, 'All requests retrieved.', { requests });
});

/**
 * @desc    Update custom request status/quote (Admin)
 * @route   PUT /api/v1/custom-requests/:id
 * @access  Private (Admin)
 */
const updateRequestStatus = asyncHandler(async (req, res, next) => {
  const { status, priceQuote, adminNotes } = req.body;
  const customRequest = await CustomRequest.findById(req.params.id);

  if (!customRequest) {
    return next(new AppError('Request not found.', 404));
  }

  if (status) customRequest.status = status;
  if (priceQuote !== undefined) customRequest.priceQuote = priceQuote;
  if (adminNotes !== undefined) customRequest.adminNotes = adminNotes;

  // If quote is provided and status is pending, we can auto-change it to quoted
  if (priceQuote && customRequest.status === 'pending') {
    customRequest.status = 'quoted';
  }

  await customRequest.save();
  sendSuccess(res, 200, 'Request updated successfully.', { customRequest });
});

/**
 * @desc    Accept quote and create dummy order (User)
 * @route   POST /api/v1/custom-requests/:id/accept
 * @access  Private (User)
 */
const acceptQuote = asyncHandler(async (req, res, next) => {
  const customRequest = await CustomRequest.findOne({ _id: req.params.id, user: req.user._id });

  if (!customRequest) {
    return next(new AppError('Request not found.', 404));
  }

  if (customRequest.status !== 'quoted') {
    return next(new AppError('This request is not in a quotable state.', 400));
  }

  customRequest.status = 'accepted';
  await customRequest.save();

  // Note: Actual ordering flow would involve the user going through checkout.
  // For now we just mark it as accepted. The user can then click 'Pay Now' from the frontend
  // which will hit the normal checkout endpoints, but we need a way to link it.
  
  sendSuccess(res, 200, 'Quote accepted.', { customRequest });
});

module.exports = {
  createRequest,
  getMyRequests,
  getAllRequests,
  updateRequestStatus,
  acceptQuote,
};
