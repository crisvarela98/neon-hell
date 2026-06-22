const mongoose = require("mongoose");

const RETRY_DELAY_MS = 5000;

let isConnecting = false;
let reconnectTimer = null;
let eventsBound = false;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function clearReconnectTimer() {
  if (!reconnectTimer) {
    return;
  }

  clearTimeout(reconnectTimer);
  reconnectTimer = null;
}

async function waitForActiveConnection() {
  while (isConnecting && mongoose.connection.readyState !== 1) {
    await wait(250);
  }
}

function scheduleReconnect() {
  if (reconnectTimer || isConnecting || mongoose.connection.readyState === 1) {
    return;
  }

  console.log(
    `[mongo] Reintentando conexion en ${RETRY_DELAY_MS / 1000} segundos...`,
  );

  reconnectTimer = setTimeout(async () => {
    reconnectTimer = null;

    try {
      await connectToDatabase();
    } catch (error) {
      console.error("[mongo] Reconexion abortada:", error.message);
    }
  }, RETRY_DELAY_MS);
}

function bindConnectionEvents() {
  if (eventsBound) {
    return;
  }

  eventsBound = true;

  mongoose.connection.on("connected", () => {
    console.log("[mongo] Conexion exitosa con MongoDB Atlas.");
  });

  mongoose.connection.on("error", (error) => {
    console.error("[mongo] Error de conexion:", error.message);
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("[mongo] MongoDB desconectado.");
    scheduleReconnect();
  });

  process.on("SIGINT", async () => {
    clearReconnectTimer();
    await mongoose.connection.close();
    console.log("[mongo] Conexion cerrada por finalizacion de la app.");
    process.exit(0);
  });
}

async function connectToDatabase() {
  const connectionUri = process.env.MONGODB_URI;

  if (!connectionUri) {
    throw new Error("Falta definir process.env.MONGODB_URI.");
  }

  bindConnectionEvents();

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (isConnecting) {
    await waitForActiveConnection();
    return mongoose.connection;
  }

  isConnecting = true;
  clearReconnectTimer();

  while (mongoose.connection.readyState !== 1) {
    try {
      console.log("[mongo] Intentando conectar con MongoDB Atlas...");

      await mongoose.connect(connectionUri, {
        serverSelectionTimeoutMS: 5000,
      });
    } catch (error) {
      console.error("[mongo] No se pudo conectar:", error.message);
      await wait(RETRY_DELAY_MS);
    }
  }

  isConnecting = false;
  return mongoose.connection;
}

module.exports = connectToDatabase;
