import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/transcribe/route";

let ipCounter = 0;

function nextIp(): string {
  ipCounter += 1;
  return `10.0.1.${ipCounter}`;
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

  return new Request("http://localhost/api/transcribe", {
    method: "POST",
    headers,
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

const SAMPLE_AUDIO = Buffer.from("not-real-audio-bytes").toString("base64");

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("POST /api/transcribe", () => {
  it("rejects malformed JSON with 400", async () => {
    vi.stubEnv("GOOGLE_GENERATIVE_AI_API_KEY", "test-key");
    const response = await POST(makeRequest("{not json"));
    const body = (await response.json()) as { error: string };

    expect(response.status).toBe(400);
    expect(body.error).toMatch(/JSON body/);
  });

  it("rejects a request with no audio with 400", async () => {
    vi.stubEnv("GOOGLE_GENERATIVE_AI_API_KEY", "test-key");
    const response = await POST(makeRequest({ audioMimeType: "audio/webm" }));

    expect(response.status).toBe(400);
  });

  it("rejects an unsupported mime type with 400", async () => {
    vi.stubEnv("GOOGLE_GENERATIVE_AI_API_KEY", "test-key");
    const response = await POST(
      makeRequest({ audioBase64: SAMPLE_AUDIO, audioMimeType: "video/mp4" }),
    );

    expect(response.status).toBe(400);
  });

  it("rejects oversized bodies with 413", async () => {
    vi.stubEnv("GOOGLE_GENERATIVE_AI_API_KEY", "test-key");
    const big = "x".repeat(9_000_000);
    const response = await POST(
      makeRequest(big, { contentLength: big.length }),
    );

    expect(response.status).toBe(413);
  });

  it("returns 503 when no Gemini key is configured", async () => {
    vi.stubEnv("GOOGLE_GENERATIVE_AI_API_KEY", "");
    const response = await POST(
      makeRequest({ audioBase64: SAMPLE_AUDIO, audioMimeType: "audio/webm" }),
    );

    expect(response.status).toBe(503);
  });

  it("returns the transcript when Gemini hears speech", async () => {
    vi.stubEnv("GOOGLE_GENERATIVE_AI_API_KEY", "test-key");
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        geminiResponse({ transcript: "A blocked drain near the market.", heard: true }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(
      makeRequest({ audioBase64: SAMPLE_AUDIO, audioMimeType: "audio/webm;codecs=opus" }),
    );
    const body = (await response.json()) as { transcript: string };

    expect(response.status).toBe(200);
    expect(body.transcript).toBe("A blocked drain near the market.");
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("returns 422 when Gemini reports no speech was heard", async () => {
    vi.stubEnv("GOOGLE_GENERATIVE_AI_API_KEY", "test-key");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(geminiResponse({ transcript: "", heard: false })),
    );

    const response = await POST(
      makeRequest({ audioBase64: SAMPLE_AUDIO, audioMimeType: "audio/wav" }),
    );

    expect(response.status).toBe(422);
  });

  it("returns 502 when the upstream request fails", async () => {
    vi.stubEnv("GOOGLE_GENERATIVE_AI_API_KEY", "test-key");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("upstream error", { status: 503 })),
    );
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await POST(
      makeRequest({ audioBase64: SAMPLE_AUDIO, audioMimeType: "audio/wav" }),
    );

    expect(response.status).toBe(502);
    expect(errorSpy).toHaveBeenCalled();
  });

  it("rate limits repeated requests from the same client", async () => {
    vi.stubEnv("GOOGLE_GENERATIVE_AI_API_KEY", "");
    const ip = nextIp();
    let lastStatus = 0;

    for (let index = 0; index < 11; index += 1) {
      const response = await POST(
        makeRequest(
          { audioBase64: SAMPLE_AUDIO, audioMimeType: "audio/webm" },
          { ip },
        ),
      );
      lastStatus = response.status;
    }

    expect(lastStatus).toBe(429);
  });
});
