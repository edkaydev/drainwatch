"use client";

import { useEffect, useState } from "react";
import {
  subscribeIncident,
  subscribeIncidents,
  subscribePublicIncidents,
} from "@/lib/incidents";
import { isFirebaseConfigured } from "@/lib/firebase";
import type { Incident, PublicIncident } from "@/lib/types";

type CollectionState<T> = {
  data: T[];
  loading: boolean;
  error: string | null;
  configured: boolean;
};

function messageFor(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "permission-denied"
  ) {
    return "You do not have permission to read this data. Check the Firestore security rules.";
  }

  return "Could not load data from Firebase. Check your connection and Firestore rules.";
}

function publicMessageFor(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "permission-denied"
  ) {
    return "Public reports are not available yet. Please try again shortly.";
  }

  return "Public reports could not load. Check your connection and try again.";
}

export function useIncidents(): CollectionState<Incident> {
  const [data, setData] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(isFirebaseConfigured);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured) return;

    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    try {
      unsubscribe = subscribeIncidents(
        (incidents) => {
          setData(incidents);
          setError(null);
          setLoading(false);
        },
        (cause) => {
          setError(messageFor(cause));
          setLoading(false);
        },
      );
    } catch (cause) {
      const message = messageFor(cause);
      queueMicrotask(() => {
        if (cancelled) return;
        setError(message);
        setLoading(false);
      });
    }

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  return { data, loading, error, configured: isFirebaseConfigured };
}

export function usePublicIncidents(): CollectionState<PublicIncident> {
  const [data, setData] = useState<PublicIncident[]>([]);
  const [loading, setLoading] = useState(isFirebaseConfigured);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured) return;

    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    try {
      unsubscribe = subscribePublicIncidents(
        (incidents) => {
          setData(incidents);
          setError(null);
          setLoading(false);
        },
        (cause) => {
          setError(publicMessageFor(cause));
          setLoading(false);
        },
      );
    } catch (cause) {
      const message = publicMessageFor(cause);
      queueMicrotask(() => {
        if (cancelled) return;
        setError(message);
        setLoading(false);
      });
    }

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  return { data, loading, error, configured: isFirebaseConfigured };
}

export function useIncident(incidentId: string): {
  incident: Incident | null;
  loading: boolean;
  error: string | null;
  configured: boolean;
} {
  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(
    isFirebaseConfigured && Boolean(incidentId),
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured || !incidentId) return;

    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    try {
      unsubscribe = subscribeIncident(
        incidentId,
        (next) => {
          setIncident(next);
          setError(next ? null : "This incident could not be found.");
          setLoading(false);
        },
        (cause) => {
          setError(messageFor(cause));
          setLoading(false);
        },
      );
    } catch (cause) {
      const message = messageFor(cause);
      queueMicrotask(() => {
        if (cancelled) return;
        setError(message);
        setLoading(false);
      });
    }

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [incidentId]);

  return {
    incident: incidentId ? incident : null,
    loading: Boolean(incidentId) && loading,
    error: incidentId ? error : null,
    configured: isFirebaseConfigured,
  };
}
