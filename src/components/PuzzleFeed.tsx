import { useEffect, useRef, useState } from "react";
import PuzzleCard from "./PuzzleCard";
import type { PuzzleSoundCue } from "../hooks/usePuzzleAudio";
import type { Puzzle, PuzzleOutcome } from "../types";

interface PuzzleFeedProps {
  puzzles: Puzzle[];
  onOutcome: (puzzleId: string, outcome: PuzzleOutcome) => void;
  onOpenFilters: () => void;
  onSoundEvent: (cue: PuzzleSoundCue) => void;
  onToggleSound: () => void;
  soundEnabled: boolean;
}

export default function PuzzleFeed({
  puzzles,
  onOutcome,
  onOpenFilters,
  onSoundEvent,
  onToggleSound,
  soundEnabled
}: PuzzleFeedProps) {
  const feedRef = useRef<HTMLElement | null>(null);
  const cardRefs = useRef<Array<HTMLElement | null>>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  function goToNext(index: number) {
    cardRefs.current[index + 1]?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  useEffect(() => {
    setActiveIndex(0);
    cardRefs.current = cardRefs.current.slice(0, puzzles.length);

    if (puzzles.length === 0) {
      return;
    }

    cardRefs.current[0]?.scrollIntoView({
      behavior: "auto",
      block: "start"
    });
  }, [puzzles]);

  useEffect(() => {
    const root = feedRef.current;
    if (!root || typeof IntersectionObserver === "undefined") {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0];

        if (!visible) {
          return;
        }

        const nextIndex = cardRefs.current.findIndex(
          (node) => node === visible.target
        );

        if (nextIndex >= 0) {
          setActiveIndex(nextIndex);
        }
      },
      {
        root,
        threshold: [0.55, 0.75]
      }
    );

    cardRefs.current.forEach((node) => {
      if (node) {
        observer.observe(node);
      }
    });

    return () => observer.disconnect();
  }, [puzzles]);

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
    <section ref={feedRef} className="puzzle-feed" aria-label="Chess puzzle feed">
      {puzzles.map((puzzle, index) => (
        <PuzzleCard
          key={puzzle.id}
          ref={(node) => {
            cardRefs.current[index] = node;
          }}
          puzzle={puzzle}
          index={index}
          total={puzzles.length}
          isActive={index === activeIndex}
          onOutcome={onOutcome}
          onAdvance={() => goToNext(index)}
          onOpenFilters={onOpenFilters}
          onSoundEvent={onSoundEvent}
          onToggleSound={onToggleSound}
          soundEnabled={soundEnabled}
        />
      ))}
    </section>
  );
}
