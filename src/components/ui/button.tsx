import { cn } from "@/lib/utils";
import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";

const VARIANTS = {
  primary:
    "bg-brand-600 text-white hover:bg-brand-700 shadow-sm shadow-brand-900/10",
  dark: "bg-teal-900 text-white hover:bg-teal-800",
  outline:
    "border border-ink-200 bg-white text-ink-800 hover:bg-ink-50",
  ghost: "text-ink-700 hover:bg-ink-100",
} as const;

const SIZES = {
  sm: "h-9 px-3.5 text-sm gap-1.5",
  md: "h-11 px-5 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2",
} as const;

type BaseProps = {
  variant?: keyof typeof VARIANTS;
  size?: keyof typeof SIZES;
  className?: string;
};

type ButtonProps = BaseProps & ComponentPropsWithoutRef<"button">;
type LinkButtonProps = BaseProps & ComponentPropsWithoutRef<typeof Link>;

const base =
  "inline-flex items-center justify-center rounded-full font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap";

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(base, VARIANTS[variant], SIZES[size], className)}
      {...props}
    />
  );
}

export function LinkButton({
  variant = "primary",
  size = "md",
  className,
  ...props
}: LinkButtonProps) {
  return (
    <Link
      className={cn(base, VARIANTS[variant], SIZES[size], className)}
      {...props}
    />
  );
}
