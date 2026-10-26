import Link from "next/link";
import { Logo } from "./logo";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { href: "/report", label: "Report an Incident" },
      { href: "/map", label: "Hotspot Map" },
      { href: "/dashboard", label: "Operations Dashboard" },
    ],
  },
  {
    title: "Project",
    links: [
      { href: "/#about", label: "About" },
      { href: "/#insights", label: "Insights" },
      { href: "/#contact", label: "Contact" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-ink-100 bg-teal-950 text-teal-100">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr] lg:px-8">
        <div className="max-w-sm">
          <Logo dark />
          <p className="mt-4 text-sm leading-6 text-teal-300">
            AI-powered drainage hazard intelligence for a safer, more
            flood-resilient Kampala. Built for SDG 11 (Sustainable Cities) and
            SDG 13 (Climate Action).
          </p>
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
        © 2026 DrainWatch AI — a hackathon project for
        Kampala, Uganda. Demo data is clearly labeled and does not represent
        real-world outcomes.
      </div>
    </footer>
  );
}
