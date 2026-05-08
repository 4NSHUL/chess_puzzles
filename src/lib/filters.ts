import type { Puzzle, PuzzleDifficulty, PuzzleFilters } from "../types";

export const DEFAULT_FILTERS: PuzzleFilters = {
  difficulties: ["Beginner", "Intermediate", "Advanced"],
  themes: [],
  ratingMax: 2200
};

export function getAvailableThemes(puzzles: Puzzle[]) {
  return [...new Set(puzzles.flatMap((puzzle) => puzzle.themes))].sort();
}

export function filterPuzzles(puzzles: Puzzle[], filters: PuzzleFilters) {
  return puzzles.filter((puzzle) => {
    const difficultyMatch = filters.difficulties.includes(puzzle.difficulty);
    const themeMatch =
      filters.themes.length === 0 ||
      puzzle.themes.some((theme) => filters.themes.includes(theme));

    return difficultyMatch && themeMatch && puzzle.rating <= filters.ratingMax;
  });
}

export function toggleDifficulty(
  filters: PuzzleFilters,
  difficulty: PuzzleDifficulty
): PuzzleFilters {
  const next = new Set(filters.difficulties);
  if (next.has(difficulty)) {
    next.delete(difficulty);
  } else {
    next.add(difficulty);
  }

  return {
    ...filters,
    difficulties: [...next]
  };
}

export function toggleTheme(filters: PuzzleFilters, theme: string): PuzzleFilters {
  const next = new Set(filters.themes);
  if (next.has(theme)) {
    next.delete(theme);
  } else {
    next.add(theme);
  }

  return {
    ...filters,
    themes: [...next]
  };
}
