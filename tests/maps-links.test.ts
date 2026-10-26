import { describe, expect, it } from "vitest";
import {
  googleMapsDirectionsUrl,
  googleMapsPlaceUrl,
} from "@/lib/maps-links";

const POINT = { lat: 0.3476, lng: 32.5825 };

describe("Google Maps URL helpers", () => {
  it("builds a keyless Maps search URL for a coordinate", () => {
    const url = new URL(googleMapsPlaceUrl(POINT) ?? "");

    expect(url.origin).toBe("https://www.google.com");
    expect(url.pathname).toBe("/maps/search/");
    expect(url.searchParams.get("api")).toBe("1");
    expect(url.searchParams.get("query")).toBe("0.347600,32.582500");
  });

  it("builds a driving-directions URL for a coordinate", () => {
    const url = new URL(googleMapsDirectionsUrl(POINT) ?? "");

    expect(url.pathname).toBe("/maps/dir/");
    expect(url.searchParams.get("api")).toBe("1");
    expect(url.searchParams.get("destination")).toBe("0.347600,32.582500");
    expect(url.searchParams.get("travelmode")).toBe("driving");
  });

  it("rejects non-finite and out-of-range coordinates", () => {
    expect(googleMapsPlaceUrl({ lat: Number.NaN, lng: 32.58 })).toBeNull();
    expect(googleMapsPlaceUrl({ lat: 0.34, lng: Number.POSITIVE_INFINITY })).toBeNull();
    expect(googleMapsDirectionsUrl({ lat: 91, lng: 32.58 })).toBeNull();
    expect(googleMapsDirectionsUrl({ lat: 0.34, lng: 181 })).toBeNull();
  });
});
