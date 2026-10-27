# DrainWatch rebrand audit

Scope: remove "AI" from the public product name everywhere it appears as
branding (`DrainWatch AI` → `DrainWatch`), while leaving technical
identifiers, Gemini/AI functionality, and application behaviour untouched.

## Method

1. Captured `git status` before editing (see "Pre-existing changes" below —
   none of those were touched for this pass unless explicitly noted).
2. Searched the whole repository case-insensitively for `DrainWatch AI`,
   `DrainwatchAI`, `Drain Watch AI`, and the hyphenated `drainwatch-ai`, across
   every file type (not just source — docs, config, assets).
3. Classified every match as either public-facing branding (fix) or a
   technical identifier (leave alone, per the brief).
4. Edited only the public-facing matches, in place.
5. Re-ran the same repo-wide search to confirm nothing was missed, then ran
   typecheck, lint, tests, and a production build.
6. Verified rendered output (page titles, navbar, login page) in an actual
   browser, screenshotted, not just by reading source.

## Public-facing branding updates completed

| File | Change |
|---|---|
| `src/components/layout/logo.tsx` | Wordmark now renders plain "DrainWatch" (removed the separate green "AI" span). Icon mark (the D-shaped channel + hotspot glyph) is unchanged — it never said "AI" in the first place. |
| `src/app/layout.tsx` | `<title>` default/template, `applicationName`, Open Graph `siteName`/`title`, Twitter `title` all changed to "DrainWatch". Also reworded the meta description to lead with the civic-reporting value ("Community-powered drainage hazard reporting and explainable hotspot intelligence…") rather than leading with "AI-assisted", per the brief's guidance that AI is a supporting capability, not the headline. |
| `src/app/manifest.ts` | PWA manifest `name` → "DrainWatch" (`short_name` was already "DrainWatch"). |
| `src/app/dashboard/layout.tsx` | Dashboard page-title template → "%s — DrainWatch Operations". |
| `src/app/loading.tsx` | "Loading DrainWatch…" |
| `src/app/error.tsx`, `src/app/global-error.tsx` | Error-page branding and home-link aria-label. |
| `src/app/login/page.tsx` | "Sign in to DrainWatch", both home-link aria-labels. |
| `src/components/dashboard/dashboard-shell.tsx` | Sidebar aria-label and the small "DrainWatch" label above the page title. |
| `src/lib/incidents.ts` | The fallback `byName` shown in an incident's status history when no name is recorded (an existing, pre-rebrand fallback — not new behaviour). |
| `src/lib/i18n.ts` | Footer copyright line, English and Luganda. |
| `src/app/icon.svg` | Swapped in the approved no-AI icon source (identical glyph/colors; only the accessible `<title>` text changed from "DrainWatch AI icon" to "DrainWatch icon"). |
| `src/app/apple-icon.png`, `public/icons/icon-192.png`, `public/icons/icon-512.png` | Regenerated from the new asset pack. Byte-identical to what was already there, because the icon artwork itself never contained the word "AI" — only confirmed, no visible change. |
| `README.md`, `TODO.md`, `DEPLOYMENT.md` | Title headers. README's intro paragraph reworded the same way as the meta description. |

Audio scripts, the report form's call/WhatsApp buttons, and the support-request
card already said plain "DrainWatch" (an earlier pass in this session had
already dropped "AI" from those) — confirmed, no change needed.

## Logo and asset status

- A new asset pack (`drainwatch-logo-assets.zip`, dropped in the repo root)
  contains the approved no-AI lockup: identical icon glyph and palette to the
  previous pack, wordmark text simply reads "DrainWatch". Its README confirms
  "the wordmark remains live text for easy editing" — exactly the pattern
  already in use in `logo.tsx` (inline SVG icon + live `<span>` text), so no
  raster lockup image needed to be embedded; the existing live-text component
  was just edited to drop the "AI" span.
- The older `drainwatch-ai-logo-assets.zip` is still in the repo root
  (untracked). Left in place rather than deleted, since it's the user's own
  dropped-in file, not mine to remove unasked. Safe to delete once confirmed
  unneeded — nothing in the app references it.
- Full lockup files (`drainwatch-primary-light/dark.svg/png`,
  `drainwatch-monochrome.*`) from the new pack were not copied into the repo:
  nothing currently uses a baked lockup image, and the live-text approach is
  more maintainable (matches the asset README's own recommendation). Available
  in the zip if a future design needs a flattened lockup image.

## Remaining references to the old brand — and why

None found. A final repo-wide, case-insensitive search for `DrainWatch AI`,
`DrainwatchAI`, `Drain Watch AI`, and `drainwatch-ai` (unfiltered by file
type) after all edits returned zero matches outside of:
- The two logo-asset `.zip` archives (source design files, not app code).
- The three technical identifiers listed below.

## Technical identifiers intentionally preserved

Per the brief's instruction not to rename working identifiers for branding
alone:

| Identifier | Where | Why preserved |
|---|---|---|
| `drainwatch-ai` | `package.json` `"name"` field | npm package name; renaming has no user-facing effect and risks tooling assumptions elsewhere. |
| `drainwatch-ai` | `DEPLOYMENT.md`, as a Firebase project-ID example (`firebase use drainwatch-ai`) | Illustrative Firebase project ID in deployment instructions — not a real project ID in use (the actual linked project is `drainwatch-3a1f5`), and project IDs are explicitly called out as off-limits for renaming. |
| `DRAINWATCH_STAFF_EMAIL`, `DRAINWATCH_STAFF_PASSWORD`, `DRAINWATCH_APP_URL` | `.env.example`, `scripts/verify-firebase.mjs` | Environment variable names. Note these never contained "AI" to begin with, so no decision was even needed here. |
| Repository directory name, GitHub repo name | Filesystem / remote | Not renamed — out of scope for a content edit, and renaming a GitHub repo changes its URL, breaking the existing remote and any external links. Flagged here per the brief's "stop and report" instruction for anything with external-integration risk; no change made. |

No Firestore collection names, Storage bucket paths, Firebase project IDs, API
routes, or stored data fields were touched.

## Tests run and results

All run after the rebrand edits, in the actual repository:

- `npx tsc --noEmit` — clean, no errors.
- `npm run lint` (ESLint) — clean, no errors or warnings.
- `npm test` (Vitest) — **91/91 tests passing**, 11 test files.
- `npm run build` (production Next.js build) — succeeded, all 22 routes
  compiled (including the icon/manifest/apple-icon routes).
- Manual browser verification (Playwright, temporary dev dependency, removed
  afterward — `package.json`/`package-lock.json` confirmed untouched):
  page `<title>` on `/`, `/report`, `/map`, and `/login` all read "DrainWatch"
  with no "AI"; navbar and login-page screenshots visually confirmed.

## Regressions found and fixed

None. The rebrand touched only string literals (titles, labels, aria-labels,
one JSX span) and two binary icon files whose content turned out to be
unchanged. No logic, routing, data shape, or styling was altered.

## Pre-existing changes not part of this rebrand pass

`git status` before this pass already showed several modified files from
earlier work this session and a concurrent session (Kiro) — motion/animation
work (`globals.css`, `page.tsx`, `button.tsx`), the location-search feature
(`geocode.ts`, `location-search.tsx`), the map rendering fix
(`public-hotspot-map.tsx`), and files neither of us had touched directly
(`firestore.rules`, `incident-detail-view.tsx`, `status-badges.tsx`,
`types.ts`, `tests/stats.test.ts`, `tests/status.test.ts`). None of those were
further modified for the rebrand; they're listed here only so this audit
doesn't take credit for work outside its scope.

## Manual actions still required

- **None for the rebrand itself** — it's fully applied and verified in code.
- Separately (not caused by this rebrand): the `supportRequests` Firestore
  rule and other recent `firestore.rules` changes are committed to git but
  have not been deployed to the live Firebase project (`firebase deploy
  --only firestore:rules,firestore:indexes`). That's a pre-existing,
  previously-flagged gap, unrelated to branding.
- Nothing in this pass was committed, pushed, or deployed, per instructions.
  All changes are local, working-tree edits only.
