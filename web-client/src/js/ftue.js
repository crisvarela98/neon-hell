import { getMissionBriefs } from "./levels.js";

export const FTUE_STORAGE_KEY = "neon-hell-ftue-complete";

export const FTUE_STEPS = [
  {
    title: "Mision 1: Boot Bay",
    body: "Primer descenso corto para calibrar movimiento, disparo, pickups y puertas sin friccion.",
  },
  {
    title: "Mision 2: Sector 13",
    body: "Corredor de acceso con mas presion, drones y rutas para dominar el ritmo del combate.",
  },
  {
    title: "Mision 3: Breach Core",
    body: "Camara de fractura con oleadas pesadas y apariciones de ARCHON PRIME.",
  },
  {
    title: "Online PvE opcional",
    body: "Crea una sala por codigo cuando quieras jugar equipo contra maquina.",
  },
];

export function getFtueState() {
  return {
    complete: localStorage.getItem(FTUE_STORAGE_KEY) === "true",
    steps: FTUE_STEPS,
    missions: getMissionBriefs(),
  };
}

export function markFtueComplete() {
  localStorage.setItem(FTUE_STORAGE_KEY, "true");
}
