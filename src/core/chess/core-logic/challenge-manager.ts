import type { ChessStorage, ChessChallenge } from "./storage.js";

const INITIAL_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const CHALLENGE_EXPIRY_MS = 5 * 60 * 1000;

let storage: ChessStorage;

export function setChallengeStorage(s: ChessStorage): void {
  storage = s;
}

export { setChallengeStorage as setStorage };

export async function sendChallenge(
  senderId: string,
  receiverId: string,
  timeControl?: string,
  senderColor?: string,
): Promise<ChessChallenge> {
  if (senderId === receiverId) {
    throw new Error("Cannot challenge yourself");
  }
  return storage.createChallenge({
    senderId,
    receiverId,
    timeControl: timeControl ?? "BLITZ_5",
    senderColor: senderColor ?? null,
    expiresAt: new Date(Date.now() + CHALLENGE_EXPIRY_MS),
  });
}

export async function acceptChallenge(
  challengeId: string,
  playerId: string,
): Promise<{ challenge: ChessChallenge; gameId: string }> {
  const challenge = await storage.getChallenge(challengeId);

  if (!challenge) {
    throw new Error("Challenge not found");
  }
  if (challenge.receiverId !== playerId) {
    throw new Error("Not authorized to accept this challenge");
  }
  if (challenge.status !== "PENDING") {
    throw new Error("Challenge is no longer pending");
  }

  let whitePlayerId: string;
  let blackPlayerId: string;

  if (challenge.senderColor === "white") {
    whitePlayerId = challenge.senderId;
    blackPlayerId = challenge.receiverId;
  } else if (challenge.senderColor === "black") {
    whitePlayerId = challenge.receiverId;
    blackPlayerId = challenge.senderId;
  } else {
    const senderIsWhite = Math.random() < 0.5;
    whitePlayerId = senderIsWhite ? challenge.senderId : challenge.receiverId;
    blackPlayerId = senderIsWhite ? challenge.receiverId : challenge.senderId;
  }

  const timeControlMs = (await import("./types")).TIME_CONTROL_MS[challenge.timeControl] ?? 300_000;
  const game = await storage.createGame({
    whitePlayerId,
    blackPlayerId,
    status: "WAITING",
    fen: INITIAL_FEN,
    timeControl: challenge.timeControl,
    whiteTimeMs: timeControlMs,
    blackTimeMs: timeControlMs,
  });

  const updatedChallenge = await storage.updateChallenge(challengeId, {
    status: "ACCEPTED",
    gameId: game.id,
  });

  return { challenge: updatedChallenge, gameId: game.id };
}

export async function declineChallenge(
  challengeId: string,
  playerId: string,
): Promise<ChessChallenge> {
  const challenge = await storage.getChallenge(challengeId);

  if (!challenge) {
    throw new Error("Challenge not found");
  }
  if (challenge.receiverId !== playerId) {
    throw new Error("Not authorized to decline this challenge");
  }

  return storage.updateChallenge(challengeId, { status: "DECLINED" });
}

export async function cancelChallenge(
  challengeId: string,
  playerId: string,
): Promise<ChessChallenge> {
  const challenge = await storage.getChallenge(challengeId);

  if (!challenge) {
    throw new Error("Challenge not found");
  }
  if (challenge.senderId !== playerId) {
    throw new Error("Not authorized to cancel this challenge");
  }

  return storage.updateChallenge(challengeId, { status: "CANCELLED" });
}

export async function listChallenges(playerId: string, status?: string): Promise<ChessChallenge[]> {
  return storage.listChallengesByPlayer(playerId, status);
}

export async function expireStaleChallenges(): Promise<number> {
  return storage.expireStaleChallenges();
}
