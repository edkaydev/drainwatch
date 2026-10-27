"use client";

import { useEffect, useRef, useSyncExternalStore, type RefObject } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { translate, type Language } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const MUTED_KEY = "drainwatch:muted";

const SPEECH_LANG: Record<Language, string> = {
  en: "en-UG",
  lg: "lg-UG",
};

const STEP_AUDIO_KEY = {
  1: "report.step1.audio",
  2: "report.step2.audio",
  3: "report.step3.audio",
  success: "report.success.audio",
} as const;

type StepKey = keyof typeof STEP_AUDIO_KEY;

// Recorded voiceovers take priority over the browser's text-to-speech (which
// reads Luganda with a robotic English accent). A step without a recording —
// or step 3 once a dynamic AI summary is appended — falls back to
// speechSynthesis instead.
const RECORDING_FILE: Record<Language, Partial<Record<StepKey, string>>> = {
  en: { 1: "welcome", 2: "location", 3: "confirm", success: "success" },
  lg: { 1: "welcome", 2: "location", 3: "confirm", success: "success" },
};

function recordingUrl(language: Language, step: StepKey): string | null {
  const name = RECORDING_FILE[language]?.[step];
  return name ? `/audio/${language}/${name}.mp3` : null;
}

const mutedListeners = new Set<() => void>();

function readMuted(): boolean {
  try {
    return localStorage.getItem(MUTED_KEY) === "true";
  } catch {
    return false;
  }
}

function getBooleanServerSnapshot(): boolean {
  return false;
}

function subscribeMuted(onChange: () => void): () => void {
  mutedListeners.add(onChange);
  return () => mutedListeners.delete(onChange);
}

function writeMuted(next: boolean) {
  try {
    localStorage.setItem(MUTED_KEY, String(next));
  } catch {
    // Ignore storage failures.
  }
  mutedListeners.forEach((listener) => listener());
}

function subscribeNone(): () => void {
  return () => {};
}

function getSpeechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

function speak(text: string, language: Language) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = SPEECH_LANG[language];
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

function stopPlayback(audioRef: RefObject<HTMLAudioElement | null>, speechSupported: boolean) {
  audioRef.current?.pause();
  if (speechSupported) window.speechSynthesis.cancel();
}

function playGuide(
  audioRef: RefObject<HTMLAudioElement | null>,
  url: string | null,
  text: string,
  language: Language,
  speechSupported: boolean,
) {
  stopPlayback(audioRef, speechSupported);

  if (url) {
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.play().catch(() => {
      if (speechSupported) speak(text, language);
    });
    return;
  }

  if (speechSupported) speak(text, language);
}

export function AudioGuide({
  step,
  language,
  aiSummary,
  className,
}: {
  step: 1 | 2 | 3 | "success";
  language: Language;
  aiSummary?: string;
  className?: string;
}) {
  const speechSupported = useSyncExternalStore(
    subscribeNone,
    getSpeechSupported,
    getBooleanServerSnapshot,
  );
  const muted = useSyncExternalStore(subscribeMuted, readMuted, getBooleanServerSnapshot);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const script = translate(language, STEP_AUDIO_KEY[step]);
  const hasDynamicSummary = step === 3 && Boolean(aiSummary);
  const text = hasDynamicSummary
    ? `${script} ${translate(language, "report.ai.title")}: ${aiSummary}`
    : script;
  // A recording can't include the AI's dynamic summary, so that case always
  // falls back to speechSynthesis even when a recording exists for step 3.
  const url = hasDynamicSummary ? null : recordingUrl(language, step);
  const supported = Boolean(url) || speechSupported;

  useEffect(() => {
    if (!supported || muted) return;
    playGuide(audioRef, url, text, language, speechSupported);

    return () => stopPlayback(audioRef, speechSupported);
  }, [url, text, language, supported, muted, speechSupported]);

  if (!supported) return null;

  function toggleMuted() {
    const next = !muted;
    writeMuted(next);
    if (next) {
      stopPlayback(audioRef, speechSupported);
    } else {
      playGuide(audioRef, url, text, language, speechSupported);
    }
  }

  return (
    <button
      type="button"
      onClick={toggleMuted}
      aria-pressed={muted}
      aria-label={muted ? "Unmute and play audio guide" : "Mute audio guide"}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-full border border-ink-200 bg-white shadow-sm transition-colors hover:bg-brand-50",
        muted ? "text-ink-500" : "text-brand-600",
        className,
      )}
    >
      {muted ? (
        <VolumeX className="h-4 w-4" aria-hidden="true" />
      ) : (
        <Volume2 className="h-4 w-4" aria-hidden="true" />
      )}
    </button>
  );
}
