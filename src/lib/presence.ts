import {
  onDisconnect,
  onValue,
  ref,
  serverTimestamp,
  set,
  type Unsubscribe,
} from "firebase/database";
import { getFirebaseRealtimeDb } from "./firebase";

export type PresenceEntry = {
  online: boolean;
  lastChanged: number;
};

/**
 * Marks a staff member online and arranges for the Realtime Database itself
 * to flip them offline on disconnect (tab close, crash, lost network), which
 * a client-side cleanup effect cannot guarantee. Internal/staff-only: never
 * call this or read "presence" from the public report flow.
 */
export function startPresenceHeartbeat(uid: string): () => void {
  const presenceRef = ref(getFirebaseRealtimeDb(), `presence/${uid}`);
  let cancelled = false;

  const offlineOnDisconnect = onDisconnect(presenceRef).set({
    online: false,
    lastChanged: serverTimestamp(),
  });

  void offlineOnDisconnect.then(() => {
    if (cancelled) return;
    void set(presenceRef, { online: true, lastChanged: serverTimestamp() });
  });

  return () => {
    cancelled = true;
    void onDisconnect(presenceRef).cancel();
    void set(presenceRef, { online: false, lastChanged: Date.now() });
  };
}

/** Staff-only: counts currently online colleagues. Never expose this count publicly. */
export function subscribeOnlineStaffCount(
  next: (count: number) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  return onValue(
    ref(getFirebaseRealtimeDb(), "presence"),
    (snapshot) => {
      const value = (snapshot.val() ?? {}) as Record<string, PresenceEntry>;
      const count = Object.values(value).filter((entry) => entry?.online).length;
      next(count);
    },
    (error) => onError(error),
  );
}
