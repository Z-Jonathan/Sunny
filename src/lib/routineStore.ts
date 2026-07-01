// Persists the day's routine so it survives the app closing, but resets to an
// empty slate at local midnight. Reuses the expo-sqlite-backed localStorage
// shim (same store as uvCache).
import "expo-sqlite/localStorage/install";

import type { Activity } from "./routine";

// Storage is namespaced per account so one user never sees another's routine.
const KEY_PREFIX = "routine-v1:";
const keyFor = (userId: string) => `${KEY_PREFIX}${userId}`;

export type RoutineSnapshot = {
  /** Local calendar day this routine belongs to, "YYYY-MM-DD". */
  day: string;
  activities: Activity[];
  /** Next id to hand out, so ids stay unique across a session. */
  nextId: number;
  /** Epoch millis of the last edit — drives last-write-wins across devices. */
  updatedAt: number;
};

/** Local (not UTC) day key, so the reset happens at the user's midnight. */
export function dayKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Returns the signed-in user's persisted routine, but only if it belongs to
 * `today`. Anything older is discarded (a new day starts empty).
 */
export function readRoutine(
  userId: string,
  today: string = dayKey(),
): RoutineSnapshot | null {
  try {
    const raw = localStorage.getItem(keyFor(userId));
    if (!raw) return null;
    const snap = JSON.parse(raw) as Partial<RoutineSnapshot>;
    if (snap.day !== today) {
      localStorage.removeItem(keyFor(userId));
      return null;
    }
    return {
      day: snap.day,
      activities: snap.activities ?? [],
      nextId: snap.nextId ?? 1,
      updatedAt: snap.updatedAt ?? 0,
    };
  } catch {
    return null;
  }
}

export function writeRoutine(userId: string, snapshot: RoutineSnapshot): void {
  try {
    localStorage.setItem(keyFor(userId), JSON.stringify(snapshot));
  } catch {
    // Best-effort; ignore write failures.
  }
}
