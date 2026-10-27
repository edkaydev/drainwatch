import { Badge, type BadgeVariant } from "./badge";
import {
  SEVERITY_LABELS,
  STATUS_LABELS,
  type IncidentStatus,
  type Severity,
} from "@/lib/types";

const SEVERITY_VARIANTS: Record<Severity, BadgeVariant> = {
  low: "success",
  medium: "info",
  high: "warning",
  critical: "critical",
};

// Card/panel background+border+text tone per severity — critical always
// reads as red, the rest stay visually distinct from each other.
export const SEVERITY_CARD_TONE: Record<Severity, string> = {
  critical: "border-critical-300 bg-critical-50 text-critical-800",
  high: "border-warning-300 bg-warning-50 text-warning-800",
  medium: "border-info-200 bg-info-50 text-info-800",
  low: "border-success-200 bg-success-50 text-success-800",
};

const STATUS_VARIANTS: Record<IncidentStatus, BadgeVariant> = {
  new: "info",
  in_progress: "neutral",
  resolved: "success",
};

export function SeverityBadge({
  severity,
  className,
}: {
  severity: Severity;
  className?: string;
}) {
  return (
    <Badge variant={SEVERITY_VARIANTS[severity]} className={className}>
      {SEVERITY_LABELS[severity]}
    </Badge>
  );
}

export function StatusBadge({
  status,
  className,
}: {
  status: IncidentStatus;
  className?: string;
}) {
  return (
    <Badge variant={STATUS_VARIANTS[status]} className={className}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}
