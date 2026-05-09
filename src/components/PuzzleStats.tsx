import { LayoutGrid, LogOut } from "lucide-react";
import type { PuzzleStatsSnapshot } from "../types";

interface PuzzleStatsProps {
  stats: PuzzleStatsSnapshot;
  userName: string;
  totalPuzzles: number;
  visiblePuzzles: number;
  onLogout: () => void;
  onOpenModes: () => void;
}

export default function PuzzleStats({
  stats,
  userName,
  totalPuzzles,
  visiblePuzzles,
  onLogout,
  onOpenModes
}: PuzzleStatsProps) {
  return (
    <aside className="stats-bar" aria-label="Puzzle statistics">
      <button type="button" className="user-chip" onClick={onLogout} aria-label="Log out">
        <span>{userName}</span>
        <LogOut aria-hidden="true" />
      </button>
      <button type="button" className="mode-chip" onClick={onOpenModes}>
        <LayoutGrid aria-hidden="true" />
        <span>Modes</span>
      </button>
      <div>
        <span>Solved</span>
        <strong>{stats.solvedIds.length}</strong>
      </div>
      <div>
        <span>Failed</span>
        <strong>{stats.failedIds.length}</strong>
      </div>
      <div>
        <span>Skipped</span>
        <strong>{stats.skippedIds.length}</strong>
      </div>
      <div>
        <span>Streak</span>
        <strong>{stats.streak}</strong>
      </div>
      <div>
        <span>Feed</span>
        <strong>
          {visiblePuzzles}/{totalPuzzles}
        </strong>
      </div>
    </aside>
  );
}
