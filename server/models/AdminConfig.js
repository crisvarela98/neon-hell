const mongoose = require("mongoose");

const adminConfigSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    maxlength: 80,
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  updatedBy: {
    type: String,
    default: "system",
    trim: true,
    maxlength: 40,
  },
}, { timestamps: true });

module.exports = mongoose.model("AdminConfig", adminConfigSchema);
