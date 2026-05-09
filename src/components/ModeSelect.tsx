import { Brain, Gamepad2, LogOut } from "lucide-react";
import type { AppMode } from "../types";

interface ModeSelectProps {
  userName: string;
  onSelectMode: (mode: Exclude<AppMode, "menu">) => void;
  onLogout: () => void;
}

export default function ModeSelect({
  userName,
  onSelectMode,
  onLogout
}: ModeSelectProps) {
  return (
    <main className="mode-select">
      <header className="mode-select__header">
        <div>
          <p className="eyebrow">Choose mode</p>
          <h1>Chess training</h1>
        </div>
        <button type="button" className="user-chip" onClick={onLogout}>
          <span>{userName}</span>
          <LogOut aria-hidden="true" />
        </button>
      </header>

      <div className="mode-grid" aria-label="Choose app mode">
        <button
          type="button"
          className="mode-option"
          onClick={() => onSelectMode("puzzle")}
        >
          <Brain aria-hidden="true" />
          <span>
            <strong>Puzzle mode</strong>
            <small>Reels-style tactical training</small>
          </span>
        </button>

        <button
          type="button"
          className="mode-option"
          onClick={() => onSelectMode("game")}
        >
          <Gamepad2 aria-hidden="true" />
          <span>
            <strong>Game mode</strong>
            <small>Two-player board with saved games</small>
          </span>
        </button>
      </div>
    </main>
  );
}
