import {
  CATEGORY_LABELS,
  isIncidentCategory,
  type Hotspot,
  type IncidentCategory,
} from "./types";

export const BRIEFING_MAX_HOTSPOTS = 6;
export const BRIEFING_MAX_PRIORITIES = 3;

export type BriefingHotspot = {
  id: string;
  label: string;
  score: number;
  count: number;
  activeCount: number;
  resolvedCount: number;
  criticalCount: number;
  highCount: number;
  topCategory?: IncidentCategory;
  lastReportDays: number;
};

export type BriefingPriority = {
  hotspotId: string;
  reason: string;
  action: string;
};

export type OperationalBriefing = {
  headline: string;
  summary: string;
  priorities: BriefingPriority[];
  caveats: string;
  source: "gemini" | "fallback";
};

function clampText(value: string, max: number): string {
  return value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function topCategory(hotspot: Hotspot): IncidentCategory | undefined {
  const entry = Object.entries(hotspot.categoryCounts).sort((a, b) => b[1] - a[1])[0];
  return entry && isIncidentCategory(entry[0]) ? entry[0] : undefined;
}

function hotspotLabel(hotspot: Hotspot): string {
  const label = hotspot.address || hotspot.division || "Kampala";
  return clampText(label, 120);
}

/**
 * Converts hotspot scores into the minimal, non-personal payload sent to the
 * model. Reporter details, descriptions, and photo URLs are deliberately absent.
 */
export function buildBriefingHotspots(
  hotspots: Hotspot[],
  now: Date = new Date(),
): BriefingHotspot[] {
  return [...hotspots]
    .filter(
      (hotspot) =>
        Number.isFinite(hotspot.score) &&
        Number.isFinite(hotspot.lat) &&
        Number.isFinite(hotspot.lng),
    )
    .sort((a, b) => b.score - a.score)
    .slice(0, BRIEFING_MAX_HOTSPOTS)
    .map((hotspot) => ({
      id: hotspot.id,
      label: hotspotLabel(hotspot),
      score: hotspot.score,
      count: hotspot.count,
      activeCount: hotspot.activeCount,
      resolvedCount: hotspot.resolvedCount,
      criticalCount: hotspot.severityCounts.critical,
      highCount: hotspot.severityCounts.high,
      topCategory: topCategory(hotspot),
      lastReportDays: Math.max(
        0,
        Math.round((now.getTime() - hotspot.lastReportedAt.getTime()) / 86_400_000),
      ),
    }));
}

export function parseBriefingRequest(value: unknown): BriefingHotspot[] | null {
  if (typeof value !== "object" || value === null) return null;

  const record = value as Record<string, unknown>;
  if (!Array.isArray(record.hotspots)) return null;
  if (record.hotspots.length < 1 || record.hotspots.length > BRIEFING_MAX_HOTSPOTS) {
    return null;
  }

  const seen = new Set<string>();
  const hotspots: BriefingHotspot[] = [];

  for (const item of record.hotspots) {
    if (typeof item !== "object" || item === null) return null;
    const hotspot = item as Record<string, unknown>;

    const id = typeof hotspot.id === "string" ? hotspot.id.trim() : "";
    const label = typeof hotspot.label === "string" ? clampText(hotspot.label, 120) : "";
    const score = hotspot.score;
    const count = hotspot.count;
    const activeCount = hotspot.activeCount;
    const resolvedCount = hotspot.resolvedCount;
    const criticalCount = hotspot.criticalCount;
    const highCount = hotspot.highCount;
    const lastReportDays = hotspot.lastReportDays;

    if (
      !id ||
      id.length > 64 ||
      seen.has(id) ||
      !label ||
      typeof score !== "number" ||
      !Number.isFinite(score) ||
      score < 0 ||
      score > 100 ||
      typeof count !== "number" ||
      !Number.isInteger(count) ||
      count < 1 ||
      count > 10_000 ||
      typeof activeCount !== "number" ||
      !Number.isInteger(activeCount) ||
      activeCount < 0 ||
      activeCount > count ||
      typeof resolvedCount !== "number" ||
      !Number.isInteger(resolvedCount) ||
      resolvedCount < 0 ||
      resolvedCount > count ||
      typeof criticalCount !== "number" ||
      !Number.isInteger(criticalCount) ||
      criticalCount < 0 ||
      criticalCount > count ||
      typeof highCount !== "number" ||
      !Number.isInteger(highCount) ||
      highCount < 0 ||
      highCount > count ||
      typeof lastReportDays !== "number" ||
      !Number.isFinite(lastReportDays) ||
      lastReportDays < 0 ||
      lastReportDays > 3650 ||
      (hotspot.topCategory !== undefined && !isIncidentCategory(hotspot.topCategory))
    ) {
      return null;
    }

    seen.add(id);
    hotspots.push({
      id,
      label,
      score,
      count,
      activeCount,
      resolvedCount,
      criticalCount,
      highCount,
      topCategory: isIncidentCategory(hotspot.topCategory)
        ? hotspot.topCategory
        : undefined,
      lastReportDays,
    });
  }

  return hotspots;
}

export function fallbackBriefing(hotspots: BriefingHotspot[]): OperationalBriefing {
  if (hotspots.length === 0) {
    return {
      headline: "No hotspots to brief",
      summary: "There are no hotspot cells in the current view.",
      priorities: [],
      caveats:
        "Rule-based draft from stored reports. The hotspot score is a triage aid, not a flood prediction.",
      source: "fallback",
    };
  }

  const top = hotspots[0];
  const priorities = hotspots.slice(0, BRIEFING_MAX_PRIORITIES).map((hotspot) => {
    const category = hotspot.topCategory
      ? ` Most reports are ${CATEGORY_LABELS[hotspot.topCategory].toLowerCase()}.`
      : "";

    return {
      hotspotId: hotspot.id,
      reason: `${hotspot.count} report${hotspot.count === 1 ? "" : "s"} (${hotspot.activeCount} active, ${hotspot.resolvedCount} resolved), including ${hotspot.criticalCount} critical and ${hotspot.highCount} high. Score ${hotspot.score}/100; newest report ${hotspot.lastReportDays} day${hotspot.lastReportDays === 1 ? "" : "s"} ago.${category}`,
      action:
        hotspot.activeCount > 0
          ? "Verify the hazard on site, confirm drain access, and record the inspection outcome before dispatch."
          : "Check whether the hazard has returned. Keep it resolved unless a new inspection finds an active problem.",
    };
  });

  return {
    headline: `Review ${top.label}`,
    summary: `${hotspots.length} hotspot cell${hotspots.length === 1 ? "" : "s"} in view. ${top.label} ranks first at ${top.score}/100 from ${top.count} report${top.count === 1 ? "" : "s"}, with ${top.activeCount} still active.`,
    priorities,
    caveats:
      "Rule-based draft from stored reports. The score is an explainable triage aid, not a flood prediction. Confirm site conditions before dispatching a crew.",
    source: "fallback",
  };
}

export function parseBriefingResponse(
  text: string,
  hotspots: BriefingHotspot[],
): OperationalBriefing | null {
  let parsed: unknown;

  try {
    parsed = JSON.parse(text);
  } catch {
    return null;
  }

  if (typeof parsed !== "object" || parsed === null) return null;
  const record = parsed as Record<string, unknown>;

  if (
    typeof record.headline !== "string" ||
    typeof record.summary !== "string" ||
    typeof record.caveats !== "string" ||
    !Array.isArray(record.priorities)
  ) {
    return null;
  }

  const headline = clampText(record.headline, 140);
  const summary = clampText(record.summary, 600);
  const caveats = clampText(record.caveats, 280);
  if (!headline || !summary || !caveats) return null;

  const allowed = new Set(hotspots.map((hotspot) => hotspot.id));
  const seen = new Set<string>();
  const priorities: BriefingPriority[] = [];

  for (const item of record.priorities) {
    if (typeof item !== "object" || item === null) return null;
    const priority = item as Record<string, unknown>;

    if (
      typeof priority.hotspotId !== "string" ||
      typeof priority.reason !== "string" ||
      typeof priority.action !== "string"
    ) {
      return null;
    }

    const hotspotId = priority.hotspotId.trim();
    const reason = clampText(priority.reason, 240);
    const action = clampText(priority.action, 240);

    if (!allowed.has(hotspotId) || !reason || !action || seen.has(hotspotId)) continue;
    if (priorities.length >= BRIEFING_MAX_PRIORITIES) break;

    seen.add(hotspotId);
    priorities.push({ hotspotId, reason, action });
  }

  if (priorities.length === 0) return null;

  return {
    headline,
    summary,
    priorities,
    caveats,
    source: "gemini",
  };
}
