# DrainWatch AI — Implementation Status

Last updated: 2026-10-26

## Verified

- [x] `npm run lint`
- [x] `npx tsc --noEmit`
- [x] `npm run build`
- [x] Production build routes include `/`, `/report`, `/map`, `/login`,
      `/dashboard`, and all dashboard sub-routes, plus `/api/classify`.
- [x] Firestore rules compile with `firebase deploy --only firestore:rules --dry-run`.
- [x] Production pages render without console errors; report flow reached review
      with fallback AI and consent validation; anonymous dashboard access
      redirects to `/login`; custom 404, robots, and sitemap respond correctly.

## Implemented

### Foundation
- [x] Design tokens, layout, typography, buttons, cards, badges, forms,
      feedback, focus states, and reduced-motion support.
- [x] Guarded Firebase client initialization.
- [x] Domain types, validation, deterministic classifier, hotspot scoring,
      stats, CSV helpers, image compression, and formatting utilities.
- [x] Auth provider and protected dashboard guard.

### Public experience
- [x] Landing page with compressed production photography.
- [x] Three-step report form with validation, photo previews/upload, geolocation,
      map pin, duplicate-submission cooldown, and success state.
- [x] Public MapLibre hotspot map with filters, hotspot ranking, incident
      selection, and URL deep links.

### Staff experience
- [x] Responsive dashboard shell and navigation.
- [x] Overview, incidents, incident detail, hotspots, analytics, reports, and
      settings views.
- [x] Live Firestore subscriptions.
- [x] Status workflow with audit history.
- [x] AI suggestion apply/dismiss workflow.
- [x] Scoped CSV exports with a sensitive-data warning.

### AI and data
- [x] Server-only Gemini route with schema validation, timeout, fallback, and
      basic rate limiting.
- [x] `incidents` and sanitized `publicIncidents` split.
- [x] Firestore rules for validated public creates, staff reads/updates,
      matched public projections, and status-history append validation.
- [x] Storage rules for image type, size, and filename restrictions, with only
      the cover photo publicly readable.
- [x] Firebase config, indexes, and environment example.

### Production plumbing
- [x] Error boundary, global error boundary, loading UI, and custom 404.
- [x] Robots and sitemap routes.
- [x] Firebase Storage image allow-list in `next.config.ts`.
- [x] README, deployment runbook, and asset compression.

## Remaining before production

- [ ] Enable Firestore and Storage in the Firebase Console.
- [ ] Upgrade to Blaze if required for Cloud Storage.
- [ ] Deploy `firestore.rules`, `firestore.indexes.json`, and `storage.rules`.
- [ ] Create staff users and a `staff/{uid}` document with `active: true` for
      each one.
- [ ] Add the deployed domain to Firebase Auth authorized domains.
- [ ] Set all Vercel environment variables, including `NEXT_PUBLIC_SITE_URL`.
- [ ] Add a Gemini API key, or explicitly accept fallback-only classification.
- [ ] Run a manual browser pass: report → photo upload → AI review → dashboard
      triage → status updates → public map → CSV export.
- [ ] Optional: add Playwright end-to-end coverage and CI.
- [ ] Optional: add a shared rate limiter.
- [ ] Optional: add a seeded, clearly labeled demo dataset for presentations.
