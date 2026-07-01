import { Platform } from "react-native";

import Weatherkit, { UVResult } from "../../modules/weatherkit";

export type { UVResult };

/** Bar shape consumed by the Today curve (matches the design's HOURS array). */
export type UVBar = { h: number; color?: string; now?: boolean };

export type UVCategory = "Low" | "Moderate" | "High" | "Very High" | "Extreme";

export type TodayView = {
  uvIndex: number;
  category: UVCategory;
  /** 0–1 fill for the hero ring (against the UV scale max of 11). */
  ringFill: number;
  blurb: string;
  spf: string;
  burnTime: string;
  reapplyIn: string;
  reapplyAt: string;
  peak: string;
  bars: UVBar[];
  axis: string[];
};

const SCALE_MAX = 11; // UV index scale tops out at 11+

const CATEGORY_COLOR: Record<UVCategory, string> = {
  Low: "#E7E9ED",
  Moderate: "#E9C44A",
  High: "#F0AE3C",
  "Very High": "#E2912A",
  Extreme: "#D9534F",
};

// Approximate minutes-to-burn at UV index 1, per Fitzpatrick skin type (I–VI).
// burnTime = base / uv. Index 2 (type III) is the default until a skin-type
// setting exists; type III at UV 7 ≈ 25 min, matching the original design.
const SKIN_BASE_MINUTES = [67, 100, 175, 300, 425, 600];

/**
 * Fetches raw UV from the native Apple WeatherKit module. iOS only — the
 * module is null on Android/web/Expo Go.
 */
export async function fetchUV(
  latitude: number,
  longitude: number,
): Promise<UVResult> {
  if (Platform.OS !== "ios" || !Weatherkit) {
    throw new Error("Live UV data is available on iOS only.");
  }
  return Weatherkit.getUV(latitude, longitude);
}

export function uvCategory(uv: number): UVCategory {
  if (uv < 3) return "Low";
  if (uv < 6) return "Moderate";
  if (uv < 8) return "High";
  if (uv < 11) return "Very High";
  return "Extreme";
}

export function spfFor(uv: number): string {
  if (uv < 3) return "SPF 15";
  if (uv < 8) return "SPF 30";
  return "SPF 50";
}

export function burnTimeMinutes(uv: number, skinTypeIndex = 2): number {
  const base = SKIN_BASE_MINUTES[skinTypeIndex] ?? SKIN_BASE_MINUTES[2];
  if (uv < 1) return 240;
  return Math.min(240, Math.max(5, Math.round(base / uv)));
}

function blurbFor(category: UVCategory): string {
  switch (category) {
    case "Low":
      return "Low risk — enjoy your day with minimal protection.";
    case "Moderate":
      return "Moderate — wear sunscreen if you'll be out a while.";
    case "High":
      return "Peaking now — protection strongly recommended.";
    case "Very High":
      return "Very high — limit midday sun and reapply often.";
    case "Extreme":
      return "Extreme — avoid direct sun and cover up.";
  }
}

function fmtHour(h: number): string {
  const period = h < 12 ? "AM" : "PM";
  const hr = h % 12 || 12;
  return `${hr} ${period}`;
}

function fmtClock(d: Date): string {
  const m = d.getMinutes().toString().padStart(2, "0");
  const ap = d.getHours() < 12 ? "AM" : "PM";
  const h = d.getHours() % 12 || 12;
  return `${h}:${m} ${ap}`;
}

/**
 * Builds the curve as now → the next several hours, with the current hour
 * flagged "Now". WeatherKit's hourly forecast can include earlier hours of the
 * day, so we anchor to the current hour here rather than assuming the array
 * starts at "now".
 */
function buildBars(hourly: UVResult["hourly"], dailyMax: number, now: Date) {
  const nowMs = now.getTime();
  const upcoming = hourly.filter(
    (e) => new Date(e.time).getTime() + 60 * 60 * 1000 > nowMs,
  );
  const window = (upcoming.length > 0 ? upcoming : hourly).slice(0, 9);
  const scale = Math.max(SCALE_MAX, dailyMax);

  const bars: UVBar[] = window.map((entry, i) => ({
    h: Math.max(0.08, Math.min(1, entry.uvIndex / scale)),
    color: CATEGORY_COLOR[uvCategory(entry.uvIndex)],
    now: i === 0,
  }));

  // Label every other bar with its local hour.
  const axis = window
    .map((entry, i) =>
      i % 2 === 0 ? fmtHour(new Date(entry.time).getHours()) : null,
    )
    .filter((label): label is string => label !== null);

  return { bars, axis };
}

/**
 * The day's "High" (UV ≥ 6) window as local start/end hours, or null when the
 * day never reaches High. Shared by the Today and Forecast screens so the peak
 * window label is identical across both.
 */
function peakWindowHours(
  hourly: UVResult["hourly"],
  now: Date,
): { start: number; end: number } | null {
  const sameDay = (t: string) => {
    const d = new Date(t);
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  };
  const highHours = hourly
    .filter((e) => sameDay(e.time) && e.uvIndex >= 6)
    .map((e) => new Date(e.time).getHours())
    .sort((a, b) => a - b);
  if (highHours.length === 0) return null;
  return { start: highHours[0], end: highHours[highHours.length - 1] + 1 };
}

/**
 * SVG path for the hero ring's value arc, given a 0–1 fill. The gauge is a
 * 270° sweep (radius 118, center 134,134) starting at the bottom-left gap —
 * matching the design's track. fill=0.636 reproduces the original UV-7 arc.
 */
export function uvArcPath(fill: number): string {
  const cx = 134;
  const cy = 134;
  const r = 118;
  const startDeg = 135;
  const sweepDeg = Math.max(0, Math.min(1, fill)) * 270;
  const rad = (d: number) => (d * Math.PI) / 180;
  const x0 = cx + r * Math.cos(rad(startDeg));
  const y0 = cy + r * Math.sin(rad(startDeg));
  const x1 = cx + r * Math.cos(rad(startDeg + sweepDeg));
  const y1 = cy + r * Math.sin(rad(startDeg + sweepDeg));
  const largeArc = sweepDeg > 180 ? 1 : 0;
  return `M ${x0.toFixed(1)} ${y0.toFixed(1)} A ${r} ${r} 0 ${largeArc} 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`;
}

/**
 * Neutral sample shown before the first fetch resolves, and on platforms
 * without the native module (Android/web). Mirrors the original static design.
 */
export const FALLBACK_VIEW: TodayView = {
  uvIndex: 7,
  category: "High",
  ringFill: 7 / SCALE_MAX,
  blurb: "Peaking now — protection strongly recommended.",
  spf: "SPF 30",
  burnTime: "25 min",
  reapplyIn: "2 hrs",
  reapplyAt: "at 3:20 PM",
  peak: "Peak 11a–3p",
  bars: [
    { h: 0.14, color: "#E7E9ED" },
    { h: 0.32, color: "#E9C44A" },
    { h: 0.55, color: "#F0AE3C" },
    { h: 0.8, color: "#E2912A" },
    { h: 0.96, now: true },
    { h: 0.72, color: "#E2912A" },
    { h: 0.46, color: "#F0AE3C" },
    { h: 0.24, color: "#E9C44A" },
    { h: 0.1, color: "#E7E9ED" },
  ],
  axis: ["8a", "10a", "12p", "2p", "4p", "6p"],
};

// ─── Forecast screen ────────────────────────────────────────────────────────

export type ForecastRow = {
  time: string;
  uv: number;
  /** 0–1 fill for the row's mini bar. */
  pct: number;
  tag: string;
  barColor: string;
  tagColor: string;
};

export type ForecastView = {
  peakUv: number;
  peakTimeLabel: string;
  /** Short window e.g. "11a–3p" for the summary line. */
  peakWindowLabel: string;
  /** Full window e.g. "11:00a – 3:00p" for the callout, or null if none. */
  peakWindowFull: string | null;
  safeBefore: string;
  safeAfter: string;
  nowUv: number;
  nowVisible: boolean;
  /** Now-marker position as % of the chart box (overlay coords). */
  nowXPct: number;
  nowYPct: number;
  linePath: string;
  areaPath: string;
  /** Shaded bands in viewBox units (full chart height). */
  safeRects: { x: number; width: number }[];
  peakRect: { x: number; width: number } | null;
  rows: ForecastRow[];
};

/** Curve viewBox + the daytime hour window the x-axis spans. */
export const FORECAST_VB = { w: 620, h: 224, baseline: 200 };
export const FORECAST_AXIS = ["6 AM", "9 AM", "12 PM", "3 PM", "6 PM", "8 PM"];
const FC_START_HOUR = 6;
const FC_END_HOUR = 20;
const FC_TOP_PAD = 18;

function fcX(hour: number): number {
  const t = (hour - FC_START_HOUR) / (FC_END_HOUR - FC_START_HOUR);
  return Math.max(0, Math.min(1, t)) * FORECAST_VB.w;
}

function fcY(uv: number, scaleMax: number): number {
  const t = Math.max(0, Math.min(1, uv / scaleMax));
  return FORECAST_VB.baseline - t * (FORECAST_VB.baseline - FC_TOP_PAD);
}

function shortHour(h: number): string {
  const hh = ((h % 24) + 24) % 24;
  const n = hh % 12 || 12;
  return `${n} ${hh < 12 ? "AM" : "PM"}`;
}

function shortHourMin(h: number): string {
  const hh = ((h % 24) + 24) % 24;
  const n = hh % 12 || 12;
  return `${n}:00 ${hh < 12 ? "AM" : "PM"}`;
}

function clockHour(h: number): string {
  const n = h % 12 || 12;
  return `${n} ${h < 12 ? "AM" : "PM"}`;
}

function rowColors(uv: number): { bar: string; tag: string } {
  if (uv < 3) return { bar: "#5FBF6A", tag: "#5FBF6A" };
  if (uv < 6) return { bar: "#E9C44A", tag: "#C99A20" };
  return { bar: "#E2912A", tag: "#E2912A" };
}

/** Catmull-Rom → cubic-bezier smoothing through the day's UV points. */
function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return "";
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

/** Sample shown before the first fetch and on platforms without WeatherKit. */
export const FALLBACK_FORECAST: ForecastView = {
  peakUv: 7,
  peakTimeLabel: "12:30 PM",
  peakWindowLabel: "11a–3p",
  peakWindowFull: "11:00a – 3:00p",
  safeBefore: "Before 9a",
  safeAfter: "After 5p",
  nowUv: 7,
  nowVisible: true,
  nowXPct: 53.8,
  nowYPct: (40.8 / FORECAST_VB.h) * 100,
  linePath:
    "M 0.0 190.9 C 7.9 188.2, 31.8 181.8, 47.7 175.0 C 63.6 168.1, 79.5 159.4, 95.4 149.9 C 111.3 140.5, 127.2 129.1, 143.1 118.1 C 159.0 107.1, 174.9 94.6, 190.8 84.0 C 206.7 73.4, 222.6 62.4, 238.5 54.4 C 254.4 46.4, 270.3 38.5, 286.2 36.2 C 302.1 33.9, 317.9 36.6, 333.8 40.8 C 349.7 44.9, 365.6 52.9, 381.5 61.2 C 397.4 69.6, 413.3 80.2, 429.2 90.8 C 445.1 101.4, 461.0 114.3, 476.9 124.9 C 492.8 135.5, 508.7 145.8, 524.6 154.5 C 540.5 163.2, 556.4 170.8, 572.3 177.3 C 588.2 183.7, 612.1 190.5, 620.0 193.2",
  areaPath:
    "M 0.0 190.9 C 7.9 188.2, 31.8 181.8, 47.7 175.0 C 63.6 168.1, 79.5 159.4, 95.4 149.9 C 111.3 140.5, 127.2 129.1, 143.1 118.1 C 159.0 107.1, 174.9 94.6, 190.8 84.0 C 206.7 73.4, 222.6 62.4, 238.5 54.4 C 254.4 46.4, 270.3 38.5, 286.2 36.2 C 302.1 33.9, 317.9 36.6, 333.8 40.8 C 349.7 44.9, 365.6 52.9, 381.5 61.2 C 397.4 69.6, 413.3 80.2, 429.2 90.8 C 445.1 101.4, 461.0 114.3, 476.9 124.9 C 492.8 135.5, 508.7 145.8, 524.6 154.5 C 540.5 163.2, 556.4 170.8, 572.3 177.3 C 588.2 183.7, 612.1 190.5, 620.0 193.2 L 620 200 L 0 200 Z",
  safeRects: [
    { x: 0, width: 143 },
    { x: 524, width: 96 },
  ],
  peakRect: { x: 238, width: 191 },
  rows: [
    {
      time: "8 AM",
      uv: 2,
      pct: 2 / 11,
      tag: "Low",
      barColor: "#5FBF6A",
      tagColor: "#5FBF6A",
    },
    {
      time: "10 AM",
      uv: 5,
      pct: 5 / 11,
      tag: "Moderate",
      barColor: "#E9C44A",
      tagColor: "#C99A20",
    },
    {
      time: "12 PM",
      uv: 7,
      pct: 7 / 11,
      tag: "High",
      barColor: "#E2912A",
      tagColor: "#E2912A",
    },
    {
      time: "2 PM",
      uv: 6,
      pct: 6 / 11,
      tag: "High",
      barColor: "#E2912A",
      tagColor: "#E2912A",
    },
    {
      time: "4 PM",
      uv: 3,
      pct: 3 / 11,
      tag: "Moderate",
      barColor: "#E9C44A",
      tagColor: "#C99A20",
    },
    {
      time: "6 PM",
      uv: 1,
      pct: 1 / 11,
      tag: "Low",
      barColor: "#5FBF6A",
      tagColor: "#5FBF6A",
    },
  ],
};

/** Builds the full-day forecast view (curve, windows, hourly rows). */
export function deriveForecast(
  data: UVResult,
  now: Date = new Date(),
): ForecastView {
  const sameDay = (t: string) => {
    const d = new Date(t);
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  };
  const today = data.hourly.filter((e) => sameDay(e.time));
  if (today.length < 2) return FALLBACK_FORECAST;

  const scaleMax = Math.max(data.dailyMax, 2);

  // Curve points across the daytime window.
  const points = today
    .map((e) => ({ hour: new Date(e.time).getHours(), uv: e.uvIndex }))
    .filter((p) => p.hour >= FC_START_HOUR && p.hour <= FC_END_HOUR)
    .sort((a, b) => a.hour - b.hour)
    .map((p) => ({ x: fcX(p.hour), y: fcY(p.uv, scaleMax) }));

  const linePath = smoothPath(points);
  const first = points[0];
  const last = points[points.length - 1];
  const areaPath = points.length
    ? `${linePath} L ${last.x.toFixed(1)} ${FORECAST_VB.baseline} L ${first.x.toFixed(1)} ${FORECAST_VB.baseline} Z`
    : "";

  // Peak.
  const peakEntry = today.reduce((m, e) => (e.uvIndex > m.uvIndex ? e : m));
  const peakUv = Math.round(peakEntry.uvIndex);
  const peakTimeLabel = clockHour(new Date(peakEntry.time).getHours());

  // High window (UV ≥ 6) — shared with the Today screen so labels match.
  const pw = peakWindowHours(data.hourly, now);
  let peakWindowLabel = "Low all day";
  let peakWindowFull: string | null = null;
  let peakRect: { x: number; width: number } | null = null;
  if (pw) {
    peakWindowLabel = `${shortHour(pw.start)} – ${shortHour(pw.end)}`;
    peakWindowFull = `${shortHourMin(pw.start)} – ${shortHourMin(pw.end)}`;
    peakRect = { x: fcX(pw.start), width: fcX(pw.end) - fcX(pw.start) };
  }

  // Safe windows (UV < 3 = outside the moderate band).
  const modHours = today
    .filter((e) => e.uvIndex >= 3)
    .map((e) => new Date(e.time).getHours())
    .sort((a, b) => a - b);
  let safeBefore = "Safe all day";
  let safeAfter = "";
  let safeRects: { x: number; width: number }[] = [
    { x: 0, width: FORECAST_VB.w },
  ];
  if (modHours.length > 0) {
    const firstMod = modHours[0];
    const lastMod = modHours[modHours.length - 1] + 1;
    safeBefore = `Before ${shortHour(firstMod)}`;
    safeAfter = `After ${shortHour(lastMod)}`;
    safeRects = [
      { x: 0, width: fcX(firstMod) },
      { x: fcX(lastMod), width: FORECAST_VB.w - fcX(lastMod) },
    ];
  }

  // Now marker.
  const nowHourFloat = now.getHours() + now.getMinutes() / 60;
  const nowVisible =
    nowHourFloat >= FC_START_HOUR && nowHourFloat <= FC_END_HOUR;
  const nowUv = Math.round(data.current);

  // Hourly breakdown rows (every 2 hours).
  const rows: ForecastRow[] = [8, 10, 12, 14, 16, 18]
    .map((h): ForecastRow | null => {
      const e = today.find((x) => new Date(x.time).getHours() === h);
      if (!e) return null;
      const uv = Math.round(e.uvIndex);
      const c = rowColors(uv);
      return {
        time: clockHour(h),
        uv,
        pct: Math.max(0.04, Math.min(1, uv / SCALE_MAX)),
        tag: uvCategory(uv),
        barColor: c.bar,
        tagColor: c.tag,
      };
    })
    .filter((r): r is ForecastRow => r !== null);

  return {
    peakUv,
    peakTimeLabel,
    peakWindowLabel,
    peakWindowFull,
    safeBefore,
    safeAfter,
    nowUv,
    nowVisible,
    nowXPct: (fcX(nowHourFloat) / FORECAST_VB.w) * 100,
    nowYPct: (fcY(nowUv, scaleMax) / FORECAST_VB.h) * 100,
    linePath,
    areaPath,
    safeRects,
    peakRect,
    rows,
  };
}

// ─── Week (7-day) forecast ──────────────────────────────────────────────────

export type WeekDay = {
  /** Short weekday for the chart x-axis, e.g. "Mon". */
  label: string;
  /** Row label: "Today" for the current day, otherwise the short weekday. */
  day: string;
  /** Full weekday name for stat-card sub-labels, e.g. "Thursday". */
  fullDay: string;
  /** "Jun 30". */
  date: string;
  uv: number;
  today: boolean;
  /** 0–100 bar/track fill as a % of the UV scale max. */
  fillPct: number;
  barColor: string;
  /** Category name, e.g. "Very high". */
  tag: string;
  tagColor: string;
  /** x-axis label color (emphasised on today). */
  labelColor: string;
  /** row day-label color (accent on today). */
  dayColor: string;
  /** Soft glow under the tallest (UV ≥ 9) bars. */
  glow: boolean;
};

export type WeekStat = {
  uv: number;
  tag: string;
  tagColor: string;
  day: string;
};

export type WeekView = {
  days: WeekDay[];
  /** Full weekday of the week's peak, e.g. "Thursday". */
  summaryDay: string;
  summaryUv: number;
  weekHigh: WeekStat;
  calmest: WeekStat;
};

const WEEK_SCALE_MAX = 11;
const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEKDAY_LONG = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

// Week view uses its own coarse bands (matching the design) so the daily bars
// read at a glance: Low / Moderate / High / Very high.
function weekCat(uv: number): { name: string; bar: string; tag: string } {
  if (uv <= 2) return { name: "Low", bar: "#5FBF6A", tag: "#5FBF6A" };
  if (uv <= 5) return { name: "Moderate", bar: "#E9C44A", tag: "#C99A20" };
  if (uv <= 7) return { name: "High", bar: "#E2912A", tag: "#E2912A" };
  return { name: "Very high", bar: "#D9534F", tag: "#D9534F" };
}

type WeekRaw = {
  label: string;
  fullDay: string;
  date: string;
  uv: number;
  today: boolean;
};

function buildWeek(raw: WeekRaw[]): WeekView {
  const days: WeekDay[] = raw.map((d) => {
    const c = weekCat(d.uv);
    return {
      label: d.label,
      day: d.today ? "Today" : d.label,
      fullDay: d.fullDay,
      date: d.date,
      uv: d.uv,
      today: d.today,
      fillPct: Math.round((d.uv / WEEK_SCALE_MAX) * 100),
      barColor: c.bar,
      tag: c.name,
      tagColor: c.tag,
      labelColor: d.today ? "#14161B" : "#9aa0a8",
      dayColor: d.today ? "#E2912A" : "#14161B",
      glow: d.uv >= 9,
    };
  });
  const high = days.reduce((m, x) => (x.uv > m.uv ? x : m));
  const low = days.reduce((m, x) => (x.uv < m.uv ? x : m));
  return {
    days,
    summaryDay: high.fullDay,
    summaryUv: high.uv,
    weekHigh: {
      uv: high.uv,
      tag: high.tag,
      tagColor: high.tagColor,
      day: high.fullDay,
    },
    calmest: {
      uv: low.uv,
      tag: low.tag,
      tagColor: low.tagColor,
      day: low.fullDay,
    },
  };
}

/** Sample shown before the first fetch and on platforms without WeatherKit. */
export const FALLBACK_WEEK: WeekView = buildWeek([
  { label: "Mon", fullDay: "Monday", date: "Jun 30", uv: 7, today: true },
  { label: "Tue", fullDay: "Tuesday", date: "Jul 1", uv: 6, today: false },
  { label: "Wed", fullDay: "Wednesday", date: "Jul 2", uv: 8, today: false },
  { label: "Thu", fullDay: "Thursday", date: "Jul 3", uv: 9, today: false },
  { label: "Fri", fullDay: "Friday", date: "Jul 4", uv: 7, today: false },
  { label: "Sat", fullDay: "Saturday", date: "Jul 5", uv: 5, today: false },
  { label: "Sun", fullDay: "Sunday", date: "Jul 6", uv: 4, today: false },
]);

/** Builds the 7-day outlook (bar chart, stat pair, daily list). */
export function deriveWeek(data: UVResult, now: Date = new Date()): WeekView {
  const daily = data.daily;
  if (!daily || daily.length === 0) return FALLBACK_WEEK;

  const raw: WeekRaw[] = daily.slice(0, 7).map((e) => {
    const d = new Date(e.date);
    const today =
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate();
    return {
      label: WEEKDAY_SHORT[d.getDay()],
      fullDay: WEEKDAY_LONG[d.getDay()],
      date: `${MONTH_SHORT[d.getMonth()]} ${d.getDate()}`,
      uv: Math.round(e.uvIndex),
      today,
    };
  });
  return buildWeek(raw);
}

/** Turns a raw WeatherKit response into everything the Today screen renders. */
export function deriveToday(data: UVResult, now: Date = new Date()): TodayView {
  const uvIndex = Math.round(data.current);
  const category = uvCategory(uvIndex);
  const { bars, axis } = buildBars(data.hourly, data.dailyMax, now);

  const reapply = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const pw = peakWindowHours(data.hourly, now);

  return {
    uvIndex,
    category,
    ringFill: Math.min(1, uvIndex / Math.max(SCALE_MAX, data.dailyMax)),
    blurb: blurbFor(category),
    spf: spfFor(uvIndex),
    burnTime: `${burnTimeMinutes(uvIndex)} min`,
    reapplyIn: "2 hrs",
    reapplyAt: `at ${fmtClock(reapply)}`,
    peak: pw
      ? `Peak ${shortHour(pw.start)}–${shortHour(pw.end)}`
      : "Low UV today",
    bars,
    axis,
  };
}
