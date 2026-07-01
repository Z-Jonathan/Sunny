import { UVResult } from "../../modules/weatherkit";

/**
 * Routine planner logic. Activities are timed windows in the user's day; each
 * one is scored against the day's UV so we can recommend protection. UV comes
 * from the live WeatherKit hourly forecast when available, falling back to a
 * static clear-sky curve (the original design's table) otherwise.
 */

export type Env = "Everyday" | "Beach" | "Water" | "Snow" | "Altitude";

export type Activity = {
  id: number;
  name: string;
  /** Decimal local hours, e.g. 14.5 = 2:30 PM. */
  start: number;
  end: number;
  env: Env;
};

export type RoutineItem = { path: string; label: string };

export type RoutineActivity = Activity & {
  uv: number;
  level: string;
  dotColor: string;
  levelBg: string;
  startLabel: string;
  timeRange: string;
  /** UV ≤ 2 — nothing to do. */
  clear: boolean;
  items: RoutineItem[];
  note: string;
};

// SVG path strings for the recommendation-chip icons (single-path, stroked).
export const ROUTINE_ICON = {
  spf: "M12 3.5 5 6.2v4.4c0 4 2.9 6.9 7 8 4.1-1.1 7-4 7-8V6.2L12 3.5Z",
  hat: "M2.5 17.5h19 M6.5 17.5c0-5.2 2-8.5 5.5-8.5s5.5 3.3 5.5 8.5",
  sunglasses:
    "M3 9.8c2.4-1 5.4-1 6.8.3 M21 9.8c-2.4-1-5.4-1-6.8.3 M4 12.2a3 3 0 1 0 6 0 3 3 0 0 0-6 0 M14 12.2a3 3 0 1 0 6 0 3 3 0 0 0-6 0",
  shade:
    "M12 3.5c4.5 0 8 3 8 6.5H4c0-3.5 3.5-6.5 8-6.5Z M12 10v8.5 M12 18.5a1.8 1.8 0 0 0 3 0",
  reapply: "M20 12a8 8 0 1 1-2.3-5.6 M20 4.5V9h-4.5",
  water: "M12 3.5s6 6 6 10.2A6 6 0 0 1 6 13.7C6 9.5 12 3.5 12 3.5Z",
};

const ENV_PATH: Record<Env, string> = {
  Everyday: "M3 12h2l2-6 4 14 3-9 2 4h4",
  Beach: "M12 3v18 M12 7a5 5 0 0 1 8 4 M12 7a5 5 0 0 0-8 4",
  Water:
    "M3 8c2 0 2 2 4.5 2S9 8 12 8s2.5 2 4.5 2S18 8 21 8 M3 14c2 0 2 2 4.5 2S9 14 12 14s2.5 2 4.5 2S18 14 21 14",
  Snow: "M12 2v20 M4 7l16 10 M20 7 4 17 M12 5l-2.5 2.5M12 5l2.5 2.5",
  Altitude: "M3 20l6-12 4 7 3-5 5 10z",
};

export function envPath(env: Env): string {
  return ENV_PATH[env];
}

export const PRESETS = [
  "Walk",
  "Run",
  "Basketball",
  "Beach day",
  "Gardening",
  "Commute",
  "Lunch",
  "Swim",
];

export const ENVS: Env[] = ["Everyday", "Beach", "Water", "Snow", "Altitude"];

// Clear-sky UV by local hour — the fallback when there's no live forecast (or
// for hours the forecast doesn't cover).
const FALLBACK_UV_TABLE: Record<number, number> = {
  5: 0,
  6: 0,
  7: 1,
  8: 2,
  9: 4,
  10: 5,
  11: 6,
  12: 7,
  13: 7,
  14: 6,
  15: 5,
  16: 3,
  17: 2,
  18: 1,
  19: 0,
  20: 0,
  21: 0,
};

export function fmtTime(dec: number): string {
  const h = Math.floor(dec);
  const m = Math.round((dec - h) * 60);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

export function routineLevel(uv: number): {
  name: string;
  color: string;
  bg: string;
} {
  if (uv <= 2) return { name: "Low", color: "#4FA85C", bg: "rgba(95,191,106,0.13)" };
  if (uv <= 5)
    return { name: "Moderate", color: "#C99A20", bg: "rgba(233,196,74,0.16)" };
  if (uv <= 7)
    return { name: "High", color: "#E2912A", bg: "rgba(226,145,42,0.13)" };
  return { name: "Very high", color: "#D9534F", bg: "rgba(217,83,79,0.12)" };
}

/**
 * Returns a lookup of local hour → UV, using today's live hourly forecast where
 * present and the static clear-sky table elsewhere.
 */
export function uvAtFrom(
  data: UVResult | null,
  now: Date = new Date(),
): (hour: number) => number {
  const live: Record<number, number> = {};
  if (data?.hourly) {
    for (const e of data.hourly) {
      const d = new Date(e.time);
      if (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate()
      ) {
        live[d.getHours()] = e.uvIndex;
      }
    }
  }
  return (hour: number) =>
    Math.round(live[hour] ?? FALLBACK_UV_TABLE[hour] ?? 0);
}

/** Peak UV across the integer hours the activity window touches. */
export function peakUV(
  start: number,
  end: number,
  uvAt: (hour: number) => number,
): number {
  let max = 0;
  for (let h = Math.floor(start); h <= Math.ceil(end); h++) {
    max = Math.max(max, uvAt(h));
  }
  return max;
}

function buildRec(
  uv: number,
  durationMin: number,
  env: Env,
): { clear: boolean; items: RoutineItem[] } {
  if (uv <= 2) return { clear: true, items: [] };
  const items: RoutineItem[] = [];
  const spf = uv <= 5 ? "SPF 30" : uv <= 7 ? "SPF 50" : "SPF 50+";
  items.push({ path: ROUTINE_ICON.spf, label: spf });
  if (uv >= 5) items.push({ path: ROUTINE_ICON.sunglasses, label: "Sunglasses" });
  if (uv >= 6) items.push({ path: ROUTINE_ICON.hat, label: "Hat" });
  if (uv >= 8) items.push({ path: ROUTINE_ICON.shade, label: "Seek shade" });
  if (uv >= 6 || durationMin >= 90)
    items.push({ path: ROUTINE_ICON.reapply, label: "Reapply 2h" });
  if (env === "Water" || env === "Beach" || env === "Snow")
    items.push({ path: ROUTINE_ICON.water, label: "Water-resistant" });
  return { clear: false, items };
}

/** Sorts activities by start time and derives everything the cards render. */
export function deriveActivities(
  activities: Activity[],
  data: UVResult | null,
  now: Date = new Date(),
): RoutineActivity[] {
  const uvAt = uvAtFrom(data, now);
  return [...activities]
    .sort((a, b) => a.start - b.start)
    .map((a) => {
      const uv = peakUV(a.start, a.end, uvAt);
      const lvl = routineLevel(uv);
      const durationMin = Math.round((a.end - a.start) * 60);
      const rec = buildRec(uv, durationMin, a.env);
      let note = "";
      if (!rec.clear) {
        const hasReapply = rec.items.some((i) => i.label === "Reapply 2h");
        note = hasReapply
          ? `Reapply sunscreen by ${fmtTime(Math.min(a.start + 2, 21))}`
          : "Peak sun during this window — apply before you head out.";
      }
      return {
        ...a,
        uv,
        level: lvl.name,
        dotColor: lvl.color,
        levelBg: lvl.bg,
        startLabel: fmtTime(a.start),
        timeRange: `${fmtTime(a.start)} – ${fmtTime(a.end)}`,
        clear: rec.clear,
        items: rec.items,
        note,
      };
    });
}
