const mongoose = require("mongoose");

const scoreSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true,
    maxlength: 20,
  },
  score: {
    type: Number,
    required: true,
    min: 0,
  },
  kills: {
    type: Number,
    required: true,
    min: 0,
  },
  wave: {
    type: Number,
    required: true,
    min: 1,
  },
  timeSurvived: {
    type: Number,
    required: true,
    min: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

scoreSchema.index({ score: -1, createdAt: 1 });

module.exports = mongoose.model("Score", scoreSchema);
