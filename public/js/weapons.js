function normalizeAngle(angle) {
  while (angle < -Math.PI) {
    angle += Math.PI * 2;
  }

  while (angle > Math.PI) {
    angle -= Math.PI * 2;
  }

  return angle;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function makeSprite(path) {
  const image = new Image();
  image.src = path;
  return image;
}

export class WeaponSystem {
  constructor() {
    this.cooldown = 0;
    this.muzzleFlash = 0;
    this.recoilKick = 0;
    this.recoilLift = 0;
    this.recoilTilt = 0;
    this.currentColor = "#00FFFF";
    this.weaponOrder = ["repeater", "shotgun", "carbine", "hellburst"];
    this.currentWeapon = this.weaponOrder[0];
    this.unlockedWeapons = new Set([this.currentWeapon]);
    this.loadedAmmo = {};
    this.reloadTimer = 0;
    this.reloadDuration = 0;
    this.reloadingWeapon = null;
    this.configs = {
      repeater: {
        name: "Volt Repeater",
        classLabel: "Vanguardia",
        unlockLevel: 1,
        ammoKey: "ammo",
        ammoLabel: "Cells",
        magazineSize: 30,
        reloadTime: 1.05,
        damage: 18,
        range: 10.4,
        fireInterval: 0.085,
        hitScale: 0.2,
        color: "#00FFFF",
        flashColor: "rgba(0, 255, 255, 0.95)",
        recoil: { kick: 11, lift: 12, tilt: -0.035 },
        shotSound: "repeater",
        mode: "single",
        overlay: {
          scale: 0.37,
          offsetX: 0,
          offsetY: 0,
          originX: 0.6,
          originY: 0.9,
          muzzleX: 0.08,
          muzzleY: -0.11,
          flashReachX: 0.19,
          flashReachY: -0.16,
          flashRadius: 20,
        },
        sprite: makeSprite("/assets/images/weapons/fps/volt-repeater-fps.png"),
      },
      shotgun: {
        name: "Shard Shotgun",
        classLabel: "Breacher",
        unlockLevel: 2,
        ammoKey: "shellAmmo",
        ammoLabel: "Shells",
        magazineSize: 6,
        reloadTime: 1.28,
        damage: 15,
        pellets: 9,
        range: 6.6,
        hitScale: 0.48,
        spread: 0.28,
        fireInterval: 0.72,
        color: "#39FF14",
        flashColor: "rgba(57, 255, 20, 0.95)",
        recoil: { kick: 44, lift: 38, tilt: -0.13 },
        shotSound: "shotgun",
        mode: "shotgun",
        overlay: {
          scale: 0.35,
          offsetX: -0.01,
          offsetY: 0.01,
          originX: 0.6,
          originY: 0.88,
          muzzleX: 0.095,
          muzzleY: -0.095,
          flashReachX: 0.17,
          flashReachY: -0.12,
          flashRadius: 24,
        },
        sprite: makeSprite("/assets/images/weapons/fps/shard-shotgun-fps.png"),
      },
      carbine: {
        name: "Rift Carbine",
        classLabel: "Precision",
        unlockLevel: 4,
        ammoKey: "ammo",
        ammoLabel: "Cells",
        magazineSize: 5,
        reloadTime: 1.42,
        damage: 92,
        range: 13.8,
        fireInterval: 0.68,
        hitScale: 0.13,
        color: "#00FFFF",
        flashColor: "rgba(255, 0, 255, 0.95)",
        recoil: { kick: 33, lift: 30, tilt: -0.09 },
        shotSound: "carbine",
        mode: "pierce",
        pierceCount: 3,
        overlay: {
          scale: 0.4,
          offsetX: 0,
          offsetY: -0.005,
          originX: 0.6,
          originY: 0.9,
          muzzleX: 0.12,
          muzzleY: -0.125,
          flashReachX: 0.24,
          flashReachY: -0.19,
          flashRadius: 26,
        },
        sprite: makeSprite("/assets/images/weapons/fps/rift-carbine-fps.png"),
      },
      hellburst: {
        name: "Hellburst",
        classLabel: "Demolicion",
        unlockLevel: 6,
        ammoKey: "altAmmo",
        ammoLabel: "Cores",
        magazineSize: 2,
        reloadTime: 1.65,
        damage: 132,
        range: 10.8,
        fireInterval: 0.96,
        hitScale: 0.5,
        splashRadius: 1.9,
        color: "#FF0055",
        flashColor: "rgba(255, 0, 85, 0.98)",
        recoil: { kick: 54, lift: 44, tilt: -0.16 },
        shotSound: "hellburst",
        mode: "splash",
        overlay: {
          scale: 0.39,
          offsetX: -0.015,
          offsetY: 0,
          originX: 0.6,
          originY: 0.9,
          muzzleX: 0.11,
          muzzleY: -0.115,
          flashReachX: 0.24,
          flashReachY: -0.15,
          flashRadius: 30,
        },
        sprite: makeSprite("/assets/images/weapons/fps/hellburst-fps.png"),
      },
    };
  }

  attachToPlayer(player) {
    if (!this.unlockedWeapons.has(this.currentWeapon)) {
      this.currentWeapon = this.weaponOrder.find((weaponId) => this.unlockedWeapons.has(weaponId)) || "repeater";
    }

    const config = this.getCurrentConfig();
    this.ensureMagazine(this.currentWeapon);
    player.weaponName = `${config.name} // ${config.classLabel}`;
    this.currentColor = config.color;
  }

  setUnlockedWeapons(weaponIds = []) {
    const normalized = weaponIds.filter((weaponId) => this.weaponOrder.includes(weaponId));
    this.unlockedWeapons = new Set(normalized.length ? normalized : ["repeater"]);

    if (!this.unlockedWeapons.has(this.currentWeapon)) {
      this.currentWeapon = normalized[0] || "repeater";
    }
  }

  getCurrentConfig() {
    return this.configs[this.currentWeapon];
  }

  getSprite() {
    return this.getCurrentConfig().sprite;
  }

  ensureMagazine(weaponId = this.currentWeapon) {
    const config = this.configs[weaponId];

    if (typeof this.loadedAmmo[weaponId] !== "number") {
      this.loadedAmmo[weaponId] = config.magazineSize;
    }

    return this.loadedAmmo[weaponId];
  }

  getLoadedAmmo(weaponId = this.currentWeapon) {
    return this.ensureMagazine(weaponId);
  }

  getMagazineInfo(player) {
    const config = this.getCurrentConfig();

    return {
      loaded: this.getLoadedAmmo(),
      magazineSize: config.magazineSize,
      reserve: player[config.ammoKey] ?? 0,
      ammoLabel: config.ammoLabel,
      reloading: this.reloadingWeapon === this.currentWeapon && this.reloadTimer > 0,
      reloadProgress: this.reloadDuration ? 1 - this.reloadTimer / this.reloadDuration : 1,
    };
  }

  getAmmoLabel(player) {
    const config = this.getCurrentConfig();
    const info = this.getMagazineInfo(player);
    const reloadLabel = info.reloading ? `Recargando ${Math.round(info.reloadProgress * 100)}% // ` : "";
    const activeAmmo = `${reloadLabel}${info.loaded}/${info.magazineSize} ${config.ammoLabel} // Reserva ${info.reserve}`;

    if (config.ammoKey === "ammo") {
      return `${activeAmmo} // ${player.shellAmmo} Shells // ${player.altAmmo} Cores`;
    }

    if (config.ammoKey === "shellAmmo") {
      return `${activeAmmo} // ${player.ammo} Cells // ${player.altAmmo} Cores`;
    }

    return `${activeAmmo} // ${player.ammo} Cells // ${player.shellAmmo} Shells`;
  }

  update(dt, game = null) {
    this.cooldown = Math.max(0, this.cooldown - dt);
    this.reloadTimer = Math.max(0, this.reloadTimer - dt);
    this.muzzleFlash = Math.max(0, this.muzzleFlash - dt * 8.5);
    this.recoilKick += (0 - this.recoilKick) * Math.min(1, dt * 12);
    this.recoilLift += (0 - this.recoilLift) * Math.min(1, dt * 12);
    this.recoilTilt += (0 - this.recoilTilt) * Math.min(1, dt * 10);

    if (this.reloadingWeapon && this.reloadTimer <= 0 && game?.player) {
      this.finishReload(game);
    }
  }

  switchWeapon(game) {
    const unlockedOrder = this.weaponOrder.filter((weaponId) => this.unlockedWeapons.has(weaponId));

    if (unlockedOrder.length <= 1) {
      game.pushAlert("Necesitas subir de nivel para desbloquear mas clases.");
      return;
    }

    const currentIndex = unlockedOrder.indexOf(this.currentWeapon);
    this.cancelReload();
    this.currentWeapon = unlockedOrder[(currentIndex + 1) % unlockedOrder.length];
    const config = this.getCurrentConfig();
    this.ensureMagazine(this.currentWeapon);
    game.player.weaponName = `${config.name} // ${config.classLabel}`;
    this.currentColor = config.color;
    game.audio?.playSwapWeapon();
    game.pushAlert(`Clase activa: ${config.classLabel} // ${config.name}.`);
  }

  reload(game) {
    const player = game.player;
    const config = this.getCurrentConfig();
    const loaded = this.getLoadedAmmo();
    const reserve = player[config.ammoKey] ?? 0;
    const missing = config.magazineSize - loaded;

    if (this.reloadingWeapon) {
      game.pushAlert("Recarga en curso.");
      return;
    }

    if (missing <= 0) {
      game.pushAlert("Cargador lleno.");
      this.cooldown = Math.max(this.cooldown, 0.12);
      return;
    }

    if (reserve <= 0) {
      game.pushAlert(`Sin reserva de ${config.ammoLabel}. Busca pickups.`);
      game.audio?.playPlayerDamage();
      this.cooldown = Math.max(this.cooldown, 0.18);
      return;
    }

    this.reloadingWeapon = this.currentWeapon;
    this.reloadDuration = config.reloadTime;
    this.reloadTimer = config.reloadTime;
    this.cooldown = Math.max(this.cooldown, config.reloadTime);
    this.muzzleFlash = 0;
    game.pushAlert(`Recargando ${config.name}...`);
  }

  finishReload(game) {
    const weaponId = this.reloadingWeapon;
    const config = this.configs[weaponId];

    if (!config) {
      this.cancelReload();
      return;
    }

    const loaded = this.ensureMagazine(weaponId);
    const reserve = game.player[config.ammoKey] ?? 0;
    const missing = config.magazineSize - loaded;
    const transfer = Math.min(missing, reserve);

    this.loadedAmmo[weaponId] = loaded + transfer;
    game.player[config.ammoKey] = reserve - transfer;
    this.cancelReload();
    game.pushAlert(transfer > 0 ? `Recarga lista: ${this.loadedAmmo[weaponId]}/${config.magazineSize}.` : `Sin reserva de ${config.ammoLabel}.`);
    game.emitHud?.();
  }

  cancelReload() {
    this.reloadingWeapon = null;
    this.reloadTimer = 0;
    this.reloadDuration = 0;
  }

  shoot(game) {
    const player = game.player;
    const config = this.getCurrentConfig();
    const rapidModifier = (game.activeEffects.overclock > 0 ? 0.72 : 1) * game.getFireRateModifier();

    if (this.cooldown > 0) {
      return;
    }

    if (this.reloadingWeapon) {
      game.pushAlert("Recargando...");
      return;
    }

    if (this.getLoadedAmmo() <= 0) {
      const reserve = player[config.ammoKey] ?? 0;
      game.pushAlert(reserve > 0 ? "Cargador vacio. Toca RELOAD." : `Sin ${config.ammoLabel}. Busca pickups.`);
      this.cooldown = 0.18;
      game.audio?.playPlayerDamage();
      return;
    }

    this.loadedAmmo[this.currentWeapon] -= 1;
    this.cooldown = config.fireInterval * rapidModifier;
    this.muzzleFlash = 1;
    this.currentColor = config.color;
    this.recoilKick = config.recoil.kick;
    this.recoilLift = config.recoil.lift;
    this.recoilTilt = config.recoil.tilt;
    game.audio?.playShot(config.shotSound);
    game.reportOnlineShot?.(config);

    const targets = this.acquireTargets(game, config);

    if (!targets.length) {
      game.pushAlert("Disparo al vacio.");
      return;
    }

    const damageMultiplier = game.getDamageMultiplier();
    let anyKill = false;

    targets.forEach((target, index) => {
      let damage = config.damage * damageMultiplier;

      if (config.mode === "splash" && index > 0) {
        damage *= 0.45;
      }

      if (config.mode === "pierce" && index > 0) {
        damage *= 0.72;
      }

      const wasKilled = target.takeDamage(Math.round(damage));

      if (!wasKilled) {
        return;
      }

      anyKill = true;
      player.score += target.scoreValue;
      player.kills += 1;
      game.handleEnemyKill(target);
    });

    if (anyKill) {
      game.pushAlert(
        config.mode === "splash"
          ? "Hellburst impacto multiple."
          : config.mode === "shotgun"
            ? "Shard Shotgun pulverizo el frente."
            : `${targets[0].label} neutralizado.`,
      );
      return;
    }

    game.audio?.playHit();
    game.pushAlert(`Impacto sobre ${targets[0].label}.`);
  }

  acquireTargets(game, config) {
    if (config.mode === "shotgun") {
      return this.acquireShotgunTargets(game, config);
    }

    if (config.mode === "pierce") {
      return this.acquirePierceTargets(game, config);
    }

    const primaryTarget = this.acquirePrimaryTarget(game, config);

    if (!primaryTarget) {
      return [];
    }

    if (config.mode !== "splash") {
      return [primaryTarget];
    }

    return game.enemies.filter((enemy) => {
      if (enemy.dead) {
        return false;
      }

      return Math.hypot(enemy.x - primaryTarget.x, enemy.y - primaryTarget.y) <= config.splashRadius;
    });
  }

  acquirePrimaryTarget(game, config, angleOffset = 0) {
    const player = game.player;
    let target = null;
    let targetDistance = Infinity;

    for (const enemy of game.enemies) {
      if (enemy.dead) {
        continue;
      }

      const dx = enemy.x - player.x;
      const dy = enemy.y - player.y;
      const distance = Math.hypot(dx, dy);

      if (distance > config.range) {
        continue;
      }

      const enemyAngle = Math.atan2(dy, dx);
      const angleDelta = Math.abs(normalizeAngle(enemyAngle - (player.angle + angleOffset)));
      const hitWindow = Math.max(0.08, config.hitScale / distance);

      if (angleDelta > hitWindow) {
        continue;
      }

      if (!game.hasLineOfSight(player.x, player.y, enemy.x, enemy.y)) {
        continue;
      }

      if (distance < targetDistance) {
        target = enemy;
        targetDistance = distance;
      }
    }

    return target;
  }

  acquireShotgunTargets(game, config) {
    const hits = new Map();

    for (let pelletIndex = 0; pelletIndex < config.pellets; pelletIndex += 1) {
      const offset = ((pelletIndex / Math.max(1, config.pellets - 1)) - 0.5) * config.spread;
      const target = this.acquirePrimaryTarget(game, config, offset);

      if (target) {
        hits.set(target, target);
      }
    }

    return [...hits.values()];
  }

  acquirePierceTargets(game, config) {
    const player = game.player;

    return game.enemies
      .filter((enemy) => {
        if (enemy.dead) {
          return false;
        }

        const dx = enemy.x - player.x;
        const dy = enemy.y - player.y;
        const distance = Math.hypot(dx, dy);

        if (distance > config.range || !game.hasLineOfSight(player.x, player.y, enemy.x, enemy.y)) {
          return false;
        }

        const enemyAngle = Math.atan2(dy, dx);
        const angleDelta = Math.abs(normalizeAngle(enemyAngle - player.angle));
        return angleDelta <= Math.max(0.04, config.hitScale / distance);
      })
      .sort((left, right) => {
        const leftDistance = Math.hypot(left.x - player.x, left.y - player.y);
        const rightDistance = Math.hypot(right.x - player.x, right.y - player.y);
        return leftDistance - rightDistance;
      })
      .slice(0, config.pierceCount);
  }
}


