"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  Database,
  ExternalLink,
  KeyRound,
  LogOut,
  Settings,
  ShieldCheck,
  Sparkles,
  User,
  XCircle,
} from "lucide-react";
import { PageHeader } from "./page-header";
import { Card } from "@/components/ui/card";
import { Alert, Spinner } from "@/components/ui/feedback";
import { Badge } from "@/components/ui/badge";
import { Button, LinkButton } from "@/components/ui/button";
import { useAuth } from "@/components/auth/auth-provider";
import { initials } from "@/lib/format";

export function SettingsView({ aiConfigured }: { aiConfigured: boolean }) {
  const { user, signOut, resetPassword } = useAuth();
  const router = useRouter();

  const [resetPending, setResetPending] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);

  const displayName = user?.displayName?.trim() || user?.email || "Staff member";
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "";
  const bucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "";
  const consoleUrl = projectId
    ? `https://console.firebase.google.com/project/${projectId}/authentication/users`
    : "https://console.firebase.google.com/";

  async function handleReset() {
    if (!user?.email) return;
    setResetPending(true);
    setResetError(null);
    setResetMessage(null);

    try {
      await resetPassword(user.email);
      setResetMessage(`Password reset email sent to ${user.email}.`);
    } catch (cause) {
      setResetError(cause instanceof Error ? cause.message : "Could not send the reset email.");
    } finally {
      setResetPending(false);
    }
  }

  async function handleSignOut() {
    await signOut();
    router.replace("/login");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Settings"
        title="Account & system"
        description="Your staff session, connected services, and the guardrails this deployment relies on."
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-lg font-semibold text-white">
              {initials(displayName) || "S"}
            </span>
            <div className="min-w-0">
              <h2 className="truncate font-semibold text-teal-900">{displayName}</h2>
              <p className="truncate text-sm text-ink-500">{user?.email}</p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                <Badge variant="success">Signed in</Badge>
                {user?.emailVerified ? (
                  <Badge variant="info">Email verified</Badge>
                ) : (
                  <Badge variant="warning">Email unverified</Badge>
                )}
              </div>
            </div>
          </div>

          <dl className="mt-6 space-y-3 border-t border-ink-100 pt-5 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-ink-500">Staff UID</dt>
              <dd className="truncate font-mono text-xs text-ink-800">{user?.uid}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ink-500">Sign-in provider</dt>
              <dd className="text-xs text-ink-800">
                {user?.providerData.map((provider) => provider.providerId).join(", ") ||
                  "password"}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ink-500">Last sign-in</dt>
              <dd className="text-xs text-ink-800">{user?.metadata.lastSignInTime ?? "—"}</dd>
            </div>
          </dl>

          {resetMessage ? (
            <Alert variant="success" className="mt-5">
              {resetMessage}
            </Alert>
          ) : null}
          {resetError ? (
            <Alert variant="error" className="mt-5">
              {resetError}
            </Alert>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={resetPending || !user?.email}
            >
              {resetPending ? (
                <>
                  <Spinner className="h-4 w-4" />
                  Sending…
                </>
              ) : (
                <>
                  <KeyRound className="h-4 w-4" aria-hidden="true" />
                  Reset password
                </>
              )}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Sign out
            </Button>
          </div>

          <p className="mt-4 text-xs leading-5 text-ink-400">
            Staff accounts are created and disabled from the Firebase Console.
            There is deliberately no public sign-up screen.
          </p>

          <LinkButton
            href={consoleUrl}
            variant="ghost"
            size="sm"
            className="mt-3 px-0 text-brand-700 hover:bg-transparent hover:text-brand-800"
            target="_blank"
            rel="noreferrer"
          >
            Open Firebase user management
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </LinkButton>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <Settings className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-semibold text-teal-900">System configuration</h2>
              <p className="text-xs text-ink-400">Detected from the current environment</p>
            </div>
          </div>

          <ul className="mt-5 space-y-3">
            <ConfigRow
              icon={Database}
              label="Firebase project"
              value={projectId || "Configured"}
              ok
            />
            <ConfigRow
              icon={Database}
              label="Photo storage bucket"
              value={bucket || "Configured"}
              ok
            />
            <ConfigRow
              icon={Sparkles}
              label="Gemini classification"
              value={aiConfigured ? "Live model" : "Rule-based fallback"}
              ok={aiConfigured}
              fallbackLabel
            />
            <ConfigRow
              icon={ShieldCheck}
              label="Public data split"
              value="publicIncidents collection"
              ok
            />
          </ul>

          <p className="mt-5 rounded-xl bg-ink-50 px-4 py-3 text-xs leading-5 text-ink-500">
            {aiConfigured
              ? "Gemini is configured server-side. Suggestions are schema-validated and still require staff review."
              : "No Gemini key detected. Reports use the transparent rule-based classifier; add GOOGLE_GENERATIVE_AI_API_KEY to enable the model."}
          </p>

          <Link
            href="/dashboard/reports"
            className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:text-brand-800"
          >
            Go to exports
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-semibold text-teal-900">Production guardrails</h2>
            <p className="text-xs text-ink-400">What this deployment is designed to enforce</p>
          </div>
        </div>

        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          {[
            {
              title: "Staff-only dashboard",
              detail: "Firebase Auth gates the UI, and Firestore rules require an authenticated staff user to read the full incident collection.",
            },
            {
              title: "Public data is a projection",
              detail: "The public map reads publicIncidents, which never contains reporter contact details or the full description.",
            },
            {
              title: "AI is advisory",
              detail: "A suggestion never changes status or priority without an explicit staff action, and the action is written to the audit trail.",
            },
            {
              title: "Auditable status changes",
              detail: "Every status update records who changed it, when, and the action note supplied by staff.",
            },
          ].map((item) => (
            <li key={item.title} className="flex gap-3 rounded-xl border border-ink-100 p-4">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success-500" aria-hidden="true" />
              <div>
                <p className="text-sm font-medium text-ink-800">{item.title}</p>
                <p className="mt-0.5 text-xs leading-5 text-ink-500">{item.detail}</p>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-warning-50 text-warning-600">
            <User className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-semibold text-teal-900">Need another staff member?</h2>
            <p className="mt-1 text-sm leading-6 text-ink-500">
              Create their account in Firebase Authentication, then add their UID
              to the staff rule check if your deployment uses an allow-list.
              This app does not provide self-service registration.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

function ConfigRow({
  icon: Icon,
  label,
  value,
  ok,
  fallbackLabel,
}: {
  icon: typeof Database;
  label: string;
  value: string;
  ok: boolean;
  fallbackLabel?: boolean;
}) {
  return (
    <li className="flex items-center gap-3 rounded-xl border border-ink-100 px-3.5 py-3">
      <Icon className="h-4 w-4 shrink-0 text-ink-400" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-ink-500">{label}</p>
        <p className="truncate text-sm font-medium text-ink-800">{value}</p>
      </div>
      {ok ? (
        <CheckCircle2 className="h-4 w-4 shrink-0 text-success-500" aria-label="Configured" />
      ) : (
        <XCircle
          className="h-4 w-4 shrink-0 text-warning-500"
          aria-label={fallbackLabel ? "Fallback active" : "Not configured"}
        />
      )}
    </li>
  );
}
