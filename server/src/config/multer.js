/**
 * multer.js — File upload middleware configuration.
 *
 * Why: Multer handles multipart/form-data (file uploads).
 *      We use multer-storage-cloudinary so files stream directly
 *      to Cloudinary — no temporary disk storage, no cleanup needed.
 *
 * Upload presets by resource type:
 *  - productImages  → /shopsphere/products  (max 5 files, 5MB each)
 *  - categoryImage  → /shopsphere/categories (max 1 file, 2MB)
 *  - avatar         → /shopsphere/avatars    (max 1 file, 2MB)
 *
 * File type: Only JPEG, JPG, PNG, and WebP accepted.
 */
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('./cloudinary');
const AppError = require('../utils/AppError');

// Allowed MIME types
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

/**
 * File filter — rejects non-image uploads.
 */
const fileFilter = (req, file, cb) => {
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new AppError('Only JPEG, PNG, and WebP images are allowed.', 400),
      false
    );
  }
};

/**
 * Create a Cloudinary storage engine for a specific folder.
 * @param {string} folder - Cloudinary folder name (e.g. 'shopsphere/products')
 * @param {object} [transformation] - Optional Cloudinary transformation
 */
const createCloudinaryStorage = (folder, transformation = []) => {
  return new CloudinaryStorage({
    cloudinary,
    params: {
      folder,
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      transformation,
      resource_type: 'image',
    },
  });
};

// ─── Upload instances ────────────────────────────────────────────────────────

/**
 * Upload up to 10 product images.
 * Images are resized to max 1200×1200 and converted to WebP.
 */
const uploadProductImages = multer({
  storage: createCloudinaryStorage('shopsphere/products', [
    { width: 1200, height: 1200, crop: 'limit', quality: 'auto', fetch_format: 'auto' },
  ]),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per file
}).array('images', 10);

/**
 * Upload a single category image.
 * Resized to max 800×600.
 */
const uploadCategoryImage = multer({
  storage: createCloudinaryStorage('shopsphere/categories', [
    { width: 800, height: 600, crop: 'limit', quality: 'auto', fetch_format: 'auto' },
  ]),
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
}).single('image');

/**
 * Upload a single user avatar.
 * Square crop at 400×400.
 */
const uploadAvatar = multer({
  storage: createCloudinaryStorage('shopsphere/avatars', [
    { width: 400, height: 400, crop: 'fill', gravity: 'face', quality: 'auto' },
  ]),
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
}).single('avatar');

/**
 * Upload up to 3 review images.
 * Resized to max 800x800 and converted to WebP.
 */
const uploadReviewImages = multer({
  storage: createCloudinaryStorage('shopsphere/reviews', [
    { width: 800, height: 800, crop: 'limit', quality: 'auto', fetch_format: 'auto' },
  ]),
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB per file
}).array('images', 3);

/**
 * Promisified wrapper for multer middleware.
 * Converts multer's callback-based API to async/await for use with asyncHandler.
 * @param {Function} uploadMiddleware - A multer instance (e.g. uploadProductImages)
 */
const handleUpload = (uploadMiddleware) => (req, res) => {
  return new Promise((resolve, reject) => {
    uploadMiddleware(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        // Multer-specific errors (e.g. file too large)
        reject(new AppError(`Upload error: ${err.message}`, 400));
      } else if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

/**
 * Upload up to 5 reference images for custom requests.
 */
const uploadReferenceImages = multer({
  storage: createCloudinaryStorage('shopsphere/custom_requests', [
    { width: 1200, height: 1200, crop: 'limit', quality: 'auto', fetch_format: 'auto' },
  ]),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per file
}).array('referenceImages', 5);

module.exports = {
  uploadProductImages,
  uploadCategoryImage,
  uploadAvatar,
  uploadReviewImages,
  uploadReferenceImages,
  handleUpload,
};
