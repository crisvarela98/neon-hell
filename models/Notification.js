const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true,
    maxlength: 20,
    index: true,
  },
  type: {
    type: String,
    required: true,
    trim: true,
    maxlength: 60,
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 80,
  },
  body: {
    type: String,
    required: true,
    trim: true,
    maxlength: 220,
  },
  readAt: {
    type: Date,
    default: null,
  },
}, { timestamps: true });

module.exports = mongoose.model("Notification", notificationSchema);
