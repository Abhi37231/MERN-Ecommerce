const mongoose = require('mongoose');

const restockRequestSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'fulfilled'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

restockRequestSchema.index({ product: 1, user: 1, status: 1 });

const RestockRequest = mongoose.model('RestockRequest', restockRequestSchema);
module.exports = RestockRequest;
