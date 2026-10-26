import { Droplets } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ className, dark }: { className?: string; dark?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-semibold", className)}>
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
        <Droplets className="h-4.5 w-4.5" strokeWidth={2.25} />
      </span>
      <span className={cn("text-lg tracking-tight", dark ? "text-white" : "text-teal-900")}>
        DrainWatch <span className="text-brand-600">AI</span>
      </span>
    </span>
  );
}
