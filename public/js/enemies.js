function makeSprite(path) {
  if (typeof Image === "undefined") {
    return null;
  }

  const image = new Image();
  image.src = path;
  return image;
}

const ENEMY_TYPES = {
  hacker: {
    id: "hacker",
    label: "Hacker Infectado",
    health: 40,
    speed: 1.75,
    color: "#FF00FF",
    damage: 10,
    meleeRange: 0.75,
    rangedRange: 5.2,
    preferredDistance: 2.4,
    attackCooldown: 1.15,
    projectileSpeed: 4.9,
    projectileRadius: 0.1,
    weaponLabel: "Glitch pistol",
    scoreValue: 100,
    size: 0.48,
    sprite: makeSprite("/assets/images/enemies/hacker-infectado.png"),
  },
  drone: {
    id: "drone",
    label: "Drone Corrupto",
    health: 70,
    speed: 1.05,
    color: "#00FFFF",
    damage: 12,
    rangedRange: 6.5,
    preferredDistance: 3.4,
    attackCooldown: 1.65,
    projectileSpeed: 5.3,
    projectileRadius: 0.11,
    weaponLabel: "Pulse cannon",
    scoreValue: 200,
    size: 0.42,
    sprite: makeSprite("/assets/images/enemies/drone-corrupto.png"),
  },
  demon: {
    id: "demon",
    label: "Demonio Cibernetico",
    health: 140,
    speed: 0.82,
    color: "#FF0055",
    damage: 22,
    meleeRange: 0.92,
    rangedRange: 4.6,
    preferredDistance: 2.1,
    attackCooldown: 1.45,
    projectileSpeed: 3.9,
    projectileRadius: 0.14,
    weaponLabel: "Hell spike",
    scoreValue: 500,
    size: 0.64,
    sprite: makeSprite("/assets/images/enemies/demonio-cibernetico.png"),
  },
  archon: {
    id: "archon",
    label: "ARCHON PRIME",
    health: 540,
    speed: 0.88,
    color: "#39FF14",
    damage: 18,
    meleeRange: 1,
    rangedRange: 8.4,
    preferredDistance: 4.8,
    attackCooldown: 1.1,
    projectileSpeed: 5.4,
    projectileRadius: 0.15,
    weaponLabel: "Breach cannon",
    scoreValue: 2200,
    size: 0.92,
    isBoss: true,
    sprite: makeSprite("/assets/images/enemies/archon-prime.png"),
  },
  warden: {
    id: "warden",
    label: "MIRAGE WARDEN",
    health: 420,
    speed: 1.08,
    color: "#00FFFF",
    damage: 16,
    meleeRange: 0.88,
    rangedRange: 7.4,
    preferredDistance: 5.1,
    attackCooldown: 0.92,
    projectileSpeed: 5.9,
    projectileRadius: 0.13,
    weaponLabel: "Mirror lance",
    scoreValue: 2600,
    size: 0.88,
    isBoss: true,
    sprite: makeSprite("/assets/images/enemies/archon-prime.png"),
  },
  seraph: {
    id: "seraph",
    label: "NULL SERAPH",
    health: 640,
    speed: 0.94,
    color: "#39FF14",
    damage: 24,
    meleeRange: 1.04,
    rangedRange: 8.8,
    preferredDistance: 4.2,
    attackCooldown: 0.98,
    projectileSpeed: 5.8,
    projectileRadius: 0.16,
    weaponLabel: "Null choir",
    scoreValue: 3400,
    size: 0.98,
    isBoss: true,
    sprite: makeSprite("/assets/images/enemies/archon-prime.png"),
  },
};

export class EnemyProjectile {
  constructor(x, y, angle, damage, color, speed = 4.2, radius = 0.12, sourceLabel = "Proyectil corrupto") {
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.damage = damage;
    this.color = color;
    this.radius = radius;
    this.speed = speed;
    this.sourceLabel = sourceLabel;
    this.dead = false;
  }

  update(dt, game) {
    if (this.dead) {
      return;
    }

    const nextX = this.x + Math.cos(this.angle) * this.speed * dt;
    const nextY = this.y + Math.sin(this.angle) * this.speed * dt;

    if (!game.isWalkable(nextX, nextY)) {
      this.dead = true;
      return;
    }

    this.x = nextX;
    this.y = nextY;

    const distanceToPlayer = Math.hypot(game.player.x - this.x, game.player.y - this.y);

    if (distanceToPlayer <= game.player.radius + this.radius) {
      this.dead = true;
      game.damagePlayer(this.damage, this.sourceLabel);
    }
  }
}

export class Enemy {
  constructor(typeId, x, y, waveMultiplier = 1, tuning = {}) {
    const config = ENEMY_TYPES[typeId];
    const enemySpeedMultiplier = tuning.enemySpeedMultiplier || 1;
    const enemyDamageMultiplier = tuning.enemyDamageMultiplier || 1;
    const enemyHealthMultiplier = config.isBoss
      ? (tuning.enemyHealthMultiplier || 1) * (tuning.bossHealthMultiplier || 1)
      : (tuning.enemyHealthMultiplier || 1);

    this.type = config.id;
    this.label = config.label;
    this.color = config.color;
    this.speed = config.speed * (1 + waveMultiplier * 0.03) * enemySpeedMultiplier;
    this.damage = Math.round(config.damage * (1 + waveMultiplier * 0.04) * enemyDamageMultiplier);
    this.meleeRange = config.meleeRange || 0;
    this.rangedRange = config.rangedRange || 0;
    this.preferredDistance = config.preferredDistance || Math.max(2.4, this.rangedRange * 0.52);
    this.projectileSpeed = config.projectileSpeed || 4.2;
    this.projectileRadius = config.projectileRadius || 0.12;
    this.weaponLabel = config.weaponLabel || "Arma corrupta";
    this.attackCooldown = Math.max(0.35, config.attackCooldown - waveMultiplier * 0.01);
    this.scoreValue = config.scoreValue;
    this.size = config.size;
    this.sprite = config.sprite;
    this.maxHealth = Math.round(config.health * (1 + waveMultiplier * 0.12) * enemyHealthMultiplier);
    this.health = this.maxHealth;
    this.x = x;
    this.y = y;
    this.dead = false;
    this.hitFlash = 0;
    this.attackFlash = 0;
    this.attackAngle = 0;
    this.attackTimer = Math.random() * this.attackCooldown;
    this.hoverPhase = Math.random() * Math.PI * 2;
    this.strafeDirection = Math.random() > 0.5 ? 1 : -1;
    this.isBoss = Boolean(config.isBoss);
  }

  update(dt, game) {
    if (this.dead) {
      return;
    }

    this.hitFlash = Math.max(0, this.hitFlash - dt * 5);
    this.attackFlash = Math.max(0, this.attackFlash - dt * 5.5);
    this.attackTimer -= dt;

    const dx = game.player.x - this.x;
    const dy = game.player.y - this.y;
    const distance = Math.hypot(dx, dy) || 0.0001;
    const directionX = dx / distance;
    const directionY = dy / distance;
    const sideX = -directionY;
    const sideY = directionX;
    const crowdForce = this.computeSeparation(game);

    if (this.rangedRange > 0 && distance > this.meleeRange + 0.25) {
      const preferredDistance = this.preferredDistance;
      const strafeStrength = this.isBoss ? 0.62 : 0.4;

      if (distance > preferredDistance) {
        this.tryMove(
          this.x + (directionX + crowdForce.x + sideX * 0.2 * this.strafeDirection) * this.speed * dt,
          this.y + (directionY + crowdForce.y + sideY * 0.2 * this.strafeDirection) * this.speed * dt,
          game,
        );
      } else if (distance < preferredDistance - 0.8) {
        this.tryMove(
          this.x + (-directionX + crowdForce.x + sideX * 0.35 * this.strafeDirection) * this.speed * dt * 0.7,
          this.y + (-directionY + crowdForce.y + sideY * 0.35 * this.strafeDirection) * this.speed * dt * 0.7,
          game,
        );
      } else {
        this.tryMove(
          this.x + (sideX * this.strafeDirection * strafeStrength + crowdForce.x) * this.speed * dt,
          this.y + (sideY * this.strafeDirection * strafeStrength + crowdForce.y) * this.speed * dt,
          game,
        );
      }

      if (
        distance <= this.rangedRange &&
        this.attackTimer <= 0 &&
        game.hasLineOfSight(this.x, this.y, game.player.x, game.player.y)
      ) {
        this.fireAtPlayer(game, Math.atan2(dy, dx));
      }

      if (this.isBoss && distance <= this.meleeRange && this.attackTimer <= 0) {
        this.performMeleeAttack(game, this.damage + 10);
      }

      return;
    }

    if (distance > this.meleeRange) {
      this.tryMove(
        this.x + (directionX + crowdForce.x) * this.speed * dt,
        this.y + (directionY + crowdForce.y) * this.speed * dt,
        game,
      );
    }

    if (distance <= this.meleeRange && this.attackTimer <= 0) {
      this.performMeleeAttack(game, this.damage);
    }
  }

  fireAtPlayer(game, angle) {
    this.attackTimer = this.attackCooldown;
    this.attackFlash = 1;
    this.attackAngle = angle;
    game.audio?.playEnemyShot?.(this.type);

    if (this.isBoss) {
      [-0.18, 0, 0.18].forEach((offset) => {
        game.spawnProjectile(
          new EnemyProjectile(
            this.x,
            this.y,
            angle + offset,
            this.damage,
            this.color,
            this.projectileSpeed,
            this.projectileRadius,
            `${this.label} // ${this.weaponLabel}`,
          ),
        );
      });
      game.pushAlert(`${this.label} te apunta con ${this.weaponLabel}.`);
      return;
    }

    const offsets = this.type === "demon" ? [-0.08, 0.08] : [0];

    offsets.forEach((offset) => {
      game.spawnProjectile(
        new EnemyProjectile(
          this.x,
          this.y,
          angle + offset,
          this.damage,
          this.color,
          this.projectileSpeed,
          this.projectileRadius,
          `${this.label} // ${this.weaponLabel}`,
        ),
      );
    });
    game.pushAlert(`${this.label} dispara ${this.weaponLabel}.`);
  }

  performMeleeAttack(game, damage) {
    this.attackTimer = this.attackCooldown;
    this.attackFlash = 1;
    this.attackAngle = Math.atan2(game.player.y - this.y, game.player.x - this.x);
    game.audio?.playEnemyMelee?.(this.type);
    game.damagePlayer(damage, `${this.label} // ataque cuerpo a cuerpo`);
  }

  computeSeparation(game) {
    let forceX = 0;
    let forceY = 0;

    for (const enemy of game.enemies) {
      if (enemy === this || enemy.dead) {
        continue;
      }

      const dx = this.x - enemy.x;
      const dy = this.y - enemy.y;
      const distance = Math.hypot(dx, dy);

      if (distance <= 0.001 || distance > 0.8) {
        continue;
      }

      forceX += dx / distance;
      forceY += dy / distance;
    }

    return {
      x: forceX * 0.35,
      y: forceY * 0.35,
    };
  }

  tryMove(nextX, nextY, game) {
    if (!game.isWalkable(nextX, nextY)) {
      return;
    }

    const hitPlayer = Math.hypot(game.player.x - nextX, game.player.y - nextY) <= 0.58;

    if (hitPlayer) {
      return;
    }

    this.x = nextX;
    this.y = nextY;
  }

  takeDamage(amount) {
    this.health = Math.max(0, this.health - amount);
    this.hitFlash = 1;

    if (this.health === 0) {
      this.dead = true;
      return true;
    }

    return false;
  }
}

function chooseType(index, wave) {
  if (wave >= 4 && index % 5 === 0) {
    return "demon";
  }

  if (wave >= 2 && index % 3 === 0) {
    return "drone";
  }

  return "hacker";
}

export function createWaveEnemies(spawnPoints, wave, countOverride = null, tuning = {}) {
  const enemies = [];
  const count = countOverride ?? 3 + wave * 2;

  for (let index = 0; index < count; index += 1) {
    const spawn = spawnPoints[index % spawnPoints.length];
    const offset = (index % 2 === 0 ? 0.18 : -0.18) * ((index % 3) + 1) * 0.35;
    const type = chooseType(index, wave);
    enemies.push(new Enemy(type, spawn.x + offset, spawn.y - offset, wave, tuning));
  }

  return enemies;
}

export function createBossEnemy(spawn, wave, bossId = "archon", tuning = {}) {
  return new Enemy(bossId, spawn.x, spawn.y, Math.max(wave, 4), tuning);
}


