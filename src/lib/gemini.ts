const INTERACTIONS_URL = "https://generativelanguage.googleapis.com/v1beta/interactions";

export const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";

export type GeminiContent =
  | { type: "text"; text: string }
  | { type: "image"; data: string; mime_type: string };

type InteractionResponse = {
  steps?: Array<{
    type?: string;
    content?: Array<{ type?: string; text?: string }>;
  }>;
  error?: { message?: string; code?: string };
};

type GeminiRequest = {
  apiKey: string;
  model: string;
  systemInstruction: string;
  input: string | GeminiContent[];
  schema: Record<string, unknown>;
  temperature?: number;
  timeoutMs?: number;
};

type GeminiResult =
  | { ok: true; text: string }
  | { ok: false; status: number; reason: string };

function extractOutputText(data: InteractionResponse): string {
  const step = data.steps?.find((item) => item.type === "model_output");
  return (step?.content ?? [])
    .map((part) => part.text ?? "")
    .join("")
    .trim();
}

export async function requestGeminiJson({
  apiKey,
  model,
  systemInstruction,
  input,
  schema,
  temperature = 0.1,
  timeoutMs = 25_000,
}: GeminiRequest): Promise<GeminiResult> {
  try {
    const response = await fetch(INTERACTIONS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        model,
        system_instruction: systemInstruction,
        input,
        generation_config: { temperature },
        response_format: {
          type: "text",
          mime_type: "application/json",
          schema,
        },
      }),
      signal: AbortSignal.timeout(timeoutMs),
      cache: "no-store",
    });

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        reason: `status ${response.status}`,
      };
    }

    const data = (await response.json()) as InteractionResponse;
    if (data.error) {
      return {
        ok: false,
        status: 502,
        reason: data.error.message ?? data.error.code ?? "model error",
      };
    }

    const text = extractOutputText(data);
    if (!text) {
      return { ok: false, status: 502, reason: "empty model output" };
    }

    return { ok: true, text };
  } catch (cause) {
    return {
      ok: false,
      status: 0,
      reason: cause instanceof Error ? cause.message : "unknown error",
    };
  }
}

export function stripCodeFence(text: string): string {
  const trimmed = text.trim();
  if (!trimmed.startsWith("```")) return trimmed;

  return trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
}
