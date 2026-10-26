"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import "./globals.css";

export default function GlobalError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="antialiased">
        <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-critical-50 text-critical-600">
            <AlertTriangle className="h-6 w-6" aria-hidden="true" />
          </span>
          <h1 className="mt-5 text-2xl font-semibold tracking-tight text-teal-900">
            DrainWatch AI could not load
          </h1>
          <p className="mt-3 max-w-md text-sm leading-6 text-ink-500">
            A critical error interrupted the application. Retry to reload the
            interface.
          </p>
          <button
            type="button"
            onClick={() => retry()}
            className="mt-7 inline-flex h-11 items-center justify-center rounded-full bg-brand-600 px-5 text-sm font-medium text-white hover:bg-brand-700"
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
