/**
 * 3×3×3 Arena — "Az AI önmaga foglyává vált" (hup.hu/node/189552)
 * Three personas (Radix, Erdős, Hofstadter) × six commenters
 */

export const ARENA_PERSONAS = [
  { name: "Radix", icon: "√", role: "Synthesizer", color: "#00E5FF" },
  { name: "Erdős", icon: "∮", role: "Rigorist", color: "#DAA520" },
  { name: "Hofstadter", icon: "∞", role: "Analogist", color: "#9945FF" },
] as const;

export const ARENA_COMMENTERS = [
  { name: "arpi_esp", argument: "ahogy az emberek is..." },
  { name: "YleGreg", argument: "mi a megoldási javaslatod?" },
  { name: "mitch0", argument: "összefüggéstelen szemét" },
  { name: "Sanya v", argument: "balos propaganda" },
  { name: "nehai v", argument: "1+1=5, leszarom" },
  { name: "Peter", argument: "correct math, zero content — bullshit machine" },
  { name: "Peter (2)", argument: "vedd fel a kapcsolatot a csetbot matematikusokkal" },
  { name: "Allan", argument: "ChatGPT told him they created a math framework together" },
] as const;

export const ARENA_TIMING = {
  totalFrames: 5400,
  fps: 30,
  transitionFrames: 20,
} as const;

export const ARENA_DURATIONS = {
  opening: 300,
  grid: 4500,
  verdict: 600,
} as const;
