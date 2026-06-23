const mongoose = require("mongoose");

const receiptSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true,
    maxlength: 20,
    index: true,
  },
  type: {
    type: String,
    enum: ["soft-currency", "premium-pass", "cosmetic-bundle"],
    required: true,
  },
  itemId: {
    type: String,
    required: true,
    trim: true,
    maxlength: 80,
  },
  amount: {
    type: Number,
    default: 0,
  },
  currency: {
    type: String,
    default: "NH_SOFT",
  },
  provider: {
    type: String,
    default: "internal-simulated",
  },
  status: {
    type: String,
    enum: ["paid", "granted", "refunded"],
    default: "granted",
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
}, { timestamps: true });

module.exports = mongoose.model("Receipt", receiptSchema);
