export type { ChessStorage } from "./storage.js";
export * from "./storage.js";
export * from "./types.js";
export * from "../lazy-imports/elo.js";
export * from "../chess-core/engine.js";
export * from "./game-manager.js";
export * from "./player-manager.js";
export * from "./challenge-manager.js";

import type { ChessStorage } from "./storage.js";
import { setGameStorage } from "./game-manager.js";
import { setPlayerStorage } from "./player-manager.js";
import { setChallengeStorage } from "./challenge-manager.js";

export function setStorage(s: ChessStorage): void {
  setGameStorage(s);
  setPlayerStorage(s);
  setChallengeStorage(s);
}
