"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Menu, X } from "lucide-react";
import { Logo } from "./logo";
import { LinkButton } from "@/components/ui/button";
import { LANGUAGES } from "@/lib/i18n";
import { useLanguage } from "./language-provider";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/", key: "nav.home" },
  { href: "/#about", key: "nav.about" },
  { href: "/#insights", key: "nav.insights" },
  { href: "/#contact", key: "nav.contact" },
] as const;

function LanguageSwitcher({ className }: { className?: string }) {
  const { language, setLanguage } = useLanguage();

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {LANGUAGES.map((option, index) => {
        const active = language === option.value;
        return (
          <span key={option.value} className="flex items-center gap-1">
            {index > 0 ? <span className="text-ink-300" aria-hidden="true">|</span> : null}
            <button
              type="button"
              onClick={() => setLanguage(option.value)}
              aria-pressed={active}
              aria-label={option.label}
              className={cn(
                "rounded-md px-1.5 py-1 text-xs uppercase tracking-wide transition-colors",
                active ? "font-bold text-teal-900" : "font-medium text-ink-500 hover:text-teal-900",
              )}
            >
              {option.value}
            </button>
          </span>
        );
      })}
    </div>
  );
}

export function Navbar() {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-ink-100 bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" onClick={() => setOpen(false)}>
          <Logo />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-ink-700 transition-colors hover:text-teal-900"
            >
              {t(link.key)}
            </Link>
          ))}
          <LanguageSwitcher />
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <LinkButton href="/report" size="sm">
            {t("nav.report")}
            <ArrowRight className="h-4 w-4" />
          </LinkButton>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-ink-700 md:hidden"
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-ink-100 bg-background px-4 pb-6 pt-2 md:hidden">
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-ink-700 hover:bg-ink-50"
              >
                {t(link.key)}
              </Link>
            ))}
          </nav>
          <LanguageSwitcher className="mt-3 px-3" />
          <LinkButton href="/report" className="mt-4 w-full" onClick={() => setOpen(false)}>
            {t("nav.report")}
            <ArrowRight className="h-4 w-4" />
          </LinkButton>
        </div>
      )}
    </header>
  );
}
