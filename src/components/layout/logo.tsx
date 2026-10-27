import { cn } from "@/lib/utils";

function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 96 96"
      className={className}
      role="img"
      aria-hidden="true"
    >
      <rect width="96" height="96" rx="22" fill="#256B3A" />
      <path
        d="M27 22 V74 H44 C59 74 71 62.4 71 48 S59 22 44 22 Z"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M38 35 C49 35 57 40 57 48 C57 56 49 61 38 61"
        fill="none"
        stroke="#D9EBDD"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="38" cy="35" r="3.1" fill="#FFFFFF" />
      <circle cx="38" cy="61" r="3.1" fill="#FFFFFF" />
      <circle cx="57" cy="48" r="7.1" fill="#256B3A" stroke="#FFFFFF" strokeWidth="2.8" />
      <circle cx="57" cy="48" r="1.7" fill="#FFFFFF" />
    </svg>
  );
}

export function Logo({ className, dark }: { className?: string; dark?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-semibold", className)}>
      <LogoMark className="h-8 w-8 shrink-0" />
      <span className={cn("text-lg tracking-tight", dark ? "text-white" : "text-teal-900")}>
        DrainWatch
      </span>
    </span>
  );
}
