# DrainWatch AI — Implementation Status

Last updated: 2026-10-26

## Verified in this environment

- [x] `npm run lint`
- [x] `npm run typecheck` (`next typegen && tsc --noEmit`)
- [x] `npm test` — 72 tests across 7 files
- [x] `npm run build` — all public, dashboard, and API routes compile
- [x] `npm audit` — 0 vulnerabilities after the MapLibre 6 and
      `@grpc/grpc-js` upgrade
- [x] `.env.example` exists and matches the variables the code reads
- [x] Security headers are configured in `next.config.ts`

Not verified here because there are no Firebase credentials or deployed URL:

- [ ] Firestore and Storage rules dry-run/deploy
- [ ] Live Auth, Firestore, Storage, and Gemini round trip
- [ ] Browser smoke test against a deployed build

## Implemented

### Foundation
- [x] Design tokens, layout, typography, buttons, cards, badges, forms,
      feedback, focus states, and reduced-motion support.
- [x] Guarded Firebase client initialization.
- [x] Domain types, validation, deterministic classifier, hotspot scoring,
      stats, CSV helpers, image compression, and formatting utilities.
- [x] Auth provider and protected dashboard guard.
- [x] Repository hygiene: `.gitignore`, `.env.example`, build artifacts and
      local secrets excluded.

### Public experience
- [x] Landing page with compressed production photography.
- [x] Three-step report form with validation, photo previews/upload, geolocation,
      map pin, duplicate-submission cooldown, and success state.
- [x] Anonymous reporters attach one cover photo; signed-in reporters can attach
      up to three, with additional evidence stored privately.
- [x] Public MapLibre hotspot map with filters, hotspot ranking, incident
      selection, score breakdown, and URL deep links.

### Staff experience
- [x] Responsive dashboard shell and navigation.
- [x] Overview, incidents, incident detail, hotspots, analytics, reports, and
      settings views.
- [x] Live Firestore subscriptions.
- [x] Linear status workflow (`new → triaged → in_progress → resolved`) with
      reopen support, enforced in the UI, the data layer, and Firestore rules.
- [x] Resolution note required before resolving.
- [x] AI suggestion apply/dismiss workflow.
- [x] Scoped CSV exports with a sensitive-data warning and hotspot score
      components.

### AI and data
- [x] Server-only Gemini route with schema validation, timeout, fallback, and
      basic rate limiting.
- [x] `incidents` and sanitized `publicIncidents` split.
- [x] Firestore rules for validated public creates, staff reads/updates,
      matched public projections, status transitions, resolution notes, and
      status-history append validation.
- [x] Storage rules for image type, size, filename, and incident-ID
      restrictions; private evidence photos require authentication.
- [x] Firebase config, indexes, and environment example.

### Quality and security
- [x] Vitest suite for the classifier, validation, hotspot scoring, stats, CSV
      escaping, status graph, and `/api/classify`.
- [x] `npm run verify:firebase` read-only smoke test.
- [x] Explainable hotspot breakdown in the dashboard, public map, and CSV.
- [x] Corrected copy that no longer overstates geographic concentration or
      claims hotspots need multiple reports.
- [x] Security headers and `poweredByHeader: false`.
- [x] MapLibre 6.16.0 and a patched `@grpc/grpc-js`; clean `npm audit`.

### Production plumbing
- [x] Error boundary, global error boundary, loading UI, and custom 404.
- [x] Robots and sitemap routes.
- [x] Firebase Storage image allow-list in `next.config.ts`.
- [x] README, deployment runbook, and asset compression.

## Remaining before production

### P0 — environment and deployment
- [ ] Enable Firestore and Storage in the Firebase Console.
- [ ] Upgrade to Blaze if required for Cloud Storage.
- [ ] Deploy `firestore.rules`, `firestore.indexes.json`, and `storage.rules`.
- [ ] Create staff users and a `staff/{uid}` document with `active: true` for
      each one.
- [ ] Add the deployed domain to Firebase Auth authorized domains.
- [ ] Set all Vercel environment variables, including `NEXT_PUBLIC_SITE_URL`.
- [ ] Add a Gemini API key, or explicitly accept fallback-only classification.
- [ ] Run `npm run verify:firebase` against the real project.
- [ ] Run the manual browser pass in `DEPLOYMENT.md`.

### P1 — robustness
- [ ] Add Firebase rules tests with the emulator suite (unauthenticated create,
      forged `ai` field, skipped status, resolve without note, public projection
      drift).
- [ ] Add Playwright E2E coverage for report → dashboard → resolve → public map.
- [ ] Replace the in-memory classifier rate limiter with a shared store and
      trusted client identity.
- [ ] Add App Check, or move anonymous photo uploads behind a server endpoint
      with a quota.
- [ ] Add a Content-Security-Policy and test it against MapLibre, OpenFreeMap,
      Firebase, and Gemini.

### P2 — scale and pilot readiness
- [ ] Move hotspot scoring to a scheduled aggregation instead of loading up to
      1,000 documents in each browser.
- [ ] Add pagination or server-side search for the incident register.
- [ ] Add a seeded, clearly labeled demo dataset for presentations.
- [ ] Add a feedback loop for false AI classifications.
- [ ] Add a KCCA/FixMyStreet/Open311 export adapter if a pilot partner requires
      it.
