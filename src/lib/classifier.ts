import {
  CATEGORY_LABELS,
  type AIClassification,
  type IncidentCategory,
  type Severity,
  type Urgency,
} from "./types";
import type { ClassifyRequest } from "./validation";

type Rule = {
  category: IncidentCategory;
  keywords: string[];
  weight: number;
};

const CATEGORY_RULES: Rule[] = [
  {
    category: "open_manhole",
    keywords: [
      "manhole",
      "man hole",
      "uncovered",
      "cover missing",
      "missing cover",
      "open hole",
      "open sewer",
    ],
    weight: 3,
  },
  {
    category: "broken_culvert",
    keywords: [
      "culvert",
      "broken cover",
      "cracked cover",
      "damaged cover",
      "collapsed cover",
      "broken slab",
    ],
    weight: 3,
  },
  {
    category: "erosion",
    keywords: [
      "erosion",
      "eroded",
      "gully",
      "washed away",
      "scoured",
      "bank collapsed",
      "soil collapse",
      "sinkhole",
    ],
    weight: 3,
  },
  {
    category: "flooding",
    keywords: [
      "flood",
      "flooded",
      "flooding",
      "standing water",
      "stagnant water",
      "water logged",
      "waterlogged",
      "overflow",
      "overflows",
      "burst",
    ],
    weight: 3,
  },
  {
    category: "illegal_dumping",
    keywords: [
      "dumping",
      "dumped",
      "rubbish",
      "trash",
      "garbage",
      "plastic",
      "waste",
      "debris pile",
    ],
    weight: 2,
  },
  {
    category: "blocked_drain",
    keywords: [
      "blocked",
      "blockage",
      "clogged",
      "choked",
      "silted",
      "silt",
      "not flowing",
      "no flow",
      "drain full",
      "stuck",
      "jammed",
    ],
    weight: 2,
  },
];

const CRITICAL_KEYWORDS = [
  "collapse",
  "collapsed",
  "sinkhole",
  "child",
  "children",
  "school",
  "hospital",
  "casualty",
  "injury",
  "injured",
  "death",
  "danger",
  "dangerous",
  "washed away",
  "road closed",
  "sewage",
  "deep hole",
];

const HIGH_KEYWORDS = [
  "severe",
  "major",
  "large",
  "completely blocked",
  "fully blocked",
  "overflowing",
  "overflow",
  "market",
  "main road",
  "homes",
  "houses",
  "flooded",
];

const LOW_KEYWORDS = ["minor", "small", "slight", "cosmetic", "occasionally"];

const SEVERITY_WEIGHT: Record<Severity, number> = {
  low: 0.25,
  medium: 0.5,
  high: 0.75,
  critical: 1,
};

function normalise(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ");
}

function scoreCategory(text: string): { category: IncidentCategory; score: number } {
  let best: { category: IncidentCategory; score: number } = {
    category: "other",
    score: 0,
  };

  for (const rule of CATEGORY_RULES) {
    const score = rule.keywords.reduce(
      (total, keyword) => total + (text.includes(keyword) ? rule.weight : 0),
      0,
    );

    if (score > best.score) {
      best = { category: rule.category, score };
    }
  }

  return best;
}

function scoreSeverity(text: string): { severity: Severity; score: number } {
  const critical = CRITICAL_KEYWORDS.filter((keyword) => text.includes(keyword)).length;
  const high = HIGH_KEYWORDS.filter((keyword) => text.includes(keyword)).length;
  const low = LOW_KEYWORDS.filter((keyword) => text.includes(keyword)).length;

  if (critical > 0) return { severity: "critical", score: critical };
  if (high > 0) return { severity: "high", score: high };
  if (low > 0) return { severity: "low", score: low };
  return { severity: "medium", score: 0 };
}

function urgencyFor(severity: Severity): Urgency {
  switch (severity) {
    case "critical":
      return "immediate";
    case "high":
      return "high";
    case "medium":
      return "normal";
    case "low":
      return "low";
  }
}

function summaryFor(
  category: IncidentCategory,
  severity: Severity,
  matched: boolean,
): string {
  const label = CATEGORY_LABELS[category].toLowerCase();
  if (!matched) {
    return `Drainage report received. A possible ${label} was detected; staff should verify the category and severity on site.`;
  }

  return `Text suggests a ${severity}-severity ${label}. Verify the hazard on site before changing priority or status.`;
}

/**
 * Deterministic, dependency-free classifier used when Gemini is not configured
 * or the model call fails. It is intentionally conservative and advisory only.
 */
export function classifyFallback(input: ClassifyRequest): AIClassification {
  const text = normalise(`${input.category ?? ""} ${input.description}`);

  const categoryResult = scoreCategory(text);
  const severityResult = scoreSeverity(text);

  const category = categoryResult.score > 0 ? categoryResult.category : input.category ?? "other";
  const severity = severityResult.score > 0 ? severityResult.severity : input.severity ?? "medium";

  const matched = categoryResult.score > 0 || severityResult.score > 0;
  const confidence = matched
    ? Math.min(0.82, 0.5 + categoryResult.score * 0.04 + severityResult.score * 0.05)
    : 0.35;

  return {
    category,
    severity,
    urgency: urgencyFor(severity),
    summary: summaryFor(category, severity, matched),
    confidence: Number(confidence.toFixed(2)),
    source: "fallback",
    reviewed: false,
  };
}

export function severityFromScore(score: number): Severity {
  if (score >= 0.9) return "critical";
  if (score >= 0.6) return "high";
  if (score >= 0.3) return "medium";
  return "low";
}

export function severityWeight(severity: Severity): number {
  return SEVERITY_WEIGHT[severity];
}
