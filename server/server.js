const http = require("http");
const path = require("path");
const express = require("express");
const cors = require("cors");
const { Server } = require("socket.io");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, ".env") });
dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

const connectToDatabase = require("./config/database");
const authRoutes = require("./routes/auth");
const scoreRoutes = require("./routes/scores");
const productRoutes = require("./routes/product");
const squadRoutes = require("./routes/squads");
const analyticsRoutes = require("./routes/analytics");
const adminRoutes = require("./routes/admin");

const isProduction = process.env.NODE_ENV === "production";
const configuredClientUrls = (process.env.CLIENT_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const developmentOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5173",
];
const allowedOrigins = new Set([
  ...configuredClientUrls,
  ...(isProduction ? [] : developmentOrigins),
]);

function isVercelOrigin(origin) {
  if (!origin) {
    return false;
  }

  try {
    const { protocol, hostname } = new URL(origin);
    return protocol === "https:" && hostname.endsWith(".vercel.app");
  } catch (error) {
    return false;
  }
}

function isAllowedOrigin(origin) {
  return !origin || allowedOrigins.has(origin) || (isProduction && isVercelOrigin(origin));
}

const corsOptions = {
  origin(origin, callback) {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`Origen no permitido por CORS: ${origin}`));
  },
};

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: corsOptions.origin,
  },
});

const port = Number(process.env.PORT) || 3000;

if (isProduction && !process.env.JWT_SECRET) {
  throw new Error("Falta definir JWT_SECRET en las variables del backend.");
}

app.use(cors(corsOptions));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/scores", scoreRoutes);
app.use("/api/product", productRoutes);
app.use("/api/squads", squadRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/admin", adminRoutes);

app.get("/health", (_request, response) => {
  response.json({
    ok: true,
    databaseState: connectStateLabel(),
  });
});

app.get("*", (request, response, next) => {
  if (request.path.startsWith("/api/")) {
    return next();
  }

  return response.status(404).json({
    message: "NEON HELL API online. Deploy the frontend from web-client on Vercel.",
  });
});

const onlineRooms = new Map();

function normalizeSquadName(value, fallback = "Squad") {
  const cleaned = String(value || fallback).trim().replace(/\s+/g, " ");
  return cleaned.slice(0, 32) || fallback;
}

function buildSquadKey(room) {
  const base = room.squadName || [...room.players.values()].map((player) => player.username).sort().join("-");

  return String(base)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function buildRewardLabel(room) {
  return room.playlistId === "squad-horde"
    ? "+XP, +Season Tokens y ranking por squad"
    : "Presencia compartida y progreso sincronizado";
}

function createRoomCode() {
  let code = "";

  do {
    code = Math.random().toString(36).slice(2, 8).toUpperCase();
  } while (onlineRooms.has(code));

  return code;
}

function serializeRoom(room) {
  return {
    code: room.code,
    status: room.status,
    playlistId: room.playlistId,
    squadName: room.squadName,
    squadKey: buildSquadKey(room),
    rewardLabel: buildRewardLabel(room),
    players: [...room.players.values()].map((player) => ({
      id: player.id,
      username: player.username,
      isHost: player.id === room.hostId,
      ready: player.ready,
      state: player.state,
    })),
  };
}

function joinOnlineRoom(socket, room, username) {
  if (socket.data.onlineRoomCode && socket.data.onlineRoomCode !== room.code) {
    socket.leave(socket.data.onlineRoomCode);
  }

  socket.join(room.code);
  socket.data.onlineRoomCode = room.code;
  room.players.set(socket.id, {
    id: socket.id,
    username: String(username || "Operador").trim().slice(0, 20) || "Operador",
    ready: false,
    state: null,
  });
}

function emitRoomUpdate(room) {
  io.to(room.code).emit("online:room", serializeRoom(room));
}

function createOnlineRoomForHost(socket, { username, playlistId = "squad-horde", squadName } = {}) {
  const code = createRoomCode();
  const room = {
    code,
    hostId: socket.id,
    status: "lobby",
    playlistId: String(playlistId || "squad-horde").trim().slice(0, 20) || "squad-horde",
    squadName: normalizeSquadName(squadName, `${username || "Operador"} Squad`),
    players: new Map(),
    createdAt: Date.now(),
  };

  onlineRooms.set(code, room);
  joinOnlineRoom(socket, room, username);
  return room;
}

function findMatchmakingRoom() {
  return [...onlineRooms.values()].find((room) => (
    room.status === "lobby" &&
    room.playlistId === "squad-horde" &&
    room.players.size < 4
  ));
}

function leaveOnlineRoom(socket) {
  const roomCode = socket.data.onlineRoomCode;

  if (!roomCode) {
    return;
  }

  const room = onlineRooms.get(roomCode);
  socket.leave(roomCode);
  socket.data.onlineRoomCode = null;

  if (!room) {
    return;
  }

  room.players.delete(socket.id);

  if (!room.players.size) {
    onlineRooms.delete(roomCode);
    return;
  }

  if (room.hostId === socket.id) {
    room.hostId = room.players.keys().next().value;
  }

  emitRoomUpdate(room);
}

io.on("connection", (socket) => {
  console.log(`[socket] playerConnected: ${socket.id}`);

  socket.on("online:create", ({ username, playlistId, squadName } = {}, acknowledge) => {
    const room = createOnlineRoomForHost(socket, { username, playlistId, squadName });
    const payload = serializeRoom(room);
    acknowledge?.({ ok: true, room: payload });
    emitRoomUpdate(room);
  });

  socket.on("online:matchmake", ({ username } = {}, acknowledge) => {
    const room = findMatchmakingRoom() || createOnlineRoomForHost(socket, {
      username,
      playlistId: "squad-horde",
      squadName: "Matchmade Horde",
    });

    if (!room.players.has(socket.id)) {
      joinOnlineRoom(socket, room, username);
    }

    const payload = serializeRoom(room);
    acknowledge?.({ ok: true, room: payload });
    emitRoomUpdate(room);
  });

  socket.on("online:configure", ({ code, playlistId, squadName } = {}, acknowledge) => {
    const room = onlineRooms.get(String(code || "").trim().toUpperCase());

    if (!room) {
      acknowledge?.({ ok: false, message: "Sala no encontrada." });
      return;
    }

    if (room.hostId !== socket.id) {
      acknowledge?.({ ok: false, message: "Solo el host puede editar la sala." });
      return;
    }

    room.playlistId = String(playlistId || room.playlistId || "squad-horde").trim().slice(0, 20) || "squad-horde";
    room.squadName = normalizeSquadName(squadName, room.squadName || "Squad");
    acknowledge?.({ ok: true, room: serializeRoom(room) });
    emitRoomUpdate(room);
  });

  socket.on("online:join", ({ code, username } = {}, acknowledge) => {
    const roomCode = String(code || "").trim().toUpperCase();
    const room = onlineRooms.get(roomCode);

    if (!room) {
      acknowledge?.({ ok: false, message: "Sala no encontrada." });
      return;
    }

    if (room.players.size >= 4) {
      acknowledge?.({ ok: false, message: "Sala llena." });
      return;
    }

    joinOnlineRoom(socket, room, username);
    const payload = serializeRoom(room);
    acknowledge?.({ ok: true, room: payload });
    emitRoomUpdate(room);
  });

  socket.on("online:start", ({ code } = {}, acknowledge) => {
    const room = onlineRooms.get(String(code || "").trim().toUpperCase());

    if (!room) {
      acknowledge?.({ ok: false, message: "Sala no encontrada." });
      return;
    }

    if (room.hostId !== socket.id) {
      acknowledge?.({ ok: false, message: "Solo el host puede iniciar." });
      return;
    }

    room.status = "running";
    acknowledge?.({ ok: true, room: serializeRoom(room) });
    io.to(room.code).emit("online:start", serializeRoom(room));
    emitRoomUpdate(room);
  });

  socket.on("online:state", ({ code, state } = {}) => {
    const room = onlineRooms.get(String(code || "").trim().toUpperCase());
    const player = room?.players.get(socket.id);

    if (!room || !player || room.status !== "running") {
      return;
    }

    player.state = state;
    socket.to(room.code).emit("online:state", {
      id: socket.id,
      username: player.username,
      state,
    });
  });

  socket.on("online:shot", ({ code, weaponName } = {}) => {
    const room = onlineRooms.get(String(code || "").trim().toUpperCase());
    const player = room?.players.get(socket.id);

    if (!room || !player || room.status !== "running") {
      return;
    }

    socket.to(room.code).emit("online:shot", {
      id: socket.id,
      username: player.username,
      weaponName,
    });
  });

  socket.on("online:leave", () => {
    leaveOnlineRoom(socket);
  });

  socket.on("disconnect", () => {
    leaveOnlineRoom(socket);
    console.log(`[socket] playerDisconnected: ${socket.id}`);
  });
});

function connectStateLabel() {
  const states = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };

  return states[require("mongoose").connection.readyState] || "unknown";
}

async function startServer() {
  await connectToDatabase();

  server.listen(port, () => {
    console.log(`[server] Escuchando en http://localhost:${port}`);
  });
}

startServer().catch((error) => {
  console.error("[server] El servidor no pudo iniciar:", error.message);
  process.exit(1);
});
