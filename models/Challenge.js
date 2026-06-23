const mongoose = require("mongoose");

const challengeSchema = new mongoose.Schema(
  {
    challengerUsername: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20,
      index: true,
    },
    targetUsername: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20,
      index: true,
    },
    targetScore: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["active", "completed", "expired"],
      default: "active",
      index: true,
    },
    winnerUsername: {
      type: String,
      default: "",
      trim: true,
      maxlength: 20,
    },
    liveEventId: {
      type: String,
      default: "",
      trim: true,
      maxlength: 64,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

challengeSchema.index(
  {
    challengerUsername: 1,
    targetUsername: 1,
    status: 1,
  },
  {
    name: "challenge_pair_status",
  },
);

module.exports = mongoose.model("Challenge", challengeSchema);
