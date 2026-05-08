import { memo, useMemo } from "react";
import type { DragEvent } from "react";
import { Chess, type Square } from "chess.js";
import type { PlayerColor } from "../types";

interface ChessPuzzleBoardProps {
  fen: string;
  orientation: PlayerColor;
  selectedSquare: string | null;
  disabled: boolean;
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

          return (
            <button
              key={square}
              type="button"
              role="gridcell"
              className={[
                "square",
                isLight ? "square--light" : "square--dark",
                isSelected ? "square--selected" : ""
              ].join(" ")}
              aria-label={`${square}${piece ? ` ${piece.color === "w" ? "white" : "black"} ${piece.type}` : " empty"}`}
              onClick={() => handleSquareClick(square, piece?.color)}
              onDrop={(event) => handleDrop(event, square)}
            >
              {piece ? (
                <span
                  className={`piece piece--${piece.color}`}
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

export default memo(ChessPuzzleBoard);
