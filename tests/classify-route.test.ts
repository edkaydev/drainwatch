import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/classify/route";

let ipCounter = 0;

function nextIp(): string {
  ipCounter += 1;
  return `10.0.0.${ipCounter}`;
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

  return new Request("http://localhost/api/classify", {
    method: "POST",
    headers,
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

function geminiResponse(classification: unknown): Response {
  return new Response(
    JSON.stringify({
      steps: [
        {
          type: "model_output",
          content: [{ type: "text", text: JSON.stringify(classification) }],
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

describe("POST /api/classify", () => {
  it("rejects malformed JSON with 400", async () => {
    vi.stubEnv("GOOGLE_GENERATIVE_AI_API_KEY", "");
    const response = await POST(makeRequest("{not json"));
    const body = (await response.json()) as { error: string };

    expect(response.status).toBe(400);
    expect(body.error).toMatch(/JSON body/);
  });

  it("rejects a description that is too short with 400", async () => {
    vi.stubEnv("GOOGLE_GENERATIVE_AI_API_KEY", "");
    const response = await POST(makeRequest({ description: "hi" }));

    expect(response.status).toBe(400);
  });

  it("rejects oversized bodies with 413", async () => {
    vi.stubEnv("GOOGLE_GENERATIVE_AI_API_KEY", "");
    const response = await POST(
      makeRequest("x".repeat(33_000), { contentLength: 33_000 }),
    );

    expect(response.status).toBe(413);
  });

  it("returns the deterministic fallback when no Gemini key is configured", async () => {
    vi.stubEnv("GOOGLE_GENERATIVE_AI_API_KEY", "");
    const response = await POST(
      makeRequest({
        description: "A drain is blocked with rubbish and water is not flowing.",
      }),
    );
    const body = (await response.json()) as {
      source: string;
      category: string;
      reviewed: boolean;
    };

    expect(response.status).toBe(200);
    expect(body.source).toBe("fallback");
    expect(body.category).toBe("blocked_drain");
    expect(body.reviewed).toBe(false);
  });

  it("returns the Gemini classification when the model responds correctly", async () => {
    vi.stubEnv("GOOGLE_GENERATIVE_AI_API_KEY", "test-key");
    const fetchMock = vi.fn().mockResolvedValue(
      geminiResponse({
        category: "flooding",
        severity: "high",
        urgency: "high",
        summary: "Water is crossing the road; verify depth and access.",
        confidence: 0.88,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(
      makeRequest({
        description: "Heavy rain has flooded the main road near the market.",
      }),
    );
    const body = (await response.json()) as {
      source: string;
      confidence: number;
      summary: string;
    };

    expect(response.status).toBe(200);
    expect(body.source).toBe("gemini");
    expect(body.confidence).toBe(0.88);
    expect(body.summary).toContain("verify");
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("falls back when Gemini returns invalid JSON text", async () => {
    vi.stubEnv("GOOGLE_GENERATIVE_AI_API_KEY", "test-key");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            steps: [
              { type: "model_output", content: [{ type: "text", text: "not json" }] },
            ],
          }),
          { status: 200 },
        ),
      ),
    );

    const response = await POST(
      makeRequest({ description: "A blocked drain near the market." }),
    );
    const body = (await response.json()) as { source: string };

    expect(response.status).toBe(200);
    expect(body.source).toBe("fallback");
  });

  it("falls back when the upstream request fails", async () => {
    vi.stubEnv("GOOGLE_GENERATIVE_AI_API_KEY", "test-key");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("upstream error", { status: 503 })),
    );
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await POST(
      makeRequest({ description: "A blocked drain near the market." }),
    );
    const body = (await response.json()) as { source: string };

    expect(response.status).toBe(200);
    expect(body.source).toBe("fallback");
    expect(errorSpy).toHaveBeenCalled();
  });

  it("rate limits repeated requests from the same client", async () => {
    vi.stubEnv("GOOGLE_GENERATIVE_AI_API_KEY", "");
    const ip = nextIp();
    let lastStatus = 0;

    for (let index = 0; index < 21; index += 1) {
      const response = await POST(
        makeRequest({ description: "A blocked drain near the market." }, { ip }),
      );
      lastStatus = response.status;
    }

    expect(lastStatus).toBe(429);
  });
});
