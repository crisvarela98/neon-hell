const mongoose = require("mongoose");

const analyticsEventSchema = new mongoose.Schema({
  username: {
    type: String,
    default: "",
    trim: true,
    maxlength: 20,
    index: true,
  },
  type: {
    type: String,
    required: true,
    trim: true,
    maxlength: 80,
    index: true,
  },
  properties: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

module.exports = mongoose.model("AnalyticsEvent", analyticsEventSchema);
