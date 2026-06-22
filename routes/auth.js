const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");

const router = express.Router();

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
      lastLoginAt: new Date(),
    });

    user.lastLoginAt = new Date();
    await user.save();

    const token = createToken(user);

    return response.status(201).json({
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
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

    const token = createToken(user);

    return response.json({
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    return response.status(500).json({ message: "No se pudo iniciar sesion." });
  }
});

module.exports = router;
