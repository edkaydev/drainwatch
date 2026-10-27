"use client";

import { Languages } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/components/layout/language-provider";
import { LANGUAGES, type Language } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * ATM-style first screen for the public report flow: forces a language
 * choice before anything else, the way a bank ATM does, instead of relying
 * on a small switcher a low-literacy user might not notice.
 */
export function LanguageGate({ onChoose }: { onChoose: (language: Language) => void }) {
  const { t, setLanguage } = useLanguage();

  function choose(language: Language) {
    setLanguage(language);
    onChoose(language);
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-4 py-10 text-center sm:px-6">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
        <Languages className="h-6 w-6" aria-hidden="true" />
      </span>
      <h1 className="mt-5 text-2xl font-semibold tracking-tight text-teal-900 sm:text-3xl">
        {t("report.languageGate.title")}
      </h1>
      <p className="mt-2 text-sm text-ink-500">{t("report.languageGate.subtitle")}</p>

      <div className="mt-8 grid w-full gap-4 sm:grid-cols-3">
        {LANGUAGES.map((option) => (
          <Card key={option.value} className="p-0">
            <button
              type="button"
              onClick={() => choose(option.value)}
              className={cn(
                "flex h-28 w-full flex-col items-center justify-center gap-2 rounded-2xl text-lg font-semibold text-teal-900 transition-colors hover:bg-brand-50 active:bg-brand-100",
              )}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-sm font-bold uppercase text-brand-700">
                {option.value}
              </span>
              {option.label}
            </button>
          </Card>
        ))}
      </div>
    </div>
  );
}
