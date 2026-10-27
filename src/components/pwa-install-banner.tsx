"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/layout/language-provider";

const DISMISSED_KEY = "drainwatch:pwa-dismissed";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function wasDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISSED_KEY) === "true";
  } catch {
    return false;
  }
}

export function PwaInstallBanner() {
  const { t } = useLanguage();
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    function onBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      if (wasDismissed()) return;
      setPrompt(event as BeforeInstallPromptEvent);
    }
    function onInstalled() {
      setPrompt(null);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!prompt) return null;

  async function install() {
    if (!prompt) return;
    await prompt.prompt();
    await prompt.userChoice;
    setPrompt(null);
  }

  function dismiss() {
    setPrompt(null);
    try {
      localStorage.setItem(DISMISSED_KEY, "true");
    } catch {
      // Ignore storage failures; the banner just reappears next visit.
    }
  }

  return (
    <Card className="mt-6 flex animate-fade-in-up items-center gap-3 border-brand-200 bg-brand-50/60 p-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white">
        <Download className="h-5 w-5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-teal-900">{t("pwa.install.title")}</p>
        <p className="mt-0.5 text-xs leading-5 text-ink-600">{t("pwa.install.body")}</p>
      </div>
      <Button type="button" size="sm" onClick={() => void install()}>
        {t("pwa.install.cta")}
      </Button>
      <button
        type="button"
        onClick={dismiss}
        aria-label={t("pwa.install.dismiss")}
        className="shrink-0 rounded-full p-1.5 text-ink-400 transition-colors hover:bg-white hover:text-ink-600"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </Card>
  );
}
