import { describe, expect, it } from "vitest";
import {
  classifyFallback,
  severityFromScore,
  severityWeight,
} from "@/lib/classifier";

describe("classifyFallback", () => {
  it("detects a blocked drain from keyword matches", () => {
    const result = classifyFallback({
      description: "The drain is choked and water is not flowing near the market.",
    });

    expect(result.category).toBe("blocked_drain");
    expect(result.source).toBe("fallback");
    expect(result.reviewed).toBe(false);
  });

  it("detects an open manhole and escalates critical severity", () => {
    const result = classifyFallback({
      description: "An open manhole near a school is a danger to children.",
    });

    expect(result.category).toBe("open_manhole");
    expect(result.severity).toBe("critical");
    expect(result.urgency).toBe("immediate");
  });

  it("keeps low-severity wording low", () => {
    const result = classifyFallback({
      description: "There is a minor cosmetic crack beside the drain.",
    });

    expect(result.severity).toBe("low");
    expect(result.urgency).toBe("low");
  });

  it("falls back to other/medium for unmatched text", () => {
    const result = classifyFallback({
      description: "Something looks unusual near the road today.",
    });

    expect(result.category).toBe("other");
    expect(result.severity).toBe("medium");
    expect(result.confidence).toBe(0.35);
    expect(result.summary).toContain("staff should verify");
  });

  it("uses the reporter-provided category and severity when no keywords match", () => {
    const result = classifyFallback({
      description: "The situation is bad.",
      category: "flooding",
      severity: "high",
    });

    expect(result.category).toBe("flooding");
    expect(result.severity).toBe("high");
  });

  it("combines category and severity keywords without exceeding the confidence cap", () => {
    const result = classifyFallback({
      description:
        "A completely blocked culvert with stagnant water has closed the main road; a child was injured near homes.",
    });

    expect(result.category).toBe("broken_culvert");
    expect(result.severity).toBe("critical");
    expect(result.confidence).toBeLessThanOrEqual(0.82);
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.summary.length).toBeLessThanOrEqual(280);
  });
});

describe("severity helpers", () => {
  it("maps numeric scores to severity bands", () => {
    expect(severityFromScore(0.95)).toBe("critical");
    expect(severityFromScore(0.9)).toBe("critical");
    expect(severityFromScore(0.6)).toBe("high");
    expect(severityFromScore(0.3)).toBe("medium");
    expect(severityFromScore(0.29)).toBe("low");
  });

  it("exposes monotonic severity weights", () => {
    expect(severityWeight("low")).toBeLessThan(severityWeight("medium"));
    expect(severityWeight("medium")).toBeLessThan(severityWeight("high"));
    expect(severityWeight("high")).toBeLessThan(severityWeight("critical"));
  });
});
