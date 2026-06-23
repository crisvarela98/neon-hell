import { getMissionBriefs } from "./levels.js";

export const FTUE_STORAGE_KEY = "neon-hell-ftue-complete";

export const FTUE_STEPS = [
  {
    title: "Primer minuto claro",
    body: "Boot Bay ensena movimiento, disparo, pickups y puertas en una sola corrida corta.",
  },
  {
    title: "Cuenta con progreso",
    body: "Guardar score suma XP de cuenta, desbloquea clases de armas y activa mejoras permanentes.",
  },
  {
    title: "Retorno diario",
    body: "Las misiones diarias y semanales te dan objetivos concretos cada vez que vuelves.",
  },
  {
    title: "Social y online",
    body: "Agrega amigos, compara records y lanza retos directos o salas PvE por codigo.",
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
