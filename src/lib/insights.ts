import {
  isIncidentCategory,
  isSeverity,
  type Hotspot,
  type Incident,
  type IncidentCategory,
  type Severity,
} from "./types";
import { countByCategory, countBySeverity } from "./stats";
import { computeHotspots } from "./hotspots";

export const INSIGHTS_MAX_HOTSPOTS = 6;
export const INSIGHTS_MAX_UNRESOLVED = 8;
export const INSIGHTS_QUESTION_MAX = 300;
export const INSIGHTS_ANSWER_MAX = 900;

export type InsightsDigest = {
  generatedAt: string;
  totals: { total: number; active: number; resolved: number };
  bySeverity: Array<{ key: Severity; label: string; value: number }>;
  byCategory: Array<{ key: IncidentCategory; label: string; value: number }>;
  trend: { thisWeek: number; lastWeek: number };
  topHotspots: Array<{
    id: string;
    label: string;
    score: number;
    count: number;
    activeCount: number;
    topCategory?: IncidentCategory;
  }>;
  unresolvedCritical: Array<{
    id: string;
    title: string;
    label: string;
    severity: Severity;
    ageDays: number;
  }>;
};

function clampText(value: string, max: number): string {
  return value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function daysAgo(date: Date, now: Date): number {
  return Math.max(0, Math.round((now.getTime() - date.getTime()) / 86_400_000));
}

function topCategory(hotspot: Hotspot): IncidentCategory | undefined {
  const entry = Object.entries(hotspot.categoryCounts).sort((a, b) => b[1] - a[1])[0];
  return entry && isIncidentCategory(entry[0]) ? entry[0] : undefined;
}

/**
 * Builds the only data the AI Insights assistant ever sees: aggregate counts
 * and short labels, never raw descriptions, photos, or reporter details.
 */
export function buildInsightsDigest(
  incidents: Incident[],
  now: Date = new Date(),
): InsightsDigest {
  const active = incidents.filter((incident) => incident.status !== "resolved");
  const resolved = incidents.length - active.length;

  const weekMs = 7 * 86_400_000;
  const thisWeekStart = now.getTime() - weekMs;
  const lastWeekStart = now.getTime() - weekMs * 2;
  const thisWeek = incidents.filter(
    (incident) => incident.createdAt.getTime() >= thisWeekStart,
  ).length;
  const lastWeek = incidents.filter(
    (incident) =>
      incident.createdAt.getTime() >= lastWeekStart &&
      incident.createdAt.getTime() < thisWeekStart,
  ).length;

  const hotspots = computeHotspots(
    incidents.map((incident) => ({
      id: incident.id,
      category: incident.category,
      severity: incident.severity,
      title: incident.title,
      status: incident.status,
      location: incident.location,
      createdAt: incident.createdAt,
      updatedAt: incident.updatedAt,
      resolvedAt: incident.resolvedAt,
    })),
    now,
  ).slice(0, INSIGHTS_MAX_HOTSPOTS);

  const unresolvedCritical = incidents
    .filter((incident) => incident.status !== "resolved" && (incident.severity === "critical" || incident.severity === "high"))
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    .slice(0, INSIGHTS_MAX_UNRESOLVED)
    .map((incident) => ({
      id: incident.id,
      title: clampText(incident.title, 120),
      label: clampText(incident.location.address || incident.location.division || "Kampala", 120),
      severity: incident.severity,
      ageDays: daysAgo(incident.createdAt, now),
    }));

  return {
    generatedAt: now.toISOString(),
    totals: { total: incidents.length, active: active.length, resolved },
    bySeverity: countBySeverity(incidents).map((item) => ({
      key: item.key as Severity,
      label: item.label,
      value: item.value,
    })),
    byCategory: countByCategory(incidents).map((item) => ({
      key: item.key as IncidentCategory,
      label: item.label,
      value: item.value,
    })),
    trend: { thisWeek, lastWeek },
    topHotspots: hotspots.map((hotspot) => ({
      id: hotspot.id,
      label: clampText(hotspot.address || hotspot.division || "Kampala", 120),
      score: hotspot.score,
      count: hotspot.count,
      activeCount: hotspot.activeCount,
      topCategory: topCategory(hotspot),
    })),
    unresolvedCritical,
  };
}

export function parseInsightsRequest(
  value: unknown,
): { digest: InsightsDigest; question: string } | null {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;

  if (typeof record.question !== "string") return null;
  const question = clampText(record.question, INSIGHTS_QUESTION_MAX);
  if (question.length < 3) return null;

  const digest = parseDigest(record.digest);
  if (!digest) return null;

  return { digest, question };
}

function parseDigest(value: unknown): InsightsDigest | null {
  if (typeof value !== "object" || value === null) return null;
  const d = value as Record<string, unknown>;

  if (typeof d.generatedAt !== "string") return null;

  const totals = d.totals as Record<string, unknown> | undefined;
  if (
    typeof totals !== "object" ||
    totals === null ||
    typeof totals.total !== "number" ||
    typeof totals.active !== "number" ||
    typeof totals.resolved !== "number"
  ) {
    return null;
  }

  if (!Array.isArray(d.bySeverity) || !Array.isArray(d.byCategory)) return null;
  if (!Array.isArray(d.topHotspots) || d.topHotspots.length > INSIGHTS_MAX_HOTSPOTS) return null;
  if (
    !Array.isArray(d.unresolvedCritical) ||
    d.unresolvedCritical.length > INSIGHTS_MAX_UNRESOLVED
  ) {
    return null;
  }

  const trend = d.trend as Record<string, unknown> | undefined;
  if (
    typeof trend !== "object" ||
    trend === null ||
    typeof trend.thisWeek !== "number" ||
    typeof trend.lastWeek !== "number"
  ) {
    return null;
  }

  const bySeverity: InsightsDigest["bySeverity"] = [];
  for (const item of d.bySeverity) {
    if (typeof item !== "object" || item === null) return null;
    const row = item as Record<string, unknown>;
    if (!isSeverity(row.key) || typeof row.label !== "string" || typeof row.value !== "number") {
      return null;
    }
    bySeverity.push({ key: row.key, label: clampText(row.label, 40), value: row.value });
  }

  const byCategory: InsightsDigest["byCategory"] = [];
  for (const item of d.byCategory) {
    if (typeof item !== "object" || item === null) return null;
    const row = item as Record<string, unknown>;
    if (
      !isIncidentCategory(row.key) ||
      typeof row.label !== "string" ||
      typeof row.value !== "number"
    ) {
      return null;
    }
    byCategory.push({ key: row.key, label: clampText(row.label, 60), value: row.value });
  }

  const topHotspots: InsightsDigest["topHotspots"] = [];
  for (const item of d.topHotspots) {
    if (typeof item !== "object" || item === null) return null;
    const row = item as Record<string, unknown>;
    if (
      typeof row.id !== "string" ||
      typeof row.label !== "string" ||
      typeof row.score !== "number" ||
      typeof row.count !== "number" ||
      typeof row.activeCount !== "number"
    ) {
      return null;
    }
    topHotspots.push({
      id: row.id.slice(0, 64),
      label: clampText(row.label, 120),
      score: row.score,
      count: row.count,
      activeCount: row.activeCount,
      topCategory: isIncidentCategory(row.topCategory) ? row.topCategory : undefined,
    });
  }

  const unresolvedCritical: InsightsDigest["unresolvedCritical"] = [];
  for (const item of d.unresolvedCritical) {
    if (typeof item !== "object" || item === null) return null;
    const row = item as Record<string, unknown>;
    if (
      typeof row.id !== "string" ||
      typeof row.title !== "string" ||
      typeof row.label !== "string" ||
      !isSeverity(row.severity) ||
      typeof row.ageDays !== "number"
    ) {
      return null;
    }
    unresolvedCritical.push({
      id: row.id.slice(0, 64),
      title: clampText(row.title, 120),
      label: clampText(row.label, 120),
      severity: row.severity,
      ageDays: row.ageDays,
    });
  }

  return {
    generatedAt: d.generatedAt,
    totals: {
      total: totals.total,
      active: totals.active,
      resolved: totals.resolved,
    },
    bySeverity,
    byCategory,
    trend: { thisWeek: trend.thisWeek, lastWeek: trend.lastWeek },
    topHotspots,
    unresolvedCritical,
  };
}

export function fallbackAnswer(digest: InsightsDigest): string {
  const top = digest.topHotspots[0];
  const trendWord =
    digest.trend.thisWeek > digest.trend.lastWeek
      ? "up"
      : digest.trend.thisWeek < digest.trend.lastWeek
        ? "down"
        : "flat";

  const parts = [
    "AI answers aren't available right now, so here are the current numbers instead:",
    `${digest.totals.total} total reports (${digest.totals.active} active, ${digest.totals.resolved} resolved).`,
    `This week: ${digest.trend.thisWeek} new reports vs ${digest.trend.lastWeek} last week (${trendWord}).`,
    top
      ? `Top location: ${top.label}, score ${top.score}/100 from ${top.count} report${top.count === 1 ? "" : "s"}.`
      : "No hotspots yet.",
    `${digest.unresolvedCritical.length} unresolved high/critical report${digest.unresolvedCritical.length === 1 ? "" : "s"}.`,
  ];

  return parts.join(" ");
}
