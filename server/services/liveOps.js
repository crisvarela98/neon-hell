const AdminConfig = require("../models/AdminConfig");

const DEFAULT_COOP_MISSIONS = [
  {
    id: "revive-chain",
    title: "Cadena de rescate",
    description: "Mantener al squad vivo y recuperar operadores caidos.",
    rewardLabel: "+120 XP squad",
  },
  {
    id: "zone-cleanse",
    title: "Limpieza de zona",
    description: "Controlar sectores corruptos durante la horda.",
    rewardLabel: "+1 token si superan wave 6",
  },
  {
    id: "boss-phase-break",
    title: "Romper fase de jefe",
    description: "Coordinar dano para cortar fases reforzadas.",
    rewardLabel: "+cosmetico destacado semanal",
  },
];

const DEFAULT_SEASON = {
  id: "black-signal",
  title: "Black Signal",
  status: "active",
  resetPolicy: "ranking seasonal, cosmetics legacy",
  startedAt: "2026-06-01",
  endsAt: "2026-08-31",
};

async function getConfigValue(key, fallback) {
  const config = await AdminConfig.findOne({ key }).lean();
  return config?.value || fallback;
}

async function setConfigValue(key, value, updatedBy = "admin") {
  return AdminConfig.findOneAndUpdate(
    { key },
    { $set: { value, updatedBy } },
    { upsert: true, new: true },
  );
}

async function buildLiveOpsDashboard() {
  const [coopMissions, season] = await Promise.all([
    getConfigValue("coopMissions", DEFAULT_COOP_MISSIONS),
    getConfigValue("currentSeason", DEFAULT_SEASON),
  ]);

  return {
    coopMissions,
    season,
    adminEditable: ["coopMissions", "currentSeason", "storeRotation", "liveEvents"],
  };
}

module.exports = {
  DEFAULT_COOP_MISSIONS,
  DEFAULT_SEASON,
  buildLiveOpsDashboard,
  setConfigValue,
};
