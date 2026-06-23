const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const { ensureUserProgression, buildProgressionPayload } = require("../services/progression");
const { buildSocialDashboard } = require("../services/social");

const router = express.Router();

function readToken(request) {
  const authorization = request.headers.authorization || "";
  const [scheme, value] = authorization.split(" ");

  if (scheme !== "Bearer" || !value) {
    return null;
  }

  return value;
}

async function readAuthenticatedUser(request) {
  if (!process.env.JWT_SECRET) {
    return null;
  }

  const token = readToken(request);

  if (!token) {
    return null;
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    if (!payload?.sub) {
      return null;
    }

    return User.findById(payload.sub);
  } catch (error) {
    return null;
  }
}

function createToken(user) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      username: user.username,
      email: user.email,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" },
  );
}

function sanitizeUser(user) {
  return {
    id: user._id.toString(),
    username: user.username,
    email: user.email,
    friends: Array.isArray(user.friends) ? user.friends : [],
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
  };
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidUsername(value) {
  return /^[A-Za-z0-9_-]{3,20}$/.test(value);
}

router.post("/register", async (request, response) => {
  try {
    const { username, email, password } = request.body;

    if (!process.env.JWT_SECRET) {
      return response.status(500).json({ message: "JWT_SECRET no configurado." });
    }

    if (!username || !email || !password) {
      return response.status(400).json({ message: "Completa todos los campos." });
    }

    if (password.length < 6) {
      return response.status(400).json({ message: "La contrasena debe tener al menos 6 caracteres." });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedUsername = String(username).trim();

    if (!isValidUsername(normalizedUsername)) {
      return response.status(400).json({ message: "Usuario invalido. Usa 3-20 letras, numeros, _ o -." });
    }

    if (!isValidEmail(normalizedEmail)) {
      return response.status(400).json({ message: "Email invalido." });
    }

    const existingUser = await User.findOne({
      $or: [{ email: normalizedEmail }, { username: normalizedUsername }],
    });

    if (existingUser) {
      return response.status(409).json({ message: "El usuario o email ya existe." });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      username: normalizedUsername,
      email: normalizedEmail,
      passwordHash,
      friends: [],
      lastLoginAt: new Date(),
    });

    ensureUserProgression(user);
    user.lastLoginAt = new Date();
    await user.save();

    const token = createToken(user);

    return response.status(201).json({
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error("[auth] register failed:", error.message);
    return response.status(500).json({ message: "No se pudo registrar el usuario." });
  }
});

router.post("/login", async (request, response) => {
  try {
    const { identifier, email, username, password } = request.body;
    const loginValue = identifier || email || username;

    if (!process.env.JWT_SECRET) {
      return response.status(500).json({ message: "JWT_SECRET no configurado." });
    }

    if (!loginValue || !password) {
      return response.status(400).json({ message: "Completa usuario/email y contrasena." });
    }

    const normalizedValue = String(loginValue).trim();

    const user = await User.findOne({
      $or: [
        { email: normalizedValue.toLowerCase() },
        { username: normalizedValue },
      ],
    });

    if (!user) {
      return response.status(401).json({ message: "Credenciales invalidas." });
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      return response.status(401).json({ message: "Credenciales invalidas." });
    }

    ensureUserProgression(user);
    user.lastLoginAt = new Date();
    await user.save();

    const token = createToken(user);

    return response.json({
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error("[auth] login failed:", error.message);
    return response.status(500).json({ message: "No se pudo iniciar sesion." });
  }
});

router.get("/me", async (request, response) => {
  try {
    const user = await readAuthenticatedUser(request);

    if (!user) {
      return response.status(401).json({ message: "Sesion no valida." });
    }

    ensureUserProgression(user);
    await user.save();
    const social = await buildSocialDashboard(user);

    return response.json({
      user: sanitizeUser(user),
      progression: buildProgressionPayload(user),
      social: {
        friendLeaderboard: social.friendLeaderboard,
        history: social.history,
        challenges: social.challenges,
        squadLeaderboard: social.squadLeaderboard,
        notifications: social.notifications,
      },
    });
  } catch (error) {
    return response.status(500).json({ message: "No se pudo cargar la sesion." });
  }
});

router.post("/friends/:username", async (request, response) => {
  try {
    const user = await readAuthenticatedUser(request);

    if (!user) {
      return response.status(401).json({ message: "Inicia sesion para agregar amigos." });
    }

    const targetUsername = String(request.params.username || "").trim();

    if (!isValidUsername(targetUsername)) {
      return response.status(400).json({ message: "Usuario invalido." });
    }

    if (targetUsername === user.username) {
      return response.status(400).json({ message: "No puedes agregarte a ti mismo." });
    }

    const targetUser = await User.findOne({ username: targetUsername });

    if (!targetUser) {
      return response.status(404).json({ message: "Ese jugador no tiene cuenta registrada." });
    }

    const currentFriends = Array.isArray(user.friends) ? user.friends : [];

    if (currentFriends.includes(targetUser.username)) {
      return response.json({
        message: `${targetUser.username} ya esta en tus amigos.`,
        user: sanitizeUser(user),
      });
    }

    user.friends = [...new Set([...currentFriends, targetUser.username])];
    ensureUserProgression(user);
    await user.save();

    return response.status(201).json({
      message: `${targetUser.username} agregado a tus amigos.`,
      user: sanitizeUser(user),
      progression: buildProgressionPayload(user),
    });
  } catch (error) {
    console.error("[auth] add friend failed:", error.message);
    return response.status(500).json({ message: "No se pudo agregar el amigo." });
  }
});

module.exports = router;
