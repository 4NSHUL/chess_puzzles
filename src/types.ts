export type PlayerColor = "w" | "b";

export type PuzzleDifficulty = "Beginner" | "Intermediate" | "Advanced";

export interface Puzzle {
  id: string;
  fen: string;
  sideToMove: PlayerColor;
  solution: string[];
  rating: number;
  difficulty: PuzzleDifficulty;
  themes: string[];
  hint?: string;
  explanation?: string;
}

export type PuzzleStatus =
  | "idle"
  | "correct"
  | "mistake"
  | "solved"
  | "skipped"
  | "solution";

export interface PuzzleRunState {
  fen: string;
  moveIndex: number;
  mistakes: number;
  status: PuzzleStatus;
  completed: boolean;
}

export type PuzzleOutcome = "solved" | "failed" | "skipped";

export interface PuzzleStatsSnapshot {
  solvedIds: string[];
  failedIds: string[];
  skippedIds: string[];
  streak: number;
  bestStreak: number;
}

export interface PuzzleFilters {
  difficulties: PuzzleDifficulty[];
  themes: string[];
  ratingMax: number;
}
