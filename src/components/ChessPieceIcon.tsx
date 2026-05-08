import type { PlayerColor } from "../types";

type PieceType = "p" | "n" | "b" | "r" | "q" | "k";

interface ChessPieceIconProps {
  color: PlayerColor;
  type: PieceType;
}

export default function ChessPieceIcon({ color, type }: ChessPieceIconProps) {
  return (
    <svg
      className={`piece-icon piece-icon--${color}`}
      viewBox="0 0 100 100"
      aria-hidden="true"
      focusable="false"
    >
      {renderPiece(type)}
    </svg>
  );
}

function renderPiece(type: PieceType) {
  if (type === "p") {
    return (
      <>
        <circle className="piece-shape" cx="50" cy="26" r="14" />
        <path className="piece-shape" d="M37 43h26l7 34H30z" />
        <path className="piece-shape" d="M24 79h52v10H24z" />
      </>
    );
  }

  if (type === "n") {
    return (
      <>
        <path
          className="piece-shape"
          d="M30 84h45V72H62c-2-16 6-28 9-43L55 15 36 26l6 9-13 14 11 7c-7 8-10 17-10 28z"
        />
        <circle className="piece-detail" cx="53" cy="31" r="3" />
      </>
    );
  }

  if (type === "b") {
    return (
      <>
        <circle className="piece-shape" cx="50" cy="18" r="9" />
        <path className="piece-shape" d="M35 35c0-12 30-12 30 0 0 16-9 24-9 40H44c0-16-9-24-9-40z" />
        <path className="piece-detail piece-detail--stroke" d="M55 27 43 48" />
        <path className="piece-shape" d="M27 78h46v11H27z" />
      </>
    );
  }

  if (type === "r") {
    return (
      <>
        <path className="piece-shape" d="M28 16h12v10h20V16h12v29H28z" />
        <path className="piece-shape" d="M35 43h30v34H35z" />
        <path className="piece-shape" d="M25 78h50v11H25z" />
      </>
    );
  }

  if (type === "q") {
    return (
      <>
        <circle className="piece-shape" cx="25" cy="19" r="7" />
        <circle className="piece-shape" cx="50" cy="13" r="8" />
        <circle className="piece-shape" cx="75" cy="19" r="7" />
        <path className="piece-shape" d="m22 29 16 44h24l16-44-20 17-8-25-8 25z" />
        <path className="piece-shape" d="M25 78h50v11H25z" />
      </>
    );
  }

  return (
    <>
      <path className="piece-detail piece-detail--stroke" d="M50 10v24M39 22h22" />
      <path className="piece-shape" d="M35 38c0-14 30-14 30 0 0 12-7 20-7 36H42c0-16-7-24-7-36z" />
      <path className="piece-shape" d="M25 78h50v11H25z" />
    </>
  );
}
