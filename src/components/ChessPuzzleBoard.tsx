import { memo, useMemo } from "react";
import type { CSSProperties, DragEvent } from "react";
import { Chess, type Square } from "chess.js";
import type { PlayerColor } from "../types";

export interface BoardLastMove {
  from: string;
  to: string;
  token: string;
}

interface ChessPuzzleBoardProps {
  fen: string;
  orientation: PlayerColor;
  selectedSquare: string | null;
  disabled: boolean;
  lastMove?: BoardLastMove | null;
  onSelectSquare: (square: string | null) => void;
  onMove: (from: string, to: string) => void;
}

const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
const ranks = [8, 7, 6, 5, 4, 3, 2, 1];
const pieceGlyphs: Record<string, string> = {
  p: "♟",
  n: "♞",
  b: "♝",
  r: "♜",
  q: "♛",
  k: "♚"
};

function ChessPuzzleBoard({
  fen,
  orientation,
  selectedSquare,
  disabled,
  lastMove,
  onSelectSquare,
  onMove
}: ChessPuzzleBoardProps) {
  const game = useMemo(() => new Chess(fen), [fen]);
  const displayFiles = orientation === "w" ? files : [...files].reverse();
  const displayRanks = orientation === "w" ? ranks : [...ranks].reverse();

  function handleSquareClick(square: string, pieceColor?: PlayerColor) {
    if (disabled) {
      return;
    }

    if (selectedSquare) {
      if (selectedSquare === square) {
        onSelectSquare(null);
        return;
      }

      onMove(selectedSquare, square);
      return;
    }

    if (pieceColor === game.turn()) {
      onSelectSquare(square);
    }
  }

  function handleDragStart(
    event: DragEvent,
    square: string,
    pieceColor?: PlayerColor
  ) {
    if (disabled || pieceColor !== game.turn()) {
      event.preventDefault();
      return;
    }

    event.dataTransfer.setData("text/plain", square);
    onSelectSquare(square);
  }

  function handleDrop(event: DragEvent, targetSquare: string) {
    event.preventDefault();
    const sourceSquare = event.dataTransfer.getData("text/plain");
    if (!sourceSquare || sourceSquare === targetSquare) {
      return;
    }

    onMove(sourceSquare, targetSquare);
  }

  return (
    <div
      className="chess-board"
      role="grid"
      aria-label="Chess puzzle board"
      onDragOver={(event) => event.preventDefault()}
    >
      {displayRanks.map((rank) =>
        displayFiles.map((file) => {
          const square = `${file}${rank}`;
          const piece = game.get(square as Square);
          const isLight = (files.indexOf(file) + rank) % 2 === 1;
          const isSelected = selectedSquare === square;
          const isLastMoveSquare =
            lastMove?.from === square || lastMove?.to === square;
          const isMovedPiece = Boolean(lastMove && lastMove.to === square);
          const moveStyle = lastMove && isMovedPiece
            ? getMoveStyle(lastMove, displayFiles, displayRanks)
            : undefined;

          return (
            <button
              key={square}
              type="button"
              role="gridcell"
              className={[
                "square",
                isLight ? "square--light" : "square--dark",
                isSelected ? "square--selected" : "",
                isLastMoveSquare ? "square--last-move" : ""
              ].join(" ")}
              aria-label={`${square}${piece ? ` ${piece.color === "w" ? "white" : "black"} ${piece.type}` : " empty"}`}
              onClick={() => handleSquareClick(square, piece?.color)}
              onDrop={(event) => handleDrop(event, square)}
            >
              {piece ? (
                <span
                  key={
                    isMovedPiece
                      ? `${piece.color}${piece.type}-${square}-${lastMove?.token ?? "move"}`
                      : `${piece.color}${piece.type}-${square}`
                  }
                  className={[
                    "piece",
                    `piece--${piece.color}`,
                    isMovedPiece ? "piece--moved" : ""
                  ].join(" ")}
                  style={moveStyle}
                  draggable={!disabled && piece.color === game.turn()}
                  onDragStart={(event) => handleDragStart(event, square, piece.color)}
                >
                  {pieceGlyphs[piece.type]}
                </span>
              ) : null}
              <span className="coordinate coordinate--file">{file}</span>
              <span className="coordinate coordinate--rank">{rank}</span>
            </button>
          );
        })
      )}
    </div>
  );
}

function getMoveStyle(
  lastMove: BoardLastMove,
  displayFiles: string[],
  displayRanks: number[]
) {
  const from = getSquarePosition(lastMove.from, displayFiles, displayRanks);
  const to = getSquarePosition(lastMove.to, displayFiles, displayRanks);

  if (!from || !to) {
    return undefined;
  }

  return {
    "--move-x": `${(from.fileIndex - to.fileIndex) * 100}%`,
    "--move-y": `${(from.rankIndex - to.rankIndex) * 100}%`
  } as CSSProperties;
}

function getSquarePosition(
  square: string,
  displayFiles: string[],
  displayRanks: number[]
) {
  const fileIndex = displayFiles.indexOf(square[0]);
  const rankIndex = displayRanks.indexOf(Number(square[1]));

  if (fileIndex < 0 || rankIndex < 0) {
    return null;
  }

  return {
    fileIndex,
    rankIndex
  };
}

export default memo(ChessPuzzleBoard);
