export class Player {
  constructor(start) {
    this.radius = 0.22;
    this.turnSpeed = 2.4;
    this.moveSpeed = 2.9;
    this.maxHealth = 100;
    this.maxAmmo = 220;
    this.maxAltAmmo = 28;
    this.maxShellAmmo = 40;
    this.weaponName = "Volt Repeater";
    this.speedMultiplier = 1;
    this.reset(start);
  }

  reset(start) {
    this.x = start.x;
    this.y = start.y;
    this.angle = start.angle;
    this.health = this.maxHealth;
    this.ammo = 72;
    this.altAmmo = 4;
    this.shellAmmo = 10;
    this.score = 0;
    this.kills = 0;
    this.wave = 1;
    this.timeSurvived = 0;
    this.damageFlash = 0;
    this.speedMultiplier = 1;
  }

  addLook(delta) {
    this.angle += delta;
  }

  update(dt, input, map) {
    this.damageFlash = Math.max(0, this.damageFlash - dt * 2.5);

    const turnAxis = Number(input.turnRight) - Number(input.turnLeft);
    const moveAxis = Number(input.forward) - Number(input.backward);
    const strafeAxis = Number(input.strafeRight) - Number(input.strafeLeft);

    this.angle += turnAxis * this.turnSpeed * dt;

    let moveX = Math.cos(this.angle) * moveAxis - Math.sin(this.angle) * strafeAxis;
    let moveY = Math.sin(this.angle) * moveAxis + Math.cos(this.angle) * strafeAxis;

    const length = Math.hypot(moveX, moveY) || 1;
    moveX /= length;
    moveY /= length;

    const speed = this.moveSpeed * this.speedMultiplier * dt;
    this.tryMove(this.x + moveX * speed, this.y, map);
    this.tryMove(this.x, this.y + moveY * speed, map);
  }

  tryMove(nextX, nextY, map) {
    if (!this.collides(nextX, nextY, map)) {
      this.x = nextX;
      this.y = nextY;
    }
  }

  collides(x, y, map) {
    const samplePoints = [
      [x - this.radius, y - this.radius],
      [x + this.radius, y - this.radius],
      [x - this.radius, y + this.radius],
      [x + this.radius, y + this.radius],
    ];

    return samplePoints.some(([sampleX, sampleY]) => {
      const cell = map[Math.floor(sampleY)]?.[Math.floor(sampleX)] ?? 1;
      return cell !== 0 && cell !== 4;
    });
  }

  takeDamage(amount) {
    this.health = Math.max(0, this.health - amount);
    this.damageFlash = 1;
  }

  heal(amount) {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }

  addAmmo(amount) {
    this.ammo = Math.min(this.maxAmmo, this.ammo + amount);
  }

  addAltAmmo(amount) {
    this.altAmmo = Math.min(this.maxAltAmmo, this.altAmmo + amount);
  }

  addShellAmmo(amount) {
    this.shellAmmo = Math.min(this.maxShellAmmo, this.shellAmmo + amount);
  }
}
