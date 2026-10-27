"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { isLanguage, translate, type Language } from "@/lib/i18n";

const LANGUAGE_KEY = "drainwatch:lang";
const listeners = new Set<() => void>();

function readStoredLanguage(): Language {
  try {
    const stored = localStorage.getItem(LANGUAGE_KEY);
    return isLanguage(stored) ? stored : "en";
  } catch {
    return "en";
  }
}

function getServerSnapshot(): Language {
  return "en";
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

function writeStoredLanguage(next: Language) {
  try {
    localStorage.setItem(LANGUAGE_KEY, next);
  } catch {
    // Ignore storage failures.
  }
  listeners.forEach((listener) => listener());
}

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const language = useSyncExternalStore(subscribe, readStoredLanguage, getServerSnapshot);

  const setLanguage = useCallback((next: Language) => {
    writeStoredLanguage(next);
  }, []);

  const t = useCallback((key: string) => translate(language, key), [language]);

  const value = useMemo<LanguageContextValue>(
    () => ({ language, setLanguage, t }),
    [language, setLanguage, t],
  );

  return <LanguageContext value={value}>{children}</LanguageContext>;
}

export function useLanguage(): LanguageContextValue {
  const value = useContext(LanguageContext);
  if (!value) {
    throw new Error("useLanguage must be used inside LanguageProvider.");
  }
  return value;
}
