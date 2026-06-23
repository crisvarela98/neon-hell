const Challenge = require("../models/Challenge");
const Notification = require("../models/Notification");
const Score = require("../models/Score");
const User = require("../models/User");
const { buildProgressionPayload, getCurrentLiveEvent } = require("./progression");

async function getBestScoreMap(usernames) {
  if (!usernames.length) {
    return new Map();
  }

  const rows = await Score.aggregate([
    {
      $match: {
        username: { $in: usernames },
      },
    },
    {
      $group: {
        _id: "$username",
        highestScore: { $max: "$score" },
        bestWave: { $max: "$wave" },
      },
    },
  ]);

  return new Map(rows.map((row) => [row._id, row]));
}

async function buildLeaderboard({ currentUser = null, scope = "global", limit = 20 }) {
  const friendSet = new Set(currentUser?.friends || []);
  const currentUsername = currentUser?.username || "";
  const currentUsernames = scope === "friends"
    ? [...new Set([currentUsername, ...friendSet].filter(Boolean))]
    : [];
  const scorePipeline = [
    scope === "friends" && currentUsernames.length
      ? {
          $match: {
            username: { $in: currentUsernames },
          },
        }
      : null,
    {
      $group: {
        _id: "$username",
        highestScore: { $max: "$score" },
        bestWave: { $max: "$wave" },
      },
    },
    {
      $sort: {
        highestScore: -1,
        bestWave: -1,
        _id: 1,
      },
    },
    {
      $limit: scope === "friends" ? Math.max(limit, 12) : Math.max(limit, 40),
    },
  ].filter(Boolean);
  const aggregated = await Score.aggregate(scorePipeline);
  const rankedUsernames = aggregated.map((entry) => entry._id);
  const users = await User.find({
    username: { $in: rankedUsernames },
  })
    .select("username friends progression")
    .lean();
  const userMap = new Map(users.map((entry) => [entry.username, entry]));
  const selfBestScore = currentUsername
    ? Number((await getBestScoreMap([currentUsername])).get(currentUsername)?.highestScore || 0)
    : 0;

  const players = aggregated
    .filter((entry) => userMap.has(entry._id))
    .slice(0, limit)
    .map((entry) => {
      const user = userMap.get(entry._id);
      const level = Math.max(1, Number(user?.progression?.level) || 1);
      const highestScore = Math.max(0, Number(entry.highestScore) || 0);

      return {
        username: entry._id,
        level,
        highestScore,
        bestWave: Math.max(1, Number(entry.bestWave) || 1),
        isSelf: entry._id === currentUsername,
        isFriend: friendSet.has(entry._id),
        isRegistered: true,
        scoreDelta: currentUsername && entry._id !== currentUsername
          ? highestScore - selfBestScore
          : 0,
      };
    });

  return {
    players,
    meta: {
      scope,
      selfBestScore,
      friendCount: friendSet.size,
    },
  };
}

async function buildSquadLeaderboard({ currentUser = null, limit = 10 } = {}) {
  const rows = await Score.aggregate([
    {
      $match: {
        onlineMode: true,
        playlistId: "squad-horde",
        squadKey: { $ne: "" },
      },
    },
    {
      $sort: {
        teamScore: -1,
        wave: -1,
        createdAt: -1,
      },
    },
    {
      $group: {
        _id: "$squadKey",
        squadName: { $first: "$squadName" },
        highestTeamScore: { $first: "$teamScore" },
        bestWave: { $max: "$wave" },
        members: { $first: "$squadMembers" },
        lastPlayedAt: { $first: "$createdAt" },
        runs: { $sum: 1 },
      },
    },
    {
      $sort: {
        highestTeamScore: -1,
        bestWave: -1,
        lastPlayedAt: -1,
      },
    },
    {
      $limit: Math.max(1, limit),
    },
  ]);

  const currentUsername = currentUser?.username || "";

  return rows.map((entry) => ({
    squadKey: entry._id,
    squadName: entry.squadName || "Squad sin nombre",
    highestTeamScore: Math.max(0, Number(entry.highestTeamScore) || 0),
    bestWave: Math.max(1, Number(entry.bestWave) || 1),
    members: Array.isArray(entry.members) ? entry.members : [],
    runs: Math.max(0, Number(entry.runs) || 0),
    isCurrentSquad: currentUsername
      ? (Array.isArray(entry.members) && entry.members.includes(currentUsername))
      : false,
  }));
}

async function getHistoryForUser(user) {
  const rows = await Score.find({
    $or: [
      { userId: user._id },
      { username: user.username },
    ],
  })
    .sort({ createdAt: -1 })
    .limit(8)
    .lean();

  return rows.map((entry) => ({
    id: entry._id.toString(),
    score: entry.score,
    kills: entry.kills,
    wave: entry.wave,
    timeSurvived: entry.timeSurvived,
    biomeId: entry.biomeId || "",
    eventId: entry.eventId || "",
    mutatorId: entry.mutatorId || "",
    createdAt: entry.createdAt,
  }));
}

async function expireChallenges(now = new Date()) {
  await Challenge.updateMany(
    {
      status: "active",
      expiresAt: { $lt: now },
    },
    {
      $set: {
        status: "expired",
        resolvedAt: now,
      },
    },
  );
}

async function getChallengesForUser(user, now = new Date()) {
  await expireChallenges(now);

  const rows = await Challenge.find({
    $or: [
      { challengerUsername: user.username },
      { targetUsername: user.username },
    ],
  })
    .sort({ updatedAt: -1 })
    .limit(12)
    .lean();

  return rows.map((entry) => ({
    id: entry._id.toString(),
    challengerUsername: entry.challengerUsername,
    targetUsername: entry.targetUsername,
    targetScore: entry.targetScore,
    status: entry.status,
    winnerUsername: entry.winnerUsername,
    liveEventId: entry.liveEventId,
    expiresAt: entry.expiresAt,
    isOutgoing: entry.challengerUsername === user.username,
  }));
}

async function createFriendChallenge(user, targetUsername, now = new Date()) {
  const friends = new Set(user.friends || []);

  if (!friends.has(targetUsername)) {
    throw new Error("Solo puedes retar a jugadores que ya agregaste.");
  }

  const existing = await Challenge.findOne({
    status: "active",
    $or: [
      {
        challengerUsername: user.username,
        targetUsername,
      },
      {
        challengerUsername: targetUsername,
        targetUsername: user.username,
      },
    ],
  });

  if (existing) {
    throw new Error("Ya tienes un reto activo con ese jugador.");
  }

  const scoreMap = await getBestScoreMap([user.username, targetUsername]);
  const ownBest = Number(scoreMap.get(user.username)?.highestScore || 0);
  const targetBest = Number(scoreMap.get(targetUsername)?.highestScore || 0);
  const targetScore = Math.max(600, ownBest, targetBest) + 250;
  const liveEvent = getCurrentLiveEvent(now);

  const challenge = await Challenge.create({
    challengerUsername: user.username,
    targetUsername,
    targetScore,
    liveEventId: liveEvent.id,
    status: "active",
    expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
  });

  await Notification.create({
    username: targetUsername,
    type: "async-challenge",
    title: "Reto de 24h",
    body: `${user.username} te reto a superar ${targetScore} puntos.`,
  });

  return {
    id: challenge._id.toString(),
    challengerUsername: challenge.challengerUsername,
    targetUsername: challenge.targetUsername,
    targetScore: challenge.targetScore,
    status: challenge.status,
    liveEventId: challenge.liveEventId,
    expiresAt: challenge.expiresAt,
  };
}

async function resolveChallengesForScore(username, score, now = new Date()) {
  await expireChallenges(now);

  const activeChallenges = await Challenge.find({
    status: "active",
    $or: [
      { challengerUsername: username },
      { targetUsername: username },
    ],
    targetScore: { $lte: score },
  });

  if (!activeChallenges.length) {
    return [];
  }

  const completed = [];

  for (const challenge of activeChallenges) {
    challenge.status = "completed";
    challenge.winnerUsername = username;
    challenge.resolvedAt = now;
    await challenge.save();
    completed.push({
      id: challenge._id.toString(),
      challengerUsername: challenge.challengerUsername,
      targetUsername: challenge.targetUsername,
      targetScore: challenge.targetScore,
      winnerUsername: username,
    });
  }

  return completed;
}

async function getSurpassedFriends(user, score) {
  const usernames = [...new Set(user.friends || [])];

  if (!usernames.length) {
    return [];
  }

  const scoreMap = await getBestScoreMap(usernames);

  return usernames
    .filter((username) => score > Number(scoreMap.get(username)?.highestScore || Number.MAX_SAFE_INTEGER))
    .sort();
}

async function buildSocialDashboard(user, now = new Date()) {
  const [friendLeaderboard, history, challenges, squadLeaderboard, notifications] = await Promise.all([
    buildLeaderboard({ currentUser: user, scope: "friends", limit: 8 }),
    getHistoryForUser(user),
    getChallengesForUser(user, now),
    buildSquadLeaderboard({ currentUser: user, limit: 6 }),
    Notification.find({ username: user.username }).sort({ createdAt: -1 }).limit(8).lean(),
  ]);

  return {
    progression: buildProgressionPayload(user, now),
    friendLeaderboard: friendLeaderboard.players,
    history,
    challenges,
    squadLeaderboard,
    notifications: notifications.map((entry) => ({
      id: entry._id.toString(),
      type: entry.type,
      title: entry.title,
      body: entry.body,
      readAt: entry.readAt,
      createdAt: entry.createdAt,
    })),
  };
}

module.exports = {
  buildLeaderboard,
  buildSocialDashboard,
  buildSquadLeaderboard,
  createFriendChallenge,
  getChallengesForUser,
  getHistoryForUser,
  getSurpassedFriends,
  resolveChallengesForScore,
};
