import type { ChessStorage, ChessPlayer } from "./storage.js";

interface PlayerStats {
  elo: number;
  bestElo: number;
  wins: number;
  losses: number;
  draws: number;
  streak: number;
  totalGames: number;
  winRate: number;
}

let storage: ChessStorage;

export function setPlayerStorage(s: ChessStorage): void {
  storage = s;
}

/** Alias for setPlayerStorage — convenience for tests importing from this module. */
export { setPlayerStorage as setStorage };

export async function createPlayer(
  userId: string,
  name: string,
  avatar?: string,
): Promise<ChessPlayer> {
  return storage.createPlayer({
    userId,
    name,
    ...(avatar !== undefined && { avatar }),
  });
}

export async function getPlayer(playerId: string): Promise<ChessPlayer | null> {
  return storage.getPlayer(playerId);
}

export async function getPlayersByUser(userId: string): Promise<ChessPlayer[]> {
  return storage.getPlayersByUser(userId);
}

export async function updatePlayer(
  playerId: string,
  userId: string,
  data: { name?: string; avatar?: string; soundEnabled?: boolean },
): Promise<ChessPlayer> {
  try {
    return await storage.updatePlayerOwned(playerId, userId, data);
  } catch {
    throw new Error("Not authorized to update this player");
  }
}

export async function deletePlayer(playerId: string, userId: string): Promise<void> {
  try {
    await storage.deletePlayerOwned(playerId, userId);
  } catch {
    throw new Error("Not authorized to delete this player");
  }
}

export async function setPlayerOnline(
  playerId: string,
  userId: string,
  isOnline: boolean,
): Promise<void> {
  try {
    await storage.updatePlayerOwned(playerId, userId, {
      isOnline,
      lastSeenAt: new Date(),
    });
  } catch {
    throw new Error("Not authorized to update this player");
  }
}

export async function listOnlinePlayers(): Promise<ChessPlayer[]> {
  return storage.listOnlinePlayers();
}

export async function getPlayerStats(playerId: string): Promise<PlayerStats> {
  const player = await storage.getPlayer(playerId);
  if (!player) {
    throw new Error("Player not found");
  }
  const totalGames = player.wins + player.losses + player.draws;
  const winRate = totalGames > 0 ? player.wins / totalGames : 0;
  return {
    elo: player.elo,
    bestElo: player.bestElo,
    wins: player.wins,
    losses: player.losses,
    draws: player.draws,
    streak: player.streak,
    totalGames,
    winRate,
  };
}

export async function updatePlayerElo(
  playerId: string,
  newElo: number,
  result: "win" | "loss" | "draw",
): Promise<void> {
  await storage.updatePlayerElo(playerId, newElo, result);
}
