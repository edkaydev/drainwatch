import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/insights/route";
import { buildInsightsDigest } from "@/lib/insights";
import { makeIncident } from "./helpers";

let ipCounter = 0;

function nextIp(): string {
  ipCounter += 1;
  return `10.0.2.${ipCounter}`;
}

function makeRequest(body: unknown, options: { ip?: string } = {}): Request {
  return new Request("http://localhost/api/insights", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": options.ip ?? nextIp(),
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

function geminiResponse(payload: unknown): Response {
  return new Response(
    JSON.stringify({
      steps: [
        {
          type: "model_output",
          content: [{ type: "text", text: JSON.stringify(payload) }],
        },
      ],
    }),
    { status: 200, headers: { "content-type": "application/json" } },
  );
}

const DIGEST = buildInsightsDigest([makeIncident()], new Date("2026-02-01T00:00:00.000Z"));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("POST /api/insights", () => {
  it("rejects malformed JSON with 400", async () => {
    vi.stubEnv("GOOGLE_GENERATIVE_AI_API_KEY", "test-key");
    const response = await POST(makeRequest("{not json"));
    expect(response.status).toBe(400);
  });

  it("rejects a missing question with 400", async () => {
    vi.stubEnv("GOOGLE_GENERATIVE_AI_API_KEY", "test-key");
    const response = await POST(makeRequest({ digest: DIGEST }));
    expect(response.status).toBe(400);
  });

  it("returns a deterministic fallback answer when no Gemini key is configured", async () => {
    vi.stubEnv("GOOGLE_GENERATIVE_AI_API_KEY", "");
    const response = await POST(makeRequest({ digest: DIGEST, question: "What changed?" }));
    const body = (await response.json()) as { answer: string; source: string };

    expect(response.status).toBe(200);
    expect(body.source).toBe("fallback");
    expect(body.answer).toContain("total reports");
  });

  it("returns the Gemini answer when the model responds correctly", async () => {
    vi.stubEnv("GOOGLE_GENERATIVE_AI_API_KEY", "test-key");
    const fetchMock = vi
      .fn()
      .mockResolvedValue(geminiResponse({ answer: "Nakawa has the most unresolved reports." }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(
      makeRequest({ digest: DIGEST, question: "Which areas have the most unresolved reports?" }),
    );
    const body = (await response.json()) as { answer: string; source: string };

    expect(response.status).toBe(200);
    expect(body.source).toBe("gemini");
    expect(body.answer).toBe("Nakawa has the most unresolved reports.");
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("falls back when the upstream request fails", async () => {
    vi.stubEnv("GOOGLE_GENERATIVE_AI_API_KEY", "test-key");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("upstream error", { status: 503 })),
    );
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await POST(makeRequest({ digest: DIGEST, question: "What changed?" }));
    const body = (await response.json()) as { source: string };

    expect(response.status).toBe(200);
    expect(body.source).toBe("fallback");
    expect(errorSpy).toHaveBeenCalled();
  });

  it("rate limits repeated requests from the same client", async () => {
    vi.stubEnv("GOOGLE_GENERATIVE_AI_API_KEY", "");
    const ip = nextIp();
    let lastStatus = 0;

    for (let index = 0; index < 16; index += 1) {
      const response = await POST(
        makeRequest({ digest: DIGEST, question: "What changed?" }, { ip }),
      );
      lastStatus = response.status;
    }

    expect(lastStatus).toBe(429);
  });
});
