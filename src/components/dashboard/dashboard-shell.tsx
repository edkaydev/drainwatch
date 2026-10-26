"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  ChevronDown,
  ClipboardList,
  FileBarChart,
  LayoutDashboard,
  LogOut,
  MapPinned,
  Menu,
  Search,
  Settings,
  X,
} from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { useAuth } from "@/components/auth/auth-provider";
import { cn } from "@/lib/utils";
import { initials } from "@/lib/format";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/incidents", label: "Incidents", icon: ClipboardList },
  { href: "/dashboard/hotspots", label: "Hotspots", icon: MapPinned },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/reports", label: "Reports", icon: FileBarChart },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

function pageTitle(pathname: string): string {
  if (pathname === "/dashboard") return "Operations overview";
  if (/^\/dashboard\/incidents\/[^/]+$/.test(pathname)) return "Incident detail";
  const item = NAV_ITEMS.find(
    (nav) => nav.href !== "/dashboard" && pathname.startsWith(nav.href),
  );
  return item?.label ?? "Dashboard";
}

export function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  const displayName = user?.displayName?.trim() || user?.email || "Staff member";
  const email = user?.email ?? "";

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  async function handleSignOut() {
    await signOut();
    router.replace("/login");
  }

  return (
    <div className="min-h-screen bg-background">
      {open ? (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-teal-950/40 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-teal-950 text-teal-100 transition-transform duration-200 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
        aria-label="Staff navigation"
      >
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
          <Link
            href="/dashboard"
            aria-label="DrainWatch AI dashboard"
            onClick={() => setOpen(false)}
          >
            <Logo dark />
          </Link>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-teal-300 hover:bg-white/10 lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-teal-500">
            Operations
          </p>
          {NAV_ITEMS.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-brand-600 text-white shadow-sm"
                    : "text-teal-200 hover:bg-white/10 hover:text-white",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-3">
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-teal-300 transition-colors hover:bg-white/10 hover:text-white"
          >
            <MapPinned className="h-4 w-4" aria-hidden="true" />
            View public site
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-teal-300 transition-colors hover:bg-white/10 hover:text-white"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Sign out
          </button>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-ink-100 bg-background/90 px-4 backdrop-blur sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-ink-700 hover:bg-ink-100 lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>

          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-400">
              DrainWatch AI
            </p>
            <h1 className="truncate text-sm font-semibold text-teal-900">
              {pageTitle(pathname)}
            </h1>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/dashboard/incidents"
              className="hidden items-center gap-2 rounded-full border border-ink-200 bg-white px-3.5 py-2 text-sm text-ink-500 shadow-sm transition-colors hover:text-ink-900 sm:flex"
            >
              <Search className="h-4 w-4" aria-hidden="true" />
              Search incidents
            </Link>

            <details className="group relative">
              <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full border border-ink-200 bg-white py-1 pl-1 pr-2.5 shadow-sm transition-colors hover:bg-ink-50 [&::-webkit-details-marker]:hidden">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white">
                  {initials(displayName) || "S"}
                </span>
                <span className="hidden max-w-32 truncate text-sm font-medium text-ink-800 sm:block">
                  {displayName}
                </span>
                <ChevronDown className="h-4 w-4 text-ink-400" aria-hidden="true" />
              </summary>

              <div className="absolute right-0 top-12 w-64 rounded-xl border border-ink-100 bg-white p-2 shadow-lg shadow-ink-900/10">
                <div className="rounded-lg bg-ink-50 px-3 py-2.5">
                  <p className="truncate text-sm font-medium text-ink-800">{displayName}</p>
                  {email ? (
                    <p className="mt-0.5 truncate text-xs text-ink-500">{email}</p>
                  ) : null}
                </div>
                <Link
                  href="/dashboard/settings"
                  className="mt-1 flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-700 hover:bg-ink-50"
                >
                  <Settings className="h-4 w-4" aria-hidden="true" />
                  Account settings
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-critical-600 hover:bg-critical-50"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  Sign out
                </button>
              </div>
            </details>
          </div>
        </header>

        <main id="main-content" className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
