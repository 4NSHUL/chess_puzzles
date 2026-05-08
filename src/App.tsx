"use client";

import { useEffect, useMemo, useState } from "react";
import PuzzleFeed from "./components/PuzzleFeed";
import PuzzleStats from "./components/PuzzleStats";
import FilterPanel from "./components/FilterPanel";
import rawPuzzles from "./data/puzzles.json";
import { DEFAULT_FILTERS, filterPuzzles, getAvailableThemes } from "./lib/filters";
import { loadStats, saveStats, updateStats } from "./lib/storage";
import type { Puzzle, PuzzleFilters, PuzzleOutcome } from "./types";

const puzzles = rawPuzzles as Puzzle[];

export default function App() {
  const [stats, setStats] = useState(loadStats);
  const [filters, setFilters] = useState<PuzzleFilters>(DEFAULT_FILTERS);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const availableThemes = useMemo(() => getAvailableThemes(puzzles), []);
  const visiblePuzzles = useMemo(
    () => filterPuzzles(puzzles, filters),
    [filters]
  );

  useEffect(() => {
    saveStats(stats);
  }, [stats]);

  function recordOutcome(puzzleId: string, outcome: PuzzleOutcome) {
    setStats((current) => updateStats(current, puzzleId, outcome));
  }

  return (
    <main className="app-shell">
      <PuzzleStats
        stats={stats}
        totalPuzzles={puzzles.length}
        visiblePuzzles={visiblePuzzles.length}
      />

      <PuzzleFeed
        puzzles={visiblePuzzles}
        onOutcome={recordOutcome}
        onOpenFilters={() => setIsFilterOpen(true)}
      />

      <FilterPanel
        filters={filters}
        themes={availableThemes}
        open={isFilterOpen}
        onChange={setFilters}
        onClose={() => setIsFilterOpen(false)}
      />
    </main>
  );
}
