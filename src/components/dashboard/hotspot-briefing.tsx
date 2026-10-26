"use client";

import { useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, Spinner } from "@/components/ui/feedback";
import {
  buildBriefingHotspots,
  type OperationalBriefing,
} from "@/lib/briefing";
import type { Hotspot } from "@/lib/types";

type BriefingResult = {
  key: string;
  briefing: OperationalBriefing;
};

export function HotspotBriefing({ hotspots }: { hotspots: Hotspot[] }) {
  const inputs = useMemo(() => buildBriefingHotspots(hotspots), [hotspots]);
  const labels = useMemo(
    () => new Map(inputs.map((hotspot) => [hotspot.id, hotspot.label])),
    [inputs],
  );
  const currentKey = inputs.map((hotspot) => `${hotspot.id}:${hotspot.score}`).join("|");

  const [result, setResult] = useState<BriefingResult | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const briefing = result?.key === currentKey ? result.briefing : null;

  async function generate() {
    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/briefing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hotspots: inputs }),
        signal: AbortSignal.timeout(15_000),
      });
      const data = (await response.json()) as
        | (OperationalBriefing & { error?: never })
        | { error: string };

      if (!response.ok || "error" in data) {
        throw new Error(
          "error" in data ? data.error : "The briefing service did not respond.",
        );
      }

      if (
        (data.source !== "gemini" && data.source !== "fallback") ||
        !Array.isArray(data.priorities) ||
        typeof data.headline !== "string" ||
        typeof data.summary !== "string" ||
        typeof data.caveats !== "string"
      ) {
        throw new Error("The briefing service returned an unexpected response.");
      }

      setResult({ key: currentKey, briefing: data });
    } catch (cause) {
      setError(
        cause instanceof Error && cause.name === "TimeoutError"
          ? "The briefing timed out. Try again."
          : cause instanceof Error
            ? cause.message
            : "Could not generate the briefing.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <Card className="border-brand-100 bg-gradient-to-br from-brand-50/80 via-white to-white p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-semibold text-teal-900">Operations briefing</h2>
              <Badge variant={briefing?.source === "gemini" ? "info" : "neutral"}>
                {briefing
                  ? briefing.source === "gemini"
                    ? "Gemini draft"
                    : "Rule-based draft"
                  : "Advisory only"}
              </Badge>
            </div>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-ink-500">
              Explains the deterministic ranking using hotspot scores and report
              counts only. Reporter details and report text are never sent. Staff
              must verify conditions before dispatch.
            </p>
          </div>
        </div>

        <Button
          type="button"
          size="sm"
          onClick={generate}
          disabled={pending || inputs.length === 0}
        >
          {pending ? (
            <>
              <Spinner className="h-4 w-4" />
              Writing…
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              {briefing ? "Regenerate" : "Generate briefing"}
            </>
          )}
        </Button>
      </div>

      {error ? (
        <div className="mt-4">
          <Alert variant="error">{error}</Alert>
        </div>
      ) : null}

      <div aria-live="polite">
        {briefing ? (
          <div className="mt-5 border-t border-brand-100 pt-5">
            <h3 className="text-lg font-semibold text-teal-900">{briefing.headline}</h3>
            <p className="mt-2 text-sm leading-6 text-ink-700">{briefing.summary}</p>

            {briefing.priorities.length > 0 ? (
              <ol className="mt-4 space-y-3">
                {briefing.priorities.map((priority, index) => (
                  <li
                    key={priority.hotspotId}
                    className="rounded-xl border border-ink-100 bg-white/80 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="font-medium text-teal-900">
                          {labels.get(priority.hotspotId) ?? priority.hotspotId}
                        </p>
                        <p className="mt-1 text-sm leading-6 text-ink-600">{priority.reason}</p>
                        <p className="mt-1.5 text-sm leading-6 text-ink-800">
                          <span className="font-medium">Verify:</span> {priority.action}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            ) : null}

            <p className="mt-4 text-xs leading-5 text-ink-400">{briefing.caveats}</p>
          </div>
        ) : (
          <p className="mt-4 text-xs leading-5 text-ink-400">
            {inputs.length === 0
              ? "No hotspot cells match the current filters."
              : "The score remains the source of truth. Generate a brief to explain the current top cells and suggested verification steps."}
          </p>
        )}
      </div>
    </Card>
  );
}
