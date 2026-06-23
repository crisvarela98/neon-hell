import {
  clearSession,
  fetchTopScores,
  getSession,
  loginUser,
  registerUser,
  saveScore,
} from "./api.js";
import { NeonAudio } from "./audio.js";
import { getFtueState, markFtueComplete } from "./ftue.js";
import { NeonHellGame } from "./game.js";
import { getInitialBriefing, LORE_SECTIONS } from "./lore.js";
import { UIController } from "./ui.js";

const ui = new UIController();
const audio = new NeonAudio();
const game = new NeonHellGame({
  canvas: document.getElementById("game-canvas"),
  onHudChange: (hud) => ui.updateHud(hud),
  onGameOver: (stats) => {
    lastRunStats = stats;
    lastRunSaved = false;
    ui.hideMissionComplete();
    ui.setGameOver(stats);
    ui.showScreen("gameover", { replace: true });
  },
  onMissionComplete: (mission) => ui.showMissionComplete(mission),
  onOnlineState: (payload) => sendOnlineState(payload),
  onOnlineShot: (payload) => sendOnlineShot(payload),
  audio,
});

let lastRunStats = null;
let lastRunSaved = false;
let socket = null;
let onlineRoom = null;

function requestLandscapeMode() {
  const isTouchMobile = window.matchMedia?.("(hover: none) and (pointer: coarse)")?.matches;
  const orientation = window.screen?.orientation;

  if (!isTouchMobile || !orientation?.lock) {
    return;
  }

  orientation.lock("landscape").catch(() => {});
}

function currentUsername() {
  return getSession()?.user?.username || "Operador";
}

function goToMenu({ replace = true } = {}) {
  ui.showScreen("menu", { replace });
}

function pauseGameToMenu() {
  socket?.emit("online:leave");
  onlineRoom = null;
  game.stop();
  ui.hideMissionComplete();
  ui.showToast("Pausa.");
  goToMenu();
}

function navigateBack() {
  if (ui.currentScreen === "splash") {
    return;
  }

  if (ui.currentScreen === "game") {
    pauseGameToMenu();
    return;
  }

  if (ui.currentScreen === "gameover") {
    goToMenu();
    return;
  }

  if (ui.currentScreen === "menu") {
    ui.showToast("Menu principal.");
    return;
  }

  ui.goBack("menu");
}

function installBrowserBackGuard() {
  window.history.replaceState({ neonHell: true }, "", window.location.href);
  window.history.pushState({ neonHell: true }, "", window.location.href);

  window.addEventListener("popstate", () => {
    navigateBack();
    window.history.pushState({ neonHell: true }, "", window.location.href);
  });
}

function openFtue() {
  ui.renderFtue(getFtueState());
  ui.showScreen("ftue");
}

function openBriefing() {
  ui.renderBriefing(getInitialBriefing());
  ui.showScreen("briefing");
}

function openLore() {
  ui.renderLore(LORE_SECTIONS);
  ui.showScreen("lore");
}

function updateAudioOptionButtons() {
  const settings = audio.getSettings();
  const musicButton = document.getElementById("btn-toggle-music");
  const soundsButton = document.getElementById("btn-toggle-sounds");

  if (musicButton) {
    musicButton.textContent = `Musica: ${settings.musicEnabled ? "ON" : "OFF"}`;
  }

  if (soundsButton) {
    soundsButton.textContent = `Sonidos: ${settings.soundsEnabled ? "ON" : "OFF"}`;
  }
}

function openOptions() {
  updateAudioOptionButtons();
  ui.showScreen("options");
}

async function openRanking() {
  try {
    ui.showScreen("ranking");
    ui.renderRanking([]);
    const scores = await fetchTopScores();
    ui.renderRanking(scores);
  } catch (error) {
    ui.showToast(error.message);
  }
}

function startGame() {
  requestLandscapeMode();
  markFtueComplete();
  ui.hideMissionComplete();
  audio.unlock().catch(() => {});
  audio.startMusic();
  ui.showScreen("game");
  game.start(currentUsername());
}

function startFtueMission() {
  markFtueComplete();
  openBriefing();
}

function requireLoggedUser() {
  const session = getSession();

  if (session?.user) {
    return session.user;
  }

  ui.showToast("Crea cuenta o inicia sesion para online.");
  ui.showScreen("auth");
  return null;
}

function emitWithAck(eventName, payload) {
  return new Promise((resolve, reject) => {
    if (!socket?.connected) {
      reject(new Error("Socket offline."));
      return;
    }

    let settled = false;
    const timer = window.setTimeout(() => {
      if (!settled) {
        settled = true;
        reject(new Error("Timeout de sala online."));
      }
    }, 5000);

    socket.emit(eventName, payload, (response) => {
      if (settled) {
        return;
      }

      settled = true;
      window.clearTimeout(timer);

      if (!response?.ok) {
        reject(new Error(response?.message || "Operacion online fallida."));
        return;
      }

      resolve(response);
    });
  });
}

function applyOnlineRoom(room) {
  onlineRoom = room;
  const isHost = room?.players?.some((player) => player.id === socket?.id && player.isHost) || false;
  ui.updateOnlineLobby({
    roomCode: room?.code || "",
    status: room?.status || "offline",
    players: room?.players || [],
    isHost,
  });
  game.syncOnlineRoom(room, socket?.id);
}

function openOnline() {
  if (!requireLoggedUser()) {
    return;
  }

  ui.showScreen("online");
  ui.updateOnlineLobby({
    roomCode: onlineRoom?.code || "",
    status: socket?.connected ? "Socket listo" : "Socket offline",
    players: onlineRoom?.players || [],
    isHost: onlineRoom?.players?.some((player) => player.id === socket?.id && player.isHost),
  });
}

async function createOnlineRoom() {
  const user = requireLoggedUser();

  if (!user) {
    return;
  }

  try {
    const response = await emitWithAck("online:create", { username: user.username });
    applyOnlineRoom(response.room);
    ui.showToast(`Sala ${response.room.code} creada.`);
  } catch (error) {
    ui.showToast(error.message);
  }
}

async function joinOnlineRoom() {
  const user = requireLoggedUser();

  if (!user) {
    return;
  }

  const code = document.getElementById("online-room-code").value.trim().toUpperCase();

  if (!code) {
    ui.showToast("Ingresa codigo de sala.");
    return;
  }

  try {
    const response = await emitWithAck("online:join", { code, username: user.username });
    applyOnlineRoom(response.room);
    ui.showToast(`Entraste a sala ${response.room.code}.`);
  } catch (error) {
    ui.showToast(error.message);
  }
}

async function requestOnlineStart() {
  if (!onlineRoom?.code) {
    ui.showToast("Primero crea o entra a una sala.");
    return;
  }

  requestLandscapeMode();

  try {
    await emitWithAck("online:start", { code: onlineRoom.code });
  } catch (error) {
    ui.showToast(error.message);
  }
}

function startOnlineGame(room) {
  requestLandscapeMode();
  applyOnlineRoom(room);
  markFtueComplete();
  ui.hideMissionComplete();
  audio.unlock().catch(() => {});
  audio.startMusic();
  ui.showScreen("game");
  game.start(currentUsername(), {
    onlineMode: true,
    roomCode: room.code,
  });
  game.syncOnlineRoom(room, socket?.id);
}

function sendOnlineState({ roomCode, state }) {
  socket?.emit("online:state", {
    code: roomCode,
    state,
  });
}

function sendOnlineShot({ roomCode, weaponName }) {
  socket?.emit("online:shot", {
    code: roomCode,
    weaponName,
  });
}

async function handleSaveScore() {
  if (!lastRunStats) {
    return;
  }

  if (lastRunSaved) {
    ui.showToast("Esta corrida ya fue guardada.");
    return;
  }

  try {
    const username = ui.scoreUsername.value.trim() || currentUsername();
    await saveScore({
      ...lastRunStats,
      username,
    });
    lastRunSaved = true;
    ui.showToast("Puntuacion guardada.");
    await openRanking();
  } catch (error) {
    ui.showToast(error.message);
  }
}

function bindMenu() {
  const unlockAudio = () => {
    audio.unlock().catch(() => {});
  };

  window.addEventListener("pointerdown", unlockAudio, { once: true });
  window.addEventListener("keydown", unlockAudio, { once: true });
  document.getElementById("btn-start").addEventListener("click", openBriefing);
  document.getElementById("btn-online").addEventListener("click", openOnline);
  document.getElementById("btn-ranking").addEventListener("click", openRanking);
  document.getElementById("btn-account").addEventListener("click", () => ui.showScreen("auth"));
  document.getElementById("btn-options").addEventListener("click", openOptions);
  document.getElementById("btn-exit").addEventListener("click", () => ui.showToast("NEON HELL listo para otra corrida."));
  document.getElementById("btn-ftue-start").addEventListener("click", startFtueMission);
  document.getElementById("btn-ftue-account").addEventListener("click", () => ui.showScreen("auth"));
  document.getElementById("btn-global-back").addEventListener("click", navigateBack);
  document.getElementById("btn-ftue-back").addEventListener("click", () => goToMenu());
  document.getElementById("btn-online-create").addEventListener("click", createOnlineRoom);
  document.getElementById("btn-online-join").addEventListener("click", joinOnlineRoom);
  document.getElementById("btn-online-start").addEventListener("click", requestOnlineStart);
  document.getElementById("btn-online-back").addEventListener("click", () => goToMenu());
  document.getElementById("btn-deploy").addEventListener("click", startGame);
  document.getElementById("btn-briefing-back").addEventListener("click", () => goToMenu());
  document.getElementById("btn-lore-back").addEventListener("click", () => goToMenu());
  document.getElementById("btn-auth-back").addEventListener("click", () => goToMenu());
  document.getElementById("btn-ranking-back").addEventListener("click", () => goToMenu());
  document.getElementById("btn-controls-back").addEventListener("click", () => goToMenu());
  document.getElementById("btn-options-back").addEventListener("click", () => goToMenu());
  document.getElementById("btn-options-controls").addEventListener("click", () => ui.showScreen("controls"));
  document.getElementById("btn-options-lore").addEventListener("click", openLore);
  document.getElementById("btn-toggle-music").addEventListener("click", () => {
    audio.setMusicEnabled(!audio.getSettings().musicEnabled);
    updateAudioOptionButtons();
  });
  document.getElementById("btn-toggle-sounds").addEventListener("click", () => {
    audio.setSoundsEnabled(!audio.getSettings().soundsEnabled);
    updateAudioOptionButtons();
  });
  document.getElementById("btn-game-menu").addEventListener("click", () => {
    pauseGameToMenu();
  });
  document.getElementById("btn-retry").addEventListener("click", startGame);
  document.getElementById("btn-open-ranking").addEventListener("click", openRanking);
  document.getElementById("btn-back-menu").addEventListener("click", () => goToMenu());
  document.getElementById("btn-save-score").addEventListener("click", handleSaveScore);
  document.getElementById("btn-continue-mission").addEventListener("click", () => {
    ui.hideMissionComplete();
    game.continueMission();
  });
  document.getElementById("btn-logout").addEventListener("click", () => {
    clearSession();
    ui.updateAccount(null);
    ui.showToast("Sesion cerrada.");
  });
}

function bindForms() {
  document.getElementById("login-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    try {
      const session = await loginUser({
        identifier: formData.get("identifier"),
        password: formData.get("password"),
      });
      ui.updateAccount(session.user);
      ui.showToast("Sesion iniciada.");
      goToMenu();
      event.currentTarget.reset();
    } catch (error) {
      ui.showToast(error.message);
    }
  });

  document.getElementById("register-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    try {
      const session = await registerUser({
        username: formData.get("username"),
        email: formData.get("email"),
        password: formData.get("password"),
      });
      ui.updateAccount(session.user);
      ui.showToast("Cuenta creada. Ya podes jugar Mision 1.");
      goToMenu();
      event.currentTarget.reset();
    } catch (error) {
      ui.showToast(error.message);
    }
  });
}

function boot() {
  bindMenu();
  bindForms();
  installBrowserBackGuard();
  ui.updateAccount(getSession()?.user || null);
  updateAudioOptionButtons();

  if (window.io) {
    socket = window.io();
    socket.on("connect", () => {
      ui.showToast("Socket online.");
      ui.updateOnlineLobby({
        roomCode: onlineRoom?.code || "",
        status: onlineRoom?.status || "Socket listo",
        players: onlineRoom?.players || [],
        isHost: onlineRoom?.players?.some((player) => player.id === socket?.id && player.isHost),
      });
    });
    socket.on("disconnect", () => {
      ui.showToast("Socket offline.");
      ui.updateOnlineLobby({ status: "Socket offline", players: [] });
    });
    socket.on("online:room", applyOnlineRoom);
    socket.on("online:start", startOnlineGame);
    socket.on("online:state", (payload) => game.syncOnlinePlayer(payload));
    socket.on("online:shot", (payload) => game.receiveOnlineShot(payload));
  }

  ui.showScreen("splash", { replace: true });
  window.setTimeout(() => {
    goToMenu();
  }, 1600);
}

boot();
