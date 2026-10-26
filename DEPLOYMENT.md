# DrainWatch AI — Deployment Runbook

This document covers everything needed outside the repository: Firebase
services, Google AI, environment variables, Vercel, and production smoke tests.

## 1. Firebase project

Use the existing `drainwatch-ai` project or create a new one at
[console.firebase.google.com](https://console.firebase.google.com).

### Authentication

1. Open **Build → Authentication → Get started**.
2. Enable **Email/Password**.
3. Leave self-service sign-up exposed only if you intend to create staff that
   way; the app itself does not show a sign-up form.
4. Create staff accounts under **Authentication → Users**.
5. Copy each staff user's UID.
6. In **Firestore → Data**, create a `staff` collection and a document whose ID
   is the UID. Add `active: true` (boolean). Optionally add `name` and `email`
   for operators; the rules use `active`.
7. After deploying, add the production domain and any Vercel preview domains
   under **Authentication → Settings → Authorized domains**.

Accounts without a matching active `staff/{uid}` document can sign in but cannot
read incident data. The app shows a "Staff access not provisioned" screen.

### Firestore

1. Open **Build → Firestore Database → Create database**.
2. Choose a permanent region close to your users.
3. Start in **Production mode**. Test-mode rules are not suitable for this app.
4. The first deploy creates the database if it does not exist.

### Storage

1. Open **Build → Storage → Get started**.
2. Choose the same region as Firestore.
3. Cloud Storage for Firebase requires the **Blaze** plan for new usage as of
   February 2026. No-cost usage still applies within the current quotas, but a
   billing account must be linked. If this is unacceptable, replace the Storage
   photo pipeline with another image host before launch.
4. The bucket name must match `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`.

### Deploy rules

From the repository root:

```bash
firebase login
firebase use drainwatch-ai
firebase deploy --only firestore:rules,firestore:indexes,storage
```

Files used:
- `firestore.rules`
- `firestore.indexes.json`
- `storage.rules`
- `firebase.json`

The Firestore and Storage rules are not emulator-tested yet. The first deploy
validates syntax against the existing database and bucket; use a staging project
before production. Storage rules require Storage to be enabled.

## 2. Gemini

1. Open [aistudio.google.com/apikey](https://aistudio.google.com/apikey).
2. Create an API key in the same Google Cloud project if offered.
3. Set it as `GOOGLE_GENERATIVE_AI_API_KEY` in `.env.local` and Vercel.
4. Optionally set `GEMINI_MODEL`; the default is `gemini-2.5-flash`.

The key is server-only. Never prefix it with `NEXT_PUBLIC_`.

If no key is present, `/api/classify` returns the deterministic fallback
classifier and the UI labels it as a rule-based suggestion. The same key enables
`/api/briefing`; without it, the briefing card still works and labels the output
as a rule-based draft.

Google Maps handoff links do not use this key. They open `google.com/maps` with a
coordinate and require no API activation, billing account, or Maps JavaScript API
key.

## 3. Environment variables

| Variable | Local | Vercel | Notes |
|---|---|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Required | Required | Firebase web config. |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Required | Required | Firebase web config. |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Required | Required | Firebase web config. |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Required | Required | Enables photo upload. |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Required | Required | Firebase web config. |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Required | Required | Firebase web config. |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Optional | Optional | Server-only Gemini key. |
| `GEMINI_MODEL` | Optional | Optional | Defaults to `gemini-2.5-flash`. |
| `NEXT_PUBLIC_SITE_URL` | Recommended | Required | Public production origin, e.g. `https://drainwatch.example`. |
| `NEXT_PUBLIC_MAP_STYLE_URL` | Optional | Optional | MapLibre style override. |

`NEXT_PUBLIC_SITE_URL` must not end with a slash.

## 4. Local production check

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run build
npm start
```

Then open `http://localhost:3000` and verify the smoke test below.

With Firebase configured and a staff test account in `.env.local`, run:

```bash
npm run verify:firebase
```

This read-only check signs in, confirms the `staff/{uid}` allow-list is active,
and verifies staff and public Firestore reads. It never writes data or prints
tokens.

## 5. Vercel deployment

1. Import the Git repository into Vercel.
2. Add every environment variable to **Production** and **Preview**.
3. Deploy.
4. Add the deployed hostname to Firebase Auth authorized domains.
5. Redeploy if `NEXT_PUBLIC_SITE_URL` changed after the build.

CLI alternative:

```bash
vercel link
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY production
# Repeat for every variable, then:
vercel --prod
```

## 6. Production smoke test

- [ ] Landing page loads; photography is served as optimized JPEG/WebP.
- [ ] `/report` submits without a staff login.
- [ ] Anonymous submission uploads one compressed cover photo to
      `public-incident-photos/`.
- [ ] A signed-in reporter can add up to three photos; extra images go to
      `incident-photos/` and require auth to upload and read.
- [ ] Both `incidents/{id}` and `publicIncidents/{id}` are created.
- [ ] Anonymous visitors can read the cover photo but not the extra evidence
      photos.
- [ ] The public map shows the report and the hotspot list updates.
- [ ] Reporter contact details are absent from `publicIncidents`.
- [ ] `/login` works with a provisioned staff account; wrong credentials show a
      safe error.
- [ ] A signed-in account without `staff/{uid}` sees the access gate.
- [ ] `/dashboard` redirects anonymous visitors to `/login`.
- [ ] Staff can search/filter incidents, apply or dismiss AI, move status one
      stage at a time, and resolve with a note of at least five characters.
- [ ] Incident detail and hotspot cards open the correct location in Google
      Maps; the links work without a Google Maps API key.
- [ ] On `/dashboard/hotspots`, **Generate briefing** returns either a Gemini
      draft or a clearly labelled rule-based draft. The briefing must be
      advisory and must not claim a crew was dispatched.
- [ ] The briefing network request contains only hotspot id, label, score,
      counts, top category, and days since the newest report. It must not
      contain reporter names, phone numbers, emails, descriptions, or photo
      URLs.
- [ ] With no Gemini key, both AI routes return fallback output rather than an
      error.
- [ ] Skipping a stage or moving backwards is rejected by the dashboard.
- [ ] Status changes appear on the public map and in the detail audit trail.
- [ ] Response headers include `X-Content-Type-Options`, `X-Frame-Options`,
      `Referrer-Policy`, `Permissions-Policy`, HSTS, and `X-Powered-By` is
      absent.
- [ ] CSV exports download and contain the expected scope.
- [ ] `/map?incident=<id>` and `/map?hotspot=<id>` focus correctly.
- [ ] `/sitemap.xml` and `/robots.txt` use the production URL.
- [ ] Unknown routes render the custom 404.
- [ ] Gemini calls are server-side only; the API key is absent from client
      network responses and bundles.

## 7. Troubleshooting

- **`auth/unauthorized-domain`**: add the exact deployment hostname to Firebase
  Auth authorized domains.
- **`permission-denied` in Firestore**: confirm rules were deployed to the same
  project and that `staff/{uid}` exists with `active: true` for the signed-in
  user's UID.
- **Photo upload fails**: confirm Storage is enabled, the bucket env var is
  correct, and the project is on Blaze if required.
- **Map is blank**: check browser network access to OpenFreeMap or set
  `NEXT_PUBLIC_MAP_STYLE_URL` to a reachable style.
- **No AI key**: fallback classification and briefing are expected; either add
  the key or document fallback-only behavior for the pilot.
- **Briefing falls back with a key configured**: check the Gemini API key,
  `GEMINI_MODEL`, billing/quota, and server logs. The route degrades to the
  deterministic briefing instead of failing the dashboard.
- **Metadata points at localhost**: set `NEXT_PUBLIC_SITE_URL` and rebuild.
