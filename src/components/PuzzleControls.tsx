import {
  Eye,
  Filter,
  Lightbulb,
  RotateCcw,
  SkipForward
} from "lucide-react";

interface PuzzleControlsProps {
  onHint: () => void;
  onReset: () => void;
  onSkip: () => void;
  onSolution: () => void;
  onOpenFilters: () => void;
  canMove: boolean;
}

export default function PuzzleControls({
  onHint,
  onReset,
  onSkip,
  onSolution,
  onOpenFilters,
  canMove
}: PuzzleControlsProps) {
  return (
    <nav className="action-bar" aria-label="Puzzle actions">
      <button type="button" onClick={onHint} aria-label="Show hint">
        <Lightbulb aria-hidden="true" />
        <span>Hint</span>
      </button>
      <button type="button" onClick={onReset} aria-label="Reset puzzle">
        <RotateCcw aria-hidden="true" />
        <span>Retry</span>
      </button>
      <button type="button" onClick={onSkip} aria-label="Skip puzzle">
        <SkipForward aria-hidden="true" />
        <span>Skip</span>
      </button>
      <button type="button" onClick={onSolution} aria-label="Show solution">
        <Eye aria-hidden="true" />
        <span>Line</span>
      </button>
      <button type="button" onClick={onOpenFilters} aria-label="Open filters">
        <Filter aria-hidden="true" />
        <span>Filter</span>
      </button>
      <span className="move-state" aria-live="polite">
        {canMove ? "Ready" : "Locked"}
      </span>
    </nav>
  );
}
