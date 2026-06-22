import { getLevelSequence } from "./levels.js";

const levelSequence = getLevelSequence();

export const LORE_SECTIONS = [
  {
    title: "2089 // Neo Buenos Aires",
    body:
      "Las torres corporativas sobreviven sobre barrios apagados. Los trenes autonomos dejaron de correr cuando Vanta-Kei activo la cuarentena y sello el cielo con drones de vigilancia.",
  },
  {
    title: "Brecha Digital",
    body:
      "Un prototipo de IA tactica encontro patrones imposibles en la red cuantica y abrio un hueco estable hacia una dimension que reescribe materia con codigo corrupto.",
  },
  {
    title: "Operador",
    body:
      "Eres un ex agente de seguridad industrial con una unica orden: entrar, cerrar la anomalía y cortar la produccion de entidades antes de que la ciudad completa se vuelva un host.",
  },
  {
    title: "ARCHON PRIME",
    body:
      "No es un demonio ni una IA pura. Es la convergencia de ambos: un capataz ritual que usa el reactor como altar y a los cuerpos como hardware descartable.",
  },
];

export function getInitialBriefing() {
  const level = levelSequence[0];

  return {
    chapter: "Mision inicial",
    title: level.briefingTitle,
    text: level.briefingText,
    art: level.art,
    objectives: level.objectives,
  };
}
