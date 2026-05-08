import type { PuzzleStatsSnapshot } from "../types";

interface PuzzleStatsProps {
  stats: PuzzleStatsSnapshot;
  totalPuzzles: number;
  visiblePuzzles: number;
}

export default function PuzzleStats({
  stats,
  totalPuzzles,
  visiblePuzzles
}: PuzzleStatsProps) {
  return (
    <aside className="stats-bar" aria-label="Puzzle statistics">
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
