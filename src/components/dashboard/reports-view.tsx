"use client";

import { useMemo, useState } from "react";
import {
  ArrowDownToLine,
  FileBarChart,
  FileSpreadsheet,
  MapPinned,
  ShieldAlert,
} from "lucide-react";
import { PageHeader } from "./page-header";
import { Card } from "@/components/ui/card";
import { Alert, EmptyState, LoadingBlock } from "@/components/ui/feedback";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/form";
import { SeverityBadge, StatusBadge } from "@/components/ui/status-badges";
import { useIncidents } from "@/hooks/use-incidents";
import { incidentToPublic } from "@/lib/incidents";
import { computeHotspots } from "@/lib/hotspots";
import { downloadCsv, hotspotsToCsv, incidentsToCsv } from "@/lib/csv";
import {
  INCIDENT_STATUSES,
  SEVERITIES,
  SEVERITY_LABELS,
  STATUS_LABELS,
  type IncidentStatus,
  type Severity,
} from "@/lib/types";
import { formatDate, formatNumber, formatRelativeTime } from "@/lib/format";

const RANGES = [
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
  { value: "all", label: "All time" },
] as const;

type RangeValue = (typeof RANGES)[number]["value"];

export function ReportsView() {
  const { data: incidents, loading, error } = useIncidents();
  const [range, setRange] = useState<RangeValue>("30");
  const [status, setStatus] = useState<IncidentStatus | "all">("all");
  const [severity, setSeverity] = useState<Severity | "all">("all");

  const filtered = useMemo(() => {
    let scoped = incidents;

    if (range !== "all") {
      const cutoff = new Date();
      cutoff.setHours(0, 0, 0, 0);
      cutoff.setDate(cutoff.getDate() - (Number(range) - 1));
      scoped = scoped.filter((incident) => incident.createdAt.getTime() >= cutoff.getTime());
    }

    if (status !== "all") scoped = scoped.filter((incident) => incident.status === status);
    if (severity !== "all") scoped = scoped.filter((incident) => incident.severity === severity);

    return scoped;
  }, [incidents, range, status, severity]);

  const hotspots = useMemo(
    () => computeHotspots(filtered.map(incidentToPublic)),
    [filtered],
  );

  if (loading) {
    return (
      <div>
        <PageHeader eyebrow="Operations" title="Reports & exports" />
        <LoadingBlock label="Preparing report data…" />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader eyebrow="Operations" title="Reports & exports" />
        <Alert variant="error" title="Could not load report data">
          {error}
        </Alert>
      </div>
    );
  }

  const newCount = filtered.filter((incident) => incident.status === "new").length;
  const inProgress = filtered.filter((incident) => incident.status === "in_progress").length;
  const resolved = filtered.filter((incident) => incident.status === "resolved").length;
  const preview = filtered.slice(0, 8);
  const stamp = new Date().toISOString().slice(0, 10);

  function exportIncidents() {
    downloadCsv(`drainwatch-incidents-${stamp}.csv`, incidentsToCsv(filtered));
  }

  function exportHotspots() {
    downloadCsv(`drainwatch-hotspots-${stamp}.csv`, hotspotsToCsv(hotspots));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operations"
        title="Reports & exports"
        description="Build a scoped dataset for briefings, handovers, and partner reporting."
      />

      <Card className="p-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label htmlFor="reports-range" className="mb-1.5 block text-xs font-medium text-ink-500">
              Date range
            </label>
            <Select
              id="reports-range"
              value={range}
              onChange={(event) => setRange(event.target.value as RangeValue)}
            >
              {RANGES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label htmlFor="reports-status" className="mb-1.5 block text-xs font-medium text-ink-500">
              Status
            </label>
            <Select
              id="reports-status"
              value={status}
              onChange={(event) => setStatus(event.target.value as IncidentStatus | "all")}
            >
              <option value="all">All statuses</option>
              {INCIDENT_STATUSES.map((item) => (
                <option key={item} value={item}>
                  {STATUS_LABELS[item]}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label htmlFor="reports-severity" className="mb-1.5 block text-xs font-medium text-ink-500">
              Severity
            </label>
            <Select
              id="reports-severity"
              value={severity}
              onChange={(event) => setSeverity(event.target.value as Severity | "all")}
            >
              <option value="all">All severities</option>
              {SEVERITIES.map((item) => (
                <option key={item} value={item}>
                  {SEVERITY_LABELS[item]}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-ink-100 pt-3 text-xs text-ink-500" aria-live="polite">
          <p>
            <span className="font-semibold text-ink-800">{formatNumber(filtered.length)}</span>{" "}
            incidents in scope
          </p>
          <span className="text-ink-300">·</span>
          <p>
            <span className="font-semibold text-ink-800">{formatNumber(hotspots.length)}</span>{" "}
            hotspot cells
          </p>
          <span className="ml-auto">Generated {formatDate(new Date())}</span>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryTile label="In scope" value={filtered.length} />
        <SummaryTile label="New" value={newCount} />
        <SummaryTile label="In progress" value={inProgress} />
        <SummaryTile label="Resolved" value={resolved} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="flex flex-col p-6">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <FileSpreadsheet className="h-5 w-5" aria-hidden="true" />
          </span>
          <h2 className="mt-4 font-semibold text-teal-900">Incident register (CSV)</h2>
          <p className="mt-1 flex-1 text-sm leading-6 text-ink-500">
            Every field needed for case management, including location,
            description, status, AI review state, and reporter contact details.
          </p>
          <div className="mt-4">
            <Button type="button" onClick={exportIncidents} disabled={filtered.length === 0}>
              <ArrowDownToLine className="h-4 w-4" aria-hidden="true" />
              Download incident CSV
            </Button>
          </div>
        </Card>

        <Card className="flex flex-col p-6">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-warning-50 text-warning-600">
            <MapPinned className="h-5 w-5" aria-hidden="true" />
          </span>
          <h2 className="mt-4 font-semibold text-teal-900">Hotspot priority list (CSV)</h2>
          <p className="mt-1 flex-1 text-sm leading-6 text-ink-500">
            One row per ~110 m cell with the score, active/resolved counts, and
            severity mix — ready for works planning.
          </p>
          <div className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={exportHotspots}
              disabled={hotspots.length === 0}
            >
              <ArrowDownToLine className="h-4 w-4" aria-hidden="true" />
              Download hotspot CSV
            </Button>
          </div>
        </Card>
      </div>

      <Alert variant="warning" title="Handle exports carefully">
        Incident CSVs include reporter names, phone numbers, email addresses,
        and full descriptions. Store and share them only with authorised staff.
        <span className="mt-1 flex items-center gap-1.5 text-xs font-medium">
          <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />
          The public map never exposes this data.
        </span>
      </Alert>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-ink-100 px-5 py-4">
          <div>
            <h2 className="font-semibold text-teal-900">Preview</h2>
            <p className="mt-0.5 text-xs text-ink-400">
              First {preview.length} rows of the current scope
            </p>
          </div>
          <FileBarChart className="h-5 w-5 text-ink-300" aria-hidden="true" />
        </div>

        {preview.length === 0 ? (
          <EmptyState
            icon={FileBarChart}
            title="Nothing to export"
            description="Adjust the filters, or submit a report first."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Preview of report rows in the export scope</caption>
              <thead className="border-b border-ink-100 bg-ink-50/60 text-xs uppercase tracking-wide text-ink-400">
                <tr>
                  <th scope="col" className="px-5 py-3 font-medium">Report</th>
                  <th scope="col" className="px-3 py-3 font-medium">Severity</th>
                  <th scope="col" className="px-3 py-3 font-medium">Status</th>
                  <th scope="col" className="px-5 py-3 font-medium">Reported</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {preview.map((incident) => (
                  <tr key={incident.id}>
                    <td className="max-w-md px-5 py-3">
                      <p className="truncate font-medium text-ink-800">{incident.title}</p>
                      <p className="truncate text-xs text-ink-400">{incident.location.address}</p>
                    </td>
                    <td className="px-3 py-3">
                      <SeverityBadge severity={incident.severity} />
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge status={incident.status} />
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-xs text-ink-500">
                      {formatRelativeTime(incident.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function SummaryTile({ label, value }: { label: string; value: number }) {
  return (
    <Card className="p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-ink-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-teal-900">{formatNumber(value)}</p>
    </Card>
  );
}
