const mongoose = require("mongoose");

const scoreSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
    index: true,
  },
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
  bossKills: {
    type: Number,
    default: 0,
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
  biomeId: {
    type: String,
    default: "",
    trim: true,
    maxlength: 64,
  },
  eventId: {
    type: String,
    default: "",
    trim: true,
    maxlength: 64,
  },
  mutatorId: {
    type: String,
    default: "",
    trim: true,
    maxlength: 64,
  },
  seasonId: {
    type: String,
    default: "black-signal",
    trim: true,
    maxlength: 64,
    index: true,
  },
  onlineMode: {
    type: Boolean,
    default: false,
  },
  playlistId: {
    type: String,
    default: "solo",
    trim: true,
    maxlength: 40,
  },
  roomCode: {
    type: String,
    default: "",
    trim: true,
    maxlength: 12,
  },
  squadKey: {
    type: String,
    default: "",
    trim: true,
    maxlength: 80,
  },
  squadName: {
    type: String,
    default: "",
    trim: true,
    maxlength: 32,
  },
  squadMembers: {
    type: [String],
    default: [],
  },
  teamScore: {
    type: Number,
    default: 0,
    min: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

scoreSchema.index({ score: -1, createdAt: 1 });
scoreSchema.index({ username: 1, score: -1 });
scoreSchema.index({ squadKey: 1, teamScore: -1, createdAt: -1 });

module.exports = mongoose.model("Score", scoreSchema);
