"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import GameMode from "./components/GameMode";
import ModeSelect from "./components/ModeSelect";
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
import type { AppMode, Puzzle, PuzzleFilters, PuzzleOutcome } from "./types";

const puzzles = rawPuzzles as Puzzle[];

export default function App() {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [mode, setMode] = useState<AppMode>("menu");
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
      setMode(getInitialMode());
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
    setMode(getInitialMode());
  }, []);

  const handleLogout = useCallback(() => {
    clearCurrentUser();
    setCurrentUser(null);
    setMode("menu");
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
  const openModeMenu = useCallback(() => {
    setMode("menu");
    updateModeUrl("menu");
  }, []);
  const selectMode = useCallback((nextMode: Exclude<AppMode, "menu">) => {
    setMode(nextMode);
    updateModeUrl(nextMode);
  }, []);

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

  if (mode === "menu") {
    return (
      <ModeSelect
        userName={currentUser}
        onSelectMode={selectMode}
        onLogout={handleLogout}
      />
    );
  }

  if (mode === "game") {
    return <GameMode userName={currentUser} onBack={openModeMenu} />;
  }

  return (
    <main className="app-shell">
      <PuzzleStats
        stats={stats}
        userName={currentUser}
        totalPuzzles={puzzles.length}
        visiblePuzzles={visiblePuzzles.length}
        onLogout={handleLogout}
        onOpenModes={openModeMenu}
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

function updateModeUrl(mode: AppMode) {
  if (typeof window === "undefined") {
    return;
  }

  const url = new URL(window.location.href);
  url.hash = "";

  if (mode === "menu") {
    url.searchParams.delete("mode");
    url.searchParams.delete("game");
  } else {
    url.searchParams.set("mode", mode);
    if (mode !== "game") {
      url.searchParams.delete("game");
    }
  }

  window.history.replaceState(null, "", url.toString());
}

function getInitialMode(): AppMode {
  if (typeof window === "undefined") {
    return "menu";
  }

  const searchParams = new URLSearchParams(window.location.search);
  const requestedMode = searchParams.get("mode");

  if (requestedMode === "game" || window.location.hash.startsWith("#game=")) {
    return "game";
  }

  if (requestedMode === "puzzle") {
    return "puzzle";
  }

  return "menu";
}
