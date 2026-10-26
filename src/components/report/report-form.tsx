"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Crosshair,
  FileWarning,
  MapPin,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { PhotoUploader, type PhotoItem } from "./photo-uploader";
import { LocationPicker } from "@/components/map/location-picker";
import { Card } from "@/components/ui/card";
import { Alert, Spinner } from "@/components/ui/feedback";
import { Badge } from "@/components/ui/badge";
import { Button, LinkButton } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { SeverityBadge } from "@/components/ui/status-badges";
import { useAuth } from "@/components/auth/auth-provider";
import { classifyFallback } from "@/lib/classifier";
import {
  createIncident,
  newIncidentId,
  requestClassification,
  uploadIncidentPhoto,
} from "@/lib/incidents";
import { compressPhoto } from "@/lib/images";
import { isFirebaseConfigured } from "@/lib/firebase";
import {
  CATEGORY_LABELS,
  INCIDENT_CATEGORIES,
  KAMPALA_DIVISIONS,
  SEVERITIES,
  SEVERITY_LABELS,
  URGENCY_LABELS,
  type AIClassification,
} from "@/lib/types";
import {
  DESCRIPTION_MAX,
  DESCRIPTION_MIN,
  MAX_PHOTOS,
  photoError,
  validateDraft,
  type ReportDraft,
  type ReportErrors,
} from "@/lib/validation";
import { formatCoordinates } from "@/lib/format";
import { cn } from "@/lib/utils";

type Step = 1 | 2 | 3;

const STEPS = [
  { number: 1, label: "Details" },
  { number: 2, label: "Location" },
  { number: 3, label: "Review" },
] as const;

const LAST_REPORT_KEY = "drainwatch:last-report";
const SUBMISSION_COOLDOWN_MS = 60_000;

function makeEmptyDraft(): ReportDraft {
  return {
    category: "",
    severity: "",
    title: "",
    description: "",
    location: {
      lat: null,
      lng: null,
      address: "",
      division: "",
    },
    reporter: {
      name: "",
      phone: "",
      email: "",
    },
  };
}

function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function ReportForm() {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>(1);
  const [draft, setDraft] = useState<ReportDraft>(makeEmptyDraft);
  const [errors, setErrors] = useState<ReportErrors>({});
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [photoMessage, setPhotoMessage] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [consentError, setConsentError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationMessage, setLocationMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);

  const [ai, setAi] = useState<AIClassification | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiNotice, setAiNotice] = useState<string | null>(null);

  const photosRef = useRef(photos);
  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);

  useEffect(
    () => () => {
      photosRef.current.forEach((photo) => URL.revokeObjectURL(photo.previewUrl));
    },
    [],
  );

  const aiKeyRef = useRef<string | null>(null);

  async function runClassification(force = false) {
    const key = `${draft.description}|${draft.category}|${draft.severity}`;
    if (!force && ai && aiKeyRef.current === key) return;

    aiKeyRef.current = key;
    setAiLoading(true);
    setAiNotice(null);

    try {
      const result = await requestClassification({
        description: draft.description,
        category: draft.category || undefined,
        severity: draft.severity || undefined,
      });
      setAi(result);
    } catch {
      setAi(
        classifyFallback({
          description: draft.description,
          category: draft.category || undefined,
          severity: draft.severity || undefined,
        }),
      );
      setAiNotice("Gemini is unavailable, so a rule-based suggestion is shown instead.");
    } finally {
      setAiLoading(false);
    }
  }

  function updateDraft<K extends keyof ReportDraft>(key: K, value: ReportDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function updateLocation(patch: Partial<ReportDraft["location"]>) {
    setDraft((current) => ({
      ...current,
      location: { ...current.location, ...patch },
    }));
  }

  function errorsForStep(target: Step): ReportErrors {
    const all = validateDraft(draft);
    const result: ReportErrors = {};

    if (target >= 1) {
      if (all.category) result.category = all.category;
      if (all.severity) result.severity = all.severity;
      if (all.title) result.title = all.title;
      if (all.description) result.description = all.description;
      if (all.reporter) result.reporter = all.reporter;
    }

    if (target >= 2 && all.location) {
      result.location = all.location;
    }

    return result;
  }

  function goNext() {
    const stepErrors = errorsForStep(step);
    setErrors(stepErrors);
    if (Object.keys(stepErrors).length > 0) return;

    if (step === 2) {
      setStep(3);
      void runClassification();
      return;
    }

    setStep((current) => (current < 3 ? ((current + 1) as Step) : current));
  }

  function goBack() {
    setErrors({});
    setStep((current) => (current > 1 ? ((current - 1) as Step) : current));
  }

  function addPhotos(files: FileList | File[]) {
    const incoming = Array.from(files);
    const next = [...photos];
    const photoLimit = user ? MAX_PHOTOS : 1;
    let message: string | null = null;

    for (const file of incoming) {
      if (next.length >= photoLimit) {
        message = user
          ? `You can attach up to ${MAX_PHOTOS} photos.`
          : "Anonymous reports include one cover photo. Sign in to attach more.";
        break;
      }

      const error = photoError(file);
      if (error) {
        message = `${file.name}: ${error}`;
        continue;
      }

      next.push({
        id: makeId(),
        file,
        previewUrl: URL.createObjectURL(file),
      });
    }

    setPhotos(next);
    setPhotoMessage(message);
  }

  function removePhoto(id: string) {
    setPhotos((current) => {
      const target = current.find((photo) => photo.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return current.filter((photo) => photo.id !== id);
    });
    setPhotoMessage(null);
  }

  function useMyLocation() {
    if (!("geolocation" in navigator)) {
      setLocationMessage("This browser does not support geolocation. Drop a pin instead.");
      return;
    }

    setLocating(true);
    setLocationMessage(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        updateLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationMessage(
          `Location captured to about ${Math.round(position.coords.accuracy)} m. Adjust the pin if needed.`,
        );
        setLocating(false);
      },
      (cause) => {
        setLocationMessage(
          cause.code === cause.PERMISSION_DENIED
            ? "Location permission was denied. Drop a pin on the map instead."
            : "Could not get your location. Drop a pin on the map instead.",
        );
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 0 },
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (step < 3) {
      goNext();
      return;
    }

    setSubmitError(null);
    setConsentError(null);

    const allErrors = validateDraft(draft);
    setErrors(allErrors);
    if (Object.keys(allErrors).length > 0) {
      setSubmitError("Some details still need attention. Go back and complete the highlighted fields.");
      return;
    }

    if (!consent) {
      setConsentError("Confirm that the report is accurate and may be shown publicly.");
      return;
    }

    if (!isFirebaseConfigured) {
      setSubmitError("Reporting is not connected to Firebase in this deployment.");
      return;
    }

    try {
      const previous = Number(localStorage.getItem(LAST_REPORT_KEY) ?? 0);
      if (previous && Date.now() - previous < SUBMISSION_COOLDOWN_MS) {
        setSubmitError("A report was just submitted from this browser. Wait a minute before sending another.");
        return;
      }
    } catch {
      // Storage can be unavailable in private mode; continue without the cooldown.
    }

    setSubmitting(true);

    try {
      const incidentId = newIncidentId();
      const photoUrls: string[] = [];

      for (const [index, photo] of photos.entries()) {
        setUploadStatus(
          `Uploading photo ${index + 1} of ${photos.length}…`,
        );
        const compressed = await compressPhoto(photo.file);
        const url = await uploadIncidentPhoto(
          incidentId,
          compressed,
          index,
          Boolean(user),
        );
        photoUrls.push(url);
      }

      setUploadStatus("Saving your report…");
      await createIncident({
        incidentId,
        draft,
        ai: ai ?? undefined,
        photoUrls,
        reporterUid: user?.uid,
      });

      try {
        localStorage.setItem(LAST_REPORT_KEY, String(Date.now()));
      } catch {
        // Ignore storage failures.
      }

      setSuccessId(incidentId);
      setStep(1);
    } catch (cause) {
      setSubmitError(
        cause instanceof Error
          ? cause.message
          : "The report could not be submitted. Check your connection and try again.",
      );
    } finally {
      setSubmitting(false);
      setUploadStatus(null);
    }
  }

  function resetForm() {
    photosRef.current.forEach((photo) => URL.revokeObjectURL(photo.previewUrl));
    setPhotos([]);
    setPhotoMessage(null);
    setDraft(makeEmptyDraft());
    setErrors({});
    setConsent(false);
    setConsentError(null);
    setSubmitError(null);
    setSuccessId(null);
    setStep(1);
    setAi(null);
    setAiNotice(null);
    setLocationMessage(null);
  }

  if (successId) {
    return <SuccessPanel incidentId={successId} onReset={resetForm} />;
  }


  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <div className="mx-auto max-w-2xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700">
          <FileWarning className="h-3.5 w-3.5" aria-hidden="true" />
          Public incident report
        </span>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-teal-900 sm:text-4xl">
          Report a drainage hazard
        </h1>
        <p className="mt-3 text-ink-500">
          Three quick steps. Your contact details stay private to staff; the
          location, category, severity, status, and first photo may appear on the
          public hotspot map.
        </p>
      </div>

      <div className="mt-8">
        <StepIndicator step={step} />
      </div>

      {!isFirebaseConfigured ? (
        <div className="mx-auto mt-6 max-w-3xl">
          <Alert variant="warning" title="Reporting is not connected">
            Firebase environment variables are missing, so submissions cannot be
            saved. The form stays available so the flow can be reviewed.
          </Alert>
        </div>
      ) : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <form onSubmit={handleSubmit} noValidate>
          <Card className="p-5 sm:p-7">
            {step === 1 ? (
              <DetailsStep
                draft={draft}
                errors={errors}
                photoMessage={photoMessage}
                photos={photos}
                photoLimit={user ? MAX_PHOTOS : 1}
                disabled={submitting}
                onDraftChange={updateDraft}
                onAddPhotos={addPhotos}
                onRemovePhoto={removePhoto}
              />
            ) : null}

            {step === 2 ? (
              <LocationStep
                draft={draft}
                errors={errors}
                locating={locating}
                locationMessage={locationMessage}
                onLocationChange={updateLocation}
                onUseMyLocation={useMyLocation}
              />
            ) : null}

            {step === 3 ? (
              <ReviewStep
                draft={draft}
                photos={photos}
                ai={ai}
                aiLoading={aiLoading}
                aiNotice={aiNotice}
                consent={consent}
                consentError={consentError}
                submitting={submitting}
                uploadStatus={uploadStatus}
                submitError={submitError}
                onConsentChange={setConsent}
                onApplyAI={() => {
                  if (!ai) return;
                  setDraft((current) => ({
                    ...current,
                    category: ai.category,
                    severity: ai.severity,
                  }));
                }}
                onReclassify={() => {
                  setAi(null);
                  void runClassification(true);
                }}
                onEditStep={(target) => setStep(target)}
              />
            ) : null}

            <div className="mt-8 flex flex-col-reverse gap-3 border-t border-ink-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                {step > 1 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={goBack}
                    disabled={submitting}
                  >
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                    Back
                  </Button>
                ) : (
                  <Link
                    href="/"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-teal-900"
                  >
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                    Cancel
                  </Link>
                )}
              </div>

              {step < 3 ? (
                <Button type="submit" disabled={submitting}>
                  Continue
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={submitting || !isFirebaseConfigured}
                >
                  {submitting ? (
                    <>
                      <Spinner className="h-4 w-4" />
                      {uploadStatus || "Submitting…"}
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" aria-hidden="true" />
                      Submit report
                    </>
                  )}
                </Button>
              )}
            </div>
          </Card>
        </form>

        <aside className="space-y-4">
          <Card className="p-5">
            <h2 className="flex items-center gap-2 font-semibold text-teal-900">
              <ShieldCheck className="h-4 w-4 text-brand-600" aria-hidden="true" />
              What happens next
            </h2>
            <ol className="mt-3 space-y-3 text-sm text-ink-600">
              <li className="flex gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[10px] font-semibold text-brand-700">1</span>
                The report is saved privately for staff review.
              </li>
              <li className="flex gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[10px] font-semibold text-brand-700">2</span>
                An AI suggestion is attached, but a person decides whether to use it.
              </li>
              <li className="flex gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[10px] font-semibold text-brand-700">3</span>
                Staff triage the incident and update its status.
              </li>
            </ol>
          </Card>

          <Card className="border-warning-500/20 bg-warning-50/40 p-5">
            <h2 className="flex items-center gap-2 font-semibold text-warning-600">
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              Stay safe
            </h2>
            <p className="mt-2 text-sm leading-6 text-ink-600">
              Do not enter floodwater, open manholes, or damaged drains. Report
              from a safe distance. For an immediate emergency, contact local
              emergency services first.
            </p>
          </Card>

          {user ? (
            <Card className="p-5">
              <p className="text-xs text-ink-400">Signed in as</p>
              <p className="mt-1 truncate text-sm font-medium text-ink-800">
                {user.email}
              </p>
              <p className="mt-2 text-xs leading-5 text-ink-500">
                This report will be linked to your staff account.
              </p>
            </Card>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

function StepIndicator({ step }: { step: Step }) {
  return (
    <ol className="mx-auto flex max-w-2xl items-center gap-2" aria-label="Report steps">
      {STEPS.map((item, index) => {
        const complete = step > item.number;
        const active = step === item.number;

        return (
          <li key={item.number} className="flex flex-1 items-center gap-2">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold",
                  complete && "bg-brand-600 text-white",
                  active && "bg-teal-900 text-white",
                  !complete && !active && "bg-ink-100 text-ink-400",
                )}
                aria-current={active ? "step" : undefined}
              >
                {complete ? (
                  <Check className="h-4 w-4" aria-hidden="true" />
                ) : (
                  item.number
                )}
              </span>
              <span
                className={cn(
                  "text-xs font-medium sm:text-sm",
                  active ? "text-teal-900" : "text-ink-400",
                )}
              >
                {item.label}
              </span>
            </div>
            {index < STEPS.length - 1 ? (
              <span
                className={cn(
                  "h-px flex-1",
                  complete ? "bg-brand-500" : "bg-ink-200",
                )}
                aria-hidden="true"
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

function DetailsStep({
  draft,
  errors,
  photos,
  photoMessage,
  photoLimit,
  disabled,
  onDraftChange,
  onAddPhotos,
  onRemovePhoto,
}: {
  draft: ReportDraft;
  errors: ReportErrors;
  photos: PhotoItem[];
  photoMessage: string | null;
  photoLimit: number;
  disabled: boolean;
  onDraftChange: <K extends keyof ReportDraft>(key: K, value: ReportDraft[K]) => void;
  onAddPhotos: (files: FileList | File[]) => void;
  onRemovePhoto: (id: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-teal-900">What have you found?</h2>
        <p className="mt-0.5 text-sm text-ink-500">
          Pick the closest category and give us enough detail to act on it.
        </p>
      </div>

      <fieldset>
        <legend className="text-sm font-medium text-ink-800">
          Hazard type <span className="text-critical-500">*</span>
        </legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {INCIDENT_CATEGORIES.map((category) => {
            const selected = draft.category === category.value;
            return (
              <label
                key={category.value}
                className={cn(
                  "flex cursor-pointer items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-sm transition-colors",
                  selected
                    ? "border-brand-500 bg-brand-50 text-brand-800"
                    : "border-ink-200 bg-white text-ink-700 hover:bg-ink-50",
                )}
              >
                <input
                  type="radio"
                  name="category"
                  value={category.value}
                  checked={selected}
                  onChange={() => onDraftChange("category", category.value)}
                  className="h-4 w-4 border-ink-300 text-brand-600 focus:ring-brand-500"
                  disabled={disabled}
                />
                {category.label}
              </label>
            );
          })}
        </div>
        {errors.category ? (
          <p role="alert" className="mt-2 text-xs font-medium text-critical-600">
            {errors.category}
          </p>
        ) : null}
      </fieldset>

      <fieldset>
        <legend className="text-sm font-medium text-ink-800">
          How severe is it? <span className="text-critical-500">*</span>
        </legend>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {SEVERITIES.map((severity) => {
            const selected = draft.severity === severity;
            const dot = {
              low: "bg-success-500",
              medium: "bg-info-500",
              high: "bg-warning-500",
              critical: "bg-critical-500",
            }[severity];

            return (
              <label
                key={severity}
                className={cn(
                  "flex cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition-colors",
                  selected
                    ? "border-brand-500 bg-brand-50 text-brand-800"
                    : "border-ink-200 bg-white text-ink-700 hover:bg-ink-50",
                )}
              >
                <input
                  type="radio"
                  name="severity"
                  value={severity}
                  checked={selected}
                  onChange={() => onDraftChange("severity", severity)}
                  className="sr-only"
                  disabled={disabled}
                />
                <span className={`h-2 w-2 rounded-full ${dot}`} aria-hidden="true" />
                {SEVERITY_LABELS[severity]}
              </label>
            );
          })}
        </div>
        {errors.severity ? (
          <p role="alert" className="mt-2 text-xs font-medium text-critical-600">
            {errors.severity}
          </p>
        ) : null}
      </fieldset>

      <Field
        label="Short title"
        htmlFor="report-title"
        hint="Optional. We will generate one from the category and location if left blank."
        error={errors.title}
      >
        <Input
          id="report-title"
          value={draft.title}
          onChange={(event) => onDraftChange("title", event.target.value.slice(0, 120))}
          placeholder="e.g. Blocked culvert flooding Nakawa market road"
          disabled={disabled}
          aria-invalid={Boolean(errors.title)}
          aria-describedby={errors.title ? "report-title-error" : "report-title-hint"}
        />
      </Field>

      <Field
        label="What is happening?"
        htmlFor="report-description"
        hint={`At least ${DESCRIPTION_MIN} characters. Mention landmarks, water flow, and any immediate danger.`}
        error={errors.description}
        required
      >
        <Textarea
          id="report-description"
          value={draft.description}
          onChange={(event) =>
            onDraftChange("description", event.target.value.slice(0, DESCRIPTION_MAX))
          }
          placeholder="Describe the hazard, how long it has been there, and what it is affecting."
          rows={6}
          disabled={disabled}
          aria-invalid={Boolean(errors.description)}
          aria-describedby={
            errors.description ? "report-description-error" : "report-description-hint"
          }
        />
        <div className="mt-1 flex justify-end text-xs text-ink-400">
          {draft.description.length}/{DESCRIPTION_MAX}
        </div>
      </Field>

      <div>
        <h2 className="text-sm font-semibold text-ink-800">Photos (optional)</h2>
        <p className="mt-0.5 text-xs text-ink-500">
          A clear photo helps staff verify the hazard faster.
        </p>
        <div className="mt-3">
          <PhotoUploader
            photos={photos}
            onAddFiles={onAddPhotos}
            onRemove={onRemovePhoto}
            error={photoMessage ?? undefined}
            disabled={disabled}
            maxPhotos={photoLimit}
          />
        </div>
      </div>

      <fieldset className="rounded-2xl border border-ink-100 bg-ink-50/50 p-4">
        <legend className="px-1 text-sm font-semibold text-ink-800">
          Your details (optional)
        </legend>
        <p className="text-xs leading-5 text-ink-500">
          Only staff can see this. It is never shown on the public map. Leave it
          blank to report anonymously.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <Field label="Name" htmlFor="reporter-name">
            <Input
              id="reporter-name"
              value={draft.reporter.name ?? ""}
              onChange={(event) =>
                onDraftChange("reporter", { ...draft.reporter, name: event.target.value.slice(0, 80) })
              }
              autoComplete="name"
              disabled={disabled}
            />
          </Field>
          <Field label="Phone" htmlFor="reporter-phone">
            <Input
              id="reporter-phone"
              type="tel"
              value={draft.reporter.phone ?? ""}
              onChange={(event) =>
                onDraftChange("reporter", { ...draft.reporter, phone: event.target.value.slice(0, 30) })
              }
              autoComplete="tel"
              placeholder="+256…"
              disabled={disabled}
            />
          </Field>
          <Field label="Email" htmlFor="reporter-email" error={errors.reporter}>
            <Input
              id="reporter-email"
              type="email"
              value={draft.reporter.email ?? ""}
              onChange={(event) =>
                onDraftChange("reporter", { ...draft.reporter, email: event.target.value.slice(0, 120) })
              }
              autoComplete="email"
              disabled={disabled}
              aria-invalid={Boolean(errors.reporter)}
              aria-describedby={errors.reporter ? "reporter-email-error" : undefined}
            />
          </Field>
        </div>
      </fieldset>
    </div>
  );
}

function LocationStep({
  draft,
  errors,
  locating,
  locationMessage,
  onLocationChange,
  onUseMyLocation,
}: {
  draft: ReportDraft;
  errors: ReportErrors;
  locating: boolean;
  locationMessage: string | null;
  onLocationChange: (patch: Partial<ReportDraft["location"]>) => void;
  onUseMyLocation: () => void;
}) {
  const point =
    draft.location.lat !== null && draft.location.lng !== null
      ? { lat: draft.location.lat, lng: draft.location.lng }
      : null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-teal-900">Where is it?</h2>
        <p className="mt-0.5 text-sm text-ink-500">
          Drop a pin on the map, use your current location, or enter the
          coordinates and a landmark.
        </p>
      </div>

      <LocationPicker
        value={point}
        onChange={(next) => onLocationChange({ lat: next.lat, lng: next.lng })}
        className="h-80"
      />

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onUseMyLocation}
          disabled={locating}
        >
          {locating ? (
            <>
              <Spinner className="h-4 w-4" />
              Locating…
            </>
          ) : (
            <>
              <Crosshair className="h-4 w-4" aria-hidden="true" />
              Use my location
            </>
          )}
        </Button>
        {point ? (
          <Badge variant="success">
            <MapPin className="h-3 w-3" aria-hidden="true" />
            {formatCoordinates(point.lat, point.lng)}
          </Badge>
        ) : (
          <Badge variant="warning">No pin placed yet</Badge>
        )}
      </div>

      {locationMessage ? (
        <p className="text-xs text-ink-500" role="status">
          {locationMessage}
        </p>
      ) : null}

      {errors.location ? (
        <Alert variant="warning" title="Location needed">
          {errors.location}
        </Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Latitude" htmlFor="report-lat">
          <Input
            id="report-lat"
            type="number"
            step="any"
            inputMode="decimal"
            value={draft.location.lat ?? ""}
            onChange={(event) => {
              const value = event.target.value === "" ? null : Number(event.target.value);
              onLocationChange({ lat: value !== null && Number.isFinite(value) ? value : null });
            }}
            placeholder="0.3476"
          />
        </Field>
        <Field label="Longitude" htmlFor="report-lng">
          <Input
            id="report-lng"
            type="number"
            step="any"
            inputMode="decimal"
            value={draft.location.lng ?? ""}
            onChange={(event) => {
              const value = event.target.value === "" ? null : Number(event.target.value);
              onLocationChange({ lng: value !== null && Number.isFinite(value) ? value : null });
            }}
            placeholder="32.5825"
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Division"
          htmlFor="report-division"
          hint="Not sure? Choose the closest one."
        >
          <Select
            id="report-division"
            value={draft.location.division ?? ""}
            onChange={(event) => onLocationChange({ division: event.target.value })}
          >
            <option value="">Not sure</option>
            {KAMPALA_DIVISIONS.map((division) => (
              <option key={division} value={division}>
                {division}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          label="Nearest landmark or address"
          htmlFor="report-address"
          hint="Optional but very helpful."
        >
          <Input
            id="report-address"
            value={draft.location.address ?? ""}
            onChange={(event) => onLocationChange({ address: event.target.value.slice(0, 200) })}
            placeholder="e.g. Near Nakawa Market, opposite the taxi stage"
          />
        </Field>
      </div>

      <Alert variant="info">
        Only reports inside the Kampala service area can be submitted. If the pin
        is slightly off, drag it rather than leaving it outside the city.
      </Alert>
    </div>
  );
}

function ReviewStep({
  draft,
  photos,
  ai,
  aiLoading,
  aiNotice,
  consent,
  consentError,
  submitting,
  uploadStatus,
  submitError,
  onConsentChange,
  onApplyAI,
  onReclassify,
  onEditStep,
}: {
  draft: ReportDraft;
  photos: PhotoItem[];
  ai: AIClassification | null;
  aiLoading: boolean;
  aiNotice: string | null;
  consent: boolean;
  consentError: string | null;
  submitting: boolean;
  uploadStatus: string | null;
  submitError: string | null;
  onConsentChange: (value: boolean) => void;
  onApplyAI: () => void;
  onReclassify: () => void;
  onEditStep: (step: Step) => void;
}) {
  const aiMatches =
    ai !== null && ai.category === draft.category && ai.severity === draft.severity;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-teal-900">Review and submit</h2>
        <p className="mt-0.5 text-sm text-ink-500">
          Check the details before sending. You can go back to edit any step.
        </p>
      </div>

      <div className="rounded-2xl border border-ink-100">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-100 px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            {draft.severity ? <SeverityBadge severity={draft.severity} /> : null}
            <Badge variant="neutral">
              {draft.category ? CATEGORY_LABELS[draft.category] : "Category missing"}
            </Badge>
          </div>
          <button
            type="button"
            onClick={() => onEditStep(1)}
            className="text-xs font-medium text-brand-700 hover:text-brand-800"
          >
            Edit details
          </button>
        </div>
        <div className="space-y-4 px-4 py-4">
          <div>
            <p className="text-sm font-medium text-ink-800">
              {draft.title.trim() || "Title will be generated automatically"}
            </p>
            <p className="mt-1 whitespace-pre-line text-sm leading-6 text-ink-600">
              {draft.description}
            </p>
          </div>

          <div className="flex flex-wrap items-start justify-between gap-2 border-t border-ink-100 pt-3">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-ink-400">
                Location
              </p>
              <p className="mt-0.5 text-sm text-ink-700">
                {draft.location.address || draft.location.division || "Kampala"}
              </p>
              <p className="mt-0.5 font-mono text-xs text-ink-500">
                {draft.location.lat !== null && draft.location.lng !== null
                  ? formatCoordinates(draft.location.lat, draft.location.lng)
                  : "No coordinates"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onEditStep(2)}
              className="text-xs font-medium text-brand-700 hover:text-brand-800"
            >
              Edit location
            </button>
          </div>

          <div className="grid gap-3 border-t border-ink-100 pt-3 sm:grid-cols-2">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-ink-400">
                Reporter
              </p>
              <p className="mt-0.5 text-sm text-ink-700">
                {draft.reporter.name?.trim() ? draft.reporter.name : "Anonymous reporter"}
              </p>
              {draft.reporter.phone ? (
                <p className="text-xs text-ink-500">{draft.reporter.phone}</p>
              ) : null}
              {draft.reporter.email ? (
                <p className="text-xs text-ink-500">{draft.reporter.email}</p>
              ) : null}
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-ink-400">
                Photos
              </p>
              <p className="mt-0.5 text-sm text-ink-700">
                {photos.length === 0
                  ? "No photos"
                  : `${photos.length} photo${photos.length === 1 ? "" : "s"} ready`}
              </p>
              <p className="text-xs text-ink-500">
                The first photo may appear publicly.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-brand-200 bg-brand-50/50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-teal-900">
            <Sparkles className="h-4 w-4 text-brand-600" aria-hidden="true" />
            AI suggestion
          </h3>
          {ai ? (
            <Badge variant={ai.source === "gemini" ? "info" : "neutral"}>
              {ai.source === "gemini" ? "Gemini" : "Rule-based fallback"}
            </Badge>
          ) : null}
        </div>

        {aiLoading ? (
          <p className="mt-3 flex items-center gap-2 text-sm text-ink-500">
            <Spinner className="h-4 w-4 text-brand-600" />
            Analysing the description…
          </p>
        ) : ai ? (
          <div className="mt-3 space-y-3">
            <div className="grid gap-2 sm:grid-cols-3">
              <MiniFact label="Category" value={CATEGORY_LABELS[ai.category]} />
              <MiniFact label="Severity" value={SEVERITY_LABELS[ai.severity]} />
              <MiniFact label="Urgency" value={URGENCY_LABELS[ai.urgency]} />
            </div>
            <p className="text-sm leading-6 text-ink-700">{ai.summary}</p>
            <p className="text-xs text-ink-500">
              {Math.round(ai.confidence * 100)}% confidence. This is advisory; staff
              will verify it. Submitting does not accept the suggestion
              automatically.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant={aiMatches ? "outline" : "primary"}
                onClick={onApplyAI}
                disabled={aiMatches || submitting}
              >
                {aiMatches ? (
                  <>
                    <Check className="h-4 w-4" aria-hidden="true" />
                    Matches your report
                  </>
                ) : (
                  "Use this suggestion"
                )}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={onReclassify}
                disabled={submitting}
              >
                Re-run
              </Button>
            </div>
          </div>
        ) : (
          <p className="mt-3 text-sm text-ink-500">
            No suggestion yet. Continue to submit without one, or re-run the
            classifier.
          </p>
        )}

        {aiNotice ? (
          <p className="mt-3 text-xs font-medium text-warning-600">{aiNotice}</p>
        ) : null}
      </div>

      {submitError ? (
        <Alert variant="error" title="Could not submit">
          {submitError}
        </Alert>
      ) : null}

      <label className="flex items-start gap-3 rounded-xl border border-ink-200 bg-white p-4 text-sm text-ink-700">
        <input
          type="checkbox"
          checked={consent}
          onChange={(event) => onConsentChange(event.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
          disabled={submitting}
          aria-invalid={Boolean(consentError)}
          aria-describedby={consentError ? "consent-error" : undefined}
        />
        <span>
          I confirm this report is accurate to the best of my knowledge. I
          understand that the category, severity, status, location, and first
          photo may be shown publicly, while my contact details remain private.
        </span>
      </label>
      {consentError ? (
        <p id="consent-error" role="alert" className="-mt-3 text-xs font-medium text-critical-600">
          {consentError}
        </p>
      ) : null}

      {uploadStatus ? (
        <p className="flex items-center gap-2 text-sm text-ink-500" role="status">
          <Spinner className="h-4 w-4 text-brand-600" />
          {uploadStatus}
        </p>
      ) : null}
    </div>
  );
}

function MiniFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white px-3 py-2">
      <p className="text-[10px] font-medium uppercase tracking-wide text-ink-400">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-ink-800">{value}</p>
    </div>
  );
}

function SuccessPanel({
  incidentId,
  onReset,
}: {
  incidentId: string;
  onReset: () => void;
}) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6 lg:py-24">
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success-50 text-success-500">
        <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
      </span>
      <h1 className="mt-6 text-3xl font-semibold tracking-tight text-teal-900">
        Report received
      </h1>
      <p className="mt-3 text-ink-500">
        Thank you. The report is saved for staff review and now appears in the
        operations dashboard.
      </p>

      <div className="mx-auto mt-6 inline-flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-ink-200 bg-white px-5 py-3 shadow-sm">
        <span className="text-xs font-medium uppercase tracking-wide text-ink-400">
          Reference
        </span>
        <code className="font-mono text-sm font-semibold text-ink-800">
          {incidentId}
        </code>
      </div>

      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <LinkButton href={`/map?incident=${encodeURIComponent(incidentId)}`}>
          View on map
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </LinkButton>
        <Button type="button" variant="outline" onClick={onReset}>
          Submit another report
        </Button>
        <LinkButton href="/" variant="ghost">
          Back to home
        </LinkButton>
      </div>

      <p className="mt-8 text-xs leading-5 text-ink-400">
        Keep the reference if you need to follow up. Staff may contact you only
        if you provided contact details.
      </p>
    </div>
  );
}
