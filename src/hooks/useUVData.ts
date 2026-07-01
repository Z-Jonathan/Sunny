import { useCallback, useEffect, useState } from "react";

import { getPlace, Place } from "@/lib/location";
import { fetchUV, UVResult } from "@/lib/uv";
import { readSnapshot, writeSnapshot } from "@/lib/uvCache";

export type UVDataState = {
  /** First load with no data on screen yet — show a skeleton. */
  loading: boolean;
  /** User-initiated pull-to-refresh. */
  refreshing: boolean;
  /** Set when the live fetch failed and only sample/cached data is shown. */
  error: string | null;
  place: Place | null;
  data: UVResult | null;
  refresh: () => void;
};

/**
 * Shared base for the UV screens: resolves location, fetches raw UV from
 * WeatherKit, caches it in expo-sqlite, and exposes the raw result. Today and
 * Forecast each derive their own view from this. Renders instantly from cache,
 * then refreshes in the background; never throws.
 */
export function useUVData(): UVDataState {
  const [data, setData] = useState<UVResult | null>(null);
  const [place, setPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Resolve location + fetch fresh data. Throws on failure.
  const fetchFresh = useCallback(async () => {
    const p = await getPlace();
    setPlace(p);
    const d = await fetchUV(p.latitude, p.longitude);
    setData(d);
    writeSnapshot({ place: p, data: d, fetchedAt: Date.now() });
  }, []);

  // Initial load: paint from cache immediately, then refresh in the background.
  useEffect(() => {
    let active = true;
    (async () => {
      const cached = readSnapshot();
      if (cached && active) {
        setData(cached.data);
        setPlace(cached.place);
      }
      try {
        await fetchFresh();
        if (active) setError(null);
      } catch (e) {
        if (active && !cached) {
          setError(e instanceof Error ? e.message : "Couldn't load UV data.");
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [fetchFresh]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchFresh();
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't refresh UV data.");
    } finally {
      setRefreshing(false);
    }
  }, [fetchFresh]);

  return { loading, refreshing, error, place, data, refresh };
}
