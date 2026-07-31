/**
 * cloudinary.js — Cloudinary SDK configuration.
 *
 * Why: Cloudinary is our cloud image storage/CDN. All product images,
 *      category images, and user avatars are uploaded here.
 *      This file initializes the SDK once using env vars and exports
 *      the configured instance for use in multer-storage-cloudinary.
 *
 * Benefits of Cloudinary:
 *  - Automatic image optimization (WebP, AVIF, compression)
 *  - On-the-fly image transformations (resize, crop, watermark)
 *  - CDN delivery worldwide
 *  - Free tier: 25GB storage, 25GB monthly bandwidth
 */
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true, // always use HTTPS URLs
});

module.exports = cloudinary;
