"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDownToLine,
  ArrowUpRight,
  MapPinned,
  MapPin,
  TrendingUp,
} from "lucide-react";
import { PageHeader } from "./page-header";
import { StatCard } from "./stat-card";
import { Card } from "@/components/ui/card";
import { Alert, EmptyState, LoadingBlock } from "@/components/ui/feedback";
import { Button, LinkButton } from "@/components/ui/button";
import { Select } from "@/components/ui/form";
import { useIncidents } from "@/hooks/use-incidents";
import { incidentToPublic } from "@/lib/incidents";
import { computeHotspots, hotspotTone } from "@/lib/hotspots";
import { downloadCsv, hotspotsToCsv } from "@/lib/csv";
import { CATEGORY_LABELS, SEVERITY_LABELS, type Severity } from "@/lib/types";
import { formatNumber, formatRelativeTime } from "@/lib/format";

const MIN_SCORE_OPTIONS = [
  { value: 0, label: "All scores" },
  { value: 35, label: "Moderate (35+)" },
  { value: 55, label: "High (55+)" },
  { value: 75, label: "Critical (75+)" },
];

export function HotspotsView() {
  const { data: incidents, loading, error } = useIncidents();
  const [division, setDivision] = useState("all");
  const [minScore, setMinScore] = useState(0);
  const [activeOnly, setActiveOnly] = useState(true);

  const hotspots = useMemo(
    () => computeHotspots(incidents.map(incidentToPublic)),
    [incidents],
  );

  const divisions = useMemo(
    () =>
      Array.from(
        new Set(hotspots.map((hotspot) => hotspot.division).filter(Boolean) as string[]),
      ).sort(),
    [hotspots],
  );

  const filtered = useMemo(
    () =>
      hotspots.filter((hotspot) => {
        if (division !== "all" && hotspot.division !== division) return false;
        if (hotspot.score < minScore) return false;
        if (activeOnly && hotspot.activeCount === 0) return false;
        return true;
      }),
    [hotspots, division, minScore, activeOnly],
  );

  if (loading) {
    return (
      <div>
        <PageHeader eyebrow="Intelligence" title="Hotspots" />
        <LoadingBlock label="Calculating hotspots…" />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader eyebrow="Intelligence" title="Hotspots" />
        <Alert variant="error" title="Could not load hotspot data">
          {error}
        </Alert>
      </div>
    );
  }

  const criticalCount = hotspots.filter((hotspot) => hotspot.score >= 75).length;
  const highCount = hotspots.filter((hotspot) => hotspot.score >= 55).length;
  const reportsInHotspots = hotspots.reduce((total, hotspot) => total + hotspot.count, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Intelligence"
        title="Hotspots"
        description="Locations grouped into ~110 m cells and ranked by recurrence, severity, recency, and concentration."
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                downloadCsv(
                  `drainwatch-hotspots-${new Date().toISOString().slice(0, 10)}.csv`,
                  hotspotsToCsv(filtered),
                )
              }
              disabled={filtered.length === 0}
            >
              <ArrowDownToLine className="h-4 w-4" aria-hidden="true" />
              Export CSV
            </Button>
            <LinkButton href="/map" size="sm">
              Public map
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </LinkButton>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Hotspot cells"
          value={formatNumber(hotspots.length)}
          hint="Distinct ~110 m locations"
          icon={MapPinned}
        />
        <StatCard
          label="Critical hotspots"
          value={formatNumber(criticalCount)}
          hint="Score 75 or higher"
          icon={TrendingUp}
          tone="critical"
        />
        <StatCard
          label="High or critical"
          value={formatNumber(highCount)}
          hint="Score 55 or higher"
          icon={MapPin}
          tone="warning"
        />
        <StatCard
          label="Reports grouped"
          value={formatNumber(reportsInHotspots)}
          hint={`Across ${formatNumber(hotspots.length)} cells`}
          icon={MapPinned}
          tone="info"
        />
      </div>

      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div>
            <label htmlFor="hotspot-division" className="mb-1.5 block text-xs font-medium text-ink-500">
              Division
            </label>
            <Select
              id="hotspot-division"
              value={division}
              onChange={(event) => setDivision(event.target.value)}
              className="h-9 py-1.5 text-xs"
            >
              <option value="all">All divisions</option>
              {divisions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label htmlFor="hotspot-score" className="mb-1.5 block text-xs font-medium text-ink-500">
              Minimum score
            </label>
            <Select
              id="hotspot-score"
              value={minScore}
              onChange={(event) => setMinScore(Number(event.target.value))}
              className="h-9 py-1.5 text-xs"
            >
              {MIN_SCORE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>

          <label className="flex items-center gap-2 pb-2 text-xs font-medium text-ink-600">
            <input
              type="checkbox"
              checked={activeOnly}
              onChange={(event) => setActiveOnly(event.target.checked)}
              className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
            />
            Active hotspots only
          </label>

          <p className="ml-auto pb-2 text-xs text-ink-500" aria-live="polite">
            Showing <span className="font-semibold text-ink-800">{filtered.length}</span> of{" "}
            {hotspots.length}
          </p>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState
          icon={MapPinned}
          title={hotspots.length === 0 ? "No hotspots yet" : "No hotspots match these filters"}
          description={
            hotspots.length === 0
              ? "Hotspots appear when two or more reports share a location, or when a single report is severe and recent."
              : "Lower the minimum score or clear the division filter."
          }
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setDivision("all");
                setMinScore(0);
                setActiveOnly(false);
              }}
            >
              Clear filters
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((hotspot) => {
            const tone = hotspotTone(hotspot.score);
            const categoryEntry = Object.entries(hotspot.categoryCounts).sort(
              (a, b) => b[1] - a[1],
            )[0];

            return (
              <Card key={hotspot.id} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${tone.dot}`} />
                      <h3 className="truncate font-semibold text-teal-900">
                        {hotspot.address || hotspot.division || "Kampala"}
                      </h3>
                    </div>
                    <p className="mt-1 text-xs text-ink-400">
                      {hotspot.division ? `${hotspot.division} · ` : ""}
                      {hotspot.lat.toFixed(4)}, {hotspot.lng.toFixed(4)}
                    </p>
                  </div>
                  <div
                    className={`flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl ${tone.className}`}
                    aria-label={`Hotspot score ${hotspot.score} out of 100, ${tone.label}`}
                  >
                    <span className="text-lg font-semibold leading-none">{hotspot.score}</span>
                    <span className="mt-0.5 text-[9px] font-medium uppercase tracking-wide">
                      {tone.label}
                    </span>
                  </div>
                </div>

                <dl className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-ink-50 p-3 text-center">
                  <div>
                    <dt className="text-[10px] uppercase tracking-wide text-ink-400">Reports</dt>
                    <dd className="mt-0.5 text-sm font-semibold text-teal-900">{hotspot.count}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] uppercase tracking-wide text-ink-400">Active</dt>
                    <dd className="mt-0.5 text-sm font-semibold text-teal-900">{hotspot.activeCount}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] uppercase tracking-wide text-ink-400">Resolved</dt>
                    <dd className="mt-0.5 text-sm font-semibold text-teal-900">{hotspot.resolvedCount}</dd>
                  </div>
                </dl>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {(["critical", "high", "medium", "low"] as Severity[])
                    .filter((severity) => hotspot.severityCounts[severity] > 0)
                    .map((severity) => (
                      <span
                        key={severity}
                        className="rounded-full bg-white px-2 py-1 text-[11px] font-medium text-ink-600 ring-1 ring-ink-100"
                      >
                        {SEVERITY_LABELS[severity]} · {hotspot.severityCounts[severity]}
                      </span>
                    ))}
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-ink-100 pt-3 text-xs text-ink-500">
                  <p>
                    {categoryEntry
                      ? `${CATEGORY_LABELS[categoryEntry[0] as keyof typeof CATEGORY_LABELS]}`
                      : "Mixed categories"}{" "}
                    · last {formatRelativeTime(hotspot.lastReportedAt)}
                  </p>
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/map?hotspot=${encodeURIComponent(hotspot.id)}`}
                      className="inline-flex items-center gap-1 font-medium text-brand-700 hover:text-brand-800"
                    >
                      Map <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>
                    {hotspot.incidents[0] ? (
                      <Link
                        href={`/dashboard/incidents/${hotspot.incidents[0].id}`}
                        className="inline-flex items-center gap-1 font-medium text-brand-700 hover:text-brand-800"
                      >
                        Newest report
                      </Link>
                    ) : null}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Card className="p-6">
        <h2 className="font-semibold text-teal-900">How the score works</h2>
        <p className="mt-1 text-sm text-ink-500">
          Each hotspot score is capped at 100 and weighs four transparent signals.
          Resolved reports still contribute, but at a reduced weight.
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Recurrence", weight: "40 points", detail: "Number of reports in the cell, capped at 12." },
            { label: "Severity", weight: "30 points", detail: "Critical and high reports carry the most weight." },
            { label: "Recency", weight: "20 points", detail: "Newer reports score higher, decaying over 180 days." },
            { label: "Concentration", weight: "10 points", detail: "More active reports in the same cell score higher." },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-ink-100 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
                {item.weight}
              </p>
              <h3 className="mt-1 font-medium text-teal-900">{item.label}</h3>
              <p className="mt-1 text-xs leading-5 text-ink-500">{item.detail}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
