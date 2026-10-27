import { Compass, FileWarning, Home } from "lucide-react";
import { SiteShell } from "@/components/layout/site-shell";
import { LinkButton } from "@/components/ui/button";

export default function NotFound() {
  return (
    <SiteShell>
      <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center sm:px-6 sm:py-32">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
          <Compass className="h-6 w-6" aria-hidden="true" />
        </span>
        <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-brand-600">
          404 — Page not found
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-teal-900">
          This route has drained away
        </h1>
        <p className="mt-3 text-ink-600">
          The page you were looking for does not exist, or it may have moved.
          Use the links below to get back on track.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <LinkButton href="/">
            <Home className="h-4 w-4" aria-hidden="true" />
            Back to home
          </LinkButton>
          <LinkButton href="/report" variant="outline">
            <FileWarning className="h-4 w-4" aria-hidden="true" />
            Report a drainage problem
          </LinkButton>
        </div>
      </div>
    </SiteShell>
  );
}
