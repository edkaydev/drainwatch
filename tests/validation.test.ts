import { describe, expect, it } from "vitest";
import {
  cleanText,
  isAIClassification,
  isDraftReady,
  parseClassifyRequest,
  photoError,
  sanitizeDraft,
  validateCoordinates,
  validateDraft,
  validateReporter,
  type ReportDraft,
} from "@/lib/validation";

function validDraft(overrides: Partial<ReportDraft> = {}): ReportDraft {
  return {
    category: "blocked_drain",
    severity: "medium",
    title: "Blocked drain on Market Street",
    description:
      "A drain next to the market is blocked with plastic and water cannot flow.",
    location: { lat: 0.3476, lng: 32.5825, address: "Market Street", division: "Central" },
    reporter: { name: "Test Reporter", phone: "+256700000000", email: "test@example.com" },
    ...overrides,
  };
}

describe("coordinate validation", () => {
  it("rejects missing and non-numeric coordinates", () => {
    expect(validateCoordinates(null, null)).toMatch(/Drop a pin/);
    expect(validateCoordinates(Number.NaN, 32.5)).toMatch(/Drop a pin/);
  });

  it("rejects points outside the Kampala service area", () => {
    expect(validateCoordinates(1.2921, 36.8219)).toMatch(/outside the Kampala/);
    expect(validateCoordinates(0.3476, 30)).toMatch(/outside the Kampala/);
  });

  it("accepts points inside the service area", () => {
    expect(validateCoordinates(0.3476, 32.5825)).toBeNull();
  });
});

describe("reporter validation", () => {
  it("accepts blank optional contact details", () => {
    expect(validateReporter({})).toBeNull();
  });

  it("accepts valid phone numbers and emails", () => {
    expect(validateReporter({ phone: "+256 700 000 000", email: "a@b.co" })).toBeNull();
  });

  it("rejects malformed phone numbers and emails", () => {
    expect(validateReporter({ phone: "call me" })).toMatch(/phone/);
    expect(validateReporter({ email: "not-an-email" })).toMatch(/email/);
  });
});

describe("validateDraft", () => {
  it("returns no errors for a complete draft", () => {
    expect(validateDraft(validDraft())).toEqual({});
    expect(isDraftReady(validDraft())).toBe(true);
  });

  it("requires a category and severity", () => {
    const errors = validateDraft(validDraft({ category: "", severity: "" }));
    expect(errors.category).toBeTruthy();
    expect(errors.severity).toBeTruthy();
  });

  it("requires a substantive description", () => {
    const errors = validateDraft(validDraft({ description: "too short" }));
    expect(errors.description).toContain("20 characters");
  });

  it("rejects an overlong title and description", () => {
    const errors = validateDraft(
      validDraft({ title: "x".repeat(121), description: "y".repeat(1201) }),
    );
    expect(errors.title).toBeTruthy();
    expect(errors.description).toBeTruthy();
  });

  it("passes through location and reporter errors", () => {
    const errors = validateDraft(
      validDraft({
        location: { lat: 0, lng: 0 },
        reporter: { email: "bad" },
      }),
    );
    expect(errors.location).toBeTruthy();
    expect(errors.reporter).toBeTruthy();
  });
});

describe("sanitisation", () => {
  it("removes null bytes, trims, and collapses whitespace", () => {
    expect(cleanText("  hello\u0000 world  ")).toBe("hello world");
  });

  it("normalises and truncates every field", () => {
    const draft = sanitizeDraft(
      validDraft({
        title: "  A   very \n long title  ",
        reporter: { name: "  Jane   Doe ", phone: " +256 700 ", email: " a@b.co " },
      }),
    );
    expect(draft.title).toBe("A very long title");
    expect(draft.reporter.name).toBe("Jane Doe");
    expect(draft.location.address).toBe("Market Street");
  });
});

describe("parseClassifyRequest", () => {
  it("rejects non-objects and invalid descriptions", () => {
    expect(parseClassifyRequest(null)).toBeNull();
    expect(parseClassifyRequest("text")).toBeNull();
    expect(parseClassifyRequest({})).toBeNull();
    expect(parseClassifyRequest({ description: "hi" })).toBeNull();
    expect(parseClassifyRequest({ description: "   " })).toBeNull();
    expect(parseClassifyRequest({ description: "x".repeat(4001) })).toBeNull();
  });

  it("keeps valid optional category and severity values", () => {
    expect(
      parseClassifyRequest({
        description: "A blocked drain near the market",
        category: "blocked_drain",
        severity: "high",
      }),
    ).toEqual({
      description: "A blocked drain near the market",
      category: "blocked_drain",
      severity: "high",
    });
  });

  it("drops unrecognised optional values", () => {
    expect(
      parseClassifyRequest({
        description: "A blocked drain near the market",
        category: "lava",
        severity: "apocalyptic",
      }),
    ).toEqual({
      description: "A blocked drain near the market",
      category: undefined,
      severity: undefined,
    });
  });
});

describe("isAIClassification", () => {
  const valid = {
    category: "flooding",
    severity: "high",
    urgency: "high",
    summary: "Water is crossing the road.",
    confidence: 0.7,
    source: "gemini",
  };

  it("accepts a complete classification", () => {
    expect(isAIClassification(valid)).toBe(true);
  });

  it("rejects missing, out-of-range, or unknown fields", () => {
    expect(isAIClassification({ ...valid, confidence: 2 })).toBe(false);
    expect(isAIClassification({ ...valid, confidence: -0.1 })).toBe(false);
    expect(isAIClassification({ ...valid, summary: "" })).toBe(false);
    expect(isAIClassification({ ...valid, summary: "x".repeat(281) })).toBe(false);
    expect(isAIClassification({ ...valid, category: "lava" })).toBe(false);
    expect(isAIClassification({ ...valid, source: "magic" })).toBe(false);
    expect(isAIClassification(null)).toBe(false);
  });
});

describe("photoError", () => {
  it("accepts supported image types within the size limit", () => {
    expect(
      photoError({ type: "image/jpeg", size: 1024 } as File),
    ).toBeNull();
  });

  it("rejects unsupported types and oversized files", () => {
    expect(photoError({ type: "image/gif", size: 1024 } as File)).toMatch(/JPEG/);
    expect(
      photoError({ type: "image/png", size: 5 * 1024 * 1024 + 1 } as File),
    ).toMatch(/5 MB/);
  });
});
