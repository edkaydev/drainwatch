"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Home, RotateCcw } from "lucide-react";
import { Button, LinkButton } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";

export default function ErrorPage({
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
    <main
      id="main-content"
      className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-16 text-center"
    >
      <Link href="/" aria-label="DrainWatch AI home">
        <Logo />
      </Link>
      <span className="mt-10 flex h-14 w-14 items-center justify-center rounded-2xl bg-critical-50 text-critical-600">
        <AlertTriangle className="h-6 w-6" aria-hidden="true" />
      </span>
      <h1 className="mt-5 text-2xl font-semibold tracking-tight text-teal-900 sm:text-3xl">
        Something went wrong
      </h1>
      <p className="mt-3 max-w-md text-sm leading-6 text-ink-500">
        The page could not finish loading. Retry the request, or return to the
        homepage if the problem continues.
      </p>
      <div className="mt-7 flex flex-col gap-3 sm:flex-row">
        <Button type="button" onClick={() => retry()}>
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Try again
        </Button>
        <LinkButton href="/" variant="outline">
          <Home className="h-4 w-4" aria-hidden="true" />
          Back to home
        </LinkButton>
      </div>
    </main>
  );
}
