const User = require('../models/User');
const Cart = require('../models/Cart');
const Wishlist = require('../models/Wishlist');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/apiResponse');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  setTokenCookies,
  clearTokenCookies,
} = require('../utils/jwtUtils');
const { generateToken, hashToken } = require('../utils/generateToken');
const { sendEmail, emailVerificationTemplate, passwordResetTemplate } = require('../utils/sendEmail');

const sendAuthResponse = (res, statusCode, message, user) => {
  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);

  setTokenCookies(res, accessToken, refreshToken);

  const userObj = user.toObject ? user.toObject() : user;
  delete userObj.password;

  return sendSuccess(res, statusCode, message, {
    user: userObj,
    accessToken,
    refreshToken,
  });
};

/**
 * @desc    Register new user
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
const register = asyncHandler(async (req, res, next) => {
  const { firstName, lastName, email, password, phone } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new AppError('An account with this email already exists.', 409));
  }

  const { rawToken, hashedToken, expiresAt } = generateToken(24 * 60);

  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
    phone,
    emailVerificationToken: hashedToken,
    emailVerificationExpires: expiresAt,
  });

  await Promise.all([
    Cart.create({ user: user._id, items: [] }),
    Wishlist.create({ user: user._id, products: [] }),
  ]);

  const verificationUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/verify-email/${rawToken}`;
  try {
    sendEmail({
      to: user.email,
      subject: 'Verify your Craftora email',
      html: emailVerificationTemplate(user.firstName, verificationUrl),
    }).catch(err => console.error('Email send failed in background:', err.message));
  } catch (err) {
    console.error('Email send failed synchronously:', err.message);
  }

  return sendAuthResponse(
    res,
    201,
    'Account created successfully! Welcome to Craftora.',
    user
  );
});

/**
 * @desc    Log in user
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    return next(new AppError('Invalid email or password', 401));
  }

  return sendAuthResponse(res, 200, 'Logged in successfully', user);
});

/**
 * @desc    Log out user / clear cookies
 * @route   POST /api/v1/auth/logout
 * @access  Private / Public
 */
const logout = asyncHandler(async (req, res) => {
  clearTokenCookies(res);
  return sendSuccess(res, 200, 'Logged out successfully');
});

/**
 * @desc    Get current user profile
 * @route   GET /api/v1/auth/me
 * @access  Private
 */
const getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    return next(new AppError('User not found', 404));
  }
  return sendSuccess(res, 200, 'User profile retrieved', { user });
});

/**
 * @desc    Refresh access token using refresh token cookie
 * @route   POST /api/v1/auth/refresh
 * @access  Public
 */
const refreshToken = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;

  if (!token) {
    return next(new AppError('Refresh token required', 401));
  }

  const decoded = verifyRefreshToken(token);
  const user = await User.findById(decoded.id);
  if (!user) {
    return next(new AppError('User belonging to this token no longer exists', 401));
  }

  const newAccessToken = generateAccessToken(user._id, user.role);
  const newRefreshToken = generateRefreshToken(user._id);
  setTokenCookies(res, newAccessToken, newRefreshToken);

  return sendSuccess(res, 200, 'Token refreshed successfully', {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  });
});

/**
 * @desc    Forgot password
 * @route   POST /api/v1/auth/forgot-password
 * @access  Public
 */
const forgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    return sendSuccess(res, 200, 'If that email exists in our system, a reset link has been sent.');
  }

  const { rawToken, hashedToken, expiresAt } = generateToken(10); // 10 minutes
  user.passwordResetToken = hashedToken;
  user.passwordResetExpires = expiresAt;
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password/${rawToken}`;

  try {
    await sendEmail({
      to: user.email,
      subject: 'Password Reset Request - Craftora',
      html: passwordResetTemplate ? passwordResetTemplate(user.firstName, resetUrl) : `<p>Reset password: <a href="${resetUrl}">${resetUrl}</a></p>`,
    });
    return sendSuccess(res, 200, 'Password reset link sent to your email.');
  } catch (err) {
    console.error('Forgot password email failed:', err.message);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new AppError('Error sending email. Please check your server .env credentials.', 500));
  }
});

/**
 * @desc    Reset password
 * @route   POST /api/v1/auth/reset-password/:token
 * @access  Public
 */
const resetPassword = asyncHandler(async (req, res, next) => {
  const hashedToken = hashToken(req.params.token);

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AppError('Token is invalid or has expired.', 400));
  }

  user.password = req.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  return sendAuthResponse(res, 200, 'Password reset successful!', user);
});

/**
 * @desc    Update current user profile details
 * @route   PUT /api/v1/auth/update-details
 * @access  Private
 */
const updateDetails = asyncHandler(async (req, res, next) => {
  const { firstName, lastName, phone } = req.body;

  const fieldsToUpdate = {};
  if (firstName) fieldsToUpdate.firstName = firstName;
  if (lastName) fieldsToUpdate.lastName = lastName;
  if (phone !== undefined) fieldsToUpdate.phone = phone;

  const updatedUser = await User.findByIdAndUpdate(req.user._id, fieldsToUpdate, {
    new: true,
    runValidators: true,
  });

  return sendSuccess(res, 200, 'Profile details updated', { user: updatedUser });
});

/**
 * @desc    Update current user password
 * @route   PUT /api/v1/auth/update-password
 * @access  Private
 */
const updatePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');

  if (!(await user.comparePassword(currentPassword))) {
    return next(new AppError('Your current password is incorrect.', 401));
  }

  user.password = newPassword;
  await user.save();

  return sendAuthResponse(res, 200, 'Password updated successfully!', user);
});

module.exports = {
  register,
  login,
  logout,
  getMe,
  refreshToken,
  forgotPassword,
  resetPassword,
  updateDetails,
  updatePassword,
};