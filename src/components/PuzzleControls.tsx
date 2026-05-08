import {
  Eye,
  Filter,
  Lightbulb,
  RotateCcw,
  SkipForward,
  Volume2,
  VolumeX
} from "lucide-react";

interface PuzzleControlsProps {
  onHint: () => void;
  onReset: () => void;
  onSkip: () => void;
  onSolution: () => void;
  onOpenFilters: () => void;
  onToggleSound: () => void;
  canMove: boolean;
  soundEnabled: boolean;
}

export default function PuzzleControls({
  onHint,
  onReset,
  onSkip,
  onSolution,
  onOpenFilters,
  onToggleSound,
  canMove,
  soundEnabled
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
      <button
        type="button"
        onClick={onToggleSound}
        aria-label={soundEnabled ? "Turn sound off" : "Turn sound on"}
      >
        {soundEnabled ? <Volume2 aria-hidden="true" /> : <VolumeX aria-hidden="true" />}
        <span>Sound</span>
      </button>
      <span className="move-state" aria-live="polite">
        {canMove ? "Ready" : "Locked"}
      </span>
    </nav>
  );
}
