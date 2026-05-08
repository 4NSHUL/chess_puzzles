"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import PuzzleFeed from "./components/PuzzleFeed";
import PuzzleStats from "./components/PuzzleStats";
import FilterPanel from "./components/FilterPanel";
import LoginPanel from "./components/LoginPanel";
import rawPuzzles from "./data/puzzles.json";
import { usePuzzleAudio } from "./hooks/usePuzzleAudio";
import { DEFAULT_FILTERS, filterPuzzles, getAvailableThemes } from "./lib/filters";
import {
  clearCurrentUser,
  EMPTY_STATS,
  loadCurrentUser,
  loadUserStats,
  normalizeUserName,
  saveCurrentUser,
  saveUserStats,
  updateStats
} from "./lib/storage";
import type { Puzzle, PuzzleFilters, PuzzleOutcome } from "./types";

const puzzles = rawPuzzles as Puzzle[];

export default function App() {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [stats, setStats] = useState(EMPTY_STATS);
  const [excludedSolvedIds, setExcludedSolvedIds] = useState<string[]>([]);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [filters, setFilters] = useState<PuzzleFilters>(DEFAULT_FILTERS);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const { soundEnabled, toggleSound, playPuzzleCue } = usePuzzleAudio();

  const availableThemes = useMemo(() => getAvailableThemes(puzzles), []);
  const solvedPuzzleIds = useMemo(
    () => new Set(excludedSolvedIds),
    [excludedSolvedIds]
  );
  const visiblePuzzles = useMemo(
    () =>
      filterPuzzles(puzzles, filters).filter(
        (puzzle) => !solvedPuzzleIds.has(puzzle.id)
      ),
    [filters, solvedPuzzleIds]
  );

  useEffect(() => {
    let active = true;

    async function hydrateUser() {
      const savedUser = loadCurrentUser();

      if (!savedUser) {
        setIsAuthReady(true);
        return;
      }

      const savedStats = await loadUserStats(savedUser);

      if (!active) {
        return;
      }

      setCurrentUser(savedUser);
      setStats(savedStats);
      setExcludedSolvedIds(savedStats.solvedIds);
      setIsAuthReady(true);
    }

    void hydrateUser();

    return () => {
      active = false;
    };
  }, []);

  const handleLogin = useCallback(async (userName: string) => {
    const normalizedUserName = normalizeUserName(userName);
    const savedStats = await loadUserStats(normalizedUserName);

    saveCurrentUser(normalizedUserName);
    setCurrentUser(normalizedUserName);
    setStats(savedStats);
    setExcludedSolvedIds(savedStats.solvedIds);
  }, []);

  const handleLogout = useCallback(() => {
    clearCurrentUser();
    setCurrentUser(null);
    setStats(EMPTY_STATS);
    setExcludedSolvedIds([]);
  }, []);

  const recordOutcome = useCallback((puzzleId: string, outcome: PuzzleOutcome) => {
    if (!currentUser) {
      return;
    }

    setStats((current) => {
      const next = updateStats(current, puzzleId, outcome);
      void saveUserStats(currentUser, next).catch(() => undefined);
      return next;
    });
  }, [currentUser]);

  const openFilters = useCallback(() => setIsFilterOpen(true), []);
  const closeFilters = useCallback(() => setIsFilterOpen(false), []);

  if (!isAuthReady) {
    return (
      <main className="login-screen" aria-live="polite">
        <div className="login-panel">
          <p className="eyebrow">Loading</p>
          <h1>Preparing your puzzle profile</h1>
        </div>
      </main>
    );
  }

  if (!currentUser) {
    return <LoginPanel onLogin={handleLogin} />;
  }

  return (
    <main className="app-shell">
      <PuzzleStats
        stats={stats}
        userName={currentUser}
        totalPuzzles={puzzles.length}
        visiblePuzzles={visiblePuzzles.length}
        onLogout={handleLogout}
      />

      <PuzzleFeed
        puzzles={visiblePuzzles}
        onOutcome={recordOutcome}
        onOpenFilters={openFilters}
        onSoundEvent={playPuzzleCue}
        onToggleSound={toggleSound}
        soundEnabled={soundEnabled}
      />

      <FilterPanel
        filters={filters}
        themes={availableThemes}
        open={isFilterOpen}
        onChange={setFilters}
        onClose={closeFilters}
      />
    </main>
  );
}
