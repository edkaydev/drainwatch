import { describe, expect, it } from "vitest";
import { incidentsToCsv, hotspotsToCsv } from "@/lib/csv";
import { computeHotspots } from "@/lib/hotspots";
import { makeIncident, makePublicIncident } from "./helpers";

describe("incidentsToCsv", () => {
  it("writes a header and one row per incident", () => {
    const csv = incidentsToCsv([makeIncident(), makeIncident({ id: "incident-2" })]);
    const lines = csv.split("\r\n");

    expect(lines).toHaveLength(3);
    expect(lines[0]).toContain("Reference,Title,Category,Severity,Status");
    expect(lines[1].startsWith("incident-1,Blocked drain,")).toBe(true);
  });

  it("escapes commas, quotes, and newlines", () => {
    const csv = incidentsToCsv([
      makeIncident({
        title: 'Drain, "urgent"',
        description: "Line one\nLine two",
      }),
    ]);

    expect(csv).toContain('"Drain, ""urgent"""');
    expect(csv).toContain('"Line one\nLine two"');
  });

  it("renders empty optional fields and AI columns", () => {
    const csv = incidentsToCsv([
      makeIncident({
        reporter: {},
        ai: undefined,
      }),
    ]);
    const dataRow = csv.split("\r\n")[1];

    expect(dataRow).toContain(",,,");
    expect(dataRow.split(",")).toHaveLength(csv.split("\r\n")[0].split(",").length);
  });
});

describe("hotspotsToCsv", () => {
  it("includes the explainable score components", () => {
    const hotspots = computeHotspots(
      [
        makePublicIncident({
          severity: "critical",
          location: { lat: 0.3476, lng: 32.5825 },
          createdAt: new Date("2026-01-10T12:00:00.000Z"),
        }),
      ],
      new Date("2026-01-11T12:00:00.000Z"),
    );

    const csv = hotspotsToCsv(hotspots);
    const [header, row] = csv.split("\r\n");
    const columns = header.split(",");

    expect(columns).toContain("Recurrence points");
    expect(columns).toContain("Severity points");
    expect(columns).toContain("Recency points");
    expect(columns).toContain("Active density points");
    expect(columns).toContain("Resolved penalty");
    expect(row).toContain("0.348,32.583");
  });
});
