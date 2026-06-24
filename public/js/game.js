import { getLevelSequence } from "./levels.js";
import { Player } from "./player.js";
import { chooseRunMutator } from "./meta.js";
import { createBossEnemy, createWaveEnemies } from "./enemies.js";
import { WeaponSystem } from "./weapons.js";
import { renderScene } from "./raycaster.js";

function getPickupColor(type) {
  if (type === "health") {
    return "#39FF14";
  }

  if (type === "overcharge") {
    return "#FF00FF";
  }

  if (type === "fury") {
    return "#FF0055";
  }

  if (type === "shield") {
    return "#00FFFF";
  }

  if (type === "arsenal") {
    return "#39FF14";
  }

  return "#00FFFF";
}

export class NeonHellGame {
  constructor({
    canvas,
    onHudChange,
    onGameOver,
    onMissionComplete,
    onOnlineState,
    onOnlineShot,
    audio = null,
  }) {
    this.canvas = canvas;
    this.context = canvas.getContext("2d");
    this.onHudChange = onHudChange;
    this.onGameOver = onGameOver;
    this.onMissionComplete = onMissionComplete;
    this.onOnlineState = onOnlineState;
    this.onOnlineShot = onOnlineShot;
    this.audio = audio;
    this.input = this.createInputState();
    this.running = false;
    this.paused = false;
    this.loopHandle = 0;
    this.runtime = 0;
    this.showMinimap = true;
    this.remotePlayers = new Map();
    this.onlineMode = false;
    this.onlineRoomCode = "";
    this.onlinePlaylistId = "solo";
    this.onlineSquadName = "";
    this.onlineRoom = null;
    this.onlineStateTimer = 0;
    this.bindInputs();
    this.resizeCanvas();
    window.addEventListener("resize", () => this.resizeCanvas());
  }

  createInputState() {
    return {
      forward: false,
      backward: false,
      strafeLeft: false,
      strafeRight: false,
      turnLeft: false,
      turnRight: false,
      fire: false,
      use: false,
      reload: false,
      moveAxis: 0,
      strafeAxis: 0,
    };
  }

  bindInputs() {
    const keyMap = {
      KeyW: "forward",
      KeyS: "backward",
      KeyA: "strafeLeft",
      KeyD: "strafeRight",
      KeyE: "use",
      KeyQ: "swapWeapon",
      KeyR: "reload",
      KeyM: "toggleMinimap",
      ArrowLeft: "turnLeft",
      ArrowRight: "turnRight",
      Space: "fire",
    };

    window.addEventListener("keydown", (event) => {
      const action = keyMap[event.code];

      if (!action) {
        return;
      }

      event.preventDefault();

      if (!this.running || this.paused) {
        return;
      }

      if (action === "toggleMinimap") {
        if (!event.repeat) {
          this.showMinimap = !this.showMinimap;
          this.pushAlert(this.showMinimap ? "Minimapa activado." : "Minimapa oculto.");
        }
        return;
      }

      if (action === "swapWeapon") {
        if (!event.repeat) {
          this.requestWeaponSwap = true;
        }
        return;
      }

      if (action === "reload") {
        if (!event.repeat) {
          this.input.reload = true;
        }

        return;
      }

      this.input[action] = true;
    });

    window.addEventListener("keyup", (event) => {
      const action = keyMap[event.code];

      if (!action) {
        return;
      }

      event.preventDefault();

      if (action === "toggleMinimap" || action === "swapWeapon" || action === "reload") {
        return;
      }

      this.input[action] = false;
    });

    this.canvas.addEventListener("click", () => {
      if (document.pointerLockElement !== this.canvas) {
        this.canvas.requestPointerLock?.();
      }
    });

    this.canvas.addEventListener("mousedown", () => {
      if (!this.running || this.paused) {
        return;
      }

      this.input.fire = true;
    });

    window.addEventListener("mouseup", () => {
      this.input.fire = false;
    });

    this.canvas.addEventListener("mousemove", (event) => {
      if (!this.running || this.paused) {
        return;
      }

      if (document.pointerLockElement === this.canvas) {
        this.player.addLook(event.movementX * 0.0025);
      }
    });

    document.querySelectorAll("[data-action]").forEach((button) => {
      const action = button.dataset.action;

      button.addEventListener("pointerdown", (event) => {
        event.preventDefault();

        if (!this.running || this.paused) {
          return;
        }

        if (action === "swapWeapon") {
          this.requestWeaponSwap = true;
          return;
        }

        if (action === "reload") {
          this.input.reload = true;
          return;
        }

        this.input[action] = true;
      });

      button.addEventListener("pointerup", () => {
        if (action !== "swapWeapon" && action !== "reload") {
          this.input[action] = false;
        }
      });
      button.addEventListener("pointerleave", () => {
        if (action !== "swapWeapon" && action !== "reload") {
          this.input[action] = false;
        }
      });
      button.addEventListener("pointercancel", () => {
        if (action !== "swapWeapon" && action !== "reload") {
          this.input[action] = false;
        }
      });
    });

    this.bindMovementJoystick();
    this.bindLookTouchArea();
  }

  bindMovementJoystick() {
    const joystick = document.getElementById("movement-joystick");
    const knob = document.getElementById("movement-joystick-knob");

    if (!joystick || !knob) {
      return;
    }

    let activePointerId = null;

    const resetJoystick = () => {
      activePointerId = null;
      this.input.moveAxis = 0;
      this.input.strafeAxis = 0;
      knob.style.transform = "translate(-50%, -50%)";
      joystick.classList.remove("active");
    };

    const updateJoystick = (clientX, clientY) => {
      const rect = joystick.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const deltaX = clientX - centerX;
      const deltaY = clientY - centerY;
      const maxDistance = Math.min(rect.width, rect.height) * 0.38;
      const distance = Math.min(maxDistance, Math.hypot(deltaX, deltaY));
      const angle = Math.atan2(deltaY, deltaX);
      const normalizedX = maxDistance ? (Math.cos(angle) * distance) / maxDistance : 0;
      const normalizedY = maxDistance ? (Math.sin(angle) * distance) / maxDistance : 0;

      this.input.strafeAxis = Number(normalizedX.toFixed(3));
      this.input.moveAxis = Number((-normalizedY).toFixed(3));
      knob.style.transform = `translate(calc(-50% + ${normalizedX * maxDistance}px), calc(-50% + ${normalizedY * maxDistance}px))`;
    };

    joystick.addEventListener("pointerdown", (event) => {
      if (!this.running || this.paused) {
        return;
      }

      event.preventDefault();
      activePointerId = event.pointerId;
      joystick.setPointerCapture?.(event.pointerId);
      joystick.classList.add("active");
      updateJoystick(event.clientX, event.clientY);
    });

    joystick.addEventListener("pointermove", (event) => {
      if (event.pointerId !== activePointerId || this.paused) {
        return;
      }

      event.preventDefault();
      updateJoystick(event.clientX, event.clientY);
    });

    joystick.addEventListener("pointerup", resetJoystick);
    joystick.addEventListener("pointercancel", resetJoystick);
    joystick.addEventListener("lostpointercapture", resetJoystick);
  }

  bindLookTouchArea() {
    const lookZone = document.getElementById("look-zone");
    const lookKnob = document.getElementById("look-knob");

    if (!lookZone || !lookKnob) {
      return;
    }

    let activePointerId = null;
    let previousX = 0;
    let originX = 0;
    let originY = 0;

    const resetLook = () => {
      activePointerId = null;
      lookKnob.style.transform = "translate(-50%, -50%)";
      lookZone.classList.remove("active");
    };

    this.resetLookTouchArea = resetLook;

    lookZone.addEventListener("pointerdown", (event) => {
      if (!this.running || this.paused) {
        return;
      }

      event.preventDefault();
      activePointerId = event.pointerId;
      previousX = event.clientX;
      originX = event.clientX;
      originY = event.clientY;
      lookZone.setPointerCapture?.(event.pointerId);
      lookZone.classList.add("active");
    });

    lookZone.addEventListener("pointermove", (event) => {
      if (event.pointerId !== activePointerId || !this.running || this.paused || !this.player) {
        return;
      }

      event.preventDefault();
      const deltaX = event.clientX - previousX;
      const visualDeltaX = Math.max(-24, Math.min(24, event.clientX - originX));
      const visualDeltaY = Math.max(-24, Math.min(24, event.clientY - originY));

      previousX = event.clientX;
      this.player.addLook(deltaX * 0.006);
      lookKnob.style.transform = `translate(calc(-50% + ${visualDeltaX}px), calc(-50% + ${visualDeltaY}px))`;
    });

    lookZone.addEventListener("pointerup", resetLook);
    lookZone.addEventListener("pointercancel", resetLook);
    lookZone.addEventListener("lostpointercapture", resetLook);
  }

  resizeCanvas() {
    const rect = this.canvas.getBoundingClientRect();
    const width = Math.max(320, Math.floor(rect.width || 960));
    this.canvas.width = width;
    this.canvas.height = Math.floor(width * 0.5625);
  }

  start(playerName = "Operador", options = {}) {
    this.levelSequence = getLevelSequence();
    this.levelIndex = 0;
    this.levelWave = 0;
    this.totalWave = 0;
    this.progression = options.progression || null;
    this.liveEvent = options.liveEvent || null;
    this.bossKills = 0;
    this.player = new Player(this.levelSequence[0].playerStart, this.getPlayerStartModifiers());
    this.playerName = playerName;
    this.onlineMode = Boolean(options.onlineMode);
    this.onlineRoomCode = options.roomCode || "";
    this.onlinePlaylistId = options.playlistId || (this.onlineMode ? "squad-horde" : "solo");
    this.onlineSquadName = options.squadName || "";
    this.onlineRoom = options.onlineRoom || null;
    this.remotePlayers = new Map();
    this.onlineStateTimer = 0;
    this.weapon = new WeaponSystem();
    this.weapon.setUnlockedWeapons(this.resolveUnlockedWeapons());
    this.weapon.attachToPlayer(this.player);
    this.enemies = [];
    this.projectiles = [];
    this.effects = [];
    this.runtime = 0;
    this.waveDelay = 0;
    this.useCooldown = 0;
    this.requestWeaponSwap = false;
    this.activeEffects = {
      fury: 0,
      shield: 0,
      overclock: 0,
    };
    this.alert = this.onlineMode
      ? `Escuadron conectado en sala ${this.onlineRoomCode}.`
      : this.liveEvent?.title
        ? `Evento activo: ${this.liveEvent.title}.`
        : "Entrando al sector.";
    this.gameOver = false;
    this.missionCompletePending = false;
    this.running = true;
    this.paused = false;
    this.loadLevel(this.levelIndex);
    this.nextWave(true);
    this.emitHud();

    cancelAnimationFrame(this.loopHandle);
    this.lastFrameTime = performance.now();
    this.loopHandle = requestAnimationFrame((time) => this.loop(time));
  }

  stop() {
    this.running = false;
    this.paused = false;
    this.input.moveAxis = 0;
    this.input.strafeAxis = 0;
    this.resetLookTouchArea?.();
    cancelAnimationFrame(this.loopHandle);
  }

  pause() {
    if (!this.running || this.gameOver || this.paused) {
      return false;
    }

    this.paused = true;
    this.input = this.createInputState();
    this.resetLookTouchArea?.();
    document.exitPointerLock?.();
    return true;
  }

  resume() {
    if (!this.running || !this.paused) {
      return false;
    }

    this.paused = false;
    this.lastFrameTime = performance.now();
    return true;
  }

  loop(timestamp) {
    if (!this.running) {
      return;
    }

    const dt = Math.min(0.033, (timestamp - this.lastFrameTime) / 1000);
    this.lastFrameTime = timestamp;

    if (!this.paused) {
      this.update(dt);
    }

    this.render();

    if (this.running) {
      this.loopHandle = requestAnimationFrame((time) => this.loop(time));
    }
  }

  update(dt) {
    if (this.gameOver) {
      return;
    }

    this.runtime += dt;

    if (this.missionCompletePending) {
      this.weapon.update(dt, this);
      this.emitHud();
      return;
    }

    this.onlineStateTimer += dt;
    this.useCooldown = Math.max(0, this.useCooldown - dt);
    this.player.timeSurvived += dt;
    this.player.wave = this.totalWave;
    this.updateTemporaryEffects(dt);
    this.player.update(dt, this.input, this.level.map);
    this.weapon.update(dt, this);
    this.updatePickups();
    this.updateEffects(dt);

    if (this.requestWeaponSwap) {
      this.weapon.switchWeapon(this);
      this.requestWeaponSwap = false;
    }

    if (this.input.reload) {
      this.weapon.reload(this);
      this.input.reload = false;
    }

    if (this.input.use) {
      this.useNearbyDoor();
    }

    if (this.input.fire) {
      this.weapon.shoot(this);
    }

    this.enemies.forEach((enemy) => enemy.update(dt, this));
    this.projectiles.forEach((projectile) => projectile.update(dt, this));

    this.enemies = this.enemies.filter((enemy) => !enemy.dead);
    this.projectiles = this.projectiles.filter((projectile) => !projectile.dead);

    if (this.enemies.length === 0) {
      this.waveDelay += dt;

      if (this.waveDelay >= 1.4) {
        if (this.shouldAdvanceLevel()) {
          this.completeCurrentMission();
        } else {
          this.nextWave();
        }
      }
    } else {
      this.waveDelay = 0;
    }

    this.emitHud();
    this.emitOnlineState();

    if (this.player.health <= 0) {
      this.finishRun();
    }
  }

  render() {
    renderScene(this.context, this);
  }

  loadLevel(index, preserveStats = false) {
    const nextLevel = this.levelSequence[index];
    const previousStats = preserveStats
      ? {
          health: this.player.health,
          ammo: this.player.ammo,
          altAmmo: this.player.altAmmo,
          shellAmmo: this.player.shellAmmo,
          score: this.player.score,
          kills: this.player.kills,
          timeSurvived: this.player.timeSurvived,
          wave: this.player.wave,
        }
      : null;

    this.level = nextLevel;
    this.activeMutator = chooseRunMutator(this.level, this.liveEvent);
    this.player = new Player(this.level.playerStart, this.getPlayerStartModifiers());
    this.weapon.attachToPlayer(this.player);

    if (previousStats) {
      this.player.health = previousStats.health;
      this.player.ammo = previousStats.ammo;
      this.player.altAmmo = previousStats.altAmmo;
      this.player.shellAmmo = previousStats.shellAmmo;
      this.player.score = previousStats.score;
      this.player.kills = previousStats.kills;
      this.player.timeSurvived = previousStats.timeSurvived;
      this.player.wave = previousStats.wave;
      const config = this.weapon.configs[this.weapon.currentWeapon];
      this.player.weaponName = `${config.name} // ${config.classLabel}`;
    }

    this.projectiles = [];
    this.effects = [];
    this.enemies = [];
    this.pickups = this.level.pickups.map((pickup, index2) => ({
      ...pickup,
      collected: false,
      phase: index2 * 0.9,
      color: getPickupColor(pickup.type),
    }));
  }

  nextWave(initial = false) {
    this.totalWave += 1;
    this.levelWave += 1;
    this.waveDelay = 0;
    const waveAmmoReward = Math.round(this.level.waveRewardAmmo * this.getWaveAmmoMultiplier());

    if (!initial) {
      this.player.heal(this.level.waveRewardHealth);
      this.player.addAmmo(waveAmmoReward);
      this.player.score += Math.round(this.totalWave * 40 * this.getScoreMultiplier());
      this.spawnWavePickups();
    }

    const isBossWave =
      this.level.id !== "training-bay" &&
      (this.levelWave === this.level.wavesUntilAdvance || this.levelWave % 4 === 0);

    if (isBossWave) {
      const bossSpawn = this.level.spawnPoints[0];
      const boss = createBossEnemy(
        bossSpawn,
        this.totalWave,
        this.level.bossId,
        this.getEnemyTuning(),
      );
      const escort = createWaveEnemies(
        this.level.spawnPoints.slice(1),
        Math.max(2, this.totalWave - 1),
        Math.min(5, 2 + this.levelWave),
        this.getEnemyTuning(),
      );
      this.enemies = [boss, ...escort];
      this.pushAlert(`Boss wave ${this.totalWave}: ${boss.label}.`);
      this.audio?.playBossAlert();
    } else {
      const enemyCount = Math.max(3, Math.round((3 + this.totalWave * 2) * this.getEnemyCountMultiplier()));
      this.enemies = createWaveEnemies(
        this.level.spawnPoints,
        this.totalWave,
        enemyCount,
        this.getEnemyTuning(),
      );
      this.pushAlert(`Wave ${this.totalWave} iniciada en ${this.level.name} // ${this.activeMutator.title}.`);
    }

    this.audio?.playWaveStart();
  }

  shouldAdvanceLevel() {
    return (
      this.levelWave >= this.level.wavesUntilAdvance &&
      this.levelIndex < this.levelSequence.length - 1
    );
  }

  advanceLevel() {
    this.levelIndex += 1;
    this.levelWave = 0;
    this.loadLevel(this.levelIndex, true);
    this.player.heal(10);
    this.player.addAmmo(18);
    this.player.addShellAmmo(6);
    this.player.addAltAmmo(2);
    this.pushAlert(`${this.level.name} desbloqueado.`);
    this.audio?.playWaveStart();
    this.nextWave(true);
  }

  completeCurrentMission() {
    if (this.missionCompletePending) {
      return;
    }

    const completedLevel = this.level;
    const nextLevel = this.levelSequence[this.levelIndex + 1];

    this.missionCompletePending = true;
    this.input.fire = false;
    this.input.use = false;
    this.input.reload = false;
    this.input.moveAxis = 0;
    this.input.strafeAxis = 0;
    this.pushAlert(`Mision completada: ${completedLevel.name}.`);

    this.onMissionComplete?.({
      title: completedLevel.name,
      text: nextLevel
        ? `Zona limpia. Toca Continuar para entrar en ${nextLevel.name}.`
        : "Zona limpia. Mision final completada.",
      nextTitle: nextLevel?.name || "Fin",
      score: this.player.score,
      kills: this.player.kills,
    });
  }

  continueMission() {
    if (!this.missionCompletePending || this.gameOver) {
      return;
    }

    this.missionCompletePending = false;
    this.advanceLevel();
  }

  finishRun() {
    this.gameOver = true;
    this.running = false;
    this.paused = false;
    cancelAnimationFrame(this.loopHandle);
    this.audio?.playGameOver();

    this.onGameOver?.({
      username: this.playerName,
      score: this.player.score,
      kills: this.player.kills,
      bossKills: this.bossKills,
      wave: this.totalWave,
      timeSurvived: Math.round(this.player.timeSurvived),
      biomeId: this.level.biome,
      eventId: this.liveEvent?.id || "",
      mutatorId: this.activeMutator?.id || "",
      onlineMode: this.onlineMode,
      playlistId: this.onlinePlaylistId,
      roomCode: this.onlineRoomCode,
      squadKey: this.onlineRoom?.squadKey || "",
      squadName: this.onlineSquadName,
      squadMembers: this.getSquadMembers(),
      teamScore: this.getTeamScore(),
    });
  }

  emitHud() {
    const objective = this.getObjectiveState();

    this.onHudChange?.({
      health: this.player.health,
      ammo: this.player.ammo,
      altAmmo: this.player.altAmmo,
      score: this.player.score,
      kills: this.player.kills,
      wave: this.totalWave,
      alert: this.alert,
      levelName: this.level.name,
      playerName: this.playerName,
      weaponName: this.player.weaponName,
      ammoLabel: this.weapon.getAmmoLabel(this.player),
      boostLabel: this.getBoostLabel(),
      bossLabel: this.getBossLabel(),
      objectiveTitle: objective.title,
      objectiveDetail: objective.detail,
      onlineLabel: this.getOnlineLabel(),
    });
  }

  pushAlert(message) {
    this.alert = message;
  }

  getDamageMultiplier() {
    return this.activeEffects.fury > 0 ? 1.65 : 1;
  }

  getFireRateModifier() {
    return this.activeMutator?.modifiers?.fireRateMultiplier || 1;
  }

  getBoostLabel() {
    const active = [];

    if (this.activeEffects.fury > 0) {
      active.push(`FURY ${Math.ceil(this.activeEffects.fury)}s`);
    }
    if (this.activeEffects.shield > 0) {
      active.push(`SHIELD ${Math.ceil(this.activeEffects.shield)}s`);
    }
    if (this.activeEffects.overclock > 0) {
      active.push(`OVERCLOCK ${Math.ceil(this.activeEffects.overclock)}s`);
    }

    return active.join(" | ");
  }

  getBossLabel() {
    const boss = this.enemies.find((enemy) => enemy.isBoss && !enemy.dead);

    if (!boss) {
      return "";
    }

    return `${boss.label} ${boss.health}/${boss.maxHealth}`;
  }

  getOnlineLabel() {
    if (!this.onlineMode) {
      return "Solo";
    }

    return `${this.onlineRoomCode} // ${this.remotePlayers.size + 1} ops // ${this.onlinePlaylistId === "squad-horde" ? "Horda" : "Online"}`;
  }

  getSquadMembers() {
    if (!this.onlineRoom?.players?.length) {
      return [this.playerName];
    }

    return [...new Set(this.onlineRoom.players.map((player) => player.username).filter(Boolean))];
  }

  getTeamScore() {
    if (!this.onlineMode) {
      return this.player.score;
    }

    let total = this.player.score;

    this.remotePlayers.forEach((player) => {
      total += Math.max(0, Number(player.score) || 0);
    });

    return total;
  }

  getObjectiveState() {
    const boss = this.enemies.find((enemy) => enemy.isBoss && !enemy.dead);
    const biomeLabel = this.level?.biomeLabel || this.level?.biome || "Sector";
    const eventLabel = this.liveEvent?.title ? `Evento: ${this.liveEvent.title}.` : "";
    const mutatorLabel = this.activeMutator?.title ? `Mutador: ${this.activeMutator.title}.` : "";

    if (this.level.id === "training-bay") {
      return {
        title: "Mision 1: limpia Boot Bay.",
        detail: `${biomeLabel}. ${eventLabel} ${mutatorLabel} Elimina la oleada y aparece Continuar.`,
      };
    }

    if (this.level.id === "sector13") {
      return {
        title: "Mision 2: asegura Sector 13.",
        detail: `${biomeLabel}. ${eventLabel} ${mutatorLabel} Oleadas ${Math.min(this.levelWave, this.level.wavesUntilAdvance)}/${this.level.wavesUntilAdvance}.`,
      };
    }

    if (boss) {
      return {
        title: `Destruye a ${boss.label}.`,
        detail: `${biomeLabel}. ${mutatorLabel} Integridad ${boss.health}/${boss.maxHealth}.`,
      };
    }

    return {
      title: "Conten la expansion de la brecha.",
      detail: `${biomeLabel}. ${eventLabel} ${mutatorLabel} Limpia oleadas y prepara recursos para la siguiente irrupcion.`,
    };
  }

  spawnProjectile(projectile) {
    this.projectiles.push(projectile);
  }

  reportOnlineShot(config) {
    if (!this.onlineMode) {
      return;
    }

    this.onOnlineShot?.({
      roomCode: this.onlineRoomCode,
      weaponName: config.name,
    });
  }

  receiveOnlineShot({ username, weaponName }) {
    if (!this.onlineMode || !this.running || this.paused) {
      return;
    }

    this.pushAlert(`${username} dispara ${weaponName}.`);
  }

  syncOnlinePlayer({ id, username, state }) {
    if (!id || !state || typeof state.x !== "number" || typeof state.y !== "number") {
      return;
    }

    this.remotePlayers.set(id, {
      id,
      username,
      ...state,
      lastSeen: this.runtime,
    });
  }

  syncOnlineRoom(room, ownSocketId) {
    if (!room?.players) {
      return;
    }

    this.onlineRoom = room;
    this.onlinePlaylistId = room.playlistId || this.onlinePlaylistId;
    this.onlineSquadName = room.squadName || this.onlineSquadName;

    const activeIds = new Set();

    room.players.forEach((player) => {
      if (player.id === ownSocketId) {
        return;
      }

      activeIds.add(player.id);

      if (player.state) {
        this.syncOnlinePlayer(player);
      }
    });

    [...this.remotePlayers.keys()].forEach((id) => {
      if (!activeIds.has(id)) {
        this.remotePlayers.delete(id);
      }
    });
  }

  emitOnlineState() {
    if (!this.onlineMode || !this.running || this.paused || this.onlineStateTimer < 0.09) {
      return;
    }

    this.onlineStateTimer = 0;
    this.onOnlineState?.({
      roomCode: this.onlineRoomCode,
      state: {
        x: this.player.x,
        y: this.player.y,
        angle: this.player.angle,
        health: this.player.health,
        weaponName: this.player.weaponName,
        levelName: this.level.name,
        score: this.player.score,
        kills: this.player.kills,
        wave: this.totalWave,
      },
    });
  }

  handleEnemyKill(enemy) {
    this.spawnBloodBurst(enemy.x, enemy.y, enemy.isBoss ? 22 : 12, "#FF0055");
    this.audio?.playKill();

    if (enemy.isBoss) {
      this.bossKills += 1;
      this.player.addShellAmmo(4);
      this.player.addAltAmmo(3);
      this.pickups.push({
        type: "fury",
        x: enemy.x,
        y: enemy.y,
        collected: false,
        phase: this.runtime,
        color: getPickupColor("fury"),
      });
      this.pushAlert(`${enemy.label} cayo. Fury shard liberado.`);
    }
  }

  damagePlayer(amount, source) {
    const damageReduction = this.activeEffects.shield > 0 ? 0.6 : 1;
    const finalDamage = Math.max(1, Math.round(amount * damageReduction));
    this.player.takeDamage(finalDamage);
    this.spawnScreenBlood(8 + Math.floor(finalDamage / 3));
    this.audio?.playPlayerDamage();
    this.pushAlert(`${source} te hizo ${finalDamage} de dano.`);
  }

  updatePickups() {
    const pickupAmmoMultiplier = this.activeMutator?.modifiers?.pickupAmmoMultiplier || 1;

    for (const pickup of this.pickups) {
      if (pickup.collected) {
        continue;
      }

      const distance = Math.hypot(this.player.x - pickup.x, this.player.y - pickup.y);

      if (distance > 0.55) {
        continue;
      }

      pickup.collected = true;

      if (pickup.type === "health") {
        this.player.heal(30);
        this.pushAlert("Nano medkit absorbido.");
      } else if (pickup.type === "overcharge") {
        this.player.heal(18);
        this.player.addAmmo(Math.round(24 * pickupAmmoMultiplier));
        this.player.addShellAmmo(Math.round(4 * pickupAmmoMultiplier));
        this.player.addAltAmmo(1);
        this.player.score += Math.round(120 * this.getScoreMultiplier());
        this.pushAlert("Nucleo overcharge capturado.");
      } else if (pickup.type === "fury") {
        this.activeEffects.fury = 12;
        this.pushAlert("Fury online.");
      } else if (pickup.type === "shield") {
        this.activeEffects.shield = 12;
        this.pushAlert("Shield matrix activa.");
      } else if (pickup.type === "arsenal") {
        this.player.addAmmo(Math.round(18 * pickupAmmoMultiplier));
        this.player.addShellAmmo(Math.round(6 * pickupAmmoMultiplier));
        this.activeEffects.overclock = 10;
        this.player.addAltAmmo(2);
        this.pushAlert("Arsenal sync activado.");
      } else {
        this.player.addAmmo(Math.round(22 * pickupAmmoMultiplier));
        this.player.addShellAmmo(Math.round(4 * pickupAmmoMultiplier));
        this.pushAlert("Municion mixta recogida.");
      }

      this.audio?.playPickup(pickup.type);
    }
  }

  spawnWavePickups() {
    const spawn = this.level.spawnPoints[(this.totalWave - 1) % this.level.spawnPoints.length];

    if (!spawn) {
      return;
    }

    const cycle = ["ammo", "health", "fury", "shield", "arsenal", "overcharge"];
    const extraPickups = this.activeMutator?.modifiers?.extraPickupsPerWave || 0;

    for (let index = 0; index <= extraPickups; index += 1) {
      const pickupType = cycle[(this.totalWave + index) % cycle.length];

      this.pickups.push({
        type: pickupType,
        x: Math.max(1.5, Math.min(spawn.x + 0.7 + index * 0.4, this.level.map[0].length - 1.5)),
        y: Math.max(1.5, Math.min(spawn.y - 0.5 + index * 0.3, this.level.map.length - 1.5)),
        collected: false,
        phase: this.runtime + index * 0.35,
        color: getPickupColor(pickupType),
      });
    }
  }

  useNearbyDoor() {
    if (this.useCooldown > 0) {
      return;
    }

    this.useCooldown = 0.22;
    let closestDoor = null;

    for (let distance = 0.4; distance <= 1.25; distance += 0.12) {
      const checkX = this.player.x + Math.cos(this.player.angle) * distance;
      const checkY = this.player.y + Math.sin(this.player.angle) * distance;
      const cellX = Math.floor(checkX);
      const cellY = Math.floor(checkY);
      const cell = this.level.map[cellY]?.[cellX];

      if (cell === 3) {
        closestDoor = { x: cellX, y: cellY };
        break;
      }
    }

    if (!closestDoor) {
      return;
    }

    this.level.map[closestDoor.y][closestDoor.x] = 0;
    this.audio?.playDoorOpen();
    this.audio?.playPickup("overcharge");
    this.pushAlert("Puerta neon desbloqueada.");
  }

  updateTemporaryEffects(dt) {
    this.activeEffects.fury = Math.max(0, this.activeEffects.fury - dt);
    this.activeEffects.shield = Math.max(0, this.activeEffects.shield - dt);
    this.activeEffects.overclock = Math.max(0, this.activeEffects.overclock - dt);
    this.player.speedMultiplier = (this.activeEffects.overclock > 0 ? 1.28 : 1) * this.getPlayerSpeedMultiplier();
  }

  spawnBloodBurst(x, y, count, color) {
    for (let index = 0; index < count; index += 1) {
      this.effects.push({
        kind: "world-blood",
        x: x + (Math.random() - 0.5) * 0.35,
        y: y + (Math.random() - 0.5) * 0.35,
        size: 0.08 + Math.random() * 0.08,
        color,
        bob: Math.random() * 6,
        life: 0.5 + Math.random() * 0.45,
      });
    }
  }

  spawnScreenBlood(count) {
    for (let index = 0; index < count; index += 1) {
      this.effects.push({
        kind: "screen-blood",
        x: Math.random(),
        y: Math.random() * 0.75,
        size: 4 + Math.random() * 14,
        color: Math.random() > 0.65 ? "#FF00FF" : "#FF0055",
        life: 0.4 + Math.random() * 0.35,
      });
    }
  }

  updateEffects(dt) {
    this.effects = this.effects
      .map((effect) => ({
        ...effect,
        life: effect.life - dt,
      }))
      .filter((effect) => effect.life > 0);
  }

  isWalkable(x, y) {
    const cell = this.level.map[Math.floor(y)]?.[Math.floor(x)] ?? 1;
    return cell === 0 || cell === 4;
  }

  hasLineOfSight(fromX, fromY, toX, toY) {
    const dx = toX - fromX;
    const dy = toY - fromY;
    const distance = Math.hypot(dx, dy) || 0.0001;
    const steps = Math.ceil(distance / 0.12);

    for (let index = 1; index < steps; index += 1) {
      const factor = index / steps;
      const sampleX = fromX + dx * factor;
      const sampleY = fromY + dy * factor;

      if (!this.isWalkable(sampleX, sampleY)) {
        return false;
      }
    }

    return true;
  }

  resolveUnlockedWeapons() {
    return this.progression?.unlockedWeapons
      ?.filter((weapon) => weapon.unlocked)
      .map((weapon) => weapon.id) || ["repeater"];
  }

  getPlayerStartModifiers() {
    const upgrades = this.progression?.permanentUpgrades || {};

    return {
      extraHealth: (Number(upgrades.healthTier) || 0) * 12,
      extraAmmo: (Number(upgrades.ammoTier) || 0) * 26,
      baseSpeedMultiplier: 1 + (Number(upgrades.speedTier) || 0) * 0.04,
    };
  }

  getEnemyTuning() {
    return {
      enemySpeedMultiplier: this.getEnemySpeedMultiplier(),
      enemyDamageMultiplier: this.getEnemyDamageMultiplier(),
      enemyHealthMultiplier: this.activeMutator?.modifiers?.enemyHealthMultiplier || 1,
      bossHealthMultiplier: this.activeMutator?.modifiers?.bossHealthMultiplier || 1,
    };
  }

  getEnemySpeedMultiplier() {
    return (this.liveEvent?.gameplay?.enemySpeedMultiplier || 1) * (this.activeMutator?.modifiers?.enemySpeedMultiplier || 1);
  }

  getEnemyDamageMultiplier() {
    return (this.liveEvent?.gameplay?.enemyDamageMultiplier || 1) * (this.activeMutator?.modifiers?.enemyDamageMultiplier || 1);
  }

  getEnemyCountMultiplier() {
    return (this.liveEvent?.gameplay?.enemyCountMultiplier || 1) * (this.activeMutator?.modifiers?.enemyCountMultiplier || 1);
  }

  getWaveAmmoMultiplier() {
    return (this.liveEvent?.gameplay?.waveAmmoMultiplier || 1) * (this.activeMutator?.modifiers?.waveAmmoMultiplier || 1);
  }

  getScoreMultiplier() {
    return (this.liveEvent?.gameplay?.scoreMultiplier || 1) * (this.activeMutator?.modifiers?.scoreMultiplier || 1);
  }

  getPlayerSpeedMultiplier() {
    return this.activeMutator?.modifiers?.playerSpeedMultiplier || 1;
  }
}


