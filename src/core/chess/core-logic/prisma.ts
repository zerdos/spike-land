// Prisma types stub — chess-engine does not have a generated Prisma client.
// These types mirror the Prisma schema enums used across game-manager,
// player-manager, and challenge-manager.

export type ChessTimeControl =
  | "BULLET_1"
  | "BULLET_2"
  | "BLITZ_3"
  | "BLITZ_5"
  | "RAPID_10"
  | "RAPID_15"
  | "CLASSICAL_30"
  | "UNLIMITED";

export type ChessGameStatus =
  | "WAITING"
  | "ACTIVE"
  | "CHECK"
  | "CHECKMATE"
  | "STALEMATE"
  | "DRAW"
  | "RESIGNED"
  | "EXPIRED";
