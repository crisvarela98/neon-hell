const express = require("express");
const jwt = require("jsonwebtoken");

const Score = require("../models/Score");

const router = express.Router();

function readToken(request) {
  const authorization = request.headers.authorization || "";
  const [scheme, value] = authorization.split(" ");

  if (scheme !== "Bearer" || !value) {
    return null;
  }

  return value;
}

function resolveUsername(request, fallbackUsername) {
  const token = readToken(request);

  if (!token || !process.env.JWT_SECRET) {
    return fallbackUsername;
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    return payload.username || fallbackUsername;
  } catch (error) {
    return fallbackUsername;
  }
}

router.get("/top", async (_request, response) => {
  try {
    const scores = await Score.find({})
      .sort({ score: -1, wave: -1, kills: -1, createdAt: 1 })
      .limit(20)
      .lean();

    return response.json(scores);
  } catch (error) {
    return response.status(500).json({ message: "No se pudo obtener el ranking." });
  }
});

router.post("/", async (request, response) => {
  try {
    const { username, score, kills, wave, timeSurvived } = request.body;
    const resolvedUsername = resolveUsername(request, username);

    if (!resolvedUsername) {
      return response.status(400).json({ message: "Falta username." });
    }

    const payload = {
      username: String(resolvedUsername).trim().slice(0, 20),
      score: Number(score) || 0,
      kills: Number(kills) || 0,
      wave: Math.max(1, Number(wave) || 1),
      timeSurvived: Math.max(0, Number(timeSurvived) || 0),
    };

    const savedScore = await Score.create(payload);

    return response.status(201).json(savedScore);
  } catch (error) {
    return response.status(500).json({ message: "No se pudo guardar la puntuacion." });
  }
});

module.exports = router;
