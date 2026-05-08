import { Chess, type Move, type Square } from "chess.js";
import type { Puzzle, PuzzleRunState } from "../types";

export interface BoardMoveInput {
  from: string;
  to: string;
  promotion?: string;
}

export interface PlayedMove {
  uci: string;
  san: string;
}

export interface PuzzleMoveResult {
  accepted: boolean;
  reason?: "illegal" | "wrong" | "line-error" | "completed";
  attempted?: PlayedMove;
  autoMoves: PlayedMove[];
  state: PuzzleRunState;
}

const DEFAULT_PROMOTION = "q";

export function createPuzzleRun(puzzle: Puzzle): PuzzleRunState {
  return {
    fen: puzzle.fen,
    moveIndex: 0,
    mistakes: 0,
    status: "idle",
    completed: false
  };
}

export function moveToUci(move: Pick<Move, "from" | "to" | "promotion">) {
  return `${move.from}${move.to}${move.promotion ?? ""}`;
}

export function applyUciMove(game: Chess, uci: string): Move | null {
  const promotion = uci.slice(4);
  return game.move({
    from: uci.slice(0, 2) as Square,
    to: uci.slice(2, 4) as Square,
    ...(promotion ? { promotion } : {})
  });
}

export function attemptPuzzleMove(
  puzzle: Puzzle,
  state: PuzzleRunState,
  input: BoardMoveInput
): PuzzleMoveResult {
  if (state.completed) {
    return {
      accepted: false,
      reason: "completed",
      autoMoves: [],
      state
    };
  }

  const game = new Chess(state.fen);
  const attempted = game.move({
    from: input.from as Square,
    to: input.to as Square,
    promotion: input.promotion || DEFAULT_PROMOTION
  });

  if (!attempted) {
    return {
      accepted: false,
      reason: "illegal",
      autoMoves: [],
      state: {
        ...state,
        mistakes: state.mistakes + 1,
        status: "mistake"
      }
    };
  }

  const expectedUci = puzzle.solution[state.moveIndex];
  const attemptedUci = moveToUci(attempted);

  if (attemptedUci !== expectedUci) {
    return {
      accepted: false,
      reason: "wrong",
      attempted: {
        uci: attemptedUci,
        san: attempted.san
      },
      autoMoves: [],
      state: {
        ...state,
        mistakes: state.mistakes + 1,
        status: "mistake"
      }
    };
  }

  const advanced = advanceForcedReplies(game, puzzle, state.moveIndex + 1);

  if (!advanced) {
    return {
      accepted: false,
      reason: "line-error",
      autoMoves: [],
      state: {
        ...state,
        status: "mistake"
      }
    };
  }

  return {
    accepted: true,
    attempted: {
      uci: attemptedUci,
      san: attempted.san
    },
    autoMoves: advanced.autoMoves,
    state: {
      fen: game.fen(),
      moveIndex: advanced.moveIndex,
      mistakes: state.mistakes,
      status: advanced.solved ? "solved" : "correct",
      completed: advanced.solved
    }
  };
}

export function revealSolution(
  puzzle: Puzzle,
  state: PuzzleRunState = createPuzzleRun(puzzle)
) {
  const game = new Chess(state.fen);
  const moves: PlayedMove[] = [];

  for (let index = state.moveIndex; index < puzzle.solution.length; index += 1) {
    const move = applyUciMove(game, puzzle.solution[index]);
    if (!move) {
      return null;
    }
    moves.push({
      uci: moveToUci(move),
      san: move.san
    });
  }

  return {
    fen: game.fen(),
    moves,
    state: {
      ...state,
      fen: game.fen(),
      moveIndex: puzzle.solution.length,
      status: "solution" as const,
      completed: true
    }
  };
}

function advanceForcedReplies(
  game: Chess,
  puzzle: Puzzle,
  moveIndex: number
): { moveIndex: number; autoMoves: PlayedMove[]; solved: boolean } | null {
  const autoMoves: PlayedMove[] = [];
  let nextMoveIndex = moveIndex;

  while (
    nextMoveIndex < puzzle.solution.length &&
    game.turn() !== puzzle.sideToMove
  ) {
    const reply = applyUciMove(game, puzzle.solution[nextMoveIndex]);
    if (!reply) {
      return null;
    }

    autoMoves.push({
      uci: moveToUci(reply),
      san: reply.san
    });
    nextMoveIndex += 1;
  }

  return {
    moveIndex: nextMoveIndex,
    autoMoves,
    solved: nextMoveIndex >= puzzle.solution.length
  };
}
