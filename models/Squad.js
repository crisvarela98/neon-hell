const mongoose = require("mongoose");

const squadMemberSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true,
    maxlength: 20,
  },
  role: {
    type: String,
    enum: ["owner", "captain", "member"],
    default: "member",
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
}, { _id: false });

const squadInviteSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true,
    maxlength: 20,
  },
  invitedBy: {
    type: String,
    required: true,
    trim: true,
    maxlength: 20,
  },
  status: {
    type: String,
    enum: ["pending", "accepted", "declined"],
    default: "pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, { _id: false });

const squadHistorySchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    trim: true,
    maxlength: 40,
  },
  summary: {
    type: String,
    required: true,
    trim: true,
    maxlength: 160,
  },
  score: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, { _id: false });

const squadSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    maxlength: 80,
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 32,
  },
  ownerUsername: {
    type: String,
    required: true,
    trim: true,
    maxlength: 20,
    index: true,
  },
  members: {
    type: [squadMemberSchema],
    default: [],
  },
  invites: {
    type: [squadInviteSchema],
    default: [],
  },
  history: {
    type: [squadHistorySchema],
    default: [],
  },
  stats: {
    bestScore: {
      type: Number,
      default: 0,
    },
    totalRuns: {
      type: Number,
      default: 0,
    },
    seasonId: {
      type: String,
      default: "black-signal",
    },
  },
}, { timestamps: true });

squadSchema.index({ "members.username": 1 });
squadSchema.index({ "invites.username": 1, "invites.status": 1 });

module.exports = mongoose.model("Squad", squadSchema);
