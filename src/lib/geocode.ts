import { KAMPALA_CENTER } from "./types";

export type GeocodeResult = {
  label: string;
  lat: number;
  lng: number;
};

type PhotonFeature = {
  geometry: { coordinates: [number, number] };
  properties: {
    name?: string;
    street?: string;
    district?: string;
    city?: string;
    state?: string;
    country?: string;
    countrycode?: string;
  };
};

// Greater Kampala bounding box: minLng, minLat, maxLng, maxLat.
const KAMPALA_BBOX = "32.25,0.15,32.9,0.55";

type PhotonResponse = {
  features?: PhotonFeature[];
};

function formatLabel(properties: PhotonFeature["properties"]): string {
  const parts = [
    properties.name,
    properties.street,
    properties.district,
    properties.city,
    properties.state,
  ].filter((part): part is string => Boolean(part && part.trim()));

  // De-duplicate adjacent repeats (Photon often repeats the name as the city).
  const deduped = parts.filter((part, index) => part !== parts[index - 1]);
  return deduped.slice(0, 3).join(", ") || properties.country || "Unnamed place";
}

/**
 * Keyless place search via Photon (komoot's public OSM-based geocoder) — the
 * same "no API key, no billing" approach already used for the basemap
 * (MapLibre/OpenFreeMap). Biased toward Kampala/Nkozi so short queries like
 * "Nakawa" resolve to the right country. Returns [] on any failure; the map
 * and manual lat/lng fields remain the fallback.
 */
export async function searchPlaces(query: string): Promise<GeocodeResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 3) return [];

  const params = new URLSearchParams({
    q: trimmed,
    lat: String(KAMPALA_CENTER.lat),
    lon: String(KAMPALA_CENTER.lng),
    bbox: KAMPALA_BBOX,
    lang: "en",
    limit: "8",
  });

  try {
    const response = await fetch(`https://photon.komoot.io/api/?${params.toString()}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return [];

    const data = (await response.json()) as PhotonResponse;
    const seen = new Set<string>();

    return (data.features ?? [])
      .filter(
        (feature) =>
          Array.isArray(feature.geometry?.coordinates) &&
          (!feature.properties.countrycode || feature.properties.countrycode === "UG"),
      )
      .map((feature) => ({
        label: formatLabel(feature.properties),
        lng: feature.geometry.coordinates[0],
        lat: feature.geometry.coordinates[1],
      }))
      .filter((result) => {
        const key = `${result.label}@${result.lat.toFixed(5)},${result.lng.toFixed(5)}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 5);
  } catch {
    return [];
  }
}
