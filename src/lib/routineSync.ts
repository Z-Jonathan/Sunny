// Cross-device sync for the routine, backed by the Supabase `routines` table
// (one row per user, RLS-scoped to auth.uid()). The local store is the offline
// cache; this is the shared source of truth. Conflicts resolve last-write-wins
// on `updatedAt` (epoch millis), so the newest edit across devices wins.
import type { Activity } from "@/lib/routine";
import type { RoutineSnapshot } from "@/lib/routineStore";
import { supabase } from "@/lib/supabase";

type RoutineRow = {
  day: string;
  activities: Activity[] | null;
  next_id: number | null;
  updated_at: number | null;
};

function rowToSnapshot(row: RoutineRow): RoutineSnapshot {
  return {
    day: row.day,
    activities: Array.isArray(row.activities) ? row.activities : [],
    nextId: row.next_id ?? 1,
    updatedAt: row.updated_at ?? 0,
  };
}

/** Reads the signed-in user's routine row, or null if none / on error. */
export async function fetchRemoteRoutine(
  userId: string,
): Promise<RoutineSnapshot | null> {
  const { data, error } = await supabase
    .from("routines")
    .select("day, activities, next_id, updated_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return rowToSnapshot(data as RoutineRow);
}

/** Upserts the user's routine. Best-effort — failures leave the local copy intact. */
export async function upsertRemoteRoutine(
  userId: string,
  snap: RoutineSnapshot,
): Promise<void> {
  const { error } = await supabase.from("routines").upsert(
    {
      user_id: userId,
      day: snap.day,
      activities: snap.activities,
      next_id: snap.nextId,
      updated_at: snap.updatedAt,
    },
    { onConflict: "user_id" },
  );
  if (error) console.warn("[routine] sync upsert failed:", error.message);
}

/**
 * Subscribes to changes on the user's routine row (edits from another device),
 * invoking `onChange` with each new snapshot. Returns an unsubscribe function.
 */
export function subscribeRoutine(
  userId: string,
  onChange: (snap: RoutineSnapshot) => void,
): () => void {
  const channel = supabase
    .channel(`routine:${userId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "routines",
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        const row = payload.new as RoutineRow | undefined;
        if (row?.day) onChange(rowToSnapshot(row));
      },
    )
    .subscribe();
  return () => {
    void supabase.removeChannel(channel);
  };
}
