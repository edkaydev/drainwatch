import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/briefing/route";

let ipCounter = 0;

function nextIp(): string {
  ipCounter += 1;
  return `10.1.0.${ipCounter}`;
}

function makeInput() {
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
  };
}

function makeRequest(
  body: unknown,
  options: { ip?: string; contentLength?: number } = {},
): Request {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    "x-forwarded-for": options.ip ?? nextIp(),
  };
  if (options.contentLength !== undefined) {
    headers["content-length"] = String(options.contentLength);
  }

  return new Request("http://localhost/api/briefing", {
    method: "POST",
    headers,
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

function geminiResponse(briefing: unknown): Response {
  return new Response(
    JSON.stringify({
      candidates: [
        {
          content: {
            parts: [{ text: JSON.stringify(briefing) }],
          },
        },
      ],
    }),
    { status: 200, headers: { "content-type": "application/json" } },
  );
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("POST /api/briefing", () => {
  it("returns the deterministic fallback when no Gemini key is configured", async () => {
    vi.stubEnv("GOOGLE_GENERATIVE_AI_API_KEY", "");
    const response = await POST(makeRequest({ hotspots: [makeInput()] }));
    const body = (await response.json()) as {
      source: string;
      headline: string;
      priorities: unknown[];
    };

    expect(response.status).toBe(200);
    expect(body.source).toBe("fallback");
    expect(body.headline).toContain("Market drain");
    expect(body.priorities).toHaveLength(1);
  });

  it("sends only hotspot summaries and keeps the API key out of the URL", async () => {
    vi.stubEnv("GOOGLE_GENERATIVE_AI_API_KEY", "test-key");
    const fetchMock = vi.fn().mockResolvedValue(
      geminiResponse({
        headline: "Review Market drain",
        summary: "The top cell has three reports and two remain active.",
        priorities: [
          {
            hotspotId: "0.348,32.583",
            reason: "Score 72/100 with three reports and two active.",
            action: "Inspect the drain and confirm access.",
          },
        ],
        caveats: "Advisory draft from report data; not a flood prediction.",
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(makeRequest({ hotspots: [makeInput()] }));
    const body = (await response.json()) as { source: string };

    expect(response.status).toBe(200);
    expect(body.source).toBe("gemini");
    expect(fetchMock).toHaveBeenCalledOnce();

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    const sent = JSON.parse(init.body as string) as {
      contents: Array<{ parts: Array<{ text: string }> }>;
      generationConfig: { responseSchema: { required: string[] } };
    };

    expect(url).not.toContain("test-key");
    expect(headers["x-goog-api-key"]).toBe("test-key");
    expect(sent.generationConfig.responseSchema.required).toContain("priorities");
    expect(sent.contents[0].parts[0].text).toContain("Market drain");
    expect(sent.contents[0].parts[0].text).not.toContain("reporter");
    expect(sent.contents[0].parts[0].text).not.toContain("description");
  });

  it("falls back when the model returns invalid JSON", async () => {
    vi.stubEnv("GOOGLE_GENERATIVE_AI_API_KEY", "test-key");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            candidates: [{ content: { parts: [{ text: "not json" }] } }],
          }),
          { status: 200 },
        ),
      ),
    );

    const response = await POST(makeRequest({ hotspots: [makeInput()] }));
    const body = (await response.json()) as { source: string };

    expect(body.source).toBe("fallback");
  });

  it("falls back when the upstream request fails", async () => {
    vi.stubEnv("GOOGLE_GENERATIVE_AI_API_KEY", "test-key");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("upstream error", { status: 503 })),
    );
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await POST(makeRequest({ hotspots: [makeInput()] }));
    const body = (await response.json()) as { source: string };

    expect(body.source).toBe("fallback");
    expect(errorSpy).toHaveBeenCalled();
  });

  it("rejects malformed payloads with 400", async () => {
    vi.stubEnv("GOOGLE_GENERATIVE_AI_API_KEY", "");
    expect((await POST(makeRequest("{not json"))).status).toBe(400);
    expect((await POST(makeRequest({ hotspots: [] }))).status).toBe(400);
  });

  it("rejects oversized bodies with 413", async () => {
    vi.stubEnv("GOOGLE_GENERATIVE_AI_API_KEY", "");
    const response = await POST(
      makeRequest("x".repeat(33_000), { contentLength: 33_000 }),
    );

    expect(response.status).toBe(413);
  });

  it("rate limits repeated briefing requests from the same client", async () => {
    vi.stubEnv("GOOGLE_GENERATIVE_AI_API_KEY", "");
    const ip = nextIp();
    let lastStatus = 0;

    for (let index = 0; index < 11; index += 1) {
      const response = await POST(
        makeRequest({ hotspots: [makeInput()] }, { ip }),
      );
      lastStatus = response.status;
    }

    expect(lastStatus).toBe(429);
  });
});
