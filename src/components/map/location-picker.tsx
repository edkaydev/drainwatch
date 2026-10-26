"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef } from "react";
import type { Marker } from "maplibre-gl";
import { KAMPALA_CENTER } from "@/lib/types";
import { KAMPALA_BOUNDS, MAP_STYLE_URL } from "@/lib/map-style";
import { cn } from "@/lib/utils";

type Point = { lat: number; lng: number };

export function LocationPicker({
  value,
  onChange,
  className,
}: {
  value: Point | null;
  onChange: (point: Point) => void;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<import("maplibre-gl").Map | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const maplibreRef = useRef<typeof import("maplibre-gl") | null>(null);
  const onChangeRef = useRef(onChange);
  const valueRef = useRef(value);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    let cancelled = false;

    async function initialise() {
      const maplibre = await import("maplibre-gl");
      if (cancelled || !containerRef.current) return;

      maplibreRef.current = maplibre;
      const start = valueRef.current ?? KAMPALA_CENTER;
      const map = new maplibre.Map({
        container: containerRef.current,
        style: MAP_STYLE_URL,
        center: [start.lng, start.lat],
        zoom: valueRef.current ? 14 : 12,
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

      if (valueRef.current) {
        markerRef.current = new maplibre.Marker({ draggable: true })
          .setLngLat([valueRef.current.lng, valueRef.current.lat])
          .addTo(map);
      }

      markerRef.current?.on("dragend", () => {
        const position = markerRef.current?.getLngLat();
        if (position) {
          onChangeRef.current({ lat: position.lat, lng: position.lng });
        }
      });

      map.on("click", (event) => {
        const point = { lat: event.lngLat.lat, lng: event.lngLat.lng };

        if (!markerRef.current) {
          markerRef.current = new maplibre.Marker({ draggable: true })
            .setLngLat([point.lng, point.lat])
            .addTo(map);
          markerRef.current.on("dragend", () => {
            const position = markerRef.current?.getLngLat();
            if (position) {
              onChangeRef.current({ lat: position.lat, lng: position.lng });
            }
          });
        } else {
          markerRef.current.setLngLat([point.lng, point.lat]);
        }

        onChangeRef.current(point);
      });

      mapRef.current = map;
    }

    initialise().catch(() => {
      // The parent form still accepts manual coordinates if the map fails.
    });

    return () => {
      cancelled = true;
      markerRef.current?.remove();
      markerRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!value) return;

    const map = mapRef.current;
    const maplibre = maplibreRef.current;
    if (!map || !maplibre) return;

    if (!markerRef.current) {
      markerRef.current = new maplibre.Marker({ draggable: true })
        .setLngLat([value.lng, value.lat])
        .addTo(map);
      markerRef.current.on("dragend", () => {
        const position = markerRef.current?.getLngLat();
        if (position) {
          onChangeRef.current({ lat: position.lat, lng: position.lng });
        }
      });
    } else {
      const current = markerRef.current.getLngLat();
      if (
        Math.abs(current.lat - value.lat) > 0.000001 ||
        Math.abs(current.lng - value.lng) > 0.000001
      ) {
        markerRef.current.setLngLat([value.lng, value.lat]);
      }
    }

    if (map.getZoom() < 14) {
      map.flyTo({ center: [value.lng, value.lat], zoom: 14, duration: 600 });
    }
  }, [value]);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-ink-200 bg-ink-100",
        className,
      )}
    >
      <div ref={containerRef} className="h-full min-h-72 w-full" />
      <p className="pointer-events-none absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-ink-600 shadow-sm backdrop-blur">
        Tap the map to place the pin, or drag it to adjust.
      </p>
    </div>
  );
}
