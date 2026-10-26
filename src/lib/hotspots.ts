import {
  SEVERITY_RANK,
  type Hotspot,
  type IncidentCategory,
  type PublicIncident,
  type Severity,
} from "./types";

const CELL_PRECISION = 3;
export const HOTSPOT_CELL_METRES = 110;

const SEVERITY_WEIGHT: Record<Severity, number> = {
  low: 1,
  medium: 2,
  high: 4,
  critical: 5,
};

function cellKey(lat: number, lng: number): string {
  return `${lat.toFixed(CELL_PRECISION)},${lng.toFixed(CELL_PRECISION)}`;
}

function ageInDays(date: Date, now: Date): number {
  return Math.max(0, (now.getTime() - date.getTime()) / 86_400_000);
}

export function severityFromIncidents(incidents: PublicIncident[]): Severity {
  return incidents.reduce<Severity>((worst, incident) => {
    return SEVERITY_RANK[incident.severity] > SEVERITY_RANK[worst]
      ? incident.severity
      : worst;
  }, "low");
}

export function computeHotspots(
  incidents: PublicIncident[],
  now: Date = new Date(),
): Hotspot[] {
  const groups = new Map<string, PublicIncident[]>();

  for (const incident of incidents) {
    if (!Number.isFinite(incident.location.lat) || !Number.isFinite(incident.location.lng)) {
      continue;
    }

    const key = cellKey(incident.location.lat, incident.location.lng);
    const group = groups.get(key);
    if (group) {
      group.push(incident);
    } else {
      groups.set(key, [incident]);
    }
  }

  const hotspots: Hotspot[] = [];

  for (const [id, group] of groups) {
    const sorted = [...group].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
    const newest = sorted[0];
    const active = sorted.filter((incident) => incident.status !== "resolved");
    const resolved = sorted.length - active.length;

    const weightedCount = group.reduce(
      (total, incident) => total + (incident.status === "resolved" ? 0.25 : 1),
      0,
    );

    const severityPoints = group.reduce(
      (total, incident) =>
        total +
        SEVERITY_WEIGHT[incident.severity] *
          (incident.status === "resolved" ? 0.25 : 1),
      0,
    );

    const recurrenceScore = (Math.min(weightedCount, 12) / 12) * 40;
    const severityScore = (Math.min(severityPoints, 24) / 24) * 30;
    const recencyScore = Math.max(0, 1 - ageInDays(newest.createdAt, now) / 180) * 20;
    const concentrationScore = (Math.min(active.length, 5) / 5) * 10;

    const rawScore =
      recurrenceScore + severityScore + recencyScore + concentrationScore;
    const resolvedPenalty = active.length === 0 ? 0.35 : 1;

    const severityCounts: Record<Severity, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };
    const categoryCounts: Partial<Record<IncidentCategory, number>> = {};

    for (const incident of group) {
      severityCounts[incident.severity] += 1;
      categoryCounts[incident.category] = (categoryCounts[incident.category] ?? 0) + 1;
    }

    const [latText, lngText] = id.split(",");

    hotspots.push({
      id,
      lat: Number(latText),
      lng: Number(lngText),
      address: newest.location.address || undefined,
      division: newest.location.division || undefined,
      count: group.length,
      activeCount: active.length,
      resolvedCount: resolved,
      score: Math.round(Math.min(100, rawScore * resolvedPenalty)),
      severityCounts,
      categoryCounts,
      lastReportedAt: newest.createdAt,
      incidents: sorted,
    });
  }

  return hotspots.sort((a, b) => b.score - a.score);
}

export function hotspotFor(
  incident: PublicIncident,
  hotspots: Hotspot[],
): Hotspot | undefined {
  const key = cellKey(incident.location.lat, incident.location.lng);
  return hotspots.find((hotspot) => hotspot.id === key);
}

export function hotspotTone(score: number): {
  label: string;
  className: string;
  dot: string;
} {
  if (score >= 75) {
    return {
      label: "Critical",
      className: "bg-critical-50 text-critical-600",
      dot: "bg-critical-500",
    };
  }

  if (score >= 55) {
    return {
      label: "High",
      className: "bg-warning-50 text-warning-600",
      dot: "bg-warning-500",
    };
  }

  if (score >= 35) {
    return {
      label: "Moderate",
      className: "bg-info-50 text-info-500",
      dot: "bg-info-500",
    };
  }

  return {
    label: "Low",
    className: "bg-success-50 text-success-500",
    dot: "bg-success-500",
  };
}
