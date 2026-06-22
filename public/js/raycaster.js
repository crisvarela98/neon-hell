const FOV = Math.PI / 3;
const MAX_DEPTH = 18;
const RAY_STEP = 0.03;

function makeTexture(path) {
  if (typeof Image === "undefined") {
    return null;
  }

  const image = new Image();
  image.src = path;
  return image;
}

const WALL_TEXTURES = {
  1: makeTexture("/assets/images/map-textures/wall-magenta-hazard.png"),
  2: makeTexture("/assets/images/map-textures/wall-cyan-circuit.png"),
  3: makeTexture("/assets/images/map-textures/door-red-lock.png"),
};

const FLOOR_TEXTURE = makeTexture("/assets/images/map-textures/floor-green-grid.png");

function isImageReady(image) {
  return Boolean(image?.complete && image.naturalWidth > 0 && image.naturalHeight > 0);
}

function normalizeAngle(angle) {
  while (angle < -Math.PI) {
    angle += Math.PI * 2;
  }

  while (angle > Math.PI) {
    angle -= Math.PI * 2;
  }

  return angle;
}

function wallColor(cellType, shade) {
  if (cellType === 2) {
    return `rgba(0, 255, 255, ${shade})`;
  }

  if (cellType === 3) {
    return `rgba(57, 255, 20, ${shade})`;
  }

  return `rgba(255, 0, 255, ${shade})`;
}

function getWallTexture(cellType) {
  return WALL_TEXTURES[cellType] || WALL_TEXTURES[1];
}

function getTextureCoordinate(hit) {
  const fractionX = ((hit.hitX % 1) + 1) % 1;
  const fractionY = ((hit.hitY % 1) + 1) % 1;
  const edgeDistanceX = Math.min(fractionX, 1 - fractionX);
  const edgeDistanceY = Math.min(fractionY, 1 - fractionY);

  return edgeDistanceX < edgeDistanceY ? fractionY : fractionX;
}

function drawWallStrip(ctx, hit, stripX, stripY, stripWidth, stripHeight, shade) {
  const texture = getWallTexture(hit.cell);

  if (!isImageReady(texture)) {
    ctx.fillStyle = wallColor(hit.cell, shade);
    ctx.fillRect(stripX, stripY, stripWidth, stripHeight);
    return;
  }

  const textureColumn = Math.max(
    0,
    Math.min(texture.naturalWidth - 1, Math.floor(getTextureCoordinate(hit) * texture.naturalWidth)),
  );

  ctx.save();
  ctx.globalAlpha = Math.max(0.44, Math.min(1, shade + 0.24));
  ctx.drawImage(
    texture,
    textureColumn,
    0,
    1,
    texture.naturalHeight,
    stripX,
    stripY,
    stripWidth,
    stripHeight,
  );

  ctx.globalAlpha = Math.min(0.7, Math.max(0, 1 - shade) * 0.85);
  ctx.fillStyle = "#000000";
  ctx.fillRect(stripX, stripY, stripWidth, stripHeight);
  ctx.restore();

  ctx.fillStyle = `rgba(0,255,255,${Math.min(0.13, shade * 0.12)})`;
  ctx.fillRect(stripX, stripY, stripWidth, 3);
}

function isSolid(cell) {
  return cell !== 0 && cell !== 4;
}

function castRay(map, originX, originY, angle) {
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);

  let distance = 0;

  while (distance < MAX_DEPTH) {
    const sampleX = originX + cosine * distance;
    const sampleY = originY + sine * distance;
    const cell = map[Math.floor(sampleY)]?.[Math.floor(sampleX)] ?? 1;

    if (isSolid(cell)) {
      return {
        distance,
        cell,
        hitX: sampleX,
        hitY: sampleY,
      };
    }

    distance += RAY_STEP;
  }

  return {
    distance: MAX_DEPTH,
    cell: 1,
    hitX: originX + cosine * MAX_DEPTH,
    hitY: originY + sine * MAX_DEPTH,
  };
}

function drawFloorGrid(ctx, width, height) {
  if (isImageReady(FLOOR_TEXTURE)) {
    const floorPattern = ctx.createPattern(FLOOR_TEXTURE, "repeat");

    if (floorPattern) {
      ctx.save();
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = floorPattern;
      ctx.fillRect(0, height * 0.56, width, height * 0.44);
      ctx.restore();
    }
  }

  ctx.strokeStyle = "rgba(0, 255, 255, 0.08)";
  ctx.lineWidth = 1;

  for (let y = height * 0.56; y < height; y += 26) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
}

function drawSprites(ctx, game, depthBuffer) {
  const { player, enemies, projectiles, pickups, effects, canvas } = game;
  const width = canvas.width;
  const height = canvas.height;
  const entities = [];

  enemies.forEach((enemy) => {
    if (!enemy.dead) {
      entities.push({
        type: "enemy",
        x: enemy.x,
        y: enemy.y,
        color: enemy.hitFlash > 0 ? "#00FFFF" : enemy.color,
        size: enemy.size,
        bob: enemy.type === "drone" ? Math.sin(game.runtime * 4 + enemy.hoverPhase) * 10 : 0,
        sprite: enemy.sprite,
        hitFlash: enemy.hitFlash,
        isBoss: enemy.isBoss,
      });
    }
  });

  projectiles.forEach((projectile) => {
    if (!projectile.dead) {
      entities.push({
        type: "projectile",
        x: projectile.x,
        y: projectile.y,
        color: projectile.color,
        size: 0.16,
        bob: 0,
      });
    }
  });

  pickups.forEach((pickup) => {
    if (!pickup.collected) {
      entities.push({
        type: "pickup",
        x: pickup.x,
        y: pickup.y,
        color: pickup.color,
        size: pickup.type === "overcharge" ? 0.24 : 0.2,
        bob: Math.sin(game.runtime * 4 + pickup.phase) * 8,
        pickupType: pickup.type,
      });
    }
  });

  effects.forEach((effect) => {
    if (effect.kind === "world-blood") {
      entities.push({
        type: "blood",
        x: effect.x,
        y: effect.y,
        color: effect.color,
        size: effect.size,
        bob: effect.bob,
        life: effect.life,
      });
    }
  });

  game.remotePlayers?.forEach((remotePlayer) => {
    if (remotePlayer.health <= 0) {
      return;
    }

    entities.push({
      type: "teammate",
      x: remotePlayer.x,
      y: remotePlayer.y,
      color: "#39FF14",
      size: 0.28,
      bob: Math.sin(game.runtime * 5) * 5,
      label: remotePlayer.username,
    });
  });

  entities
    .map((entity) => {
      const dx = entity.x - player.x;
      const dy = entity.y - player.y;
      const distance = Math.hypot(dx, dy);
      const relativeAngle = normalizeAngle(Math.atan2(dy, dx) - player.angle);

      return {
        ...entity,
        distance,
        relativeAngle,
      };
    })
    .filter((entity) => Math.abs(entity.relativeAngle) < FOV * 0.72)
    .sort((left, right) => right.distance - left.distance)
    .forEach((entity) => {
      const correctedDistance = entity.distance * Math.cos(entity.relativeAngle);
      const size = Math.min(height * 0.72, (height / Math.max(correctedDistance, 0.3)) * entity.size);
      const screenX = (0.5 + entity.relativeAngle / FOV) * width;
      const column = Math.max(0, Math.min(depthBuffer.length - 1, Math.floor(screenX)));
      const wallDepth = depthBuffer[column] ?? MAX_DEPTH;

      if (correctedDistance >= wallDepth + 0.15) {
        return;
      }

      const alpha = Math.max(0.25, 1 - correctedDistance / MAX_DEPTH);
      const spriteX = screenX - size / 2;
      const spriteY = height / 2 - size / 2 + entity.bob;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.shadowBlur = 18;
      ctx.shadowColor = entity.color;
      ctx.fillStyle = entity.color;

      if (entity.type === "projectile") {
        ctx.beginPath();
        ctx.arc(screenX, height / 2 + entity.bob, size * 0.2, 0, Math.PI * 2);
        ctx.fill();
      } else if (entity.type === "pickup") {
        ctx.translate(screenX, height / 2 + entity.bob);
        ctx.rotate(game.runtime * 0.6);
        ctx.fillRect(-size * 0.3, -size * 0.3, size * 0.6, size * 0.6);
        ctx.strokeStyle = "rgba(0,255,255,0.65)";
        ctx.lineWidth = 2;
        ctx.strokeRect(-size * 0.3, -size * 0.3, size * 0.6, size * 0.6);
      } else if (entity.type === "blood") {
        ctx.globalAlpha = Math.min(alpha, entity.life * 1.4);
        ctx.beginPath();
        ctx.arc(screenX, height / 2 + entity.bob, size * 0.32, 0, Math.PI * 2);
        ctx.fill();
      } else if (entity.type === "teammate") {
        ctx.translate(screenX, height / 2 + entity.bob);
        ctx.rotate(Math.PI / 4);
        ctx.fillRect(-size * 0.34, -size * 0.34, size * 0.68, size * 0.68);
        ctx.rotate(-Math.PI / 4);
        ctx.strokeStyle = "rgba(0,255,255,0.7)";
        ctx.lineWidth = 2;
        ctx.strokeRect(-size * 0.28, -size * 0.48, size * 0.56, size * 0.96);
      } else if (isImageReady(entity.sprite)) {
        const spriteHeight = size * (entity.isBoss ? 1.56 : 1.42);
        const spriteWidth = spriteHeight * (entity.sprite.naturalWidth / entity.sprite.naturalHeight);
        const enemyX = screenX - spriteWidth / 2;
        const enemyY = height / 2 - spriteHeight / 2 + entity.bob;

        ctx.drawImage(entity.sprite, enemyX, enemyY, spriteWidth, spriteHeight);

        if (entity.hitFlash > 0) {
          ctx.save();
          ctx.globalCompositeOperation = "screen";
          ctx.globalAlpha = Math.min(0.55, entity.hitFlash);
          ctx.drawImage(entity.sprite, enemyX, enemyY, spriteWidth, spriteHeight);
          ctx.restore();
        }
      } else {
        ctx.fillRect(spriteX, spriteY, size, size * 1.25);
        ctx.strokeStyle = "rgba(0,255,255,0.55)";
        ctx.lineWidth = 2;
        ctx.strokeRect(spriteX + 4, spriteY + 4, size - 8, size * 1.25 - 8);
      }

      ctx.restore();
    });
}

function drawWeaponOverlay(ctx, game) {
  const { canvas, weapon, player } = game;
  const width = canvas.width;
  const height = canvas.height;
  const sprite = weapon.getSprite?.();
  const currentWeapon = weapon.getCurrentConfig?.();
  const overlay = currentWeapon?.overlay || {};
  const recoilKick = weapon.recoilKick || 0;
  const recoilLift = weapon.recoilLift || 0;
  const recoilTilt = weapon.recoilTilt || 0;
  const idleBob = Math.sin(game.runtime * 6) * 4;
  const baseX = width * (0.77 + (overlay.offsetX || 0)) + recoilKick * 0.6;
  const baseY = height * (0.84 + (overlay.offsetY || 0)) + idleBob - recoilLift * 0.35;

  ctx.save();
  ctx.translate(baseX, baseY);
  ctx.rotate(recoilTilt);

  if (sprite?.complete && sprite.naturalWidth > 0) {
    const spriteWidth = width * (overlay.scale || 0.38);
    const ratio = sprite.naturalHeight / sprite.naturalWidth;
    const spriteHeight = spriteWidth * ratio;
    const originX = overlay.originX || 0.6;
    const originY = overlay.originY || 0.9;
    ctx.globalAlpha = 0.96;
    ctx.shadowBlur = 20;
    ctx.shadowColor = weapon.currentColor || "#00FFFF";
    ctx.drawImage(sprite, -spriteWidth * originX, -spriteHeight * originY, spriteWidth, spriteHeight);
  } else {
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = "rgba(18, 18, 20, 0.94)";
    ctx.beginPath();
    ctx.moveTo(-width * 0.18, height * 0.16);
    ctx.lineTo(width * 0.18, height * 0.16);
    ctx.lineTo(width * 0.08, -height * 0.14);
    ctx.lineTo(-width * 0.14, -height * 0.04);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "rgba(0, 255, 255, 0.35)";
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  if (weapon.muzzleFlash > 0) {
    const muzzleX = width * (overlay.muzzleX || 0.09);
    const muzzleY = height * (overlay.muzzleY || -0.11);
    const flashReachX = width * (overlay.flashReachX || 0.2);
    const flashReachY = height * (overlay.flashReachY || -0.16);
    const flashRadius = overlay.flashRadius || 20;
    ctx.globalAlpha = weapon.muzzleFlash;
    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = currentWeapon?.flashColor || "rgba(57, 255, 20, 0.95)";
    ctx.beginPath();
    ctx.moveTo(muzzleX - 10, muzzleY - 6);
    ctx.lineTo(flashReachX, flashReachY);
    ctx.lineTo(muzzleX + 2, muzzleY + 24);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.arc(muzzleX, muzzleY, flashRadius + weapon.muzzleFlash * 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";
  }

  ctx.restore();

  if (weapon.muzzleFlash > 0) {
    ctx.save();
    ctx.globalAlpha = weapon.muzzleFlash * 0.08;
    ctx.fillStyle = currentWeapon?.flashColor || "rgba(57, 255, 20, 0.3)";
    ctx.fillRect(0, 0, width, height * 0.56);
    ctx.restore();
  }

  if (player.damageFlash > 0) {
    ctx.save();
    ctx.globalAlpha = player.damageFlash * 0.24;
    ctx.fillStyle = "#FF0055";
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }
}

function drawBossBar(ctx, game) {
  const boss = game.enemies.find((enemy) => enemy.isBoss && !enemy.dead);

  if (!boss) {
    return;
  }

  const width = game.canvas.width * 0.46;
  const height = 16;
  const x = (game.canvas.width - width) / 2;
  const y = 18;
  const ratio = boss.health / boss.maxHealth;

  ctx.save();
  ctx.fillStyle = "rgba(18, 18, 20, 0.85)";
  ctx.fillRect(x, y, width, height);
  ctx.fillStyle = "#39FF14";
  ctx.fillRect(x, y, width * ratio, height);
  ctx.strokeStyle = "rgba(0,255,255,0.6)";
  ctx.strokeRect(x, y, width, height);
  ctx.fillStyle = "#39FF14";
  ctx.font = "12px Segoe UI";
  ctx.textAlign = "center";
  ctx.fillText(boss.label, x + width / 2, y - 4);
  ctx.restore();
}

function drawScreenBlood(ctx, game) {
  const particles = game.effects.filter((effect) => effect.kind === "screen-blood");

  if (!particles.length) {
    return;
  }

  const { canvas } = game;

  ctx.save();
  particles.forEach((particle) => {
    ctx.globalAlpha = Math.min(0.5, particle.life * 0.8);
    ctx.fillStyle = particle.color;
    ctx.fillRect(
      particle.x * canvas.width,
      particle.y * canvas.height,
      particle.size,
      particle.size,
    );
  });
  ctx.restore();
}

function drawMinimap(ctx, game) {
  if (!game.showMinimap) {
    return;
  }

  const { level, player, enemies, pickups, canvas } = game;
  const scale = 10;
  const width = level.map[0].length * scale;
  const height = level.map.length * scale;
  const originX = canvas.width - width - 20;
  const originY = 20;

  ctx.save();
  ctx.globalAlpha = 0.92;
  ctx.fillStyle = "rgba(18, 18, 20, 0.85)";
  ctx.fillRect(originX - 10, originY - 10, width + 20, height + 20);

  for (let y = 0; y < level.map.length; y += 1) {
    for (let x = 0; x < level.map[y].length; x += 1) {
      const cell = level.map[y][x];
      ctx.fillStyle =
        cell === 0 || cell === 4
          ? "rgba(18, 18, 20, 0.95)"
          : cell === 2
            ? "rgba(0, 255, 255, 0.9)"
            : cell === 3
              ? "rgba(57, 255, 20, 0.9)"
              : "rgba(255, 0, 255, 0.9)";
      ctx.fillRect(originX + x * scale, originY + y * scale, scale - 1, scale - 1);
    }
  }

  pickups.forEach((pickup) => {
    if (pickup.collected) {
      return;
    }

    ctx.fillStyle = pickup.color;
    ctx.fillRect(
      originX + pickup.x * scale - 2,
      originY + pickup.y * scale - 2,
      4,
      4,
    );
  });

  enemies.forEach((enemy) => {
    if (enemy.dead) {
      return;
    }

    ctx.fillStyle = enemy.color;
    ctx.beginPath();
    ctx.arc(originX + enemy.x * scale, originY + enemy.y * scale, 3, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.strokeStyle = "#00FFFF";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(originX + player.x * scale, originY + player.y * scale, 4, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(originX + player.x * scale, originY + player.y * scale);
  ctx.lineTo(
    originX + player.x * scale + Math.cos(player.angle) * 10,
    originY + player.y * scale + Math.sin(player.angle) * 10,
  );
  ctx.stroke();
  ctx.restore();
}

export function renderScene(ctx, game) {
  const { canvas, player, level } = game;
  const width = canvas.width;
  const height = canvas.height;

  ctx.clearRect(0, 0, width, height);

  const skyGradient = ctx.createLinearGradient(0, 0, 0, height * 0.6);
  skyGradient.addColorStop(0, "#000000");
  skyGradient.addColorStop(1, "#121214");
  ctx.fillStyle = skyGradient;
  ctx.fillRect(0, 0, width, height * 0.56);

  const floorGradient = ctx.createLinearGradient(0, height * 0.56, 0, height);
  floorGradient.addColorStop(0, "#121214");
  floorGradient.addColorStop(1, "#000000");
  ctx.fillStyle = floorGradient;
  ctx.fillRect(0, height * 0.56, width, height * 0.44);

  drawFloorGrid(ctx, width, height);

  const rayCount = Math.floor(width / 2);
  const sliceWidth = width / rayCount;
  const depthBuffer = new Array(width).fill(MAX_DEPTH);

  for (let index = 0; index < rayCount; index += 1) {
    const rayAngle = player.angle - FOV / 2 + (index / rayCount) * FOV;
    const hit = castRay(level.map, player.x, player.y, rayAngle);
    const correctedDistance = hit.distance * Math.cos(rayAngle - player.angle);
    const wallHeight = Math.min(height, height / Math.max(correctedDistance, 0.12));
    const shade = Math.max(0.16, 1 - correctedDistance / MAX_DEPTH);
    const stripX = index * sliceWidth;
    const stripY = (height - wallHeight) / 2;

    drawWallStrip(ctx, hit, stripX, stripY, sliceWidth + 1, wallHeight, shade);

    const start = Math.floor(stripX);
    const end = Math.min(width, Math.ceil(stripX + sliceWidth + 1));

    for (let x = start; x < end; x += 1) {
      depthBuffer[x] = correctedDistance;
    }
  }

  drawSprites(ctx, game, depthBuffer);
  drawWeaponOverlay(ctx, game);
  drawScreenBlood(ctx, game);
  drawBossBar(ctx, game);
  drawMinimap(ctx, game);

  ctx.strokeStyle = "rgba(0,255,255,0.8)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(width / 2 - 10, height / 2);
  ctx.lineTo(width / 2 + 10, height / 2);
  ctx.moveTo(width / 2, height / 2 - 10);
  ctx.lineTo(width / 2, height / 2 + 10);
  ctx.stroke();
}


