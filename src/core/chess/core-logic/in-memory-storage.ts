// in-memory-storage.ts — Map-backed ChessStorage implementation.
// Suitable for tests and local development. Not suitable for production because
// state is process-local and not durable across restarts.

import type {
  ChessChallenge,
  ChessPlayer,
  ChessStorage,
  CreateChallengeData,
  CreateGameData,
  CreateMoveData,
  CreatePlayerData,
  GameRecord,
  MoveRecord,
  NotificationData,
  UpdateChallengeData,
  UpdateGameData,
  UpdatePlayerData,
} from "./storage.js";

export class InMemoryChessStorage implements ChessStorage {
  private readonly games = new Map<string, GameRecord>();
  private readonly moves = new Map<string, MoveRecord>();
  private readonly players = new Map<string, ChessPlayer>();
  private readonly challenges = new Map<string, ChessChallenge>();

  // ---- Games --------------------------------------------------------------

  async createGame(data: CreateGameData): Promise<GameRecord> {
    const now = new Date();
    const record: GameRecord = {
      blackPlayerId: data.blackPlayerId ?? null,
      pgn: data.pgn ?? "",
      winnerId: data.winnerId ?? null,
      result: data.result ?? null,
      eloChanges: data.eloChanges ?? null,
      moveCount: data.moveCount ?? 0,
      ...data,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    this.games.set(record.id, record);
    return { ...record };
  }

  async getGame(id: string, includeMoves = false): Promise<GameRecord | null> {
    const record = this.games.get(id);
    if (!record) {
      return null;
    }
    const result: GameRecord = { ...record };
    if (includeMoves) {
      result.moves = await this.listMovesByGame(id);
    }
    return result;
  }

  async listGamesByPlayer(playerId: string, status?: string): Promise<GameRecord[]> {
    const results: GameRecord[] = [];
    for (const game of this.games.values()) {
      const participates = game.whitePlayerId === playerId || game.blackPlayerId === playerId;
      if (!participates) {
        continue;
      }
      if (status !== undefined && game.status !== status) {
        continue;
      }
      results.push({ ...game });
    }
    return results;
  }

  async updateGame(id: string, data: UpdateGameData): Promise<GameRecord> {
    const existing = this.games.get(id);
    if (!existing) {
      throw new Error(`Game not found: ${id}`);
    }
    const updated: GameRecord = {
      ...existing,
      ...data,
      updatedAt: new Date(),
    };
    this.games.set(id, updated);
    return { ...updated };
  }

  // ---- Moves --------------------------------------------------------------

  async createMove(data: CreateMoveData): Promise<MoveRecord> {
    const record: MoveRecord = {
      timeSpentMs: data.timeSpentMs ?? null,
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    };
    this.moves.set(record.id, record);
    return { ...record };
  }

  async listMovesByGame(gameId: string): Promise<MoveRecord[]> {
    const results: MoveRecord[] = [];
    for (const move of this.moves.values()) {
      if (move.gameId === gameId) {
        results.push({ ...move });
      }
    }
    results.sort((a, b) => a.moveNumber - b.moveNumber);
    return results;
  }

  // ---- Players ------------------------------------------------------------

  async createPlayer(data: CreatePlayerData): Promise<ChessPlayer> {
    const now = new Date();
    const record: ChessPlayer = {
      avatar: data.avatar ?? null,
      elo: data.elo ?? 1200,
      bestElo: data.bestElo ?? 1200,
      wins: data.wins ?? 0,
      losses: data.losses ?? 0,
      draws: data.draws ?? 0,
      streak: data.streak ?? 0,
      soundEnabled: data.soundEnabled ?? true,
      isOnline: data.isOnline ?? false,
      lastSeenAt: data.lastSeenAt ?? null,
      ...data,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    this.players.set(record.id, record);
    return { ...record };
  }

  async getPlayer(id: string): Promise<ChessPlayer | null> {
    const record = this.players.get(id);
    return record ? { ...record } : null;
  }

  async getPlayersByUser(userId: string): Promise<ChessPlayer[]> {
    const results: ChessPlayer[] = [];
    for (const player of this.players.values()) {
      if (player.userId === userId) {
        results.push({ ...player });
      }
    }
    return results;
  }

  async updatePlayer(id: string, data: UpdatePlayerData): Promise<ChessPlayer> {
    const existing = this.players.get(id);
    if (!existing) {
      throw new Error(`Player not found: ${id}`);
    }
    const updated: ChessPlayer = {
      ...existing,
      ...data,
      updatedAt: new Date(),
    };
    this.players.set(id, updated);
    return { ...updated };
  }

  async updatePlayerOwned(
    id: string,
    userId: string,
    data: UpdatePlayerData,
  ): Promise<ChessPlayer> {
    const existing = this.players.get(id);
    if (!existing || existing.userId !== userId) {
      throw new Error("Not authorized to update this player");
    }
    const updated: ChessPlayer = {
      ...existing,
      ...data,
      updatedAt: new Date(),
    };
    this.players.set(id, updated);
    return { ...updated };
  }

  async deletePlayerOwned(id: string, userId: string): Promise<void> {
    const existing = this.players.get(id);
    if (!existing || existing.userId !== userId) {
      throw new Error("Not authorized to delete this player");
    }
    this.players.delete(id);
  }

  async listOnlinePlayers(): Promise<ChessPlayer[]> {
    const results: ChessPlayer[] = [];
    for (const player of this.players.values()) {
      if (player.isOnline) {
        results.push({ ...player });
      }
    }
    return results;
  }

  async updatePlayerElo(
    playerId: string,
    newElo: number,
    result: "win" | "loss" | "draw",
  ): Promise<void> {
    const existing = this.players.get(playerId);
    if (!existing) {
      throw new Error(`Player not found: ${playerId}`);
    }

    const wins = existing.wins + (result === "win" ? 1 : 0);
    const losses = existing.losses + (result === "loss" ? 1 : 0);
    const draws = existing.draws + (result === "draw" ? 1 : 0);
    const bestElo = Math.max(existing.bestElo, newElo);

    let streak: number;
    if (result === "win") {
      streak = existing.streak > 0 ? existing.streak + 1 : 1;
    } else if (result === "loss") {
      streak = existing.streak < 0 ? existing.streak - 1 : -1;
    } else {
      streak = 0;
    }

    const updated: ChessPlayer = {
      ...existing,
      elo: newElo,
      bestElo,
      wins,
      losses,
      draws,
      streak,
      updatedAt: new Date(),
    };
    this.players.set(playerId, updated);
  }

  // ---- Challenges ---------------------------------------------------------

  async createChallenge(data: CreateChallengeData): Promise<ChessChallenge> {
    const now = new Date();
    const record: ChessChallenge = {
      status: data.status ?? "PENDING",
      senderColor: data.senderColor ?? null,
      gameId: data.gameId ?? null,
      ...data,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    this.challenges.set(record.id, record);
    return { ...record };
  }

  async getChallenge(id: string): Promise<ChessChallenge | null> {
    const record = this.challenges.get(id);
    return record ? { ...record } : null;
  }

  async updateChallenge(id: string, data: UpdateChallengeData): Promise<ChessChallenge> {
    const existing = this.challenges.get(id);
    if (!existing) {
      throw new Error(`Challenge not found: ${id}`);
    }
    const updated: ChessChallenge = {
      ...existing,
      ...data,
      updatedAt: new Date(),
    };
    this.challenges.set(id, updated);
    return { ...updated };
  }

  async listChallengesByPlayer(playerId: string, status?: string): Promise<ChessChallenge[]> {
    const results: ChessChallenge[] = [];
    for (const challenge of this.challenges.values()) {
      const participates = challenge.senderId === playerId || challenge.receiverId === playerId;
      if (!participates) {
        continue;
      }
      if (status !== undefined && challenge.status !== status) {
        continue;
      }
      results.push({ ...challenge });
    }
    return results;
  }

  async expireStaleChallenges(): Promise<number> {
    const now = new Date();
    let count = 0;
    for (const [id, challenge] of this.challenges.entries()) {
      if (challenge.status === "PENDING" && challenge.expiresAt < now) {
        this.challenges.set(id, {
          ...challenge,
          status: "EXPIRED",
          updatedAt: new Date(),
        });
        count++;
      }
    }
    return count;
  }

  // ---- Notifications ------------------------------------------------------

  async createNotification(_data: NotificationData): Promise<void> {
    // In-memory implementation is a no-op — notifications are fire-and-forget
    // in tests. A real implementation would write to a notifications table.
  }
}
