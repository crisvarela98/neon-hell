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
      options: document.getElementById("screen-options"),
      admin: document.getElementById("screen-admin"),
      game: document.getElementById("screen-game"),
      gameover: document.getElementById("screen-gameover"),
    };

    this.currentScreen = null;
    this.screenHistory = [];
    this.backButton = document.getElementById("btn-global-back");
    this.toast = document.getElementById("toast");
    this.accountChip = document.getElementById("account-chip");
    this.rankingList = document.getElementById("ranking-list");
    this.friendRankingList = document.getElementById("friend-ranking-list");
    this.challengeList = document.getElementById("challenge-list");
    this.historyList = document.getElementById("history-list");
    this.notificationList = document.getElementById("notification-list");
    this.scoreUsername = document.getElementById("score-username");
    this.profileSummary = document.getElementById("profile-summary");
    this.liveEventCard = document.getElementById("live-event-card");
    this.dailyMissionFeed = document.getElementById("daily-missions");
    this.weeklyMissionFeed = document.getElementById("weekly-missions");
    this.menuOnboardingPanel = document.getElementById("menu-onboarding-panel");
    this.seasonPassCard = document.getElementById("season-pass-card");
    this.achievementFeed = document.getElementById("achievement-feed");
    this.cosmeticFeed = document.getElementById("cosmetic-feed");
    this.productEconomyCard = document.getElementById("product-economy-card");
    this.storeFeed = document.getElementById("store-feed");
    this.liveOpsFeed = document.getElementById("liveops-feed");
    this.gameoverProgressSummary = document.getElementById("gameover-progress-summary");
    this.ftueSteps = document.getElementById("ftue-steps");
    this.ftueBenefits = document.getElementById("ftue-benefits");
    this.ftueMissions = document.getElementById("ftue-missions");
    this.ftueCurrent = {
      title: document.getElementById("ftue-current-title"),
      body: document.getElementById("ftue-current-body"),
      art: document.getElementById("ftue-mission-art"),
    };
    this.onlineRoomTitle = document.getElementById("online-room-title");
    this.onlineStatus = document.getElementById("online-status");
    this.onlinePlayers = document.getElementById("online-players");
    this.onlineRewardsCard = document.getElementById("online-rewards-card");
    this.squadLeaderboardList = document.getElementById("squad-leaderboard-list");
    this.squadManagementList = document.getElementById("squad-management-list");
    this.coopMissionList = document.getElementById("coop-mission-list");

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

    this.missionComplete = {
      overlay: document.getElementById("mission-complete-overlay"),
      title: document.getElementById("mission-complete-title"),
      text: document.getElementById("mission-complete-text"),
      score: document.getElementById("mission-complete-score"),
      kills: document.getElementById("mission-complete-kills"),
      next: document.getElementById("mission-complete-next"),
    };
  }

  showScreen(name, { replace = false } = {}) {
    if (!this.screens[name]) {
      return;
    }

    if (this.currentScreen && this.currentScreen !== name && !replace) {
      this.screenHistory.push(this.currentScreen);
      this.screenHistory = this.screenHistory.slice(-24);
    }

    Object.values(this.screens).forEach((screen) => screen.classList.remove("active"));
    this.screens[name].classList.add("active");
    this.currentScreen = name;
    document.body.dataset.screen = name;
    this.updateBackButton();
  }

  goBack(fallback = "menu") {
    const target = this.screenHistory.pop() || fallback;
    this.showScreen(target, { replace: true });
  }

  updateBackButton() {
    if (!this.backButton) {
      return;
    }

    const shouldHide = this.currentScreen === "splash" || this.currentScreen === "menu";
    this.backButton.classList.toggle("hidden", shouldHide);
  }

  updateAccount(user) {
    this.accountChip.textContent = user
      ? `${user.username} conectado${user.friends?.length ? ` // ${user.friends.length} amigos` : ""}`
      : "No conectado";

    this.scoreUsername.readOnly = Boolean(user);
    this.scoreUsername.placeholder = user
      ? "Alias bloqueado por tu cuenta"
      : "Alias para ranking";

    if (user) {
      this.scoreUsername.value = user.username;
    } else {
      this.scoreUsername.value = "";
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

  renderFtue({ missions, complete }) {
    const currentMission = missions[0];

    if (!currentMission) {
      return;
    }

    this.ftueCurrent.title.textContent = currentMission.title;
    this.ftueCurrent.body.textContent = currentMission.body;
    this.ftueCurrent.art.style.backgroundImage = `
      linear-gradient(180deg, rgba(0, 0, 0, 0.08), rgba(0, 0, 0, 0.48)),
      url("${currentMission.art}")
    `;
    this.ftueSteps.innerHTML = currentMission.objectives
      .slice(0, 2)
      .map(
        (objective, index) => `
          <article class="mission-objective">
            <strong>Objetivo ${index + 1}</strong>
            <p>${escapeHtml(objective)}</p>
          </article>
        `,
      )
      .join("");
    this.ftueBenefits.innerHTML = (getFtueBenefits(complete))
      .map(
        (benefit) => `
          <article class="mission-chip ${benefit.done ? "done" : ""}">
            <strong>${escapeHtml(benefit.title)}</strong>
            <p>${escapeHtml(benefit.body)}</p>
          </article>
        `,
      )
      .join("");
    this.ftueMissions.innerHTML = "";

    if (complete) {
      this.showToast("Modo historia listo para continuar.");
    }
  }

  updateOnlineLobby({
    roomCode = "",
    status = "offline",
    players = [],
    isHost = false,
    playlistId = "squad-horde",
    squadName = "",
    rewardLabel = "",
  } = {}) {
    this.onlineRoomTitle.textContent = roomCode ? `Sala ${roomCode}` : "Sin sala";
    this.onlineStatus.textContent = roomCode
      ? `${status}${isHost ? " // Host" : ""}${squadName ? ` // ${squadName}` : ""}`
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

    if (this.onlineRewardsCard) {
      this.onlineRewardsCard.innerHTML = `
        <article class="social-card">
          <strong>${playlistId === "squad-horde" ? "Squad Horde activa" : "Story Coop activa"}</strong>
          <span>${escapeHtml(rewardLabel || "Presencia compartida y progreso sincronizado.")}</span>
          <p>${playlistId === "squad-horde"
            ? "Suma team score, gana season tokens y deja un mejor puesto para tu squad."
            : "Usa coop para aprender mapas, practicar roles y estabilizar la primera sesion."}</p>
        </article>
      `;
    }
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
    const rows = Array.isArray(scores) ? scores : scores?.players || [];

    if (!rows.length) {
      this.rankingList.innerHTML = `
        <article class="ranking-empty panel-card compact">
          <h3>Sin jugadores rankeados</h3>
          <p>Inicia sesion, guarda una partida y el ranking global empezara a poblarse.</p>
        </article>
      `;
      return;
    }

    this.rankingList.innerHTML = rows
      .map(
        (entry, index) => `
          <article class="ranking-item">
            <strong class="ranking-rank">#${index + 1}</strong>
            <div class="ranking-user-cell">
              <span class="ranking-user-name">${escapeHtml(entry.username)}</span>
              <span class="ranking-user-state">${entry.isSelf ? "Tu perfil" : entry.isFriend ? "Amigo" : "Jugador global"}</span>
            </div>
            <div class="ranking-stat-cell">Nivel ${entry.level}</div>
            <div class="ranking-stat-cell">${Number(entry.highestScore || 0).toLocaleString("es-AR")}</div>
            <div class="ranking-action-cell">
              ${entry.isSelf
                ? '<span class="ranking-badge muted">Activo</span>'
                : entry.isFriend
                  ? '<span class="ranking-badge">Agregado</span>'
                  : entry.isRegistered
                    ? `<button class="neon-button alt ranking-add-button" type="button" data-add-friend="${escapeHtml(entry.username)}">Agregar</button>`
                    : '<span class="ranking-badge muted">Invitado</span>'}
            </div>
          </article>
        `,
      )
      .join("");
  }

  renderDashboard({ user = null, progression = null } = {}) {
    if (!progression || !user) {
      this.profileSummary.innerHTML = `
        <article class="profile-kpi">
          <span>Cuenta</span>
          <strong>Invitado</strong>
        </article>
        <article class="profile-kpi">
          <span>Beneficio</span>
          <strong>Progress + social</strong>
        </article>
      `;
      this.liveEventCard.innerHTML = `
        <article class="event-card">
          <span>Evento activo</span>
          <strong>Crea cuenta</strong>
          <p>Desbloquea retos directos, armas permanentes y misiones con XP.</p>
        </article>
      `;
      this.dailyMissionFeed.innerHTML = `<p class="empty-state">Las misiones diarias se activan al iniciar sesion.</p>`;
      this.weeklyMissionFeed.innerHTML = `<p class="empty-state">Vuelve con cuenta para desbloquear progreso semanal.</p>`;
      this.seasonPassCard.innerHTML = `
        <p class="eyebrow">Season pass</p>
        <h3>Meta larga</h3>
        <p class="empty-state">Activa cuenta para ver tiers, recompensas y tokens de temporada.</p>
      `;
      this.achievementFeed.innerHTML = `<p class="empty-state">Los logros se desbloquean al guardar corridas y jugar online.</p>`;
      this.cosmeticFeed.innerHTML = `<p class="empty-state">Titulos, banners, emotes y skins viven en tu progreso de cuenta.</p>`;
      this.renderProductDashboard(null);
      this.renderLiveOps(null);
      this.renderSquads(null);
      this.renderNotifications([]);
      this.menuOnboardingPanel.innerHTML = `
        <p class="eyebrow">Por que volver</p>
        <h3>Primer minuto claro</h3>
        <div class="benefits-list">
          <div class="benefit-item">Termina Boot Bay para entender combate, pickups y ritmo.</div>
          <div class="benefit-item">Guarda tu primera partida para abrir nivel de cuenta, armas y season pass.</div>
          <div class="benefit-item">Vuelve manana por misiones, logros y rewards de squad horde.</div>
        </div>
      `;
      return;
    }

    const unlockedWeapons = progression.unlockedWeapons || [];
    const unlockedCount = unlockedWeapons.filter((weapon) => weapon.unlocked).length;
    const upgrades = progression.permanentUpgrades || {};
    const seasonPass = progression.seasonPass || {};
    const achievements = progression.achievements || [];
    const cosmetics = progression.cosmetics || {};
    const squad = progression.squad || {};

    this.profileSummary.innerHTML = `
      <article class="profile-kpi">
        <span>Operador</span>
        <strong>${escapeHtml(user.username)}</strong>
      </article>
      <article class="profile-kpi">
        <span>Nivel de cuenta</span>
        <strong>${progression.level}</strong>
      </article>
      <article class="profile-kpi">
        <span>XP actual</span>
        <strong>${Number(progression.xp || 0).toLocaleString("es-AR")}</strong>
        <div class="progress-bar-label">${Number(progression.currentLevelXp || 0).toLocaleString("es-AR")} / ${Number(progression.nextLevelXp || 0).toLocaleString("es-AR")}</div>
        <div class="progression-bar"><span style="width:${Math.max(0, Math.min(100, progression.progressPercent || 0))}%"></span></div>
      </article>
      <article class="profile-kpi">
        <span>Mejoras permanentes</span>
        <strong>HP +${(Number(upgrades.healthTier) || 0) * 12} // Ammo +${(Number(upgrades.ammoTier) || 0) * 26}</strong>
        <div class="progress-bar-label">Speed +${((Number(upgrades.speedTier) || 0) * 4)}% // Clases ${unlockedCount}/${unlockedWeapons.length}</div>
      </article>
    `;
    this.liveEventCard.innerHTML = `
      <article class="event-card">
        <span>Evento temporal</span>
        <strong>${escapeHtml(progression.liveEvent?.title || "Sin evento")}</strong>
        <p>${escapeHtml(progression.liveEvent?.description || "Sin bonificaciones activas.")}</p>
        <strong>${escapeHtml(progression.liveEvent?.rewardLabel || "")}</strong>
      </article>
      <div class="weapon-unlock-grid">
        ${unlockedWeapons.map((weapon) => `
          <article class="weapon-chip ${weapon.unlocked ? "" : "locked"}">
            <strong>${escapeHtml(weapon.name)}</strong>
            <span>${escapeHtml(weapon.classLabel)}</span>
            <small>${weapon.unlocked ? "Disponible" : `Nivel ${weapon.unlockLevel}`}</small>
          </article>
        `).join("")}
      </div>
    `;
    this.dailyMissionFeed.innerHTML = this.renderMissionFeed(progression.dailyMissions);
    this.weeklyMissionFeed.innerHTML = this.renderMissionFeed(progression.weeklyMissions);
    this.seasonPassCard.innerHTML = `
      <p class="eyebrow">Season pass</p>
      <h3>${escapeHtml(seasonPass.title || "Season")}</h3>
      <p>${escapeHtml(seasonPass.subtitle || "")}</p>
      <div class="progress-bar-label">Tier ${seasonPass.tier || 0}/${seasonPass.maxTier || 0} // ${Number(seasonPass.passXp || 0).toLocaleString("es-AR")} XP // ${Number(seasonPass.tokens || 0).toLocaleString("es-AR")} tokens</div>
      <div class="progression-bar"><span style="width:${Math.max(0, Math.min(100, seasonPass.progressPercent || 0))}%"></span></div>
      <div class="season-reward-strip">
        ${(seasonPass.rewards || []).slice(0, 4).map((reward) => `<span class="reward-pill ${reward.unlocked ? "done" : ""}">T${reward.tier} ${escapeHtml(reward.label)}</span>`).join("")}
      </div>
    `;
    this.achievementFeed.innerHTML = achievements.length
      ? achievements
          .slice()
          .sort((left, right) => Number(Boolean(right.unlocked)) - Number(Boolean(left.unlocked)))
          .slice(0, 6)
          .map((achievement) => `
            <article class="social-card">
              <strong>${escapeHtml(achievement.title)}</strong>
              <span>${achievement.progress}/${achievement.goal}${achievement.unlocked ? " // Desbloqueado" : ""}</span>
              <p>${escapeHtml(achievement.description)}${achievement.rewardLabel ? ` // Reward: ${escapeHtml(achievement.rewardLabel)}` : ""}</p>
            </article>
          `)
          .join("")
      : `<p class="empty-state">Sin logros todavia.</p>`;
    this.cosmeticFeed.innerHTML = `
      <article class="social-card">
        <strong>Equipado</strong>
        <span>${escapeHtml(cosmetics.equipped?.title || "Sin titulo")} // ${escapeHtml(cosmetics.equipped?.banner || "Sin banner")}</span>
        <p>${escapeHtml(cosmetics.equipped?.weaponSkin || "Skin base")} // ${escapeHtml(cosmetics.equipped?.emote || "Sin emote")}</p>
      </article>
      <article class="social-card">
        <strong>Coleccion</strong>
        <span>${Number(cosmetics.counts?.titles || 0)} titulos // ${Number(cosmetics.counts?.banners || 0)} banners</span>
        <p>${Number(cosmetics.counts?.emotes || 0)} emotes // ${Number(cosmetics.counts?.weaponSkins || 0)} skins</p>
      </article>
    `;
    this.menuOnboardingPanel.innerHTML = `
      <p class="eyebrow">Por que volver</p>
      <h3>Loop de retorno</h3>
      <div class="benefits-list">
        ${(progression.onboarding?.benefits || []).map((benefit) => `<div class="benefit-item">${escapeHtml(benefit)}</div>`).join("")}
      </div>
      <div class="benefits-list">
        ${(progression.onboarding?.quickStart || []).map((benefit) => `<div class="benefit-item">${escapeHtml(benefit)}</div>`).join("")}
      </div>
      <div class="benefits-list">
        <div class="benefit-item">Squad horde completadas: ${Number(squad.hordeRuns || 0)}</div>
        <div class="benefit-item">Mejor team score: ${Number(squad.bestSquadScore || 0).toLocaleString("es-AR")}</div>
        <div class="benefit-item">Ultimo squad: ${escapeHtml(squad.lastSquadName || "Sin historial")}</div>
      </div>
    `;
  }

  renderMissionFeed(missions = []) {
    if (!missions.length) {
      return `<p class="empty-state">Sin misiones disponibles.</p>`;
    }

    return missions
      .map(
        (mission) => `
          <article class="mission-chip ${mission.completed ? "done" : ""}">
            <strong>${escapeHtml(mission.title)}</strong>
            <span>${mission.progress}/${mission.goal} // ${mission.rewardXp} XP</span>
            <p>${escapeHtml(mission.description)}</p>
          </article>
        `,
      )
      .join("");
  }

  renderSocialDashboard({ friendLeaderboard = [], challenges = [], history = [], squadLeaderboard = [], notifications = [] } = {}) {
    this.friendRankingList.innerHTML = friendLeaderboard.length
      ? friendLeaderboard
          .map(
            (entry) => `
              <article class="social-card">
                <div class="social-card-header">
                  <strong>${escapeHtml(entry.username)}</strong>
                  ${entry.isSelf ? '<span class="ranking-badge muted">Tu record</span>' : `<button class="neon-button alt tiny" type="button" data-challenge-friend="${escapeHtml(entry.username)}">Retar</button>`}
                </div>
                <span>Nivel ${entry.level} // Mayor score ${Number(entry.highestScore || 0).toLocaleString("es-AR")}</span>
                ${entry.scoreDelta ? `<div class="social-score-delta">${entry.scoreDelta > 0 ? "+" : ""}${Number(entry.scoreDelta).toLocaleString("es-AR")} vs tu record</div>` : ""}
              </article>
            `,
          )
          .join("")
      : `<p class="empty-state">Agrega amigos desde el ranking para compararte aqui.</p>`;

    this.challengeList.innerHTML = challenges.length
      ? challenges
          .map(
            (challenge) => `
              <article class="social-card">
                <strong>${escapeHtml(challenge.challengerUsername)} vs ${escapeHtml(challenge.targetUsername)}</strong>
                <span>Objetivo ${Number(challenge.targetScore || 0).toLocaleString("es-AR")} // ${escapeHtml(challenge.status)}</span>
                <p>${challenge.winnerUsername ? `Ganador: ${escapeHtml(challenge.winnerUsername)}` : `Expira ${new Date(challenge.expiresAt).toLocaleDateString("es-AR")}`}</p>
              </article>
            `,
          )
          .join("")
      : `<p class="empty-state">Todavia no tienes retos directos activos.</p>`;

    this.historyList.innerHTML = history.length
      ? history
          .map(
            (entry) => `
              <article class="social-card">
                <strong>${Number(entry.score || 0).toLocaleString("es-AR")} pts</strong>
                <span>Wave ${entry.wave} // ${entry.kills} kills // ${entry.timeSurvived}s</span>
                <p>${escapeHtml(entry.biomeId || "run")} ${entry.mutatorId ? `// ${escapeHtml(entry.mutatorId)}` : ""}</p>
              </article>
            `,
          )
          .join("")
      : `<p class="empty-state">Guarda tus corridas para construir historial.</p>`;

    if (this.squadLeaderboardList) {
      this.squadLeaderboardList.innerHTML = squadLeaderboard.length
        ? squadLeaderboard
            .map(
              (entry, index) => `
                <article class="social-card">
                  <strong>#${index + 1} ${escapeHtml(entry.squadName)}</strong>
                  <span>${Number(entry.highestTeamScore || 0).toLocaleString("es-AR")} pts // Wave ${entry.bestWave}</span>
                  <p>${entry.isCurrentSquad ? "Tu squad actual" : escapeHtml((entry.members || []).join(", "))}</p>
                </article>
              `,
            )
            .join("")
        : `<p class="empty-state">Todavia no hay squads rankeados.</p>`;
    }

    this.renderNotifications(notifications);
  }

  renderProductDashboard(product = null) {
    if (!this.productEconomyCard || !this.storeFeed) {
      return;
    }

    if (!product) {
      this.productEconomyCard.innerHTML = `
        <p class="eyebrow">Economia</p>
        <h3>Cuenta requerida</h3>
        <p class="empty-state">Inicia sesion para ver Neon Credits, compras y recibos.</p>
      `;
      this.storeFeed.innerHTML = `<p class="empty-state">La tienda se activa con cuenta.</p>`;
      return;
    }

    this.productEconomyCard.innerHTML = `
      <p class="eyebrow">Economia</p>
      <h3>${Number(product.wallet?.softCurrency || 0).toLocaleString("es-AR")} Neon Credits</h3>
      <p>Premium pass: ${product.premiumOwned ? "activo" : "no activo"}</p>
      <div class="social-feed">
        ${(product.receipts || []).slice(0, 3).map((receipt) => `
          <article class="social-card">
            <strong>${escapeHtml(receipt.title)}</strong>
            <span>${Number(receipt.amount || 0).toLocaleString("es-AR")} credits // ${escapeHtml(receipt.status)}</span>
          </article>
        `).join("") || '<p class="empty-state">Sin recibos todavia.</p>'}
      </div>
    `;

    const storeItems = [product.store?.premiumPass, ...(product.store?.bundles || [])].filter(Boolean);
    this.storeFeed.innerHTML = storeItems.length
      ? storeItems.map((item) => `
        <article class="social-card">
          <div class="social-card-header">
            <strong>${escapeHtml(item.title)}</strong>
            <button class="neon-button alt tiny" type="button" data-purchase-product="${escapeHtml(item.id)}">Comprar</button>
          </div>
          <span>${Number(item.price || 0).toLocaleString("es-AR")} Neon Credits // ${escapeHtml(item.type)}</span>
          <p>${(item.items || []).map((entry) => escapeHtml(entry.label || entry.id)).join(", ")}</p>
        </article>
      `).join("")
      : `<p class="empty-state">Sin items en rotacion.</p>`;
  }

  renderLiveOps(liveOps = null) {
    if (!this.liveOpsFeed) {
      return;
    }

    if (!liveOps) {
      this.liveOpsFeed.innerHTML = `<p class="empty-state">Live ops cargara al iniciar sesion o abrir online.</p>`;
      if (this.coopMissionList) {
        this.coopMissionList.innerHTML = `<p class="empty-state">Sin misiones coop cargadas.</p>`;
      }
      return;
    }

    this.liveOpsFeed.innerHTML = `
      <article class="social-card">
        <strong>${escapeHtml(liveOps.season?.title || "Temporada")}</strong>
        <span>${escapeHtml(liveOps.season?.status || "active")} // ${escapeHtml(liveOps.season?.resetPolicy || "")}</span>
        <p>${escapeHtml(liveOps.season?.startedAt || "")} - ${escapeHtml(liveOps.season?.endsAt || "")}</p>
      </article>
    `;

    if (this.coopMissionList) {
      this.coopMissionList.innerHTML = (liveOps.coopMissions || []).length
        ? liveOps.coopMissions.map((mission) => `
          <article class="social-card">
            <strong>${escapeHtml(mission.title)}</strong>
            <span>${escapeHtml(mission.rewardLabel || "")}</span>
            <p>${escapeHtml(mission.description || "")}</p>
          </article>
        `).join("")
        : `<p class="empty-state">Sin misiones coop activas.</p>`;
    }
  }

  renderSquads(payload = null) {
    if (!this.squadManagementList) {
      return;
    }

    const squads = payload?.squads || [];

    this.squadManagementList.innerHTML = squads.length
      ? squads.map((squad) => `
        <article class="social-card">
          <div class="social-card-header">
            <strong>${escapeHtml(squad.name)}</strong>
            ${squad.hasPendingInvite ? `<button class="neon-button alt tiny" type="button" data-accept-squad="${escapeHtml(squad.key)}">Aceptar</button>` : ""}
          </div>
          <span>${(squad.members || []).length} miembros // ${squad.isMember ? "Miembro" : "Invitado"}</span>
          <p>${(squad.history || []).map((entry) => escapeHtml(entry.summary)).slice(0, 2).join(" // ")}</p>
        </article>
      `).join("")
      : `<p class="empty-state">Crea o busca squad para persistir miembros, roles e historial.</p>`;
  }

  renderNotifications(notifications = []) {
    if (!this.notificationList) {
      return;
    }

    this.notificationList.innerHTML = notifications.length
      ? notifications.map((notification) => `
        <article class="social-card">
          <strong>${escapeHtml(notification.title)}</strong>
          <span>${new Date(notification.createdAt).toLocaleDateString("es-AR")}</span>
          <p>${escapeHtml(notification.body)}</p>
        </article>
      `).join("")
      : `<p class="empty-state">Sin notificaciones asincronicas.</p>`;
  }

  setRankingScope(scope = "global") {
    document.getElementById("btn-ranking-global")?.classList.toggle("active", scope === "global");
    document.getElementById("btn-ranking-friends")?.classList.toggle("active", scope === "friends");
  }

  renderPostRunProgress(summary = null) {
    if (!summary) {
      this.gameoverProgressSummary.innerHTML = "";
      return;
    }

    const unlockedText = (summary.newlyUnlockedWeapons || []).length
      ? ` // Nuevas clases: ${(summary.newlyUnlockedWeapons || []).map((weapon) => weapon.name).join(", ")}`
      : "";
    const completedText = (summary.completedMissions || []).length
      ? ` // Misiones: ${(summary.completedMissions || []).map((mission) => mission.title).join(", ")}`
      : "";
    const seasonText = summary.seasonTierUp
      ? ` // Pase sube a tier ${summary.newSeasonTier}`
      : summary.seasonXpGain
        ? ` // +${summary.seasonXpGain} XP de temporada`
        : "";
    const achievementText = (summary.unlockedAchievements || []).length
      ? ` // Logros: ${(summary.unlockedAchievements || []).map((achievement) => achievement.title).join(", ")}`
      : "";
    const cosmeticText = (summary.newCosmetics || []).length
      ? ` // Cosmeticos: ${(summary.newCosmetics || []).map((item) => item.label).join(", ")}`
      : "";
    const squadText = summary.squadBonusXp
      ? ` // Bonus squad +${summary.squadBonusXp} XP y +${summary.seasonTokensGain || 0} tokens`
      : "";

    this.gameoverProgressSummary.innerHTML = `
      <article class="event-card">
        <span>Progreso de cuenta</span>
        <strong>${summary.levelUp ? `Nivel ${summary.newLevel} alcanzado` : `${summary.xpGain || 0} XP ganados`}</strong>
        <p>${summary.bonusXp ? `${summary.bonusXp} XP extra por misiones` : "Sigue guardando corridas para desbloquear mas clases."}${unlockedText}${completedText}${seasonText}${achievementText}${cosmeticText}${squadText}</p>
      </article>
    `;
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
    this.renderPostRunProgress(null);
  }

  showMissionComplete(data) {
    this.missionComplete.title.textContent = data.title;
    this.missionComplete.text.textContent = data.text;
    this.missionComplete.score.textContent = data.score;
    this.missionComplete.kills.textContent = data.kills;
    this.missionComplete.next.textContent = data.nextTitle;
    this.missionComplete.overlay.classList.remove("hidden");
  }

  hideMissionComplete() {
    this.missionComplete.overlay.classList.add("hidden");
  }
}

function getFtueBenefits(complete) {
  return [
    {
      title: complete ? "Historia lista" : "Paso 1",
      body: complete
        ? "Ya conoces el loop principal. Ahora toca progresar, guardar score y volver manana."
        : "Completa Boot Bay para aprender movimiento, disparo y pickups en menos de un minuto.",
      done: complete,
    },
    {
      title: "Cuenta recomendada",
      body: "Crear usuario activa XP, armas desbloqueables, pase de temporada, cosmeticos y ranking social.",
      done: false,
    },
    {
      title: "Motivo de retorno",
      body: "Las misiones, squads, logros y rewards de temporada te dan objetivos concretos cada vez que vuelves.",
      done: false,
    },
  ];
}

