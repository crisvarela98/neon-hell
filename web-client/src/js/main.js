import {
  acceptSquadInvite,
  addFriend,
  clearSession,
  createChallenge,
  fetchAdminAnalytics,
  fetchLiveOps,
  fetchProfile,
  fetchProductDashboard,
  fetchSquads,
  fetchSquadLeaderboard,
  fetchTopScores,
  getSession,
  loginUser,
  purchaseProduct,
  registerUser,
  setSession,
  saveScore,
  trackAnalytics,
  updateAdminConfig,
} from "./api.js";
import { io } from "socket.io-client";
import { NeonAudio } from "./audio.js";
import { getFtueState, markFtueComplete } from "./ftue.js";
import { NeonHellGame } from "./game.js";
import { getInitialBriefing, LORE_SECTIONS } from "./lore.js";
import { UIController } from "./ui.js";

const ui = new UIController();
const SERVER_URL = (import.meta.env.VITE_SERVER_URL || "").replace(/\/$/, "");
const audio = new NeonAudio();
const game = new NeonHellGame({
  canvas: document.getElementById("game-canvas"),
  onHudChange: (hud) => ui.updateHud(hud),
  onGameOver: (stats) => {
    lastRunStats = stats;
    lastRunSaved = false;
    hidePauseOverlay();
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
let dashboardProfile = null;
let dashboardSocial = null;
let dashboardProduct = null;
let dashboardLiveOps = null;
let dashboardSquads = null;
let currentRankingScope = "global";

function onlineConfigElements() {
  return {
    playlist: document.getElementById("online-playlist"),
    squadName: document.getElementById("online-squad-name"),
  };
}

function readOnlineConfig() {
  const { playlist, squadName } = onlineConfigElements();
  const playlistId = playlist?.value || "squad-horde";
  const fallbackSquadName = `${currentUsername()} Squad`;

  return {
    playlistId,
    squadName: (squadName?.value || "").trim().slice(0, 32) || fallbackSquadName,
  };
}

function syncOnlineConfigInputs(room = null) {
  const { playlist, squadName } = onlineConfigElements();

  if (playlist) {
    playlist.value = room?.playlistId || playlist.value || "squad-horde";
  }

  if (squadName) {
    squadName.value = room?.squadName || squadName.value || `${currentUsername()} Squad`;
  }
}

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

function currentUser() {
  return getSession()?.user || null;
}

function goToMenu({ replace = true } = {}) {
  hidePauseOverlay();
  ui.renderDashboard({ user: currentUser(), progression: dashboardProfile });
  ui.renderProductDashboard(dashboardProduct);
  ui.renderLiveOps(dashboardLiveOps);
  ui.renderSquads(dashboardSquads);
  ui.showScreen("menu", { replace });
}

function exitRunToMenu() {
  socket?.emit("online:leave");
  onlineRoom = null;
  game.stop();
  hidePauseOverlay();
  ui.hideMissionComplete();
  goToMenu();
}

function showPauseOverlay() {
  if (!game.pause()) {
    return;
  }

  document.getElementById("pause-overlay")?.classList.remove("hidden");
  document.getElementById("btn-game-menu").textContent = "Continuar";
}

function hidePauseOverlay() {
  document.getElementById("pause-overlay")?.classList.add("hidden");
  document.getElementById("btn-game-menu").textContent = "Pausa";
}

function resumeGame() {
  if (game.resume()) {
    hidePauseOverlay();
  }
}

function toggleGamePause() {
  if (game.paused) {
    resumeGame();
    return;
  }

  showPauseOverlay();
}

function navigateBack() {
  if (ui.currentScreen === "splash") {
    return;
  }

  if (ui.currentScreen === "game") {
    toggleGamePause();
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

function openAdmin() {
  ui.showScreen("admin");
}

async function loadAdminAnalytics() {
  const token = document.getElementById("admin-token").value.trim();
  const feed = document.getElementById("admin-analytics-feed");

  try {
    const payload = await fetchAdminAnalytics(token);
    feed.innerHTML = `
      <article class="social-card">
        <strong>Funnel 30d</strong>
        <span>Registro ${payload.funnel.registration} // Compra ${payload.funnel.purchase}</span>
        <p>D1 ${payload.funnel.d1Return} // D7 ${payload.funnel.d7Return} // Churn ${payload.funnel.churnRisk}</p>
      </article>
      ${(payload.events || []).slice(0, 8).map((event) => `
        <article class="social-card">
          <strong>${event.type}</strong>
          <span>${event.count} eventos // ${event.uniqueUsers} usuarios</span>
        </article>
      `).join("")}
    `;
  } catch (error) {
    ui.showToast(error.message);
  }
}

async function saveAdminConfig() {
  const token = document.getElementById("admin-token").value.trim();
  const key = document.getElementById("admin-config-key").value;
  const raw = document.getElementById("admin-config-json").value.trim();

  try {
    const value = raw ? JSON.parse(raw) : {};
    await updateAdminConfig(token, key, value);
    dashboardLiveOps = await fetchLiveOps();
    ui.renderLiveOps(dashboardLiveOps);
    ui.showToast("Live ops actualizado.");
  } catch (error) {
    ui.showToast(error.message);
  }
}

async function openRanking() {
  try {
    ui.showScreen("ranking");
    ui.setRankingScope(currentRankingScope);
    ui.renderRanking([]);
    ui.renderSocialDashboard(dashboardSocial || {});
    const scores = await fetchTopScores(currentRankingScope);
    ui.renderRanking(scores);
  } catch (error) {
    ui.showToast(error.message);
  }
}

async function handleRankingClick(event) {
  const button = event.target.closest("[data-add-friend]");
  const challengeButton = event.target.closest("[data-challenge-friend]");

  if (!button && !challengeButton) {
    return;
  }

  const user = requireLoggedUser();

  if (!user) {
    return;
  }

  const username = button?.dataset.addFriend || challengeButton?.dataset.challengeFriend;

  if (!username) {
    return;
  }

  const activeButton = button || challengeButton;
  activeButton.disabled = true;

  try {
    if (button) {
      const payload = await addFriend(username);
      ui.updateAccount(payload.user);
      ui.showToast(payload.message || `${username} agregado.`);
    } else {
      const payload = await createChallenge(username);
      ui.showToast(payload.message || `Reto activo contra ${username}.`);
    }

    await refreshDashboard();
    await openRanking();
  } catch (error) {
    ui.showToast(error.message);
  } finally {
    activeButton.disabled = false;
  }
}

function startGame() {
  requestLandscapeMode();
  markFtueComplete();
  ui.hideMissionComplete();
  audio.unlock().catch(() => {});
  audio.startMusic();
  hidePauseOverlay();
  ui.showScreen("game");
  game.start(currentUsername(), {
    progression: dashboardProfile,
    liveEvent: dashboardProfile?.liveEvent,
  });
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

  ui.showToast("Crea cuenta o inicia sesion para progreso, amigos y online.");
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
  syncOnlineConfigInputs(room);
  ui.updateOnlineLobby({
    roomCode: room?.code || "",
    status: room?.status || "offline",
    players: room?.players || [],
    isHost,
    playlistId: room?.playlistId || "squad-horde",
    squadName: room?.squadName || "",
    rewardLabel: room?.rewardLabel || "",
  });
  game.syncOnlineRoom(room, socket?.id);
}

async function openOnline() {
  syncOnlineConfigInputs(onlineRoom);
  ui.showScreen("online");
  ui.updateOnlineLobby({
    roomCode: onlineRoom?.code || "",
    status: socket?.connected ? "Socket listo" : "Socket offline",
    players: onlineRoom?.players || [],
    isHost: onlineRoom?.players?.some((player) => player.id === socket?.id && player.isHost),
    playlistId: onlineRoom?.playlistId || readOnlineConfig().playlistId,
    squadName: onlineRoom?.squadName || readOnlineConfig().squadName,
    rewardLabel: onlineRoom?.rewardLabel || "",
  });

  if (!currentUser()) {
    ui.showToast("Inicia sesion para crear sala, matchmaking y squads.");
    ui.renderSquads(null);
    ui.renderLiveOps(dashboardLiveOps);
    return;
  }

  try {
    const [payload, squads, liveOps] = await Promise.all([
      fetchSquadLeaderboard(),
      fetchSquads(),
      fetchLiveOps(),
    ]);
    dashboardSocial = {
      ...(dashboardSocial || {}),
      squadLeaderboard: payload.squads || [],
    };
    dashboardSquads = squads;
    dashboardLiveOps = liveOps;
    ui.renderSocialDashboard(dashboardSocial);
    ui.renderSquads(squads);
    ui.renderLiveOps(liveOps);
  } catch (error) {
    ui.showToast(error.message);
  }
}

async function refreshDashboard({ silent = true } = {}) {
  const session = getSession();

  if (!session?.token) {
    dashboardProfile = null;
    dashboardSocial = null;
    dashboardProduct = null;
    dashboardLiveOps = null;
    dashboardSquads = null;
    ui.updateAccount(null);
    ui.renderDashboard({ user: null, progression: null });
    ui.renderSocialDashboard({});
    ui.renderProductDashboard(null);
    ui.renderLiveOps(null);
    ui.renderSquads(null);
    return null;
  }

  try {
    const [payload, product, liveOps, squads] = await Promise.all([
      fetchProfile(),
      fetchProductDashboard(),
      fetchLiveOps(),
      fetchSquads(),
    ]);
    const session = getSession();

    if (session?.token) {
      setSession({
        ...session,
        user: payload.user,
      });
    }

    dashboardProfile = payload.progression;
    dashboardSocial = payload.social;
    dashboardProduct = product;
    dashboardLiveOps = liveOps;
    dashboardSquads = squads;
    ui.updateAccount(payload.user);
    ui.renderDashboard({ user: payload.user, progression: payload.progression });
    ui.renderSocialDashboard(payload.social);
    ui.renderProductDashboard(product);
    ui.renderLiveOps(liveOps);
    ui.renderSquads(squads);
    return payload;
  } catch (error) {
    if (!silent) {
      ui.showToast(error.message);
    }
    return null;
  }
}

async function createOnlineRoom() {
  const user = requireLoggedUser();

  if (!user) {
    return;
  }

  try {
    const response = await emitWithAck("online:create", {
      username: user.username,
      ...readOnlineConfig(),
    });
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

async function requestMatchmaking() {
  const user = requireLoggedUser();

  if (!user) {
    return;
  }

  try {
    const response = await emitWithAck("online:matchmake", { username: user.username });
    applyOnlineRoom(response.room);
    ui.showToast(`Matchmaking listo: sala ${response.room.code}.`);
  } catch (error) {
    ui.showToast(error.message);
  }
}

async function syncOnlineRoomConfig() {
  if (!onlineRoom?.code) {
    return;
  }

  const isHost = onlineRoom?.players?.some((player) => player.id === socket?.id && player.isHost);

  if (!isHost) {
    return;
  }

  try {
    const response = await emitWithAck("online:configure", {
      code: onlineRoom.code,
      ...readOnlineConfig(),
    });
    applyOnlineRoom(response.room);
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
  hidePauseOverlay();
  ui.showScreen("game");
  game.start(currentUsername(), {
    onlineMode: true,
    roomCode: room.code,
    playlistId: room.playlistId,
    squadName: room.squadName,
    onlineRoom: room,
    progression: dashboardProfile,
    liveEvent: dashboardProfile?.liveEvent,
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
    const payload = await saveScore({
      ...lastRunStats,
      username,
    });
    trackAnalytics("score_saved", {
      score: lastRunStats.score,
      wave: lastRunStats.wave,
      onlineMode: Boolean(lastRunStats.onlineMode),
    }).catch(() => {});
    lastRunSaved = true;
    ui.renderPostRunProgress(payload?.progression ? payload : null);

    if (payload?.progression) {
      dashboardProfile = payload.progression;
    }

    if (payload?.surpassedFriends?.length) {
      ui.showToast(`Superaste a ${payload.surpassedFriends.join(", ")}.`);
    } else if (payload?.unlockedAchievements?.length) {
      ui.showToast(`Logro: ${payload.unlockedAchievements[0].title}.`);
    } else if (payload?.seasonTierUp) {
      ui.showToast(`Tier ${payload.newSeasonTier} del pase desbloqueado.`);
    } else if (payload?.completedChallenges?.length) {
      ui.showToast("Reto completado.");
    } else if (payload?.progression) {
      ui.showToast("Puntuacion guardada y progreso actualizado.");
    } else {
      ui.showToast("Puntuacion guardada. Crea cuenta para sumar progreso.");
    }

    await refreshDashboard();
  } catch (error) {
    ui.showToast(error.message);
  }
}

async function handleProductAction(event) {
  const purchaseButton = event.target.closest("[data-purchase-product]");
  const acceptButton = event.target.closest("[data-accept-squad]");

  if (!purchaseButton && !acceptButton) {
    return;
  }

  if (!requireLoggedUser()) {
    return;
  }

  const activeButton = purchaseButton || acceptButton;
  activeButton.disabled = true;

  try {
    if (purchaseButton) {
      const payload = await purchaseProduct(purchaseButton.dataset.purchaseProduct);
      dashboardProduct = payload.product;
      dashboardProfile = payload.progression;
      ui.renderProductDashboard(payload.product);
      ui.renderDashboard({ user: currentUser(), progression: payload.progression });
      ui.showToast(payload.message || "Compra completada.");
      trackAnalytics("purchase_success", {
        itemId: purchaseButton.dataset.purchaseProduct,
      }).catch(() => {});
    } else {
      const payload = await acceptSquadInvite(acceptButton.dataset.acceptSquad);
      ui.showToast(payload.message || "Invitacion aceptada.");
      const squads = await fetchSquads();
      dashboardSquads = squads;
      ui.renderSquads(squads);
    }
  } catch (error) {
    ui.showToast(error.message);
  } finally {
    activeButton.disabled = false;
  }
}

function bindMenu() {
  const unlockAudio = () => {
    audio.unlock().catch(() => {});
  };

  window.addEventListener("pointerdown", unlockAudio, { once: true });
  window.addEventListener("keydown", unlockAudio, { once: true });
  document.getElementById("btn-start").addEventListener("click", () => {
    if (!getFtueState().complete) {
      openFtue();
      return;
    }

    openBriefing();
  });
  document.getElementById("btn-online").addEventListener("click", openOnline);
  document.getElementById("btn-ranking").addEventListener("click", openRanking);
  document.getElementById("btn-account").addEventListener("click", () => ui.showScreen("auth"));
  document.getElementById("btn-menu-onboarding").addEventListener("click", openFtue);
  document.getElementById("btn-options").addEventListener("click", openOptions);
  document.getElementById("btn-exit").addEventListener("click", () => ui.showToast("NEON HELL listo para otra corrida."));
  document.getElementById("btn-ftue-start").addEventListener("click", startFtueMission);
  document.getElementById("btn-ftue-account").addEventListener("click", () => ui.showScreen("auth"));
  document.getElementById("btn-global-back").addEventListener("click", navigateBack);
  document.getElementById("btn-ftue-back").addEventListener("click", () => goToMenu());
  document.getElementById("btn-online-create").addEventListener("click", createOnlineRoom);
  document.getElementById("btn-online-matchmake").addEventListener("click", requestMatchmaking);
  document.getElementById("btn-online-join").addEventListener("click", joinOnlineRoom);
  document.getElementById("btn-online-start").addEventListener("click", requestOnlineStart);
  document.getElementById("btn-online-back").addEventListener("click", () => goToMenu());
  document.getElementById("online-playlist").addEventListener("change", syncOnlineRoomConfig);
  document.getElementById("online-squad-name").addEventListener("change", syncOnlineRoomConfig);
  document.getElementById("btn-deploy").addEventListener("click", startGame);
  document.getElementById("btn-briefing-back").addEventListener("click", () => goToMenu());
  document.getElementById("btn-lore-back").addEventListener("click", () => goToMenu());
  document.getElementById("btn-auth-back").addEventListener("click", () => goToMenu());
  document.getElementById("btn-ranking-back").addEventListener("click", () => goToMenu());
  document.getElementById("btn-controls-back").addEventListener("click", () => goToMenu());
  document.getElementById("btn-options-back").addEventListener("click", () => goToMenu());
  document.getElementById("btn-options-controls").addEventListener("click", () => ui.showScreen("controls"));
  document.getElementById("btn-options-lore").addEventListener("click", openLore);
  document.getElementById("btn-options-admin").addEventListener("click", openAdmin);
  document.getElementById("btn-admin-back").addEventListener("click", openOptions);
  document.getElementById("btn-admin-load").addEventListener("click", loadAdminAnalytics);
  document.getElementById("btn-admin-save").addEventListener("click", saveAdminConfig);
  document.getElementById("btn-toggle-music").addEventListener("click", () => {
    audio.setMusicEnabled(!audio.getSettings().musicEnabled);
    updateAudioOptionButtons();
  });
  document.getElementById("btn-toggle-sounds").addEventListener("click", () => {
    audio.setSoundsEnabled(!audio.getSettings().soundsEnabled);
    updateAudioOptionButtons();
  });
  document.getElementById("btn-game-menu").addEventListener("click", () => {
    toggleGamePause();
  });
  document.getElementById("btn-resume-game").addEventListener("click", resumeGame);
  document.getElementById("btn-exit-run").addEventListener("click", exitRunToMenu);
  document.getElementById("btn-retry").addEventListener("click", startGame);
  document.getElementById("btn-open-ranking").addEventListener("click", openRanking);
  document.getElementById("btn-back-menu").addEventListener("click", () => goToMenu());
  document.getElementById("btn-save-score").addEventListener("click", handleSaveScore);
  ui.rankingList.addEventListener("click", handleRankingClick);
  document.getElementById("friend-ranking-list").addEventListener("click", handleRankingClick);
  document.getElementById("store-feed")?.addEventListener("click", handleProductAction);
  document.getElementById("squad-management-list")?.addEventListener("click", handleProductAction);
  document.getElementById("btn-ranking-global").addEventListener("click", () => {
    currentRankingScope = "global";
    openRanking();
  });
  document.getElementById("btn-ranking-friends").addEventListener("click", () => {
    currentRankingScope = "friends";
    openRanking();
  });
  document.getElementById("btn-continue-mission").addEventListener("click", () => {
    ui.hideMissionComplete();
    game.continueMission();
  });
  document.getElementById("btn-logout").addEventListener("click", () => {
    clearSession();
    dashboardProfile = null;
    dashboardSocial = null;
    dashboardProduct = null;
    dashboardLiveOps = null;
    dashboardSquads = null;
    ui.updateAccount(null);
    ui.renderDashboard({ user: null, progression: null });
    ui.renderSocialDashboard({});
    ui.renderProductDashboard(null);
    ui.renderLiveOps(null);
    ui.renderSquads(null);
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
      await refreshDashboard();
      ui.showToast("Sesion iniciada.");
      trackAnalytics("login_success").catch(() => {});
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
      await refreshDashboard();
      ui.showToast("Cuenta creada. Ya puedes empezar a progresar.");
      trackAnalytics("register_success").catch(() => {});
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
  ui.renderDashboard({ user: currentUser(), progression: null });
  ui.renderSocialDashboard({});
  ui.renderProductDashboard(null);
  ui.renderLiveOps(null);
  ui.renderSquads(null);
  updateAudioOptionButtons();
  refreshDashboard();

  socket = io(SERVER_URL || undefined);
  socket.on("connect", () => {
    ui.showToast("Socket online.");
    ui.updateOnlineLobby({
      roomCode: onlineRoom?.code || "",
      status: onlineRoom?.status || "Socket listo",
      players: onlineRoom?.players || [],
      isHost: onlineRoom?.players?.some((player) => player.id === socket?.id && player.isHost),
      playlistId: onlineRoom?.playlistId || readOnlineConfig().playlistId,
      squadName: onlineRoom?.squadName || readOnlineConfig().squadName,
      rewardLabel: onlineRoom?.rewardLabel || "",
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

  ui.showScreen("splash", { replace: true });
  window.setTimeout(() => {
    goToMenu();
  }, 1600);
}

boot();
