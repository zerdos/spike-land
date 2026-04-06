import { beforeEach, describe, expect, it, vi } from "vitest";
import { InMemoryChessStorage } from "../../src/core/chess/core-logic/in-memory-storage.js";
import {
  acceptChallenge,
  cancelChallenge,
  declineChallenge,
  expireStaleChallenges,
  listChallenges,
  sendChallenge,
  setStorage,
} from "../../src/core/chess/core-logic/challenge-manager.js";

const INITIAL_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

describe("challenge-manager", () => {
  let storage: InMemoryChessStorage;

  beforeEach(() => {
    storage = new InMemoryChessStorage();
    setStorage(storage);
  });

  it("sendChallenge creates with correct data and expiresAt", async () => {
    const now = Date.now();
    const result = await sendChallenge("p1", "p2", "BLITZ_5", "white");

    expect(result.senderId).toBe("p1");
    expect(result.receiverId).toBe("p2");
    expect(result.timeControl).toBe("BLITZ_5");
    expect(result.senderColor).toBe("white");
    expect(result.status).toBe("PENDING");
    expect(result.expiresAt).toBeInstanceOf(Date);
    expect(result.expiresAt.getTime()).toBeGreaterThanOrEqual(now + 5 * 60 * 1000 - 1000);
    expect(result.expiresAt.getTime()).toBeLessThanOrEqual(now + 5 * 60 * 1000 + 1000);
  });

  it("sendChallenge works without timeControl and senderColor (defaults to BLITZ_5 and null color)", async () => {
    const result = await sendChallenge("p1", "p2");

    expect(result.timeControl).toBe("BLITZ_5");
    expect(result.senderColor).toBeNull();
  });

  it("sendChallenge rejects self-challenge", async () => {
    await expect(sendChallenge("p1", "p1")).rejects.toThrow("Cannot challenge yourself");

    const challenges = await storage.listChallengesByPlayer("p1");
    expect(challenges).toHaveLength(0);
  });

  it("acceptChallenge rejects if not found", async () => {
    await expect(acceptChallenge("nonexistent", "p1")).rejects.toThrow("Challenge not found");
  });

  it("declineChallenge rejects if not found", async () => {
    await expect(declineChallenge("nonexistent", "p1")).rejects.toThrow("Challenge not found");
  });

  it("cancelChallenge rejects if not found", async () => {
    await expect(cancelChallenge("nonexistent", "p1")).rejects.toThrow("Challenge not found");
  });

  it("acceptChallenge updates status to ACCEPTED and creates a game", async () => {
    const challenge = await storage.createChallenge({
      senderId: "p1",
      receiverId: "p2",
      status: "PENDING",
      senderColor: "white",
      timeControl: "BLITZ_5",
      gameId: null,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    const result = await acceptChallenge(challenge.id, "p2");

    expect(result.gameId).toBeDefined();
    expect(typeof result.gameId).toBe("string");

    const updatedChallenge = await storage.getChallenge(challenge.id);
    expect(updatedChallenge?.status).toBe("ACCEPTED");
    expect(updatedChallenge?.gameId).toBe(result.gameId);

    const game = await storage.getGame(result.gameId);
    expect(game).not.toBeNull();
    expect(game?.status).toBe("WAITING");
    expect(game?.fen).toBe(INITIAL_FEN);
    expect(game?.timeControl).toBe("BLITZ_5");
    expect(game?.whiteTimeMs).toBe(300_000);
    expect(game?.blackTimeMs).toBe(300_000);
  });

  it("acceptChallenge rejects if not receiver", async () => {
    const challenge = await storage.createChallenge({
      senderId: "p1",
      receiverId: "p2",
      status: "PENDING",
      senderColor: "white",
      timeControl: "BLITZ_5",
      gameId: null,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    await expect(acceptChallenge(challenge.id, "p3")).rejects.toThrow(
      "Not authorized to accept this challenge",
    );
  });

  it("acceptChallenge rejects if not PENDING status", async () => {
    const challenge = await storage.createChallenge({
      senderId: "p1",
      receiverId: "p2",
      status: "DECLINED",
      senderColor: null,
      timeControl: "BLITZ_5",
      gameId: null,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    await expect(acceptChallenge(challenge.id, "p2")).rejects.toThrow(
      "Challenge is no longer pending",
    );
  });

  it("declineChallenge updates status to DECLINED", async () => {
    const challenge = await storage.createChallenge({
      senderId: "p1",
      receiverId: "p2",
      status: "PENDING",
      senderColor: null,
      timeControl: "BLITZ_5",
      gameId: null,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    const result = await declineChallenge(challenge.id, "p2");

    expect(result.status).toBe("DECLINED");

    const persisted = await storage.getChallenge(challenge.id);
    expect(persisted?.status).toBe("DECLINED");
  });

  it("declineChallenge rejects if not receiver", async () => {
    const challenge = await storage.createChallenge({
      senderId: "p1",
      receiverId: "p2",
      status: "PENDING",
      senderColor: null,
      timeControl: "BLITZ_5",
      gameId: null,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    await expect(declineChallenge(challenge.id, "p1")).rejects.toThrow(
      "Not authorized to decline this challenge",
    );
  });

  it("cancelChallenge updates status to CANCELLED", async () => {
    const challenge = await storage.createChallenge({
      senderId: "p1",
      receiverId: "p2",
      status: "PENDING",
      senderColor: null,
      timeControl: "BLITZ_5",
      gameId: null,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    const result = await cancelChallenge(challenge.id, "p1");

    expect(result.status).toBe("CANCELLED");

    const persisted = await storage.getChallenge(challenge.id);
    expect(persisted?.status).toBe("CANCELLED");
  });

  it("cancelChallenge rejects if not sender", async () => {
    const challenge = await storage.createChallenge({
      senderId: "p1",
      receiverId: "p2",
      status: "PENDING",
      senderColor: null,
      timeControl: "BLITZ_5",
      gameId: null,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    await expect(cancelChallenge(challenge.id, "p2")).rejects.toThrow(
      "Not authorized to cancel this challenge",
    );
  });

  it("listChallenges returns challenges for player (as sender or receiver)", async () => {
    await storage.createChallenge({
      senderId: "p1",
      receiverId: "p2",
      status: "PENDING",
      senderColor: null,
      timeControl: "BLITZ_5",
      gameId: null,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });
    await storage.createChallenge({
      senderId: "p3",
      receiverId: "p1",
      status: "PENDING",
      senderColor: null,
      timeControl: "BLITZ_5",
      gameId: null,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    const result = await listChallenges("p1");

    expect(result).toHaveLength(2);
  });

  it("listChallenges filters by status", async () => {
    await storage.createChallenge({
      senderId: "p1",
      receiverId: "p2",
      status: "PENDING",
      senderColor: null,
      timeControl: "BLITZ_5",
      gameId: null,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });
    await storage.createChallenge({
      senderId: "p1",
      receiverId: "p3",
      status: "DECLINED",
      senderColor: null,
      timeControl: "BLITZ_5",
      gameId: null,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    const result = await listChallenges("p1", "PENDING");

    expect(result).toHaveLength(1);
    expect(result[0]?.status).toBe("PENDING");
  });

  it("expireStaleChallenges expires past-due PENDING challenges", async () => {
    await storage.createChallenge({
      senderId: "p1",
      receiverId: "p2",
      status: "PENDING",
      senderColor: null,
      timeControl: "BLITZ_5",
      gameId: null,
      expiresAt: new Date(Date.now() - 1000), // already expired
    });
    await storage.createChallenge({
      senderId: "p1",
      receiverId: "p3",
      status: "PENDING",
      senderColor: null,
      timeControl: "BLITZ_5",
      gameId: null,
      expiresAt: new Date(Date.now() - 2000), // also expired
    });
    await storage.createChallenge({
      senderId: "p2",
      receiverId: "p3",
      status: "PENDING",
      senderColor: null,
      timeControl: "BLITZ_5",
      gameId: null,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // still valid
    });

    const count = await expireStaleChallenges();

    expect(count).toBe(2);

    const allP1 = await storage.listChallengesByPlayer("p1");
    for (const c of allP1) {
      if (c.expiresAt.getTime() < Date.now()) {
        expect(c.status).toBe("EXPIRED");
      }
    }
  });

  it("expireStaleChallenges does not expire already non-PENDING challenges", async () => {
    await storage.createChallenge({
      senderId: "p1",
      receiverId: "p2",
      status: "DECLINED",
      senderColor: null,
      timeControl: "BLITZ_5",
      gameId: null,
      expiresAt: new Date(Date.now() - 1000),
    });

    const count = await expireStaleChallenges();

    expect(count).toBe(0);
  });

  it("acceptChallenge with senderColor 'white' assigns sender as white", async () => {
    const challenge = await storage.createChallenge({
      senderId: "p1",
      receiverId: "p2",
      status: "PENDING",
      senderColor: "white",
      timeControl: "RAPID_10",
      gameId: null,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    const result = await acceptChallenge(challenge.id, "p2");

    const game = await storage.getGame(result.gameId);
    expect(game?.whitePlayerId).toBe("p1");
    expect(game?.blackPlayerId).toBe("p2");
  });

  it("acceptChallenge with senderColor 'black' assigns sender as black", async () => {
    const challenge = await storage.createChallenge({
      senderId: "p1",
      receiverId: "p2",
      status: "PENDING",
      senderColor: "black",
      timeControl: "RAPID_10",
      gameId: null,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    const result = await acceptChallenge(challenge.id, "p2");

    const game = await storage.getGame(result.gameId);
    expect(game?.whitePlayerId).toBe("p2");
    expect(game?.blackPlayerId).toBe("p1");
  });

  it("acceptChallenge with no senderColor picks randomly (sender as white when random < 0.5)", async () => {
    const challenge = await storage.createChallenge({
      senderId: "p1",
      receiverId: "p2",
      status: "PENDING",
      senderColor: null,
      timeControl: "BLITZ_5",
      gameId: null,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0.3);

    const result = await acceptChallenge(challenge.id, "p2");

    const game = await storage.getGame(result.gameId);
    expect(game?.whitePlayerId).toBe("p1");
    expect(game?.blackPlayerId).toBe("p2");

    randomSpy.mockRestore();
  });

  it("acceptChallenge with no senderColor picks randomly (receiver as white when random >= 0.5)", async () => {
    const challenge = await storage.createChallenge({
      senderId: "p1",
      receiverId: "p2",
      status: "PENDING",
      senderColor: null,
      timeControl: "BLITZ_5",
      gameId: null,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0.7);

    const result = await acceptChallenge(challenge.id, "p2");

    const game = await storage.getGame(result.gameId);
    expect(game?.whitePlayerId).toBe("p2");
    expect(game?.blackPlayerId).toBe("p1");

    randomSpy.mockRestore();
  });

  it("acceptChallenge with unknown time control falls back to 300_000ms", async () => {
    const challenge = await storage.createChallenge({
      senderId: "p1",
      receiverId: "p2",
      status: "PENDING",
      senderColor: "white",
      timeControl: "UNKNOWN",
      gameId: null,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    const result = await acceptChallenge(challenge.id, "p2");

    const game = await storage.getGame(result.gameId);
    expect(game?.whiteTimeMs).toBe(300_000);
    expect(game?.blackTimeMs).toBe(300_000);
  });
});
