function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[character];
  });
}

export class UIController {
  constructor() {
    this.screens = {
      splash: document.getElementById("screen-splash"),
      menu: document.getElementById("screen-menu"),
      briefing: document.getElementById("screen-briefing"),
      ftue: document.getElementById("screen-ftue"),
      online: document.getElementById("screen-online"),
      lore: document.getElementById("screen-lore"),
      auth: document.getElementById("screen-auth"),
      ranking: document.getElementById("screen-ranking"),
      controls: document.getElementById("screen-controls"),
      game: document.getElementById("screen-game"),
      gameover: document.getElementById("screen-gameover"),
    };

    this.toast = document.getElementById("toast");
    this.accountChip = document.getElementById("account-chip");
    this.rankingList = document.getElementById("ranking-list");
    this.scoreUsername = document.getElementById("score-username");
    this.ftueSteps = document.getElementById("ftue-steps");
    this.ftueMissions = document.getElementById("ftue-missions");
    this.onlineRoomTitle = document.getElementById("online-room-title");
    this.onlineStatus = document.getElementById("online-status");
    this.onlinePlayers = document.getElementById("online-players");

    this.briefing = {
      chapter: document.getElementById("briefing-chapter"),
      title: document.getElementById("briefing-title"),
      text: document.getElementById("briefing-text"),
      art: document.getElementById("briefing-art"),
      objectives: document.getElementById("briefing-objectives"),
    };

    this.loreList = document.getElementById("lore-list");

    this.hud = {
      levelName: document.getElementById("hud-level-name"),
      playerName: document.getElementById("hud-player-name"),
      health: document.getElementById("hud-health"),
      ammo: document.getElementById("hud-ammo"),
      score: document.getElementById("hud-score"),
      wave: document.getElementById("hud-wave"),
      kills: document.getElementById("hud-kills"),
      weapon: document.getElementById("hud-weapon"),
      boost: document.getElementById("hud-boost"),
      boss: document.getElementById("hud-boss"),
      online: document.getElementById("hud-online"),
      objective: document.getElementById("hud-objective"),
      objectiveDetail: document.getElementById("hud-objective-detail"),
      alert: document.getElementById("hud-alert"),
    };

    this.gameOverStats = {
      score: document.getElementById("gameover-score"),
      kills: document.getElementById("gameover-kills"),
      wave: document.getElementById("gameover-wave"),
      time: document.getElementById("gameover-time"),
    };
  }

  showScreen(name) {
    Object.values(this.screens).forEach((screen) => screen.classList.remove("active"));
    this.screens[name]?.classList.add("active");
  }

  updateAccount(user) {
    this.accountChip.textContent = user
      ? `Conectado como ${user.username}`
      : "No conectado";

    if (user && !this.scoreUsername.value) {
      this.scoreUsername.value = user.username;
    }
  }

  renderBriefing(briefing) {
    this.briefing.chapter.textContent = briefing.chapter;
    this.briefing.title.textContent = briefing.title;
    this.briefing.text.textContent = briefing.text;
    this.briefing.art.style.backgroundImage = `
      linear-gradient(180deg, rgba(0, 0, 0, 0.08), rgba(0, 0, 0, 0.48)),
      url("${briefing.art}")
    `;
    this.briefing.objectives.innerHTML = briefing.objectives
      .map(
        (objective, index) => `
          <article class="briefing-item">
            <strong>Objetivo ${index + 1}</strong>
            <p>${objective}</p>
          </article>
        `,
      )
      .join("");
  }

  renderFtue({ steps, missions, complete }) {
    this.ftueSteps.innerHTML = steps
      .map(
        (step, index) => `
          <article class="ftue-step">
            <strong>${index + 1}. ${escapeHtml(step.title)}</strong>
            <p>${escapeHtml(step.body)}</p>
          </article>
        `,
      )
      .join("");

    this.ftueMissions.innerHTML = missions
      .map(
        (mission) => `
          <article class="mission-card">
            <span>${escapeHtml(mission.label)}</span>
            <h3>${escapeHtml(mission.title)}</h3>
            <p>${escapeHtml(mission.body)}</p>
          </article>
        `,
      )
      .join("");

    if (complete) {
      this.showToast("FTUE ya marcado como completado.");
    }
  }

  updateOnlineLobby({ roomCode = "", status = "offline", players = [], isHost = false } = {}) {
    this.onlineRoomTitle.textContent = roomCode ? `Sala ${roomCode}` : "Sin sala";
    this.onlineStatus.textContent = roomCode
      ? `${status}${isHost ? " // Host" : ""}`
      : status;
    this.onlinePlayers.innerHTML = players.length
      ? players
          .map(
            (player) => `
              <article class="online-player">
                <strong>${escapeHtml(player.username)}</strong>
                <span>${player.isHost ? "Host" : "Operador"}</span>
              </article>
            `,
          )
          .join("")
      : `<p class="empty-state">Sin operadores en sala.</p>`;
  }

  renderLore(sections) {
    this.loreList.innerHTML = sections
      .map(
        (section) => `
          <article class="lore-item">
            <h3>${section.title}</h3>
            <p>${section.body}</p>
          </article>
        `,
      )
      .join("");
  }

  updateHud(data) {
    this.hud.levelName.textContent = data.levelName;
    this.hud.playerName.textContent = data.playerName;
    this.hud.health.textContent = data.health;
    this.hud.ammo.textContent = data.ammoLabel || `${data.ammo} / ${data.altAmmo}`;
    this.hud.score.textContent = data.score;
    this.hud.wave.textContent = data.wave;
    this.hud.kills.textContent = data.kills;
    this.hud.weapon.textContent = data.weaponName;
    this.hud.boost.textContent = data.boostLabel || "Normal";
    this.hud.boss.textContent = data.bossLabel || "Sin jefe";
    this.hud.online.textContent = data.onlineLabel || "Solo";
    this.hud.objective.textContent = data.objectiveTitle || "Sobrevive.";
    this.hud.objectiveDetail.textContent = data.objectiveDetail || "";
    this.hud.alert.textContent = data.alert;
  }

  renderRanking(scores) {
    if (!scores.length) {
      this.rankingList.innerHTML = `
        <div class="panel-card compact">
          <h3>Sin registros</h3>
          <p>Todavia no hay puntuaciones guardadas en MongoDB.</p>
        </div>
      `;
      return;
    }

    this.rankingList.innerHTML = scores
      .map(
        (entry, index) => `
          <article class="ranking-item">
            <strong>#${index + 1}</strong>
            <div>${escapeHtml(entry.username)}</div>
            <div>Score ${entry.score}</div>
            <div>Kills ${entry.kills}</div>
            <div>Wave ${entry.wave}</div>
            <div>${entry.timeSurvived}s</div>
          </article>
        `,
      )
      .join("");
  }

  showToast(message) {
    this.toast.textContent = message;
    this.toast.classList.add("visible");
    clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => {
      this.toast.classList.remove("visible");
    }, 2400);
  }

  setGameOver(stats) {
    this.gameOverStats.score.textContent = stats.score;
    this.gameOverStats.kills.textContent = stats.kills;
    this.gameOverStats.wave.textContent = stats.wave;
    this.gameOverStats.time.textContent = `${stats.timeSurvived}s`;
    this.scoreUsername.value = stats.username || this.scoreUsername.value || "Operador";
  }
}
