import { describe, expect, it } from "vitest";
import {
  canTransitionStatus,
  nextStatuses,
  type IncidentStatus,
} from "@/lib/types";

describe("status workflow", () => {
  it("allows the linear happy path", () => {
    expect(canTransitionStatus("new", "in_progress")).toBe(true);
    expect(canTransitionStatus("in_progress", "resolved")).toBe(true);
  });

  it("allows a resolved incident to be reopened", () => {
    expect(canTransitionStatus("resolved", "in_progress")).toBe(true);
  });

  it("rejects skipped stages", () => {
    expect(canTransitionStatus("new", "resolved")).toBe(false);
  });

  it("rejects backwards or same-state transitions", () => {
    expect(canTransitionStatus("resolved", "new")).toBe(false);
    expect(canTransitionStatus("new", "new")).toBe(false);
  });

  it("lists exactly the allowed next statuses", () => {
    expect(nextStatuses("new")).toEqual(["in_progress"]);
    expect(nextStatuses("in_progress")).toEqual(["resolved"]);
    expect(nextStatuses("resolved")).toEqual(["in_progress"]);
  });

  it("covers every status in the workflow", () => {
    const statuses: IncidentStatus[] = ["new", "in_progress", "resolved"];
    for (const status of statuses) {
      expect(nextStatuses(status).length).toBeGreaterThan(0);
    }
  });
});
