import { cn } from "@/lib/utils";
import type { ComponentPropsWithoutRef } from "react";

export function Card({ className, ...props }: ComponentPropsWithoutRef<"div">) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-ink-100 bg-white shadow-sm shadow-ink-900/5",
        className,
      )}
      {...props}
    />
  );
}
