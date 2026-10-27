import { describe, expect, it } from "vitest";
import { buildInsightsDigest, fallbackAnswer, parseInsightsRequest } from "@/lib/insights";
import { makeIncident } from "./helpers";

const NOW = new Date("2026-02-01T12:00:00.000Z");
const THIS_WEEK = new Date("2026-01-30T12:00:00.000Z");
const LAST_WEEK = new Date("2026-01-22T12:00:00.000Z");
const OLD = new Date("2025-12-01T12:00:00.000Z");

describe("buildInsightsDigest", () => {
  it("computes totals, trend, and unresolved high/critical reports from real incidents only", () => {
    const incidents = [
      makeIncident({ id: "a", severity: "critical", status: "new", createdAt: THIS_WEEK }),
      makeIncident({ id: "b", severity: "high", status: "in_progress", createdAt: LAST_WEEK }),
      makeIncident({ id: "c", severity: "low", status: "resolved", createdAt: OLD }),
    ];

    const digest = buildInsightsDigest(incidents, NOW);

    expect(digest.totals).toEqual({ total: 3, active: 2, resolved: 1 });
    expect(digest.trend.thisWeek).toBe(1);
    expect(digest.trend.lastWeek).toBe(1);
    expect(digest.unresolvedCritical).toHaveLength(2);
    expect(digest.unresolvedCritical[0].id).toBe("b");
  });

  it("never includes reporter names, phone numbers, or raw descriptions", () => {
    const incidents = [
      makeIncident({
        reporter: { name: "Jane Doe", phone: "+256700000000", email: "jane@example.com" },
        description: "Private description text that must not leak into AI prompts.",
      }),
    ];

    const digest = buildInsightsDigest(incidents, NOW);
    const serialized = JSON.stringify(digest);

    expect(serialized).not.toContain("Jane Doe");
    expect(serialized).not.toContain("+256700000000");
    expect(serialized).not.toContain("jane@example.com");
    expect(serialized).not.toContain("Private description text");
  });

  it("groups hotspots the same way the public hotspot map does", () => {
    const incidents = [
      makeIncident({ id: "a", location: { lat: 0.3476, lng: 32.5825 }, createdAt: THIS_WEEK }),
      makeIncident({ id: "b", location: { lat: 0.34761, lng: 32.58251 }, createdAt: THIS_WEEK }),
    ];

    const digest = buildInsightsDigest(incidents, NOW);

    expect(digest.topHotspots).toHaveLength(1);
    expect(digest.topHotspots[0].count).toBe(2);
  });
});

describe("parseInsightsRequest", () => {
  it("accepts a digest built by buildInsightsDigest round-tripped through JSON", () => {
    const digest = buildInsightsDigest([makeIncident({ createdAt: THIS_WEEK })], NOW);
    const roundTripped = JSON.parse(JSON.stringify({ digest, question: "What changed?" }));

    const parsed = parseInsightsRequest(roundTripped);

    expect(parsed).not.toBeNull();
    expect(parsed?.question).toBe("What changed?");
    expect(parsed?.digest.totals.total).toBe(1);
  });

  it("rejects a missing question", () => {
    const digest = buildInsightsDigest([makeIncident()], NOW);
    expect(parseInsightsRequest({ digest })).toBeNull();
  });

  it("rejects a malformed digest", () => {
    expect(parseInsightsRequest({ digest: { totals: "nope" }, question: "hi" })).toBeNull();
  });

  it("rejects a digest with too many hotspots", () => {
    const digest = buildInsightsDigest([makeIncident()], NOW);
    const bloated = {
      ...digest,
      topHotspots: Array.from({ length: 20 }, (_, index) => ({
        id: `h${index}`,
        label: "Somewhere",
        score: 10,
        count: 1,
        activeCount: 1,
      })),
    };

    expect(parseInsightsRequest({ digest: bloated, question: "hi" })).toBeNull();
  });
});

describe("fallbackAnswer", () => {
  it("summarizes the digest without calling AI", () => {
    const digest = buildInsightsDigest(
      [makeIncident({ severity: "critical", status: "new", createdAt: THIS_WEEK })],
      NOW,
    );

    const answer = fallbackAnswer(digest);

    expect(answer).toContain("1 total reports");
    expect(answer).toContain("unresolved high/critical");
  });
});
