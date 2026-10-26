"use client";

import { useMemo, useState } from "react";
import { Activity, BarChart3, CheckCircle2, Sparkles } from "lucide-react";
import { PageHeader } from "./page-header";
import { StatCard } from "./stat-card";
import { BarList, DonutChart, TrendChart } from "./charts";
import { Card } from "@/components/ui/card";
import { Alert, EmptyState, LoadingBlock } from "@/components/ui/feedback";
import { Select } from "@/components/ui/form";
import { LinkButton } from "@/components/ui/button";
import { useIncidents } from "@/hooks/use-incidents";
import {
  activeIncidents,
  averageResponseHours,
  buildDailyTrend,
  countByCategory,
  countBySeverity,
  countByStatus,
  resolvedRate,
  type CountItem,
} from "@/lib/stats";
import { formatNumber, formatPercent } from "@/lib/format";

const RANGES = [
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
  { value: "all", label: "All time" },
] as const;

type RangeValue = (typeof RANGES)[number]["value"];

function countByDivision(incidents: ReturnType<typeof useIncidents>["data"]): CountItem[] {
  const counts = new Map<string, number>();

  for (const incident of incidents) {
    const key = incident.location.division || "Unspecified";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([label, value]) => ({ key: label, label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);
}

export function AnalyticsView() {
  const { data: incidents, loading, error } = useIncidents();
  const [range, setRange] = useState<RangeValue>("30");

  const scoped = useMemo(() => {
    if (range === "all") return incidents;
    const days = Number(range);
    const cutoff = new Date();
    cutoff.setHours(0, 0, 0, 0);
    cutoff.setDate(cutoff.getDate() - (days - 1));
    return incidents.filter((incident) => incident.createdAt.getTime() >= cutoff.getTime());
  }, [incidents, range]);

  const trendDays = range === "all" ? 30 : Number(range);
  const trend = useMemo(() => buildDailyTrend(scoped, trendDays), [scoped, trendDays]);
  const categoryItems = useMemo(() => countByCategory(scoped), [scoped]);
  const severityItems = useMemo(() => countBySeverity(scoped), [scoped]);
  const statusItems = useMemo(() => countByStatus(scoped), [scoped]);
  const divisionItems = useMemo(() => countByDivision(scoped), [scoped]);

  if (loading) {
    return (
      <div>
        <PageHeader eyebrow="Intelligence" title="Analytics" />
        <LoadingBlock label="Crunching incident data…" />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader eyebrow="Intelligence" title="Analytics" />
        <Alert variant="error" title="Could not load analytics">
          {error}
        </Alert>
      </div>
    );
  }

  if (incidents.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Intelligence" title="Analytics" />
        <EmptyState
          icon={BarChart3}
          title="No data to analyse yet"
          description="Analytics fill in as soon as reports arrive. Submit a report to see the trend, category, severity, and division breakdowns."
          action={
            <LinkButton href="/report" size="sm">
              Submit a report
            </LinkButton>
          }
        />
      </div>
    );
  }

  const active = activeIncidents(scoped);
  const response = averageResponseHours(scoped);
  const withAi = scoped.filter((incident) => incident.ai);
  const reviewedAi = withAi.filter((incident) => incident.ai?.reviewed);
  const geminiAi = withAi.filter((incident) => incident.ai?.source === "gemini");

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Intelligence"
        title="Analytics"
        description="Understand demand, mix, and response performance over time."
        actions={
          <div>
            <label htmlFor="analytics-range" className="sr-only">
              Date range
            </label>
            <Select
              id="analytics-range"
              value={range}
              onChange={(event) => setRange(event.target.value as RangeValue)}
              className="h-9 py-1.5 text-xs"
            >
              {RANGES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Reports in range"
          value={formatNumber(scoped.length)}
          hint={RANGES.find((item) => item.value === range)?.label}
          icon={Activity}
        />
        <StatCard
          label="Still active"
          value={formatNumber(active.length)}
          hint="Not yet resolved"
          icon={BarChart3}
          tone="warning"
        />
        <StatCard
          label="Resolved rate"
          value={formatPercent(resolvedRate(scoped))}
          hint={`${formatNumber(scoped.length - active.length)} resolved`}
          icon={CheckCircle2}
          tone="success"
        />
        <StatCard
          label="Avg response"
          value={response === null ? "—" : `${response.toFixed(1)} h`}
          hint="Submission to resolution"
          icon={Sparkles}
          tone="info"
        />
      </div>

      <Card className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold text-teal-900">Report volume</h2>
            <p className="mt-0.5 text-xs text-ink-400">
              {range === "all" ? "Last 30 days of all-time data" : `Last ${trendDays} days`}
            </p>
          </div>
          <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700">
            {formatNumber(scoped.length)} reports
          </span>
        </div>
        <div className="mt-5">
          <TrendChart points={trend} />
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="p-5">
          <h2 className="font-semibold text-teal-900">By category</h2>
          <p className="mt-0.5 text-xs text-ink-400">Where reports cluster</p>
          <div className="mt-5">
            <BarList items={categoryItems} emptyLabel="No reports in this range" />
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold text-teal-900">By severity</h2>
          <p className="mt-0.5 text-xs text-ink-400">Reported severity mix</p>
          <div className="mt-5">
            <BarList
              items={severityItems}
              emptyLabel="No reports in this range"
              tone="bg-warning-500"
            />
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold text-teal-900">By status</h2>
          <p className="mt-0.5 text-xs text-ink-400">Current workflow stage</p>
          <div className="mt-5">
            <DonutChart
              items={statusItems}
              centreLabel="reports"
              centreValue={formatNumber(scoped.length)}
            />
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="p-5">
          <h2 className="font-semibold text-teal-900">By division</h2>
          <p className="mt-0.5 text-xs text-ink-400">Top 8 divisions in this range</p>
          <div className="mt-5">
            <BarList
              items={divisionItems}
              emptyLabel="No division data in this range"
              tone="bg-teal-500"
            />
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold text-teal-900">AI review</h2>
          <p className="mt-0.5 text-xs text-ink-400">
            Advisory suggestions, not automatic decisions
          </p>
          <dl className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-ink-50 p-4">
              <dt className="text-[11px] font-medium uppercase tracking-wide text-ink-400">
                Suggestions
              </dt>
              <dd className="mt-1 text-2xl font-semibold text-teal-900">
                {formatNumber(withAi.length)}
              </dd>
              <p className="mt-1 text-xs text-ink-500">
                {formatPercent(scoped.length === 0 ? 0 : withAi.length / scoped.length)} of reports
              </p>
            </div>
            <div className="rounded-xl bg-ink-50 p-4">
              <dt className="text-[11px] font-medium uppercase tracking-wide text-ink-400">
                Reviewed
              </dt>
              <dd className="mt-1 text-2xl font-semibold text-teal-900">
                {formatNumber(reviewedAi.length)}
              </dd>
              <p className="mt-1 text-xs text-ink-500">
                {formatPercent(withAi.length === 0 ? 0 : reviewedAi.length / withAi.length)} of
                suggestions
              </p>
            </div>
            <div className="rounded-xl bg-ink-50 p-4">
              <dt className="text-[11px] font-medium uppercase tracking-wide text-ink-400">
                Gemini
              </dt>
              <dd className="mt-1 text-2xl font-semibold text-teal-900">
                {formatNumber(geminiAi.length)}
              </dd>
              <p className="mt-1 text-xs text-ink-500">Model-backed</p>
            </div>
            <div className="rounded-xl bg-ink-50 p-4">
              <dt className="text-[11px] font-medium uppercase tracking-wide text-ink-400">
                Fallback
              </dt>
              <dd className="mt-1 text-2xl font-semibold text-teal-900">
                {formatNumber(withAi.length - geminiAi.length)}
              </dd>
              <p className="mt-1 text-xs text-ink-500">Rule-based</p>
            </div>
          </dl>
        </Card>
      </div>
    </div>
  );
}
