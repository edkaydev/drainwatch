export type MapsPoint = {
  lat: number;
  lng: number;
};

function validPoint(point: MapsPoint): boolean {
  return (
    Number.isFinite(point.lat) &&
    Number.isFinite(point.lng) &&
    point.lat >= -90 &&
    point.lat <= 90 &&
    point.lng >= -180 &&
    point.lng <= 180
  );
}

function coordinate(point: MapsPoint): string {
  return `${point.lat.toFixed(6)},${point.lng.toFixed(6)}`;
}

/**
 * Google Maps URLs are a keyless handoff for field navigation. They do not
 * replace the MapLibre basemap and do not load the Maps JavaScript API.
 */
export function googleMapsPlaceUrl(point: MapsPoint): string | null {
  if (!validPoint(point)) return null;

  const params = new URLSearchParams({
    api: "1",
    query: coordinate(point),
  });
  return `https://www.google.com/maps/search/?${params.toString()}`;
}

export function googleMapsDirectionsUrl(point: MapsPoint): string | null {
  if (!validPoint(point)) return null;

  const params = new URLSearchParams({
    api: "1",
    destination: coordinate(point),
    travelmode: "driving",
  });
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}
