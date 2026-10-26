import { describe, expect, it } from "vitest";
import {
  activeIncidents,
  availableDivisions,
  averageResponseHours,
  buildDailyTrend,
  countByCategory,
  countBySeverity,
  countByStatus,
  filterIncidents,
  resolvedRate,
} from "@/lib/stats";
import { makeIncident } from "./helpers";

const NOW = new Date(2026, 0, 10, 18, 0, 0);

describe("buildDailyTrend", () => {
  it("returns a zero-filled series for the requested window", () => {
    const trend = buildDailyTrend(
      [
        makeIncident({ createdAt: new Date(2026, 0, 10, 9) }),
        makeIncident({ createdAt: new Date(2026, 0, 10, 11) }),
        makeIncident({ createdAt: new Date(2026, 0, 9, 9) }),
        makeIncident({ createdAt: new Date(2025, 0, 1, 9) }),
      ],
      3,
      NOW,
    );

    expect(trend).toHaveLength(3);
    expect(trend.map((point) => point.value)).toEqual([0, 1, 2]);
    expect(trend[2].key).toBe("2026-01-10");
  });
});

describe("counts", () => {
  const incidents = [
    makeIncident({ severity: "low", status: "new", category: "flooding" }),
    makeIncident({ severity: "high", status: "resolved", category: "flooding" }),
    makeIncident({ severity: "high", status: "in_progress", category: "erosion" }),
  ];

  it("counts by severity in a stable order", () => {
    expect(countBySeverity(incidents).map((item) => item.value)).toEqual([1, 0, 2, 0]);
  });

  it("counts by status in workflow order", () => {
    expect(countByStatus(incidents).map((item) => item.value)).toEqual([1, 0, 1, 1]);
  });

  it("counts non-zero categories and sorts descending", () => {
    expect(countByCategory(incidents)).toEqual([
      { key: "flooding", label: "Persistent flooding", value: 2 },
      { key: "erosion", label: "Erosion or collapsed bank", value: 1 },
    ]);
  });

  it("computes the resolved rate", () => {
    expect(resolvedRate(incidents)).toBeCloseTo(1 / 3);
    expect(resolvedRate([])).toBe(0);
  });
});

describe("averageResponseHours", () => {
  it("averages resolvedAt timestamps", () => {
    const created = new Date(2026, 0, 1, 8);
    const incidents = [
      makeIncident({
        status: "resolved",
        createdAt: created,
        resolvedAt: new Date(created.getTime() + 5 * 3_600_000),
      }),
      makeIncident({
        status: "resolved",
        createdAt: created,
        resolvedAt: new Date(created.getTime() + 9 * 3_600_000),
      }),
    ];

    expect(averageResponseHours(incidents)).toBe(7);
  });

  it("falls back to the resolved history entry", () => {
    const created = new Date(2026, 0, 1, 8);
    const incidents = [
      makeIncident({
        status: "resolved",
        createdAt: created,
        statusHistory: [
          { status: "new", at: created, by: null, byName: "Reporter" },
          {
            status: "resolved",
            at: new Date(created.getTime() + 4 * 3_600_000),
            by: "staff-1",
            byName: "Staff",
          },
        ],
      }),
    ];

    expect(averageResponseHours(incidents)).toBe(4);
  });

  it("ignores unresolved or invalid incidents", () => {
    expect(
      averageResponseHours([
        makeIncident({ status: "new" }),
        makeIncident({ status: "resolved", createdAt: new Date(0) }),
      ]),
    ).toBeNull();
  });
});

describe("filterIncidents", () => {
  const incidents = [
    makeIncident({
      id: "a",
      title: "Blocked drain",
      status: "new",
      severity: "high",
      category: "blocked_drain",
      location: { lat: 0.3, lng: 32.5, division: "Central" },
    }),
    makeIncident({
      id: "b",
      title: "Flooded road",
      status: "resolved",
      severity: "low",
      category: "flooding",
      location: { lat: 0.4, lng: 32.6, division: "Nakawa" },
    }),
  ];

  const base = {
    query: "",
    status: "all" as const,
    severity: "all" as const,
    category: "all" as const,
    division: "all",
  };

  it("returns everything with default filters", () => {
    expect(filterIncidents(incidents, base)).toHaveLength(2);
  });

  it("filters by status, severity, category, and division", () => {
    expect(filterIncidents(incidents, { ...base, status: "resolved" })).toHaveLength(1);
    expect(filterIncidents(incidents, { ...base, severity: "high" })).toHaveLength(1);
    expect(filterIncidents(incidents, { ...base, category: "flooding" })).toHaveLength(1);
    expect(filterIncidents(incidents, { ...base, division: "Nakawa" })).toHaveLength(1);
  });

  it("matches case-insensitive text across title, description, and labels", () => {
    expect(filterIncidents(incidents, { ...base, query: "BLOCKED DRAIN" })).toHaveLength(1);
    expect(filterIncidents(incidents, { ...base, query: "persistent flooding" })).toHaveLength(1);
    expect(filterIncidents(incidents, { ...base, query: "central" })).toHaveLength(1);
  });

  it("returns nothing for an unmatched query", () => {
    expect(filterIncidents(incidents, { ...base, query: "lava" })).toHaveLength(0);
  });
});

describe("helpers", () => {
  it("lists sorted, non-empty divisions", () => {
    expect(
      availableDivisions([
        makeIncident({ location: { lat: 0.3, lng: 32.5, division: "Nakawa" } }),
        makeIncident({ location: { lat: 0.3, lng: 32.5, division: "Central" } }),
        makeIncident({ location: { lat: 0.3, lng: 32.5 } }),
      ]),
    ).toEqual(["Central", "Nakawa"]);
  });

  it("keeps only unresolved incidents", () => {
    expect(
      activeIncidents([
        makeIncident({ status: "new" }),
        makeIncident({ status: "resolved" }),
      ]),
    ).toHaveLength(1);
  });
});
