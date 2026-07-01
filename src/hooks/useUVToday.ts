import { useUVData } from "@/hooks/useUVData";
import { deriveToday, TodayView } from "@/lib/uv";

export type UVState = {
  /** First load with no data on screen yet — show the skeleton. */
  loading: boolean;
  /** User-initiated pull-to-refresh. */
  refreshing: boolean;
  /** Set when the live fetch failed and only sample/cached data is shown. */
  error: string | null;
  locationLabel: string | null;
  view: TodayView | null;
  refresh: () => void;
};

/** Today screen: derives the hero/stat view from the shared UV data. */
export function useUVToday(): UVState {
  const { data, place, loading, refreshing, error, refresh } = useUVData();
  return {
    loading,
    refreshing,
    error,
    locationLabel: place?.label ?? null,
    view: data ? deriveToday(data) : null,
    refresh,
  };
}
