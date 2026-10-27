export const INCIDENT_CATEGORIES = [
  { value: "blocked_drain", label: "Blocked drain or culvert" },
  { value: "open_manhole", label: "Open or damaged manhole" },
  { value: "flooding", label: "Persistent flooding" },
  { value: "illegal_dumping", label: "Waste blocking a channel" },
  { value: "erosion", label: "Erosion or collapsed bank" },
  { value: "broken_culvert", label: "Broken culvert or cover" },
  { value: "other", label: "Other drainage hazard" },
] as const;

export type IncidentCategory = (typeof INCIDENT_CATEGORIES)[number]["value"];

export const SEVERITIES = ["low", "medium", "high", "critical"] as const;
export type Severity = (typeof SEVERITIES)[number];

export const INCIDENT_STATUSES = [
  "new",
  "triaged",
  "in_progress",
  "resolved",
] as const;
export type IncidentStatus = (typeof INCIDENT_STATUSES)[number];

export const URGENCY_LEVELS = ["low", "normal", "high", "immediate"] as const;
export type Urgency = (typeof URGENCY_LEVELS)[number];

export const CATEGORY_LABELS: Record<IncidentCategory, string> = Object.fromEntries(
  INCIDENT_CATEGORIES.map((category) => [category.value, category.label]),
) as Record<IncidentCategory, string>;

export const SEVERITY_LABELS: Record<Severity, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

export const STATUS_LABELS: Record<IncidentStatus, string> = {
  new: "New",
  triaged: "Triaged",
  in_progress: "In progress",
  resolved: "Resolved",
};

export const URGENCY_LABELS: Record<Urgency, string> = {
  low: "Low",
  normal: "Normal",
  high: "High",
  immediate: "Immediate",
};

export const SEVERITY_RANK: Record<Severity, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

export const STATUS_RANK: Record<IncidentStatus, number> = {
  new: 0,
  triaged: 1,
  in_progress: 2,
  resolved: 3,
};

/**
 * Allowed workflow transitions. The happy path is linear, and a resolved
 * incident can be reopened if the hazard returns. Skipping stages or moving
 * backwards is rejected by both the UI and the Firestore rules.
 */
export const STATUS_TRANSITIONS: Record<IncidentStatus, readonly IncidentStatus[]> = {
  new: ["triaged"],
  triaged: ["in_progress"],
  in_progress: ["resolved"],
  resolved: ["in_progress"],
};

export function canTransitionStatus(
  from: IncidentStatus,
  to: IncidentStatus,
): boolean {
  return STATUS_TRANSITIONS[from].includes(to);
}

export function nextStatuses(from: IncidentStatus): IncidentStatus[] {
  return [...STATUS_TRANSITIONS[from]];
}

// Midpoint between Kampala (0.3476°N, 32.5825°E) and Nkozi (0.0100°N, 32.0000°E)
// so the initial map view shows both areas.
export const KAMPALA_CENTER = { lat: 0.18, lng: 32.29 };

export const KAMPALA_DIVISIONS = [
  "Central",
  "Kawempe",
  "Lubaga",
  "Makindye",
  "Nakawa",
] as const;

export type IncidentLocation = {
  lat: number;
  lng: number;
  address?: string;
  division?: string;
};

export type ReporterInfo = {
  name?: string;
  phone?: string;
  email?: string;
};

export type AIClassification = {
  category: IncidentCategory;
  severity: Severity;
  urgency: Urgency;
  summary: string;
  confidence: number;
  source: "gemini" | "fallback";
  reviewed?: boolean;
  reviewedBy?: string;
  reviewedAt?: Date;
};

export type StatusChange = {
  status: IncidentStatus;
  at: Date;
  by: string | null;
  byName: string;
  note?: string;
};

export type Incident = {
  id: string;
  category: IncidentCategory;
  severity: Severity;
  title: string;
  description: string;
  location: IncidentLocation;
  reporter: ReporterInfo;
  photoUrls: string[];
  status: IncidentStatus;
  statusHistory: StatusChange[];
  ai?: AIClassification;
  reportedBy?: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
};

/** Sanitised projection that is safe to expose publicly on the hotspot map. */
export type PublicIncident = {
  id: string;
  category: IncidentCategory;
  severity: Severity;
  title: string;
  status: IncidentStatus;
  location: IncidentLocation;
  photoUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
};

export type HotspotScoreBreakdown = {
  /** Report volume, including resolved reports at a reduced weight. Max 40. */
  recurrence: number;
  /** Severity-weighted report volume. Max 30. */
  severity: number;
  /** Freshness of the newest report, decaying over 180 days. Max 20. */
  recency: number;
  /** Active report volume in the same cell. Max 10. */
  concentration: number;
  subtotal: number;
  /** 0.35 when every report in the cell is resolved, otherwise 1. */
  resolvedPenalty: number;
  total: number;
};

export type Hotspot = {
  id: string;
  lat: number;
  lng: number;
  address?: string;
  division?: string;
  count: number;
  activeCount: number;
  resolvedCount: number;
  score: number;
  scoreBreakdown: HotspotScoreBreakdown;
  severityCounts: Record<Severity, number>;
  categoryCounts: Partial<Record<IncidentCategory, number>>;
  lastReportedAt: Date;
  incidents: PublicIncident[];
};

export function isIncidentCategory(value: unknown): value is IncidentCategory {
  return INCIDENT_CATEGORIES.some((category) => category.value === value);
}

export function isSeverity(value: unknown): value is Severity {
  return (SEVERITIES as readonly unknown[]).includes(value);
}

export function isIncidentStatus(value: unknown): value is IncidentStatus {
  return (INCIDENT_STATUSES as readonly unknown[]).includes(value);
}

export function isUrgency(value: unknown): value is Urgency {
  return (URGENCY_LEVELS as readonly unknown[]).includes(value);
}
