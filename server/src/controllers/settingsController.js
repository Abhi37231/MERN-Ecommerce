/**
 * settingsController.js
 */

const SiteSettings = require('../models/SiteSettings');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');

/**
 * @desc    Get site settings
 * @route   GET /api/v1/settings
 * @access  Public
 */
const getSettings = asyncHandler(async (req, res) => {
  let settings = await SiteSettings.findOne();
  
  // If no settings exist yet, create default
  if (!settings) {
    settings = await SiteSettings.create({});
  }

  sendSuccess(res, 200, 'Settings retrieved', { settings });
});

/**
 * @desc    Update site settings
 * @route   PUT /api/v1/settings
 * @access  Admin
 */
const updateSettings = asyncHandler(async (req, res) => {
  let settings = await SiteSettings.findOne();
  
  if (!settings) {
    settings = await SiteSettings.create(req.body);
  } else {
    settings = await SiteSettings.findOneAndUpdate({}, req.body, { new: true, runValidators: true });
  }

  sendSuccess(res, 200, 'Settings updated', { settings });
});

module.exports = {
  getSettings,
  updateSettings
};
