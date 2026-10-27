"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Mic, RotateCcw, Square } from "lucide-react";
import { useLanguage } from "@/components/layout/language-provider";
import { SpeakingWaveform } from "@/components/ui/speaking-waveform";
import { requestTranscription } from "@/lib/incidents";
import {
  audioBaseType,
  isAudioMimeType,
  MAX_AUDIO_SECONDS,
  type AudioMimeType,
} from "@/lib/validation";
import { cn } from "@/lib/utils";

type Status = "idle" | "recording" | "transcribing" | "done";

const CANDIDATE_MIME_TYPES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/ogg;codecs=opus",
  "audio/mp4",
];

function getSupportSnapshot(): boolean {
  return (
    typeof MediaRecorder !== "undefined" && Boolean(navigator.mediaDevices?.getUserMedia)
  );
}

// Browser support never changes during a session, so there is nothing to subscribe to.
function subscribeNever(): () => void {
  return () => {};
}

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined" || !MediaRecorder.isTypeSupported) return undefined;
  return CANDIDATE_MIME_TYPES.find((candidate) => MediaRecorder.isTypeSupported(candidate));
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Could not read the recording."));
        return;
      }
      const commaIndex = result.indexOf(",");
      resolve(commaIndex >= 0 ? result.slice(commaIndex + 1) : result);
    };
    reader.onerror = () => reject(new Error("Could not read the recording."));
    reader.readAsDataURL(blob);
  });
}

export function VoiceRecorder({
  onTranscribed,
  disabled,
}: {
  onTranscribed: (transcript: string) => void;
  disabled?: boolean;
}) {
  const { t } = useLanguage();
  const [status, setStatus] = useState<Status>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const supported = useSyncExternalStore(subscribeNever, getSupportSnapshot, () => false);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(
    () => () => {
      stopTimer();
      streamRef.current?.getTracks().forEach((track) => track.stop());
    },
    [],
  );

  function stopTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  async function startRecording() {
    setError(null);

    if (!window.isSecureContext) {
      setError(t("report.voice.insecureContext"));
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = pickMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        void handleRecordingComplete(recorder.mimeType || mimeType);
      };

      recorderRef.current = recorder;
      recorder.start();
      setStatus("recording");
      setElapsed(0);

      timerRef.current = setInterval(() => {
        setElapsed((current) => {
          const next = current + 1;
          if (next >= MAX_AUDIO_SECONDS) {
            stopRecording();
          }
          return next;
        });
      }, 1000);
    } catch (cause) {
      const name = cause instanceof DOMException ? cause.name : "";
      if (name === "NotFoundError" || name === "DevicesNotFoundError") {
        setError(t("report.voice.micNotFound"));
      } else if (name === "NotReadableError" || name === "TrackStartError") {
        setError(t("report.voice.micInUse"));
      } else {
        setError(t("report.voice.micDenied"));
      }
    }
  }

  function stopRecording() {
    stopTimer();
    recorderRef.current?.stop();
  }

  async function handleRecordingComplete(mimeType: string | undefined) {
    const blob = new Blob(chunksRef.current, mimeType ? { type: mimeType } : undefined);
    chunksRef.current = [];

    if (blob.size === 0) {
      setStatus("idle");
      setError(t("report.voice.empty"));
      return;
    }

    if (!mimeType || !isAudioMimeType(mimeType)) {
      setStatus("idle");
      setError(t("report.voice.unsupportedFormat"));
      return;
    }
    const audioMimeType = audioBaseType(mimeType) as AudioMimeType;

    setStatus("transcribing");

    try {
      const audioBase64 = await blobToBase64(blob);
      const transcript = await requestTranscription({
        audioBase64,
        audioMimeType,
      });
      onTranscribed(transcript);
      setStatus("done");
    } catch (cause) {
      setStatus("idle");
      setError(cause instanceof Error ? cause.message : t("report.voice.failed"));
    }
  }

  if (!supported) return null;

  return (
    <div className="rounded-2xl border-2 border-dashed border-ink-200 bg-ink-50/40 p-6 text-center">
      {status === "idle" || status === "done" ? (
        <>
          <button
            type="button"
            onClick={() => void startRecording()}
            disabled={disabled}
            className={cn(
              "mx-auto flex h-12 w-12 items-center justify-center rounded-2xl shadow-sm transition-colors",
              status === "done"
                ? "bg-white text-brand-600 hover:bg-brand-50"
                : "bg-white text-brand-600 hover:bg-brand-50",
              "disabled:pointer-events-none disabled:opacity-50",
            )}
            aria-label={t("report.voice.record")}
          >
            <Mic className="h-5 w-5" aria-hidden="true" />
          </button>
          <p className="mt-3 text-sm font-medium text-ink-800">
            {status === "done" ? t("report.voice.recordAgain") : t("report.voice.record")}
          </p>
          <p className="mt-1 text-xs text-ink-400">{t("report.voice.hint")}</p>
        </>
      ) : null}

      {status === "recording" ? (
        <>
          <button
            type="button"
            onClick={stopRecording}
            className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-critical-600 text-white shadow-sm transition-colors hover:bg-critical-700"
            aria-label={t("report.voice.stop")}
          >
            <Square className="h-5 w-5" aria-hidden="true" fill="currentColor" />
          </button>
          <div className="mt-3 flex items-center justify-center gap-2 text-critical-600">
            <SpeakingWaveform active className="h-4" />
          </div>
          <p className="mt-1 text-sm font-medium text-ink-800">
            {t("report.voice.recording", { seconds: elapsed })}
          </p>
          <p className="mt-1 text-xs text-ink-400">{t("report.voice.tapToStop")}</p>
        </>
      ) : null}

      {status === "transcribing" ? (
        <div className="flex flex-col items-center gap-2">
          <SpeakingWaveform active className="h-6 text-brand-600" />
          <p className="text-sm font-medium text-ink-800">{t("report.voice.transcribing")}</p>
        </div>
      ) : null}

      {status === "done" ? (
        <p className="mt-3 flex items-center justify-center gap-1.5 text-xs font-medium text-success-600">
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          {t("report.voice.added")}
        </p>
      ) : null}

      {error ? (
        <p role="alert" className="mt-3 text-xs font-medium text-critical-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
