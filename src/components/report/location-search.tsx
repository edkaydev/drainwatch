"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { MapPin, Search } from "lucide-react";
import { Input } from "@/components/ui/form";
import { useLanguage } from "@/components/layout/language-provider";
import { searchPlaces, type GeocodeResult } from "@/lib/geocode";
import { cn } from "@/lib/utils";

export function LocationSearch({ onSelect }: { onSelect: (result: GeocodeResult) => void }) {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const requestIdRef = useRef(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const trimmed = query.trim();
    // Short queries show no dropdown at all (see `showDropdown` below), so
    // there is nothing to reset here — just skip starting a search.
    if (trimmed.length < 3) return;

    const requestId = ++requestIdRef.current;
    const timer = setTimeout(() => {
      setLoading(true);
      searchPlaces(trimmed).then((found) => {
        if (requestIdRef.current !== requestId) return;
        setResults(found);
        setActiveIndex(-1);
        setLoading(false);
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function choose(result: GeocodeResult) {
    onSelect(result);
    setQuery(result.label);
    setOpen(false);
    setResults([]);
    setActiveIndex(-1);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!showDropdown) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) =>
        results.length === 0 ? -1 : (index + 1) % results.length,
      );
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) =>
        results.length === 0 ? -1 : index <= 0 ? results.length - 1 : index - 1,
      );
    } else if (event.key === "Enter") {
      const result = results[activeIndex];
      if (result) {
        event.preventDefault();
        choose(result);
      }
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  const trimmed = query.trim();
  const showDropdown = open && trimmed.length >= 3;

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
          aria-hidden="true"
        />
        <Input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={t("report.location.searchPlaceholder")}
          className="pl-10"
          aria-label={t("report.location.searchPlaceholder")}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showDropdown}
          aria-controls="location-search-results"
          aria-activedescendant={
            activeIndex >= 0 ? `location-search-option-${activeIndex}` : undefined
          }
        />
      </div>

      {showDropdown ? (
        <ul
          id="location-search-results"
          role="listbox"
          aria-label={t("report.location.searchPlaceholder")}
          className="absolute z-20 mt-1.5 w-full overflow-hidden rounded-xl border border-ink-200 bg-white py-1 shadow-lg shadow-ink-900/10"
        >
          {loading ? (
            <li className="px-4 py-2.5 text-sm text-ink-500">{t("report.location.searching")}</li>
          ) : results.length === 0 ? (
            <li className="px-4 py-2.5 text-sm text-ink-500">
              {t("report.location.searchNoResults")}
            </li>
          ) : (
            results.map((result, index) => (
              <li
                key={`${result.lat}-${result.lng}-${index}`}
                id={`location-search-option-${index}`}
                role="option"
                aria-selected={index === activeIndex}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(result)}
                className={cn(
                  "flex cursor-pointer items-start gap-2 px-4 py-2.5 text-left text-sm text-ink-700",
                  index === activeIndex ? "bg-ink-50" : "hover:bg-ink-50",
                )}
              >
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
                {result.label}
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
