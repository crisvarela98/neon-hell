import { getMissionBriefs } from "./levels.js";

export const FTUE_STORAGE_KEY = "neon-hell-ftue-complete";

export const FTUE_STEPS = [
  {
    title: "Crear operador",
    body: "Registro con usuario, mail y contrasena para guardar progreso y ranking.",
  },
  {
    title: "Aprender combate",
    body: "Movimiento, disparo, cambio de arma, pickups y puertas en una mision corta.",
  },
  {
    title: "Entrar en campana",
    body: "Tres misiones iniciales conectadas: tutorial, corredor y nucleo de brecha.",
  },
  {
    title: "Jugar online PvE",
    body: "Sala de escuadron por codigo para equipo contra oleadas de maquina.",
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
