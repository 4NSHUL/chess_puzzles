import { useCallback, useEffect, useMemo, useState } from "react";
import { Chess, type Square } from "chess.js";
import { Copy, FlipHorizontal2, Plus, RotateCcw, StepBack } from "lucide-react";
import ChessPuzzleBoard from "./ChessPuzzleBoard";
import type { BoardLastMove } from "./ChessPuzzleBoard";
import {
  listUserGames,
  loadGameRecord,
  normalizeUserName,
  saveGameRecord
} from "../lib/storage";
import type { ChessGameRecord, ChessGameStatus, PlayerColor } from "../types";

interface GameModeProps {
  userName: string;
  onBack: () => void;
}

const START_FEN = new Chess().fen();

export default function GameMode({ userName, onBack }: GameModeProps) {
  const [activeGame, setActiveGame] = useState<ChessGameRecord | null>(null);
  const [savedGames, setSavedGames] = useState<ChessGameRecord[]>([]);
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [lastMove, setLastMove] = useState<BoardLastMove | null>(null);
  const [blackPlayer, setBlackPlayer] = useState("Guest");
  const [loadGameId, setLoadGameId] = useState("");
  const [shareLink, setShareLink] = useState("");
  const [notice, setNotice] = useState("Create a game or continue a saved one.");
  const [orientation, setOrientation] = useState<PlayerColor>("w");

  const game = useMemo(
    () => new Chess(activeGame?.fen ?? START_FEN),
    [activeGame?.fen]
  );
  const turnLabel = game.turn() === "w" ? "White" : "Black";
  const statusLabel = getStatusLabel(activeGame?.status ?? "active", game.turn());

  const refreshGames = useCallback(async () => {
    const games = await listUserGames(userName);
    setSavedGames(games);
    return games;
  }, [userName]);

  const persistGame = useCallback(
    async (record: ChessGameRecord, nextNotice: string) => {
      setActiveGame(record);
      await saveGameRecord(record);
      await refreshGames();
      setNotice(nextNotice);
    },
    [refreshGames]
  );

  const startNewGame = useCallback(async () => {
    const record = createGameRecord(userName, blackPlayer);
    setLastMove(null);
    setSelectedSquare(null);
    setOrientation("w");
    await persistGame(record, `Game ${record.id} saved.`);
    setLoadGameId(record.id);
    updateGameUrl(record.id);
  }, [blackPlayer, persistGame, userName]);

  useEffect(() => {
    let active = true;

    async function hydrateGameMode() {
      const sharedGame = readSharedGameFromHash(userName);
      if (sharedGame) {
        if (!active) {
          return;
        }

        await persistGame(sharedGame, `Imported shared game ${sharedGame.id}.`);
        setLoadGameId(sharedGame.id);
        updateGameUrl(sharedGame.id);
        return;
      }

      const requestedGameId = getRequestedGameId();
      const requestedGame = requestedGameId
        ? await loadGameRecord(requestedGameId)
        : undefined;
      const games = await refreshGames();

      if (!active) {
        return;
      }

      const nextGame = requestedGame ?? games[0] ?? createGameRecord(userName, "Guest");
      setActiveGame(nextGame);
      setLoadGameId(nextGame.id);
      updateGameUrl(nextGame.id);

      if (!requestedGame && games.length === 0) {
        await saveGameRecord(nextGame);
        await refreshGames();
      }
    }

    void hydrateGameMode();

    return () => {
      active = false;
    };
  }, [persistGame, refreshGames, userName]);

  async function handleMove(from: string, to: string) {
    if (!activeGame || activeGame.status !== "active") {
      return;
    }

    const nextGame = new Chess(activeGame.fen);
    const move = nextGame.move({
      from: from as Square,
      to: to as Square,
      promotion: "q"
    });

    setSelectedSquare(null);

    if (!move) {
      setNotice("That move is not legal.");
      return;
    }

    const uci = `${move.from}${move.to}${move.promotion ?? ""}`;
    const now = new Date().toISOString();
    const nextRecord: ChessGameRecord = {
      ...activeGame,
      fen: nextGame.fen(),
      moves: [
        ...activeGame.moves,
        {
          uci,
          san: move.san,
          color: move.color as PlayerColor,
          fenAfter: nextGame.fen(),
          playedAt: now
        }
      ],
      status: getGameStatus(nextGame),
      updatedAt: now
    };

    setLastMove({
      from: move.from,
      to: move.to,
      token: `${nextRecord.moves.length}-${uci}`
    });
    await persistGame(nextRecord, `${move.san} saved.`);
  }

  async function handleLoadGame() {
    const requestedId = loadGameId.trim();
    if (!requestedId) {
      setNotice("Enter a game id to load.");
      return;
    }

    const record = await loadGameRecord(requestedId);
    if (!record) {
      setNotice("No saved game found for that id in this browser.");
      return;
    }

    setActiveGame(record);
    setSelectedSquare(null);
    setLastMove(createLastMoveFromRecord(record));
    updateGameUrl(record.id);
    setNotice(`Loaded ${record.id}.`);
  }

  async function handleRestartGame() {
    if (!activeGame) {
      await startNewGame();
      return;
    }

    const now = new Date().toISOString();
    const nextRecord: ChessGameRecord = {
      ...activeGame,
      fen: START_FEN,
      moves: [],
      status: "active",
      updatedAt: now
    };

    setSelectedSquare(null);
    setLastMove(null);
    await persistGame(nextRecord, "Game reset to the starting position.");
  }

  async function handleSelectSavedGame(gameId: string) {
    const record = await loadGameRecord(gameId);
    if (!record) {
      setNotice("That saved game could not be loaded.");
      return;
    }

    setActiveGame(record);
    setLoadGameId(record.id);
    setSelectedSquare(null);
    setLastMove(createLastMoveFromRecord(record));
    updateGameUrl(record.id);
    setNotice(`Loaded ${record.id}.`);
  }

  async function handleShareGame() {
    if (!activeGame) {
      return;
    }

    const encoded = encodeSharedGame(activeGame);
    const url = `${window.location.origin}${window.location.pathname}?mode=game#game=${encoded}`;
    setShareLink(url);

    try {
      await window.navigator.clipboard.writeText(url);
      setNotice("Share link copied.");
    } catch {
      setNotice("Share link ready below.");
    }
  }

  return (
    <main className="game-mode">
      <header className="game-topbar">
        <button type="button" className="icon-text-button" onClick={onBack}>
          <StepBack aria-hidden="true" />
          <span>Modes</span>
        </button>
        <div>
          <p className="eyebrow">Game mode</p>
          <h1>Two-player board</h1>
        </div>
        <button type="button" className="icon-text-button" onClick={startNewGame}>
          <Plus aria-hidden="true" />
          <span>New</span>
        </button>
      </header>

      <section className="game-layout">
        <div className="game-board-area">
          <div className="game-status-row" aria-live="polite">
            <span>{turnLabel} to move</span>
            <span>{statusLabel}</span>
            <span>{activeGame?.id ?? "new game"}</span>
          </div>

          <ChessPuzzleBoard
            fen={activeGame?.fen ?? START_FEN}
            orientation={orientation}
            selectedSquare={selectedSquare}
            disabled={!activeGame || activeGame.status !== "active"}
            lastMove={lastMove}
            onSelectSquare={setSelectedSquare}
            onMove={handleMove}
          />
        </div>

        <aside className="game-panel" aria-label="Game controls">
          <section className="game-section">
            <h2>Players</h2>
            <div className="player-grid">
              <span>White</span>
              <strong>{activeGame?.whitePlayer ?? userName}</strong>
              <span>Black</span>
              <strong>{activeGame?.blackPlayer ?? "Guest"}</strong>
            </div>
            <label className="new-player-field">
              <span>Black name for new game</span>
              <input
                value={blackPlayer}
                onChange={(event) => setBlackPlayer(event.target.value)}
              />
            </label>
          </section>

          <section className="game-section">
            <h2>Game state</h2>
            <div className="game-actions">
              <button type="button" onClick={handleRestartGame}>
                <RotateCcw aria-hidden="true" />
                <span>Reset</span>
              </button>
              <button
                type="button"
                onClick={() => setOrientation((current) => (current === "w" ? "b" : "w"))}
              >
                <FlipHorizontal2 aria-hidden="true" />
                <span>Flip</span>
              </button>
              <button type="button" onClick={handleShareGame}>
                <Copy aria-hidden="true" />
                <span>Share</span>
              </button>
            </div>
            <p className="game-notice">{notice}</p>
            {shareLink ? (
              <input className="share-link" value={shareLink} readOnly />
            ) : null}
          </section>

          <section className="game-section">
            <h2>Load saved game</h2>
            <div className="load-game-row">
              <input
                value={loadGameId}
                onChange={(event) => setLoadGameId(event.target.value)}
                placeholder="Game id"
              />
              <button type="button" onClick={handleLoadGame}>
                Load
              </button>
            </div>
            <div className="saved-games-list">
              {savedGames.slice(0, 5).map((record) => (
                <button
                  key={record.id}
                  type="button"
                  className={record.id === activeGame?.id ? "saved-game--active" : ""}
                  onClick={() => handleSelectSavedGame(record.id)}
                >
                  <span>{record.id}</span>
                  <small>{record.moves.length} moves</small>
                </button>
              ))}
            </div>
          </section>

          <section className="game-section">
            <h2>Moves</h2>
            <ol className="move-list">
              {activeGame?.moves.map((move, moveIndex) => (
                <li key={`${move.uci}-${moveIndex}`}>
                  <span>{moveIndex + 1}.</span>
                  <strong>{move.san}</strong>
                </li>
              ))}
            </ol>
          </section>
        </aside>
      </section>
    </main>
  );
}

function createGameRecord(userName: string, blackPlayer: string): ChessGameRecord {
  const now = new Date().toISOString();
  return {
    id: createGameId(),
    createdBy: normalizeUserName(userName),
    whitePlayer: userName,
    blackPlayer: blackPlayer.trim() || "Guest",
    fen: START_FEN,
    moves: [],
    status: "active",
    createdAt: now,
    updatedAt: now
  };
}

function createGameId() {
  return `game-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}

function getGameStatus(game: Chess): ChessGameStatus {
  if (game.isCheckmate()) {
    return "checkmate";
  }
  if (game.isStalemate()) {
    return "stalemate";
  }
  if (game.isDraw()) {
    return "draw";
  }
  return "active";
}

function getStatusLabel(status: ChessGameStatus, turn: PlayerColor) {
  if (status === "checkmate") {
    return `${turn === "w" ? "Black" : "White"} wins`;
  }
  if (status === "stalemate") {
    return "Stalemate";
  }
  if (status === "draw") {
    return "Draw";
  }
  return "In progress";
}

function createLastMoveFromRecord(record: ChessGameRecord) {
  if (record.moves.length === 0) {
    return null;
  }

  const move = record.moves[record.moves.length - 1];
  return {
    from: move.uci.slice(0, 2),
    to: move.uci.slice(2, 4),
    token: `${record.moves.length}-${move.uci}`
  };
}

function updateGameUrl(gameId: string) {
  const url = new URL(window.location.href);
  url.searchParams.set("mode", "game");
  url.searchParams.set("game", gameId);
  url.hash = "";
  window.history.replaceState(null, "", url.toString());
}

function getRequestedGameId() {
  return new URLSearchParams(window.location.search).get("game");
}

function encodeSharedGame(record: ChessGameRecord) {
  const json = JSON.stringify(record);
  const bytes = new TextEncoder().encode(json);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return window
    .btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function readSharedGameFromHash(userName: string) {
  const encoded = window.location.hash.startsWith("#game=")
    ? window.location.hash.slice(6)
    : "";

  if (!encoded) {
    return null;
  }

  try {
    const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const paddedBase64 = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const binary = window.atob(paddedBase64);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    const record = JSON.parse(new TextDecoder().decode(bytes)) as ChessGameRecord;
    const now = new Date().toISOString();

    return {
      ...record,
      createdBy: normalizeUserName(userName),
      updatedAt: now
    };
  } catch {
    return null;
  }
}
