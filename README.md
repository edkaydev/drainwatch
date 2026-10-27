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
  status transitions, an attributed audit trail, and keyless Google Maps
  handoff/directions links.
- Hotspot priority list, on-demand Gemini operations briefing, and scoped CSV
  exports.
- Account and deployment status page.

## Stack

- Next.js `16.4.3` with App Router, Turbopack, Cache Components, and partial
  prefetching.
- React `19.3`, TypeScript, Tailwind CSS v4.
- Firebase Auth, Firestore, and Storage through the browser SDK.
- MapLibre GL with OpenFreeMap Liberty by default.
- Google Maps URLs for field navigation (keyless deep links, not a replacement
  basemap).
- Gemini `gemini-3.5-flash-lite` via the Interactions API through server-only route handlers (override with `GEMINI_MODEL`).
- Lucide icons.

## Google technology integrations

| Service | Working role | Status |
|---|---|---|
| Gemini API | Structured incident classification and on-demand hotspot operations briefings with strict schemas, server-side validation, timeouts, and deterministic fallbacks. | Implemented and unit-tested; a live model call needs `GOOGLE_GENERATIVE_AI_API_KEY`. |
| Firebase Authentication | Email/password staff sign-in and password reset. | Implemented; live verification needs a Firebase project and staff user. |
| Cloud Firestore | Private incident persistence, live staff subscriptions, sanitized public projections, status history, and staff audit trail. | Implemented with least-privilege rules; rules deployment and live reads are unverified here. |
| Firebase Storage | One public cover photo for anonymous reports; authenticated evidence photos. | Implemented with content, size, filename, and incident-ID checks. Cloud Storage requires Blaze billing. |
| Google Maps URLs | Keyless “Google Maps” and “Directions” handoff from incident and hotspot views. | Implemented and unit-tested. No Maps JavaScript API key or per-load billing. |

We deliberately did **not** migrate the basemap to the Google Maps JavaScript API
or move hosting to Cloud Run. MapLibre/OpenFreeMap keeps the public map keyless
and avoids per-load billing, while Google Maps URLs cover the field-navigation
need. Cloud Run would add container, Artifact Registry, and billing setup without
improving this demonstration. Both decisions should be revisited only if a pilot
partner requires Google basemap styling, traffic data, or a Google Cloud
deployment boundary.

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
| `DRAINWATCH_STAFF_EMAIL` | Local script only | Staff test account for `verify:firebase`. |
| `DRAINWATCH_STAFF_PASSWORD` | Local script only | Password for the test account. |
| `DRAINWATCH_APP_URL` | Local script only | Optional app origin for the classify-route check. |

Without a Gemini key, the app deterministically classifies reports locally and
labels the result as a fallback. Without a map style override, OpenFreeMap
Liberty is used.

## Scripts

```bash
npm run dev            # Development server
npm run build          # Production build
npm start              # Start the production build
npm run lint           # ESLint
npm run typecheck      # next typegen + tsc --noEmit
npm test               # Vitest unit and route tests
npm run verify:firebase # Read-only Firebase smoke test (needs staff test account)
```

`npm run typecheck` runs `next typegen` first because the generated route types
are required by `tsc` on a fresh clone. Running `npx tsc --noEmit` alone will
fail until typegen has run once.

## Data model

- `staff/{uid}`: staff allow-list. Document ID is the Firebase Auth UID; set
  `active` to `true`. Writes are console/admin-only.
- `incidents/{id}`: private full report, including reporter contact details,
  photo URLs, AI suggestion, status, and status history. Staff-only.
- `publicIncidents/{id}`: sanitised projection for the public map. Contains
  category, severity, title, status, location, optional first photo, and
  timestamps. Publicly readable.
- `public-incident-photos/{incidentId}/{file}`: the public cover photo. Publicly
  readable and writable by anonymous reporters, with content-type, size,
  filename, and incident-ID validation in Storage rules.
- `incident-photos/{incidentId}/{file}`: additional evidence photos. Uploads and
  reads require a signed-in user, so anonymous reporters attach one cover photo
  and signed-in reporters can attach up to three.

Statuses flow linearly through `new → triaged → in_progress → resolved`, and a
resolved incident can be reopened to `in_progress`. Both the dashboard and the
Firestore rules reject skipped stages and backwards moves. Resolving requires a
note of at least five characters. Every status or AI-review action appends an
attributed entry to `statusHistory`.

## Hotspot scoring

Reports are grouped into roughly 110 m grid cells (three decimal places). Every
cell with at least one valid report becomes a hotspot; the score is a transparent
triage aid, not a flood prediction. Scores are capped at 100:

| Component | Max | How it is calculated |
|---|---:|---|
| Recurrence | 40 | Report volume in the cell, capped at 12. Resolved reports count at 25%. |
| Severity | 30 | Severity-weighted volume, capped at 24 points. Low 1, medium 2, high 4, critical 5; resolved reports count at 25%. |
| Recency | 20 | Freshness of the newest report, decaying linearly over 180 days. |
| Active density | 10 | Number of active (unresolved) reports in the cell, capped at 5. |
| Resolved-only penalty | ×0.35 | Applied when every report in the cell is resolved. |

The dashboard shows each component next to the total, and the hotspot CSV
exports the components separately so a supervisor can audit the ranking. The
"concentration" name in code refers to active report density within the cell, not
a geographic clustering algorithm.

The ranking is tested against a count-only baseline in
`tests/hotspots-baseline.test.ts`. In that fixture, a cell with five low-severity
reports ranks first by raw count (score 53), but a cell with four critical
reports ranks first by weighted score (66). This is intentional: volume alone
can hide severity. It is still a triage heuristic, not a flood forecast.

## AI behavior

`/api/classify` sends the report text to Gemini with a strict response schema,
a 12-second timeout, server-side validation, basic in-memory rate limiting, and
a deterministic fallback. AI output is advisory: staff must explicitly apply or
dismiss a suggestion, and the decision is recorded in the audit trail.

`/api/briefing` accepts at most six hotspot summaries: cell id, public label,
score, report counts, top category, and days since the newest report. It never
sends reporter details, report descriptions, or photo URLs. The route uses a
strict schema, a 12-second timeout, server-side validation of every hotspot id
and text field, a deterministic rule-based fallback, and its own in-memory rate
limit. The dashboard generates a briefing only when staff click the button, and
labels it as an advisory draft. The deterministic score remains the ranking
source; Gemini explains the ranking and suggests verification steps.

## Security and privacy

- Reporter contact details and full descriptions are never projected to
  `publicIncidents`.
- Dashboard reads and writes require a signed-in user with an active
  `staff/{uid}` allow-list document.
- Firestore rules validate report shape, location bounds, allowed fields, the
  allowed status-transition graph, resolution notes, public projections, and
  status history.
- Storage rules restrict uploads to JPEG/PNG/WebP files up to 5 MB and validate
  filenames and incident IDs. Only the anonymous cover-photo path is publicly
  writable; additional evidence photos require authentication.
- Public reporting is intentionally unauthenticated. The cover-photo path can be
  abused within the file-size limits because Storage rules cannot count uploads
  per user. Add App Check or a server-side upload broker before high-traffic
  production use.
- `/api/classify` and `/api/briefing` are public route handlers because the app
  does not ship a Firebase Admin SDK for server-side token verification. Both
  validate input and rate-limit per instance, and the briefing accepts only
  public hotspot fields. Add App Check or a signed-in server proxy before relying
  on them at scale.
- Next.js sends `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`,
  `Permissions-Policy`, HSTS, and COOP headers, and hides `X-Powered-By`. A
  strict Content-Security-Policy is still a follow-up because it needs tuning
  for MapLibre, OpenFreeMap, Firebase, and Gemini.
- Email/password sign-up can still be called through Firebase's public Identity
  Toolkit API even when the app has no sign-up form. The `staff` allow-list is
  therefore part of the security boundary, not just a UI convenience.

## Deployment

Vercel is the intended host. Add all environment variables to the Vercel
project, deploy the Firebase rules, add the deployed domain to Firebase Auth
authorized domains, and follow the smoke test in `DEPLOYMENT.md`.

## Current limitations

- Unit and route tests cover the classifier, validation, hotspot scoring and its
  count-only baseline, stats, CSV escaping, status graph, Google Maps URL
  helpers, `/api/classify`, and `/api/briefing`. There is no browser E2E suite
  yet.
- AI route rate limiting is per-instance and in-memory, and it trusts
  `x-forwarded-for`. Use a shared store and a trusted proxy in production.
- Public cover-photo uploads have no per-user quota; see the security note above.
- Dashboard and public map subscriptions load at most 500 and 1,000 documents
  respectively and compute hotspots client-side. Move scoring to a scheduled
  aggregation before city-wide scale.
- Hotspot scores are a heuristic triage aid, not a hydrological or flood
  prediction model.
- Google Maps integration is limited to keyless Maps URLs for handoff and
  directions; the basemap remains MapLibre/OpenFreeMap.
- Map tiles depend on OpenFreeMap unless a style URL is provided.
- `firebase-tools` is required only for deploying rules, not at runtime.
