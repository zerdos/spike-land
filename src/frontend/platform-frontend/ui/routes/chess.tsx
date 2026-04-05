/**
 * Chess Arena Route — /chess
 *
 * Tabs: Play, Leaderboard, My Games, Challenges
 */
import { useState, useCallback, useMemo, useEffect } from "react";
import { Navigate } from "@tanstack/react-router";
import { useAuth } from "../hooks/useAuth";
import { ChessBoard } from "../components/chess/ChessBoard";
import { GamePanel } from "../components/chess/GamePanel";
import { Matchmaking } from "../components/chess/Matchmaking";
import { Leaderboard } from "../components/chess/Leaderboard";
import { useChessEngine } from "../components/chess/useChessEngine";
import {
  useChessGame,
  useLeaderboard,
  useMyGames,
  useChallenges,
} from "../components/chess/useChessGame";
import type { ChessPlayer, GameState, TimeControl } from "../components/chess/chess-types";
import { TIME_CONTROL_LABELS } from "../components/chess/chess-types";

const INITIAL_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

// ─── Tab types ────────────────────────────────────────────────────────────────

type Tab = "play" | "leaderboard" | "my-games" | "challenges";

// ─── My Games Tab ────────────────────────────────────────────────────────────

function GameStatusBadge({ status }: { status: GameState["status"] }) {
  const map: Record<string, string> = {
    ACTIVE: "bg-success/10 text-success-foreground",
    CHECK: "bg-warning/10 text-warning-foreground",
    WAITING: "bg-info/10 text-info-foreground",
    CHECKMATE: "bg-destructive/10 text-destructive-foreground",
    STALEMATE: "bg-muted text-muted-foreground",
    DRAW: "bg-muted text-muted-foreground",
    RESIGNED: "bg-destructive/10 text-destructive-foreground",
    DRAW_OFFERED: "bg-warning/10 text-warning-foreground",
  };
  const labels: Record<string, string> = {
    ACTIVE: "Active",
    CHECK: "Check",
    WAITING: "Waiting",
    CHECKMATE: "Checkmate",
    STALEMATE: "Stalemate",
    DRAW: "Draw",
    RESIGNED: "Resigned",
    DRAW_OFFERED: "Draw offered",
  };
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${map[status] ?? "bg-muted text-muted-foreground"}`}
    >
      {labels[status] ?? status}
    </span>
  );
}

interface MyGamesTabProps {
  playerId: string | null;
  onOpenGame: (gameId: string) => void;
}

function MyGamesTab({ playerId, onOpenGame }: MyGamesTabProps) {
  const { games, isLoading, error } = useMyGames(playerId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-4 border-border border-t-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
        {error}
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted text-3xl">
          {"\u265A"}
        </div>
        <p className="text-sm text-muted-foreground">No games yet. Start playing!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {games.map((game) => {
        const isActive =
          game.status === "ACTIVE" || game.status === "CHECK" || game.status === "WAITING";
        return (
          <button
            key={game.id}
            type="button"
            onClick={() => onOpenGame(game.id)}
            className="w-full rounded-xl border border-border bg-card p-4 text-left transition-colors hover:bg-muted/40"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">
                    {game.whitePlayer?.name ?? "White"} vs {game.blackPlayer?.name ?? "Black"}
                  </span>
                  <GameStatusBadge status={game.status} />
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{TIME_CONTROL_LABELS[game.timeControl]}</span>
                  <span>·</span>
                  <span>{game.moveCount} moves</span>
                  {game.result && (
                    <>
                      <span>·</span>
                      <span className="capitalize">{game.result}</span>
                    </>
                  )}
                </div>
              </div>
              {isActive && (
                <span className="shrink-0 rounded-xl bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                  Play
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ─── Challenges Tab ───────────────────────────────────────────────────────────

interface ChallengesTabProps {
  playerId: string | null;
  onGameStarted: (gameId: string) => void;
}

function ChallengesTab({ playerId, onGameStarted }: ChallengesTabProps) {
  const { challenges, isLoading, error, acceptChallenge, declineChallenge } =
    useChallenges(playerId);

  const handleAccept = useCallback(
    async (challengeId: string, gameId: string | null) => {
      await acceptChallenge(challengeId);
      if (gameId) onGameStarted(gameId);
    },
    [acceptChallenge, onGameStarted],
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-4 border-border border-t-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
        {error}
      </div>
    );
  }

  if (challenges.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted text-3xl">
          {"\u2694\uFE0F"}
        </div>
        <p className="text-sm text-muted-foreground">No pending challenges</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {challenges.map((challenge) => (
        <div key={challenge.id} className="rounded-xl border border-border bg-card p-4">
          <div className="mb-3 flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-foreground">
                {challenge.sender?.name ?? challenge.senderId}
              </p>
              <p className="text-xs text-muted-foreground">
                {TIME_CONTROL_LABELS[challenge.timeControl]}
                {challenge.senderColor && ` · Sender plays ${challenge.senderColor}`}
              </p>
            </div>
            <span className="text-xs text-muted-foreground">
              Expires{" "}
              {new Date(challenge.expiresAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void handleAccept(challenge.id, challenge.gameId)}
              className="flex-1 rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Accept
            </button>
            <button
              type="button"
              onClick={() => void declineChallenge(challenge.id)}
              className="flex-1 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-1.5 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/10"
            >
              Decline
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Active Game View ─────────────────────────────────────────────────────────

interface ActiveGameViewProps {
  gameId: string;
  myPlayerId: string | null;
  onClose: () => void;
  onRematch: () => void;
}

function ActiveGameView({ gameId, myPlayerId, onClose, onRematch }: ActiveGameViewProps) {
  const {
    game,
    legalMoves,
    error,
    makeMove,
    resign,
    offerDraw,
    acceptDraw,
    declineDraw,
    clearError,
  } = useChessGame(gameId, myPlayerId);

  const myColor = useMemo(() => {
    if (!game || !myPlayerId) return null;
    if (game.whitePlayerId === myPlayerId) return "w" as const;
    if (game.blackPlayerId === myPlayerId) return "b" as const;
    return null;
  }, [game, myPlayerId]);

  const engine = useChessEngine({
    fen: game?.fen ?? INITIAL_FEN,
    legalMoves: game?.turn === myColor ? legalMoves : [],
    lastMoveFrom: game?.moves[game.moves.length - 1]?.from,
    lastMoveTo: game?.moves[game.moves.length - 1]?.to,
    flipped: myColor === "b",
    onMove: (from, to, promotion) => void makeMove(from, to, promotion),
  });

  const [showResultModal, setShowResultModal] = useState(true);

  if (!game) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary" />
      </div>
    );
  }

  const isCheck = game.status === "CHECK";
  const isGameOver = ["CHECKMATE", "STALEMATE", "DRAW", "RESIGNED"].includes(game.status);
  const isInteractive =
    (game.status === "ACTIVE" || game.status === "CHECK") && game.turn === myColor;

  const reasonMap: Record<string, "checkmate" | "stalemate" | "resignation" | "draw" | "timeout"> =
    {
      CHECKMATE: "checkmate",
      STALEMATE: "stalemate",
      RESIGNED: "resignation",
      DRAW: "draw",
    };

  const lastMove = game.moves[game.moves.length - 1];

  return (
    <div className="space-y-5">
      {/* Top bar */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold text-foreground transition-all hover:-translate-y-px hover:shadow-md"
          style={{
            borderColor: "color-mix(in srgb, hsl(var(--border)) 80%, transparent)",
            background: "color-mix(in srgb, hsl(var(--card)) 90%, transparent)",
          }}
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Arena
        </button>

        <span
          className="rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.2em]"
          style={{
            background: "color-mix(in srgb, hsl(var(--primary)) 10%, transparent)",
            color: "hsl(var(--primary))",
          }}
        >
          Live Game
        </span>

        {error && (
          <div className="flex flex-1 items-center justify-between rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-2 text-xs text-destructive">
            <span>{error}</span>
            <button
              type="button"
              onClick={clearError}
              className="ml-3 font-semibold hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      <GamePanel
        game={game}
        myPlayerId={myPlayerId}
        boardProps={{
          engine,
          fen: game.fen,
          lastMoveFrom: lastMove?.from,
          lastMoveTo: lastMove?.to,
          isCheck,
          interactive: isInteractive,
        }}
        resultModalProps={
          isGameOver && game.result && showResultModal
            ? {
                reason: reasonMap[game.status] ?? "draw",
                onClose: () => setShowResultModal(false),
                onRematch,
              }
            : undefined
        }
        onResign={() => void resign()}
        onOfferDraw={() => void offerDraw()}
        onAcceptDraw={() => void acceptDraw()}
        onDeclineDraw={() => void declineDraw()}
      />
    </div>
  );
}

// ─── Main Chess Page ──────────────────────────────────────────────────────────

export function ChessPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("play");
  const [activeGameId, setActiveGameId] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchingTimeControl, setSearchingTimeControl] = useState<TimeControl>("BLITZ_5");
  const [myPlayer, setMyPlayer] = useState<ChessPlayer | null>(null);
  const [playerLoading, setPlayerLoading] = useState(false);
  const [playerError, setPlayerError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    setPlayerLoading(true);
    setPlayerError(null);

    fetch("/api/chess/players/me", { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.text()) || res.statusText);
        return res.json() as Promise<ChessPlayer>;
      })
      .then((player) => {
        setMyPlayer(player);
      })
      .catch((err: unknown) => {
        setPlayerError(err instanceof Error ? err.message : "Failed to load chess profile");
      })
      .finally(() => {
        setPlayerLoading(false);
      });
  }, [isAuthenticated]);

  const myPlayerId: string | null = myPlayer?.id ?? null;

  const leaderboard = useLeaderboard();

  // ─── Matchmaking handlers ──────────────────────────────────────────────────

  const handleQuickPlay = useCallback(
    async (tc: TimeControl) => {
      setSearchingTimeControl(tc);
      setIsSearching(true);
      try {
        // POST to matchmaking endpoint — creates a game or joins waiting one
        const res = await fetch("/api/chess/matchmake", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ timeControl: tc, playerId: myPlayerId }),
        });
        if (!res.ok) throw new Error(await res.text());
        const data = (await res.json()) as { gameId: string };
        setIsSearching(false);
        setActiveGameId(data.gameId);
      } catch {
        setIsSearching(false);
      }
    },
    [myPlayerId],
  );

  const handleChallengeFriend = useCallback(
    async (username: string, tc: TimeControl) => {
      const res = await fetch("/api/chess/challenges", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senderUsername: username, timeControl: tc, playerId: myPlayerId }),
      });
      if (!res.ok) throw new Error(await res.text());
    },
    [myPlayerId],
  );

  const handleCancelSearch = useCallback(() => {
    setIsSearching(false);
  }, []);

  const handleChallengePlayer = useCallback(
    async (player: ChessPlayer) => {
      await handleChallengeFriend(player.name, "BLITZ_5");
    },
    [handleChallengeFriend],
  );

  const handleViewProfile = useCallback((_player: ChessPlayer) => {
    // TODO: navigate to player profile page
  }, []);

  const handleOpenGame = useCallback((gameId: string) => {
    setActiveGameId(gameId);
  }, []);

  const handleCloseGame = useCallback(() => {
    setActiveGameId(null);
  }, []);

  const handleRematch = useCallback(() => {
    // TODO: send challenge to same opponent
    setActiveGameId(null);
    setActiveTab("play");
  }, []);

  // ─── Auth guard ────────────────────────────────────────────────────────────

  if (authLoading || playerLoading) {
    return (
      <div className="flex h-[calc(100dvh-3.5rem)] items-center justify-center bg-background lg:h-[calc(100dvh-4.5rem)]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-border border-t-primary" />
            <span
              className="absolute inset-0 flex items-center justify-center text-lg"
              aria-hidden="true"
            >
              {"\u265A"}
            </span>
          </div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Loading Arena
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // ─── Active game override ─────────────────────────────────────────────────

  if (activeGameId) {
    return (
      <div
        className="min-h-[calc(100dvh-3.5rem)] lg:min-h-[calc(100dvh-4.5rem)]"
        style={{
          background:
            "radial-gradient(circle at top left, color-mix(in srgb, var(--primary-color, hsl(var(--primary))) 8%, transparent), transparent 40%), var(--bg, hsl(var(--background)))",
        }}
      >
        <div className="mx-auto max-w-6xl px-4 py-8 lg:px-6">
          <ActiveGameView
            gameId={activeGameId}
            myPlayerId={myPlayerId}
            onClose={handleCloseGame}
            onRematch={handleRematch}
          />
        </div>
      </div>
    );
  }

  // ─── Tab layout ───────────────────────────────────────────────────────────

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "play", label: "Play", icon: "\u265F" },
    { id: "leaderboard", label: "Leaderboard", icon: "\u2605" },
    { id: "my-games", label: "My Games", icon: "\u25A3" },
    { id: "challenges", label: "Challenges", icon: "\u2694\uFE0F" },
  ];

  return (
    <div
      className="min-h-[calc(100dvh-3.5rem)] lg:min-h-[calc(100dvh-4.5rem)]"
      style={{
        background:
          "radial-gradient(ellipse at 15% 0%, color-mix(in srgb, var(--primary-color, hsl(var(--primary))) 10%, transparent) 0%, transparent 50%), radial-gradient(ellipse at 85% 5%, color-mix(in srgb, var(--chat-accent, hsl(var(--primary))) 8%, transparent) 0%, transparent 40%), hsl(var(--background))",
      }}
    >
      {/* Ambient glow orbs */}
      <div
        className="pointer-events-none fixed left-0 top-0 h-[32rem] w-[32rem] rounded-full blur-[120px]"
        style={{ background: "color-mix(in srgb, hsl(var(--primary)) 6%, transparent)" }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-6xl px-4 py-8 lg:px-6">
        {/* Player profile error banner */}
        {playerError && (
          <div className="mb-6 rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            Could not load your chess profile: {playerError}. Some features may be limited.
          </div>
        )}

        {/* Header */}
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="mb-1 text-xs font-black uppercase tracking-[0.28em] text-muted-foreground">
              spike.land
            </p>
            <h1 className="text-4xl font-black tracking-tight text-foreground sm:text-5xl">
              Chess Arena
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Play, challenge, and climb the leaderboard
            </p>
          </div>

          {/* Decorative piece cluster */}
          <div className="hidden shrink-0 flex-col items-end gap-1 sm:flex" aria-hidden="true">
            <div className="flex gap-1">
              {["\u2656", "\u2658", "\u265B", "\u265A"].map((symbol, i) => (
                <span
                  key={i}
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-xl shadow-sm"
                  style={{
                    background:
                      i % 2 === 0
                        ? "color-mix(in srgb, hsl(var(--primary)) 12%, hsl(var(--card)))"
                        : "hsl(var(--card))",
                    border: "1px solid color-mix(in srgb, hsl(var(--border)) 80%, transparent)",
                  }}
                >
                  {symbol}
                </span>
              ))}
            </div>
            {myPlayer && (
              <p className="text-xs font-semibold text-muted-foreground">
                {myPlayer.name}
                {myPlayer.elo !== undefined && (
                  <span className="ml-2 font-black text-foreground">{myPlayer.elo} ELO</span>
                )}
              </p>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div
          className="mb-8 flex gap-1 rounded-2xl border p-1"
          role="tablist"
          aria-label="Chess arena sections"
          style={{
            borderColor: "color-mix(in srgb, hsl(var(--border)) 70%, transparent)",
            background: "color-mix(in srgb, hsl(var(--muted)) 40%, transparent)",
            backdropFilter: "blur(12px)",
          }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${
                activeTab === tab.id
                  ? "bg-card text-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="text-base leading-none">{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab panels */}
        <div role="tabpanel" aria-label={tabs.find((t) => t.id === activeTab)?.label}>
          {activeTab === "play" && (
            <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
              {/* Left — matchmaking */}
              <div className="space-y-5">
                <Matchmaking
                  onQuickPlay={handleQuickPlay}
                  onChallengeFriend={handleChallengeFriend}
                  isSearching={isSearching}
                  onCancelSearch={handleCancelSearch}
                  searchingTimeControl={isSearching ? searchingTimeControl : undefined}
                />

                {/* Demo board */}
                <div
                  className="rounded-[28px] border p-6"
                  style={{
                    borderColor: "color-mix(in srgb, hsl(var(--border)) 75%, transparent)",
                    background:
                      "linear-gradient(180deg, color-mix(in srgb, hsl(var(--card)) 95%, transparent), color-mix(in srgb, hsl(var(--muted)) 60%, transparent))",
                    boxShadow:
                      "0 20px 60px color-mix(in srgb, hsl(var(--foreground)) 6%, transparent)",
                  }}
                >
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.22em] text-muted-foreground">
                        starting position
                      </p>
                      <h2 className="mt-1 text-lg font-black tracking-tight text-foreground">
                        Board Preview
                      </h2>
                    </div>
                    <span
                      className="rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em]"
                      style={{
                        background: "color-mix(in srgb, hsl(var(--primary)) 12%, transparent)",
                        color: "hsl(var(--primary))",
                      }}
                    >
                      Interactive
                    </span>
                  </div>
                  <DemoBoard />
                </div>
              </div>

              {/* Right — online players (mini leaderboard) */}
              <div className="w-full">
                <Leaderboard
                  players={leaderboard.players.slice(0, 10)}
                  myPlayerId={myPlayerId}
                  isLoading={leaderboard.isLoading}
                  onChallenge={handleChallengePlayer}
                  onViewProfile={handleViewProfile}
                />
              </div>
            </div>
          )}

          {activeTab === "leaderboard" && (
            <Leaderboard
              players={leaderboard.players}
              myPlayerId={myPlayerId}
              isLoading={leaderboard.isLoading}
              onChallenge={handleChallengePlayer}
              onViewProfile={handleViewProfile}
            />
          )}

          {activeTab === "my-games" && (
            <MyGamesTab playerId={myPlayerId} onOpenGame={handleOpenGame} />
          )}

          {activeTab === "challenges" && (
            <ChallengesTab playerId={myPlayerId} onGameStarted={handleOpenGame} />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Demo Board ───────────────────────────────────────────────────────────────
// Shows the starting position, non-interactive, for visual interest on the Play tab.

function DemoBoard() {
  const engine = useChessEngine({
    fen: INITIAL_FEN,
    legalMoves: [],
    onMove: () => undefined,
  });

  return (
    <div
      className="flex justify-center rounded-2xl p-3"
      style={{
        background: "color-mix(in srgb, hsl(var(--muted)) 30%, transparent)",
      }}
    >
      <ChessBoard engine={engine} fen={INITIAL_FEN} interactive={false} />
    </div>
  );
}
