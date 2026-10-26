"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { KeyRound, ShieldX } from "lucide-react";
import { useAuth } from "./auth-provider";
import { Card } from "@/components/ui/card";
import { LoadingBlock } from "@/components/ui/feedback";
import { Button, LinkButton } from "@/components/ui/button";

export const POST_LOGIN_PATH_KEY = "drainwatch:post-login";

export function FirebaseNotConfigured() {
  return (
    <div className="mx-auto max-w-xl px-4 py-20">
      <Card className="p-8">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-warning-50 text-warning-600">
          <KeyRound className="h-5 w-5" aria-hidden="true" />
        </span>
        <h1 className="mt-5 text-xl font-semibold text-teal-900">
          Firebase is not configured
        </h1>
        <p className="mt-2 text-sm leading-6 text-ink-600">
          Add the <code className="rounded bg-ink-100 px-1 py-0.5 text-xs">NEXT_PUBLIC_FIREBASE_*</code>{" "}
          environment variables to enable staff sign-in, incident storage, and
          the hotspot map.
        </p>
        <p className="mt-3 text-sm leading-6 text-ink-500">
          See <code className="rounded bg-ink-100 px-1 py-0.5 text-xs">DEPLOYMENT.md</code>{" "}
          and <code className="rounded bg-ink-100 px-1 py-0.5 text-xs">.env.example</code>{" "}
          for the full list.
        </p>
        <LinkButton href="/" variant="outline" className="mt-6">
          Back to home
        </LinkButton>
      </Card>
    </div>
  );
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { configured, loading, user, staff, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!configured || loading || user) return;

    try {
      sessionStorage.setItem(POST_LOGIN_PATH_KEY, pathname);
    } catch {
      // Ignore storage failures; the default post-login destination still works.
    }

    router.replace("/login");
  }, [configured, loading, user, pathname, router]);

  if (!configured) return <FirebaseNotConfigured />;

  if (loading) {
    return <LoadingBlock label="Checking your staff session…" />;
  }

  if (!user) {
    return <LoadingBlock label="Redirecting to sign in…" />;
  }

  if (!staff) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20">
        <Card className="p-8">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-critical-50 text-critical-600">
            <ShieldX className="h-5 w-5" aria-hidden="true" />
          </span>
          <h1 className="mt-5 text-xl font-semibold text-teal-900">
            Staff access not provisioned
          </h1>
          <p className="mt-2 text-sm leading-6 text-ink-600">
            This account can sign in but is not on the staff allow-list. Ask an
            administrator to add a document with your user ID to the{" "}
            <code className="rounded bg-ink-100 px-1 py-0.5 text-xs">staff</code>{" "}
            collection in Firestore.
          </p>
          <p className="mt-3 text-sm leading-6 text-ink-500">
            Signed in as {user.email ?? user.uid}.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                void signOut().then(() => router.replace("/login"));
              }}
            >
              Sign out
            </Button>
            <LinkButton href="/" variant="ghost">
              Back to home
            </LinkButton>
          </div>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
