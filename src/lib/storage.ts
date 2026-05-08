import type { PuzzleOutcome, PuzzleStatsSnapshot } from "../types";

const STORAGE_KEY = "chess-puzzle-reels.stats.v1";

export const EMPTY_STATS: PuzzleStatsSnapshot = {
  solvedIds: [],
  failedIds: [],
  skippedIds: [],
  streak: 0,
  bestStreak: 0
};

export function loadStats(): PuzzleStatsSnapshot {
  if (typeof window === "undefined") {
    return EMPTY_STATS;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return EMPTY_STATS;
    }

    return {
      ...EMPTY_STATS,
      ...JSON.parse(raw)
    };
  } catch {
    return EMPTY_STATS;
  }
}

export function saveStats(stats: PuzzleStatsSnapshot) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
}

export function updateStats(
  stats: PuzzleStatsSnapshot,
  puzzleId: string,
  outcome: PuzzleOutcome
): PuzzleStatsSnapshot {
  const solvedIds = new Set(stats.solvedIds);
  const failedIds = new Set(stats.failedIds);
  const skippedIds = new Set(stats.skippedIds);

  if (outcome === "solved") {
    const wasSolved = solvedIds.has(puzzleId);
    solvedIds.add(puzzleId);
    const streak = wasSolved ? stats.streak : stats.streak + 1;

    return {
      solvedIds: [...solvedIds],
      failedIds: [...failedIds],
      skippedIds: [...skippedIds],
      streak,
      bestStreak: Math.max(stats.bestStreak, streak)
    };
  }

  if (outcome === "failed") {
    failedIds.add(puzzleId);
  }

  if (outcome === "skipped") {
    skippedIds.add(puzzleId);
  }

  return {
    solvedIds: [...solvedIds],
    failedIds: [...failedIds],
    skippedIds: [...skippedIds],
    streak: 0,
    bestStreak: stats.bestStreak
  };
}
