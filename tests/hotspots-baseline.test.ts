import { describe, expect, it } from "vitest";
import { computeHotspots } from "@/lib/hotspots";
import type { PublicIncident, Severity } from "@/lib/types";
import { makePublicIncident } from "./helpers";

const NOW = new Date("2026-01-11T12:00:00.000Z");
const RECENT = new Date("2026-01-10T12:00:00.000Z");

function reports(
  lat: number,
  lng: number,
  count: number,
  severity: Severity,
): PublicIncident[] {
  return Array.from({ length: count }, () =>
    makePublicIncident({
      severity,
      status: "new",
      createdAt: RECENT,
      location: { lat, lng },
    }),
  );
}

function cellId(lat: number, lng: number): string {
  return `${lat.toFixed(3)},${lng.toFixed(3)}`;
}

describe("hotspot ranking versus a count-only baseline", () => {
  it("lets four critical reports outrank five low-severity reports", () => {
    const lowVolume = reports(0.3476, 32.5825, 5, "low");
    const critical = reports(0.349, 32.59, 4, "critical");
    const high = reports(0.351, 32.6, 3, "high");

    const hotspots = computeHotspots([...lowVolume, ...critical, ...high], NOW);
    const countOrder = [...hotspots].sort((a, b) => b.count - a.count);
    const weightOrder = hotspots.map((hotspot) => hotspot.id);

    expect(countOrder[0].id).toBe(cellId(0.3476, 32.5825));
    expect(countOrder[0].count).toBe(5);
    expect(weightOrder[0]).toBe(cellId(0.349, 32.59));
    expect(hotspots.map((hotspot) => hotspot.score)).toEqual([66, 53, 51]);
    expect(hotspots[0].severityCounts.critical).toBe(4);
    expect(hotspots[1].score).toBeLessThan(hotspots[0].score);
  });
});
