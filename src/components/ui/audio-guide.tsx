"use client";

import { useEffect, useRef, useSyncExternalStore, type RefObject } from "react";
import { Volume2, VolumeX } from "lucide-react";
import type { Language } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const MUTED_KEY = "drainwatch:muted";

export type StepKey = "welcome" | "capture" | "location" | "confirm" | "success";

// Recorded voiceovers only — no browser text-to-speech anywhere in the app.
// A language/step without a recording here just hides the button.
const RECORDING_FILE: Record<Language, Partial<Record<StepKey, string>>> = {
  en: { welcome: "welcome", capture: "report", location: "location", confirm: "confirm", success: "success" },
  lg: { welcome: "welcome", capture: "report", location: "location", confirm: "confirm", success: "success" },
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

function playRecording(audioRef: RefObject<HTMLAudioElement | null>, url: string) {
  audioRef.current?.pause();
  const audio = new Audio(url);
  audioRef.current = audio;
  void audio.play().catch(() => {
    // Autoplay can be blocked before the first user interaction; the mute
    // button still lets them start playback manually.
  });
}

export function AudioGuide({
  step,
  language,
  className,
}: {
  step: StepKey;
  language: Language;
  className?: string;
}) {
  const muted = useSyncExternalStore(subscribeMuted, readMuted, getBooleanServerSnapshot);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const url = recordingUrl(language, step);

  useEffect(() => {
    if (!url || muted) return;
    playRecording(audioRef, url);

    const current = audioRef;
    return () => current.current?.pause();
  }, [url, muted]);

  if (!url) return null;

  function toggleMuted() {
    const next = !muted;
    writeMuted(next);
    if (next) {
      audioRef.current?.pause();
    } else if (url) {
      playRecording(audioRef, url);
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
