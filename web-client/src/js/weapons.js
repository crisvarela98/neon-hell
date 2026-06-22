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
    this.configs = {
      repeater: {
        name: "Volt Repeater",
        ammoKey: "ammo",
        ammoLabel: "Cells",
        damage: 24,
        range: 9.8,
        fireInterval: 0.11,
        hitScale: 0.23,
        color: "#00FFFF",
        flashColor: "rgba(0, 255, 255, 0.95)",
        recoil: { kick: 16, lift: 18, tilt: -0.05 },
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
        ammoKey: "shellAmmo",
        ammoLabel: "Shells",
        damage: 18,
        pellets: 6,
        range: 7.6,
        hitScale: 0.42,
        spread: 0.17,
        fireInterval: 0.62,
        color: "#39FF14",
        flashColor: "rgba(57, 255, 20, 0.95)",
        recoil: { kick: 38, lift: 34, tilt: -0.11 },
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
        ammoKey: "ammo",
        ammoLabel: "Cells",
        damage: 72,
        range: 12.5,
        fireInterval: 0.52,
        hitScale: 0.17,
        color: "#00FFFF",
        flashColor: "rgba(255, 0, 255, 0.95)",
        recoil: { kick: 28, lift: 26, tilt: -0.08 },
        shotSound: "carbine",
        mode: "pierce",
        pierceCount: 2,
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
        ammoKey: "altAmmo",
        ammoLabel: "Cores",
        damage: 112,
        range: 11.4,
        fireInterval: 0.74,
        hitScale: 0.5,
        splashRadius: 1.55,
        color: "#FF0055",
        flashColor: "rgba(255, 0, 85, 0.98)",
        recoil: { kick: 46, lift: 38, tilt: -0.14 },
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
    const config = this.getCurrentConfig();
    player.weaponName = config.name;
    this.currentColor = config.color;
  }

  getCurrentConfig() {
    return this.configs[this.currentWeapon];
  }

  getSprite() {
    return this.getCurrentConfig().sprite;
  }

  getAmmoLabel(player) {
    const config = this.getCurrentConfig();
    const amount = player[config.ammoKey] ?? 0;

    if (config.ammoKey === "ammo") {
      return `${amount} ${config.ammoLabel} // ${player.shellAmmo} Shells // ${player.altAmmo} Cores`;
    }

    if (config.ammoKey === "shellAmmo") {
      return `${amount} ${config.ammoLabel} // ${player.ammo} Cells // ${player.altAmmo} Cores`;
    }

    return `${amount} ${config.ammoLabel} // ${player.ammo} Cells // ${player.shellAmmo} Shells`;
  }

  update(dt) {
    this.cooldown = Math.max(0, this.cooldown - dt);
    this.muzzleFlash = Math.max(0, this.muzzleFlash - dt * 8.5);
    this.recoilKick += (0 - this.recoilKick) * Math.min(1, dt * 12);
    this.recoilLift += (0 - this.recoilLift) * Math.min(1, dt * 12);
    this.recoilTilt += (0 - this.recoilTilt) * Math.min(1, dt * 10);
  }

  switchWeapon(game) {
    const currentIndex = this.weaponOrder.indexOf(this.currentWeapon);
    this.currentWeapon = this.weaponOrder[(currentIndex + 1) % this.weaponOrder.length];
    const config = this.getCurrentConfig();
    game.player.weaponName = config.name;
    this.currentColor = config.color;
    game.audio?.playSwapWeapon();
    game.pushAlert(`Arma activa: ${config.name}.`);
  }

  shoot(game) {
    const player = game.player;
    const config = this.getCurrentConfig();
    const rapidModifier = game.activeEffects.overclock > 0 ? 0.72 : 1;

    if (this.cooldown > 0) {
      return;
    }

    if ((player[config.ammoKey] ?? 0) <= 0) {
      game.pushAlert(`Sin ${config.ammoLabel}.`);
      this.cooldown = 0.18;
      game.audio?.playPlayerDamage();
      return;
    }

    player[config.ammoKey] -= 1;
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


