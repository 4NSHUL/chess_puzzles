import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import { Chess } from "chess.js";
import ChessPuzzleBoard from "./ChessPuzzleBoard";
import PuzzleControls from "./PuzzleControls";
import type { PuzzleSoundCue } from "../hooks/usePuzzleAudio";
import { attemptPuzzleMove, createPuzzleRun, revealSolution } from "../lib/puzzleEngine";
import { formatElapsedTime } from "../lib/time";
import type { Puzzle, PuzzleOutcome, PuzzleRunState } from "../types";

interface PuzzleCardProps {
  puzzle: Puzzle;
  index: number;
  total: number;
  isActive: boolean;
  onOutcome: (puzzleId: string, outcome: PuzzleOutcome) => void;
  onAdvance: () => void;
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
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const reportedOutcomes = useRef(new Set<PuzzleOutcome>());

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
    setElapsedSeconds(0);
    reportedOutcomes.current = new Set();
  }, [puzzle]);

  useEffect(() => {
    if (!isActive || run.completed) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setElapsedSeconds((current) => current + 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isActive, run.completed]);

  useEffect(() => {
    if (run.status !== "solved") {
      return undefined;
    }

    const timer = window.setTimeout(onAdvance, 850);
    return () => window.clearTimeout(timer);
  }, [onAdvance, run.status]);

  function reportOnce(outcome: PuzzleOutcome) {
    if (reportedOutcomes.current.has(outcome)) {
      return;
    }
    reportedOutcomes.current.add(outcome);
    onOutcome(puzzle.id, outcome);
  }

  function handleMove(from: string, to: string) {
    const result = attemptPuzzleMove(puzzle, run, {
      from,
      to,
      promotion: "q"
    });

    setSelectedSquare(null);
    setRun(result.state);

    if (!result.accepted) {
      reportOnce("failed");
      onSoundEvent("mistake");
      setFeedback(
        result.reason === "illegal"
          ? "That move is not legal in this position."
          : "Good legal move, but not the puzzle solution."
      );
      return;
    }

    if (result.state.completed) {
      reportOnce("solved");
      onSoundEvent("solved");
      setFeedback(
        `Solved with ${result.attempted?.san ?? "the best move"} in ${formatElapsedTime(
          elapsedSeconds
        )}.`
      );
      return;
    }

    onSoundEvent("correct");
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
    setElapsedSeconds(0);
    setFeedback("Position reset.");
  }

  function handleHint() {
    setHintVisible(true);
    setFeedback(puzzle.hint ?? "No hint is available for this puzzle.");
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
    onAdvance();
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
    setFeedback("Solution shown.");
    onSoundEvent("solution");
  }

  return (
    <article
      ref={ref}
      className={`puzzle-card puzzle-card--${run.status}`}
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
          onSelectSquare={setSelectedSquare}
          onMove={handleMove}
        />

        <section className="puzzle-panel" aria-live="polite">
          <div>
            <p className="progress-text">{progressLabel}</p>
            <p className="feedback-text">{feedback}</p>
          </div>
          <div className="status-cluster">
            <span className="timer-pill">{formatElapsedTime(elapsedSeconds)}</span>
            <span>{puzzle.difficulty}</span>
            <span>{puzzle.sideToMove === "w" ? "White" : "Black"} to move</span>
          </div>
        </section>

        {hintVisible ? (
          <p className="context-note">
            <strong>Hint:</strong> {puzzle.hint}
          </p>
        ) : null}

        {solutionLine.length > 0 ? (
          <p className="context-note">
            <strong>Solution:</strong> {solutionLine.join(" ")}
            {puzzle.explanation ? ` - ${puzzle.explanation}` : ""}
          </p>
        ) : null}
      </div>

      <PuzzleControls
        onHint={handleHint}
        onReset={handleReset}
        onSkip={handleSkip}
        onSolution={handleSolution}
        onOpenFilters={onOpenFilters}
        onToggleSound={onToggleSound}
        canMove={!run.completed && game.turn() === puzzle.sideToMove}
        soundEnabled={soundEnabled}
      />

      {run.status === "solved" ? (
        <div className="success-burst" aria-hidden="true">
          Solved
        </div>
      ) : null}
    </article>
  );
});

export default PuzzleCard;
