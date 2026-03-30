import { describe, it, expect } from "vitest";
import { expectedScore, getKFactor, calculateEloChange } from "../core-logic/elo.js";

describe("expectedScore", () => {
  it("returns 0.5 for equal ratings", () => {
    expect(expectedScore(1200, 1200)).toBeCloseTo(0.5);
  });

  it("returns higher score for the higher-rated player", () => {
    const score = expectedScore(1600, 1200);
    expect(score).toBeGreaterThan(0.5);
    expect(score).toBeCloseTo(0.909, 2);
  });

  it("returns lower score for the lower-rated player", () => {
    const score = expectedScore(1200, 1600);
    expect(score).toBeLessThan(0.5);
    expect(score).toBeCloseTo(0.091, 2);
  });

  it("expected scores for two players sum to 1", () => {
    const a = expectedScore(1400, 1200);
    const b = expectedScore(1200, 1400);
    expect(a + b).toBeCloseTo(1.0);
  });

  it("works for extreme rating differences", () => {
    const score = expectedScore(3000, 100);
    expect(score).toBeGreaterThan(0.999);
  });
});

describe("getKFactor", () => {
  it("returns 40 for players with fewer than 30 games", () => {
    expect(getKFactor(1200, 0)).toBe(40);
    expect(getKFactor(1200, 29)).toBe(40);
  });

  it("returns 32 for standard players", () => {
    expect(getKFactor(1200, 30)).toBe(32);
    expect(getKFactor(2400, 100)).toBe(32);
  });

  it("returns 16 for elite players with ELO above 2400", () => {
    expect(getKFactor(2401, 50)).toBe(16);
    expect(getKFactor(3000, 500)).toBe(16);
  });

  it("elite threshold takes priority over new player threshold", () => {
    // ELO > 2400 wins, even if gamesPlayed < 30
    expect(getKFactor(2500, 10)).toBe(16);
  });
});

describe("calculateEloChange", () => {
  it("winner gains ELO, loser loses ELO when white wins", () => {
    const update = calculateEloChange(1200, 1200, "white");
    expect(update.whiteChange).toBeGreaterThan(0);
    expect(update.blackChange).toBeLessThan(0);
    expect(update.whiteNewElo).toBe(1200 + update.whiteChange);
    expect(update.blackNewElo).toBe(1200 + update.blackChange);
  });

  it("winner gains ELO, loser loses ELO when black wins", () => {
    const update = calculateEloChange(1200, 1200, "black");
    expect(update.blackChange).toBeGreaterThan(0);
    expect(update.whiteChange).toBeLessThan(0);
  });

  it("draw results in small adjustments between equal players", () => {
    const update = calculateEloChange(1200, 1200, "draw");
    expect(update.whiteChange).toBe(0);
    expect(update.blackChange).toBe(0);
  });

  it("underdog gains more ELO when they win", () => {
    const weakWins = calculateEloChange(1000, 2000, "white");
    const strongWins = calculateEloChange(2000, 1000, "white");
    expect(weakWins.whiteChange).toBeGreaterThan(strongWins.whiteChange);
  });

  it("favorite loses more ELO when the underdog wins", () => {
    const weakWins = calculateEloChange(1000, 2000, "white");
    expect(weakWins.blackChange).toBeLessThan(0);
    // Favorite loses a lot
    expect(Math.abs(weakWins.blackChange)).toBeGreaterThan(10);
  });

  it("respects K factor for new players (fewer than 30 games)", () => {
    const newPlayer = calculateEloChange(1200, 1200, "white", 5, 30);
    const standard = calculateEloChange(1200, 1200, "white", 30, 30);
    // New player has K=40 vs K=32, so gains more
    expect(newPlayer.whiteChange).toBeGreaterThan(standard.whiteChange);
  });

  it("ELO changes are integers", () => {
    const update = calculateEloChange(1350, 1450, "draw");
    expect(Number.isInteger(update.whiteChange)).toBe(true);
    expect(Number.isInteger(update.blackChange)).toBe(true);
  });
});
