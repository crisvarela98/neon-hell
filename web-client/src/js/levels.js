const trainingMap = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 2, 0, 0, 0, 4, 0, 1],
  [1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1],
  [1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1],
  [1, 2, 0, 1, 1, 3, 1, 1, 0, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1],
  [1, 0, 1, 1, 0, 2, 0, 1, 0, 0, 4, 1],
  [1, 0, 0, 1, 0, 0, 0, 1, 1, 0, 0, 1],
  [1, 4, 0, 0, 0, 1, 0, 0, 0, 0, 2, 1],
  [1, 0, 0, 1, 0, 0, 0, 1, 4, 0, 0, 1],
  [1, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

const sector13Map = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 4, 0, 0, 1],
  [1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1],
  [1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 2, 0, 0, 1, 0, 1],
  [1, 0, 4, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1],
  [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
  [1, 2, 1, 1, 0, 1, 1, 1, 1, 0, 1, 0, 1, 1, 0, 1],
  [1, 0, 0, 1, 0, 0, 0, 3, 1, 0, 0, 0, 4, 1, 0, 1],
  [1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 2, 0, 0, 0, 1, 0, 0, 0, 0, 1],
  [1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 0, 1],
  [1, 0, 0, 0, 1, 0, 0, 0, 4, 0, 0, 1, 0, 1, 0, 1],
  [1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1],
  [1, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

const breachCoreMap = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 2, 0, 0, 0, 4, 0, 0, 0, 2, 0, 0, 1],
  [1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1],
  [1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 1],
  [1, 0, 1, 0, 4, 0, 1, 0, 3, 0, 1, 0, 4, 1, 0, 1],
  [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 0, 1],
  [1, 0, 0, 0, 1, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1],
  [1, 0, 4, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1],
  [1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1],
  [1, 0, 1, 0, 0, 0, 2, 0, 0, 1, 0, 1, 0, 1, 0, 1],
  [1, 0, 1, 0, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1],
  [1, 0, 0, 0, 1, 0, 4, 0, 0, 0, 0, 1, 0, 0, 0, 1],
  [1, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

const glassHarborMap = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 2, 0, 0, 4, 0, 0, 0, 2, 0, 0, 1],
  [1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 1, 1, 0, 1],
  [1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 1],
  [1, 4, 1, 0, 1, 0, 1, 0, 3, 0, 1, 0, 4, 1, 0, 1],
  [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1],
  [1, 0, 1, 1, 1, 0, 1, 2, 1, 1, 1, 0, 1, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 1, 1, 0, 1],
  [1, 0, 2, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 2, 0, 1],
  [1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 0, 1],
  [1, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1],
  [1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 4, 1, 1, 1, 0, 1],
  [1, 0, 0, 0, 1, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

const nullCathedralMap = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 2, 0, 0, 4, 0, 0, 0, 2, 0, 0, 0, 1],
  [1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1],
  [1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 1],
  [1, 4, 1, 0, 1, 0, 1, 0, 3, 0, 1, 0, 1, 1, 4, 1],
  [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1],
  [1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1],
  [1, 0, 0, 0, 0, 2, 1, 0, 0, 0, 1, 0, 0, 2, 0, 1],
  [1, 1, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 1, 1, 0, 1],
  [1, 0, 2, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 2, 0, 1],
  [1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 0, 1],
  [1, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1],
  [1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 4, 1, 1, 1, 0, 1],
  [1, 0, 0, 0, 1, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

function cloneMap(map) {
  return map.map((row) => [...row]);
}

function getSpawnPoints(map) {
  const spawnPoints = [];

  map.forEach((row, y) => {
    row.forEach((cell, x) => {
      if (cell === 4) {
        spawnPoints.push({ x: x + 0.5, y: y + 0.5 });
      }
    });
  });

  return spawnPoints;
}

function createLevel({
  id,
  name,
  biome,
  biomeLabel,
  mapTemplate,
  playerStart,
  pickups,
  waveRewardAmmo,
  waveRewardHealth,
  wavesUntilAdvance,
  art,
  bossId,
  mutatorPool,
  briefingTitle,
  briefingText,
  objectives,
}) {
  const map = cloneMap(mapTemplate);

  return {
    id,
    name,
    biome,
    biomeLabel,
    map,
    playerStart,
    spawnPoints: getSpawnPoints(map),
    pickups,
    waveRewardAmmo,
    waveRewardHealth,
    wavesUntilAdvance,
    art,
    bossId: bossId || "archon",
    mutatorPool: mutatorPool || [],
    briefingTitle,
    briefingText,
    objectives,
  };
}

export function getLevelSequence() {
  return [
    createLevel({
      id: "training-bay",
      name: "MISION 01 // BOOT BAY",
      biome: "docklands",
      biomeLabel: "Docklands industrial",
      mapTemplate: trainingMap,
      playerStart: { x: 1.5, y: 1.5, angle: 0.1 },
      pickups: [
        { type: "ammo", x: 4.5, y: 1.5 },
        { type: "health", x: 2.5, y: 8.5 },
        { type: "arsenal", x: 9.5, y: 10.5 },
      ],
      waveRewardAmmo: 18,
      waveRewardHealth: 20,
      wavesUntilAdvance: 1,
      art: "/assets/images/menu-bg.png",
      mutatorPool: ["neon-surge", "scavenger-protocol"],
      briefingTitle: "MISION 01 // BOOT BAY",
      briefingText:
        "Primer contacto con la brecha. Boot Bay es una bahia de acceso tomada por codigo vivo: entra, limpia la zona y abre el camino hacia el Sector 13.",
      objectives: [
        "Elimina la primera oleada de entidades corruptas.",
        "Recoge municion, medkit y arsenal para preparar el descenso.",
        "Abre una puerta neon con E o USE para asegurar la ruta.",
      ],
    }),
    createLevel({
      id: "sector13",
      name: "MISION 02 // SECTOR 13",
      biome: "quarantine-corridor",
      biomeLabel: "Quarantine corridor",
      mapTemplate: sector13Map,
      playerStart: { x: 1.5, y: 1.5, angle: 0.14 },
      pickups: [
        { type: "ammo", x: 5.5, y: 1.5 },
        { type: "health", x: 10.5, y: 3.5 },
        { type: "ammo", x: 7.5, y: 5.5 },
        { type: "overcharge", x: 13.5, y: 9.5 },
        { type: "health", x: 8.5, y: 13.5 },
      ],
      waveRewardAmmo: 14,
      waveRewardHealth: 16,
      wavesUntilAdvance: 2,
      art: "/assets/images/menu-bg.png",
      mutatorPool: ["ghost-circuit", "neon-surge"],
      briefingTitle: "MISION 02 // CORREDOR DE ACCESO",
      briefingText:
        "La megacorporacion Vanta-Kei cerro el distrito con compuertas de cuarentena. Tu entrada es un corredor industrial saturado de glitches, drones y carne reescrita por la brecha.",
      objectives: [
        "Aguanta dos oleadas para asegurar el corredor.",
        "Abre puertas neon y recolecta energia antes de bajar.",
        "Mantente con vida para alcanzar el nucleo de brecha.",
      ],
    }),
    createLevel({
      id: "breach-core",
      name: "MISION 03 // BREACH CORE",
      biome: "reactor-depths",
      biomeLabel: "Reactor depths",
      mapTemplate: breachCoreMap,
      playerStart: { x: 1.5, y: 13.5, angle: -0.15 },
      pickups: [
        { type: "ammo", x: 4.5, y: 1.5 },
        { type: "health", x: 13.5, y: 1.5 },
        { type: "overcharge", x: 8.5, y: 6.5 },
        { type: "ammo", x: 2.5, y: 8.5 },
        { type: "health", x: 6.5, y: 12.5 },
      ],
      waveRewardAmmo: 18,
      waveRewardHealth: 20,
      wavesUntilAdvance: 2,
      art: "/assets/images/breach-core-bg.png",
      bossId: "archon",
      mutatorPool: ["iron-core", "ghost-circuit"],
      briefingTitle: "MISION 03 // CAMARA DE FRACTURA",
      briefingText:
        "El reactor ya no obedece a ninguna fisica conocida. La IA ARCHON PRIME usa el nucleo como puerta ritual y fabrica criaturas de codigo vivo. Aqui no hay extraccion: solo cierre total.",
      objectives: [
        "Resiste la presion del reactor y conserva recursos.",
        "Derriba a ARCHON PRIME en las waves de jefe.",
        "Corta la expansion de la brecha antes de caer.",
      ],
    }),
    createLevel({
      id: "glass-harbor",
      name: "MISION 04 // GLASS HARBOR",
      biome: "glass-harbor",
      biomeLabel: "Flooded skyline port",
      mapTemplate: glassHarborMap,
      playerStart: { x: 1.5, y: 1.5, angle: 0.08 },
      pickups: [
        { type: "ammo", x: 4.5, y: 1.5 },
        { type: "health", x: 9.5, y: 9.5 },
        { type: "arsenal", x: 7.5, y: 13.5 },
        { type: "overcharge", x: 12.5, y: 1.5 },
      ],
      waveRewardAmmo: 22,
      waveRewardHealth: 18,
      wavesUntilAdvance: 2,
      art: "/assets/images/menu-hero-v2.png",
      bossId: "warden",
      mutatorPool: ["scavenger-protocol", "neon-surge"],
      briefingTitle: "MISION 04 // GLASS HARBOR",
      briefingText:
        "Las pasarelas del puerto quedaron inundadas de reflejos y trafico fantasma. Aqui la brecha fabrica emboscadas rapidas y un supervisor llamado MIRAGE WARDEN patrulla los accesos.",
      objectives: [
        "Recorre plataformas mojadas y limpia dos oleadas reforzadas.",
        "Gestiona lineas de vision largas con Precision o Demolicion.",
        "Cierra el puerto antes de que la ciudad reflejada cruce completa.",
      ],
    }),
    createLevel({
      id: "null-cathedral",
      name: "MISION 05 // NULL CATHEDRAL",
      biome: "null-cathedral",
      biomeLabel: "Ritual datacrypt",
      mapTemplate: nullCathedralMap,
      playerStart: { x: 1.5, y: 13.5, angle: -0.12 },
      pickups: [
        { type: "health", x: 4.5, y: 1.5 },
        { type: "ammo", x: 11.5, y: 1.5 },
        { type: "overcharge", x: 5.5, y: 7.5 },
        { type: "arsenal", x: 7.5, y: 13.5 },
      ],
      waveRewardAmmo: 24,
      waveRewardHealth: 22,
      wavesUntilAdvance: 999,
      art: "/assets/images/archon-prime.png",
      bossId: "seraph",
      mutatorPool: ["iron-core", "ghost-circuit"],
      briefingTitle: "MISION 05 // NULL CATHEDRAL",
      briefingText:
        "El ultimo santuario de la brecha mezcla liturgia digital y armaduras vivas. Si NULL SERAPH sigue emitiendo, el cierre de la ciudad entera se vuelve imposible.",
      objectives: [
        "Sostiene el push final con recursos limitados y jefes rotativos.",
        "Resiste las oleadas del datacrypt sin perder movilidad.",
        "Cierra el santuario y completa la primera temporada de historia.",
      ],
    }),
  ];
}

export function getMissionBriefs() {
  return getLevelSequence().map((level, index) => ({
    id: level.id,
    label: `Mision ${String(index + 1).padStart(2, "0")}`,
    title: level.briefingTitle,
    body: level.briefingText,
    art: level.art,
    objectives: level.objectives,
  }));
}
