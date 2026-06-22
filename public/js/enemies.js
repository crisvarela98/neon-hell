const ENEMY_TYPES = {
  hacker: {
    id: "hacker",
    label: "Hacker Infectado",
    health: 40,
    speed: 1.75,
    color: "#ff4fd8",
    damage: 10,
    meleeRange: 0.75,
    attackCooldown: 0.9,
    scoreValue: 100,
    size: 0.48,
  },
  drone: {
    id: "drone",
    label: "Drone Corrupto",
    health: 70,
    speed: 1.05,
    color: "#52d6ff",
    damage: 12,
    rangedRange: 6.5,
    attackCooldown: 1.65,
    scoreValue: 200,
    size: 0.42,
  },
  demon: {
    id: "demon",
    label: "Demonio Cibernetico",
    health: 140,
    speed: 0.82,
    color: "#ff4060",
    damage: 22,
    meleeRange: 0.92,
    attackCooldown: 1.35,
    scoreValue: 500,
    size: 0.64,
  },
  archon: {
    id: "archon",
    label: "ARCHON PRIME",
    health: 540,
    speed: 0.88,
    color: "#ffd166",
    damage: 18,
    meleeRange: 1,
    rangedRange: 8.4,
    attackCooldown: 1.1,
    scoreValue: 2200,
    size: 0.92,
    isBoss: true,
  },
};

export class EnemyProjectile {
  constructor(x, y, angle, damage, color, speed = 4.2) {
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.damage = damage;
    this.color = color;
    this.radius = 0.12;
    this.speed = speed;
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
      game.damagePlayer(this.damage, "Proyectil corrupto");
    }
  }
}

export class Enemy {
  constructor(typeId, x, y, waveMultiplier = 1) {
    const config = ENEMY_TYPES[typeId];

    this.type = config.id;
    this.label = config.label;
    this.color = config.color;
    this.speed = config.speed * (1 + waveMultiplier * 0.03);
    this.damage = Math.round(config.damage * (1 + waveMultiplier * 0.04));
    this.meleeRange = config.meleeRange || 0;
    this.rangedRange = config.rangedRange || 0;
    this.attackCooldown = Math.max(0.35, config.attackCooldown - waveMultiplier * 0.01);
    this.scoreValue = config.scoreValue;
    this.size = config.size;
    this.maxHealth = Math.round(config.health * (1 + waveMultiplier * 0.12));
    this.health = this.maxHealth;
    this.x = x;
    this.y = y;
    this.dead = false;
    this.hitFlash = 0;
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
    this.attackTimer -= dt;

    const dx = game.player.x - this.x;
    const dy = game.player.y - this.y;
    const distance = Math.hypot(dx, dy) || 0.0001;
    const directionX = dx / distance;
    const directionY = dy / distance;
    const sideX = -directionY;
    const sideY = directionX;
    const crowdForce = this.computeSeparation(game);

    if (this.type === "drone" || this.type === "archon") {
      const preferredDistance = this.isBoss ? 4.8 : 3.4;
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
        this.attackTimer = this.attackCooldown;

        if (this.isBoss) {
          [-0.18, 0, 0.18].forEach((offset) => {
            game.spawnProjectile(
              new EnemyProjectile(
                this.x,
                this.y,
                Math.atan2(dy, dx) + offset,
                this.damage,
                this.color,
                5.1,
              ),
            );
          });
          game.pushAlert("ARCHON PRIME descargo una rafaga.");
        } else {
          game.spawnProjectile(
            new EnemyProjectile(
              this.x,
              this.y,
              Math.atan2(dy, dx),
              this.damage,
              this.color,
            ),
          );
          game.pushAlert("Drone corrupto disparando.");
        }
      }

      if (this.isBoss && distance <= this.meleeRange && this.attackTimer <= 0) {
        this.attackTimer = this.attackCooldown;
        game.damagePlayer(this.damage + 10, this.label);
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
      this.attackTimer = this.attackCooldown;
      game.damagePlayer(this.damage, this.label);
    }
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

export function createWaveEnemies(spawnPoints, wave, countOverride = null) {
  const enemies = [];
  const count = countOverride ?? 3 + wave * 2;

  for (let index = 0; index < count; index += 1) {
    const spawn = spawnPoints[index % spawnPoints.length];
    const offset = (index % 2 === 0 ? 0.18 : -0.18) * ((index % 3) + 1) * 0.35;
    const type = chooseType(index, wave);
    enemies.push(new Enemy(type, spawn.x + offset, spawn.y - offset, wave));
  }

  return enemies;
}

export function createBossEnemy(spawn, wave) {
  return new Enemy("archon", spawn.x, spawn.y, Math.max(wave, 4));
}
