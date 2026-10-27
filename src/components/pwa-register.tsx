"use client";

import { useEffect } from "react";

/**
 * Registers the service worker in production only. Dev stays unregistered so
 * Turbopack's HMR bundles are never served stale from a cache.
 */
export function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Installability is a progressive enhancement; ignore failures.
    });
  }, []);

  return null;
}
