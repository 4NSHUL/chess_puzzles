export type PlayerColor = "w" | "b";
export type AppMode = "menu" | "puzzle" | "game";

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
  source?: {
    name: string;
    url?: string;
  };
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

export type ChessGameStatus = "active" | "checkmate" | "draw" | "stalemate";

export interface ChessGameMove {
  uci: string;
  san: string;
  color: PlayerColor;
  fenAfter: string;
  playedAt: string;
}

export interface ChessGameRecord {
  id: string;
  createdBy: string;
  whitePlayer: string;
  blackPlayer: string;
  fen: string;
  moves: ChessGameMove[];
  status: ChessGameStatus;
  createdAt: string;
  updatedAt: string;
}
