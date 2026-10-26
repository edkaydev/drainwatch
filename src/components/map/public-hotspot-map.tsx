"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { FeatureCollection } from "geojson";
import type { GeoJSONSource, Map as MapLibreMap, Popup } from "maplibre-gl";
import { ArrowUpRight, Filter, MapPinned, Radio, SearchX } from "lucide-react";
import { Badge, severityToBadgeVariant } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Alert, EmptyState, LoadingBlock, Spinner } from "@/components/ui/feedback";
import { usePublicIncidents } from "@/hooks/use-incidents";
import { computeHotspots, hotspotTone } from "@/lib/hotspots";
import { MAP_STYLE_URL, KAMPALA_BOUNDS, SEVERITY_COLOURS } from "@/lib/map-style";
import {
  CATEGORY_LABELS,
  KAMPALA_CENTER,
  SEVERITIES,
  SEVERITY_LABELS,
  STATUS_LABELS,
  type IncidentStatus,
  type PublicIncident,
  type Severity,
} from "@/lib/types";
import { formatCoordinates, formatNumber, formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";

const STATUS_TONE: Record<IncidentStatus, "critical" | "warning" | "info" | "success"> = {
  new: "critical",
  triaged: "warning",
  in_progress: "info",
  resolved: "success",
};

function severityFilterLabel(value: "all" | Severity): string {
  return value === "all" ? "All severities" : SEVERITY_LABELS[value];
}

function buildFeatures(
  incidents: PublicIncident[],
  hotspotIds: Map<string, string>,
): FeatureCollection {
  return {
    type: "FeatureCollection",
    features: incidents.map((incident) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [incident.location.lng, incident.location.lat],
      },
      properties: {
        id: incident.id,
        title: incident.title,
        category: CATEGORY_LABELS[incident.category],
        severity: incident.severity,
        status: STATUS_LABELS[incident.status],
        createdAt: incident.createdAt.toISOString(),
        hotspotId: hotspotIds.get(incident.id) ?? "",
      },
    })),
  };
}

function readInitialFocus(): { incident?: string; hotspot?: string } {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  return {
    incident: params.get("incident") ?? undefined,
    hotspot: params.get("hotspot") ?? undefined,
  };
}

function popupElement(incident: PublicIncident): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.className = "max-w-64 p-1";

  const title = document.createElement("p");
  title.className = "text-sm font-semibold leading-5 text-ink-900";
  title.textContent = incident.title;

  const meta = document.createElement("p");
  meta.className = "mt-1 text-xs text-ink-500";
  meta.textContent = `${CATEGORY_LABELS[incident.category]} · ${STATUS_LABELS[incident.status]} · ${formatRelativeTime(incident.createdAt)}`;

  wrapper.append(title, meta);
  return wrapper;
}

export function PublicHotspotMap() {
  const { data: incidents, loading, error, configured } = usePublicIncidents();
  const [initialFocus] = useState(readInitialFocus);
  const [severity, setSeverity] = useState<"all" | Severity>("all");
  const [status, setStatus] = useState<"active" | "all" | "resolved">("active");
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(
    initialFocus.incident ?? null,
  );
  const [selectedHotspotId, setSelectedHotspotId] = useState<string | null>(
    initialFocus.hotspot ?? null,
  );
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapFailed, setMapFailed] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const popupRef = useRef<Popup | null>(null);

  const hotspots = useMemo(() => {
    if (incidents.length === 0) return [];
    return computeHotspots(incidents, new Date());
  }, [incidents]);

  const hotspotIds = useMemo(() => {
    const result = new Map<string, string>();
    for (const hotspot of hotspots) {
      for (const incident of hotspot.incidents) {
        result.set(incident.id, hotspot.id);
      }
    }
    return result;
  }, [hotspots]);

  const filteredIncidents = useMemo(
    () =>
      incidents.filter((incident) => {
        if (severity !== "all" && incident.severity !== severity) return false;
        if (status === "active" && incident.status === "resolved") return false;
        if (status === "resolved" && incident.status !== "resolved") return false;
        return true;
      }),
    [incidents, severity, status],
  );

  const filteredHotspots = useMemo(
    () =>
      hotspots.filter((hotspot) => {
        if (severity !== "all" && hotspot.severityCounts[severity] === 0) return false;
        if (status === "active" && hotspot.activeCount === 0) return false;
        if (status === "resolved" && hotspot.resolvedCount === 0) return false;
        return true;
      }),
    [hotspots, severity, status],
  );

  const features = useMemo(
    () => buildFeatures(filteredIncidents, hotspotIds),
    [filteredIncidents, hotspotIds],
  );

  const selectedIncident = useMemo(
    () => incidents.find((incident) => incident.id === selectedIncidentId) ?? null,
    [incidents, selectedIncidentId],
  );

  const selectedHotspot = useMemo(
    () =>
      hotspots.find(
        (hotspot) =>
          hotspot.id === selectedHotspotId ||
          hotspot.id.replace(",", "-") === selectedHotspotId,
      ) ?? null,
    [hotspots, selectedHotspotId],
  );

  useEffect(() => {
    let cancelled = false;

    async function initialise() {
      const maplibre = await import("maplibre-gl");
      if (cancelled || !containerRef.current) return;

      const map = new maplibre.Map({
        container: containerRef.current,
        style: MAP_STYLE_URL,
        center: [KAMPALA_CENTER.lng, KAMPALA_CENTER.lat],
        zoom: 11.5,
        maxBounds: KAMPALA_BOUNDS,
        attributionControl: false,
      });

      map.addControl(
        new maplibre.AttributionControl({ compact: true }),
        "bottom-right",
      );
      map.addControl(
        new maplibre.NavigationControl({ showCompass: false }),
        "top-right",
      );

      map.on("load", () => {
        if (cancelled) return;

        map.addSource("incidents", {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        });

        map.addLayer({
          id: "hotspot-halo",
          type: "circle",
          source: "incidents",
          filter: ["==", ["get", "hotspotId"], ""],
          paint: {
            "circle-radius": 25,
            "circle-color": "#0d211e",
            "circle-opacity": 0.16,
          },
        });

        map.addLayer({
          id: "incident-circles",
          type: "circle",
          source: "incidents",
          paint: {
            "circle-radius": [
              "interpolate",
              ["linear"],
              ["zoom"],
              10,
              4,
              14,
              8,
              18,
              13,
            ],
            "circle-color": [
              "match",
              ["get", "severity"],
              "critical",
              SEVERITY_COLOURS.critical,
              "high",
              SEVERITY_COLOURS.high,
              "medium",
              SEVERITY_COLOURS.medium,
              SEVERITY_COLOURS.low,
            ],
            "circle-stroke-color": "#ffffff",
            "circle-stroke-width": 1.5,
            "circle-opacity": 0.92,
          },
        });

        map.addLayer({
          id: "selected-incident",
          type: "circle",
          source: "incidents",
          filter: ["==", ["get", "id"], ""],
          paint: {
            "circle-radius": 16,
            "circle-color": "#ffffff",
            "circle-opacity": 0.3,
            "circle-stroke-color": "#0d211e",
            "circle-stroke-width": 2,
          },
        });

        map.on("click", "incident-circles", (event) => {
          const feature = event.features?.[0];
          const id = feature?.properties?.id;
          if (typeof id === "string") {
            setSelectedIncidentId(id);
            setSelectedHotspotId(null);
          }
        });

        map.on("mouseenter", "incident-circles", () => {
          map.getCanvas().style.cursor = "pointer";
        });

        map.on("mouseleave", "incident-circles", () => {
          map.getCanvas().style.cursor = "";
        });

        mapRef.current = map;
        setMapReady(true);
      });

      mapRef.current = map;
    }

    initialise().catch(() => {
      if (!cancelled) {
        setMapError("The interactive map could not load. Use the hotspot list to explore reports.");
        setMapFailed(true);
      }
    });

    return () => {
      cancelled = true;
      popupRef.current?.remove();
      popupRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapReady) return;
    const source = mapRef.current?.getSource("incidents") as GeoJSONSource | undefined;
    source?.setData(features);
  }, [features, mapReady]);

  useEffect(() => {
    if (!mapReady) return;
    const map = mapRef.current;
    if (!map) return;

    map.setFilter("hotspot-halo", [
      "==",
      ["get", "hotspotId"],
      selectedHotspotId ?? "",
    ]);
    map.setFilter("selected-incident", [
      "==",
      ["get", "id"],
      selectedIncidentId ?? "",
    ]);
  }, [mapReady, selectedHotspotId, selectedIncidentId]);

  useEffect(() => {
    if (!mapReady) return;
    const map = mapRef.current;
    if (!map) return;

    popupRef.current?.remove();
    popupRef.current = null;

    if (selectedIncident) {
      map.flyTo({
        center: [selectedIncident.location.lng, selectedIncident.location.lat],
        zoom: Math.max(map.getZoom(), 14.5),
        duration: 700,
      });

      import("maplibre-gl").then((maplibre) => {
        if (!mapRef.current) return;
        popupRef.current = new maplibre.Popup({ offset: 16, closeButton: true })
          .setLngLat([selectedIncident.location.lng, selectedIncident.location.lat])
          .setDOMContent(popupElement(selectedIncident))
          .addTo(mapRef.current);
      });
      return;
    }

    if (selectedHotspot) {
      const points = selectedHotspot.incidents.map(
        (incident) => [incident.location.lng, incident.location.lat] as [number, number],
      );

      if (points.length === 1) {
        map.flyTo({
          center: points[0],
          zoom: 15,
          duration: 700,
        });
      } else {
        let minLng = points[0][0];
        let minLat = points[0][1];
        let maxLng = points[0][0];
        let maxLat = points[0][1];

        for (const [lng, lat] of points) {
          minLng = Math.min(minLng, lng);
          minLat = Math.min(minLat, lat);
          maxLng = Math.max(maxLng, lng);
          maxLat = Math.max(maxLat, lat);
        }

        const bounds: [[number, number], [number, number]] = [
          [minLng, minLat],
          [maxLng, maxLat],
        ];

        map.fitBounds(bounds, { padding: 80, maxZoom: 15.5, duration: 700 });
      }
    }
  }, [mapReady, selectedIncident, selectedHotspot]);

  const activeCount = incidents.filter((incident) => incident.status !== "resolved").length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <div className="max-w-3xl">
        <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700">
          <Radio className="h-3.5 w-3.5" aria-hidden="true" />
          Public hotspot map
        </span>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-teal-900 sm:text-4xl">
          Drainage hotspots across Kampala
        </h1>
        <p className="mt-3 text-ink-500">
          Explore reported hazards and the recurring locations that need
          attention. Reporter contact details are never shown here.
        </p>
      </div>

      {!configured ? (
        <Alert variant="warning" title="Map data is not connected" className="mt-6">
          Firebase environment variables are missing, so no incidents can be
          loaded. The map and filters remain available for review.
        </Alert>
      ) : null}

      {error ? (
        <Alert variant="error" title="Could not load public reports" className="mt-6">
          {error}
        </Alert>
      ) : null}

      <Card className="mt-6 p-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end">
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-ink-500">
              <Filter className="h-3.5 w-3.5" aria-hidden="true" />
              Severity
            </p>
            <div className="flex flex-wrap gap-1.5">
              {(["all", ...SEVERITIES] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSeverity(value)}
                  aria-pressed={severity === value}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                    severity === value
                      ? "border-teal-900 bg-teal-900 text-white"
                      : "border-ink-200 bg-white text-ink-600 hover:bg-ink-50",
                  )}
                >
                  {severityFilterLabel(value)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label
              htmlFor="map-status"
              className="mb-2 block text-xs font-medium text-ink-500"
            >
              Status
            </label>
            <select
              id="map-status"
              value={status}
              onChange={(event) => setStatus(event.target.value as typeof status)}
              className="h-9 rounded-full border border-ink-200 bg-white px-3.5 text-xs font-medium text-ink-700"
            >
              <option value="active">Active reports</option>
              <option value="all">All statuses</option>
              <option value="resolved">Resolved only</option>
            </select>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-2 xl:ml-auto">
            <div>
              <p className="text-xs text-ink-400">Showing</p>
              <p className="font-semibold text-teal-900">
                {formatNumber(filteredIncidents.length)} reports
              </p>
            </div>
            <div>
              <p className="text-xs text-ink-400">Active citywide</p>
              <p className="font-semibold text-teal-900">
                {formatNumber(activeCount)}
              </p>
            </div>
            <div>
              <p className="text-xs text-ink-400">Hotspot cells</p>
              <p className="font-semibold text-teal-900">
                {formatNumber(filteredHotspots.length)}
              </p>
            </div>
          </div>
        </div>
      </Card>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="relative h-[520px] overflow-hidden rounded-2xl border border-ink-200 bg-ink-100 shadow-sm lg:h-[680px]">
          <div
            ref={containerRef}
            role="application"
            aria-label="Map of public drainage incidents in Kampala"
            className="absolute inset-0"
          />

          {loading ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-ink-50/80 backdrop-blur-sm">
              <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm text-ink-600 shadow-sm">
                <Spinner className="h-4 w-4 text-brand-600" />
                Loading public reports…
              </div>
            </div>
          ) : null}

          {mapFailed ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-ink-50/95 p-6">
              <EmptyState
                icon={MapPinned}
                title="Map unavailable"
                description={mapError ?? "The map could not load. The hotspot list still works."}
              />
            </div>
          ) : null}

          <div className="pointer-events-none absolute bottom-4 left-4 z-10 rounded-xl bg-white/95 px-3 py-2.5 shadow-sm backdrop-blur">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-400">
              Severity
            </p>
            <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
              {SEVERITIES.map((value) => (
                <span key={value} className="flex items-center gap-1.5 text-xs text-ink-600">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: SEVERITY_COLOURS[value] }}
                  />
                  {SEVERITY_LABELS[value]}
                </span>
              ))}
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          {selectedIncident ? (
            <Card className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
                    Selected report
                  </p>
                  <h2 className="mt-1 font-semibold leading-6 text-teal-900">
                    {selectedIncident.title}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedIncidentId(null)}
                  className="text-xs font-medium text-ink-500 hover:text-teal-900"
                >
                  Clear
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Badge variant={severityToBadgeVariant(selectedIncident.severity)}>
                  {SEVERITY_LABELS[selectedIncident.severity]}
                </Badge>
                <Badge variant={STATUS_TONE[selectedIncident.status]}>
                  {STATUS_LABELS[selectedIncident.status]}
                </Badge>
                <Badge>{CATEGORY_LABELS[selectedIncident.category]}</Badge>
              </div>
              <dl className="mt-4 space-y-2 text-xs">
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-400">Location</dt>
                  <dd className="text-right font-medium text-ink-700">
                    {selectedIncident.location.address ||
                      selectedIncident.location.division ||
                      formatCoordinates(
                        selectedIncident.location.lat,
                        selectedIncident.location.lng,
                      )}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-400">Reported</dt>
                  <dd className="font-medium text-ink-700">
                    {formatRelativeTime(selectedIncident.createdAt)}
                  </dd>
                </div>
              </dl>
            </Card>
          ) : null}

          {selectedHotspot ? (
            <Card className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
                    Selected hotspot
                  </p>
                  <h2 className="mt-1 font-semibold text-teal-900">
                    {selectedHotspot.address ||
                      selectedHotspot.division ||
                      formatCoordinates(selectedHotspot.lat, selectedHotspot.lng)}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedHotspotId(null)}
                  className="text-xs font-medium text-ink-500 hover:text-teal-900"
                >
                  Clear
                </button>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", hotspotTone(selectedHotspot.score).className)}>
                  {hotspotTone(selectedHotspot.score).label}
                </span>
                <span className="text-xs text-ink-500">
                  Score {selectedHotspot.score}/100
                </span>
              </div>
              <p className="mt-3 text-sm text-ink-600">
                {selectedHotspot.count} report{selectedHotspot.count === 1 ? "" : "s"} ·{" "}
                {selectedHotspot.activeCount} active ·{" "}
                {selectedHotspot.resolvedCount} resolved
              </p>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                {[
                  { label: "Recurrence", value: selectedHotspot.scoreBreakdown.recurrence, max: 40 },
                  { label: "Severity", value: selectedHotspot.scoreBreakdown.severity, max: 30 },
                  { label: "Recency", value: selectedHotspot.scoreBreakdown.recency, max: 20 },
                  { label: "Active density", value: selectedHotspot.scoreBreakdown.concentration, max: 10 },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between rounded-lg bg-ink-50 px-2.5 py-1.5"
                  >
                    <dt className="text-ink-500">{item.label}</dt>
                    <dd className="font-medium text-ink-800">
                      {Math.round(item.value)}/{item.max}
                    </dd>
                  </div>
                ))}
              </dl>
            </Card>
          ) : null}

          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
              <div>
                <h2 className="font-semibold text-teal-900">Priority hotspots</h2>
                <p className="mt-0.5 text-xs text-ink-500">
                  Ranked by recurrence, severity, recency, and active report density
                </p>
              </div>
              <MapPinned className="h-4 w-4 text-brand-600" aria-hidden="true" />
            </div>

            {loading ? (
              <LoadingBlock label="Calculating hotspots…" />
            ) : filteredHotspots.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <SearchX className="mx-auto h-6 w-6 text-ink-300" aria-hidden="true" />
                <p className="mt-3 text-sm font-medium text-ink-700">
                  No hotspots match these filters
                </p>
                <p className="mt-1 text-xs text-ink-500">
                  Try showing all statuses or severities.
                </p>
              </div>
            ) : (
              <ol className="max-h-[520px] divide-y divide-ink-100 overflow-y-auto">
                {filteredHotspots.slice(0, 20).map((hotspot, index) => {
                  const tone = hotspotTone(hotspot.score);
                  const active = hotspot.id === selectedHotspotId;
                  return (
                    <li key={hotspot.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedHotspotId(hotspot.id);
                          setSelectedIncidentId(null);
                        }}
                        className={cn(
                          "flex w-full gap-3 px-5 py-4 text-left transition-colors hover:bg-ink-50",
                          active && "bg-brand-50/70",
                        )}
                      >
                        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink-100 text-xs font-semibold text-ink-600">
                          {index + 1}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-start justify-between gap-2">
                            <span className="truncate text-sm font-medium text-teal-900">
                              {hotspot.address || hotspot.division || "Kampala"}
                            </span>
                            <span
                              className={cn(
                                "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                                tone.className,
                              )}
                            >
                              {tone.label}
                            </span>
                          </span>
                          <span className="mt-1 block text-xs text-ink-500">
                            {hotspot.count} reports · {hotspot.activeCount} active
                          </span>
                          <span className="mt-0.5 block text-[11px] text-ink-400">
                            Last report {formatRelativeTime(hotspot.lastReportedAt)} · score{" "}
                            {hotspot.score}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            )}

            <div className="border-t border-ink-100 px-5 py-3">
              <Link
                href="/report"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-700 hover:text-brand-800"
              >
                Spotted a hazard? Report it
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
