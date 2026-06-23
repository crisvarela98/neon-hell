const DAY_IN_MS = 24 * 60 * 60 * 1000;
const WEEK_IN_MS = 7 * DAY_IN_MS;
const SEASON_TIER_XP = 320;

const WEAPON_CATALOG = [
  {
    id: "repeater",
    name: "Volt Repeater",
    classLabel: "Vanguardia",
    unlockLevel: 1,
    description: "Cadencia alta para abrir cada corrida.",
  },
  {
    id: "shotgun",
    name: "Shard Shotgun",
    classLabel: "Breacher",
    unlockLevel: 2,
    description: "Controla pasillos y limpia oleadas cortas.",
  },
  {
    id: "carbine",
    name: "Rift Carbine",
    classLabel: "Precision",
    unlockLevel: 4,
    description: "Pincha blancos duros a media y larga distancia.",
  },
  {
    id: "hellburst",
    name: "Hellburst",
    classLabel: "Demolicion",
    unlockLevel: 6,
    description: "Explosivo pesado para jefes y grupos densos.",
  },
];

const DAILY_MISSION_POOL = [
  {
    id: "daily-run-save",
    title: "Firma una corrida",
    description: "Guarda 1 partida en el ranking.",
    metric: "runsSaved",
    goal: 1,
    rewardXp: 120,
  },
  {
    id: "daily-kills",
    title: "Limpieza rapida",
    description: "Consigue 24 kills acumuladas.",
    metric: "kills",
    goal: 24,
    rewardXp: 180,
  },
  {
    id: "daily-score",
    title: "Sube el marcador",
    description: "Suma 2200 puntos acumulados.",
    metric: "score",
    goal: 2200,
    rewardXp: 200,
  },
  {
    id: "daily-wave",
    title: "Mantente con vida",
    description: "Alcanza 5 waves acumuladas.",
    metric: "waves",
    goal: 5,
    rewardXp: 160,
  },
  {
    id: "daily-boss",
    title: "Cazador de jefes",
    description: "Derrota 1 jefe.",
    metric: "bossKills",
    goal: 1,
    rewardXp: 220,
  },
];

const WEEKLY_MISSION_POOL = [
  {
    id: "weekly-runs",
    title: "Semana activa",
    description: "Guarda 5 corridas.",
    metric: "runsSaved",
    goal: 5,
    rewardXp: 500,
  },
  {
    id: "weekly-kills",
    title: "Exterminio",
    description: "Consigue 140 kills acumuladas.",
    metric: "kills",
    goal: 140,
    rewardXp: 650,
  },
  {
    id: "weekly-score",
    title: "Pico de score",
    description: "Suma 12000 puntos acumulados.",
    metric: "score",
    goal: 12000,
    rewardXp: 700,
  },
  {
    id: "weekly-waves",
    title: "Ritmo de supervivencia",
    description: "Supera 18 waves acumuladas.",
    metric: "waves",
    goal: 18,
    rewardXp: 560,
  },
];

const LIVE_EVENTS = [
  {
    id: "fracture-rush",
    title: "Fracture Rush",
    description: "Oleadas mas densas y bonus de experiencia.",
    rewardLabel: "+25% XP y +1 pickup por wave",
    gameplay: {
      enemyCountMultiplier: 1.18,
      xpMultiplier: 1.25,
      extraPickupsPerWave: 1,
      preferredMutatorId: "neon-surge",
    },
  },
  {
    id: "ghost-market",
    title: "Ghost Market",
    description: "Mas recursos, armas pesadas antes y carreras de score largas.",
    rewardLabel: "+20% score y arsenal reforzado",
    gameplay: {
      scoreMultiplier: 1.2,
      waveAmmoMultiplier: 1.35,
      preferredMutatorId: "scavenger-protocol",
    },
  },
  {
    id: "black-signal",
    title: "Black Signal",
    description: "Enemigos agresivos y mayor prestigio para cuentas activas.",
    rewardLabel: "Jefes reforzados y +15% XP",
    gameplay: {
      enemySpeedMultiplier: 1.12,
      enemyDamageMultiplier: 1.08,
      xpMultiplier: 1.15,
      preferredMutatorId: "ghost-circuit",
    },
  },
];

const CURRENT_SEASON = {
  id: "black-signal",
  title: "Season // Black Signal",
  subtitle: "Pase, logros, cosmeticos y rewards cooperativas.",
  maxTier: 8,
};

const COSMETIC_LIBRARY = {
  titles: {
    "operador-base": "Operador Base",
    "rookie-of-the-breach": "Rookie of the Breach",
    "boss-breaker": "Boss Breaker",
    "squad-anchor": "Squad Anchor",
    "rift-marshall": "Rift Marshall",
  },
  banners: {
    "breach-black": "Breach Black",
    "boot-bay-sunset": "Boot Bay Sunset",
    "fracture-wave": "Fracture Wave",
    "squad-signal": "Squad Signal",
  },
  emotes: {
    "signal-ping": "Signal Ping",
    "neon-salute": "Neon Salute",
    "boss-down": "Boss Down",
  },
  weaponSkins: {
    "repeater-stock": "Repeater Stock",
    "violet-burn": "Violet Burn",
    "ghost-market": "Ghost Market",
  },
};

const SEASON_PASS_REWARDS = [
  { tier: 1, track: "free", type: "title", id: "rookie-of-the-breach", label: "Titulo Rookie of the Breach" },
  { tier: 2, track: "free", type: "banner", id: "boot-bay-sunset", label: "Banner Boot Bay Sunset" },
  { tier: 3, track: "premium", type: "emote", id: "neon-salute", label: "Emote Neon Salute" },
  { tier: 4, track: "free", type: "weaponSkin", id: "violet-burn", label: "Skin Violet Burn" },
  { tier: 5, track: "premium", type: "title", id: "rift-marshall", label: "Titulo Rift Marshall" },
  { tier: 6, track: "free", type: "banner", id: "fracture-wave", label: "Banner Fracture Wave" },
  { tier: 7, track: "premium", type: "emote", id: "boss-down", label: "Emote Boss Down" },
  { tier: 8, track: "premium", type: "weaponSkin", id: "ghost-market", label: "Skin Ghost Market" },
];

const ACHIEVEMENT_CATALOG = [
  {
    id: "first-run",
    title: "Primer registro",
    description: "Guarda tu primera corrida.",
    goal: 1,
    metric: "runsSaved",
    reward: { type: "banner", id: "breach-black" },
  },
  {
    id: "first-boss",
    title: "Boss breaker",
    description: "Derrota tu primer jefe.",
    goal: 1,
    metric: "bossKills",
    reward: { type: "title", id: "boss-breaker" },
  },
  {
    id: "wave-10",
    title: "Superviviente",
    description: "Llega a la wave 10.",
    goal: 10,
    metric: "wave",
  },
  {
    id: "score-5000",
    title: "Marcador alto",
    description: "Supera 5.000 puntos en una corrida.",
    goal: 5000,
    metric: "score",
  },
  {
    id: "squad-up",
    title: "Squad up",
    description: "Juega una horda cooperativa online.",
    goal: 1,
    metric: "onlineRuns",
    reward: { type: "banner", id: "squad-signal" },
  },
  {
    id: "squad-elite",
    title: "Squad elite",
    description: "Logra 12.000 puntos de equipo en horda.",
    goal: 12000,
    metric: "teamScore",
    reward: { type: "title", id: "squad-anchor" },
  },
  {
    id: "friend-climb",
    title: "Rival social",
    description: "Supera al menos a un amigo en el ranking.",
    goal: 1,
    metric: "surpassedFriends",
    reward: { type: "emote", id: "signal-ping" },
  },
];

const ONBOARDING_BENEFITS = [
  "Crear cuenta desbloquea progreso, armas y mejoras permanentes.",
  "Volver cada dia activa misiones diarias y semanales con XP extra.",
  "Agregar amigos habilita comparacion directa, retos y feed social.",
];

function floorToUtcDay(date) {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function getIsoWeekStart(date) {
  const utcDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = utcDate.getUTCDay() || 7;
  utcDate.setUTCDate(utcDate.getUTCDate() - day + 1);
  utcDate.setUTCHours(0, 0, 0, 0);
  return utcDate.getTime();
}

function hashString(value) {
  return [...String(value)].reduce((accumulator, character, index) => (
    accumulator + character.charCodeAt(0) * (index + 3)
  ), 0);
}

function chooseMissions(pool, amount, seed) {
  const rotation = hashString(seed) % pool.length;
  const selected = [];

  for (let index = 0; index < amount; index += 1) {
    selected.push(pool[(rotation + index) % pool.length]);
  }

  return selected.map((mission) => ({
    ...mission,
    progress: 0,
    completed: false,
    rewardGranted: false,
  }));
}

function sanitizeCollection(values) {
  return [...new Set((Array.isArray(values) ? values : []).filter(Boolean))];
}

function xpRequiredForLevel(level) {
  if (level <= 1) {
    return 0;
  }

  let total = 0;

  for (let currentLevel = 1; currentLevel < level; currentLevel += 1) {
    total += 140 + (currentLevel - 1) * 90;
  }

  return total;
}

function getLevelFromXp(xp) {
  let level = 1;

  while (xp >= xpRequiredForLevel(level + 1)) {
    level += 1;
  }

  return level;
}

function deriveUnlockedWeapons(level) {
  return WEAPON_CATALOG
    .filter((weapon) => level >= weapon.unlockLevel)
    .map((weapon) => weapon.id);
}

function derivePermanentUpgrades(level) {
  return {
    healthTier: level >= 3 ? 1 : 0,
    ammoTier: level >= 4 ? 1 : 0,
    speedTier: level >= 5 ? 1 : 0,
  };
}

function getCurrentLiveEvent(date = new Date()) {
  const eventIndex = Math.floor(floorToUtcDay(date) / WEEK_IN_MS) % LIVE_EVENTS.length;
  return LIVE_EVENTS[Math.abs(eventIndex)];
}

function getSeasonTierFromXp(passXp) {
  return Math.min(CURRENT_SEASON.maxTier, Math.floor(Math.max(0, Number(passXp) || 0) / SEASON_TIER_XP));
}

function getMetricValue(metric, stats) {
  const values = {
    runsSaved: 1,
    kills: Number(stats.kills) || 0,
    score: Number(stats.score) || 0,
    waves: Math.max(1, Number(stats.wave) || 1),
    bossKills: Number(stats.bossKills) || 0,
  };

  return values[metric] || 0;
}

function updateMissionProgress(missionSet, stats, summary) {
  missionSet.forEach((mission) => {
    if (!mission || mission.rewardGranted) {
      return;
    }

    mission.progress = Math.min(
      mission.goal,
      Math.max(0, Number(mission.progress) || 0) + getMetricValue(mission.metric, stats),
    );
    mission.completed = mission.progress >= mission.goal;

    if (mission.completed && !mission.rewardGranted) {
      mission.rewardGranted = true;
      summary.bonusXp += mission.rewardXp;
      summary.completedMissions.push({
        id: mission.id,
        title: mission.title,
        rewardXp: mission.rewardXp,
      });
    }
  });
}

function formatMissionPayload(mission) {
  return {
    id: mission.id,
    title: mission.title,
    description: mission.description,
    progress: Math.max(0, Number(mission.progress) || 0),
    goal: mission.goal,
    rewardXp: mission.rewardXp,
    completed: Boolean(mission.completed),
  };
}

function getCosmeticCollectionKey(type) {
  return type === "weaponSkin" ? "weaponSkins" : `${type}s`;
}

function getCosmeticLabel(type, id) {
  if (!id) {
    return "";
  }

  return COSMETIC_LIBRARY[getCosmeticCollectionKey(type)]?.[id] || id;
}

function grantCosmetic(user, reward) {
  if (!reward?.type || !reward?.id) {
    return null;
  }

  if (!user.cosmetics) {
    user.cosmetics = {};
  }

  if (!user.cosmetics.inventory) {
    user.cosmetics.inventory = {
      titles: [],
      banners: [],
      emotes: [],
      weaponSkins: [],
    };
  }

  if (!user.cosmetics.equipped) {
    user.cosmetics.equipped = {};
  }

  const inventoryKey = getCosmeticCollectionKey(reward.type);
  const current = sanitizeCollection(user.cosmetics.inventory[inventoryKey]);

  if (current.includes(reward.id)) {
    return null;
  }

  user.cosmetics.inventory[inventoryKey] = [...current, reward.id];
  const equippedKey = reward.type === "weaponSkin" ? "weaponSkin" : reward.type;

  if (!user.cosmetics.equipped[equippedKey]) {
    user.cosmetics.equipped[equippedKey] = reward.id;
  }

  return {
    type: reward.type,
    id: reward.id,
    label: getCosmeticLabel(reward.type, reward.id),
  };
}

function getAchievementState(user, achievementId) {
  const entries = Array.isArray(user.achievements) ? user.achievements : [];
  const existing = entries.find((entry) => entry.id === achievementId);

  if (existing) {
    return existing;
  }

  const created = {
    id: achievementId,
    progress: 0,
    unlockedAt: null,
  };

  user.achievements = [...entries, created];
  return user.achievements[user.achievements.length - 1];
}

function setAchievementProgress(user, achievement, progress, now = new Date()) {
  const state = getAchievementState(user, achievement.id);
  const nextProgress = Math.max(Number(state.progress) || 0, Math.max(0, Number(progress) || 0));
  state.progress = Math.min(achievement.goal, nextProgress);

  if (state.unlockedAt || state.progress < achievement.goal) {
    return null;
  }

  state.unlockedAt = now;

  return {
    id: achievement.id,
    title: achievement.title,
    description: achievement.description,
    reward: achievement.reward
      ? {
          type: achievement.reward.type,
          id: achievement.reward.id,
          label: getCosmeticLabel(achievement.reward.type, achievement.reward.id),
        }
      : null,
  };
}

function formatRewardLabel(reward) {
  return reward.label || `${reward.type} ${reward.id}`;
}

function grantSeasonRewards(user, previousTier, nextTier) {
  const claimedRewardIds = new Set(user.seasonState?.claimedRewardIds || []);
  const unlockedRewards = [];
  const newCosmetics = [];
  const premiumOwned = Boolean(user.seasonState?.premiumOwned);

  SEASON_PASS_REWARDS
    .filter((reward) => reward.tier > previousTier && reward.tier <= nextTier)
    .forEach((reward) => {
      if (reward.track === "premium" && !premiumOwned) {
        return;
      }

      const rewardKey = `season:${CURRENT_SEASON.id}:${reward.track}:${reward.tier}:${reward.id}`;

      if (claimedRewardIds.has(rewardKey)) {
        return;
      }

      claimedRewardIds.add(rewardKey);
      unlockedRewards.push({
        tier: reward.tier,
        track: reward.track,
        type: reward.type,
        id: reward.id,
        label: formatRewardLabel(reward),
      });

      const cosmetic = grantCosmetic(user, reward);

      if (cosmetic) {
        newCosmetics.push(cosmetic);
      }
    });

  user.seasonState.claimedRewardIds = [...claimedRewardIds];

  return {
    unlockedRewards,
    newCosmetics,
  };
}

function ensureUserProgression(user, now = new Date()) {
  if (!user.progression) {
    user.progression = {};
  }

  if (typeof user.progression.xp !== "number") {
    user.progression.xp = 0;
  }

  if (!user.missionState) {
    user.missionState = {};
  }

  const dailyKey = new Date(floorToUtcDay(now)).toISOString().slice(0, 10);
  const weeklyKey = new Date(getIsoWeekStart(now)).toISOString().slice(0, 10);

  if (user.missionState.dailyKey !== dailyKey || !Array.isArray(user.missionState.daily)) {
    user.missionState.dailyKey = dailyKey;
    user.missionState.daily = chooseMissions(DAILY_MISSION_POOL, 3, `${user.username}-${dailyKey}`);
  }

  if (user.missionState.weeklyKey !== weeklyKey || !Array.isArray(user.missionState.weekly)) {
    user.missionState.weeklyKey = weeklyKey;
    user.missionState.weekly = chooseMissions(WEEKLY_MISSION_POOL, 2, `${user.username}-${weeklyKey}`);
  }

  const resolvedLevel = getLevelFromXp(user.progression.xp);
  user.progression.level = resolvedLevel;
  user.progression.unlockedWeapons = deriveUnlockedWeapons(resolvedLevel);
  user.progression.permanentUpgrades = derivePermanentUpgrades(resolvedLevel);

  if (!user.onboarding) {
    user.onboarding = {};
  }

  if (typeof user.onboarding.firstRunCompleted !== "boolean") {
    user.onboarding.firstRunCompleted = false;
  }

  if (!user.seasonState) {
    user.seasonState = {};
  }

  user.seasonState.currentSeasonId = CURRENT_SEASON.id;

  if (typeof user.seasonState.passXp !== "number") {
    user.seasonState.passXp = 0;
  }

  user.seasonState.passTier = getSeasonTierFromXp(user.seasonState.passXp);
  user.seasonState.claimedRewardIds = sanitizeCollection(user.seasonState.claimedRewardIds);

  if (typeof user.seasonState.seasonTokens !== "number") {
    user.seasonState.seasonTokens = 0;
  }

  if (typeof user.seasonState.premiumOwned !== "boolean") {
    user.seasonState.premiumOwned = false;
  }

  if (!user.wallet) {
    user.wallet = {};
  }

  if (typeof user.wallet.softCurrency !== "number") {
    user.wallet.softCurrency = 500;
  }

  if (typeof user.wallet.lifetimeSoftCurrency !== "number") {
    user.wallet.lifetimeSoftCurrency = user.wallet.softCurrency;
  }

  if (!Array.isArray(user.achievements)) {
    user.achievements = [];
  }

  ACHIEVEMENT_CATALOG.forEach((achievement) => {
    getAchievementState(user, achievement.id);
  });

  if (!user.cosmetics) {
    user.cosmetics = {};
  }

  if (!user.cosmetics.inventory) {
    user.cosmetics.inventory = {};
  }

  user.cosmetics.inventory.titles = sanitizeCollection(user.cosmetics.inventory.titles);
  user.cosmetics.inventory.banners = sanitizeCollection(user.cosmetics.inventory.banners);
  user.cosmetics.inventory.emotes = sanitizeCollection(user.cosmetics.inventory.emotes);
  user.cosmetics.inventory.weaponSkins = sanitizeCollection(user.cosmetics.inventory.weaponSkins);

  if (!user.cosmetics.inventory.titles.length) {
    user.cosmetics.inventory.titles = ["operador-base"];
  }

  if (!user.cosmetics.inventory.banners.length) {
    user.cosmetics.inventory.banners = ["breach-black"];
  }

  if (!user.cosmetics.inventory.emotes.length) {
    user.cosmetics.inventory.emotes = ["signal-ping"];
  }

  if (!user.cosmetics.inventory.weaponSkins.length) {
    user.cosmetics.inventory.weaponSkins = ["repeater-stock"];
  }

  if (!user.cosmetics.equipped) {
    user.cosmetics.equipped = {};
  }

  user.cosmetics.equipped.title = user.cosmetics.equipped.title || user.cosmetics.inventory.titles[0];
  user.cosmetics.equipped.banner = user.cosmetics.equipped.banner || user.cosmetics.inventory.banners[0];
  user.cosmetics.equipped.emote = user.cosmetics.equipped.emote || user.cosmetics.inventory.emotes[0];
  user.cosmetics.equipped.weaponSkin = user.cosmetics.equipped.weaponSkin || user.cosmetics.inventory.weaponSkins[0];

  if (!user.squadStats) {
    user.squadStats = {};
  }

  if (typeof user.squadStats.hordeRuns !== "number") {
    user.squadStats.hordeRuns = 0;
  }

  if (typeof user.squadStats.bestSquadScore !== "number") {
    user.squadStats.bestSquadScore = 0;
  }

  if (typeof user.squadStats.lastSquadName !== "string") {
    user.squadStats.lastSquadName = "";
  }

  if (typeof user.squadStats.rewardsClaimed !== "number") {
    user.squadStats.rewardsClaimed = 0;
  }

  return user;
}

function applyRunProgress(user, stats, now = new Date()) {
  ensureUserProgression(user, now);

  const liveEvent = getCurrentLiveEvent(now);
  const previousLevel = user.progression.level || 1;
  const previousTier = user.seasonState.passTier || 0;
  const previousUnlocks = new Set(user.progression.unlockedWeapons || []);
  const isSquadHorde = Boolean(stats.onlineMode) && String(stats.playlistId || "") === "squad-horde";
  const xpBase =
    Math.round((Number(stats.score) || 0) / 18) +
    (Number(stats.kills) || 0) * 8 +
    Math.max(1, Number(stats.wave) || 1) * 36 +
    (Number(stats.bossKills) || 0) * 120;
  const squadBonusXp = isSquadHorde
    ? 140 + Math.round(Math.max(0, Number(stats.teamScore) || 0) / 180)
    : 0;
  const xpMultiplier = Number(liveEvent.gameplay?.xpMultiplier) || 1;
  const seasonXpGain =
    Math.round((Number(stats.score) || 0) / 26) +
    Math.max(1, Number(stats.wave) || 1) * 24 +
    (Number(stats.bossKills) || 0) * 100 +
    (isSquadHorde ? 180 : 0);
  const seasonTokensGain = isSquadHorde
    ? Math.max(1, Math.round(Math.max(0, Number(stats.teamScore) || 0) / 3000))
    : 0;
  const summary = {
    xpGain: Math.round(xpBase * xpMultiplier) + squadBonusXp,
    squadBonusXp,
    bonusXp: 0,
    seasonXpGain,
    seasonTokensGain,
    completedMissions: [],
    unlockedAchievements: [],
    unlockedSeasonRewards: [],
    newCosmetics: [],
  };

  updateMissionProgress(user.missionState.daily, stats, summary);
  updateMissionProgress(user.missionState.weekly, stats, summary);

  user.progression.xp += summary.xpGain + summary.bonusXp;
  user.seasonState.passXp += seasonXpGain;
  user.seasonState.seasonTokens += seasonTokensGain;
  ensureUserProgression(user, now);
  user.onboarding.firstRunCompleted = true;

  if (isSquadHorde) {
    user.squadStats.hordeRuns += 1;
    user.squadStats.bestSquadScore = Math.max(
      user.squadStats.bestSquadScore,
      Math.max(0, Number(stats.teamScore) || 0),
    );
    user.squadStats.lastSquadName = String(stats.squadName || "").trim().slice(0, 32);
    user.squadStats.rewardsClaimed += seasonTokensGain;
  }

  const grantedSeasonRewards = grantSeasonRewards(user, previousTier, user.seasonState.passTier);
  summary.unlockedSeasonRewards = grantedSeasonRewards.unlockedRewards;
  summary.newCosmetics.push(...grantedSeasonRewards.newCosmetics);

  const achievementMetrics = {
    runsSaved: 1,
    bossKills: Number(stats.bossKills) || 0,
    wave: Math.max(1, Number(stats.wave) || 1),
    score: Number(stats.score) || 0,
    onlineRuns: isSquadHorde ? 1 : 0,
    teamScore: Number(stats.teamScore) || 0,
    surpassedFriends: Number(stats.surpassedFriends) || 0,
  };

  ACHIEVEMENT_CATALOG.forEach((achievement) => {
    const unlocked = setAchievementProgress(
      user,
      achievement,
      achievementMetrics[achievement.metric] || 0,
      now,
    );

    if (!unlocked) {
      return;
    }

    summary.unlockedAchievements.push(unlocked);
    const cosmetic = grantCosmetic(user, achievement.reward);

    if (cosmetic) {
      summary.newCosmetics.push(cosmetic);
    }
  });

  const currentUnlocks = new Set(user.progression.unlockedWeapons || []);
  const newlyUnlockedWeapons = [...currentUnlocks].filter((weaponId) => !previousUnlocks.has(weaponId));

  return {
    ...summary,
    levelUp: user.progression.level > previousLevel,
    newLevel: user.progression.level,
    seasonTierUp: user.seasonState.passTier > previousTier,
    newSeasonTier: user.seasonState.passTier,
    newlyUnlockedWeapons: WEAPON_CATALOG.filter((weapon) => newlyUnlockedWeapons.includes(weapon.id)),
    liveEvent,
  };
}

function buildProgressionPayload(user, now = new Date()) {
  ensureUserProgression(user, now);
  const level = user.progression.level || 1;
  const currentLevelXp = xpRequiredForLevel(level);
  const nextLevelXp = xpRequiredForLevel(level + 1);
  const liveEvent = getCurrentLiveEvent(now);
  const seasonTier = user.seasonState.passTier || 0;
  const currentTierXp = seasonTier * SEASON_TIER_XP;
  const nextTierXp = Math.min(CURRENT_SEASON.maxTier * SEASON_TIER_XP, (seasonTier + 1) * SEASON_TIER_XP);

  return {
    xp: user.progression.xp,
    level,
    currentLevelXp,
    nextLevelXp,
    progressPercent: nextLevelXp > currentLevelXp
      ? Math.round(((user.progression.xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100)
      : 100,
    unlockedWeapons: WEAPON_CATALOG.map((weapon) => ({
      ...weapon,
      unlocked: (user.progression.unlockedWeapons || []).includes(weapon.id),
    })),
    permanentUpgrades: user.progression.permanentUpgrades,
    dailyMissions: (user.missionState.daily || []).map(formatMissionPayload),
    weeklyMissions: (user.missionState.weekly || []).map(formatMissionPayload),
    seasonPass: {
      seasonId: CURRENT_SEASON.id,
      title: CURRENT_SEASON.title,
      subtitle: CURRENT_SEASON.subtitle,
      tier: seasonTier,
      maxTier: CURRENT_SEASON.maxTier,
      passXp: user.seasonState.passXp,
      currentTierXp,
      nextTierXp,
      progressPercent: nextTierXp > currentTierXp
        ? Math.round(((user.seasonState.passXp - currentTierXp) / (nextTierXp - currentTierXp)) * 100)
        : 100,
      tokens: user.seasonState.seasonTokens,
      premiumOwned: Boolean(user.seasonState.premiumOwned),
      rewards: SEASON_PASS_REWARDS.map((reward) => ({
        tier: reward.tier,
        track: reward.track,
        label: formatRewardLabel(reward),
        unlocked: seasonTier >= reward.tier && (reward.track === "free" || Boolean(user.seasonState.premiumOwned)),
      })),
    },
    achievements: ACHIEVEMENT_CATALOG.map((achievement) => {
      const state = getAchievementState(user, achievement.id);

      return {
        id: achievement.id,
        title: achievement.title,
        description: achievement.description,
        goal: achievement.goal,
        progress: Math.min(achievement.goal, Math.max(0, Number(state.progress) || 0)),
        unlocked: Boolean(state.unlockedAt),
        unlockedAt: state.unlockedAt,
        rewardLabel: achievement.reward
          ? getCosmeticLabel(achievement.reward.type, achievement.reward.id)
          : "",
      };
    }),
    cosmetics: {
      equipped: {
        title: getCosmeticLabel("title", user.cosmetics.equipped.title),
        banner: getCosmeticLabel("banner", user.cosmetics.equipped.banner),
        emote: getCosmeticLabel("emote", user.cosmetics.equipped.emote),
        weaponSkin: getCosmeticLabel("weaponSkin", user.cosmetics.equipped.weaponSkin),
      },
      counts: {
        titles: user.cosmetics.inventory.titles.length,
        banners: user.cosmetics.inventory.banners.length,
        emotes: user.cosmetics.inventory.emotes.length,
        weaponSkins: user.cosmetics.inventory.weaponSkins.length,
      },
      highlights: {
        titles: user.cosmetics.inventory.titles.slice(-3).map((id) => getCosmeticLabel("title", id)),
        banners: user.cosmetics.inventory.banners.slice(-3).map((id) => getCosmeticLabel("banner", id)),
        emotes: user.cosmetics.inventory.emotes.slice(-3).map((id) => getCosmeticLabel("emote", id)),
        weaponSkins: user.cosmetics.inventory.weaponSkins.slice(-3).map((id) => getCosmeticLabel("weaponSkin", id)),
      },
    },
    squad: {
      hordeRuns: user.squadStats.hordeRuns,
      bestSquadScore: user.squadStats.bestSquadScore,
      lastSquadName: user.squadStats.lastSquadName,
      rewardsClaimed: user.squadStats.rewardsClaimed,
    },
    liveEvent: {
      id: liveEvent.id,
      title: liveEvent.title,
      description: liveEvent.description,
      rewardLabel: liveEvent.rewardLabel,
      gameplay: liveEvent.gameplay,
    },
    onboarding: {
      firstRunCompleted: Boolean(user.onboarding?.firstRunCompleted),
      benefits: ONBOARDING_BENEFITS,
      quickStart: [
        "Completa Boot Bay para aprender el loop base en menos de un minuto.",
        "Guarda tu score para sumar XP, avanzar el pase y desbloquear cosmeticos.",
        "Entra a squad horde para ganar tokens, rewards de equipo y ranking por escuadron.",
      ],
      returnReasons: [
        "Misiones diarias y semanales para empujar progreso real.",
        "Pase de temporada con banners, skins, titulos y emotes.",
        "Retos con amigos, logros y leaderboard de squad para medir mejora.",
      ],
    },
  };
}

module.exports = {
  CURRENT_SEASON,
  WEAPON_CATALOG,
  LIVE_EVENTS,
  getCurrentLiveEvent,
  ensureUserProgression,
  applyRunProgress,
  buildProgressionPayload,
};
