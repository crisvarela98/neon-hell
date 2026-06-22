import { getLevelSequence } from "./levels.js";
import { Player } from "./player.js";
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
  constructor({ canvas, onHudChange, onGameOver, onOnlineState, onOnlineShot, audio = null }) {
    this.canvas = canvas;
    this.context = canvas.getContext("2d");
    this.onHudChange = onHudChange;
    this.onGameOver = onGameOver;
    this.onOnlineState = onOnlineState;
    this.onOnlineShot = onOnlineShot;
    this.audio = audio;
    this.input = this.createInputState();
    this.running = false;
    this.loopHandle = 0;
    this.runtime = 0;
    this.showMinimap = true;
    this.remotePlayers = new Map();
    this.onlineMode = false;
    this.onlineRoomCode = "";
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

      this.input[action] = true;
    });

    window.addEventListener("keyup", (event) => {
      const action = keyMap[event.code];

      if (!action) {
        return;
      }

      event.preventDefault();

      if (action === "toggleMinimap" || action === "swapWeapon") {
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
      this.input.fire = true;
    });

    window.addEventListener("mouseup", () => {
      this.input.fire = false;
    });

    this.canvas.addEventListener("mousemove", (event) => {
      if (!this.running) {
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

        if (action === "swapWeapon") {
          this.requestWeaponSwap = true;
          return;
        }

        this.input[action] = true;
      });

      button.addEventListener("pointerup", () => {
        if (action !== "swapWeapon") {
          this.input[action] = false;
        }
      });
      button.addEventListener("pointerleave", () => {
        if (action !== "swapWeapon") {
          this.input[action] = false;
        }
      });
      button.addEventListener("pointercancel", () => {
        if (action !== "swapWeapon") {
          this.input[action] = false;
        }
      });
    });

    this.bindMovementJoystick();
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
      event.preventDefault();
      activePointerId = event.pointerId;
      joystick.setPointerCapture?.(event.pointerId);
      joystick.classList.add("active");
      updateJoystick(event.clientX, event.clientY);
    });

    joystick.addEventListener("pointermove", (event) => {
      if (event.pointerId !== activePointerId) {
        return;
      }

      event.preventDefault();
      updateJoystick(event.clientX, event.clientY);
    });

    joystick.addEventListener("pointerup", resetJoystick);
    joystick.addEventListener("pointercancel", resetJoystick);
    joystick.addEventListener("lostpointercapture", resetJoystick);
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
    this.player = new Player(this.levelSequence[0].playerStart);
    this.playerName = playerName;
    this.onlineMode = Boolean(options.onlineMode);
    this.onlineRoomCode = options.roomCode || "";
    this.remotePlayers = new Map();
    this.onlineStateTimer = 0;
    this.weapon = new WeaponSystem();
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
      : "Entrando al sector.";
    this.gameOver = false;
    this.running = true;
    this.loadLevel(this.levelIndex);
    this.nextWave(true);
    this.emitHud();

    cancelAnimationFrame(this.loopHandle);
    this.lastFrameTime = performance.now();
    this.loopHandle = requestAnimationFrame((time) => this.loop(time));
  }

  stop() {
    this.running = false;
    this.input.moveAxis = 0;
    this.input.strafeAxis = 0;
    cancelAnimationFrame(this.loopHandle);
  }

  loop(timestamp) {
    if (!this.running) {
      return;
    }

    const dt = Math.min(0.033, (timestamp - this.lastFrameTime) / 1000);
    this.lastFrameTime = timestamp;

    this.update(dt);
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
    this.onlineStateTimer += dt;
    this.useCooldown = Math.max(0, this.useCooldown - dt);
    this.player.timeSurvived += dt;
    this.player.wave = this.totalWave;
    this.updateTemporaryEffects(dt);
    this.player.update(dt, this.input, this.level.map);
    this.weapon.update(dt);
    this.updatePickups();
    this.updateEffects(dt);

    if (this.requestWeaponSwap) {
      this.weapon.switchWeapon(this);
      this.requestWeaponSwap = false;
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
          this.advanceLevel();
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
    this.player = new Player(this.level.playerStart);
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
      this.player.weaponName = this.weapon.configs[this.weapon.currentWeapon].name;
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

    if (!initial) {
      this.player.heal(this.level.waveRewardHealth);
      this.player.addAmmo(this.level.waveRewardAmmo);
      this.player.score += this.totalWave * 40;
      this.spawnWavePickups();
    }

    const isBossWave =
      this.level.id === "breach-core" &&
      (this.levelWave === 1 || this.levelWave % 4 === 0);

    if (isBossWave) {
      const bossSpawn = this.level.spawnPoints[0];
      const boss = createBossEnemy(bossSpawn, this.totalWave);
      const escort = createWaveEnemies(
        this.level.spawnPoints.slice(1),
        Math.max(2, this.totalWave - 1),
        Math.min(5, 2 + this.levelWave),
      );
      this.enemies = [boss, ...escort];
      this.pushAlert(`Boss wave ${this.totalWave}: ${boss.label}.`);
      this.audio?.playBossAlert();
    } else {
      this.enemies = createWaveEnemies(this.level.spawnPoints, this.totalWave);
      this.pushAlert(`Wave ${this.totalWave} iniciada en ${this.level.name}.`);
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

  finishRun() {
    this.gameOver = true;
    this.running = false;
    cancelAnimationFrame(this.loopHandle);
    this.audio?.playGameOver();

    this.onGameOver?.({
      username: this.playerName,
      score: this.player.score,
      kills: this.player.kills,
      wave: this.totalWave,
      timeSurvived: Math.round(this.player.timeSurvived),
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

    return `${this.onlineRoomCode} // ${this.remotePlayers.size + 1} ops`;
  }

  getObjectiveState() {
    const boss = this.enemies.find((enemy) => enemy.isBoss && !enemy.dead);

    if (this.level.id === "training-bay") {
      return {
        title: "Completa Mision 1: Boot Bay.",
        detail: "Limpia la bahia de acceso, recoge recursos y abre la ruta hacia el Sector 13.",
      };
    }

    if (this.level.id === "sector13") {
      return {
        title: "Asegura el corredor de acceso.",
        detail: `${Math.min(this.levelWave, this.level.wavesUntilAdvance)}/${this.level.wavesUntilAdvance} oleadas despejadas antes del descenso al reactor.`,
      };
    }

    if (boss) {
      return {
        title: "Destruye a ARCHON PRIME.",
        detail: `Integridad del jefe ${boss.health}/${boss.maxHealth}. Mantente en movimiento y castiga el nucleo.`,
      };
    }

    return {
      title: "Conten la expansion de la brecha.",
      detail: "Limpia las oleadas y prepara recursos para la siguiente irrupcion del reactor.",
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
    if (!this.onlineMode || !this.running) {
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
    if (!this.onlineMode || !this.running || this.onlineStateTimer < 0.09) {
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
      this.pushAlert("ARCHON PRIME cayo. Fury shard liberado.");
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
        this.player.addAmmo(24);
        this.player.addShellAmmo(4);
        this.player.addAltAmmo(1);
        this.player.score += 120;
        this.pushAlert("Nucleo overcharge capturado.");
      } else if (pickup.type === "fury") {
        this.activeEffects.fury = 12;
        this.pushAlert("Fury online.");
      } else if (pickup.type === "shield") {
        this.activeEffects.shield = 12;
        this.pushAlert("Shield matrix activa.");
      } else if (pickup.type === "arsenal") {
        this.player.addAmmo(18);
        this.player.addShellAmmo(6);
        this.activeEffects.overclock = 10;
        this.player.addAltAmmo(2);
        this.pushAlert("Arsenal sync activado.");
      } else {
        this.player.addAmmo(22);
        this.player.addShellAmmo(4);
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
    const pickupType = cycle[this.totalWave % cycle.length];

    this.pickups.push({
      type: pickupType,
      x: Math.max(1.5, Math.min(spawn.x + 0.7, this.level.map[0].length - 1.5)),
      y: Math.max(1.5, Math.min(spawn.y - 0.5, this.level.map.length - 1.5)),
      collected: false,
      phase: this.runtime,
      color: getPickupColor(pickupType),
    });
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
    this.player.speedMultiplier = this.activeEffects.overclock > 0 ? 1.28 : 1;
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
}


