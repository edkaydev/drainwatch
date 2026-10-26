import {
  CATEGORY_LABELS,
  SEVERITY_LABELS,
  STATUS_LABELS,
  type Hotspot,
  type Incident,
} from "./types";

function escapeCell(value: string | number | undefined | null): string {
  const text = value === undefined || value === null ? "" : String(value);
  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function row(values: Array<string | number | undefined | null>): string {
  return values.map(escapeCell).join(",");
}

export function incidentsToCsv(incidents: Incident[]): string {
  const header = [
    "Reference",
    "Title",
    "Category",
    "Severity",
    "Status",
    "Description",
    "Address",
    "Division",
    "Latitude",
    "Longitude",
    "Reporter name",
    "Reporter phone",
    "Reporter email",
    "Reported at",
    "Last updated",
    "Resolved at",
    "AI category",
    "AI severity",
    "AI confidence",
    "AI reviewed",
  ];

  const rows = incidents.map((incident) =>
    row([
      incident.id,
      incident.title,
      CATEGORY_LABELS[incident.category],
      SEVERITY_LABELS[incident.severity],
      STATUS_LABELS[incident.status],
      incident.description,
      incident.location.address,
      incident.location.division,
      incident.location.lat,
      incident.location.lng,
      incident.reporter.name,
      incident.reporter.phone,
      incident.reporter.email,
      incident.createdAt.toISOString(),
      incident.updatedAt.toISOString(),
      incident.resolvedAt?.toISOString(),
      incident.ai ? CATEGORY_LABELS[incident.ai.category] : "",
      incident.ai ? SEVERITY_LABELS[incident.ai.severity] : "",
      incident.ai ? incident.ai.confidence.toFixed(2) : "",
      incident.ai ? (incident.ai.reviewed ? "Yes" : "No") : "",
    ]),
  );

  return [row(header), ...rows].join("\r\n");
}

export function hotspotsToCsv(hotspots: Hotspot[]): string {
  const header = [
    "Cell",
    "Latitude",
    "Longitude",
    "Address",
    "Division",
    "Score",
    "Reports",
    "Active",
    "Resolved",
    "Critical",
    "High",
    "Medium",
    "Low",
    "Last reported",
  ];

  const rows = hotspots.map((hotspot) =>
    row([
      hotspot.id,
      hotspot.lat,
      hotspot.lng,
      hotspot.address,
      hotspot.division,
      hotspot.score,
      hotspot.count,
      hotspot.activeCount,
      hotspot.resolvedCount,
      hotspot.severityCounts.critical,
      hotspot.severityCounts.high,
      hotspot.severityCounts.medium,
      hotspot.severityCounts.low,
      hotspot.lastReportedAt.toISOString(),
    ]),
  );

  return [row(header), ...rows].join("\r\n");
}

export function downloadCsv(filename: string, contents: string): void {
  const blob = new Blob([`\uFEFF${contents}`], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
