const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Notification must belong to a user'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Notification must have a title'],
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Notification must have a message'],
    },
    type: {
      type: String,
      enum: ['order', 'custom_request', 'system'],
      default: 'system',
    },
    read: {
      type: Boolean,
      default: false,
    },
    link: {
      type: String, // e.g. /my-custom-requests
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, read: 1 });

const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;
