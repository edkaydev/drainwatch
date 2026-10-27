import { cn } from "@/lib/utils";

const BAR_DELAYS_MS = [0, 120, 240, 360, 240, 120];

/**
 * A small animated equalizer used wherever audio is actively playing or being
 * captured (AI narration, voice recording, transcription) — never tied to
 * real amplitude, just a rhythmic cue that something is "alive".
 */
export function SpeakingWaveform({
  active,
  className,
  barClassName,
}: {
  active: boolean;
  className?: string;
  barClassName?: string;
}) {
  return (
    <span className={cn("flex h-4 items-center gap-0.5", className)} aria-hidden="true">
      {BAR_DELAYS_MS.map((delay, index) => (
        <span
          key={index}
          className={cn(
            "h-full w-[3px] origin-center rounded-full bg-current",
            active ? "animate-waveform" : "scale-y-[0.15] opacity-40",
            barClassName,
          )}
          style={active ? { animationDelay: `${delay}ms` } : undefined}
        />
      ))}
    </span>
  );
}
