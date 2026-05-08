import type { PuzzleOutcome, PuzzleStatsSnapshot } from "../types";

const CURRENT_USER_KEY = "chess-puzzles.current-user.v1";
const DB_NAME = "chess-puzzles";
const DB_VERSION = 1;
const USER_STORE = "users";

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
