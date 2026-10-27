"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Mail,
  MapPin,
  Navigation,
  Phone,
  ShieldCheck,
  Sparkles,
  User,
  X,
} from "lucide-react";
import { PageHeader } from "./page-header";
import { Card } from "@/components/ui/card";
import { Alert, EmptyState, LoadingBlock, Spinner } from "@/components/ui/feedback";
import { Badge } from "@/components/ui/badge";
import { Button, LinkButton } from "@/components/ui/button";
import { Field, Select, Textarea } from "@/components/ui/form";
import { SeverityBadge, StatusBadge } from "@/components/ui/status-badges";
import { useAuth } from "@/components/auth/auth-provider";
import { useIncident } from "@/hooks/use-incidents";
import {
  applyAISuggestion,
  dismissAISuggestion,
  updateIncidentStatus,
} from "@/lib/incidents";
import {
  CATEGORY_LABELS,
  nextStatuses,
  SEVERITY_LABELS,
  STATUS_LABELS,
  URGENCY_LABELS,
  type IncidentStatus,
} from "@/lib/types";
import {
  formatCoordinates,
  formatDateTime,
  formatRelativeTime,
  formatPercent,
} from "@/lib/format";
import {
  googleMapsDirectionsUrl,
  googleMapsPlaceUrl,
} from "@/lib/maps-links";
import { cn } from "@/lib/utils";

export function IncidentDetailView() {
  const params = useParams<{ id: string | string[] }>();
  const rawId = params?.id;
  const incidentId = Array.isArray(rawId) ? rawId[0] : rawId ?? "";
  const { incident, loading, error } = useIncident(incidentId);
  const { user } = useAuth();

  const [nextStatus, setNextStatus] = useState<IncidentStatus | "">("");
  const [note, setNote] = useState("");
  const [statusPending, setStatusPending] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const [aiPending, setAiPending] = useState<"apply" | "dismiss" | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (loading) {
    return (
      <div>
        <PageHeader eyebrow="Incidents" title="Incident detail" />
        <LoadingBlock label="Loading incident…" />
      </div>
    );
  }

  if (error && !incident) {
    return (
      <div className="space-y-4">
        <BackLink />
        <Card className="p-6">
          <Alert variant="error" title="Could not load this incident">
            {error}
          </Alert>
        </Card>
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="space-y-6">
        <BackLink />
        <EmptyState
          icon={MapPin}
          title="Incident not found"
          description="The report may have been removed, or the link is incorrect."
          action={
            <LinkButton href="/dashboard/incidents" size="sm">
              Back to incidents
            </LinkButton>
          }
        />
      </div>
    );
  }

  const activeIncident = incident;
  const staffName = user?.displayName?.trim() || user?.email || "Staff member";
  const staff = user ? { uid: user.uid, name: staffName } : null;
  const availableStatuses = nextStatuses(incident.status);
  const requiresNote = nextStatus === "resolved";
  const mapsUrl = googleMapsPlaceUrl(incident.location);
  const directionsUrl = googleMapsDirectionsUrl(incident.location);

  async function handleStatusUpdate() {
    setStatusError(null);
    setStatusMessage(null);

    if (!staff) {
      setStatusError("Your staff session is missing. Sign in again.");
      return;
    }

    if (!nextStatus) {
      setStatusError("Choose the new status.");
      return;
    }

    if (requiresNote && note.trim().length < 5) {
      setStatusError("Add a short note explaining how the issue was resolved.");
      return;
    }

    setStatusPending(true);
    try {
      await updateIncidentStatus(
        activeIncident.id,
        { status: nextStatus, note: note.trim() || undefined },
        staff,
      );
      setStatusMessage(`Status updated to ${STATUS_LABELS[nextStatus]}.`);
      setNextStatus("");
      setNote("");
    } catch (cause) {
      setStatusError(cause instanceof Error ? cause.message : "Could not update the status.");
    } finally {
      setStatusPending(false);
    }
  }

  async function handleApplyAI() {
    if (!activeIncident.ai || !staff) return;
    setAiError(null);
    setAiMessage(null);
    setAiPending("apply");

    try {
      await applyAISuggestion(activeIncident.id, activeIncident.ai, staff);
      setAiMessage("AI suggestion applied. The change is recorded in the incident history.");
    } catch (cause) {
      setAiError(cause instanceof Error ? cause.message : "Could not apply the suggestion.");
    } finally {
      setAiPending(null);
    }
  }

  async function handleDismissAI() {
    if (!staff) return;
    setAiError(null);
    setAiMessage(null);
    setAiPending("dismiss");

    try {
      await dismissAISuggestion(activeIncident.id, staff);
      setAiMessage("AI suggestion dismissed. The report keeps its current category and severity.");
    } catch (cause) {
      setAiError(cause instanceof Error ? cause.message : "Could not dismiss the suggestion.");
    } finally {
      setAiPending(null);
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(activeIncident.id);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  const timeline = [...incident.statusHistory].sort((a, b) => b.at.getTime() - a.at.getTime());

  return (
    <div className="space-y-6">
      <BackLink />

      <PageHeader
        eyebrow="Incident report"
        title={incident.title}
        description={`Submitted ${formatRelativeTime(incident.createdAt)} · ${formatDateTime(incident.createdAt)}`}
        actions={
          <>
            <LinkButton
              href={`/map?incident=${encodeURIComponent(incident.id)}`}
              variant="outline"
              size="sm"
            >
              Public map
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </LinkButton>
            <LinkButton href="/dashboard/incidents" variant="ghost" size="sm">
              All incidents
            </LinkButton>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <SeverityBadge severity={incident.severity} />
        <StatusBadge status={incident.status} />
        <Badge variant="neutral">{CATEGORY_LABELS[incident.category]}</Badge>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1 rounded-full border border-ink-200 bg-white px-2.5 py-1 font-mono text-[11px] text-ink-500 hover:text-ink-800"
          title="Copy incident reference"
        >
          {copied ? (
            <Check className="h-3 w-3 text-success-500" aria-hidden="true" />
          ) : (
            <Copy className="h-3 w-3" aria-hidden="true" />
          )}
          {incident.id.slice(0, 12)}
          <span className="sr-only">{copied ? "Copied" : "Copy reference"}</span>
        </button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="font-semibold text-teal-900">Report details</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-ink-700">
              {incident.description}
            </p>

            <dl className="mt-6 grid gap-4 border-t border-ink-100 pt-5 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-ink-400">
                  Location
                </dt>
                <dd className="mt-1 text-sm text-ink-800">
                  <span className="flex items-start gap-1.5">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
                    <span>
                      {incident.location.address || incident.location.division || "Kampala"}
                      {incident.location.address && incident.location.division ? (
                        <span className="block text-xs text-ink-500">{incident.location.division}</span>
                      ) : null}
                    </span>
                  </span>
                  <span className="mt-1 block font-mono text-xs text-ink-500">
                    {formatCoordinates(incident.location.lat, incident.location.lng)}
                  </span>
                  {mapsUrl || directionsUrl ? (
                    <span className="mt-2 flex flex-wrap gap-3 text-xs font-medium">
                      {mapsUrl ? (
                        <a
                          href={mapsUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-brand-700 hover:text-brand-800"
                        >
                          Google Maps
                          <ExternalLink className="h-3 w-3" aria-hidden="true" />
                        </a>
                      ) : null}
                      {directionsUrl ? (
                        <a
                          href={directionsUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-brand-700 hover:text-brand-800"
                        >
                          Directions
                          <Navigation className="h-3 w-3" aria-hidden="true" />
                        </a>
                      ) : null}
                    </span>
                  ) : null}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-ink-400">
                  Reported by
                </dt>
                <dd className="mt-1 space-y-1 text-sm text-ink-800">
                  <span className="flex items-center gap-1.5">
                    <User className="h-4 w-4 text-ink-400" aria-hidden="true" />
                    {incident.reporter.name || "Anonymous reporter"}
                  </span>
                  {incident.reporter.phone ? (
                    <a
                      href={`tel:${incident.reporter.phone}`}
                      className="flex items-center gap-1.5 text-brand-700 hover:text-brand-800"
                    >
                      <Phone className="h-4 w-4" aria-hidden="true" />
                      {incident.reporter.phone}
                    </a>
                  ) : null}
                  {incident.reporter.email ? (
                    <a
                      href={`mailto:${incident.reporter.email}`}
                      className="flex items-center gap-1.5 text-brand-700 hover:text-brand-800"
                    >
                      <Mail className="h-4 w-4" aria-hidden="true" />
                      {incident.reporter.email}
                    </a>
                  ) : null}
                </dd>
              </div>
            </dl>

            {incident.photoUrls.length > 0 ? (
              <div className="mt-6 border-t border-ink-100 pt-5">
                <h3 className="text-sm font-semibold text-ink-800">Photos</h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {incident.photoUrls.map((url, index) => (
                    <a
                      key={url}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-ink-100 bg-ink-50"
                    >
                      <Image
                        src={url}
                        alt={`Incident photo ${index + 1}`}
                        fill
                        sizes="(min-width: 640px) 50vw, 100vw"
                        className="object-cover transition-transform duration-200 group-hover:scale-105"
                      />
                    </a>
                  ))}
                </div>
              </div>
            ) : null}
          </Card>

          <Card className="p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold text-teal-900">AI classification</h2>
                <p className="mt-0.5 text-xs text-ink-400">
                  Advisory only. A staff member must review any change.
                </p>
              </div>
              {incident.ai ? (
                <Badge variant={incident.ai.source === "gemini" ? "info" : "neutral"}>
                  {incident.ai.source === "gemini" ? "Gemini" : "Rule-based fallback"}
                </Badge>
              ) : null}
            </div>

            {!incident.ai ? (
              <p className="mt-4 rounded-xl bg-ink-50 px-4 py-3 text-sm text-ink-500">
                No AI suggestion was stored with this report. Staff can still
                classify it manually.
              </p>
            ) : (
              <div className="mt-4 space-y-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl bg-ink-50 p-3">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-ink-400">
                      Category
                    </p>
                    <p className="mt-1 text-sm font-medium text-ink-800">
                      {CATEGORY_LABELS[incident.ai.category]}
                    </p>
                  </div>
                  <div className="rounded-xl bg-ink-50 p-3">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-ink-400">
                      Severity
                    </p>
                    <p className="mt-1 text-sm font-medium text-ink-800">
                      {SEVERITY_LABELS[incident.ai.severity]}
                    </p>
                  </div>
                  <div className="rounded-xl bg-ink-50 p-3">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-ink-400">
                      Urgency
                    </p>
                    <p className="mt-1 text-sm font-medium text-ink-800">
                      {URGENCY_LABELS[incident.ai.urgency]}
                    </p>
                  </div>
                </div>

                <p className="text-sm leading-6 text-ink-700">{incident.ai.summary}</p>

                <div className="flex flex-wrap items-center gap-3 text-xs text-ink-500">
                  <span className="inline-flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5 text-brand-600" aria-hidden="true" />
                    {formatPercent(incident.ai.confidence)} confidence
                  </span>
                  {incident.ai.reviewed ? (
                    <span className="inline-flex items-center gap-1 text-success-500">
                      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                      Reviewed
                      {incident.ai.reviewedAt
                        ? ` ${formatRelativeTime(incident.ai.reviewedAt)}`
                        : ""}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-warning-600">
                      <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                      Awaiting staff review
                    </span>
                  )}
                </div>

                {aiError ? <Alert variant="error">{aiError}</Alert> : null}
                {aiMessage ? <Alert variant="success">{aiMessage}</Alert> : null}

                {!incident.ai.reviewed ? (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleApplyAI}
                      disabled={aiPending !== null || !staff}
                    >
                      {aiPending === "apply" ? (
                        <>
                          <Spinner className="h-4 w-4" />
                          Applying…
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4" aria-hidden="true" />
                          Apply suggestion
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleDismissAI}
                      disabled={aiPending !== null || !staff}
                    >
                      {aiPending === "dismiss" ? (
                        <>
                          <Spinner className="h-4 w-4" />
                          Dismissing…
                        </>
                      ) : (
                        <>
                          <X className="h-4 w-4" aria-hidden="true" />
                          Dismiss
                        </>
                      )}
                    </Button>
                  </div>
                ) : null}
              </div>
            )}
          </Card>

          <Card className="p-6">
            <h2 className="font-semibold text-teal-900">Status history</h2>
            <p className="mt-0.5 text-xs text-ink-400">
              Every change is attributed and timestamped.
            </p>
            <ol className="mt-5 space-y-5">
              {timeline.map((change, index) => (
                <li key={`${change.at.toISOString()}-${index}`} className="relative flex gap-3">
                  <span className="relative flex flex-col items-center">
                    <span
                      className={cn(
                        "mt-0.5 flex h-7 w-7 items-center justify-center rounded-full",
                        index === 0
                          ? "bg-brand-600 text-white"
                          : "bg-ink-100 text-ink-500",
                      )}
                    >
                      <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                    {index < timeline.length - 1 ? (
                      <span className="mt-1 h-full w-px flex-1 bg-ink-100" />
                    ) : null}
                  </span>
                  <div className="min-w-0 flex-1 pb-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={change.status} />
                      <span className="text-xs text-ink-400">
                        {formatDateTime(change.at)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-ink-500">
                      {change.byName}
                      {change.by ? (
                        <span className="font-mono text-ink-300"> · {change.by.slice(0, 10)}</span>
                      ) : null}
                    </p>
                    {change.note ? (
                      <p className="mt-1.5 text-sm leading-6 text-ink-700">{change.note}</p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-5">
            <h2 className="font-semibold text-teal-900">Update status</h2>
            <p className="mt-0.5 text-xs text-ink-400">
              Move this incident to in progress, then mark it resolved. Resolved
              reports can be reopened if the hazard returns.
            </p>

            <div className="mt-4 space-y-4">
              {statusError ? <Alert variant="error">{statusError}</Alert> : null}
              {statusMessage ? <Alert variant="success">{statusMessage}</Alert> : null}

              <Field label="New status" htmlFor="incident-status" required>
                <Select
                  id="incident-status"
                  value={nextStatus}
                  onChange={(event) =>
                    setNextStatus(event.target.value as IncidentStatus | "")
                  }
                >
                  <option value="">Choose a status…</option>
                  {availableStatuses.map((status) => (
                    <option key={status} value={status}>
                      {STATUS_LABELS[status]}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field
                label="Action note"
                htmlFor="incident-note"
                hint={
                  requiresNote
                    ? "Required when resolving. Describe the action taken."
                    : "Optional context for the audit trail."
                }
              >
                <Textarea
                  id="incident-note"
                  value={note}
                  onChange={(event) => setNote(event.target.value.slice(0, 500))}
                  rows={4}
                  placeholder="e.g. Crew cleared the culvert and restored flow."
                  aria-invalid={Boolean(statusError && requiresNote && note.trim().length < 5)}
                />
              </Field>

              <div className="flex items-center justify-between text-xs text-ink-400">
                <span className="inline-flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                  Recorded as {staffName}
                </span>
                <span>{note.length}/500</span>
              </div>

              <Button
                type="button"
                className="w-full"
                onClick={handleStatusUpdate}
                disabled={statusPending || !nextStatus || !staff}
              >
                {statusPending ? (
                  <>
                    <Spinner className="h-4 w-4" />
                    Updating…
                  </>
                ) : (
                  "Update status"
                )}
              </Button>
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="font-semibold text-teal-900">Metadata</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-ink-500">Reference</dt>
                <dd className="font-mono text-xs text-ink-800">{incident.id}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-500">Created</dt>
                <dd className="text-right text-xs text-ink-800">
                  {formatDateTime(incident.createdAt)}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-500">Updated</dt>
                <dd className="text-right text-xs text-ink-800">
                  {formatDateTime(incident.updatedAt)}
                </dd>
              </div>
              {incident.resolvedAt ? (
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-500">Resolved</dt>
                  <dd className="text-right text-xs text-ink-800">
                    {formatDateTime(incident.resolvedAt)}
                  </dd>
                </div>
              ) : null}
              <div className="flex justify-between gap-3">
                <dt className="text-ink-500">Reporter account</dt>
                <dd className="text-right text-xs text-ink-800">
                  {incident.reportedBy ? "Signed-in user" : "Anonymous"}
                </dd>
              </div>
            </dl>
          </Card>

          <Alert variant="info" title="Public visibility">
            The public map only shows category, severity, status, location, and
            the first photo. Reporter contact details and the full description
            stay private to staff.
          </Alert>
        </div>
      </div>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/dashboard/incidents"
      className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 transition-colors hover:text-teal-900"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      Back to incidents
    </Link>
  );
}
