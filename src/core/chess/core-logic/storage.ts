// storage.ts — D1-compatible storage abstraction for chess-engine.
// Replaces the Prisma-backed implementation with a portable interface that can
// be backed by D1, IndexedDB, or an in-memory map.

// ---- Enum types (preserved from prisma.ts) --------------------------------

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

// ---- Shared record types --------------------------------------------------

/** Persisted representation of a chess game. */
export interface GameRecord {
  id: string;
  whitePlayerId: string;
  blackPlayerId: string | null;
  status: ChessGameStatus | string;
  fen: string;
  pgn: string;
  timeControl: ChessTimeControl | string;
  whiteTimeMs: number;
  blackTimeMs: number;
  winnerId: string | null;
  result: string | null;
  eloChanges: unknown;
  moveCount: number;
  createdAt: Date;
  updatedAt: Date;
  /** Populated only when explicitly requested (e.g. getGame with moves). */
  moves?: MoveRecord[];
}

/** Persisted representation of a single chess move. */
export interface MoveRecord {
  id: string;
  gameId: string;
  moveNumber: number;
  san: string;
  from: string;
  to: string;
  fen: string;
  playerId: string;
  timeSpentMs: number | null;
  createdAt: Date;
}

/** Persisted representation of a chess player profile. */
export interface ChessPlayer {
  id: string;
  userId: string;
  name: string;
  avatar: string | null;
  elo: number;
  bestElo: number;
  wins: number;
  losses: number;
  draws: number;
  streak: number;
  soundEnabled: boolean;
  isOnline: boolean;
  lastSeenAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Persisted representation of a match challenge between two players. */
export interface ChessChallenge {
  id: string;
  senderId: string;
  receiverId: string;
  status: string;
  timeControl: ChessTimeControl | string;
  senderColor: string | null;
  gameId: string | null;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ---- Create / update data helpers ----------------------------------------

/** Data accepted when creating a new game. Only required fields are mandatory; the rest default. */
export interface CreateGameData {
  whitePlayerId: string;
  status: ChessGameStatus | string;
  fen: string;
  timeControl: ChessTimeControl | string;
  whiteTimeMs: number;
  blackTimeMs: number;
  blackPlayerId?: string | null;
  pgn?: string;
  winnerId?: string | null;
  result?: string | null;
  eloChanges?: unknown;
  moveCount?: number;
}

/** Partial fields accepted when updating an existing game. */
export type UpdateGameData = Partial<Omit<GameRecord, "id" | "createdAt" | "moves">>;

/** Data accepted when creating a new move. */
export interface CreateMoveData {
  gameId: string;
  moveNumber: number;
  san: string;
  from: string;
  to: string;
  fen: string;
  playerId: string;
  timeSpentMs?: number | null;
}

/** Data accepted when creating a new player. Only userId and name are required. */
export interface CreatePlayerData {
  userId: string;
  name: string;
  avatar?: string | null;
  elo?: number;
  bestElo?: number;
  wins?: number;
  losses?: number;
  draws?: number;
  streak?: number;
  soundEnabled?: boolean;
  isOnline?: boolean;
  lastSeenAt?: Date | null;
}

/** Partial fields accepted when updating an existing player. */
export type UpdatePlayerData = Partial<Omit<ChessPlayer, "id" | "createdAt">>;

/** Data accepted when creating a new challenge. */
export interface CreateChallengeData {
  senderId: string;
  receiverId: string;
  timeControl: ChessTimeControl | string;
  expiresAt: Date;
  senderColor?: string | null;
  status?: string;
  gameId?: string | null;
}

/** Partial fields accepted when updating an existing challenge. */
export type UpdateChallengeData = Partial<Omit<ChessChallenge, "id" | "createdAt">>;

/** Minimal shape for a notification record. */
export interface NotificationData {
  userId: string;
  workspaceId: string;
  type: string;
  title: string;
  message: string;
}

// ---- Storage interface ----------------------------------------------------

/**
 * Domain-oriented storage abstraction for the chess engine.
 *
 * Implementations can be backed by Cloudflare D1, in-memory Maps (tests /
 * local dev), or any other persistence layer — as long as they satisfy this
 * interface the managers require no changes.
 */
export interface ChessStorage {
  // -- Games ----------------------------------------------------------------

  /**
   * Persist a new game and return the full record (with auto-generated id and
   * timestamps).
   */
  createGame(data: CreateGameData): Promise<GameRecord>;

  /**
   * Return the game with the given id, optionally including its moves.
   * Returns `null` when no game is found.
   */
  getGame(id: string, includeMoves?: boolean): Promise<GameRecord | null>;

  /**
   * Return all games where the player is either white or black.
   * Optionally filter by status.
   */
  listGamesByPlayer(playerId: string, status?: string): Promise<GameRecord[]>;

  /**
   * Apply a partial update to the game identified by `id` and return the
   * updated record.
   */
  updateGame(id: string, data: UpdateGameData): Promise<GameRecord>;

  // -- Moves ----------------------------------------------------------------

  /** Persist a new move and return the full record. */
  createMove(data: CreateMoveData): Promise<MoveRecord>;

  /**
   * Return all moves for the given game, sorted by `moveNumber` ascending.
   */
  listMovesByGame(gameId: string): Promise<MoveRecord[]>;

  // -- Players --------------------------------------------------------------

  /** Persist a new player profile and return the full record. */
  createPlayer(data: CreatePlayerData): Promise<ChessPlayer>;

  /**
   * Return the player with the given id, or `null` when not found.
   */
  getPlayer(id: string): Promise<ChessPlayer | null>;

  /**
   * Return all player profiles that belong to the given user account.
   */
  getPlayersByUser(userId: string): Promise<ChessPlayer[]>;

  /**
   * Apply a partial update to the player identified by `id` and return the
   * updated record.
   */
  updatePlayer(id: string, data: UpdatePlayerData): Promise<ChessPlayer>;

  /**
   * Apply a partial update to the player only when both `id` and `userId`
   * match. Throws when no matching record is found.
   */
  updatePlayerOwned(id: string, userId: string, data: UpdatePlayerData): Promise<ChessPlayer>;

  /**
   * Delete the player only when both `id` and `userId` match.
   * Throws when no matching record is found.
   */
  deletePlayerOwned(id: string, userId: string): Promise<void>;

  /** Return all players whose `isOnline` flag is `true`. */
  listOnlinePlayers(): Promise<ChessPlayer[]>;

  /**
   * Atomically update a player's ELO and derived statistics (wins/losses/draws
   * and streak) after a game result. Throws when the player is not found.
   *
   * Streak rules:
   * - win:  extends a positive streak by 1 (or starts one at 1)
   * - loss: extends a negative streak by 1 (or starts one at -1)
   * - draw: resets streak to 0
   */
  updatePlayerElo(playerId: string, newElo: number, result: "win" | "loss" | "draw"): Promise<void>;

  // -- Challenges -----------------------------------------------------------

  /** Persist a new challenge and return the full record. */
  createChallenge(data: CreateChallengeData): Promise<ChessChallenge>;

  /**
   * Return the challenge with the given id, or `null` when not found.
   */
  getChallenge(id: string): Promise<ChessChallenge | null>;

  /**
   * Apply a partial update to the challenge identified by `id` and return the
   * updated record.
   */
  updateChallenge(id: string, data: UpdateChallengeData): Promise<ChessChallenge>;

  /**
   * Return all challenges where the player is either sender or receiver.
   * Optionally filter by status.
   */
  listChallengesByPlayer(playerId: string, status?: string): Promise<ChessChallenge[]>;

  /**
   * Mark all PENDING challenges whose `expiresAt` is in the past as EXPIRED.
   * Returns the number of challenges expired.
   */
  expireStaleChallenges(): Promise<number>;

  // -- Notifications --------------------------------------------------------

  /** Persist a notification record. */
  createNotification(data: NotificationData): Promise<void>;
}
