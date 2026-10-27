import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { connectAuthEmulator, getAuth, type Auth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore, type Firestore } from "firebase/firestore";
import { connectDatabaseEmulator, getDatabase, type Database } from "firebase/database";

const databaseURL = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "demo-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "localhost",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "demo-drainwatch",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "demo-drainwatch.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "000000000000",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:000000000000:web:demo",
  databaseURL: databaseURL || "http://localhost:9000/?ns=demo-drainwatch",
};

const useEmulators =
  process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true" ||
  (process.env.NODE_ENV === "development" && !process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);

export const isFirebaseConfigured = useEmulators
  ? true
  : [
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    ].every((value) => typeof value === "string" && value.length > 0);

// The Realtime Database URL is optional: only the internal staff presence
// indicator needs it, so its absence must not disable the rest of Firebase.
export const isPresenceConfigured =
  useEmulators ||
  (isFirebaseConfigured && typeof databaseURL === "string" && databaseURL.length > 0);

let app: FirebaseApp | undefined;
let authInstance: Auth | undefined;
let dbInstance: Firestore | undefined;
let rtdbInstance: Database | undefined;
let emulatorsConnected = false;

function getFirebaseApp(): FirebaseApp {
  if (!useEmulators && !isFirebaseConfigured) {
    throw new Error(
      "Firebase is not configured. Add the NEXT_PUBLIC_FIREBASE_* environment variables.",
    );
  }

  if (!app) {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  }

  return app;
}

export function getDb(): Firestore {
  if (dbInstance) return dbInstance;
  const firebaseApp = getFirebaseApp();
  dbInstance = getFirestore(firebaseApp);
  if (useEmulators && !emulatorsConnected) {
    try {
      connectFirestoreEmulator(dbInstance, "127.0.0.1", 8080);
    } catch {
      // Already connected or emulator not running
    }
  }
  return dbInstance;
}

export function getFirebaseAuth(): Auth {
  if (authInstance) return authInstance;
  const firebaseApp = getFirebaseApp();
  authInstance = getAuth(firebaseApp);
  if (useEmulators && !emulatorsConnected) {
    try {
      connectAuthEmulator(authInstance, "http://127.0.0.1:9099", {
        disableWarnings: true,
      });
    } catch {
      // Already connected or emulator not running
    }
  }
  return authInstance;
}

export function getFirebaseRealtimeDb(): Database {
  if (!useEmulators && !isPresenceConfigured) {
    throw new Error(
      "Realtime Database is not configured. Add NEXT_PUBLIC_FIREBASE_DATABASE_URL.",
    );
  }
  if (rtdbInstance) return rtdbInstance;
  const firebaseApp = getFirebaseApp();
  rtdbInstance = getDatabase(firebaseApp, firebaseConfig.databaseURL);
  if (useEmulators && !emulatorsConnected) {
    try {
      connectDatabaseEmulator(rtdbInstance, "127.0.0.1", 9000);
    } catch {
      // Already connected or emulator not running
    }
    emulatorsConnected = true;
  } else if (useEmulators) {
    emulatorsConnected = true;
  }
  return rtdbInstance;
}
