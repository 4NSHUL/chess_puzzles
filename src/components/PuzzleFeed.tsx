import { useRef } from "react";
import PuzzleCard from "./PuzzleCard";
import type { Puzzle, PuzzleOutcome } from "../types";

interface PuzzleFeedProps {
  puzzles: Puzzle[];
  onOutcome: (puzzleId: string, outcome: PuzzleOutcome) => void;
  onOpenFilters: () => void;
}

export default function PuzzleFeed({
  puzzles,
  onOutcome,
  onOpenFilters
}: PuzzleFeedProps) {
  const cardRefs = useRef<Array<HTMLElement | null>>([]);

  function goToNext(index: number) {
    cardRefs.current[index + 1]?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  if (puzzles.length === 0) {
    return (
      <section className="empty-feed" aria-live="polite">
        <h1>No puzzles match these filters</h1>
        <button type="button" onClick={onOpenFilters}>
          Adjust filters
        </button>
      </section>
    );
  }

  return (
    <section className="puzzle-feed" aria-label="Chess puzzle feed">
      {puzzles.map((puzzle, index) => (
        <PuzzleCard
          key={puzzle.id}
          ref={(node) => {
            cardRefs.current[index] = node;
          }}
          puzzle={puzzle}
          index={index}
          total={puzzles.length}
          onOutcome={onOutcome}
          onAdvance={() => goToNext(index)}
          onOpenFilters={onOpenFilters}
        />
      ))}
    </section>
  );
}
