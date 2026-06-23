function validateScoreIntegrity(stats) {
  const score = Math.max(0, Number(stats.score) || 0);
  const kills = Math.max(0, Number(stats.kills) || 0);
  const wave = Math.max(1, Number(stats.wave) || 1);
  const timeSurvived = Math.max(0, Number(stats.timeSurvived) || 0);
  const bossKills = Math.max(0, Number(stats.bossKills) || 0);
  const issues = [];

  if (timeSurvived < 5 && score > 1200) {
    issues.push("score demasiado alto para el tiempo jugado");
  }

  if (kills > timeSurvived * 4 + 20) {
    issues.push("kills demasiado altas para la duracion");
  }

  if (wave > Math.floor(timeSurvived / 8) + 4) {
    issues.push("wave demasiado alta para la duracion");
  }

  if (bossKills > Math.ceil(wave / 3) + 1) {
    issues.push("boss kills inconsistentes con la wave");
  }

  if (score > kills * 650 + wave * 1800 + bossKills * 3500 + 2500) {
    issues.push("score fuera del rango esperado");
  }

  return {
    ok: issues.length === 0,
    issues,
  };
}

module.exports = {
  validateScoreIntegrity,
};
