"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDownToLine,
  ChevronLeft,
  ChevronRight,
  FilterX,
  Inbox,
  Search,
  Sparkles,
} from "lucide-react";
import { PageHeader } from "./page-header";
import { Card } from "@/components/ui/card";
import { Alert, EmptyState, LoadingBlock } from "@/components/ui/feedback";
import { Badge } from "@/components/ui/badge";
import { Button, LinkButton } from "@/components/ui/button";
import { SeverityBadge, StatusBadge } from "@/components/ui/status-badges";
import { Input, Select } from "@/components/ui/form";
import { useIncidents } from "@/hooks/use-incidents";
import { downloadCsv, incidentsToCsv } from "@/lib/csv";
import {
  availableDivisions,
  DEFAULT_FILTERS,
  filterIncidents,
  type IncidentFilters,
} from "@/lib/stats";
import {
  CATEGORY_LABELS,
  INCIDENT_CATEGORIES,
  INCIDENT_STATUSES,
  SEVERITIES,
  SEVERITY_LABELS,
  SEVERITY_RANK,
  STATUS_LABELS,
  STATUS_RANK,
  type Incident,
} from "@/lib/types";
import { formatCoordinates, formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;

type SortMode = "newest" | "priority";

function sortIncidents(incidents: Incident[], mode: SortMode): Incident[] {
  const sorted = [...incidents];

  if (mode === "priority") {
    sorted.sort((a, b) => {
      const severity = SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity];
      if (severity !== 0) return severity;
      const status = STATUS_RANK[a.status] - STATUS_RANK[b.status];
      if (status !== 0) return status;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  } else {
    sorted.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  return sorted;
}

export function IncidentsView() {
  const { data: incidents, loading, error } = useIncidents();
  const [filters, setFilters] = useState<IncidentFilters>(DEFAULT_FILTERS);
  const [sort, setSort] = useState<SortMode>("newest");
  const [page, setPage] = useState(0);

  const divisions = useMemo(() => availableDivisions(incidents), [incidents]);
  const filtered = useMemo(
    () => sortIncidents(filterIncidents(incidents, filters), sort),
    [incidents, filters, sort],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const visible = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);
  const activeFilterCount = Object.entries(filters).filter(
    ([key, value]) => key !== "query" && value !== "all",
  ).length + (filters.query.trim() ? 1 : 0);

  function updateFilter<K extends keyof IncidentFilters>(key: K, value: IncidentFilters[K]) {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(0);
  }

  function clearFilters() {
    setFilters(DEFAULT_FILTERS);
    setPage(0);
  }

  function handleExport() {
    downloadCsv(
      `drainwatch-incidents-${new Date().toISOString().slice(0, 10)}.csv`,
      incidentsToCsv(filtered),
    );
  }

  if (loading) {
    return (
      <div>
        <PageHeader eyebrow="Operations" title="Incidents" />
        <LoadingBlock label="Loading incidents…" />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader eyebrow="Operations" title="Incidents" />
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
        title="Incidents"
        description="Search, filter, and triage every report. Open a row for the full history and status controls."
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={filtered.length === 0}
            >
              <ArrowDownToLine className="h-4 w-4" aria-hidden="true" />
              Export CSV
            </Button>
            <LinkButton href="/report" size="sm">
              New report
            </LinkButton>
          </>
        }
      />

      <Card className="p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,2fr)_repeat(4,minmax(0,1fr))]">
          <div>
            <label htmlFor="incident-search" className="mb-1.5 block text-xs font-medium text-ink-500">
              Search
            </label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
                aria-hidden="true"
              />
              <Input
                id="incident-search"
                type="search"
                value={filters.query}
                onChange={(event) => updateFilter("query", event.target.value)}
                placeholder="Title, description, address, reference…"
                className="pl-9"
              />
            </div>
          </div>

          <FilterSelect
            id="filter-status"
            label="Status"
            value={filters.status}
            onChange={(value) => updateFilter("status", value as IncidentFilters["status"])}
            options={[
              { value: "all", label: "All statuses" },
              ...INCIDENT_STATUSES.map((status) => ({
                value: status,
                label: STATUS_LABELS[status],
              })),
            ]}
          />

          <FilterSelect
            id="filter-severity"
            label="Severity"
            value={filters.severity}
            onChange={(value) => updateFilter("severity", value as IncidentFilters["severity"])}
            options={[
              { value: "all", label: "All severities" },
              ...SEVERITIES.map((severity) => ({
                value: severity,
                label: SEVERITY_LABELS[severity],
              })),
            ]}
          />

          <FilterSelect
            id="filter-category"
            label="Category"
            value={filters.category}
            onChange={(value) => updateFilter("category", value as IncidentFilters["category"])}
            options={[
              { value: "all", label: "All categories" },
              ...INCIDENT_CATEGORIES.map((category) => ({
                value: category.value,
                label: category.label,
              })),
            ]}
          />

          <FilterSelect
            id="filter-division"
            label="Division"
            value={filters.division}
            onChange={(value) => updateFilter("division", value)}
            options={[
              { value: "all", label: "All divisions" },
              ...divisions.map((division) => ({ value: division, label: division })),
            ]}
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-ink-100 pt-3">
          <p className="text-xs text-ink-500" aria-live="polite">
            <span className="font-semibold text-ink-800">{filtered.length}</span> of{" "}
            {incidents.length} incidents
          </p>
          {activeFilterCount > 0 ? (
            <Badge variant="info">{activeFilterCount} filter{activeFilterCount === 1 ? "" : "s"} active</Badge>
          ) : null}
          {activeFilterCount > 0 ? (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:text-brand-800"
            >
              <FilterX className="h-3.5 w-3.5" aria-hidden="true" />
              Clear filters
            </button>
          ) : null}
          <div className="ml-auto flex items-center gap-2">
            <label htmlFor="incident-sort" className="text-xs font-medium text-ink-500">
              Sort
            </label>
            <Select
              id="incident-sort"
              value={sort}
              onChange={(event) => {
                setSort(event.target.value as SortMode);
                setPage(0);
              }}
              className="h-9 w-auto py-1.5 text-xs"
            >
              <option value="newest">Newest first</option>
              <option value="priority">Priority first</option>
            </Select>
          </div>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={incidents.length === 0 ? "No incidents yet" : "No incidents match these filters"}
          description={
            incidents.length === 0
              ? "Reports submitted from the public site will appear here in real time."
              : "Adjust or clear the filters to see more reports."
          }
          action={
            incidents.length === 0 ? (
              <LinkButton href="/report" size="sm">
                Submit a report
              </LinkButton>
            ) : (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            )
          }
        />
      ) : (
        <>
          <Card className="overflow-hidden">
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">
                  Incident reports, sorted {sort === "newest" ? "newest first" : "by priority"}
                </caption>
                <thead className="border-b border-ink-100 bg-ink-50/60 text-xs uppercase tracking-wide text-ink-400">
                  <tr>
                    <th scope="col" className="px-5 py-3 font-medium">Report</th>
                    <th scope="col" className="px-3 py-3 font-medium">Category</th>
                    <th scope="col" className="px-3 py-3 font-medium">Severity</th>
                    <th scope="col" className="px-3 py-3 font-medium">Status</th>
                    <th scope="col" className="px-3 py-3 font-medium">Location</th>
                    <th scope="col" className="px-3 py-3 font-medium">Reported</th>
                    <th scope="col" className="px-5 py-3 font-medium">AI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {visible.map((incident) => (
                    <tr key={incident.id} className="group transition-colors hover:bg-ink-50/60">
                      <td className="max-w-xs px-5 py-3.5">
                        <Link
                          href={`/dashboard/incidents/${incident.id}`}
                          className="line-clamp-2 font-medium text-ink-800 group-hover:text-brand-700"
                        >
                          {incident.title}
                        </Link>
                        <p className="mt-0.5 font-mono text-[10px] text-ink-400">
                          {incident.id.slice(0, 10)}
                        </p>
                      </td>
                      <td className="px-3 py-3.5 text-ink-600">
                        {CATEGORY_LABELS[incident.category]}
                      </td>
                      <td className="px-3 py-3.5">
                        <SeverityBadge severity={incident.severity} />
                      </td>
                      <td className="px-3 py-3.5">
                        <StatusBadge status={incident.status} />
                      </td>
                      <td className="max-w-44 px-3 py-3.5 text-ink-600">
                        <span className="line-clamp-2">
                          {incident.location.address ||
                            incident.location.division ||
                            formatCoordinates(incident.location.lat, incident.location.lng)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3.5 text-xs text-ink-500">
                        {formatRelativeTime(incident.createdAt)}
                      </td>
                      <td className="px-5 py-3.5">
                        {incident.ai ? (
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 text-xs",
                              incident.ai.reviewed ? "text-ink-500" : "text-brand-700",
                            )}
                            title={`${incident.ai.source === "gemini" ? "Gemini" : "Fallback"} suggestion, ${Math.round(incident.ai.confidence * 100)}% confidence`}
                          >
                            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                            {incident.ai.reviewed ? "Reviewed" : `${Math.round(incident.ai.confidence * 100)}%`}
                          </span>
                        ) : (
                          <span className="text-xs text-ink-300">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="divide-y divide-ink-100 md:hidden">
              {visible.map((incident) => (
                <li key={incident.id}>
                  <Link
                    href={`/dashboard/incidents/${incident.id}`}
                    className="block px-4 py-4 transition-colors hover:bg-ink-50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-medium text-ink-800">{incident.title}</p>
                      <SeverityBadge severity={incident.severity} />
                    </div>
                    <p className="mt-1 text-xs text-ink-500">
                      {CATEGORY_LABELS[incident.category]} ·{" "}
                      {incident.location.division || "Kampala"}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <StatusBadge status={incident.status} />
                      <span className="text-xs text-ink-400">
                        {formatRelativeTime(incident.createdAt)}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>

          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-ink-500">
              Page {safePage + 1} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.max(0, safePage - 1))}
                disabled={safePage === 0}
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.min(totalPages - 1, safePage + 1))}
                disabled={safePage >= totalPages - 1}
              >
                Next
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function FilterSelect({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-ink-500">
        {label}
      </label>
      <Select id={id} value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    </div>
  );
}
