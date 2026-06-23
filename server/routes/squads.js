const express = require("express");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const Notification = require("../models/Notification");
const {
  acceptSquadInvite,
  createSquad,
  formatSquad,
  getUserSquads,
  inviteToSquad,
} = require("../services/squadService");

const router = express.Router();

function readToken(request) {
  const authorization = request.headers.authorization || "";
  const [scheme, value] = authorization.split(" ");
  return scheme === "Bearer" && value ? value : null;
}

async function readAuthenticatedUser(request) {
  const token = readToken(request);

  if (!token || !process.env.JWT_SECRET) {
    return null;
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    return payload?.sub ? User.findById(payload.sub) : null;
  } catch (error) {
    return null;
  }
}

router.get("/", async (request, response) => {
  try {
    const user = await readAuthenticatedUser(request);

    if (!user) {
      return response.status(401).json({ message: "Inicia sesion para ver squads." });
    }

    const squads = await getUserSquads(user.username);
    return response.json({
      squads: squads.map((squad) => formatSquad(squad, user.username)),
    });
  } catch (error) {
    return response.status(500).json({ message: "No se pudieron cargar tus squads." });
  }
});

router.post("/", async (request, response) => {
  try {
    const user = await readAuthenticatedUser(request);

    if (!user) {
      return response.status(401).json({ message: "Inicia sesion para crear squad." });
    }

    const squad = await createSquad({
      name: request.body.name,
      ownerUsername: user.username,
    });

    return response.status(201).json({
      message: `${squad.name} creado.`,
      squad: formatSquad(squad, user.username),
    });
  } catch (error) {
    return response.status(400).json({ message: error.message || "No se pudo crear el squad." });
  }
});

router.post("/:squadKey/invites/:username", async (request, response) => {
  try {
    const user = await readAuthenticatedUser(request);

    if (!user) {
      return response.status(401).json({ message: "Inicia sesion para invitar." });
    }

    const targetUsername = String(request.params.username || "").trim();
    const squad = await inviteToSquad({
      squadKey: request.params.squadKey,
      ownerUsername: user.username,
      targetUsername,
    });

    await Notification.create({
      username: targetUsername,
      type: "squad-invite",
      title: `Invitacion a ${squad.name}`,
      body: `${user.username} te invito a su squad.`,
    });

    return response.status(201).json({
      message: `Invitacion enviada a ${targetUsername}.`,
      squad: formatSquad(squad, user.username),
    });
  } catch (error) {
    return response.status(400).json({ message: error.message || "No se pudo invitar." });
  }
});

router.post("/:squadKey/accept", async (request, response) => {
  try {
    const user = await readAuthenticatedUser(request);

    if (!user) {
      return response.status(401).json({ message: "Inicia sesion para aceptar." });
    }

    const squad = await acceptSquadInvite({
      squadKey: request.params.squadKey,
      username: user.username,
    });

    return response.json({
      message: `Te uniste a ${squad.name}.`,
      squad: formatSquad(squad, user.username),
    });
  } catch (error) {
    return response.status(400).json({ message: error.message || "No se pudo aceptar la invitacion." });
  }
});

module.exports = router;
