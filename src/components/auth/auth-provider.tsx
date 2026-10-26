"use client";

import {
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getDb, getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase";

type AuthContextValue = {
  configured: boolean;
  loading: boolean;
  user: User | null;
  staff: boolean | null;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function friendlyAuthError(code: string): string {
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "That email and password combination is not correct.";
    case "auth/invalid-email":
      return "Enter a valid email address.";
    case "auth/too-many-requests":
      return "Too many attempts. Wait a few minutes and try again.";
    case "auth/user-disabled":
      return "This staff account has been disabled. Contact an administrator.";
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again.";
    default:
      return "Sign-in failed. Check your credentials and try again.";
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [staff, setStaff] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(isFirebaseConfigured);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured) return;

    let cancelled = false;

    const unsubscribe = onAuthStateChanged(
      getFirebaseAuth(),
      async (nextUser) => {
        if (cancelled) return;
        setUser(nextUser);

        if (!nextUser) {
          setStaff(null);
          setLoading(false);
          return;
        }

        setLoading(true);
        try {
          const snapshot = await getDoc(doc(getDb(), "staff", nextUser.uid));
          if (cancelled) return;
          setError(null);
          setStaff(snapshot.exists() && snapshot.data().active !== false);
        } catch {
          if (cancelled) return;
          setStaff(false);
          setError("Could not verify staff access. Check the Firestore staff collection.");
        } finally {
          if (!cancelled) setLoading(false);
        }
      },
      () => {
        if (cancelled) return;
        setError("Could not reach Firebase Authentication.");
        setLoading(false);
      },
    );

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setError(null);
    try {
      await signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
    } catch (cause) {
      const code =
        typeof cause === "object" && cause !== null && "code" in cause
          ? String((cause as { code?: string }).code)
          : "";
      const message = friendlyAuthError(code);
      setError(message);
      throw new Error(message);
    }
  }, []);

  const signOut = useCallback(async () => {
    setError(null);
    setStaff(null);
    await firebaseSignOut(getFirebaseAuth());
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    setError(null);
    try {
      await sendPasswordResetEmail(getFirebaseAuth(), email.trim());
    } catch (cause) {
      const code =
        typeof cause === "object" && cause !== null && "code" in cause
          ? String((cause as { code?: string }).code)
          : "";
      const message = friendlyAuthError(code);
      setError(message);
      throw new Error(message);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      configured: isFirebaseConfigured,
      loading,
      user,
      staff,
      error,
      signIn,
      signOut,
      resetPassword,
    }),
    [loading, user, staff, error, signIn, signOut, resetPassword],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }
  return value;
}
