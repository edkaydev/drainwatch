"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { translate, type Language } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const MUTED_KEY = "drainwatch:muted";

const SPEECH_LANG: Record<Language, string> = {
  en: "en-UG",
  lg: "lg-UG",
  sw: "sw-KE",
};

const STEP_AUDIO_KEY = {
  1: "report.step1.audio",
  2: "report.step2.audio",
  3: "report.step3.audio",
  success: "report.success.audio",
} as const;

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
  const supported = useSyncExternalStore(
    subscribeNone,
    getSpeechSupported,
    getBooleanServerSnapshot,
  );
  const muted = useSyncExternalStore(subscribeMuted, readMuted, getBooleanServerSnapshot);

  const script = translate(language, STEP_AUDIO_KEY[step]);
  const text =
    step === 3 && aiSummary
      ? `${script} ${translate(language, "report.ai.title")}: ${aiSummary}`
      : script;

  useEffect(() => {
    if (!supported || muted) return;
    speak(text, language);

    return () => {
      window.speechSynthesis.cancel();
    };
  }, [text, language, supported, muted]);

  if (!supported) return null;

  function toggleMuted() {
    const next = !muted;
    writeMuted(next);
    if (next) window.speechSynthesis.cancel();
  }

  function playNow() {
    if (muted) return;
    speak(text, language);
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <button
        type="button"
        onClick={playNow}
        disabled={muted}
        aria-label="Play audio guide"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-ink-200 bg-white text-brand-600 shadow-sm transition-colors hover:bg-brand-50 disabled:pointer-events-none disabled:opacity-50"
      >
        <Volume2 className="h-4 w-4" aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={toggleMuted}
        aria-pressed={muted}
        aria-label={muted ? "Unmute audio guide" : "Mute audio guide"}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-ink-200 bg-white text-ink-500 shadow-sm transition-colors hover:bg-ink-50"
      >
        {muted ? (
          <VolumeX className="h-4 w-4" aria-hidden="true" />
        ) : (
          <Volume2 className="h-4 w-4" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
