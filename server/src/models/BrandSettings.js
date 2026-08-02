const mongoose = require('mongoose');

const brandSettingsSchema = new mongoose.Schema({
  brandName: {
    type: String,
    default: 'Craftora'
  },
  tagline: {
    type: String,
    default: 'Discover. Shop. Smile.'
  },
  logo: {
    type: String,
    default: ''
  },
  favicon: {
    type: String,
    default: ''
  },
  primaryColor: {
    type: String,
    default: '#10b981' // Tailwind emerald-500
  },
  secondaryColor: {
    type: String,
    default: '#0f172a' // Tailwind slate-900
  }
}, { timestamps: true });

const BrandSettings = mongoose.model('BrandSettings', brandSettingsSchema);
module.exports = BrandSettings;
