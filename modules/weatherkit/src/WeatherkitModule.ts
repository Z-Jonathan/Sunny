import { requireOptionalNativeModule } from "expo-modules-core";

export type UVHour = { time: string; uvIndex: number };

export type UVDay = { date: string; uvIndex: number };

export type UVResult = {
  /** UV index right now. */
  current: number;
  /** Next ~24 hours of UV, ISO-timestamped. */
  hourly: UVHour[];
  /** The day's peak UV index. */
  dailyMax: number;
  /**
   * Next 7 days of peak UV, ISO-timestamped. Optional so older cached
   * snapshots (written before this field existed) still parse.
   */
  daily?: UVDay[];
};

export type WeatherkitModule = {
  getUV(latitude: number, longitude: number): Promise<UVResult>;
};

// `null` on Android, web, and in Expo Go (the native module isn't present),
// so callers must guard before use.
const Weatherkit = requireOptionalNativeModule<WeatherkitModule>("Weatherkit");

export default Weatherkit;
