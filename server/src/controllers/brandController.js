const BrandSettings = require('../models/BrandSettings');
const { sendSuccess } = require('../utils/apiResponse');

/**
 * @desc    Get Brand Settings
 * @route   GET /api/v1/brand
 * @access  Public
 */
exports.getBrandSettings = async (req, res, next) => {
  try {
    let settings = await BrandSettings.findOne();
    if (!settings) {
      settings = await BrandSettings.create({});
    }
    return sendSuccess(res, 200, 'Brand settings retrieved successfully', settings);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update Brand Settings
 * @route   PUT /api/v1/brand
 * @access  Private/Admin
 */
exports.updateBrandSettings = async (req, res, next) => {
  try {
    const { brandName, tagline, logo, favicon, primaryColor, secondaryColor } = req.body;
    
    let settings = await BrandSettings.findOne();
    if (!settings) {
      settings = await BrandSettings.create({});
    }

    if (brandName !== undefined) settings.brandName = brandName;
    if (tagline !== undefined) settings.tagline = tagline;
    if (logo !== undefined) settings.logo = logo;
    if (favicon !== undefined) settings.favicon = favicon;
    if (primaryColor !== undefined) settings.primaryColor = primaryColor;
    if (secondaryColor !== undefined) settings.secondaryColor = secondaryColor;

    await settings.save();
    return sendSuccess(res, 200, 'Brand settings updated successfully', settings);
  } catch (error) {
    next(error);
  }
};
