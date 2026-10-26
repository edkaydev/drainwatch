import type { LucideIcon } from "lucide-react";
import { AlertTriangle, CheckCircle2, Info, LoaderCircle, XCircle } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Spinner({ className }: { className?: string }) {
  return (
    <LoaderCircle
      className={cn("h-5 w-5 animate-spin", className)}
      aria-hidden="true"
    />
  );
}

export function LoadingBlock({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-20 text-center">
      <Spinner className="h-6 w-6 text-brand-600" />
      <p className="text-sm text-ink-500">{label}</p>
    </div>
  );
}

const ALERT_STYLES = {
  info: {
    icon: Info,
    className: "border-info-500/20 bg-info-50 text-info-500",
  },
  success: {
    icon: CheckCircle2,
    className: "border-success-500/20 bg-success-50 text-success-500",
  },
  warning: {
    icon: AlertTriangle,
    className: "border-warning-500/20 bg-warning-50 text-warning-600",
  },
  error: {
    icon: XCircle,
    className: "border-critical-500/20 bg-critical-50 text-critical-600",
  },
} as const;

export function Alert({
  variant = "info",
  title,
  children,
  className,
}: {
  variant?: keyof typeof ALERT_STYLES;
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  const { icon: Icon, className: tone } = ALERT_STYLES[variant];

  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={cn("flex gap-3 rounded-xl border px-4 py-3 text-sm", tone, className)}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0">
        {title ? <p className="font-semibold">{title}</p> : null}
        <div className={cn(title && "mt-0.5", "text-ink-700")}>{children}</div>
      </div>
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-200 bg-ink-50/40 px-6 py-14 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-brand-600 shadow-sm">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <h3 className="mt-4 font-semibold text-teal-900">{title}</h3>
      <p className="mt-1 max-w-sm text-sm leading-6 text-ink-500">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
