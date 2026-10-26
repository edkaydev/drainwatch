import type { Severity } from "./types";

export const MAP_STYLE_URL =
  process.env.NEXT_PUBLIC_MAP_STYLE_URL || "https://tiles.openfreemap.org/styles/liberty";

export const KAMPALA_BOUNDS: [[number, number], [number, number]] = [
  [32.2, 0.05],
  [32.95, 0.75],
];

export const SEVERITY_COLOURS: Record<Severity, string> = {
  low: "#2f9e5b",
  medium: "#2f7fd9",
  high: "#e7912c",
  critical: "#d9372f",
};

export const SEVERITY_LABELS_FOR_MAP: Record<Severity, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};
