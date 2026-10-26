import { describe, expect, it } from "vitest";
import {
  computeHotspots,
  hotspotFor,
  hotspotTone,
  severityFromIncidents,
} from "@/lib/hotspots";
import type { PublicIncident } from "@/lib/types";
import { makePublicIncident } from "./helpers";

const NOW = new Date("2026-01-11T12:00:00.000Z");
const RECENT = new Date("2026-01-10T12:00:00.000Z");
const OLD = new Date("2025-01-01T12:00:00.000Z");

function at(
  lat: number,
  lng: number,
  overrides: Partial<PublicIncident> = {},
) {
  return makePublicIncident({
    location: { lat, lng },
    createdAt: RECENT,
    ...overrides,
  });
}

describe("computeHotspots", () => {
  it("groups reports that share a ~110 m cell", () => {
    const hotspots = computeHotspots(
      [
        at(0.3476, 32.5825),
        at(0.34761, 32.58251),
        at(0.34768, 32.58258),
      ],
      NOW,
    );

    expect(hotspots).toHaveLength(1);
    expect(hotspots[0].count).toBe(3);
    expect(hotspots[0].activeCount).toBe(3);
  });

  it("keeps reports in different cells separate and sorts by score", () => {
    const hotspots = computeHotspots(
      [
        at(0.3476, 32.5825, { severity: "low" }),
        at(0.3499, 32.5899, { severity: "critical" }),
      ],
      NOW,
    );

    expect(hotspots).toHaveLength(2);
    expect(hotspots[0].score).toBeGreaterThanOrEqual(hotspots[1].score);
    expect(hotspots[0].severityCounts.critical).toBe(1);
  });

  it("skips reports with non-finite coordinates", () => {
    const hotspots = computeHotspots(
      [
        makePublicIncident({ location: { lat: Number.NaN, lng: 32.58 } }),
        makePublicIncident({ location: { lat: 0.34, lng: Number.POSITIVE_INFINITY } }),
      ],
      NOW,
    );

    expect(hotspots).toHaveLength(0);
  });

  it("produces a breakdown that recomputes the rounded score", () => {
    const [hotspot] = computeHotspots(
      [
        at(0.3476, 32.5825, { severity: "critical" }),
        at(0.3476, 32.5825, { severity: "high", status: "resolved" }),
      ],
      NOW,
    );

    const breakdown = hotspot.scoreBreakdown;
    expect(breakdown.recurrence).toBeGreaterThan(0);
    expect(breakdown.severity).toBeGreaterThan(0);
    expect(breakdown.recency).toBeGreaterThan(0);
    expect(breakdown.concentration).toBeGreaterThan(0);
    expect(breakdown.subtotal).toBeCloseTo(
      breakdown.recurrence +
        breakdown.severity +
        breakdown.recency +
        breakdown.concentration,
    );
    expect(breakdown.total).toBe(
      Math.round(Math.min(100, breakdown.subtotal * breakdown.resolvedPenalty)),
    );
    expect(hotspot.score).toBe(breakdown.total);
    expect(breakdown.resolvedPenalty).toBe(1);
  });

  it("applies the resolved-only penalty", () => {
    const [resolvedOnly] = computeHotspots(
      [at(0.3476, 32.5825, { status: "resolved" })],
      NOW,
    );
    const [withActive] = computeHotspots(
      [
        at(0.3476, 32.5825, { status: "resolved" }),
        at(0.3476, 32.5825, { status: "in_progress" }),
      ],
      NOW,
    );

    expect(resolvedOnly.scoreBreakdown.resolvedPenalty).toBe(0.35);
    expect(resolvedOnly.score).toBe(
      Math.round(resolvedOnly.scoreBreakdown.subtotal * 0.35),
    );
    expect(withActive.scoreBreakdown.resolvedPenalty).toBe(1);
  });

  it("weights severe reports more heavily than low-severity reports", () => {
    const [critical] = computeHotspots(
      [at(0.3001, 32.5001, { severity: "critical" })],
      NOW,
    );
    const [low] = computeHotspots(
      [at(0.4001, 32.6001, { severity: "low" })],
      NOW,
    );

    expect(critical.scoreBreakdown.severity).toBeGreaterThan(
      low.scoreBreakdown.severity,
    );
    expect(critical.score).toBeGreaterThan(low.score);
  });

  it("decays recency over 180 days", () => {
    const [recent] = computeHotspots(
      [at(0.3001, 32.5001, { createdAt: NOW })],
      NOW,
    );
    const [old] = computeHotspots(
      [at(0.4001, 32.6001, { createdAt: OLD })],
      NOW,
    );

    expect(recent.scoreBreakdown.recency).toBe(20);
    expect(old.scoreBreakdown.recency).toBe(0);
  });

  it("caps the score at 100", () => {
    const incidents = Array.from({ length: 30 }, () =>
      at(0.3476, 32.5825, { severity: "critical", status: "new" }),
    );
    const [hotspot] = computeHotspots(incidents, NOW);

    expect(hotspot.scoreBreakdown.recurrence).toBe(40);
    expect(hotspot.scoreBreakdown.severity).toBe(30);
    expect(hotspot.scoreBreakdown.concentration).toBe(10);
    expect(hotspot.score).toBe(100);
  });

  it("counts severities and categories", () => {
    const [hotspot] = computeHotspots(
      [
        at(0.3476, 32.5825, { severity: "critical", category: "flooding" }),
        at(0.3476, 32.5825, { severity: "low", category: "flooding" }),
        at(0.3476, 32.5825, { severity: "low", category: "erosion" }),
      ],
      NOW,
    );

    expect(hotspot.severityCounts).toEqual({
      low: 2,
      medium: 0,
      high: 0,
      critical: 1,
    });
    expect(hotspot.categoryCounts).toEqual({ flooding: 2, erosion: 1 });
  });
});

describe("severityFromIncidents", () => {
  it("returns the worst severity in a group", () => {
    expect(
      severityFromIncidents([
        makePublicIncident({ severity: "low" }),
        makePublicIncident({ severity: "high" }),
        makePublicIncident({ severity: "medium" }),
      ]),
    ).toBe("high");
  });
});

describe("hotspotFor", () => {
  it("finds the hotspot for an incident cell", () => {
    const incident = at(0.3476, 32.5825);
    const hotspots = computeHotspots([incident], NOW);

    expect(hotspotFor(incident, hotspots)?.id).toBe(hotspots[0].id);
  });
});

describe("hotspotTone", () => {
  it("uses the documented score thresholds", () => {
    expect(hotspotTone(75).label).toBe("Critical");
    expect(hotspotTone(74).label).toBe("High");
    expect(hotspotTone(55).label).toBe("High");
    expect(hotspotTone(54).label).toBe("Moderate");
    expect(hotspotTone(35).label).toBe("Moderate");
    expect(hotspotTone(34).label).toBe("Low");
  });
});
