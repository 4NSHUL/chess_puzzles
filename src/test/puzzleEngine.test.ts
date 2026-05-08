import { Chess } from "chess.js";
import { describe, expect, it } from "vitest";
import puzzles from "../data/puzzles.json";
import {
  applyUciMove,
  attemptPuzzleMove,
  createPuzzleRun,
  revealSolution
} from "../lib/puzzleEngine";
import { formatElapsedTime } from "../lib/time";
import type { Puzzle } from "../types";

const startFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

const multiMovePuzzle: Puzzle = {
  id: "test-multi",
  fen: startFen,
  sideToMove: "w",
  solution: ["e2e4", "e7e5", "g1f3"],
  rating: 700,
  difficulty: "Beginner",
  themes: ["opening"]
};

describe("puzzle engine", () => {
  it("accepts the next solution move and auto-plays forced opponent replies", () => {
    const result = attemptPuzzleMove(multiMovePuzzle, createPuzzleRun(multiMovePuzzle), {
      from: "e2",
      to: "e4"
    });

    expect(result.accepted).toBe(true);
    expect(result.autoMoves.map((move) => move.uci)).toEqual(["e7e5"]);
    expect(result.state.moveIndex).toBe(2);
    expect(new Chess(result.state.fen).turn()).toBe("w");
  });

  it("marks a puzzle solved when the final expected move is played", () => {
    const first = attemptPuzzleMove(
      multiMovePuzzle,
      createPuzzleRun(multiMovePuzzle),
      { from: "e2", to: "e4" }
    );
    const second = attemptPuzzleMove(multiMovePuzzle, first.state, {
      from: "g1",
      to: "f3"
    });

    expect(second.accepted).toBe(true);
    expect(second.state.completed).toBe(true);
    expect(second.state.status).toBe("solved");
  });

  it("rejects a legal move that does not match the puzzle solution", () => {
    const result = attemptPuzzleMove(multiMovePuzzle, createPuzzleRun(multiMovePuzzle), {
      from: "d2",
      to: "d4"
    });

    expect(result.accepted).toBe(false);
    expect(result.reason).toBe("wrong");
    expect(result.state.fen).toBe(startFen);
    expect(result.state.mistakes).toBe(1);
  });

  it("rejects illegal moves and leaves the board position unchanged", () => {
    const result = attemptPuzzleMove(multiMovePuzzle, createPuzzleRun(multiMovePuzzle), {
      from: "e2",
      to: "e5"
    });

    expect(result.accepted).toBe(false);
    expect(result.reason).toBe("illegal");
    expect(result.state.fen).toBe(startFen);
  });

  it("resets a run to the original puzzle position", () => {
    const moved = attemptPuzzleMove(multiMovePuzzle, createPuzzleRun(multiMovePuzzle), {
      from: "e2",
      to: "e4"
    });
    const reset = createPuzzleRun(multiMovePuzzle);

    expect(moved.state.fen).not.toBe(reset.fen);
    expect(reset.moveIndex).toBe(0);
    expect(reset.completed).toBe(false);
  });

  it("reveals the remaining solution line from the current position", () => {
    const first = attemptPuzzleMove(
      multiMovePuzzle,
      createPuzzleRun(multiMovePuzzle),
      { from: "e2", to: "e4" }
    );
    const solution = revealSolution(multiMovePuzzle, first.state);

    expect(solution?.moves.map((move) => move.uci)).toEqual(["g1f3"]);
    expect(solution?.state.status).toBe("solution");
  });

  it("ships with at least 50 locally structured puzzles", () => {
    expect((puzzles as Puzzle[]).length).toBeGreaterThanOrEqual(50);
  });

  it("keeps every stored solution line playable by chess.js", () => {
    for (const puzzle of puzzles as Puzzle[]) {
      const game = new Chess(puzzle.fen);
      for (const uci of puzzle.solution) {
        const move = applyUciMove(game, uci);
        expect(move, `${puzzle.id} failed at ${uci}`).not.toBeNull();
      }
    }
  });

  it("formats puzzle timer values for the solving UI", () => {
    expect(formatElapsedTime(0)).toBe("0:00");
    expect(formatElapsedTime(9)).toBe("0:09");
    expect(formatElapsedTime(125)).toBe("2:05");
  });
});
