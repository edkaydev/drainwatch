import {
  CATEGORY_LABELS,
  INCIDENT_CATEGORIES,
  INCIDENT_STATUSES,
  SEVERITIES,
  SEVERITY_LABELS,
  STATUS_LABELS,
  type Incident,
  type IncidentCategory,
  type IncidentStatus,
  type Severity,
} from "./types";

export type TrendPoint = {
  key: string;
  label: string;
  value: number;
};

export type CountItem = {
  key: string;
  label: string;
  value: number;
};

function dayKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function buildDailyTrend(
  incidents: Pick<Incident, "createdAt">[],
  days = 14,
  now: Date = new Date(),
): TrendPoint[] {
  const counts = new Map<string, number>();
  const points: TrendPoint[] = [];

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date(now);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - offset);
    const key = dayKey(date);
    counts.set(key, 0);
    points.push({
      key,
      label: `${date.getDate()}/${date.getMonth() + 1}`,
      value: 0,
    });
  }

  const oldest = new Date(now);
  oldest.setHours(0, 0, 0, 0);
  oldest.setDate(oldest.getDate() - (days - 1));

  for (const incident of incidents) {
    if (incident.createdAt.getTime() < oldest.getTime()) continue;
    const key = dayKey(incident.createdAt);
    if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return points.map((point) => ({
    ...point,
    value: counts.get(point.key) ?? 0,
  }));
}

export function countBySeverity(incidents: Incident[]): CountItem[] {
  return SEVERITIES.map((severity) => ({
    key: severity,
    label: SEVERITY_LABELS[severity],
    value: incidents.filter((incident) => incident.severity === severity).length,
  }));
}

export function countByStatus(incidents: Incident[]): CountItem[] {
  return INCIDENT_STATUSES.map((status) => ({
    key: status,
    label: STATUS_LABELS[status],
    value: incidents.filter((incident) => incident.status === status).length,
  }));
}

export function countByCategory(incidents: Incident[]): CountItem[] {
  return INCIDENT_CATEGORIES.map((category) => ({
    key: category.value,
    label: category.label,
    value: incidents.filter((incident) => incident.category === category.value).length,
  }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value);
}

export function resolvedRate(incidents: Incident[]): number {
  if (incidents.length === 0) return 0;
  return incidents.filter((incident) => incident.status === "resolved").length / incidents.length;
}

export function averageResponseHours(incidents: Incident[]): number | null {
  const durations: number[] = [];

  for (const incident of incidents) {
    if (incident.status !== "resolved" || incident.createdAt.getTime() === 0) continue;

    let resolvedAt = incident.resolvedAt?.getTime() ?? 0;
    if (!resolvedAt) {
      const event = [...incident.statusHistory]
        .reverse()
        .find((change) => change.status === "resolved");
      resolvedAt = event?.at.getTime() ?? 0;
    }

    if (resolvedAt && resolvedAt >= incident.createdAt.getTime()) {
      durations.push((resolvedAt - incident.createdAt.getTime()) / 3_600_000);
    }
  }

  if (durations.length === 0) return null;
  return durations.reduce((total, value) => total + value, 0) / durations.length;
}

export type IncidentFilters = {
  query: string;
  status: IncidentStatus | "all";
  severity: Severity | "all";
  category: IncidentCategory | "all";
  division: string | "all";
};

export const DEFAULT_FILTERS: IncidentFilters = {
  query: "",
  status: "all",
  severity: "all",
  category: "all",
  division: "all",
};

export function filterIncidents(incidents: Incident[], filters: IncidentFilters): Incident[] {
  const query = filters.query.trim().toLowerCase();

  return incidents.filter((incident) => {
    if (filters.status !== "all" && incident.status !== filters.status) return false;
    if (filters.severity !== "all" && incident.severity !== filters.severity) return false;
    if (filters.category !== "all" && incident.category !== filters.category) return false;
    if (filters.division !== "all" && incident.location.division !== filters.division) {
      return false;
    }

    if (!query) return true;

    const haystack = [
      incident.id,
      incident.title,
      incident.description,
      incident.location.address,
      incident.location.division,
      CATEGORY_LABELS[incident.category],
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(query);
  });
}

export function availableDivisions(incidents: Incident[]): string[] {
  return Array.from(
    new Set(
      incidents
        .map((incident) => incident.location.division)
        .filter((division): division is string => Boolean(division)),
    ),
  ).sort();
}

export function activeIncidents(incidents: Incident[]): Incident[] {
  return incidents.filter((incident) => incident.status !== "resolved");
}
