const express = require("express");
const jwt = require("jsonwebtoken");

const Score = require("../models/Score");
const User = require("../models/User");
const Notification = require("../models/Notification");
const { applyRunProgress, buildProgressionPayload, ensureUserProgression } = require("../services/progression");
const { validateScoreIntegrity } = require("../services/antiCheat");
const { recordSquadRun } = require("../services/squadService");
const { buildLiveOpsDashboard } = require("../services/liveOps");
const {
  buildLeaderboard,
  buildSocialDashboard,
  buildSquadLeaderboard,
  createFriendChallenge,
  resolveChallengesForScore,
} = require("../services/social");

const router = express.Router();

function readToken(request) {
  const authorization = request.headers.authorization || "";
  const [scheme, value] = authorization.split(" ");

  if (scheme !== "Bearer" || !value) {
    return null;
  }

  return value;
}

function readAuthPayload(request) {
  const token = readToken(request);

  if (!token || !process.env.JWT_SECRET) {
    return null;
  }

  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
}

async function readAuthenticatedUser(request) {
  const payload = readAuthPayload(request);

  if (!payload?.sub) {
    return null;
  }

  return User.findById(payload.sub);
}

async function getBestScore(username) {
  if (!username) {
    return 0;
  }

  const rows = await Score.aggregate([
    {
      $match: {
        username,
      },
    },
    {
      $group: {
        _id: "$username",
        highestScore: { $max: "$score" },
      },
    },
  ]);

  return Number(rows[0]?.highestScore || 0);
}

async function getSurpassedFriendsWithPreviousBest(user, score, previousBestScore) {
  const usernames = [...new Set(user.friends || [])];

  if (!usernames.length) {
    return [];
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
      },
    },
  ]);

  return rows
    .filter((entry) => score > Number(entry.highestScore || 0) && previousBestScore <= Number(entry.highestScore || 0))
    .map((entry) => entry._id)
    .sort();
}

function normalizeSquadKey(value, fallback = "") {
  return String(value || fallback || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

router.get("/top", async (request, response) => {
  try {
    const currentUser = await readAuthenticatedUser(request);
    const scope = request.query.scope === "friends" ? "friends" : "global";

    if (scope === "friends" && !currentUser) {
      return response.json({
        players: [],
        meta: {
          scope,
          selfBestScore: 0,
          friendCount: 0,
        },
      });
    }

    const leaderboard = await buildLeaderboard({
      currentUser,
      scope,
      limit: 20,
    });

    return response.json(leaderboard);
  } catch (error) {
    return response.status(500).json({ message: "No se pudo obtener el ranking." });
  }
});

router.get("/social", async (request, response) => {
  try {
    const user = await readAuthenticatedUser(request);

    if (!user) {
      return response.status(401).json({ message: "Inicia sesion para ver actividad social." });
    }

    ensureUserProgression(user);
    await user.save();
    const social = await buildSocialDashboard(user);

    return response.json(social);
  } catch (error) {
    return response.status(500).json({ message: "No se pudo cargar el panel social." });
  }
});

router.get("/squads", async (request, response) => {
  try {
    const currentUser = await readAuthenticatedUser(request);
    const squads = await buildSquadLeaderboard({
      currentUser,
      limit: 12,
    });

    return response.json({ squads });
  } catch (error) {
    return response.status(500).json({ message: "No se pudo cargar el ranking por squad." });
  }
});

router.post("/challenges/:username", async (request, response) => {
  try {
    const user = await readAuthenticatedUser(request);

    if (!user) {
      return response.status(401).json({ message: "Inicia sesion para crear retos." });
    }

    ensureUserProgression(user);
    const targetUsername = String(request.params.username || "").trim();

    if (!targetUsername) {
      return response.status(400).json({ message: "Falta el rival del reto." });
    }

    const challenge = await createFriendChallenge(user, targetUsername);
    const social = await buildSocialDashboard(user);

    return response.status(201).json({
      message: `Reto activo contra ${targetUsername}.`,
      challenge,
      social,
    });
  } catch (error) {
    return response.status(400).json({ message: error.message || "No se pudo crear el reto." });
  }
});

router.post("/", async (request, response) => {
  try {
    const user = await readAuthenticatedUser(request);
    const {
      username,
      score,
      kills,
      bossKills,
      wave,
      timeSurvived,
      biomeId,
      eventId,
      mutatorId,
      onlineMode,
      playlistId,
      roomCode,
      squadKey,
      squadName,
      squadMembers,
      teamScore,
    } = request.body;
    const resolvedUsername = user?.username || String(username || "").trim().slice(0, 20);

    if (!resolvedUsername) {
      return response.status(400).json({ message: "Falta username." });
    }

    const numericScore = Math.max(0, Number(score) || 0);
    const numericKills = Math.max(0, Number(kills) || 0);
    const numericBossKills = Math.max(0, Number(bossKills) || 0);
    const numericWave = Math.max(1, Number(wave) || 1);
    const numericTimeSurvived = Math.max(0, Number(timeSurvived) || 0);
    const isOnlineMode = Boolean(onlineMode);
    const normalizedPlaylistId = String(playlistId || (isOnlineMode ? "squad-horde" : "solo"))
      .trim()
      .slice(0, 40);
    const normalizedSquadName = String(squadName || "")
      .trim()
      .slice(0, 32);
    const normalizedSquadMembers = [...new Set((Array.isArray(squadMembers) ? squadMembers : [])
      .map((entry) => String(entry || "").trim().slice(0, 20))
      .filter(Boolean))];
    const normalizedSquadKey = isOnlineMode
      ? normalizeSquadKey(squadKey, normalizedSquadName || normalizedSquadMembers.slice().sort().join("-"))
      : "";
    const numericTeamScore = Math.max(0, Number(teamScore) || 0);
    const liveOps = await buildLiveOpsDashboard();
    const seasonId = String(liveOps.season?.id || "black-signal").trim().slice(0, 64);
    const previousBestScore = user ? await getBestScore(user.username) : 0;
    const integrity = validateScoreIntegrity({
      score: numericScore,
      kills: numericKills,
      bossKills: numericBossKills,
      wave: numericWave,
      timeSurvived: numericTimeSurvived,
    });

    if (!integrity.ok) {
      return response.status(400).json({
        message: "Score rechazado por validacion anti-cheat.",
        issues: integrity.issues,
      });
    }

    const payload = {
      userId: user?._id || null,
      username: resolvedUsername,
      score: numericScore,
      kills: numericKills,
      bossKills: numericBossKills,
      wave: numericWave,
      timeSurvived: numericTimeSurvived,
      biomeId: String(biomeId || "").trim().slice(0, 64),
      eventId: String(eventId || "").trim().slice(0, 64),
      mutatorId: String(mutatorId || "").trim().slice(0, 64),
      seasonId,
      onlineMode: isOnlineMode,
      playlistId: normalizedPlaylistId,
      roomCode: String(roomCode || "").trim().toUpperCase().slice(0, 12),
      squadKey: normalizedSquadKey,
      squadName: normalizedSquadName,
      squadMembers: normalizedSquadMembers,
      teamScore: numericTeamScore,
    };

    const savedScore = await Score.create(payload);

    if (payload.onlineMode && payload.playlistId === "squad-horde") {
      await recordSquadRun({
        squadKey: payload.squadKey,
        squadName: payload.squadName,
        members: payload.squadMembers,
        teamScore: payload.teamScore,
        wave: payload.wave,
      });
    }

    if (!user) {
      return response.status(201).json({
        score: savedScore,
      });
    }

    ensureUserProgression(user);
    const surpassedFriends = await getSurpassedFriendsWithPreviousBest(user, payload.score, previousBestScore);
    const progressionSummary = applyRunProgress(user, {
      ...payload,
      surpassedFriends: surpassedFriends.length,
    });
    const completedChallenges = await resolveChallengesForScore(user.username, payload.score);

    if (surpassedFriends.length) {
      await Notification.insertMany(surpassedFriends.map((friendUsername) => ({
        username: friendUsername,
        type: "friend-surpassed",
        title: "Te superaron en el ranking",
        body: `${user.username} supero tu record. Lanza un reto de 24h para recuperarlo.`,
      })));
    }

    await user.save();

    return response.status(201).json({
      score: savedScore,
      progression: buildProgressionPayload(user),
      xpGain: progressionSummary.xpGain,
      squadBonusXp: progressionSummary.squadBonusXp,
      bonusXp: progressionSummary.bonusXp,
      seasonXpGain: progressionSummary.seasonXpGain,
      seasonTokensGain: progressionSummary.seasonTokensGain,
      completedMissions: progressionSummary.completedMissions,
      newlyUnlockedWeapons: progressionSummary.newlyUnlockedWeapons,
      unlockedAchievements: progressionSummary.unlockedAchievements,
      unlockedSeasonRewards: progressionSummary.unlockedSeasonRewards,
      newCosmetics: progressionSummary.newCosmetics,
      seasonTierUp: progressionSummary.seasonTierUp,
      newSeasonTier: progressionSummary.newSeasonTier,
      levelUp: progressionSummary.levelUp,
      newLevel: progressionSummary.newLevel,
      surpassedFriends,
      completedChallenges,
    });
  } catch (error) {
    return response.status(500).json({ message: "No se pudo guardar la puntuacion." });
  }
});

module.exports = router;
