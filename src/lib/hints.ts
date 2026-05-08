import { Chess, type PieceSymbol, type Square } from "chess.js";
import type { Puzzle, PuzzleRunState } from "../types";

const PIECE_NAMES: Record<PieceSymbol, string> = {
  p: "pawn",
  n: "knight",
  b: "bishop",
  r: "rook",
  q: "queen",
  k: "king"
};

export const MAX_HINT_LEVEL = 4;

export function getProgressiveHint(
  puzzle: Puzzle,
  state: PuzzleRunState,
  hintLevel: number
) {
  const expectedMove = puzzle.solution[state.moveIndex];
  if (!expectedMove) {
    return "The puzzle line is complete.";
  }

  const from = expectedMove.slice(0, 2);
  const to = expectedMove.slice(2, 4);
  const game = new Chess(state.fen);
  const piece = game.get(from as Square);
  const sanMove = getSanMove(game, expectedMove);
  const themeText = puzzle.themes.slice(0, 3).join(", ");

  if (hintLevel <= 1) {
    return `Theme clue: ${themeText}. Look at checks, captures, and forcing threats first.`;
  }

  if (hintLevel === 2 && piece) {
    const color = piece.color === "w" ? "white" : "black";
    return `Candidate piece: move the ${color} ${PIECE_NAMES[piece.type]} from ${from}.`;
  }

  if (hintLevel === 3) {
    return `Target clue: the move lands on ${to}.`;
  }

  return sanMove ? `Best move: ${sanMove}.` : `Best move: ${expectedMove}.`;
}

function getSanMove(game: Chess, uci: string) {
  const move = game.move({
    from: uci.slice(0, 2) as Square,
    to: uci.slice(2, 4) as Square,
    ...(uci.slice(4) ? { promotion: uci.slice(4) } : {})
  });

  return move?.san;
}
