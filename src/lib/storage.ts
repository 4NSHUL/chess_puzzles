import type { ChessGameRecord, PuzzleOutcome, PuzzleStatsSnapshot } from "../types";

const CURRENT_USER_KEY = "chess-puzzles.current-user.v1";
const DB_NAME = "chess-puzzles";
const DB_VERSION = 2;
const USER_STORE = "users";
const GAME_STORE = "games";

export const EMPTY_STATS: PuzzleStatsSnapshot = {
  solvedIds: [],
  failedIds: [],
  skippedIds: [],
  streak: 0,
  bestStreak: 0
};

interface UserRecord {
  userName: string;
  stats: PuzzleStatsSnapshot;
  updatedAt: string;
}

export function normalizeUserName(userName: string) {
  return userName.trim().toLowerCase();
}

export function loadCurrentUser() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(CURRENT_USER_KEY);
}

export function saveCurrentUser(userName: string) {
  window.localStorage.setItem(CURRENT_USER_KEY, normalizeUserName(userName));
}

export function clearCurrentUser() {
  window.localStorage.removeItem(CURRENT_USER_KEY);
}

export async function loadUserStats(userName: string): Promise<PuzzleStatsSnapshot> {
  const normalized = normalizeUserName(userName);
  const db = await openDatabase();

  if (!db) {
    return loadFallbackStats(normalized);
  }

  const record = await readRecord(db, normalized);
  return record?.stats ?? loadFallbackStats(normalized);
}

export async function saveUserStats(
  userName: string,
  stats: PuzzleStatsSnapshot
) {
  const normalized = normalizeUserName(userName);
  const db = await openDatabase();

  if (!db) {
    saveFallbackStats(normalized, stats);
    return;
  }

  await writeRecord(db, {
    userName: normalized,
    stats,
    updatedAt: new Date().toISOString()
  });
}

export async function loadGameRecord(gameId: string) {
  const db = await openDatabase();

  if (!db) {
    return loadFallbackGame(gameId);
  }

  return (await readGameRecord(db, gameId)) ?? loadFallbackGame(gameId);
}

export async function listUserGames(userName: string) {
  const normalized = normalizeUserName(userName);
  const db = await openDatabase();

  if (!db) {
    return listFallbackGames(normalized);
  }

  const records = await readGameRecords(db);
  return records
    .filter(
      (record) =>
        normalizeUserName(record.createdBy) === normalized ||
        normalizeUserName(record.whitePlayer) === normalized ||
        normalizeUserName(record.blackPlayer) === normalized
    )
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export async function saveGameRecord(record: ChessGameRecord) {
  const db = await openDatabase();

  if (!db) {
    saveFallbackGame(record);
    return;
  }

  await writeGameRecord(db, record);
}

function loadFallbackStats(userName: string): PuzzleStatsSnapshot {
  if (typeof window === "undefined") {
    return EMPTY_STATS;
  }

  const key = getFallbackKey(userName);
  const raw = window.localStorage.getItem(key);

  if (!raw) {
    return EMPTY_STATS;
  }

  try {
    return {
      ...EMPTY_STATS,
      ...JSON.parse(raw)
    };
  } catch {
    return EMPTY_STATS;
  }
}

function saveFallbackStats(userName: string, stats: PuzzleStatsSnapshot) {
  window.localStorage.setItem(getFallbackKey(userName), JSON.stringify(stats));
}

function getFallbackKey(userName: string) {
  return `chess-puzzles.${userName}.stats.v1`;
}

function loadFallbackGame(gameId: string) {
  if (typeof window === "undefined") {
    return undefined;
  }

  const raw = window.localStorage.getItem(getFallbackGameKey(gameId));
  if (!raw) {
    return undefined;
  }

  try {
    return JSON.parse(raw) as ChessGameRecord;
  } catch {
    return undefined;
  }
}

function saveFallbackGame(record: ChessGameRecord) {
  window.localStorage.setItem(getFallbackGameKey(record.id), JSON.stringify(record));
  const indexKey = getFallbackGameIndexKey(record.createdBy);
  const current = window.localStorage.getItem(indexKey);
  let gameIds: string[] = [];

  try {
    gameIds = current ? (JSON.parse(current) as string[]) : [];
  } catch {
    gameIds = [];
  }

  const next = [record.id, ...gameIds.filter((gameId) => gameId !== record.id)];
  window.localStorage.setItem(indexKey, JSON.stringify(next));
}

function listFallbackGames(userName: string) {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(getFallbackGameIndexKey(userName));
  let gameIds: string[] = [];

  try {
    gameIds = raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    gameIds = [];
  }

  return gameIds
    .map((gameId) => loadFallbackGame(gameId))
    .filter((record): record is ChessGameRecord => Boolean(record))
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

function getFallbackGameKey(gameId: string) {
  return `chess-puzzles.game.${gameId}.v1`;
}

function getFallbackGameIndexKey(userName: string) {
  return `chess-puzzles.${normalizeUserName(userName)}.games.v1`;
}

function openDatabase() {
  if (typeof window === "undefined" || !("indexedDB" in window)) {
    return Promise.resolve(null);
  }

  return new Promise<IDBDatabase | null>((resolve) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(USER_STORE)) {
        db.createObjectStore(USER_STORE, {
          keyPath: "userName"
        });
      }
      if (!db.objectStoreNames.contains(GAME_STORE)) {
        db.createObjectStore(GAME_STORE, {
          keyPath: "id"
        });
      }
    };

    request.onerror = () => resolve(null);
    request.onsuccess = () => resolve(request.result);
  });
}

function readRecord(db: IDBDatabase, userName: string) {
  return new Promise<UserRecord | undefined>((resolve) => {
    const transaction = db.transaction(USER_STORE, "readonly");
    const store = transaction.objectStore(USER_STORE);
    const request = store.get(userName);

    request.onerror = () => resolve(undefined);
    request.onsuccess = () => resolve(request.result as UserRecord | undefined);
  });
}

function writeRecord(db: IDBDatabase, record: UserRecord) {
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(USER_STORE, "readwrite");
    const store = transaction.objectStore(USER_STORE);
    store.put(record);

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

function readGameRecord(db: IDBDatabase, gameId: string) {
  return new Promise<ChessGameRecord | undefined>((resolve) => {
    const transaction = db.transaction(GAME_STORE, "readonly");
    const store = transaction.objectStore(GAME_STORE);
    const request = store.get(gameId);

    request.onerror = () => resolve(undefined);
    request.onsuccess = () =>
      resolve(request.result as ChessGameRecord | undefined);
  });
}

function readGameRecords(db: IDBDatabase) {
  return new Promise<ChessGameRecord[]>((resolve) => {
    const transaction = db.transaction(GAME_STORE, "readonly");
    const store = transaction.objectStore(GAME_STORE);
    const request = store.getAll();

    request.onerror = () => resolve([]);
    request.onsuccess = () => resolve(request.result as ChessGameRecord[]);
  });
}

function writeGameRecord(db: IDBDatabase, record: ChessGameRecord) {
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(GAME_STORE, "readwrite");
    const store = transaction.objectStore(GAME_STORE);
    store.put(record);

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export function updateStats(
  stats: PuzzleStatsSnapshot,
  puzzleId: string,
  outcome: PuzzleOutcome
): PuzzleStatsSnapshot {
  const solvedIds = new Set(stats.solvedIds);
  const failedIds = new Set(stats.failedIds);
  const skippedIds = new Set(stats.skippedIds);

  if (outcome === "solved") {
    const wasSolved = solvedIds.has(puzzleId);
    solvedIds.add(puzzleId);
    const streak = wasSolved ? stats.streak : stats.streak + 1;

    return {
      solvedIds: [...solvedIds],
      failedIds: [...failedIds],
      skippedIds: [...skippedIds],
      streak,
      bestStreak: Math.max(stats.bestStreak, streak)
    };
  }

  if (outcome === "failed") {
    failedIds.add(puzzleId);
  }

  if (outcome === "skipped") {
    skippedIds.add(puzzleId);
  }

  return {
    solvedIds: [...solvedIds],
    failedIds: [...failedIds],
    skippedIds: [...skippedIds],
    streak: 0,
    bestStreak: stats.bestStreak
  };
}
