#!/usr/bin/env node
/**
 * Read-only Firebase smoke test.
 *
 * Verifies that the web app credentials work, the staff test account can sign
 * in, the allow-list document is active, and Firestore rules permit the
 * expected staff and public reads. It never writes data and never prints
 * tokens or passwords.
 *
 * Usage:
 *   npm run verify:firebase
 *
 * Required environment variables (see .env.example):
 *   NEXT_PUBLIC_FIREBASE_API_KEY
 *   NEXT_PUBLIC_FIREBASE_PROJECT_ID
 *   DRAINWATCH_STAFF_EMAIL
 *   DRAINWATCH_STAFF_PASSWORD
 */

const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const email = process.env.DRAINWATCH_STAFF_EMAIL;
const password = process.env.DRAINWATCH_STAFF_PASSWORD;

const missing = [
  ["NEXT_PUBLIC_FIREBASE_API_KEY", apiKey],
  ["NEXT_PUBLIC_FIREBASE_PROJECT_ID", projectId],
  ["DRAINWATCH_STAFF_EMAIL", email],
  ["DRAINWATCH_STAFF_PASSWORD", password],
]
  .filter(([, value]) => !value)
  .map(([name]) => name);

if (missing.length > 0) {
  console.error(
    `Missing environment variables: ${missing.join(", ")}.\n` +
      "Add them to .env.local or export them before running this script.",
  );
  process.exit(1);
}

const checks = [];

function pass(name, detail = "") {
  checks.push({ name, detail, ok: true });
  console.log(`PASS  ${name}${detail ? ` — ${detail}` : ""}`);
}

function fail(name, detail) {
  checks.push({ name, detail, ok: false });
  console.error(`FAIL  ${name} — ${detail}`);
}

async function readError(response) {
  try {
    const body = await response.json();
    return body?.error?.message || JSON.stringify(body).slice(0, 300);
  } catch {
    return `HTTP ${response.status}`;
  }
}

async function signIn() {
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    },
  );

  if (!response.ok) {
    throw new Error(`Staff sign-in failed: ${await readError(response)}`);
  }

  const data = await response.json();
  if (!data.idToken || !data.localId) {
    throw new Error("Staff sign-in succeeded but returned no token or UID.");
  }

  return { idToken: data.idToken, uid: data.localId };
}

async function checkStaffDocument(idToken, uid) {
  const response = await fetch(
    `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents/staff/${encodeURIComponent(uid)}`,
    { headers: { authorization: `Bearer ${idToken}` } },
  );

  if (response.status === 404) {
    throw new Error(
      `No staff/${uid} document exists. Create it in Firestore with { active: true }.`,
    );
  }

  if (!response.ok) {
    throw new Error(`Could not read staff/${uid}: ${await readError(response)}`);
  }

  const data = await response.json();
  const active = data?.fields?.active?.boolean === true;

  if (!active) {
    throw new Error(
      `staff/${uid} exists but active is not true. Set active: true before using the dashboard.`,
    );
  }

  return uid;
}

async function checkCollection(idToken, name, expectStaff) {
  const response = await fetch(
    `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents/${name}?pageSize=1`,
    expectStaff ? { headers: { authorization: `Bearer ${idToken}` } } : {},
  );

  if (!response.ok) {
    throw new Error(
      `${name} read failed (${expectStaff ? "staff" : "public"}): ${await readError(response)}`,
    );
  }

  const data = await response.json();
  const count = Array.isArray(data.documents) ? data.documents.length : 0;
  return `${count} document${count === 1 ? "" : "s"} visible`;
}

async function main() {
  let session;
  try {
    session = await signIn();
    pass("Staff sign-in", `${email}`);
  } catch (cause) {
    fail("Staff sign-in", cause instanceof Error ? cause.message : "unknown error");
    finish();
    return;
  }

  try {
    await checkStaffDocument(session.idToken, session.uid);
    pass("Staff allow-list", `staff/${session.uid} is active`);
  } catch (cause) {
    fail(
      "Staff allow-list",
      cause instanceof Error ? cause.message : "unknown error",
    );
  }

  try {
    const detail = await checkCollection(session.idToken, "publicIncidents", false);
    pass("Public projection read", detail);
  } catch (cause) {
    fail(
      "Public projection read",
      cause instanceof Error ? cause.message : "unknown error",
    );
  }

  try {
    const detail = await checkCollection(session.idToken, "incidents", true);
    pass("Private incident read (staff)", detail);
  } catch (cause) {
    fail(
      "Private incident read (staff)",
      cause instanceof Error ? cause.message : "unknown error",
    );
  }

  const appUrl = process.env.DRAINWATCH_APP_URL;
  if (appUrl) {
    try {
      const response = await fetch(`${appUrl.replace(/\/$/, "")}/api/classify`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          description: "Smoke test: a drain is blocked with rubbish.",
        }),
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      pass("Classification route", `source=${data.source}`);
    } catch (cause) {
      fail(
        "Classification route",
        cause instanceof Error ? cause.message : "unknown error",
      );
    }
  }

  finish();
}

function finish() {
  const failed = checks.filter((check) => !check.ok);
  console.log(
    `\n${checks.length - failed.length}/${checks.length} checks passed.`,
  );
  if (failed.length > 0) process.exit(1);
}

main().catch((cause) => {
  console.error("Unexpected verification failure:", cause);
  process.exit(1);
});
