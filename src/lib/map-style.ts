import type { Severity } from "./types";

export const MAP_STYLE_URL =
  process.env.NEXT_PUBLIC_MAP_STYLE_URL || "https://tiles.openfreemap.org/styles/liberty";

// Expanded to cover Kampala, Nkozi/UMU (~72 km SW of Kampala), and surrounding areas.
export const KAMPALA_BOUNDS: [[number, number], [number, number]] = [
  [31.7, -0.35],  // SW: covers Nkozi (32.00°E, 0.01°N) with margin
  [33.1, 0.85],   // NE: covers full greater Kampala area
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
