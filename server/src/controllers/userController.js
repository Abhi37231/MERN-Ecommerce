/**
 * userController.js — User Controller
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

const User = require('../models/User');
const Address = require('../models/Address');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { sendSuccess, paginate } = require('../utils/apiResponse');

// ─── Admin User Management ───────────────────────────────────────────────────

/**
 * @desc    Get all users
 * @route   GET /api/v1/users
 * @access  Admin
 */
const getAllUsers = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 20);
  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    User.find().select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments()
  ]);

  sendSuccess(res, 200, 'Users retrieved', { users }, paginate(page, limit, total));
});

/**
 * @desc    Get single user by ID
 * @route   GET /api/v1/users/:id
 * @access  Admin
 */
const getUserById = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) return next(new AppError('User not found', 404));
  sendSuccess(res, 200, 'User retrieved', { user });
});

/**
 * @desc    Update user (e.g. role, active status)
 * @route   PUT /api/v1/users/:id
 * @access  Admin
 */
const updateUser = asyncHandler(async (req, res, next) => {
  // Prevent admin from locking themselves out (though a super admin role might be better here)
  if (req.user._id.toString() === req.params.id && req.body.role && req.body.role !== 'admin') {
     return next(new AppError('You cannot change your own role from admin.', 400));
  }

  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  }).select('-password');

  if (!user) return next(new AppError('User not found', 404));

  sendSuccess(res, 200, 'User updated', { user });
});

/**
 * @desc    Delete user
 * @route   DELETE /api/v1/users/:id
 * @access  Admin
 */
const deleteUser = asyncHandler(async (req, res, next) => {
  if (req.user._id.toString() === req.params.id) {
    return next(new AppError('You cannot delete your own account.', 400));
  }
  
  // We do soft deletes in the model, but for admin panel we might want to actually remove or just deactivate
  const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  
  if (!user) return next(new AppError('User not found', 404));

  sendSuccess(res, 200, 'User deactivated successfully');
});

// ─── Address Management (Logged in user) ──────────────────────────────────────

/**
 * @desc    Add an address
 * @route   POST /api/v1/users/address
 * @access  Private
 */
const addAddress = asyncHandler(async (req, res, next) => {
  req.body.user = req.user._id;
  const address = await Address.create(req.body);
  sendSuccess(res, 201, 'Address added', { address });
});

/**
 * @desc    Get user's addresses
 * @route   GET /api/v1/users/address
 * @access  Private
 */
const getAddresses = asyncHandler(async (req, res) => {
  const addresses = await Address.find({ user: req.user._id }).sort({ isDefault: -1, createdAt: -1 });
  sendSuccess(res, 200, 'Addresses retrieved', { addresses });
});

/**
 * @desc    Update address
 * @route   PUT /api/v1/users/address/:id
 * @access  Private
 */
const updateAddress = asyncHandler(async (req, res, next) => {
  let address = await Address.findById(req.params.id);
  if (!address) return next(new AppError('Address not found', 404));
  
  if (address.user.toString() !== req.user._id.toString()) {
     return next(new AppError('Not authorized to update this address', 403));
  }

  address = await Address.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  
  // Need to call save to trigger the pre-save hook for 'isDefault' if it changed
  if (req.body.isDefault) {
      const doc = await Address.findById(req.params.id);
      doc.isDefault = true;
      await doc.save();
  }

  sendSuccess(res, 200, 'Address updated', { address });
});

/**
 * @desc    Delete address
 * @route   DELETE /api/v1/users/address/:id
 * @access  Private
 */
const deleteAddress = asyncHandler(async (req, res, next) => {
  const address = await Address.findById(req.params.id);
  if (!address) return next(new AppError('Address not found', 404));

  if (address.user.toString() !== req.user._id.toString()) {
     return next(new AppError('Not authorized to delete this address', 403));
  }

  await address.deleteOne();
  sendSuccess(res, 200, 'Address deleted');
});

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  addAddress,
  getAddresses,
  updateAddress,
  deleteAddress
};
