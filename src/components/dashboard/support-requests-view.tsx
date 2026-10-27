"use client";

import { useEffect, useState } from "react";
import { MessageCircle, Phone, User } from "lucide-react";
import { PageHeader } from "./page-header";
import { Card } from "@/components/ui/card";
import { Alert, EmptyState, LoadingBlock } from "@/components/ui/feedback";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/auth-provider";
import { isFirebaseConfigured } from "@/lib/firebase";
import {
  claimSupportRequest,
  resolveSupportRequest,
  subscribeSupportRequests,
  type SupportRequest,
} from "@/lib/support-requests";
import { formatRelativeTime } from "@/lib/format";

const STATUS_LABEL: Record<SupportRequest["status"], string> = {
  open: "New",
  claimed: "In progress",
  resolved: "Resolved",
};

const STATUS_VARIANT: Record<SupportRequest["status"], "warning" | "info" | "success"> = {
  open: "warning",
  claimed: "info",
  resolved: "success",
};

export function SupportRequestsView() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [loading, setLoading] = useState(isFirebaseConfigured);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured) return;

    const unsubscribe = subscribeSupportRequests(
      (next) => {
        setRequests(next);
        setError(null);
        setLoading(false);
      },
      () => {
        setError("Could not load support requests. Check your connection and Firestore rules.");
        setLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  async function handleClaim(requestId: string) {
    if (!user) return;
    setBusyId(requestId);
    try {
      await claimSupportRequest(requestId, {
        uid: user.uid,
        name: user.displayName?.trim() || user.email || "Staff member",
      });
    } finally {
      setBusyId(null);
    }
  }

  async function handleResolve(requestId: string) {
    if (!user) return;
    setBusyId(requestId);
    try {
      await resolveSupportRequest(requestId, {
        uid: user.uid,
        name: user.displayName?.trim() || user.email || "Staff member",
      });
    } finally {
      setBusyId(null);
    }
  }

  const open = requests.filter((request) => request.status !== "resolved");
  const resolved = requests.filter((request) => request.status === "resolved");

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Live"
        title="Support requests"
        description="Messages from reporters who could not finish the public form. Never shown publicly."
      />

      {!isFirebaseConfigured ? (
        <Alert variant="warning" title="Not connected">
          Firebase environment variables are missing, so support requests cannot be loaded.
        </Alert>
      ) : error ? (
        <Alert variant="error" title="Could not load requests">
          {error}
        </Alert>
      ) : loading ? (
        <LoadingBlock label="Loading support requests…" />
      ) : requests.length === 0 ? (
        <EmptyState
          icon={MessageCircle}
          title="No support requests yet"
          description="When a reporter sends a message from the public report form, it appears here."
        />
      ) : (
        <div className="space-y-6">
          <div className="space-y-3">
            {open.length === 0 ? (
              <p className="text-sm text-ink-500">No open requests right now.</p>
            ) : (
              open.map((request) => (
                <Card key={request.id} className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <Badge variant={STATUS_VARIANT[request.status]}>
                      {STATUS_LABEL[request.status]}
                    </Badge>
                    <span className="text-xs text-ink-400">
                      {formatRelativeTime(request.createdAt)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-ink-700">{request.message}</p>
                  {request.contactName || request.contactPhone ? (
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-ink-500">
                      {request.contactName ? (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" aria-hidden="true" />
                          {request.contactName}
                        </span>
                      ) : null}
                      {request.contactPhone ? (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" aria-hidden="true" />
                          {request.contactPhone}
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                  {request.claimedByName ? (
                    <p className="mt-2 text-xs text-ink-400">
                      Claimed by {request.claimedByName}
                    </p>
                  ) : null}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {request.status === "open" ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={busyId === request.id}
                        onClick={() => handleClaim(request.id)}
                      >
                        Claim
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      size="sm"
                      disabled={busyId === request.id}
                      onClick={() => handleResolve(request.id)}
                    >
                      Mark resolved
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>

          {resolved.length > 0 ? (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-400">
                Resolved
              </h3>
              <div className="mt-2 space-y-2">
                {resolved.map((request) => (
                  <Card key={request.id} className="p-4 opacity-70">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <Badge variant={STATUS_VARIANT[request.status]}>
                        {STATUS_LABEL[request.status]}
                      </Badge>
                      <span className="text-xs text-ink-400">
                        {formatRelativeTime(request.createdAt)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-ink-700">{request.message}</p>
                  </Card>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
