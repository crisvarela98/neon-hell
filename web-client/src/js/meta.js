export const RUN_MUTATORS = [
  {
    id: "neon-surge",
    title: "Neon Surge",
    description: "Mas enemigos por wave y pickups extras.",
    modifiers: {
      enemyCountMultiplier: 1.18,
      extraPickupsPerWave: 1,
    },
  },
  {
    id: "ghost-circuit",
    title: "Ghost Circuit",
    description: "Disparas mas rapido, pero los enemigos castigan mas.",
    modifiers: {
      fireRateMultiplier: 0.9,
      enemyDamageMultiplier: 1.08,
      playerSpeedMultiplier: 1.05,
    },
  },
  {
    id: "iron-core",
    title: "Iron Core",
    description: "Jefes mas duros y score extra por sostener la corrida.",
    modifiers: {
      enemyHealthMultiplier: 1.14,
      bossHealthMultiplier: 1.28,
      scoreMultiplier: 1.15,
    },
  },
  {
    id: "scavenger-protocol",
    title: "Scavenger Protocol",
    description: "Municion y arsenal reforzados para runs largas.",
    modifiers: {
      waveAmmoMultiplier: 1.35,
      pickupAmmoMultiplier: 1.4,
    },
  },
];

export function getMutatorById(mutatorId) {
  return RUN_MUTATORS.find((mutator) => mutator.id === mutatorId) || RUN_MUTATORS[0];
}

export function chooseRunMutator(level, liveEvent) {
  const preferredMutatorId = liveEvent?.gameplay?.preferredMutatorId;

  if (preferredMutatorId) {
    return getMutatorById(preferredMutatorId);
  }

  const pools = level?.mutatorPool || RUN_MUTATORS.map((mutator) => mutator.id);
  const index = Math.abs((level?.name || "").length + (level?.id || "").length) % pools.length;
  return getMutatorById(pools[index]);
}

export function getLiveEventFallback() {
  return {
    id: "guest-preview",
    title: "Cuenta recomendada",
    description: "Crea cuenta para activar eventos temporales, retos y progreso persistente.",
    rewardLabel: "Misiones diarias, armas y ranking social",
    gameplay: {
      preferredMutatorId: "neon-surge",
    },
  };
}
