import { forwardRef, memo, useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import type { MutableRefObject } from "react";
import { Chess } from "chess.js";
import { SlidersHorizontal } from "lucide-react";
import ChessPuzzleBoard from "./ChessPuzzleBoard";
import type { BoardLastMove } from "./ChessPuzzleBoard";
import PuzzleControls from "./PuzzleControls";
import type { PuzzleSoundCue } from "../hooks/usePuzzleAudio";
import { getProgressiveHint, MAX_HINT_LEVEL } from "../lib/hints";
import { attemptPuzzleMove, createPuzzleRun, revealSolution } from "../lib/puzzleEngine";
import { formatElapsedTime } from "../lib/time";
import type { Puzzle, PuzzleOutcome, PuzzleRunState } from "../types";

function PuzzleTimer({
  active,
  completed,
  elapsedRef,
  resetKey
}: {
  active: boolean;
  completed: boolean;
  elapsedRef: MutableRefObject<number>;
  resetKey: number;
}) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    elapsedRef.current = 0;
    setElapsedSeconds(0);
  }, [elapsedRef, resetKey]);

  useEffect(() => {
    if (!active || completed) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      elapsedRef.current += 1;
      setElapsedSeconds(elapsedRef.current);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [active, completed, elapsedRef]);

  return <span className="timer-pill">{formatElapsedTime(elapsedSeconds)}</span>;
}

interface PuzzleCardProps {
  puzzle: Puzzle;
  index: number;
  total: number;
  isActive: boolean;
  onOutcome: (puzzleId: string, outcome: PuzzleOutcome) => void;
  onAdvance: (index: number) => void;
  onOpenFilters: () => void;
  onSoundEvent: (cue: PuzzleSoundCue) => void;
  onToggleSound: () => void;
  soundEnabled: boolean;
}

const PuzzleCard = forwardRef<HTMLElement, PuzzleCardProps>(function PuzzleCard(
  {
    puzzle,
    index,
    total,
    isActive,
    onOutcome,
    onAdvance,
    onOpenFilters,
    onSoundEvent,
    onToggleSound,
    soundEnabled
  },
  ref
) {
  const [run, setRun] = useState<PuzzleRunState>(() => createPuzzleRun(puzzle));
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [hintVisible, setHintVisible] = useState(false);
  const [solutionLine, setSolutionLine] = useState<string[]>([]);
  const [feedback, setFeedback] = useState("Find the best move.");
  const [hintLevel, setHintLevel] = useState(0);
  const [hintText, setHintText] = useState("");
  const [controlsOpen, setControlsOpen] = useState(false);
  const [lastMove, setLastMove] = useState<BoardLastMove | null>(null);
  const [timerResetKey, setTimerResetKey] = useState(0);
  const elapsedRef = useRef(0);
  const reportedOutcomes = useRef(new Set<PuzzleOutcome>());
  const controlsId = useId();

  const game = useMemo(() => new Chess(run.fen), [run.fen]);
  const progressLabel = run.completed
    ? "Complete"
    : `Move ${Math.min(run.moveIndex + 1, puzzle.solution.length)} of ${
        puzzle.solution.length
      }`;

  useEffect(() => {
    setRun(createPuzzleRun(puzzle));
    setSelectedSquare(null);
    setHintVisible(false);
    setSolutionLine([]);
    setFeedback("Find the best move.");
    setHintLevel(0);
    setHintText("");
    setControlsOpen(false);
    setLastMove(null);
    setTimerResetKey((current) => current + 1);
    reportedOutcomes.current = new Set();
  }, [puzzle]);


  const reportOnce = useCallback((outcome: PuzzleOutcome) => {
    if (reportedOutcomes.current.has(outcome)) {
      return;
    }
    reportedOutcomes.current.add(outcome);
    onOutcome(puzzle.id, outcome);
  }, [onOutcome, puzzle.id]);

  useEffect(() => {
    if (run.status !== "solved") {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      reportOnce("solved");
      onAdvance(index);
    }, 850);

    return () => window.clearTimeout(timer);
  }, [index, onAdvance, reportOnce, run.status]);

  function handleMove(from: string, to: string) {
    const result = attemptPuzzleMove(puzzle, run, {
      from,
      to,
      promotion: "q"
    });

    setSelectedSquare(null);
    setRun(result.state);

    if (!result.accepted) {
      setLastMove(null);
      reportOnce("failed");
      onSoundEvent("mistake");
      setFeedback(
        result.reason === "illegal"
          ? "That move is not legal in this position."
          : "Good legal move, but not the puzzle solution."
      );
      return;
    }

    const animatedMove =
      result.autoMoves.length > 0
        ? result.autoMoves[result.autoMoves.length - 1]
        : result.attempted;
    if (animatedMove) {
      setLastMove(createBoardLastMove(animatedMove.uci, result.state.moveIndex));
    }

    if (result.state.completed) {
      onSoundEvent("solved");
      setFeedback(
        `Solved with ${result.attempted?.san ?? "the best move"} in ${formatElapsedTime(
          elapsedRef.current
        )}.`
      );
      return;
    }

    onSoundEvent("correct");
    setHintLevel(0);
    setHintText("");
    const reply = result.autoMoves[result.autoMoves.length - 1];
    setFeedback(
      reply
        ? `Good. Opponent replied ${reply.san}. Continue the line.`
        : `Good move: ${result.attempted?.san}.`
    );
  }

  function handleReset() {
    setRun(createPuzzleRun(puzzle));
    setSelectedSquare(null);
    setHintVisible(false);
    setSolutionLine([]);
    setHintLevel(0);
    setHintText("");
    setLastMove(null);
    setTimerResetKey((current) => current + 1);
    setFeedback("Position reset.");
  }

  function handleHint() {
    const nextHintLevel = Math.min(hintLevel + 1, MAX_HINT_LEVEL);
    const nextHintText = getProgressiveHint(puzzle, run, nextHintLevel);

    setHintLevel(nextHintLevel);
    setHintText(nextHintText);
    setHintVisible(true);
    setFeedback(nextHintText);
  }

  function handleSkip() {
    reportOnce("skipped");
    setRun((current) => ({
      ...current,
      status: "skipped",
      completed: true
    }));
    setFeedback("Skipped.");
    onSoundEvent("skip");
    onAdvance(index);
  }

  function handleSolution() {
    const solution = revealSolution(puzzle, run);
    if (!solution) {
      setFeedback("The stored solution could not be played from this position.");
      return;
    }

    reportOnce("failed");
    setRun(solution.state);
    setSolutionLine(solution.moves.map((move) => move.san));
    if (solution.moves.length > 0) {
      const finalMove = solution.moves[solution.moves.length - 1];
      setLastMove(createBoardLastMove(finalMove.uci, solution.state.moveIndex));
    }
    setFeedback("Solution shown.");
    onSoundEvent("solution");
  }

  return (
    <article
      ref={ref}
      className={`puzzle-card puzzle-card--${run.status}`}
      data-puzzle-index={index}
      aria-label={`Puzzle ${index + 1} of ${total}`}
    >
      <div className="puzzle-card__content">
        <header className="puzzle-header">
          <div>
            <p className="eyebrow">
              Puzzle {index + 1} / {total}
            </p>
            <h1>{puzzle.themes.slice(0, 2).join(" + ")}</h1>
          </div>
          <div className="rating-pill" aria-label={`Rating ${puzzle.rating}`}>
            {puzzle.rating}
          </div>
        </header>

        <ChessPuzzleBoard
          fen={run.fen}
          orientation={puzzle.sideToMove}
          selectedSquare={selectedSquare}
          disabled={run.completed}
          lastMove={lastMove}
          onSelectSquare={setSelectedSquare}
          onMove={handleMove}
        />

        <section className="puzzle-panel" aria-live="polite">
          <div>
            <p className="progress-text">{progressLabel}</p>
            <p className="feedback-text">{feedback}</p>
          </div>
          <div className="status-cluster">
            <PuzzleTimer
              active={isActive}
              completed={run.completed}
              elapsedRef={elapsedRef}
              resetKey={timerResetKey}
            />
            <span>{puzzle.difficulty}</span>
            <span>{puzzle.sideToMove === "w" ? "White" : "Black"} to move</span>
            <button
              type="button"
              className="options-toggle"
              aria-controls={controlsId}
              aria-expanded={controlsOpen}
              onClick={() => setControlsOpen((current) => !current)}
            >
              <SlidersHorizontal aria-hidden="true" />
              <span>Options</span>
            </button>
          </div>
        </section>

        {hintVisible ? (
          <p className="context-note">
            <strong>Hint {hintLevel}/{MAX_HINT_LEVEL}:</strong> {hintText}
          </p>
        ) : null}

        {solutionLine.length > 0 ? (
          <p className="context-note">
            <strong>Solution:</strong> {solutionLine.join(" ")}
            {puzzle.explanation ? ` - ${puzzle.explanation}` : ""}
          </p>
        ) : null}

        <PuzzleControls
          id={controlsId}
          open={controlsOpen}
          onHint={handleHint}
          onReset={handleReset}
          onSkip={handleSkip}
          onSolution={handleSolution}
          onOpenFilters={onOpenFilters}
          onToggleSound={onToggleSound}
          canMove={!run.completed && game.turn() === puzzle.sideToMove}
          soundEnabled={soundEnabled}
        />
      </div>

      {run.status === "solved" ? (
        <div className="success-burst" aria-hidden="true">
          Solved
        </div>
      ) : null}
    </article>
  );
});

function createBoardLastMove(uci: string, token: number) {
  return {
    from: uci.slice(0, 2),
    to: uci.slice(2, 4),
    token: `${token}-${uci}`
  };
}

export default memo(PuzzleCard);
