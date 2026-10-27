"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  Crosshair,
  FileWarning,
  ImagePlus,
  MapPin,
  Mic,
  MessageCircle,
  Phone,
  ShieldCheck,
  Sparkles,
  Type,
} from "lucide-react";
import { PhotoUploader, type PhotoItem } from "./photo-uploader";
import { VoiceRecorder } from "./voice-recorder";
import { SupportRequestCard } from "./support-request-card";
import { LanguageGate } from "./language-gate";
import { LocationPicker } from "@/components/map/location-picker";
import { LocationSearch } from "./location-search";
import { Card } from "@/components/ui/card";
import { Alert, Spinner } from "@/components/ui/feedback";
import { Badge } from "@/components/ui/badge";
import { Button, LinkButton } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { SeverityBadge, SEVERITY_CARD_TONE } from "@/components/ui/status-badges";
import { SpeakingWaveform } from "@/components/ui/speaking-waveform";
import { AudioGuide } from "@/components/ui/audio-guide";
import { useAuth } from "@/components/auth/auth-provider";
import { useLanguage } from "@/components/layout/language-provider";
import type { Language } from "@/lib/i18n";
import { classifyFallback } from "@/lib/classifier";
import { createIncident, newIncidentId, requestClassification } from "@/lib/incidents";
import { compressPhoto } from "@/lib/images";
import { isFirebaseConfigured } from "@/lib/firebase";
import { KAMPALA_DIVISIONS, SEVERITY_LABELS, URGENCY_LABELS, type AIClassification } from "@/lib/types";
import {
  DESCRIPTION_MAX,
  DESCRIPTION_MIN,
  MAX_PHOTOS,
  photoError,
  validateCoordinates,
  validateDraft,
  type ImageMimeType,
  type ReportDraft,
  type ReportErrors,
} from "@/lib/validation";
import { formatCoordinates } from "@/lib/format";
import { cn } from "@/lib/utils";

type Stage = "welcome" | "capture" | "answer" | "location" | "confirm";

const STAGE_ORDER: Stage[] = ["welcome", "capture", "answer", "location", "confirm"];

const STAGE_BACK: Record<Stage, Stage | null> = {
  welcome: null,
  capture: "welcome",
  answer: "capture",
  location: "answer",
  confirm: "location",
};

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

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Could not read the photo."));
        return;
      }
      const commaIndex = result.indexOf(",");
      resolve(commaIndex >= 0 ? result.slice(commaIndex + 1) : result);
    };
    reader.onerror = () => reject(new Error("Could not read the photo."));
    reader.readAsDataURL(file);
  });
}

export function ReportForm() {
  const { user } = useAuth();
  const { t, language, languageChosen } = useLanguage();
  const searchParams = useSearchParams();
  const [stage, setStage] = useState<Stage>(() =>
    searchParams.get("mode") === "voice" ? "capture" : "welcome",
  );
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
  const [successAi, setSuccessAi] = useState<AIClassification | null>(null);

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

  // Category and severity are AI-determined, not user-picked, so every
  // classification result (Gemini or the rule-based fallback) becomes the draft.
  function applyAiResult(result: AIClassification) {
    setAi(result);
    setDraft((current) => ({ ...current, category: result.category, severity: result.severity }));
  }

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
      applyAiResult(result);
    } catch {
      applyAiResult(
        classifyFallback({
          description: draft.description,
          category: draft.category || undefined,
          severity: draft.severity || undefined,
        }),
      );
      setAiNotice(t("report.ai.fallbackNotice"));
    } finally {
      setAiLoading(false);
    }
  }

  async function classifyFromPhoto(file: File) {
    setAiLoading(true);
    setAiNotice(t("report.ai.analysingPhoto"));

    try {
      const compressed = await compressPhoto(file);
      const imageBase64 = await fileToBase64(compressed);
      const imageMimeType = (compressed.type || file.type) as ImageMimeType;
      const result = await requestClassification({
        description: draft.description || "Photo uploaded",
        imageBase64,
        imageMimeType,
      });
      applyAiResult(result);
      setAiNotice(null);
    } catch {
      applyAiResult(
        classifyFallback({
          description: draft.description || "Photo uploaded",
          category: draft.category || undefined,
          severity: draft.severity || undefined,
        }),
      );
      setAiNotice(t("report.ai.fallbackNotice"));
    } finally {
      setAiLoading(false);
      setStage("answer");
    }
  }

  async function classifyFromTranscript(description: string) {
    setAiLoading(true);
    setAiNotice(t("report.ai.analysingVoice"));

    try {
      const result = await requestClassification({
        description,
        category: draft.category || undefined,
        severity: draft.severity || undefined,
      });
      applyAiResult(result);
      setAiNotice(null);
    } catch {
      applyAiResult(
        classifyFallback({
          description,
          category: draft.category || undefined,
          severity: draft.severity || undefined,
        }),
      );
      setAiNotice(t("report.ai.fallbackNotice"));
    } finally {
      setAiLoading(false);
      setStage("answer");
    }
  }

  function applyTranscript(transcript: string) {
    const description = draft.description
      ? `${draft.description}\n\n${transcript}`.slice(0, DESCRIPTION_MAX)
      : transcript.slice(0, DESCRIPTION_MAX);
    updateDraft("description", description);
    void classifyFromTranscript(description);
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

  function addPhotos(files: FileList | File[]) {
    const incoming = Array.from(files);
    const hadNoPhotos = photos.length === 0;
    const next = [...photos];
    let message: string | null = null;

    for (const file of incoming) {
      if (next.length >= MAX_PHOTOS) {
        message = t("report.photos.limit", { max: MAX_PHOTOS });
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

    if (hadNoPhotos && next.length > 0) {
      void classifyFromPhoto(next[0].file);
    }
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
      setLocationMessage(t("report.location.geoUnsupported"));
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
          t("report.location.captured", { meters: Math.round(position.coords.accuracy) }),
        );
        setLocating(false);
      },
      (error) => {
        setLocationMessage(
          error.code === error.PERMISSION_DENIED
            ? t("report.location.denied")
            : t("report.location.failed"),
        );
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }

  async function handleCaptureContinue() {
    const description = draft.description.trim();
    if (photos.length === 0 && description.length < DESCRIPTION_MIN) {
      setErrors({
        description: t("report.errors.details"),
      });
      return;
    }

    setErrors({});
    if (!ai) {
      await runClassification();
    }
    setStage("answer");
  }

  function handleLocationContinue() {
    const locationError = validateCoordinates(draft.location.lat, draft.location.lng);
    if (locationError) {
      setErrors({ location: locationError });
      return;
    }
    setErrors({});
    setStage("confirm");
  }

  function goBack() {
    const target = STAGE_BACK[stage];
    if (target) setStage(target);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (stage !== "confirm") return;

    setSubmitError(null);
    setConsentError(null);

    const allErrors = validateDraft(draft, photos.length > 0);
    setErrors(allErrors);
    if (Object.keys(allErrors).length > 0) {
      setSubmitError(t("report.errors.details"));
      return;
    }

    if (!consent) {
      setConsentError(t("report.consentError"));
      return;
    }

    if (!isFirebaseConfigured) {
      setSubmitError(t("report.submit.notConfigured"));
      return;
    }

    try {
      const previous = Number(localStorage.getItem(LAST_REPORT_KEY) ?? 0);
      if (previous && Date.now() - previous < SUBMISSION_COOLDOWN_MS) {
        setSubmitError(t("report.submit.cooldown"));
        return;
      }
    } catch {
      // Storage can be unavailable in private mode; continue without the cooldown.
    }

    setSubmitting(true);
    setUploadStatus(t("report.upload.saving"));

    try {
      const incidentId = newIncidentId();

      await createIncident({
        incidentId,
        draft,
        ai: ai ?? undefined,
        photoUrls: [],
        reporterUid: user?.uid,
      });

      try {
        localStorage.setItem(LAST_REPORT_KEY, String(Date.now()));
      } catch {
        // Ignore storage failures.
      }

      setSuccessId(incidentId);
      setSuccessAi(ai);
    } catch (cause) {
      setSubmitError(
        cause instanceof Error ? cause.message : t("report.submit.genericError"),
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
    setSuccessAi(null);
    setStage("welcome");
    setAi(null);
    setAiNotice(null);
    setLocationMessage(null);
  }

  if (successId) {
    return <SuccessPanel incidentId={successId} ai={successAi} onReset={resetForm} />;
  }

  if (!languageChosen) {
    return <LanguageGate onChoose={() => {}} />;
  }

  const stageIndex = STAGE_ORDER.indexOf(stage);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <div className="mx-auto max-w-2xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700">
          <FileWarning className="h-3.5 w-3.5" aria-hidden="true" />
          {t("report.badge")}
        </span>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-teal-900 sm:text-4xl">
          {t("report.pageTitle")}
        </h1>
        <p className="mt-3 text-ink-500">{t("report.pageSubtitle")}</p>
      </div>

      <div className="mt-8">
        <ProgressStrip stageIndex={stageIndex} />
      </div>

      {!isFirebaseConfigured ? (
        <div className="mx-auto mt-6 max-w-3xl">
          <Alert variant="warning" title={t("report.notConnected.title")}>
            {t("report.notConnected.body")}
          </Alert>
        </div>
      ) : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <form onSubmit={handleSubmit} noValidate>
          <Card className="p-5 sm:p-7">
            <div key={stage} className="animate-fade-in-up">
              {stage === "welcome" ? <WelcomeStage language={language} /> : null}

              {stage === "capture" ? (
                <CaptureStage
                  draft={draft}
                  errors={errors}
                  photoMessage={photoMessage}
                  photos={photos}
                  disabled={submitting}
                  aiLoading={aiLoading}
                  aiNotice={aiNotice}
                  onDraftChange={updateDraft}
                  onAddPhotos={addPhotos}
                  onRemovePhoto={removePhoto}
                  onTranscribed={applyTranscript}
                />
              ) : null}

              {stage === "answer" ? (
                <AnswerStage ai={ai} aiLoading={aiLoading} aiNotice={aiNotice} />
              ) : null}

              {stage === "location" ? (
                <LocationStage
                  draft={draft}
                  errors={errors}
                  locating={locating}
                  locationMessage={locationMessage}
                  onLocationChange={updateLocation}
                  onUseMyLocation={useMyLocation}
                />
              ) : null}

              {stage === "confirm" ? (
                <ConfirmStage
                  draft={draft}
                  ai={ai}
                  aiLoading={aiLoading}
                  consent={consent}
                  consentError={consentError}
                  submitting={submitting}
                  uploadStatus={uploadStatus}
                  submitError={submitError}
                  onDraftChange={updateDraft}
                  onConsentChange={setConsent}
                  onReclassify={() => {
                    setAi(null);
                    void runClassification(true);
                  }}
                />
              ) : null}
            </div>

            <div className="mt-8 flex items-center justify-between gap-3 border-t border-ink-100 pt-5">
              <div>
                {stage === "welcome" ? (
                  <Link
                    href="/"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-teal-900"
                  >
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                    {t("report.buttons.cancel")}
                  </Link>
                ) : (
                  <Button type="button" variant="ghost" onClick={goBack} disabled={submitting}>
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                    {t("report.buttons.back")}
                  </Button>
                )}
              </div>

              {stage === "welcome" ? (
                <Button type="button" onClick={() => setStage("capture")}>
                  {t("report.welcome.start")}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              ) : stage === "capture" ? (
                <Button type="button" onClick={() => void handleCaptureContinue()} disabled={aiLoading}>
                  {aiLoading ? (
                    <>
                      <Spinner className="h-4 w-4" />
                      {aiNotice || t("report.ai.analysing")}
                    </>
                  ) : (
                    <>
                      {t("report.buttons.next")}
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </>
                  )}
                </Button>
              ) : stage === "answer" ? (
                <Button type="button" onClick={() => setStage("location")} disabled={aiLoading}>
                  {t("report.buttons.next")}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              ) : stage === "location" ? (
                <Button type="button" onClick={handleLocationContinue}>
                  {t("report.buttons.next")}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              ) : (
                <Button type="submit" disabled={submitting || aiLoading || !isFirebaseConfigured}>
                  {submitting ? (
                    <>
                      <Spinner className="h-4 w-4" />
                      {uploadStatus || t("report.upload.submitting")}
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" aria-hidden="true" />
                      {t("report.buttons.submit")}
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
              {t("report.sidebar.nextTitle")}
            </h2>
            <ol className="mt-3 space-y-3 text-sm text-ink-600">
              <li className="flex gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[10px] font-semibold text-brand-700">1</span>
                {t("report.sidebar.next1")}
              </li>
              <li className="flex gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[10px] font-semibold text-brand-700">2</span>
                {t("report.sidebar.next2")}
              </li>
              <li className="flex gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[10px] font-semibold text-brand-700">3</span>
                {t("report.sidebar.next3")}
              </li>
            </ol>
          </Card>

          <Card className="border-warning-500/20 bg-warning-50/40 p-5">
            <h2 className="flex items-center gap-2 font-semibold text-warning-600">
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              {t("report.sidebar.safeTitle")}
            </h2>
            <p className="mt-2 text-sm leading-6 text-ink-600">{t("report.sidebar.safeBody")}</p>
          </Card>

          {/* Call centre card — always visible */}
          <Card className="p-5">
            <h2 className="flex items-center gap-2 font-semibold text-teal-900">
              <Phone className="h-4 w-4 text-brand-600" aria-hidden="true" />
              Need help? Call us
            </h2>
            <p className="mt-2 text-xs leading-5 text-ink-500">
              Cannot submit? A DrainWatch agent will help you report by phone.
            </p>
            <div className="mt-3 flex flex-col gap-2">
              <a
                href="tel:112"
                className="flex items-center justify-center gap-2 rounded-lg bg-critical-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-critical-700"
              >
                <Phone className="h-4 w-4" aria-hidden="true" />
                112 — Emergency Services
              </a>
              <a
                href="tel:+256000000000"
                className="flex items-center justify-center gap-2 rounded-lg border border-ink-200 bg-white px-4 py-2.5 text-sm font-semibold text-teal-900 hover:bg-ink-50"
              >
                <Phone className="h-4 w-4" aria-hidden="true" />
                Call a DrainWatch Agent
              </a>
              <a
                href="https://wa.me/256000000000?text=I+need+to+report+a+drainage+hazard"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2.5 text-sm font-semibold text-green-800 hover:bg-green-100"
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                WhatsApp DrainWatch
              </a>
            </div>
          </Card>

          <SupportRequestCard />

          {user ? (
            <Card className="p-5">
              <p className="text-xs text-ink-400">{t("report.sidebar.signedInAs")}</p>
              <p className="mt-1 truncate text-sm font-medium text-ink-800">
                {user.email}
              </p>
              <p className="mt-2 text-xs leading-5 text-ink-500">
                {t("report.sidebar.linkedAccount")}
              </p>
            </Card>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

function ProgressStrip({ stageIndex }: { stageIndex: number }) {
  return (
    <ol className="mx-auto flex max-w-2xl items-center gap-2" aria-label="Report progress">
      {STAGE_ORDER.map((item, index) => {
        const complete = stageIndex > index;
        const active = stageIndex === index;

        return (
          <li key={item} className="flex flex-1 items-center gap-2">
            <span
              className={cn(
                "flex h-2.5 w-full items-center justify-center rounded-full transition-colors",
                complete ? "bg-brand-600" : active ? "bg-brand-300" : "bg-ink-100",
              )}
              aria-hidden="true"
            />
          </li>
        );
      })}
    </ol>
  );
}

function WelcomeStage({ language }: { language: Language }) {
  const { t } = useLanguage();

  return (
    <div className="space-y-6 text-center">
      <div className="flex justify-center">
        <AudioGuide step="welcome" language={language} />
      </div>
      <div>
        <h2 className="text-xl font-semibold text-teal-900">{t("report.welcome.title")}</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-500">
          {t("report.welcome.subtitle")}
        </p>
      </div>
    </div>
  );
}

function CaptureStage({
  draft,
  errors,
  photos,
  photoMessage,
  disabled,
  aiLoading,
  aiNotice,
  onDraftChange,
  onAddPhotos,
  onRemovePhoto,
  onTranscribed,
}: {
  draft: ReportDraft;
  errors: ReportErrors;
  photos: PhotoItem[];
  photoMessage: string | null;
  disabled: boolean;
  aiLoading: boolean;
  aiNotice: string | null;
  onDraftChange: <K extends keyof ReportDraft>(key: K, value: ReportDraft[K]) => void;
  onAddPhotos: (files: FileList | File[]) => void;
  onRemovePhoto: (id: string) => void;
  onTranscribed: (transcript: string) => void;
}) {
  const { t, language } = useLanguage();
  const [method, setMethod] = useState<CaptureMethod>(null);

  const hasVoiceOrText = draft.description.trim().length > 0;
  const hasPhoto = photos.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-teal-900">{t("report.capture.title")}</h2>
          <p className="mt-0.5 text-sm text-ink-500">{t("report.capture.subtitle")}</p>
        </div>
        <AudioGuide step="capture" language={language} />
      </div>

      {method === null ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <CaptureMethodButton
            icon={Mic}
            label={t("report.capture.chooseVoice")}
            done={hasVoiceOrText}
            onClick={() => setMethod("voice")}
          />
          <CaptureMethodButton
            icon={ImagePlus}
            label={t("report.capture.choosePhoto")}
            done={hasPhoto}
            onClick={() => setMethod("photo")}
          />
          <CaptureMethodButton
            icon={Type}
            label={t("report.capture.chooseText")}
            done={hasVoiceOrText}
            onClick={() => setMethod("text")}
          />
        </div>
      ) : (
        <div>
          <button
            type="button"
            onClick={() => setMethod(null)}
            className="mb-3 inline-flex items-center gap-1.5 text-xs font-medium text-brand-700 hover:text-brand-800"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            {t("report.capture.chooseDifferent")}
          </button>

          {method === "voice" ? (
            <div>
              <h3 className="text-sm font-semibold text-ink-800">{t("report.fields.voice")}</h3>
              <p className="mt-0.5 text-xs text-ink-500">{t("report.fields.voiceHint")}</p>
              <div className="mt-3">
                <VoiceRecorder onTranscribed={onTranscribed} disabled={disabled} />
              </div>
            </div>
          ) : null}

          {method === "photo" ? (
            <div>
              <h3 className="text-sm font-semibold text-ink-800">{t("report.fields.photos")}</h3>
              <p className="mt-0.5 text-xs text-ink-500">{t("report.fields.photosHint")}</p>
              <div className="mt-3">
                <PhotoUploader
                  photos={photos}
                  onAddFiles={onAddPhotos}
                  onRemove={onRemovePhoto}
                  error={photoMessage ?? undefined}
                  disabled={disabled}
                  maxPhotos={MAX_PHOTOS}
                />
              </div>
            </div>
          ) : null}

          {method === "text" ? (
            <Field
              label={t("report.fields.description")}
              htmlFor="report-description"
              hint={t("report.fields.descriptionHint", { min: DESCRIPTION_MIN })}
              error={errors.description}
            >
              <Textarea
                id="report-description"
                value={draft.description}
                onChange={(event) =>
                  onDraftChange("description", event.target.value.slice(0, DESCRIPTION_MAX))
                }
                placeholder={t("report.fields.descriptionPlaceholder")}
                rows={5}
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
          ) : null}

          {aiLoading && aiNotice ? (
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-ink-500">
              <SpeakingWaveform active className="h-4 text-brand-600" />
              {aiNotice}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

type CaptureMethod = "voice" | "photo" | "text" | null;

function CaptureMethodButton({
  icon: Icon,
  label,
  done,
  onClick,
}: {
  icon: typeof Mic;
  label: string;
  done: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-center gap-2 rounded-2xl border p-5 text-center text-sm font-medium transition-colors",
        done
          ? "border-success-300 bg-success-50 text-success-800"
          : "border-ink-200 bg-white text-ink-700 hover:bg-ink-50",
      )}
    >
      {done ? (
        <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-success-500 text-white">
          <Check className="h-3 w-3" aria-hidden="true" />
        </span>
      ) : null}
      <Icon className="h-6 w-6" aria-hidden="true" />
      {label}
    </button>
  );
}

function AnswerStage({
  ai,
  aiLoading,
  aiNotice,
}: {
  ai: AIClassification | null;
  aiLoading: boolean;
  aiNotice: string | null;
}) {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-teal-900">{t("report.answer.title")}</h2>
          <p className="mt-0.5 text-sm text-ink-500">{t("report.answer.subtitle")}</p>
        </div>
      </div>

      <div
        className={cn(
          "rounded-2xl border p-4",
          ai ? SEVERITY_CARD_TONE[ai.severity] : "border-brand-200 bg-brand-50/50",
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            {t("report.ai.title")}
          </h3>
          {ai ? (
            <Badge variant={ai.source === "gemini" ? "info" : "neutral"}>
              {ai.source === "gemini" ? "Gemini" : t("report.ai.fallbackSource")}
            </Badge>
          ) : null}
        </div>

        {aiLoading ? (
          <p className="mt-3 flex items-center gap-2 text-sm text-ink-500">
            <Spinner className="h-4 w-4 text-brand-600" />
            {t("report.ai.analysing")}
          </p>
        ) : ai ? (
          <div className="mt-3 space-y-3">
            <div className="grid gap-2 sm:grid-cols-3">
              <MiniFact label={t("report.ai.category")} value={t(`report.categories.${ai.category}`)} />
              <MiniFact label={t("report.ai.severity")} value={SEVERITY_LABELS[ai.severity]} />
              <MiniFact label={t("report.ai.urgency")} value={URGENCY_LABELS[ai.urgency]} />
            </div>
            <p className="text-sm leading-6 text-ink-700">{ai.summary}</p>
            <p className="text-xs text-ink-500">
              {Math.round(ai.confidence * 100)}% {t("report.ai.confidence")}.{" "}
              {t("report.review.confidenceNote")}
            </p>
          </div>
        ) : (
          <p className="mt-3 text-sm text-ink-500">{t("report.review.noSuggestion")}</p>
        )}

        {aiNotice ? <p className="mt-3 text-xs font-medium text-warning-600">{aiNotice}</p> : null}
      </div>

      <p className="text-xs text-ink-500">{t("report.answer.redo")}</p>

      {ai?.severity === "critical" ? (
        <div className="rounded-2xl border border-critical-300 bg-critical-50 p-4 space-y-3">
          <p className="flex items-center gap-2 text-sm font-semibold text-critical-800">
            <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
            {t("report.warning.critical")}
          </p>
          <p className="text-sm text-critical-700">{t("report.warning.criticalBody")}</p>
          <a
            href="tel:112"
            className="inline-flex items-center gap-2 rounded-lg bg-critical-600 px-4 py-2 text-sm font-semibold text-white hover:bg-critical-700"
          >
            <Phone className="h-4 w-4" aria-hidden="true" />
            Call 112 — Emergency
          </a>
        </div>
      ) : ai?.severity === "high" ? (
        <div className="rounded-2xl border border-warning-300 bg-warning-50 p-4 space-y-3">
          <p className="flex items-center gap-2 text-sm font-semibold text-warning-800">
            <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
            {t("report.warning.high")}
          </p>
          <p className="text-sm text-warning-700">{t("report.warning.highBody")}</p>
        </div>
      ) : null}
    </div>
  );
}

function LocationStage({
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
  const { t, language } = useLanguage();
  const point =
    draft.location.lat !== null && draft.location.lng !== null
      ? { lat: draft.location.lat, lng: draft.location.lng }
      : null;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-teal-900">{t("report.locationStep.title")}</h2>
          <p className="mt-0.5 text-sm text-ink-500">{t("report.locationStep.subtitle")}</p>
        </div>
        <AudioGuide step="location" language={language} />
      </div>

      <LocationSearch
        onSelect={(result) =>
          onLocationChange({ lat: result.lat, lng: result.lng, address: result.label })
        }
      />

      <LocationPicker
        value={point}
        onChange={(next) => onLocationChange({ lat: next.lat, lng: next.lng })}
        className="h-80"
      />

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="outline" onClick={onUseMyLocation} disabled={locating}>
          {locating ? (
            <>
              <Spinner className="h-4 w-4" />
              {t("report.buttons.locating")}
            </>
          ) : (
            <>
              <Crosshair className="h-4 w-4" aria-hidden="true" />
              {t("report.buttons.useMyLocation")}
            </>
          )}
        </Button>
        {point ? (
          <Badge variant="success">
            <MapPin className="h-3 w-3" aria-hidden="true" />
            {formatCoordinates(point.lat, point.lng)}
          </Badge>
        ) : (
          <Badge variant="warning">{t("report.location.noPin")}</Badge>
        )}
      </div>

      {locationMessage ? (
        <p className="text-xs text-ink-500" role="status">
          {locationMessage}
        </p>
      ) : null}

      {errors.location ? (
        <Alert variant="warning" title={t("report.errors.location")}>
          {errors.location}
        </Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("report.fields.latitude")} htmlFor="report-lat">
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
        <Field label={t("report.fields.longitude")} htmlFor="report-lng">
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
          label={t("report.fields.division")}
          htmlFor="report-division"
          hint={t("report.fields.divisionHint")}
        >
          <Select
            id="report-division"
            value={draft.location.division ?? ""}
            onChange={(event) => onLocationChange({ division: event.target.value })}
          >
            <option value="">{t("report.fields.notSure")}</option>
            {KAMPALA_DIVISIONS.map((division) => (
              <option key={division} value={division}>
                {division}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          label={t("report.fields.landmark")}
          htmlFor="report-address"
          hint={t("report.fields.landmarkHint")}
        >
          <Input
            id="report-address"
            value={draft.location.address ?? ""}
            onChange={(event) => onLocationChange({ address: event.target.value.slice(0, 200) })}
            placeholder={t("report.fields.landmarkPlaceholder")}
          />
        </Field>
      </div>

      <Alert variant="info">{t("report.location.serviceArea")}</Alert>
    </div>
  );
}

function ConfirmStage({
  draft,
  ai,
  aiLoading,
  consent,
  consentError,
  submitting,
  uploadStatus,
  submitError,
  onDraftChange,
  onConsentChange,
  onReclassify,
}: {
  draft: ReportDraft;
  ai: AIClassification | null;
  aiLoading: boolean;
  consent: boolean;
  consentError: string | null;
  submitting: boolean;
  uploadStatus: string | null;
  submitError: string | null;
  onDraftChange: <K extends keyof ReportDraft>(key: K, value: ReportDraft[K]) => void;
  onConsentChange: (value: boolean) => void;
  onReclassify: () => void;
}) {
  const { t, language } = useLanguage();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-teal-900">{t("report.confirmStep.title")}</h2>
          <p className="mt-0.5 text-sm text-ink-500">{t("report.confirmStep.subtitle")}</p>
        </div>
        <AudioGuide step="confirm" language={language} />
      </div>

      <div className="rounded-2xl border border-ink-100">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-100 px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            {draft.severity ? <SeverityBadge severity={draft.severity} /> : null}
            <Badge variant="neutral">
              {draft.category
                ? t(`report.categories.${draft.category}`)
                : t("report.review.categoryMissing")}
            </Badge>
          </div>
          <Button type="button" size="sm" variant="ghost" onClick={onReclassify} disabled={submitting || aiLoading}>
            {t("report.buttons.rerun")}
          </Button>
        </div>
        <div className="space-y-4 px-4 py-4">
          <div>
            <p className="mt-1 whitespace-pre-line text-sm leading-6 text-ink-600">
              {draft.description}
            </p>
          </div>

          <div className="border-t border-ink-100 pt-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-ink-400">
              {t("report.review.locationLabel")}
            </p>
            <p className="mt-0.5 text-sm text-ink-700">
              {draft.location.address || draft.location.division || "Kampala"}
            </p>
            <p className="mt-0.5 font-mono text-xs text-ink-500">
              {draft.location.lat !== null && draft.location.lng !== null
                ? formatCoordinates(draft.location.lat, draft.location.lng)
                : t("report.review.noCoordinates")}
            </p>
          </div>

          {ai ? (
            <div className="border-t border-ink-100 pt-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-ink-400">
                {t("report.ai.title")}
              </p>
              <p className="mt-1 text-sm leading-6 text-ink-700">{ai.summary}</p>
            </div>
          ) : null}
        </div>
      </div>

      <fieldset className="rounded-2xl border border-ink-100 bg-ink-50/50 p-4">
        <legend className="px-1 text-sm font-semibold text-ink-800">
          {t("report.fields.yourDetails")}
        </legend>
        <p className="text-xs leading-5 text-ink-500">{t("report.fields.detailsHint")}</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <Field label={t("report.fields.name")} htmlFor="reporter-name">
            <Input
              id="reporter-name"
              value={draft.reporter.name ?? ""}
              onChange={(event) =>
                onDraftChange("reporter", { ...draft.reporter, name: event.target.value.slice(0, 80) })
              }
              autoComplete="name"
              disabled={submitting}
            />
          </Field>
          <Field label={t("report.fields.phone")} htmlFor="reporter-phone">
            <Input
              id="reporter-phone"
              type="tel"
              value={draft.reporter.phone ?? ""}
              onChange={(event) =>
                onDraftChange("reporter", { ...draft.reporter, phone: event.target.value.slice(0, 30) })
              }
              autoComplete="tel"
              placeholder="+256…"
              disabled={submitting}
            />
          </Field>
          <Field label={t("report.fields.email")} htmlFor="reporter-email">
            <Input
              id="reporter-email"
              type="email"
              value={draft.reporter.email ?? ""}
              onChange={(event) =>
                onDraftChange("reporter", { ...draft.reporter, email: event.target.value.slice(0, 120) })
              }
              autoComplete="email"
              disabled={submitting}
            />
          </Field>
        </div>
      </fieldset>

      {submitError ? (
        <Alert variant="error" title={t("report.errors.submitTitle")}>
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
        <span>{t("report.consent")}</span>
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
  ai,
  onReset,
}: {
  incidentId: string;
  ai: AIClassification | null;
  onReset: () => void;
}) {
  const { t, language } = useLanguage();
  const [copied, setCopied] = useState(false);
  const isCritical = ai?.severity === "critical";
  const isHigh = ai?.severity === "high";
  const isUrgent = isCritical || isHigh;

  async function copyReference() {
    try {
      await navigator.clipboard.writeText(incidentId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be unavailable (e.g. insecure context); ignore silently.
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6 lg:py-24 animate-fade-in-up">
      <div className="flex justify-center">
        <AudioGuide step="success" language={language} />
      </div>
      <span className="mx-auto mt-4 flex h-16 w-16 items-center justify-center rounded-full bg-success-50 text-success-500 animate-scale-in">
        <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
      </span>
      <h1 className="mt-6 text-3xl font-semibold tracking-tight text-teal-900">
        {t("report.success.title")}
      </h1>
      <p className="mt-3 text-ink-500">{t("report.success.body")}</p>

      {/* AI severity result */}
      {ai ? (
        <div
          className={cn(
            "mx-auto mt-6 max-w-sm rounded-2xl border p-4 text-left",
            ai.severity ? SEVERITY_CARD_TONE[ai.severity] : "border-ink-200 bg-white",
          )}
        >
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="text-sm font-semibold">{t("report.success.aiAssessment")}</span>
            <span className="ml-auto rounded-full border border-current/20 bg-white/60 px-2 py-0.5 text-xs font-medium capitalize">
              {ai.severity} {t("report.success.severityWord")}
            </span>
          </div>
          <p className="mt-2 text-sm leading-6">{ai.summary}</p>
          <div className="mt-2 flex flex-wrap gap-3 text-xs font-medium opacity-80">
            <span>
              {t("report.success.categoryLabel")}: {t(`report.categories.${ai.category}`)}
            </span>
            <span>
              {t("report.success.urgencyLabel")}: {URGENCY_LABELS[ai.urgency]}
            </span>
            <span>
              {t("report.success.confidenceLabel")}: {Math.round(ai.confidence * 100)}%
            </span>
          </div>
        </div>
      ) : null}

      {/* Emergency warning for critical/high */}
      {isUrgent ? (
        <div className="mx-auto mt-4 max-w-sm rounded-2xl border border-critical-300 bg-critical-50 p-4 text-left space-y-3">
          <p className="flex items-start gap-2 text-sm font-semibold text-critical-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {isCritical ? t("report.success.urgentCritical") : t("report.success.urgentHigh")}
          </p>
          <div className="flex flex-wrap gap-2">
            {isCritical ? (
              <a
                href="tel:112"
                className="inline-flex items-center gap-2 rounded-lg bg-critical-600 px-4 py-2 text-sm font-semibold text-white hover:bg-critical-700"
              >
                <Phone className="h-4 w-4" aria-hidden="true" />
                Call 112 — Emergency
              </a>
            ) : null}
            <a
              href="tel:+256000000000"
              className="inline-flex items-center gap-2 rounded-lg border border-critical-300 bg-white px-4 py-2 text-sm font-semibold text-critical-700 hover:bg-critical-50"
            >
              <Phone className="h-4 w-4" aria-hidden="true" />
              Call a DrainWatch Agent
            </a>
          </div>
        </div>
      ) : null}

      <div className="mx-auto mt-6 inline-flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-ink-200 bg-white px-5 py-3 shadow-sm">
        <span className="text-xs font-medium uppercase tracking-wide text-ink-400">
          {t("report.success.reference")}
        </span>
        <code className="font-mono text-sm font-semibold text-ink-800">
          {incidentId}
        </code>
        <button
          type="button"
          onClick={copyReference}
          aria-label={t("report.success.copyAria")}
          className="flex items-center gap-1.5 rounded-full border border-ink-200 bg-white px-2.5 py-1 text-xs font-medium text-ink-600 transition-colors hover:bg-ink-50"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-success-600" aria-hidden="true" />
              {t("report.success.copied")}
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
              {t("report.success.copy")}
            </>
          )}
        </button>
      </div>

      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <LinkButton href={`/map?incident=${encodeURIComponent(incidentId)}`}>
          {t("report.success.viewMap")}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </LinkButton>
        <Button type="button" variant="outline" onClick={onReset}>
          {t("report.success.another")}
        </Button>
        <LinkButton href="/" variant="ghost">
          {t("report.success.backHome")}
        </LinkButton>
      </div>

      <p className="mt-8 text-xs leading-5 text-ink-400">{t("report.success.footnote")}</p>
    </div>
  );
}
