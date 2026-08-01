const Notification = require('../models/Notification');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const AppError = require('../utils/AppError');

/**
 * @desc    Get user's notifications
 * @route   GET /api/v1/notifications
 * @access  Private
 */
exports.getMyNotifications = asyncHandler(async (req, res, next) => {
  const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50);
  sendSuccess(res, 200, 'Notifications retrieved', { notifications });
});

/**
 * @desc    Mark a notification as read
 * @route   PUT /api/v1/notifications/:id/read
 * @access  Private
 */
exports.markAsRead = asyncHandler(async (req, res, next) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { read: true },
    { new: true }
  );

  if (!notification) {
    return next(new AppError('Notification not found', 404));
  }

  sendSuccess(res, 200, 'Notification marked as read', { notification });
});

/**
 * @desc    Mark all notifications as read
 * @route   PUT /api/v1/notifications/read-all
 * @access  Private
 */
exports.markAllAsRead = asyncHandler(async (req, res, next) => {
  await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
  sendSuccess(res, 200, 'All notifications marked as read');
});

/**
 * @desc    Delete a notification
 * @route   DELETE /api/v1/notifications/:id
 * @access  Private
 */
exports.deleteNotification = asyncHandler(async (req, res, next) => {
  const notification = await Notification.findOneAndDelete({ _id: req.params.id, user: req.user._id });

  if (!notification) {
    return next(new AppError('Notification not found', 404));
  }

  sendSuccess(res, 200, 'Notification deleted');
});

/**
 * Utility function to create a notification internally
 */
exports.createNotification = async ({ user, title, message, type, link }) => {
  try {
    await Notification.create({ user, title, message, type, link });
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
};
