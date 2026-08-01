/**
 * SiteSettings.js — Global App Settings Model
 * 
 * Stores global configurations for the app like Store Name, Logo, Shipping Label preferences.
 * Only a single document should ever exist in this collection.
 */

const mongoose = require('mongoose');

const siteSettingsSchema = new mongoose.Schema({
  storeLogo: {
    type: String,
    default: ''
  },
  storeName: {
    type: String,
    default: 'ShopSphere'
  },
  storeAddress: {
    type: String,
    default: '123 E-Commerce St, Business District'
  },
  storePhone: {
    type: String,
    default: '+1 234 567 8900'
  },
  storeEmail: {
    type: String,
    default: 'support@shopsphere.com'
  },
  showLogo: {
    type: Boolean,
    default: true
  },
  showQrCode: {
    type: Boolean,
    default: true
  },
  showBarcode: {
    type: Boolean,
    default: true
  },
  labelSize: {
    type: String,
    enum: ['A4', 'A5', '4x6'],
    default: '4x6'
  },
  footerText: {
    type: String,
    default: 'Thank you for shopping with us!'
  },
  shippingCost: {
    type: Number,
    default: 50
  },
  freeShippingThreshold: {
    type: Number,
    default: 1000
  },
  gstPercentage: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

const SiteSettings = mongoose.model('SiteSettings', siteSettingsSchema);
module.exports = SiteSettings;
