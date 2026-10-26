"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  ClipboardList,
  Inbox,
  MapPin,
  Timer,
  TrendingUp,
} from "lucide-react";
import { PageHeader } from "./page-header";
import { StatCard } from "./stat-card";
import { BarList, DonutChart, TrendChart } from "./charts";
import { Card } from "@/components/ui/card";
import { Alert, EmptyState, LoadingBlock } from "@/components/ui/feedback";
import { LinkButton } from "@/components/ui/button";
import { SeverityBadge, StatusBadge } from "@/components/ui/status-badges";
import { useIncidents } from "@/hooks/use-incidents";
import { incidentToPublic } from "@/lib/incidents";
import { computeHotspots, hotspotTone } from "@/lib/hotspots";
import {
  activeIncidents,
  averageResponseHours,
  buildDailyTrend,
  countBySeverity,
  countByStatus,
  resolvedRate,
} from "@/lib/stats";
import { CATEGORY_LABELS } from "@/lib/types";
import { formatNumber, formatRelativeTime, formatPercent } from "@/lib/format";

export function OverviewView() {
  const { data: incidents, loading, error } = useIncidents();

  if (loading) {
    return (
      <div>
        <PageHeader
          eyebrow="Operations"
          title="Overview"
          description="Live incident volume, priority, and response performance."
        />
        <LoadingBlock label="Loading live incidents…" />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader eyebrow="Operations" title="Overview" />
        <Alert variant="error" title="Could not load incidents">
          {error}
        </Alert>
      </div>
    );
  }

  const active = activeIncidents(incidents);
  const highPriority = active.filter(
    (incident) => incident.severity === "high" || incident.severity === "critical",
  ).length;
  const response = averageResponseHours(incidents);
  const hotspots = computeHotspots(incidents.map(incidentToPublic)).slice(0, 5);
  const trend = buildDailyTrend(incidents, 14);
  const statusCounts = countByStatus(incidents);
  const recent = incidents.slice(0, 5);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operations"
        title="Overview"
        description="Live incident volume, priority, and response performance from Firestore."
        actions={
          <>
            <LinkButton href="/dashboard/incidents" variant="outline" size="sm">
              All incidents
            </LinkButton>
            <LinkButton href="/dashboard/reports" size="sm">
              Export report
            </LinkButton>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total incidents"
          value={formatNumber(incidents.length)}
          hint={`${formatNumber(active.length)} still active`}
          icon={ClipboardList}
        />
        <StatCard
          label="High priority"
          value={formatNumber(highPriority)}
          hint="Active high or critical reports"
          icon={AlertTriangle}
          tone="warning"
        />
        <StatCard
          label="Resolved"
          value={formatPercent(resolvedRate(incidents))}
          hint={`${formatNumber(incidents.length - active.length)} incidents closed`}
          icon={TrendingUp}
          tone="success"
        />
        <StatCard
          label="Avg response"
          value={response === null ? "—" : `${response.toFixed(1)} h`}
          hint="Report submitted to resolved"
          icon={Timer}
          tone="info"
        />
      </div>

      {incidents.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No incidents yet"
          description="Once a report is submitted, it appears here in real time. You can also submit a report from the public site to test the full workflow."
          action={
            <LinkButton href="/report" size="sm">
              Submit a report
            </LinkButton>
          }
        />
      ) : (
        <>
          <div className="grid gap-6 xl:grid-cols-3">
            <Card className="p-5 xl:col-span-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-teal-900">Reports received</h3>
                  <p className="mt-0.5 text-xs text-ink-400">Last 14 days</p>
                </div>
                <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700">
                  Live data
                </span>
              </div>
              <div className="mt-5">
                <TrendChart points={trend} />
              </div>
            </Card>

            <Card className="p-5">
              <h3 className="font-semibold text-teal-900">Status breakdown</h3>
              <p className="mt-0.5 text-xs text-ink-400">All reports</p>
              <div className="mt-6">
                <DonutChart
                  items={statusCounts}
                  centreLabel="incidents"
                  centreValue={formatNumber(incidents.length)}
                />
              </div>
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-teal-900">Top hotspots</h3>
                  <p className="mt-0.5 text-xs text-ink-400">
                    Recurrence, severity, recency, concentration
                  </p>
                </div>
                <Link
                  href="/dashboard/hotspots"
                  className="inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:text-brand-800"
                >
                  View all <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </div>
              {hotspots.length === 0 ? (
                <p className="py-8 text-center text-sm text-ink-400">
                  Hotspots appear when reports are grouped into a location cell.
                </p>
              ) : (
                <ul className="mt-4 space-y-2">
                  {hotspots.map((hotspot) => {
                    const tone = hotspotTone(hotspot.score);
                    return (
                      <li key={hotspot.id}>
                        <div className="flex items-center gap-3 rounded-xl border border-ink-100 px-3.5 py-3">
                          <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${tone.dot}`} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-ink-800">
                              {hotspot.address || hotspot.division || "Kampala"}
                            </p>
                            <p className="text-xs text-ink-400">
                              {hotspot.count} report{hotspot.count === 1 ? "" : "s"} ·{" "}
                              {formatRelativeTime(hotspot.lastReportedAt)}
                            </p>
                          </div>
                          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${tone.className}`}>
                            {hotspot.score}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>

            <Card className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-teal-900">Recent incidents</h3>
                  <p className="mt-0.5 text-xs text-ink-400">Newest reports first</p>
                </div>
                <Link
                  href="/dashboard/incidents"
                  className="inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:text-brand-800"
                >
                  View all <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </div>
              <ul className="mt-4 divide-y divide-ink-100">
                {recent.map((incident) => (
                  <li key={incident.id}>
                    <Link
                      href={`/dashboard/incidents/${incident.id}`}
                      className="-mx-2 flex items-start gap-3 rounded-xl px-2 py-3 transition-colors hover:bg-ink-50"
                    >
                      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                        <MapPin className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-ink-800">
                          {incident.title}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-ink-400">
                          {CATEGORY_LABELS[incident.category]} ·{" "}
                          {formatRelativeTime(incident.createdAt)}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <SeverityBadge severity={incident.severity} />
                        <StatusBadge status={incident.status} />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          <Card className="p-5">
            <h3 className="font-semibold text-teal-900">Severity mix</h3>
            <p className="mt-0.5 text-xs text-ink-400">All reports by reported severity</p>
            <div className="mt-5">
              <BarList items={countBySeverity(incidents)} />
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

