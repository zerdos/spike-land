import { beforeEach, describe, expect, it, vi } from "vitest";

const mockEngine = vi.hoisted(() => ({
  createGame: vi.fn(),
  makeMove: vi.fn(),
  getGameState: vi.fn(),
}));

vi.mock("../../src/core/chess/chess-core/engine", () => mockEngine);

const mockElo = vi.hoisted(() => ({
  calculateEloChange: vi.fn(),
}));

vi.mock("../../src/core/chess/lazy-imports/elo", () => mockElo);

import { InMemoryChessStorage } from "../../src/core/chess/core-logic/in-memory-storage.js";
import {
  acceptDraw,
  createGameRecord,
  declineDraw,
  finalizeGame,
  getGame,
  getGameReplay,
  handleTimeExpiry,
  joinGame,
  listGames,
  makeGameMove,
  offerDraw,
  resignGame,
  setStorage,
} from "../../src/core/chess/core-logic/game-manager.js";

const INITIAL_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

function makeMoveResult(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    success: true,
    san: "e4",
    from: "e2",
    to: "e4",
    fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1",
    isCheck: false,
    isCheckmate: false,
    isStalemate: false,
    isDraw: false,
    isGameOver: false,
    ...overrides,
  };
}

function makeGameState(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1",
    pgn: "1. e4",
    turn: "b",
    moveCount: 1,
    isCheck: false,
    isCheckmate: false,
    isStalemate: false,
    isDraw: false,
    isGameOver: false,
    isInsufficientMaterial: false,
    isThreefoldRepetition: false,
    is50MoveRule: false,
    ...overrides,
  };
}

describe("game-manager", () => {
  let storage: InMemoryChessStorage;

  beforeEach(() => {
    vi.clearAllMocks();
    storage = new InMemoryChessStorage();
    setStorage(storage);
  });

  describe("createGameRecord", () => {
    it("creates game with WAITING status and correct initial FEN", async () => {
      const result = await createGameRecord("white-player");

      expect(result.id).toBeDefined();

      const game = await storage.getGame(result.id);
      expect(game?.whitePlayerId).toBe("white-player");
      expect(game?.status).toBe("WAITING");
      expect(game?.fen).toBe(INITIAL_FEN);
      expect(game?.timeControl).toBe("BLITZ_5");
      expect(game?.whiteTimeMs).toBe(300_000);
      expect(game?.blackTimeMs).toBe(300_000);
    });

    it("uses correct time from TIME_CONTROL_MS", async () => {
      const result = await createGameRecord("white-player", "RAPID_10");

      const game = await storage.getGame(result.id);
      expect(game?.timeControl).toBe("RAPID_10");
      expect(game?.whiteTimeMs).toBe(600_000);
      expect(game?.blackTimeMs).toBe(600_000);
    });

    it("defaults to BLITZ_5 if no timeControl specified", async () => {
      const result = await createGameRecord("white-player");

      const game = await storage.getGame(result.id);
      expect(game?.timeControl).toBe("BLITZ_5");
      expect(game?.whiteTimeMs).toBe(300_000);
      expect(game?.blackTimeMs).toBe(300_000);
    });

    it("defaults to BLITZ_5 time for unknown time control", async () => {
      const result = await createGameRecord("white-player", "UNKNOWN");

      const game = await storage.getGame(result.id);
      expect(game?.timeControl).toBe("UNKNOWN");
      expect(game?.whiteTimeMs).toBe(300_000);
      expect(game?.blackTimeMs).toBe(300_000);
    });
  });

  describe("joinGame", () => {
    it("sets blackPlayerId and status to ACTIVE", async () => {
      const { id } = await createGameRecord("white-player");

      const result = await joinGame(id, "black-player");

      expect(result.id).toBe(id);

      const game = await storage.getGame(id);
      expect(game?.blackPlayerId).toBe("black-player");
      expect(game?.status).toBe("ACTIVE");
    });

    it("rejects if game is not WAITING", async () => {
      const game = await storage.createGame({
        whitePlayerId: "white-player",
        blackPlayerId: "black-player",
        status: "ACTIVE",
        fen: INITIAL_FEN,
        pgn: "",
        timeControl: "BLITZ_5",
        whiteTimeMs: 300_000,
        blackTimeMs: 300_000,
        winnerId: null,
        result: null,
        eloChanges: null,
        moveCount: 0,
      });

      await expect(joinGame(game.id, "another-player")).rejects.toThrow(
        "Game is not waiting for a player",
      );
    });

    it("rejects if blackPlayer === whitePlayer", async () => {
      const { id } = await createGameRecord("white-player");

      await expect(joinGame(id, "white-player")).rejects.toThrow("Cannot join your own game");
    });

    it("rejects if game not found", async () => {
      await expect(joinGame("nonexistent", "black-player")).rejects.toThrow("Game not found");
    });
  });

  describe("makeGameMove", () => {
    it("rejects if game not found", async () => {
      await expect(makeGameMove("nonexistent", "white-player", "e2", "e4")).rejects.toThrow(
        "Game not found",
      );
    });

    it("returns failed move result without saving when engine rejects move", async () => {
      const game = await storage.createGame({
        whitePlayerId: "white-player",
        blackPlayerId: "black-player",
        status: "ACTIVE",
        fen: INITIAL_FEN,
        pgn: "",
        timeControl: "BLITZ_5",
        whiteTimeMs: 300_000,
        blackTimeMs: 300_000,
        winnerId: null,
        result: null,
        eloChanges: null,
        moveCount: 0,
      });
      const failedResult = makeMoveResult({ success: false, san: "" });

      mockEngine.createGame.mockReturnValue({});
      mockEngine.makeMove.mockReturnValue(failedResult);

      const result = await makeGameMove(game.id, "white-player", "e2", "e5");

      expect(result.success).toBe(false);

      const moves = await storage.listMovesByGame(game.id);
      expect(moves).toHaveLength(0);

      const updated = await storage.getGame(game.id);
      expect(updated?.moveCount).toBe(0);
    });

    it("makes a valid move and saves to storage", async () => {
      const game = await storage.createGame({
        whitePlayerId: "white-player",
        blackPlayerId: "black-player",
        status: "ACTIVE",
        fen: INITIAL_FEN,
        pgn: "",
        timeControl: "BLITZ_5",
        whiteTimeMs: 300_000,
        blackTimeMs: 300_000,
        winnerId: null,
        result: null,
        eloChanges: null,
        moveCount: 0,
      });
      const moveResult = makeMoveResult();
      const gameState = makeGameState();

      mockEngine.createGame.mockReturnValue({});
      mockEngine.makeMove.mockReturnValue(moveResult);
      mockEngine.getGameState.mockReturnValue(gameState);

      const result = await makeGameMove(game.id, "white-player", "e2", "e4");

      expect(result.success).toBe(true);

      const moves = await storage.listMovesByGame(game.id);
      expect(moves).toHaveLength(1);
      expect(moves[0]?.san).toBe("e4");
      expect(moves[0]?.from).toBe("e2");
      expect(moves[0]?.to).toBe("e4");
      expect(moves[0]?.playerId).toBe("white-player");
      expect(moves[0]?.moveNumber).toBe(1);
    });

    it("rejects if not player's turn (wrong player for current move count)", async () => {
      const game = await storage.createGame({
        whitePlayerId: "white-player",
        blackPlayerId: "black-player",
        status: "ACTIVE",
        fen: INITIAL_FEN,
        pgn: "",
        timeControl: "BLITZ_5",
        whiteTimeMs: 300_000,
        blackTimeMs: 300_000,
        winnerId: null,
        result: null,
        eloChanges: null,
        moveCount: 0,
      });

      await expect(makeGameMove(game.id, "black-player", "e7", "e5")).rejects.toThrow(
        "Not your turn",
      );
    });

    it("rejects if not black player's turn", async () => {
      const game = await storage.createGame({
        whitePlayerId: "white-player",
        blackPlayerId: "black-player",
        status: "ACTIVE",
        fen: INITIAL_FEN,
        pgn: "",
        timeControl: "BLITZ_5",
        whiteTimeMs: 300_000,
        blackTimeMs: 300_000,
        winnerId: null,
        result: null,
        eloChanges: null,
        moveCount: 1,
      });

      await expect(makeGameMove(game.id, "white-player", "e2", "e4")).rejects.toThrow(
        "Not your turn",
      );
    });

    it("updates game status on check", async () => {
      const game = await storage.createGame({
        whitePlayerId: "white-player",
        blackPlayerId: "black-player",
        status: "ACTIVE",
        fen: INITIAL_FEN,
        pgn: "",
        timeControl: "BLITZ_5",
        whiteTimeMs: 300_000,
        blackTimeMs: 300_000,
        winnerId: null,
        result: null,
        eloChanges: null,
        moveCount: 0,
      });
      const moveResult = makeMoveResult({ isCheck: true });
      const gameState = makeGameState({ isCheck: true });

      mockEngine.createGame.mockReturnValue({});
      mockEngine.makeMove.mockReturnValue(moveResult);
      mockEngine.getGameState.mockReturnValue(gameState);

      await makeGameMove(game.id, "white-player", "e2", "e4");

      const updated = await storage.getGame(game.id);
      expect(updated?.status).toBe("CHECK");
    });

    it("rejects if game is not ACTIVE", async () => {
      const game = await storage.createGame({
        whitePlayerId: "white-player",
        blackPlayerId: "black-player",
        status: "CHECKMATE",
        fen: INITIAL_FEN,
        pgn: "",
        timeControl: "BLITZ_5",
        whiteTimeMs: 300_000,
        blackTimeMs: 300_000,
        winnerId: null,
        result: null,
        eloChanges: null,
        moveCount: 0,
      });

      await expect(makeGameMove(game.id, "white-player", "e2", "e4")).rejects.toThrow(
        "Game is not active",
      );
    });

    it("updates game status on checkmate", async () => {
      const game = await storage.createGame({
        whitePlayerId: "white-player",
        blackPlayerId: "black-player",
        status: "ACTIVE",
        fen: INITIAL_FEN,
        pgn: "",
        timeControl: "BLITZ_5",
        whiteTimeMs: 300_000,
        blackTimeMs: 300_000,
        winnerId: null,
        result: null,
        eloChanges: null,
        moveCount: 0,
      });
      const moveResult = makeMoveResult({ isCheckmate: true, isGameOver: true });
      const gameState = makeGameState({ isCheckmate: true, isGameOver: true });

      mockEngine.createGame.mockReturnValue({});
      mockEngine.makeMove.mockReturnValue(moveResult);
      mockEngine.getGameState.mockReturnValue(gameState);
      mockElo.calculateEloChange.mockReturnValue({
        whiteNewElo: 1216,
        blackNewElo: 1184,
        whiteChange: 16,
        blackChange: -16,
      });

      await makeGameMove(game.id, "white-player", "e2", "e4");

      const updated = await storage.getGame(game.id);
      expect(updated?.status).toBe("CHECKMATE");
    });

    it("updates game status on stalemate", async () => {
      const game = await storage.createGame({
        whitePlayerId: "white-player",
        blackPlayerId: "black-player",
        status: "ACTIVE",
        fen: INITIAL_FEN,
        pgn: "",
        timeControl: "BLITZ_5",
        whiteTimeMs: 300_000,
        blackTimeMs: 300_000,
        winnerId: null,
        result: null,
        eloChanges: null,
        moveCount: 0,
      });
      const moveResult = makeMoveResult({ isStalemate: true, isGameOver: true, isDraw: true });
      const gameState = makeGameState({ isStalemate: true, isGameOver: true, isDraw: true });

      mockEngine.createGame.mockReturnValue({});
      mockEngine.makeMove.mockReturnValue(moveResult);
      mockEngine.getGameState.mockReturnValue(gameState);
      mockElo.calculateEloChange.mockReturnValue({
        whiteNewElo: 1200,
        blackNewElo: 1200,
        whiteChange: 0,
        blackChange: 0,
      });

      await makeGameMove(game.id, "white-player", "e2", "e4");

      const updated = await storage.getGame(game.id);
      expect(updated?.status).toBe("STALEMATE");
    });

    it("updates game status on draw", async () => {
      const game = await storage.createGame({
        whitePlayerId: "white-player",
        blackPlayerId: "black-player",
        status: "ACTIVE",
        fen: INITIAL_FEN,
        pgn: "",
        timeControl: "BLITZ_5",
        whiteTimeMs: 300_000,
        blackTimeMs: 300_000,
        winnerId: null,
        result: null,
        eloChanges: null,
        moveCount: 0,
      });
      const moveResult = makeMoveResult({ isDraw: true, isGameOver: true });
      const gameState = makeGameState({ isDraw: true, isGameOver: true });

      mockEngine.createGame.mockReturnValue({});
      mockEngine.makeMove.mockReturnValue(moveResult);
      mockEngine.getGameState.mockReturnValue(gameState);
      mockElo.calculateEloChange.mockReturnValue({
        whiteNewElo: 1200,
        blackNewElo: 1200,
        whiteChange: 0,
        blackChange: 0,
      });

      await makeGameMove(game.id, "white-player", "e2", "e4");

      const updated = await storage.getGame(game.id);
      expect(updated?.status).toBe("DRAW");
    });

    it("saves move record with correct data", async () => {
      const game = await storage.createGame({
        whitePlayerId: "white-player",
        blackPlayerId: "black-player",
        status: "ACTIVE",
        fen: INITIAL_FEN,
        pgn: "",
        timeControl: "BLITZ_5",
        whiteTimeMs: 300_000,
        blackTimeMs: 300_000,
        winnerId: null,
        result: null,
        eloChanges: null,
        moveCount: 1,
      });
      const moveResult = makeMoveResult({ san: "e5", from: "e7", to: "e5" });
      const gameState = makeGameState();

      mockEngine.createGame.mockReturnValue({});
      mockEngine.makeMove.mockReturnValue(moveResult);
      mockEngine.getGameState.mockReturnValue(gameState);

      await makeGameMove(game.id, "black-player", "e7", "e5");

      const moves = await storage.listMovesByGame(game.id);
      expect(moves).toHaveLength(1);
      expect(moves[0]?.moveNumber).toBe(2);
      expect(moves[0]?.san).toBe("e5");
      expect(moves[0]?.from).toBe("e7");
      expect(moves[0]?.to).toBe("e5");
      expect(moves[0]?.playerId).toBe("black-player");
    });

    it("increments moveCount", async () => {
      const game = await storage.createGame({
        whitePlayerId: "white-player",
        blackPlayerId: "black-player",
        status: "ACTIVE",
        fen: INITIAL_FEN,
        pgn: "",
        timeControl: "BLITZ_5",
        whiteTimeMs: 300_000,
        blackTimeMs: 300_000,
        winnerId: null,
        result: null,
        eloChanges: null,
        moveCount: 3,
      });
      const moveResult = makeMoveResult();
      const gameState = makeGameState();

      mockEngine.createGame.mockReturnValue({});
      mockEngine.makeMove.mockReturnValue(moveResult);
      mockEngine.getGameState.mockReturnValue(gameState);

      await makeGameMove(game.id, "black-player", "e7", "e5");

      const updated = await storage.getGame(game.id);
      expect(updated?.moveCount).toBe(4);
    });

    it("calls finalizeGame on game over (checkmate — winner is the moving player)", async () => {
      const whitePlayer = await storage.createPlayer({
        userId: "user-white",
        name: "White",
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
      const blackPlayer = await storage.createPlayer({
        userId: "user-black",
        name: "Black",
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

      const game = await storage.createGame({
        whitePlayerId: whitePlayer.id,
        blackPlayerId: blackPlayer.id,
        status: "ACTIVE",
        fen: INITIAL_FEN,
        pgn: "",
        timeControl: "BLITZ_5",
        whiteTimeMs: 300_000,
        blackTimeMs: 300_000,
        winnerId: null,
        result: null,
        eloChanges: null,
        moveCount: 0,
      });

      const moveResult = makeMoveResult({ isCheckmate: true, isGameOver: true });
      const gameState = makeGameState({ isCheckmate: true, isGameOver: true });

      mockEngine.createGame.mockReturnValue({});
      mockEngine.makeMove.mockReturnValue(moveResult);
      mockEngine.getGameState.mockReturnValue(gameState);
      mockElo.calculateEloChange.mockReturnValue({
        whiteNewElo: 1216,
        blackNewElo: 1184,
        whiteChange: 16,
        blackChange: -16,
      });

      await makeGameMove(game.id, whitePlayer.id, "e2", "e4");

      expect(mockElo.calculateEloChange).toHaveBeenCalledWith(1200, 1200, "white");

      const finalGame = await storage.getGame(game.id);
      expect(finalGame?.result).toBe("white");
      expect(finalGame?.winnerId).toBe(whitePlayer.id);
    });

    it("calls finalizeGame on game over (black checkmate)", async () => {
      const whitePlayer = await storage.createPlayer({
        userId: "user-white",
        name: "White",
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
      const blackPlayer = await storage.createPlayer({
        userId: "user-black",
        name: "Black",
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

      const game = await storage.createGame({
        whitePlayerId: whitePlayer.id,
        blackPlayerId: blackPlayer.id,
        status: "ACTIVE",
        fen: INITIAL_FEN,
        pgn: "",
        timeControl: "BLITZ_5",
        whiteTimeMs: 300_000,
        blackTimeMs: 300_000,
        winnerId: null,
        result: null,
        eloChanges: null,
        moveCount: 1,
      });

      const moveResult = makeMoveResult({ isCheckmate: true, isGameOver: true });
      const gameState = makeGameState({ isCheckmate: true, isGameOver: true });

      mockEngine.createGame.mockReturnValue({});
      mockEngine.makeMove.mockReturnValue(moveResult);
      mockEngine.getGameState.mockReturnValue(gameState);
      mockElo.calculateEloChange.mockReturnValue({
        whiteNewElo: 1184,
        blackNewElo: 1216,
        whiteChange: -16,
        blackChange: 16,
      });

      await makeGameMove(game.id, blackPlayer.id, "e7", "e5");

      expect(mockElo.calculateEloChange).toHaveBeenCalledWith(1200, 1200, "black");

      const finalGame = await storage.getGame(game.id);
      expect(finalGame?.result).toBe("black");
      expect(finalGame?.winnerId).toBe(blackPlayer.id);
    });
  });

  describe("getGame", () => {
    it("throws if game not found", async () => {
      await expect(getGame("nonexistent")).rejects.toThrow("Game not found");
    });

    it("returns game with moves", async () => {
      const game = await storage.createGame({
        whitePlayerId: "white-player",
        blackPlayerId: "black-player",
        status: "ACTIVE",
        fen: INITIAL_FEN,
        pgn: "",
        timeControl: "BLITZ_5",
        whiteTimeMs: 300_000,
        blackTimeMs: 300_000,
        winnerId: null,
        result: null,
        eloChanges: null,
        moveCount: 0,
      });

      const result = await getGame(game.id);

      expect(result.id).toBe(game.id);
      expect(result.moves).toBeDefined();
      expect(Array.isArray(result.moves)).toBe(true);
    });
  });

  describe("listGames", () => {
    it("lists games for a player", async () => {
      await storage.createGame({
        whitePlayerId: "white-player",
        blackPlayerId: "black-player",
        status: "ACTIVE",
        fen: INITIAL_FEN,
        pgn: "",
        timeControl: "BLITZ_5",
        whiteTimeMs: 300_000,
        blackTimeMs: 300_000,
        winnerId: null,
        result: null,
        eloChanges: null,
        moveCount: 0,
      });

      const result = await listGames("white-player");

      expect(result).toHaveLength(1);
    });

    it("filters by status", async () => {
      await storage.createGame({
        whitePlayerId: "white-player",
        blackPlayerId: "black-player",
        status: "ACTIVE",
        fen: INITIAL_FEN,
        pgn: "",
        timeControl: "BLITZ_5",
        whiteTimeMs: 300_000,
        blackTimeMs: 300_000,
        winnerId: null,
        result: null,
        eloChanges: null,
        moveCount: 0,
      });
      await storage.createGame({
        whitePlayerId: "white-player",
        blackPlayerId: "black-player",
        status: "CHECKMATE",
        fen: INITIAL_FEN,
        pgn: "",
        timeControl: "BLITZ_5",
        whiteTimeMs: 300_000,
        blackTimeMs: 300_000,
        winnerId: "white-player",
        result: "white",
        eloChanges: null,
        moveCount: 20,
      });

      const activeGames = await listGames("white-player", "ACTIVE");

      expect(activeGames).toHaveLength(1);
      expect(activeGames[0]?.status).toBe("ACTIVE");
    });
  });

  describe("resignGame", () => {
    it("sets status to RESIGNED and correct winner when white resigns", async () => {
      const whitePlayer = await storage.createPlayer({
        userId: "user-white",
        name: "White",
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
      const blackPlayer = await storage.createPlayer({
        userId: "user-black",
        name: "Black",
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

      const game = await storage.createGame({
        whitePlayerId: whitePlayer.id,
        blackPlayerId: blackPlayer.id,
        status: "ACTIVE",
        fen: INITIAL_FEN,
        pgn: "",
        timeControl: "BLITZ_5",
        whiteTimeMs: 300_000,
        blackTimeMs: 300_000,
        winnerId: null,
        result: null,
        eloChanges: null,
        moveCount: 0,
      });

      mockElo.calculateEloChange.mockReturnValue({
        whiteNewElo: 1184,
        blackNewElo: 1216,
        whiteChange: -16,
        blackChange: 16,
      });

      await resignGame(game.id, whitePlayer.id);

      const updated = await storage.getGame(game.id);
      expect(updated?.status).toBe("RESIGNED");
      expect(updated?.winnerId).toBe(blackPlayer.id);
    });

    it("sets status to RESIGNED and correct winner when black resigns", async () => {
      const game = await storage.createGame({
        whitePlayerId: "white-player",
        blackPlayerId: "black-player",
        status: "ACTIVE",
        fen: INITIAL_FEN,
        pgn: "",
        timeControl: "BLITZ_5",
        whiteTimeMs: 300_000,
        blackTimeMs: 300_000,
        winnerId: null,
        result: null,
        eloChanges: null,
        moveCount: 0,
      });

      mockElo.calculateEloChange.mockReturnValue({
        whiteNewElo: 1216,
        blackNewElo: 1184,
        whiteChange: 16,
        blackChange: -16,
      });

      await resignGame(game.id, "black-player");

      const updated = await storage.getGame(game.id);
      expect(updated?.status).toBe("RESIGNED");
      expect(updated?.winnerId).toBe("white-player");
    });

    it("rejects if player is not in the game", async () => {
      const game = await storage.createGame({
        whitePlayerId: "white-player",
        blackPlayerId: "black-player",
        status: "ACTIVE",
        fen: INITIAL_FEN,
        pgn: "",
        timeControl: "BLITZ_5",
        whiteTimeMs: 300_000,
        blackTimeMs: 300_000,
        winnerId: null,
        result: null,
        eloChanges: null,
        moveCount: 0,
      });

      await expect(resignGame(game.id, "random-player")).rejects.toThrow(
        "Player is not in this game",
      );
    });

    it("throws if game not found", async () => {
      await expect(resignGame("nonexistent", "white-player")).rejects.toThrow("Game not found");
    });

    it("handles null blackPlayerId gracefully when white resigns (winnerId is null)", async () => {
      const game = await storage.createGame({
        whitePlayerId: "white-player",
        blackPlayerId: null,
        status: "ACTIVE",
        fen: INITIAL_FEN,
        pgn: "",
        timeControl: "BLITZ_5",
        whiteTimeMs: 300_000,
        blackTimeMs: 300_000,
        winnerId: null,
        result: null,
        eloChanges: null,
        moveCount: 0,
      });

      await resignGame(game.id, "white-player");

      const updated = await storage.getGame(game.id);
      expect(updated?.status).toBe("RESIGNED");
      expect(updated?.winnerId).toBeNull();
    });
  });

  describe("offerDraw", () => {
    it("returns { offered: true } for valid game and player", async () => {
      const game = await storage.createGame({
        whitePlayerId: "white-player",
        blackPlayerId: "black-player",
        status: "ACTIVE",
        fen: INITIAL_FEN,
        pgn: "",
        timeControl: "BLITZ_5",
        whiteTimeMs: 300_000,
        blackTimeMs: 300_000,
        winnerId: null,
        result: null,
        eloChanges: null,
        moveCount: 0,
      });

      const result = await offerDraw(game.id, "white-player");
      expect(result).toEqual({ offered: true });
    });

    it("throws if game not found", async () => {
      await expect(offerDraw("nonexistent", "white-player")).rejects.toThrow("Game not found");
    });

    it("throws if game is not active", async () => {
      const game = await storage.createGame({
        whitePlayerId: "white-player",
        blackPlayerId: "black-player",
        status: "CHECKMATE",
        fen: INITIAL_FEN,
        pgn: "",
        timeControl: "BLITZ_5",
        whiteTimeMs: 300_000,
        blackTimeMs: 300_000,
        winnerId: null,
        result: null,
        eloChanges: null,
        moveCount: 0,
      });

      await expect(offerDraw(game.id, "white-player")).rejects.toThrow("Game is not active");
    });

    it("throws if player is not in the game", async () => {
      const game = await storage.createGame({
        whitePlayerId: "white-player",
        blackPlayerId: "black-player",
        status: "ACTIVE",
        fen: INITIAL_FEN,
        pgn: "",
        timeControl: "BLITZ_5",
        whiteTimeMs: 300_000,
        blackTimeMs: 300_000,
        winnerId: null,
        result: null,
        eloChanges: null,
        moveCount: 0,
      });

      await expect(offerDraw(game.id, "random-player")).rejects.toThrow(
        "Player is not in this game",
      );
    });
  });

  describe("declineDraw", () => {
    it("returns { declined: true } for valid game and player", async () => {
      const game = await storage.createGame({
        whitePlayerId: "white-player",
        blackPlayerId: "black-player",
        status: "ACTIVE",
        fen: INITIAL_FEN,
        pgn: "",
        timeControl: "BLITZ_5",
        whiteTimeMs: 300_000,
        blackTimeMs: 300_000,
        winnerId: null,
        result: null,
        eloChanges: null,
        moveCount: 0,
      });

      const result = await declineDraw(game.id, "black-player");
      expect(result).toEqual({ declined: true });
    });

    it("throws if game not found", async () => {
      await expect(declineDraw("nonexistent", "white-player")).rejects.toThrow("Game not found");
    });

    it("throws if game is not active", async () => {
      const game = await storage.createGame({
        whitePlayerId: "white-player",
        blackPlayerId: "black-player",
        status: "DRAW",
        fen: INITIAL_FEN,
        pgn: "",
        timeControl: "BLITZ_5",
        whiteTimeMs: 300_000,
        blackTimeMs: 300_000,
        winnerId: null,
        result: "draw",
        eloChanges: null,
        moveCount: 0,
      });

      await expect(declineDraw(game.id, "white-player")).rejects.toThrow("Game is not active");
    });

    it("throws if player is not in the game", async () => {
      const game = await storage.createGame({
        whitePlayerId: "white-player",
        blackPlayerId: "black-player",
        status: "ACTIVE",
        fen: INITIAL_FEN,
        pgn: "",
        timeControl: "BLITZ_5",
        whiteTimeMs: 300_000,
        blackTimeMs: 300_000,
        winnerId: null,
        result: null,
        eloChanges: null,
        moveCount: 0,
      });

      await expect(declineDraw(game.id, "random-player")).rejects.toThrow(
        "Player is not in this game",
      );
    });
  });

  describe("acceptDraw", () => {
    it("sets status to DRAW", async () => {
      const whitePlayer = await storage.createPlayer({
        userId: "user-white",
        name: "White",
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
      const blackPlayer = await storage.createPlayer({
        userId: "user-black",
        name: "Black",
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

      const game = await storage.createGame({
        whitePlayerId: whitePlayer.id,
        blackPlayerId: blackPlayer.id,
        status: "DRAW_OFFERED",
        fen: INITIAL_FEN,
        pgn: "",
        timeControl: "BLITZ_5",
        whiteTimeMs: 300_000,
        blackTimeMs: 300_000,
        winnerId: null,
        result: null,
        eloChanges: null,
        moveCount: 0,
      });

      mockElo.calculateEloChange.mockReturnValue({
        whiteNewElo: 1200,
        blackNewElo: 1200,
        whiteChange: 0,
        blackChange: 0,
      });

      await acceptDraw(game.id, whitePlayer.id);

      const updated = await storage.getGame(game.id);
      expect(updated?.status).toBe("DRAW");
    });

    it("calls finalizeGame with 'draw'", async () => {
      const whitePlayer = await storage.createPlayer({
        userId: "user-white",
        name: "White",
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
      const blackPlayer = await storage.createPlayer({
        userId: "user-black",
        name: "Black",
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

      const game = await storage.createGame({
        whitePlayerId: whitePlayer.id,
        blackPlayerId: blackPlayer.id,
        status: "DRAW_OFFERED",
        fen: INITIAL_FEN,
        pgn: "",
        timeControl: "BLITZ_5",
        whiteTimeMs: 300_000,
        blackTimeMs: 300_000,
        winnerId: null,
        result: null,
        eloChanges: null,
        moveCount: 0,
      });

      mockElo.calculateEloChange.mockReturnValue({
        whiteNewElo: 1200,
        blackNewElo: 1200,
        whiteChange: 0,
        blackChange: 0,
      });

      await acceptDraw(game.id, whitePlayer.id);

      expect(mockElo.calculateEloChange).toHaveBeenCalledWith(1200, 1200, "draw");

      const finalGame = await storage.getGame(game.id);
      expect(finalGame?.result).toBe("draw");
    });
  });

  describe("getGameReplay", () => {
    it("returns moves, pgn, and result", async () => {
      const game = await storage.createGame({
        whitePlayerId: "white-player",
        blackPlayerId: "black-player",
        status: "CHECKMATE",
        fen: "some-fen",
        pgn: "1. e4 e5",
        timeControl: "BLITZ_5",
        whiteTimeMs: 300_000,
        blackTimeMs: 300_000,
        winnerId: "white-player",
        result: "white",
        eloChanges: null,
        moveCount: 2,
      });
      await storage.createMove({
        gameId: game.id,
        moveNumber: 1,
        san: "e4",
        from: "e2",
        to: "e4",
        fen: "some-fen",
        playerId: "white-player",
        timeSpentMs: null,
      });

      const result = await getGameReplay(game.id);

      expect(result.pgn).toBe("1. e4 e5");
      expect(result.result).toBe("white");
      expect(result.moves).toHaveLength(1);
      expect(result.moves[0]?.san).toBe("e4");
    });

    it("returns empty moves array if no moves yet", async () => {
      const game = await storage.createGame({
        whitePlayerId: "white-player",
        blackPlayerId: "black-player",
        status: "WAITING",
        fen: INITIAL_FEN,
        pgn: "",
        timeControl: "BLITZ_5",
        whiteTimeMs: 300_000,
        blackTimeMs: 300_000,
        winnerId: null,
        result: null,
        eloChanges: null,
        moveCount: 0,
      });

      const result = await getGameReplay(game.id);

      expect(result.moves).toHaveLength(0);
      expect(result.pgn).toBe("");
      expect(result.result).toBeNull();
    });

    it("throws if game not found", async () => {
      await expect(getGameReplay("nonexistent")).rejects.toThrow("Game not found");
    });
  });

  describe("handleTimeExpiry", () => {
    it("sets correct winner (opposite player) when white times out", async () => {
      const whitePlayer = await storage.createPlayer({
        userId: "user-white",
        name: "White",
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
      const blackPlayer = await storage.createPlayer({
        userId: "user-black",
        name: "Black",
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

      const game = await storage.createGame({
        whitePlayerId: whitePlayer.id,
        blackPlayerId: blackPlayer.id,
        status: "ACTIVE",
        fen: INITIAL_FEN,
        pgn: "",
        timeControl: "BLITZ_5",
        whiteTimeMs: 0,
        blackTimeMs: 300_000,
        winnerId: null,
        result: null,
        eloChanges: null,
        moveCount: 0,
      });

      mockElo.calculateEloChange.mockReturnValue({
        whiteNewElo: 1184,
        blackNewElo: 1216,
        whiteChange: -16,
        blackChange: 16,
      });

      await handleTimeExpiry(game.id, whitePlayer.id);

      const updated = await storage.getGame(game.id);
      expect(updated?.status).toBe("EXPIRED");
      expect(updated?.winnerId).toBe(blackPlayer.id);
    });

    it("sets correct winner when black player times out", async () => {
      const game = await storage.createGame({
        whitePlayerId: "white-player",
        blackPlayerId: "black-player",
        status: "ACTIVE",
        fen: INITIAL_FEN,
        pgn: "",
        timeControl: "BLITZ_5",
        whiteTimeMs: 300_000,
        blackTimeMs: 0,
        winnerId: null,
        result: null,
        eloChanges: null,
        moveCount: 0,
      });

      mockElo.calculateEloChange.mockReturnValue({
        whiteNewElo: 1216,
        blackNewElo: 1184,
        whiteChange: 16,
        blackChange: -16,
      });

      await handleTimeExpiry(game.id, "black-player");

      const updated = await storage.getGame(game.id);
      expect(updated?.status).toBe("EXPIRED");
      expect(updated?.winnerId).toBe("white-player");
    });

    it("throws if game not found", async () => {
      await expect(handleTimeExpiry("nonexistent", "white-player")).rejects.toThrow(
        "Game not found",
      );
    });

    it("handles null blackPlayerId gracefully when white times out (winnerId is null)", async () => {
      const game = await storage.createGame({
        whitePlayerId: "white-player",
        blackPlayerId: null,
        status: "ACTIVE",
        fen: INITIAL_FEN,
        pgn: "",
        timeControl: "BLITZ_5",
        whiteTimeMs: 0,
        blackTimeMs: 300_000,
        winnerId: null,
        result: null,
        eloChanges: null,
        moveCount: 0,
      });

      await handleTimeExpiry(game.id, "white-player");

      const updated = await storage.getGame(game.id);
      expect(updated?.status).toBe("EXPIRED");
      expect(updated?.winnerId).toBeNull();
    });
  });

  describe("finalizeGame", () => {
    it("calculates ELO changes", async () => {
      const whitePlayer = await storage.createPlayer({
        userId: "user-white",
        name: "White",
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
      const blackPlayer = await storage.createPlayer({
        userId: "user-black",
        name: "Black",
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

      const game = await storage.createGame({
        whitePlayerId: whitePlayer.id,
        blackPlayerId: blackPlayer.id,
        status: "CHECKMATE",
        fen: INITIAL_FEN,
        pgn: "",
        timeControl: "BLITZ_5",
        whiteTimeMs: 300_000,
        blackTimeMs: 300_000,
        winnerId: whitePlayer.id,
        result: null,
        eloChanges: null,
        moveCount: 0,
      });

      mockElo.calculateEloChange.mockReturnValue({
        whiteNewElo: 1216,
        blackNewElo: 1184,
        whiteChange: 16,
        blackChange: -16,
      });

      await finalizeGame(game.id, "white", whitePlayer.id);

      expect(mockElo.calculateEloChange).toHaveBeenCalledWith(1200, 1200, "white");
    });

    it("returns early if game not found", async () => {
      await finalizeGame("nonexistent", "white");

      expect(mockElo.calculateEloChange).not.toHaveBeenCalled();
    });

    it("returns early if blackPlayerId is missing", async () => {
      const game = await storage.createGame({
        whitePlayerId: "white-player",
        blackPlayerId: null,
        status: "WAITING",
        fen: INITIAL_FEN,
        pgn: "",
        timeControl: "BLITZ_5",
        whiteTimeMs: 300_000,
        blackTimeMs: 300_000,
        winnerId: null,
        result: null,
        eloChanges: null,
        moveCount: 0,
      });

      await finalizeGame(game.id, "white");

      expect(mockElo.calculateEloChange).not.toHaveBeenCalled();
    });

    it("returns early if players not found", async () => {
      const game = await storage.createGame({
        whitePlayerId: "missing-white",
        blackPlayerId: "missing-black",
        status: "CHECKMATE",
        fen: INITIAL_FEN,
        pgn: "",
        timeControl: "BLITZ_5",
        whiteTimeMs: 300_000,
        blackTimeMs: 300_000,
        winnerId: null,
        result: null,
        eloChanges: null,
        moveCount: 0,
      });

      await finalizeGame(game.id, "white");

      expect(mockElo.calculateEloChange).not.toHaveBeenCalled();
    });

    it("updates both players' ELO", async () => {
      const whitePlayer = await storage.createPlayer({
        userId: "user-white",
        name: "White",
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
      const blackPlayer = await storage.createPlayer({
        userId: "user-black",
        name: "Black",
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

      const game = await storage.createGame({
        whitePlayerId: whitePlayer.id,
        blackPlayerId: blackPlayer.id,
        status: "CHECKMATE",
        fen: INITIAL_FEN,
        pgn: "",
        timeControl: "BLITZ_5",
        whiteTimeMs: 300_000,
        blackTimeMs: 300_000,
        winnerId: whitePlayer.id,
        result: null,
        eloChanges: null,
        moveCount: 0,
      });

      mockElo.calculateEloChange.mockReturnValue({
        whiteNewElo: 1216,
        blackNewElo: 1184,
        whiteChange: 16,
        blackChange: -16,
      });

      await finalizeGame(game.id, "white", whitePlayer.id);

      const updatedWhite = await storage.getPlayer(whitePlayer.id);
      expect(updatedWhite?.elo).toBe(1216);

      const updatedBlack = await storage.getPlayer(blackPlayer.id);
      expect(updatedBlack?.elo).toBe(1184);
    });

    it("updates game with result and eloChanges", async () => {
      const whitePlayer = await storage.createPlayer({
        userId: "user-white",
        name: "White",
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
      const blackPlayer = await storage.createPlayer({
        userId: "user-black",
        name: "Black",
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

      const game = await storage.createGame({
        whitePlayerId: whitePlayer.id,
        blackPlayerId: blackPlayer.id,
        status: "CHECKMATE",
        fen: INITIAL_FEN,
        pgn: "",
        timeControl: "BLITZ_5",
        whiteTimeMs: 300_000,
        blackTimeMs: 300_000,
        winnerId: whitePlayer.id,
        result: null,
        eloChanges: null,
        moveCount: 0,
      });

      const eloChanges = {
        whiteNewElo: 1216,
        blackNewElo: 1184,
        whiteChange: 16,
        blackChange: -16,
      };
      mockElo.calculateEloChange.mockReturnValue(eloChanges);

      await finalizeGame(game.id, "white", whitePlayer.id);

      const updated = await storage.getGame(game.id);
      expect(updated?.result).toBe("white");
      expect(updated?.winnerId).toBe(whitePlayer.id);
      expect(updated?.eloChanges).toEqual(eloChanges);
    });
  });
});
