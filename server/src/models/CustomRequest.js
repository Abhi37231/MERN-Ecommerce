const mongoose = require('mongoose');

const customRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Custom request must belong to a user'],
      index: true,
    },
    referenceImages: [
      {
        url: { type: String, required: true },
        publicId: { type: String, required: true },
      },
    ],
    specifications: {
      color: { type: String, trim: true },
      size: { type: String, trim: true },
      material: { type: String, trim: true },
      notes: { type: String, maxlength: 1000 },
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'quoted', 'accepted', 'rejected', 'ordered'],
        message: 'Invalid request status',
      },
      default: 'pending',
    },
    priceQuote: {
      type: Number,
      min: [0, 'Quote cannot be negative'],
    },
    adminNotes: {
      type: String,
      maxlength: 1000,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
    },
  },
  {
    timestamps: true,
  }
);

customRequestSchema.index({ status: 1, createdAt: -1 });

const CustomRequest = mongoose.model('CustomRequest', customRequestSchema);
module.exports = CustomRequest;
