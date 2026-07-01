import * as Location from "expo-location";

export type Place = {
  latitude: number;
  longitude: number;
  /** Human label like "Austin, TX". */
  label: string;
};

/** Used when permission is denied or location is unavailable. */
export const FALLBACK_PLACE: Place = {
  latitude: 30.2672,
  longitude: -97.7431,
  label: "Austin, TX",
};

/**
 * Resolves the device's location and a "City, ST" label. Never rejects —
 * falls back to a default place so the UV screen can always render.
 */
export async function getPlace(): Promise<Place> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return FALLBACK_PLACE;

    const { coords } = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    const { latitude, longitude } = coords;
    console.log("Latitude: " + latitude);
    console.log("Longitude: " + longitude);

    let label = FALLBACK_PLACE.label;
    try {
      const [geo] = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (geo) {
        const city = geo.city ?? geo.subregion ?? "";
        const region = geo.region ?? "";
        label = [city, region].filter(Boolean).join(", ") || label;
      }
    } catch {
      // Keep the fallback label; coords are still valid for the UV lookup.
    }

    return { latitude, longitude, label };
  } catch {
    return FALLBACK_PLACE;
  }
}
