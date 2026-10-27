"use client";

import { useEffect, useState } from "react";
import { startPresenceHeartbeat, subscribeOnlineStaffCount } from "@/lib/presence";
import { isPresenceConfigured } from "@/lib/firebase";

/**
 * Marks the current staff member online for as long as this hook is mounted,
 * and reports how many staff (including this one) are currently online.
 * Staff/dashboard-only — never used on the public report flow.
 */
export function useStaffPresence(uid: string | undefined): { onlineCount: number | null } {
  const [onlineCount, setOnlineCount] = useState<number | null>(null);

  useEffect(() => {
    if (!isPresenceConfigured || !uid) return;
    return startPresenceHeartbeat(uid);
  }, [uid]);

  useEffect(() => {
    if (!isPresenceConfigured) return;

    const unsubscribe = subscribeOnlineStaffCount(
      (count) => setOnlineCount(count),
      () => setOnlineCount(null),
    );

    return unsubscribe;
  }, []);

  return { onlineCount };
}
