"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Inbox,
  MapPinned,
  Send,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { PageHeader } from "./page-header";
import { StatCard } from "./stat-card";
import { Card } from "@/components/ui/card";
import { Alert, EmptyState, LoadingBlock, Spinner } from "@/components/ui/feedback";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/form";
import { SeverityBadge } from "@/components/ui/status-badges";
import { useIncidents } from "@/hooks/use-incidents";
import { buildInsightsDigest, type InsightsDigest } from "@/lib/insights";
import { hotspotTone } from "@/lib/hotspots";
import { formatNumber } from "@/lib/format";

const SUGGESTED_QUESTIONS = [
  "Which areas have the most unresolved reports?",
  "What drainage problem appears most frequently?",
  "What changed compared with last week?",
  "Which critical reports still need action?",
];

type Exchange = {
  question: string;
  answer: string;
  source: "gemini" | "fallback";
};

export function AiInsightsView() {
  const { data: incidents, loading, error } = useIncidents();
  const [question, setQuestion] = useState("");
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [asking, setAsking] = useState(false);
  const [askError, setAskError] = useState<string | null>(null);

  const digest: InsightsDigest | null = useMemo(
    () => (incidents.length > 0 ? buildInsightsDigest(incidents) : null),
    [incidents],
  );

  async function ask(text: string) {
    if (!digest || asking) return;
    const trimmed = text.trim();
    if (trimmed.length < 3) {
      setAskError("Ask a more specific question.");
      return;
    }

    setAsking(true);
    setAskError(null);

    try {
      const response = await fetch("/api/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ digest, question: trimmed }),
      });

      const data = (await response.json()) as { answer?: string; source?: string; error?: string };
      if (!response.ok || !data.answer) {
        throw new Error(data.error || "Could not get an answer.");
      }

      setExchanges((current) => [
        ...current,
        {
          question: trimmed,
          answer: data.answer as string,
          source: data.source === "gemini" ? "gemini" : "fallback",
        },
      ]);
      setQuestion("");
    } catch (cause) {
      setAskError(cause instanceof Error ? cause.message : "Could not get an answer.");
    } finally {
      setAsking(false);
    }
  }

  if (loading) {
    return (
      <div>
        <PageHeader eyebrow="Operations" title="AI Insights" description="Ask questions about reported data." />
        <LoadingBlock label="Loading live incidents…" />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader eyebrow="Operations" title="AI Insights" />
        <Alert variant="error" title="Could not load incidents">
          {error}
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operations"
        title="AI Insights"
        description="Recurring areas, trends, and priorities computed from live reports — plus a Q&A assistant grounded only in that data."
      />

      {!digest ? (
        <EmptyState
          icon={Inbox}
          title="No incidents yet"
          description="Insights appear once reports start coming in."
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Reports this week"
              value={formatNumber(digest.trend.thisWeek)}
              hint={`${formatNumber(digest.trend.lastWeek)} last week`}
              icon={digest.trend.thisWeek >= digest.trend.lastWeek ? TrendingUp : TrendingDown}
              tone={digest.trend.thisWeek > digest.trend.lastWeek ? "warning" : "success"}
            />
            <StatCard
              label="Unresolved high/critical"
              value={formatNumber(digest.unresolvedCritical.length)}
              hint="Needs staff review"
              icon={AlertTriangle}
              tone="warning"
            />
            <StatCard
              label="Top hotspot score"
              value={digest.topHotspots[0] ? `${digest.topHotspots[0].score}/100` : "—"}
              hint={digest.topHotspots[0]?.label ?? "No hotspots yet"}
              icon={MapPinned}
            />
            <StatCard
              label="Total reports"
              value={formatNumber(digest.totals.total)}
              hint={`${formatNumber(digest.totals.active)} active`}
              icon={Sparkles}
              tone="info"
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card className="p-5">
              <h3 className="font-semibold text-teal-900">Recurring areas</h3>
              <p className="mt-0.5 text-xs text-ink-400">Ranked by recurrence, severity, recency, concentration</p>
              {digest.topHotspots.length === 0 ? (
                <p className="py-8 text-center text-sm text-ink-400">
                  Hotspots appear once reports share a location.
                </p>
              ) : (
                <ul className="mt-4 space-y-2">
                  {digest.topHotspots.map((hotspot) => {
                    const tone = hotspotTone(hotspot.score);
                    return (
                      <li
                        key={hotspot.id}
                        className="flex items-center gap-3 rounded-xl border border-ink-100 px-3.5 py-3"
                      >
                        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${tone.dot}`} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-ink-800">{hotspot.label}</p>
                          <p className="text-xs text-ink-400">
                            {hotspot.count} report{hotspot.count === 1 ? "" : "s"} ·{" "}
                            {hotspot.activeCount} active
                          </p>
                        </div>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${tone.className}`}>
                          {hotspot.score}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>

            <Card className="p-5">
              <h3 className="font-semibold text-teal-900">Unresolved high &amp; critical</h3>
              <p className="mt-0.5 text-xs text-ink-400">Oldest first</p>
              {digest.unresolvedCritical.length === 0 ? (
                <p className="py-8 text-center text-sm text-ink-400">
                  No unresolved high or critical reports right now.
                </p>
              ) : (
                <ul className="mt-4 divide-y divide-ink-100">
                  {digest.unresolvedCritical.map((item) => (
                    <li key={item.id} className="flex items-center gap-3 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-ink-800">{item.title}</p>
                        <p className="truncate text-xs text-ink-400">
                          {item.label} · {item.ageDays} day{item.ageDays === 1 ? "" : "s"} old
                        </p>
                      </div>
                      <SeverityBadge severity={item.severity} />
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          <Card className="p-5">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-brand-600" aria-hidden="true" />
              <h3 className="font-semibold text-teal-900">Ask about this data</h3>
            </div>
            <p className="mt-1 text-xs text-ink-500">
              Answers are grounded only in the counts above — never invented locations, causes, or
              predictions. This is advisory; no action is taken automatically.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {SUGGESTED_QUESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => void ask(suggestion)}
                  disabled={asking}
                  className="rounded-full border border-ink-200 bg-white px-3 py-1.5 text-xs font-medium text-ink-700 transition-colors hover:bg-ink-50 disabled:pointer-events-none disabled:opacity-50"
                >
                  {suggestion}
                </button>
              ))}
            </div>

            {exchanges.length > 0 ? (
              <ul className="mt-4 space-y-3">
                {exchanges.map((exchange, index) => (
                  <li key={index} className="rounded-xl border border-ink-100 p-4">
                    <p className="text-sm font-medium text-ink-800">{exchange.question}</p>
                    <p className="mt-2 text-sm leading-6 text-ink-700">{exchange.answer}</p>
                    {exchange.source === "fallback" ? (
                      <p className="mt-2 text-xs font-medium text-warning-600">
                        AI is unavailable right now — this is a computed summary, not a generated answer.
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : null}

            {askError ? (
              <Alert variant="error" className="mt-4">
                {askError}
              </Alert>
            ) : null}

            <form
              className="mt-4 flex items-end gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                void ask(question);
              }}
            >
              <Textarea
                value={question}
                onChange={(event) => setQuestion(event.target.value.slice(0, 300))}
                placeholder="Ask a question about the reported data…"
                rows={1}
                disabled={asking}
                className="flex-1"
              />
              <Button type="submit" disabled={asking || question.trim().length < 3}>
                {asking ? <Spinner className="h-4 w-4" /> : <Send className="h-4 w-4" aria-hidden="true" />}
                Ask
              </Button>
            </form>
          </Card>
        </>
      )}
    </div>
  );
}
