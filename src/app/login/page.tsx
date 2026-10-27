"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import {
  FirebaseNotConfigured,
  POST_LOGIN_PATH_KEY,
} from "@/components/auth/require-auth";
import { Alert, LoadingBlock, Spinner } from "@/components/ui/feedback";
import { Button, LinkButton } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { Logo } from "@/components/layout/logo";

function postLoginDestination(): string {
  try {
    const stored = sessionStorage.getItem(POST_LOGIN_PATH_KEY);
    sessionStorage.removeItem(POST_LOGIN_PATH_KEY);
    if (stored && stored.startsWith("/") && !stored.startsWith("//") && stored !== "/login") {
      return stored;
    }
  } catch {
    // Fall through to the dashboard.
  }
  return "/dashboard";
}

export default function LoginPage() {
  const { configured, loading, user, error, signIn, resetPassword } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [errorKind, setErrorKind] = useState<"signin" | "reset">("signin");
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      router.replace(postLoginDestination());
    }
  }, [user, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLocalError(null);
    setResetMessage(null);
    setPending(true);

    try {
      await signIn(email, password);
    } catch (cause) {
      setErrorKind("signin");
      setLocalError(cause instanceof Error ? cause.message : "Sign-in failed.");
    } finally {
      setPending(false);
    }
  }

  async function handleReset() {
    setLocalError(null);
    setResetMessage(null);
    setErrorKind("reset");

    if (!email.trim()) {
      setLocalError("Enter your staff email address to request a password reset.");
      return;
    }

    try {
      await resetPassword(email);
      setResetMessage("Password reset email sent. Check your inbox.");
    } catch (cause) {
      setLocalError(cause instanceof Error ? cause.message : "Could not send the reset email.");
    }
  }

  if (!configured) {
    return (
      <main id="main-content" className="min-h-screen bg-background">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-6 sm:px-6 lg:px-8">
          <Link href="/" aria-label="DrainWatch home">
            <Logo />
          </Link>
        </div>
        <FirebaseNotConfigured />
      </main>
    );
  }

  if (loading || user) {
    return (
      <main id="main-content" className="flex min-h-screen items-center justify-center bg-background">
        <LoadingBlock label={user ? "Opening your dashboard…" : "Checking your session…"} />
      </main>
    );
  }

  return (
    <main id="main-content" className="grid min-h-screen bg-background lg:grid-cols-2">
      <section className="relative hidden flex-col justify-between overflow-hidden bg-teal-950 p-10 text-white lg:flex xl:p-14">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-brand-600/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-teal-700/40 blur-3xl" />

        <Link href="/" className="relative" aria-label="DrainWatch home">
          <Logo dark />
        </Link>

        <div className="relative max-w-md">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-300">
            Staff operations
          </p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-tight">
            Review reports, confirm details, and track next steps.
          </h1>
          <p className="mt-4 text-teal-200">
            Sign in to review incoming reports, verify AI suggestions, update
            field status, and track the hotspots that need attention first.
          </p>
          <div className="mt-8 flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-teal-100">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand-300" aria-hidden="true" />
            <p>
              AI classification is advisory only. Every status change requires
              an explicit staff action and is recorded in the incident history.
            </p>
          </div>
        </div>

        <p className="relative text-xs text-teal-400">
          Built for Kampala, Uganda · SDG 11 &amp; SDG 13
        </p>
      </section>

      <section className="flex flex-col justify-center px-4 py-12 sm:px-8 lg:px-12">
        <div className="mx-auto w-full max-w-sm">
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-ink-600 transition-colors hover:text-teal-900"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to public site
          </Link>

          <div className="lg:hidden">
            <Logo />
          </div>

          <h1 className="mt-6 text-2xl font-semibold tracking-tight text-teal-900 lg:mt-0">
            Sign in to DrainWatch
          </h1>
          <p className="mt-1.5 text-sm text-ink-500">
            Use the staff account created for you by an administrator.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4" noValidate>
            {localError || error ? (
              <Alert
                variant="error"
                title={errorKind === "reset" ? "Could not request reset" : "Could not sign in"}
              >
                {localError || error}
              </Alert>
            ) : null}

            {resetMessage ? (
              <Alert variant="success">{resetMessage}</Alert>
            ) : null}

            <Field label="Email address" htmlFor="email" required>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@organisation.org"
                required
              />
            </Field>

            <Field label="Password" htmlFor="password" required>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Your password"
                  className="pr-11"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-xl text-ink-400 transition-colors hover:text-ink-700"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </Field>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handleReset}
                className="text-sm font-medium text-brand-700 hover:text-brand-800"
              >
                Forgot password?
              </button>
            </div>

            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? (
                <>
                  <Spinner className="h-4 w-4" />
                  Signing in…
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>

          <p className="mt-8 text-xs leading-5 text-ink-400">
            Need staff access? Ask your DrainWatch administrator for an
            account. Public reporting does not require sign-in.
          </p>

          <div className="mt-6 border-t border-ink-100 pt-6">
            <LinkButton href="/report" variant="outline" className="w-full">
              Report a drainage problem instead
            </LinkButton>
          </div>
        </div>
      </section>
    </main>
  );
}
