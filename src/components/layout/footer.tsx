"use client";

import Link from "next/link";
import { Logo } from "./logo";
import { useLanguage } from "./language-provider";

export function Footer() {
  const { t } = useLanguage();

  const COLUMNS = [
    {
      title: t("footer.product"),
      links: [
        { href: "/report", label: t("nav.report") },
        { href: "/dashboard", label: t("footer.links.dashboard") },
      ],
    },
    {
      title: t("footer.project"),
      links: [
        { href: "/#about", label: t("nav.about") },
        { href: "/#insights", label: t("nav.insights") },
        { href: "/#contact", label: t("nav.contact") },
      ],
    },
  ];

  return (
    <footer className="border-t border-ink-100 bg-teal-950 text-teal-100">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr] lg:px-8">
        <div className="max-w-sm">
          <Logo dark />
          <p className="mt-4 text-sm leading-6 text-teal-300">{t("footer.tagline")}</p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h3 className="text-sm font-semibold text-white">{col.title}</h3>
            <ul className="mt-4 space-y-3">
              {col.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-teal-300 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-teal-800/60 px-4 py-6 text-center text-xs text-teal-400 sm:px-6 lg:px-8">
        {t("footer.copyright")}
      </div>
    </footer>
  );
}
