import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryChessStorage } from "../../src/core/chess/core-logic/in-memory-storage.js";
import {
  createPlayer,
  deletePlayer,
  getPlayer,
  getPlayersByUser,
  getPlayerStats,
  listOnlinePlayers,
  setStorage,
  setPlayerOnline,
  updatePlayer,
  updatePlayerElo,
} from "../../src/core/chess/core-logic/player-manager.js";

describe("player-manager", () => {
  let storage: InMemoryChessStorage;

  beforeEach(() => {
    storage = new InMemoryChessStorage();
    setStorage(storage);
  });

  it("createPlayer creates with correct data", async () => {
    const result = await createPlayer("u1", "Alice");

    expect(result.userId).toBe("u1");
    expect(result.name).toBe("Alice");
    expect(result.avatar).toBeNull();
    expect(result.id).toBeDefined();
  });

  it("createPlayer includes avatar when provided", async () => {
    const result = await createPlayer("u1", "Alice", "cat.png");

    expect(result.userId).toBe("u1");
    expect(result.name).toBe("Alice");
    expect(result.avatar).toBe("cat.png");
  });

  it("getPlayer returns player when found", async () => {
    const created = await storage.createPlayer({
      userId: "u1",
      name: "Alice",
      avatar: null,
      elo: 1200,
      bestElo: 1200,
      wins: 0,
      losses: 0,
      draws: 0,
      streak: 0,
      soundEnabled: true,
      isOnline: false,
      lastSeenAt: null,
    });

    const result = await getPlayer(created.id);

    expect(result).not.toBeNull();
    expect(result?.id).toBe(created.id);
    expect(result?.name).toBe("Alice");
  });

  it("getPlayer returns null when not found", async () => {
    const result = await getPlayer("nonexistent");

    expect(result).toBeNull();
  });

  it("getPlayersByUser returns all profiles for a user", async () => {
    await storage.createPlayer({
      userId: "u1",
      name: "Alice",
      avatar: null,
      elo: 1200,
      bestElo: 1200,
      wins: 0,
      losses: 0,
      draws: 0,
      streak: 0,
      soundEnabled: true,
      isOnline: false,
      lastSeenAt: null,
    });
    await storage.createPlayer({
      userId: "u1",
      name: "Bob",
      avatar: null,
      elo: 1200,
      bestElo: 1200,
      wins: 0,
      losses: 0,
      draws: 0,
      streak: 0,
      soundEnabled: true,
      isOnline: false,
      lastSeenAt: null,
    });

    const result = await getPlayersByUser("u1");

    expect(result).toHaveLength(2);
  });

  it("updatePlayer updates name correctly", async () => {
    const player = await storage.createPlayer({
      userId: "u1",
      name: "Alice",
      avatar: null,
      elo: 1200,
      bestElo: 1200,
      wins: 0,
      losses: 0,
      draws: 0,
      streak: 0,
      soundEnabled: true,
      isOnline: false,
      lastSeenAt: null,
    });

    const result = await updatePlayer(player.id, "u1", { name: "NewName" });

    expect(result.name).toBe("NewName");

    const persisted = await storage.getPlayer(player.id);
    expect(persisted?.name).toBe("NewName");
  });

  it("updatePlayer throws if not owner", async () => {
    const player = await storage.createPlayer({
      userId: "u1",
      name: "Alice",
      avatar: null,
      elo: 1200,
      bestElo: 1200,
      wins: 0,
      losses: 0,
      draws: 0,
      streak: 0,
      soundEnabled: true,
      isOnline: false,
      lastSeenAt: null,
    });

    await expect(updatePlayer(player.id, "wrong-user", { name: "Hacked" })).rejects.toThrow(
      "Not authorized to update this player",
    );
  });

  it("deletePlayer removes the player record", async () => {
    const player = await storage.createPlayer({
      userId: "u1",
      name: "Alice",
      avatar: null,
      elo: 1200,
      bestElo: 1200,
      wins: 0,
      losses: 0,
      draws: 0,
      streak: 0,
      soundEnabled: true,
      isOnline: false,
      lastSeenAt: null,
    });

    await deletePlayer(player.id, "u1");

    const result = await storage.getPlayer(player.id);
    expect(result).toBeNull();
  });

  it("deletePlayer throws if not owner", async () => {
    const player = await storage.createPlayer({
      userId: "u1",
      name: "Alice",
      avatar: null,
      elo: 1200,
      bestElo: 1200,
      wins: 0,
      losses: 0,
      draws: 0,
      streak: 0,
      soundEnabled: true,
      isOnline: false,
      lastSeenAt: null,
    });

    await expect(deletePlayer(player.id, "wrong-user")).rejects.toThrow(
      "Not authorized to delete this player",
    );
  });

  it("setPlayerOnline updates isOnline status and lastSeenAt", async () => {
    const player = await storage.createPlayer({
      userId: "u1",
      name: "Alice",
      avatar: null,
      elo: 1200,
      bestElo: 1200,
      wins: 0,
      losses: 0,
      draws: 0,
      streak: 0,
      soundEnabled: true,
      isOnline: false,
      lastSeenAt: null,
    });

    await setPlayerOnline(player.id, "u1", true);

    const updated = await storage.getPlayer(player.id);
    expect(updated?.isOnline).toBe(true);
    expect(updated?.lastSeenAt).toBeInstanceOf(Date);
  });

  it("listOnlinePlayers returns only online players", async () => {
    await storage.createPlayer({
      userId: "u1",
      name: "Online",
      avatar: null,
      elo: 1200,
      bestElo: 1200,
      wins: 0,
      losses: 0,
      draws: 0,
      streak: 0,
      soundEnabled: true,
      isOnline: true,
      lastSeenAt: null,
    });
    await storage.createPlayer({
      userId: "u2",
      name: "Offline",
      avatar: null,
      elo: 1200,
      bestElo: 1200,
      wins: 0,
      losses: 0,
      draws: 0,
      streak: 0,
      soundEnabled: true,
      isOnline: false,
      lastSeenAt: null,
    });

    const result = await listOnlinePlayers();

    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe("Online");
  });

  it("getPlayerStats calculates winRate correctly", async () => {
    const player = await storage.createPlayer({
      userId: "u1",
      name: "Alice",
      avatar: null,
      elo: 1300,
      bestElo: 1350,
      wins: 7,
      losses: 2,
      draws: 1,
      streak: 3,
      soundEnabled: true,
      isOnline: false,
      lastSeenAt: null,
    });

    const stats = await getPlayerStats(player.id);

    expect(stats.totalGames).toBe(10);
    expect(stats.winRate).toBeCloseTo(0.7);
    expect(stats.elo).toBe(1300);
    expect(stats.bestElo).toBe(1350);
    expect(stats.streak).toBe(3);
  });

  it("getPlayerStats handles zero games (winRate = 0)", async () => {
    const player = await storage.createPlayer({
      userId: "u1",
      name: "Alice",
      avatar: null,
      elo: 1200,
      bestElo: 1200,
      wins: 0,
      losses: 0,
      draws: 0,
      streak: 0,
      soundEnabled: true,
      isOnline: false,
      lastSeenAt: null,
    });

    const stats = await getPlayerStats(player.id);

    expect(stats.totalGames).toBe(0);
    expect(stats.winRate).toBe(0);
  });

  it("getPlayerStats throws if player not found", async () => {
    await expect(getPlayerStats("nonexistent")).rejects.toThrow("Player not found");
  });

  it("updatePlayerElo updates elo and increments wins on win", async () => {
    const player = await storage.createPlayer({
      userId: "u1",
      name: "Alice",
      avatar: null,
      elo: 1200,
      bestElo: 1200,
      wins: 0,
      losses: 0,
      draws: 0,
      streak: 0,
      soundEnabled: true,
      isOnline: false,
      lastSeenAt: null,
    });

    await updatePlayerElo(player.id, 1220, "win");

    const updated = await storage.getPlayer(player.id);
    expect(updated?.elo).toBe(1220);
    expect(updated?.wins).toBe(1);
    expect(updated?.losses).toBe(0);
    expect(updated?.draws).toBe(0);
    expect(updated?.streak).toBe(1);
  });

  it("updatePlayerElo updates elo and increments losses on loss", async () => {
    const player = await storage.createPlayer({
      userId: "u1",
      name: "Alice",
      avatar: null,
      elo: 1200,
      bestElo: 1200,
      wins: 0,
      losses: 0,
      draws: 0,
      streak: 0,
      soundEnabled: true,
      isOnline: false,
      lastSeenAt: null,
    });

    await updatePlayerElo(player.id, 1180, "loss");

    const updated = await storage.getPlayer(player.id);
    expect(updated?.elo).toBe(1180);
    expect(updated?.wins).toBe(0);
    expect(updated?.losses).toBe(1);
    expect(updated?.streak).toBe(-1);
  });

  it("updatePlayerElo updates elo and increments draws on draw", async () => {
    const player = await storage.createPlayer({
      userId: "u1",
      name: "Alice",
      avatar: null,
      elo: 1200,
      bestElo: 1200,
      wins: 0,
      losses: 0,
      draws: 0,
      streak: 0,
      soundEnabled: true,
      isOnline: false,
      lastSeenAt: null,
    });

    await updatePlayerElo(player.id, 1200, "draw");

    const updated = await storage.getPlayer(player.id);
    expect(updated?.elo).toBe(1200);
    expect(updated?.draws).toBe(1);
    expect(updated?.streak).toBe(0);
  });

  it("updatePlayerElo throws when player not found", async () => {
    await expect(updatePlayerElo("nonexistent", 1220, "win")).rejects.toThrow("Player not found");
  });

  it("updatePlayerElo extends positive streak on consecutive wins", async () => {
    const player = await storage.createPlayer({
      userId: "u1",
      name: "Alice",
      avatar: null,
      elo: 1200,
      bestElo: 1200,
      wins: 2,
      losses: 0,
      draws: 0,
      streak: 2,
      soundEnabled: true,
      isOnline: false,
      lastSeenAt: null,
    });

    await updatePlayerElo(player.id, 1220, "win");

    const updated = await storage.getPlayer(player.id);
    expect(updated?.streak).toBe(3);
  });

  it("updatePlayerElo resets streak to 0 on draw", async () => {
    const player = await storage.createPlayer({
      userId: "u1",
      name: "Alice",
      avatar: null,
      elo: 1200,
      bestElo: 1200,
      wins: 3,
      losses: 0,
      draws: 0,
      streak: 3,
      soundEnabled: true,
      isOnline: false,
      lastSeenAt: null,
    });

    await updatePlayerElo(player.id, 1200, "draw");

    const updated = await storage.getPlayer(player.id);
    expect(updated?.streak).toBe(0);
  });

  it("updatePlayerElo tracks bestElo correctly", async () => {
    const player = await storage.createPlayer({
      userId: "u1",
      name: "Alice",
      avatar: null,
      elo: 1200,
      bestElo: 1200,
      wins: 0,
      losses: 0,
      draws: 0,
      streak: 0,
      soundEnabled: true,
      isOnline: false,
      lastSeenAt: null,
    });

    await updatePlayerElo(player.id, 1300, "win");

    const updated = await storage.getPlayer(player.id);
    expect(updated?.bestElo).toBe(1300);

    await updatePlayerElo(player.id, 1250, "loss");

    const afterLoss = await storage.getPlayer(player.id);
    expect(afterLoss?.bestElo).toBe(1300);
  });
});
