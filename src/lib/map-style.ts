import type { Severity } from "./types";

export const MAP_STYLE_URL =
  process.env.NEXT_PUBLIC_MAP_STYLE_URL || "https://tiles.openfreemap.org/styles/liberty";

/**
 * maplibre-gl normally derives its worker script URL from its own bundled
 * chunk's `import.meta.url`, assuming a sibling `maplibre-gl-worker.mjs`
 * file next to it. Turbopack's chunk URLs don't have that file alongside
 * them, so the worker 404s and the map silently never renders (a blank grey
 * box, no console-visible failure beyond "Worker failed to load"). Pointing
 * it at a copy we serve ourselves from public/ sidesteps that entirely.
 *
 * public/maplibre-gl-worker.js is copied from
 * node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs — re-copy it whenever
 * the maplibre-gl dependency version changes.
 */
export async function loadMapLibre() {
  const maplibre = await import("maplibre-gl");
  maplibre.config.WORKER_URL = "/maplibre-gl-worker.js";
  return maplibre;
}

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
