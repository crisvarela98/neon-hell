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
  mapTemplate,
  playerStart,
  pickups,
  waveRewardAmmo,
  waveRewardHealth,
  wavesUntilAdvance,
  art,
  briefingTitle,
  briefingText,
  objectives,
}) {
  const map = cloneMap(mapTemplate);

  return {
    id,
    name,
    map,
    playerStart,
    spawnPoints: getSpawnPoints(map),
    pickups,
    waveRewardAmmo,
    waveRewardHealth,
    wavesUntilAdvance,
    art,
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
      briefingTitle: "MISION 01 // ARRANQUE DE OPERADOR",
      briefingText:
        "Primer contacto con la brecha. El objetivo es aprender movimiento, disparo, cambio de arma y uso de puertas antes de bajar al corredor real.",
      objectives: [
        "Elimina una oleada corta para confirmar armas y punteria.",
        "Recoge municion, medkit y arsenal antes de avanzar.",
        "Usa una puerta neon con E o USE para probar interaccion.",
      ],
    }),
    createLevel({
      id: "sector13",
      name: "MISION 02 // SECTOR 13",
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
      wavesUntilAdvance: 999,
      art: "/assets/images/breach-core-bg.png",
      briefingTitle: "MISION 03 // CAMARA DE FRACTURA",
      briefingText:
        "El reactor ya no obedece a ninguna fisica conocida. La IA ARCHON PRIME usa el nucleo como puerta ritual y fabrica criaturas de codigo vivo. Aqui no hay extraccion: solo cierre total.",
      objectives: [
        "Resiste la presion del reactor y conserva recursos.",
        "Derriba a ARCHON PRIME en las waves de jefe.",
        "Corta la expansion de la brecha antes de caer.",
      ],
    }),
  ];
}

export function getMissionBriefs() {
  return getLevelSequence().slice(0, 3).map((level, index) => ({
    id: level.id,
    label: `Mision ${index + 1}`,
    title: level.briefingTitle,
    body: level.briefingText,
    objectives: level.objectives,
  }));
}
