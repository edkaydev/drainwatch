# DrainWatch AI

AI-assisted drainage hazard reporting and hotspot intelligence for Kampala.
Residents report blocked drains, flooding, open manholes, and related hazards;
staff triage them from a protected operations dashboard; and a public map shows
sanitised incident data plus explainable hotspot scores.

## Features

### Public site
- Landing page with the reporting and hotspot concept.
- Three-step report flow: details, location, review and submit.
- Photo attachment with browser-side compression before upload.
- Geolocation capture or an interactive MapLibre pin.
- Deterministic rule-based classification fallback and optional Gemini review.
- Public MapLibre map with severity/status filters, hotspot ranking, and
  deep links via `/map?incident=<id>` or `/map?hotspot=<id>`.

### Staff dashboard
- Firebase email/password sign-in, password reset, and protected routes.
- Live incident overview, trend charts, status and severity breakdowns.
- Searchable/filterable incident register with CSV export.
- Incident detail with photos, reporter contact details, AI advisory review,
  status transitions, and an attributed audit trail.
- Hotspot priority list and scoped CSV exports.
- Account and deployment status page.

## Stack

- Next.js `16.4.3` with App Router, Turbopack, Cache Components, and partial
  prefetching.
- React `19.3`, TypeScript, Tailwind CSS v4.
- Firebase Auth, Firestore, and Storage through the browser SDK.
- MapLibre GL with OpenFreeMap Liberty by default.
- Gemini `gemini-2.5-flash` through a server-only route handler.
- Lucide icons.

## Quick start

```bash
npm install
cp .env.example .env.local
# Fill in the Firebase values and optional Gemini key.
npm run dev
```

Open `http://localhost:3000`.

If Firebase is not configured, public pages still render and the report form
remains reviewable, but submissions, the live map data, and the dashboard are
disabled with an explicit warning.

## Firebase setup

1. Create or open a Firebase project.
2. Enable **Authentication → Email/Password**.
3. Create **Firestore** in production mode. Do not use open test-mode rules.
4. Create a **Cloud Storage** bucket for incident photos. As of February 2026,
   new Cloud Storage for Firebase usage requires the Blaze plan; usage can
   still remain within no-cost limits, but a billing account is required.
5. Add a staff user under **Authentication → Users**.
6. In Firestore, create `staff/{uid}` using the user's UID as the document ID
   and an `active: true` field. Only active allow-listed staff can read or
   update incident data.
7. Add any custom deployment domains under **Authentication → Settings →
   Authorized domains**.
8. Deploy the rules in this repository:

```bash
firebase login
firebase use <your-project-id>
firebase deploy --only firestore:rules,firestore:indexes,storage
```

Firestore indexes: queries only order each collection by `createdAt`, so no
composite index is currently required.

## Environment variables

See `.env.example` for the complete list.

| Variable | Scope | Purpose |
|---|---|---|
| `NEXT_PUBLIC_FIREBASE_*` | Browser | Firebase web app configuration. |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Server only | Gemini classification. Never expose this. |
| `GEMINI_MODEL` | Server only | Optional model override. |
| `NEXT_PUBLIC_SITE_URL` | Browser/build | Canonical URL for metadata, robots, and sitemap. |
| `NEXT_PUBLIC_MAP_STYLE_URL` | Browser | Optional MapLibre style override. |

Without a Gemini key, the app deterministically classifies reports locally and
labels the result as a fallback. Without a map style override, OpenFreeMap
Liberty is used.

## Scripts

```bash
npm run dev      # Development server
npm run build    # Production build
npm start        # Start the production build
npm run lint     # ESLint
npx tsc --noEmit # TypeScript check
```

## Data model

- `staff/{uid}`: staff allow-list. Document ID is the Firebase Auth UID; set
  `active` to `true`. Writes are console/admin-only.
- `incidents/{id}`: private full report, including reporter contact details,
  photo URLs, AI suggestion, status, and status history. Staff-only.
- `publicIncidents/{id}`: sanitised projection for the public map. Contains
  category, severity, title, status, location, optional first photo, and
  timestamps. Publicly readable.
- `public-incident-photos/{incidentId}/{file}`: the public cover photo. Publicly
  readable; creations are type/size limited by Storage rules.
- `incident-photos/{incidentId}/{file}`: additional evidence photos. Readable
  only by signed-in staff.

Statuses flow through `new → triaged → in_progress → resolved`. Every status or
AI-review action appends an attributed entry to `statusHistory`.

## AI behavior

`/api/classify` sends the report text to Gemini with a strict response schema,
a 12-second timeout, server-side validation, basic in-memory rate limiting, and
a deterministic fallback. AI output is advisory: staff must explicitly apply or
dismiss a suggestion, and the decision is recorded in the audit trail.

## Security and privacy

- Reporter contact details and full descriptions are never projected to
  `publicIncidents`.
- Dashboard reads and writes require a signed-in user with an active
  `staff/{uid}` allow-list document.
- Firestore rules validate report shape, location bounds, allowed fields,
  status transitions, public projections, and status history.
- Storage rules restrict uploads to JPEG/PNG/WebP files up to 5 MB. Only the
  first photo is published; additional evidence photos require staff auth.
- Public reporting is intentionally unauthenticated. Storage upload abuse is
  limited by file validation but not by application-level rate limiting.
- Email/password sign-up can still be called through Firebase's public Identity
  Toolkit API even when the app has no sign-up form. The `staff` allow-list is
  therefore part of the security boundary, not just a UI convenience.

## Deployment

Vercel is the intended host. Add all environment variables to the Vercel
project, deploy the Firebase rules, add the deployed domain to Firebase Auth
authorized domains, and follow the smoke test in `DEPLOYMENT.md`.

## Current limitations

- No automated end-to-end test suite yet; production build, ESLint, and
  TypeScript checks pass.
- AI route rate limiting is per-instance and in-memory. Use a shared store for
  multi-instance production traffic.
- Public photo uploads have no user-level quota.
- Map tiles depend on OpenFreeMap unless a style URL is provided.
- `firebase-tools` is required only for deploying rules, not at runtime.
