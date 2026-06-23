const Squad = require("../models/Squad");

function normalizeSquadKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function getUserSquads(username) {
  return Squad.find({
    $or: [
      { "members.username": username },
      { "invites.username": username, "invites.status": "pending" },
    ],
  })
    .sort({ updatedAt: -1 })
    .limit(12)
    .lean();
}

async function createSquad({ name, ownerUsername }) {
  const cleanName = String(name || `${ownerUsername} Squad`).trim().slice(0, 32);
  const key = normalizeSquadKey(`${cleanName}-${ownerUsername}`);
  const existing = await Squad.findOne({ key });

  if (existing) {
    return existing;
  }

  return Squad.create({
    key,
    name: cleanName,
    ownerUsername,
    members: [
      {
        username: ownerUsername,
        role: "owner",
      },
    ],
    history: [
      {
        type: "created",
        summary: `${ownerUsername} fundo ${cleanName}.`,
      },
    ],
  });
}

async function inviteToSquad({ squadKey, ownerUsername, targetUsername }) {
  const squad = await Squad.findOne({ key: squadKey });

  if (!squad) {
    throw new Error("Squad no encontrado.");
  }

  const member = squad.members.find((entry) => entry.username === ownerUsername);

  if (!member || !["owner", "captain"].includes(member.role)) {
    throw new Error("No tienes permisos para invitar.");
  }

  if (squad.members.some((entry) => entry.username === targetUsername)) {
    throw new Error("Ese jugador ya pertenece al squad.");
  }

  const invite = squad.invites.find((entry) => entry.username === targetUsername && entry.status === "pending");

  if (!invite) {
    squad.invites.push({
      username: targetUsername,
      invitedBy: ownerUsername,
    });
    squad.history.unshift({
      type: "invite",
      summary: `${ownerUsername} invito a ${targetUsername}.`,
    });
  }

  await squad.save();
  return squad;
}

async function acceptSquadInvite({ squadKey, username }) {
  const squad = await Squad.findOne({ key: squadKey });

  if (!squad) {
    throw new Error("Squad no encontrado.");
  }

  const invite = squad.invites.find((entry) => entry.username === username && entry.status === "pending");

  if (!invite) {
    throw new Error("No tienes invitacion pendiente.");
  }

  invite.status = "accepted";
  squad.members.push({
    username,
    role: "member",
  });
  squad.history.unshift({
    type: "join",
    summary: `${username} se unio al squad.`,
  });
  await squad.save();
  return squad;
}

async function recordSquadRun({ squadKey, squadName, members = [], teamScore = 0, wave = 1 }) {
  const key = normalizeSquadKey(squadKey || squadName || members.join("-"));

  if (!key) {
    return null;
  }

  let squad = await Squad.findOne({ key });

  if (!squad) {
    const ownerUsername = members[0] || "Operador";
    squad = await Squad.create({
      key,
      name: String(squadName || "Squad Horde").trim().slice(0, 32),
      ownerUsername,
      members: [
        {
          username: ownerUsername,
          role: "owner",
        },
      ],
      history: [
        {
          type: "created",
          summary: `${ownerUsername} fundo ${squadName || "Squad Horde"}.`,
        },
      ],
    });
  }

  squad.stats.bestScore = Math.max(Number(squad.stats.bestScore) || 0, Number(teamScore) || 0);
  squad.stats.totalRuns = (Number(squad.stats.totalRuns) || 0) + 1;
  squad.history.unshift({
    type: "run",
    summary: `Horda wave ${wave} con ${Number(teamScore || 0).toLocaleString("es-AR")} puntos.`,
    score: Number(teamScore) || 0,
  });
  squad.history = squad.history.slice(0, 20);

  members.forEach((username) => {
    if (username && !squad.members.some((member) => member.username === username)) {
      squad.members.push({
        username,
        role: squad.members.length ? "member" : "owner",
      });
    }
  });

  await squad.save();
  return squad;
}

function formatSquad(squad, username = "") {
  return {
    key: squad.key,
    name: squad.name,
    ownerUsername: squad.ownerUsername,
    members: squad.members || [],
    invites: (squad.invites || []).filter((invite) => invite.status === "pending"),
    history: (squad.history || []).slice(0, 8),
    stats: squad.stats || {},
    isMember: username ? (squad.members || []).some((member) => member.username === username) : false,
    hasPendingInvite: username ? (squad.invites || []).some((invite) => invite.username === username && invite.status === "pending") : false,
  };
}

module.exports = {
  acceptSquadInvite,
  createSquad,
  formatSquad,
  getUserSquads,
  inviteToSquad,
  normalizeSquadKey,
  recordSquadRun,
};
