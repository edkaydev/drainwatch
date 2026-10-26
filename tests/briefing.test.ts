import { describe, expect, it } from "vitest";
import {
  BRIEFING_MAX_HOTSPOTS,
  buildBriefingHotspots,
  fallbackBriefing,
  parseBriefingRequest,
  parseBriefingResponse,
  type BriefingHotspot,
} from "@/lib/briefing";
import type { Hotspot } from "@/lib/types";

const NOW = new Date("2026-01-11T12:00:00.000Z");

function makeHotspot(overrides: Partial<Hotspot> = {}): Hotspot {
  return {
    id: "0.348,32.583",
    lat: 0.348,
    lng: 32.583,
    address: "Market drain",
    division: "Central",
    count: 3,
    activeCount: 2,
    resolvedCount: 1,
    score: 72,
    scoreBreakdown: {
      recurrence: 20,
      severity: 25,
      recency: 18,
      concentration: 9,
      subtotal: 72,
      resolvedPenalty: 1,
      total: 72,
    },
    severityCounts: { low: 0, medium: 1, high: 1, critical: 1 },
    categoryCounts: { blocked_drain: 2, flooding: 1 },
    lastReportedAt: new Date("2026-01-10T12:00:00.000Z"),
    incidents: [],
    ...overrides,
  };
}

function makeInput(overrides: Partial<BriefingHotspot> = {}): BriefingHotspot {
  return {
    id: "0.348,32.583",
    label: "Market drain",
    score: 72,
    count: 3,
    activeCount: 2,
    resolvedCount: 1,
    criticalCount: 1,
    highCount: 1,
    topCategory: "blocked_drain",
    lastReportDays: 1,
    ...overrides,
  };
}

describe("buildBriefingHotspots", () => {
  it("sorts by score, caps the payload, and strips incident details", () => {
    const hotspots = Array.from({ length: BRIEFING_MAX_HOTSPOTS + 2 }, (_, index) =>
      makeHotspot({
        id: `cell-${index}`,
        lat: 0.34 + index / 1000,
        lng: 32.58,
        address: `Site ${index}`,
        score: index * 10,
      }),
    );

    const payload = buildBriefingHotspots(hotspots, NOW);

    expect(payload).toHaveLength(BRIEFING_MAX_HOTSPOTS);
    expect(payload[0].id).toBe(`cell-${BRIEFING_MAX_HOTSPOTS + 1}`);
    expect(payload[0].label).toBe(`Site ${BRIEFING_MAX_HOTSPOTS + 1}`);
    expect(payload[0]).not.toHaveProperty("incidents");
    expect(payload[0].lastReportDays).toBe(1);
    expect(payload[0].topCategory).toBe("blocked_drain");
  });

  it("ignores non-finite hotspots", () => {
    const payload = buildBriefingHotspots(
      [makeHotspot({ lat: Number.NaN }), makeHotspot()],
      NOW,
    );

    expect(payload).toHaveLength(1);
  });
});

describe("parseBriefingRequest", () => {
  it("accepts a valid payload", () => {
    const parsed = parseBriefingRequest({ hotspots: [makeInput()] });

    expect(parsed).toEqual([makeInput()]);
  });

  it("rejects empty, oversized, duplicate, and inconsistent payloads", () => {
    expect(parseBriefingRequest({ hotspots: [] })).toBeNull();
    expect(
      parseBriefingRequest({
        hotspots: Array.from({ length: BRIEFING_MAX_HOTSPOTS + 1 }, (_, index) =>
          makeInput({ id: `cell-${index}` }),
        ),
      }),
    ).toBeNull();
    expect(
      parseBriefingRequest({ hotspots: [makeInput(), makeInput()] }),
    ).toBeNull();
    expect(
      parseBriefingRequest({
        hotspots: [makeInput({ activeCount: 4, count: 3 })],
      }),
    ).toBeNull();
    expect(
      parseBriefingRequest({
        hotspots: [makeInput({ topCategory: "not-a-category" as never })],
      }),
    ).toBeNull();
  });
});

describe("fallbackBriefing", () => {
  it("produces a deterministic, attributable draft", () => {
    const briefing = fallbackBriefing([
      makeInput(),
      makeInput({ id: "0.349,32.584", label: "School junction", score: 41 }),
    ]);

    expect(briefing.source).toBe("fallback");
    expect(briefing.headline).toContain("Market drain");
    expect(briefing.summary).toContain("ranks first at 72/100");
    expect(briefing.priorities).toHaveLength(2);
    expect(briefing.priorities[0].hotspotId).toBe("0.348,32.583");
    expect(briefing.caveats).toContain("not a flood prediction");
  });

  it("handles an empty hotspot list", () => {
    const briefing = fallbackBriefing([]);

    expect(briefing.priorities).toEqual([]);
    expect(briefing.headline).toBe("No hotspots to brief");
  });
});

describe("parseBriefingResponse", () => {
  const hotspots = [makeInput(), makeInput({ id: "0.349,32.584" })];

  it("validates and sanitizes model output", () => {
    const briefing = parseBriefingResponse(
      JSON.stringify({
        headline: "  Two sites need review  ",
        summary: "First line.\nSecond line.",
        priorities: [
          {
            hotspotId: "0.348,32.583",
            reason: "  Recurring\nblockage  ",
            action: "Inspect the drain.",
          },
          {
            hotspotId: "unknown-cell",
            reason: "Should be dropped.",
            action: "Do nothing.",
          },
          {
            hotspotId: "0.349,32.584",
            reason: "Recent high-severity report.",
            action: "Confirm access.",
          },
        ],
        caveats: "Draft only.",
      }),
      hotspots,
    );

    expect(briefing?.source).toBe("gemini");
    expect(briefing?.headline).toBe("Two sites need review");
    expect(briefing?.summary).toBe("First line. Second line.");
    expect(briefing?.priorities).toHaveLength(2);
    expect(briefing?.priorities[0].reason).toBe("Recurring blockage");
  });

  it("rejects malformed output and unknown hotspot IDs", () => {
    expect(parseBriefingResponse("not json", hotspots)).toBeNull();
    expect(
      parseBriefingResponse(
        JSON.stringify({
          headline: "Brief",
          summary: "Summary",
          caveats: "Caveat",
          priorities: [
            { hotspotId: "unknown", reason: "Reason", action: "Action" },
          ],
        }),
        hotspots,
      ),
    ).toBeNull();
  });
});
