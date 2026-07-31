/**
 * Address.js — Address Mongoose Model
 *
 * Why this model exists:
 *  Users can save multiple delivery addresses. During checkout they
 *  select one saved address. This model stores the address independently
 *  from orders — when an order is placed, a snapshot of the address
 *  is embedded directly in the order document.
 *
 * Key design decisions:
 *  - isDefault: one address per user is marked as default (pre-save enforces this)
 *  - label: friendly names like 'Home', 'Office', 'Mom's Place'
 *  - pincode validation: Indian 6-digit PIN codes
 */

const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Address must belong to a user'],
      index: true,
    },
    label: {
      type: String,
      enum: {
        values: ['Home', 'Office', 'Other'],
        message: 'Label must be "Home", "Office", or "Other"',
      },
      default: 'Home',
    },
    customLabel: {
      type: String,
      trim: true,
      maxlength: [30, 'Custom label cannot exceed 30 characters'],
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      maxlength: [100, 'Full name cannot exceed 100 characters'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      match: [/^[6-9]\d{9}$/, 'Please provide a valid 10-digit phone number'],
    },
    addressLine1: {
      type: String,
      required: [true, 'Address line 1 is required'],
      trim: true,
      maxlength: [200, 'Address line 1 cannot exceed 200 characters'],
    },
    addressLine2: {
      type: String,
      trim: true,
      maxlength: [200, 'Address line 2 cannot exceed 200 characters'],
    },
    landmark: {
      type: String,
      trim: true,
      maxlength: [100, 'Landmark cannot exceed 100 characters'],
    },
    tal: {
      type: String,
      trim: true,
      maxlength: [100, 'Taluka cannot exceed 100 characters'],
    },
    dist: {
      type: String,
      trim: true,
      maxlength: [100, 'District cannot exceed 100 characters'],
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      maxlength: [100, 'City cannot exceed 100 characters'],
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
      maxlength: [100, 'State cannot exceed 100 characters'],
    },
    pincode: {
      type: String,
      required: [true, 'Pincode is required'],
      match: [/^\d{6}$/, 'Please provide a valid 6-digit PIN code'],
    },
    country: {
      type: String,
      default: 'India',
      trim: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ─────────────────────────────────────────────────────────────────
addressSchema.index({ user: 1, isDefault: 1 });

// ─── Pre-save Hook ────────────────────────────────────────────────────────────

/**
 * When an address is set as default, unset any existing default
 * for the same user (only one default allowed per user).
 */
addressSchema.pre('save', async function () {
  if (this.isModified('isDefault') && this.isDefault) {
    await this.constructor.updateMany(
      { user: this.user, _id: { $ne: this._id } },
      { isDefault: false }
    );
  }
});

const Address = mongoose.model('Address', addressSchema);
module.exports = Address;
