import type { ChessStorage, GameRecord, MoveRecord } from "./storage.js";
import { createGame, getGameState, makeMove } from "../chess-core/engine";
import { calculateEloChange } from "../lazy-imports/elo";
import type { EloUpdate, GameResult, MoveResult } from "./types";
import { TIME_CONTROL_MS } from "./types";

const INITIAL_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

let storage: ChessStorage;

export function setGameStorage(s: ChessStorage): void {
  storage = s;
}

export { setGameStorage as setStorage };

export async function createGameRecord(
  whitePlayerId: string,
  timeControl: string = "BLITZ_5",
): Promise<{ id: string }> {
  const resolvedTimeMs = TIME_CONTROL_MS[timeControl] ?? 300_000;
  const game = await storage.createGame({
    whitePlayerId,
    status: "WAITING",
    fen: INITIAL_FEN,
    timeControl,
    whiteTimeMs: resolvedTimeMs,
    blackTimeMs: resolvedTimeMs,
  });

  return { id: game.id };
}

export async function joinGame(gameId: string, blackPlayerId: string): Promise<{ id: string }> {
  const game = await storage.getGame(gameId);

  if (!game) {
    throw new Error("Game not found");
  }
  if (game.status !== "WAITING") {
    throw new Error("Game is not waiting for a player");
  }
  if (game.whitePlayerId === blackPlayerId) {
    throw new Error("Cannot join your own game");
  }

  const updated = await storage.updateGame(gameId, {
    blackPlayerId,
    status: "ACTIVE",
  });

  return { id: updated.id };
}

export async function makeGameMove(
  gameId: string,
  playerId: string,
  from: string,
  to: string,
  promotion?: string,
): Promise<MoveResult> {
  const game = await storage.getGame(gameId);

  if (!game) {
    throw new Error("Game not found");
  }
  if (game.status !== "ACTIVE") {
    throw new Error("Game is not active");
  }

  const isWhiteTurn = game.moveCount % 2 === 0;
  if (isWhiteTurn && playerId !== game.whitePlayerId) {
    throw new Error("Not your turn");
  }
  if (!isWhiteTurn && playerId !== game.blackPlayerId) {
    throw new Error("Not your turn");
  }

  const chess = createGame(game.fen);
  const moveResult = makeMove(chess, { from, to, promotion });

  if (!moveResult.success) {
    return moveResult;
  }

  const state = getGameState(chess);
  const newMoveCount = game.moveCount + 1;

  let newStatus = "ACTIVE";
  if (state.isCheckmate) {
    newStatus = "CHECKMATE";
  } else if (state.isStalemate) {
    newStatus = "STALEMATE";
  } else if (state.isDraw) {
    newStatus = "DRAW";
  } else if (state.isCheck) {
    newStatus = "CHECK";
  }

  await storage.createMove({
    gameId,
    moveNumber: newMoveCount,
    san: moveResult.san,
    from: moveResult.from,
    to: moveResult.to,
    fen: moveResult.fen,
    playerId,
  });

  await storage.updateGame(gameId, {
    fen: moveResult.fen,
    pgn: state.pgn,
    moveCount: newMoveCount,
    status: newStatus,
  });

  if (state.isGameOver) {
    let result: GameResult;
    let winnerId: string | undefined;

    if (state.isCheckmate) {
      result = isWhiteTurn ? "white" : "black";
      winnerId = playerId;
    } else {
      result = "draw";
    }

    await finalizeGame(gameId, result, winnerId);
  }

  return moveResult;
}

export async function getGame(gameId: string): Promise<GameRecord> {
  const game = await storage.getGame(gameId);

  if (!game) {
    throw new Error("Game not found");
  }

  const moves = await storage.listMovesByGame(gameId);
  return { ...game, moves };
}

export async function listGames(playerId: string, status?: string): Promise<GameRecord[]> {
  return storage.listGamesByPlayer(playerId, status);
}

export async function resignGame(gameId: string, playerId: string): Promise<void> {
  const game = await storage.getGame(gameId);

  if (!game) {
    throw new Error("Game not found");
  }
  if (game.whitePlayerId !== playerId && game.blackPlayerId !== playerId) {
    throw new Error("Player is not in this game");
  }

  const winnerId = playerId === game.whitePlayerId ? game.blackPlayerId : game.whitePlayerId;
  const result: GameResult = playerId === game.whitePlayerId ? "black" : "white";

  await storage.updateGame(gameId, { status: "RESIGNED", winnerId });

  await finalizeGame(gameId, result, winnerId ?? undefined);
}

export async function offerDraw(gameId: string, playerId: string): Promise<{ offered: true }> {
  const game = await storage.getGame(gameId);

  if (!game) {
    throw new Error("Game not found");
  }
  if (game.status !== "ACTIVE" && game.status !== "CHECK") {
    throw new Error("Game is not active");
  }
  if (game.whitePlayerId !== playerId && game.blackPlayerId !== playerId) {
    throw new Error("Player is not in this game");
  }

  return { offered: true };
}

export async function acceptDraw(gameId: string, playerId: string): Promise<void> {
  const game = await storage.getGame(gameId);

  if (!game) {
    throw new Error("Game not found");
  }
  if (game.whitePlayerId !== playerId && game.blackPlayerId !== playerId) {
    throw new Error("Player is not in this game");
  }
  if (game.status !== "DRAW_OFFERED") {
    throw new Error("No draw has been offered");
  }

  await storage.updateGame(gameId, { status: "DRAW" });

  await finalizeGame(gameId, "draw");
}

export async function declineDraw(gameId: string, playerId: string): Promise<{ declined: true }> {
  const game = await storage.getGame(gameId);

  if (!game) {
    throw new Error("Game not found");
  }
  if (game.status !== "ACTIVE" && game.status !== "CHECK") {
    throw new Error("Game is not active");
  }
  if (game.whitePlayerId !== playerId && game.blackPlayerId !== playerId) {
    throw new Error("Player is not in this game");
  }

  return { declined: true };
}

export async function getGameReplay(
  gameId: string,
): Promise<{ moves: MoveRecord[]; pgn: string; result: string | null }> {
  const game = await storage.getGame(gameId);

  if (!game) {
    throw new Error("Game not found");
  }

  const moves = await storage.listMovesByGame(gameId);

  return {
    moves,
    pgn: game.pgn,
    result: game.result,
  };
}

export async function handleTimeExpiry(gameId: string, playerId: string): Promise<void> {
  const game = await storage.getGame(gameId);

  if (!game) {
    throw new Error("Game not found");
  }
  if (game.status !== "ACTIVE") {
    throw new Error("Game is not active");
  }
  if (game.whitePlayerId !== playerId && game.blackPlayerId !== playerId) {
    throw new Error("Player is not in this game");
  }

  const winnerId = playerId === game.whitePlayerId ? game.blackPlayerId : game.whitePlayerId;
  const result: GameResult = playerId === game.whitePlayerId ? "black" : "white";

  await storage.updateGame(gameId, { status: "EXPIRED", winnerId });

  await finalizeGame(gameId, result, winnerId ?? undefined);
}

export async function finalizeGame(
  gameId: string,
  result: GameResult,
  winnerId?: string,
): Promise<void> {
  const game = await storage.getGame(gameId);

  if (!game || !game.blackPlayerId) {
    return;
  }

  const whitePlayer = await storage.getPlayer(game.whitePlayerId);
  const blackPlayer = await storage.getPlayer(game.blackPlayerId);

  if (!whitePlayer || !blackPlayer) {
    return;
  }

  const eloChanges: EloUpdate = calculateEloChange(whitePlayer.elo, blackPlayer.elo, result);

  await storage.updatePlayer(whitePlayer.id, { elo: eloChanges.whiteNewElo });

  await storage.updatePlayer(blackPlayer.id, { elo: eloChanges.blackNewElo });

  await storage.updateGame(gameId, {
    winnerId: winnerId ?? null,
    result,
    eloChanges: {
      whiteNewElo: eloChanges.whiteNewElo,
      blackNewElo: eloChanges.blackNewElo,
      whiteChange: eloChanges.whiteChange,
      blackChange: eloChanges.blackChange,
    },
  });

  await storage.createNotification({
    userId: whitePlayer.userId,
    workspaceId: gameId,
    type: "CHESS_GAME_RESULT",
    title: "Game Over",
    message: `Game ended: ${result}`,
  });

  await storage.createNotification({
    userId: blackPlayer.userId,
    workspaceId: gameId,
    type: "CHESS_GAME_RESULT",
    title: "Game Over",
    message: `Game ended: ${result}`,
  });
}
