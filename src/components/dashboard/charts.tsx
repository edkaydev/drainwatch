"use client";

import { useId } from "react";
import type { CountItem, TrendPoint } from "@/lib/stats";
import { cn } from "@/lib/utils";

export function TrendChart({
  points,
  title = "Reports received",
}: {
  points: TrendPoint[];
  title?: string;
}) {
  const gradientId = useId().replace(/:/g, "");
  const width = 640;
  const height = 240;
  const padding = { top: 20, right: 16, bottom: 34, left: 34 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const rawMax = Math.max(1, ...points.map((point) => point.value));
  const max = Math.max(4, Math.ceil(rawMax / 4) * 4);

  const coordinates = points.map((point, index) => {
    const x =
      padding.left +
      (points.length <= 1 ? innerWidth / 2 : (index / (points.length - 1)) * innerWidth);
    const y = padding.top + innerHeight - (point.value / max) * innerHeight;
    return { ...point, x, y };
  });

  const line = coordinates
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(1)},${point.y.toFixed(1)}`)
    .join(" ");

  const area = coordinates.length
    ? `${line} L${coordinates[coordinates.length - 1].x.toFixed(1)},${padding.top + innerHeight} L${coordinates[0].x.toFixed(1)},${padding.top + innerHeight} Z`
    : "";

  const gridValues = [max, max / 2, 0];
  const labelEvery = Math.max(1, Math.ceil(points.length / 7));
  const total = points.reduce((sum, point) => sum + point.value, 0);

  return (
    <figure>
      <div className="overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-labelledby={`${gradientId}-title`}
          className="h-auto w-full"
        >
          <title id={`${gradientId}-title`}>
            {title}: {total} reports over {points.length} days
          </title>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#256b39" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#256b39" stopOpacity="0" />
            </linearGradient>
          </defs>

          {gridValues.map((value) => {
            const y = padding.top + innerHeight - (value / max) * innerHeight;
            return (
              <g key={value}>
                <line
                  x1={padding.left}
                  x2={padding.left + innerWidth}
                  y1={y}
                  y2={y}
                  stroke="currentColor"
                  className="text-ink-100"
                  strokeDasharray={value === 0 ? undefined : "3 5"}
                />
                <text
                  x={padding.left - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-ink-400 text-[10px]"
                >
                  {Math.round(value)}
                </text>
              </g>
            );
          })}

          {area ? <path d={area} fill={`url(#${gradientId})`} /> : null}
          {line ? (
            <path
              d={line}
              fill="none"
              stroke="#256b39"
              strokeWidth="2.5"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ) : null}

          {coordinates.map((point) => (
            <circle
              key={point.key}
              cx={point.x}
              cy={point.y}
              r={point.value > 0 ? 3 : 0}
              fill="#256b39"
              stroke="#ffffff"
              strokeWidth="1.5"
            >
              <title>
                {point.label}: {point.value} report{point.value === 1 ? "" : "s"}
              </title>
            </circle>
          ))}

          {coordinates.map((point, index) =>
            index % labelEvery === 0 || index === coordinates.length - 1 ? (
              <text
                key={point.key}
                x={point.x}
                y={height - 12}
                textAnchor="middle"
                className="fill-ink-400 text-[10px]"
              >
                {point.label}
              </text>
            ) : null,
          )}
        </svg>
      </div>
      <figcaption className="sr-only">
        {points.map((point) => `${point.label}: ${point.value}`).join(", ")}.
      </figcaption>
    </figure>
  );
}

export function BarList({
  items,
  emptyLabel = "No data yet",
  tone = "bg-brand-500",
}: {
  items: CountItem[];
  emptyLabel?: string;
  tone?: string;
}) {
  const max = Math.max(1, ...items.map((item) => item.value));

  if (items.length === 0) {
    return <p className="py-8 text-center text-sm text-ink-400">{emptyLabel}</p>;
  }

  return (
    <ul className="space-y-3.5">
      {items.map((item) => (
        <li key={item.key}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate text-ink-700">{item.label}</span>
            <span className="shrink-0 font-semibold text-teal-900">{item.value}</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink-100">
            <div
              className={cn("h-full rounded-full", tone)}
              style={{ width: `${Math.max(2, (item.value / max) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

const DONUT_COLOURS = ["#2f7fd9", "#e7912c", "#6a9b93", "#2f9e5b"];

export function DonutChart({
  items,
  centreLabel,
  centreValue,
}: {
  items: CountItem[];
  centreLabel: string;
  centreValue: string;
}) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex items-center gap-6">
      <div className="relative h-32 w-32 shrink-0">
        <svg viewBox="0 0 100 100" role="img" aria-label={`${centreLabel}: ${centreValue}`}>
          <circle cx="50" cy="50" r={radius} fill="none" stroke="#eeece7" strokeWidth="12" />
          {total > 0
            ? items.map((item, index) => {
                const fraction = item.value / total;
                const dash = fraction * circumference;
                const dashOffset = -offset;
                offset += dash;
                return (
                  <circle
                    key={item.key}
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="none"
                    stroke={DONUT_COLOURS[index % DONUT_COLOURS.length]}
                    strokeWidth="12"
                    strokeDasharray={`${dash} ${circumference - dash}`}
                    strokeDashoffset={dashOffset}
                    transform="rotate(-90 50 50)"
                  />
                );
              })
            : null}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-xl font-semibold text-teal-900">{centreValue}</span>
          <span className="text-[10px] uppercase tracking-wide text-ink-400">{centreLabel}</span>
        </div>
      </div>
      <ul className="space-y-2 text-sm">
        {items.map((item, index) => (
          <li key={item.key} className="flex items-center gap-2 text-ink-600">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: DONUT_COLOURS[index % DONUT_COLOURS.length] }}
            />
            <span className="min-w-0 flex-1 truncate">{item.label}</span>
            <span className="font-medium text-teal-900">{item.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
