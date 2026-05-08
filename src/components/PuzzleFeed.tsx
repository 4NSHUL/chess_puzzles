import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
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

const RENDER_WINDOW_SIZE = 100;
const WINDOW_EDGE_BUFFER = 20;
const CARD_HEIGHT_DVH = 100;

function clampWindowStart(start: number, puzzleCount: number) {
  return Math.min(
    Math.max(0, start),
    Math.max(0, puzzleCount - RENDER_WINDOW_SIZE)
  );
}

function getWindowStartForIndex(
  index: number,
  puzzleCount: number,
  currentStart: number
) {
  if (puzzleCount <= RENDER_WINDOW_SIZE) {
    return 0;
  }

  if (index < currentStart + WINDOW_EDGE_BUFFER) {
    return clampWindowStart(index - WINDOW_EDGE_BUFFER, puzzleCount);
  }

  if (index >= currentStart + RENDER_WINDOW_SIZE - WINDOW_EDGE_BUFFER) {
    return clampWindowStart(
      index - RENDER_WINDOW_SIZE + WINDOW_EDGE_BUFFER + 1,
      puzzleCount
    );
  }

  return currentStart;
}

function PuzzleFeed({
  puzzles,
  onOutcome,
  onOpenFilters,
  onSoundEvent,
  onToggleSound,
  soundEnabled
}: PuzzleFeedProps) {
  const feedRef = useRef<HTMLElement | null>(null);
  const cardRefs = useRef(new Map<number, HTMLElement>());
  const pendingScrollIndex = useRef<number | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [windowStart, setWindowStart] = useState(0);

  const windowEnd = Math.min(puzzles.length, windowStart + RENDER_WINDOW_SIZE);
  const renderedPuzzles = useMemo(
    () =>
      puzzles.slice(windowStart, windowEnd).map((puzzle, offset) => ({
        puzzle,
        index: windowStart + offset
      })),
    [puzzles, windowEnd, windowStart]
  );

  const updateWindowForIndex = useCallback(
    (index: number) => {
      setWindowStart((current) =>
        getWindowStartForIndex(index, puzzles.length, current)
      );
    },
    [puzzles.length]
  );

  const scrollToIndex = useCallback(
    (index: number) => {
      const node = cardRefs.current.get(index);

      if (node) {
        node.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
        return;
      }

      pendingScrollIndex.current = index;
      updateWindowForIndex(index);
    },
    [updateWindowForIndex]
  );

  const goToNext = useCallback(
    (index: number) => {
      const nextIndex = index + 1;

      if (nextIndex >= puzzles.length) {
        return;
      }

      scrollToIndex(nextIndex);
    },
    [puzzles.length, scrollToIndex]
  );

  const setCardRef = useCallback((index: number, node: HTMLElement | null) => {
    if (node) {
      cardRefs.current.set(index, node);
      return;
    }

    cardRefs.current.delete(index);
  }, []);

  useEffect(() => {
    const pendingIndex = pendingScrollIndex.current;
    if (pendingIndex === null) {
      return;
    }

    const node = cardRefs.current.get(pendingIndex);
    if (!node) {
      return;
    }

    pendingScrollIndex.current = null;
    node.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }, [renderedPuzzles]);

  useEffect(() => {
    const lastIndex = Math.max(0, puzzles.length - 1);

    setActiveIndex((current) => Math.min(current, lastIndex));
    setWindowStart((current) => clampWindowStart(current, puzzles.length));
  }, [puzzles.length]);

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

        const nextIndex = Number(
          (visible.target as HTMLElement).dataset.puzzleIndex
        );

        if (Number.isFinite(nextIndex)) {
          setActiveIndex(nextIndex);
          updateWindowForIndex(nextIndex);
        }
      },
      {
        root,
        threshold: [0.55, 0.75]
      }
    );

    renderedPuzzles.forEach(({ index }) => {
      const node = cardRefs.current.get(index);

      if (node) {
        observer.observe(node);
      }
    });

    return () => observer.disconnect();
  }, [renderedPuzzles, updateWindowForIndex]);

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
      {windowStart > 0 ? (
        <div
          className="feed-spacer"
          style={{ height: `${windowStart * CARD_HEIGHT_DVH}dvh` }}
          aria-hidden="true"
        />
      ) : null}

      {renderedPuzzles.map(({ puzzle, index }) => (
        <PuzzleCard
          key={puzzle.id}
          ref={(node) => {
            setCardRef(index, node);
          }}
          puzzle={puzzle}
          index={index}
          total={puzzles.length}
          isActive={index === activeIndex}
          onOutcome={onOutcome}
          onAdvance={goToNext}
          onOpenFilters={onOpenFilters}
          onSoundEvent={onSoundEvent}
          onToggleSound={onToggleSound}
          soundEnabled={soundEnabled}
        />
      ))}

      {windowEnd < puzzles.length ? (
        <div
          className="feed-spacer"
          style={{ height: `${(puzzles.length - windowEnd) * CARD_HEIGHT_DVH}dvh` }}
          aria-hidden="true"
        />
      ) : null}
    </section>
  );
}

export default memo(PuzzleFeed);
