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

const STATUS_VARIANTS: Record<IncidentStatus, BadgeVariant> = {
  new: "info",
  triaged: "warning",
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
