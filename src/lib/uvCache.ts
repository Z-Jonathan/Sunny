// Reuses the expo-sqlite-backed localStorage shim (installed for Supabase) as
// a tiny key-value cache so the Today screen can render instantly from the last
// successful fetch and survive being offline.
import "expo-sqlite/localStorage/install";

import type { UVResult } from "../../modules/weatherkit";
import type { Place } from "./location";

const KEY = "uv-cache-v1";

export type UVSnapshot = {
  place: Place;
  data: UVResult;
  /** Epoch millis when this was fetched. */
  fetchedAt: number;
};

export function readSnapshot(): UVSnapshot | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as UVSnapshot) : null;
  } catch {
    return null;
  }
}

export function writeSnapshot(snapshot: UVSnapshot): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(snapshot));
  } catch {
    // Cache is best-effort; ignore write failures.
  }
}
