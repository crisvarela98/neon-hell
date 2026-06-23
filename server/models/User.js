const mongoose = require("mongoose");

const achievementSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    trim: true,
  },
  progress: {
    type: Number,
    default: 0,
  },
  unlockedAt: {
    type: Date,
    default: null,
  },
}, { _id: false });

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  passwordHash: {
    type: String,
    required: true,
  },
  friends: {
    type: [String],
    default: [],
  },
  progression: {
    xp: {
      type: Number,
      default: 0,
    },
    level: {
      type: Number,
      default: 1,
    },
    unlockedWeapons: {
      type: [String],
      default: ["repeater"],
    },
    permanentUpgrades: {
      healthTier: {
        type: Number,
        default: 0,
      },
      ammoTier: {
        type: Number,
        default: 0,
      },
      speedTier: {
        type: Number,
        default: 0,
      },
    },
  },
  missionState: {
    dailyKey: {
      type: String,
      default: "",
    },
    weeklyKey: {
      type: String,
      default: "",
    },
    daily: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    weekly: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
  },
  onboarding: {
    firstRunCompleted: {
      type: Boolean,
      default: false,
    },
  },
  seasonState: {
    currentSeasonId: {
      type: String,
      default: "black-signal",
    },
    passXp: {
      type: Number,
      default: 0,
    },
    passTier: {
      type: Number,
      default: 0,
    },
    premiumOwned: {
      type: Boolean,
      default: false,
    },
    seasonTokens: {
      type: Number,
      default: 0,
    },
    claimedRewardIds: {
      type: [String],
      default: [],
    },
  },
  achievements: {
    type: [achievementSchema],
    default: [],
  },
  cosmetics: {
    inventory: {
      titles: {
        type: [String],
        default: [],
      },
      banners: {
        type: [String],
        default: [],
      },
      emotes: {
        type: [String],
        default: [],
      },
      weaponSkins: {
        type: [String],
        default: [],
      },
    },
    equipped: {
      title: {
        type: String,
        default: "",
      },
      banner: {
        type: String,
        default: "",
      },
      emote: {
        type: String,
        default: "",
      },
      weaponSkin: {
        type: String,
        default: "",
      },
    },
  },
  squadStats: {
    hordeRuns: {
      type: Number,
      default: 0,
    },
    bestSquadScore: {
      type: Number,
      default: 0,
    },
    lastSquadName: {
      type: String,
      default: "",
    },
    rewardsClaimed: {
      type: Number,
      default: 0,
    },
  },
  wallet: {
    softCurrency: {
      type: Number,
      default: 500,
    },
    lifetimeSoftCurrency: {
      type: Number,
      default: 500,
    },
  },
  adminFlags: {
    isAdmin: {
      type: Boolean,
      default: false,
    },
  },
  lastLoginAt: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("User", userSchema);
