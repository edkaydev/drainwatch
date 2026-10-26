import { cn } from "@/lib/utils";
import type { ComponentPropsWithoutRef } from "react";

const VARIANTS = {
  critical: "bg-critical-50 text-critical-600",
  warning: "bg-warning-50 text-warning-600",
  success: "bg-success-50 text-success-500",
  info: "bg-info-50 text-info-500",
  neutral: "bg-ink-100 text-ink-600",
} as const;

export type BadgeVariant = keyof typeof VARIANTS;

type BadgeProps = ComponentPropsWithoutRef<"span"> & {
  variant?: BadgeVariant;
};

export function Badge({ variant = "neutral", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
        VARIANTS[variant],
        className,
      )}
      {...props}
    />
  );
}

/** Maps domain severity values to the Badge visual variant. */
export function severityToBadgeVariant(
  severity: "low" | "medium" | "high" | "critical",
): BadgeVariant {
  switch (severity) {
    case "critical":
      return "critical";
    case "high":
      return "warning";
    case "medium":
      return "info";
    case "low":
      return "success";
  }
}
