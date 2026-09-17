# PlanOS Changelog

## 2026-09-17 (blocking live bug: frontend not updating after add)

### Observed (live, deployed V0)
- After adding a Today plan, the row was written to the `Plans` sheet but the UI still
  showed `0/0` / "Nothing planned yet"; users resubmitted and produced duplicate rows.
  Duplicate rows also appeared in `Reflections`. CSV export and writes worked.

### Root cause
- Google Sheets auto-coerces an appended `'yyyy-MM-dd'` string into a real **Date**
  cell. `readRows_` serializes any Date via `toISOString()` (UTC), so the `date` field
  comes back as a full ISO timestamp, never equal to the `'yyyy-MM-dd'` key. Every
  **exact-match** date compare failed:
  - `getBootstrap` today/tomorrow (and reflection) filters → always empty → `0/0`,
    nothing rendered; users retried → duplicate `Plans` rows.
  - `saveReflection` dedup lookup → never matched → duplicate `Reflections` rows.
  - `saveReview_` / weekly / monthly key matches had the same fragility.
- The frontend, `google.script.run` chain, success callbacks and `render()` were all
  correct — proven by the initial load rendering the styled UI (empty list, not an
  error). This was a backend date-matching bug, not a callback bug.

### Fixed
- `Code.gs`: added `dayKey_(v)` (normalizes any stored date/week value to a
  `'yyyy-MM-dd'` key in the script timezone; passes through values already in that form)
  and `monthKeyOf_(v)`. Replaced all exact date/week/month comparisons in
  `getBootstrap`, `saveReflection`, `getWeeklySummary`, `getMonthlySummary`, and
  `saveReview_` (via a normalizer arg) with these helpers. Also fixes a latent
  timezone-boundary error in the monthly filter (previously `String(r.date).slice(0,7)`
  on a UTC timestamp).
- No frontend change. No workaround UX (no optimistic updates, no reload/polling).

### Deployment implication
- `Code.gs` changed → a **new Apps Script deployment version is required** for the fix
  to reach the live web app (Manage deployments → edit → New version). `Index.html`
  unchanged.

### Data impact
- No existing data modified. Pre-existing duplicate test rows were left in place (real
  user data); the PM can remove them manually. After redeploy those existing same-day
  rows will now render.

### Tests
- Static: `Code.gs` passes `node --check`.
- Local: simulated `readRows_` output (Sheets Date-coercion → UTC ISO) and ran the new
  filter logic — today/tomorrow now populate and separate correctly; week/month keys
  recover the intended local day; plain `'yyyy-MM-dd'` values pass through unchanged.
- Live: **not performed** — no access to the PM's deployed app / Google account from
  this environment. Root cause established from code + the provided Sheet screenshots
  (same-day rows with `0/0`; duplicate rows in Plans and Reflections).


## 2026-09-17 (mobile-first UI redesign)

### Changed
- `Index.html` fully restyled: mobile-first modular tile/card layout, retro
  "digital instrument" visual language (charcoal base; terracotta Today hero, cream
  Tomorrow, brown Reflection; muted olive accents; chunky monospace headings/labels,
  system-sans body — no external fonts). Desktop is a responsive 2-column expansion
  (Today spans full width). Single-page scroll model preserved (no new navigation).
- Plan rows: compact status button + name + status label + delete; status glyphs
  now ○ planned / ✓ done / ◐ partial / – skipped / → moved (visual only).
- Add-plan input made compact with an adjacent `+` button; Enter-to-add on both
  Today and Tomorrow inputs.
- Reflection restyled as a deliberate "close the day" card (same prompt, no scoring).
- Review/Export moved into two compact secondary tiles; Review reveals the existing
  weekly/monthly panel (now styled, counts unchanged).
- Toast replaces `alert()`-style status messages for save/export feedback and errors.
- Added a small done/total count on Today and an item count on Tomorrow — derived
  from existing status data (display only, no new metric/score/chart).

### Fixed
- Added `<meta charset="utf-8">` so status/dash/arrow glyphs render correctly
  regardless of server charset headers.

### Not changed
- No new features. No categories/tags, charts, scores, streaks, quotes, settings, or
  navigation from the reference image were implemented (visual language only).
- `Code.gs` unchanged. Data model, status model, date logic, review calculations, and
  CSV structure unchanged. All 11 `google.script.run` calls preserved with same args.

### Tested
- Static: `Code.gs` `node --check`; `Index.html` inline script parses; verified all
  element ids and all 11 backend calls present.
- Local/visual: rendered `Index.html` with a stubbed `google.script.run` over a local
  HTTP server in the in-app browser. Verified Today/Tomorrow/Reflection/Review render
  with sample data (incl. a plan with an apostrophe and one with a backslash), status
  glyphs, and the Review toggle. Checked layout at 360 / 375 / 1100 px — no horizontal
  overflow (`scrollWidth == innerWidth` at 360).

### Not tested (requires live deployment)
- Actual Apps Script read/write round-trips (add/edit/delete/status, reflections,
  weekly/monthly saves) and CSV download — behavior unchanged from the previously
  accepted V0, but not re-run live in this environment.


Factual record of implementation changes. "Tested" means actually executed. Static/
syntax checks are recorded separately and are not "tested".

## 2026-09-17 (real-world validation start)

### Added
- `PLANOS_VALIDATION.md` — PM's 7-day observation log for the real-world experiment.

### Changed
- `PLANOS_CONTEXT.md` — added a Project status block: MVP COMPLETE, deployment PASSED,
  acceptance test PASSED, real-world validation IN PROGRESS, development FEATURE FREEZE.
- `PLANOS_DEV_PROMPT.md` — added an active feature-freeze rule for the validation period.

### Status
- PM live acceptance test: PASSED.
- V0 has entered a 7-day real-world validation period.
- Feature development is frozen during validation.
- Note: behavioral usefulness of the core loop is **not yet validated** — that is the
  purpose of this period.

### Code
- No application code changed (`Code.gs`, `Index.html` untouched).

## 2026-09-17 (deployment prep)

### Added
- `PLANOS_ACCEPTANCE_TEST.md` — PM checklist for validating the deployed app.

### Changed
- `README.md` — full non-developer deployment walkthrough (manifest visibility, file
  creation, `setup()`, authorization, Web App deploy with recommended "Only myself"
  access, timezone note, re-deploy note) plus an explicit validation-status section.

### Audit (no code changes needed)
- Deployment-readiness audit: PASS. All frontend `google.script.run` calls map to
  existing backend functions with matching arguments (`getBootstrap`, `addPlan`,
  `updatePlan`, `setPlanStatus`, `deletePlan`, `saveReflection`, `getWeeklySummary`,
  `saveWeeklyReflection`, `getMonthlySummary`, `saveMonthlyReflection`, `exportCsv`).
  Statuses consistent; week = Monday; month = `yyyy-MM`; CSV headers match schema;
  `setup()` verified non-destructive; no malformed failure handlers; no stale names.

### Noted (not changed — deployment consideration)
- `appsscript.json` `webapp.access` default is `ANYONE_WITH_GOOGLE_ACCOUNT`. For
  personal use the PM should choose "Only myself" in the deploy dialog (documented in
  README). The dialog choice governs the actual deployment; manifest left unchanged to
  avoid scope creep.

## 2026-09-17

### Added
- Weekly review: `getWeeklySummary()`, `saveWeeklyReflection()`, `WeeklyReviews` sheet.
- Monthly review: `getMonthlySummary()`, `saveMonthlyReflection()`, `MonthlyReviews` sheet.
- `setup()` now creates the `WeeklyReviews` and `MonthlyReviews` sheets idempotently.
- `exportCsv()` now exports all four sheets (plans, reflections, weekly, monthly).
- UI: footer "Review" toggle revealing weekly + monthly panels (status counts + free-text
  reflection). Hidden by default so Today stays primary.
- Project documentation: `PLANOS_CONTEXT.md`, `PLANOS_DECISIONS.md`,
  `PLANOS_CHANGELOG.md`, `PLANOS_DEV_PROMPT.md`.
- Git repository initialized with `.gitignore`.

### Changed
- Replaced the inline status-allowlist in `setPlanStatus` with a shared `STATUSES`
  constant, reused by `countStatuses_`.
- README updated to describe weekly/monthly reviews and the four-sheet data model.

### Fixed
- Frontend load path: malformed `.withFailureHandler(err).alert(...)` chain that would
  throw on any load error. Replaced with a proper `err()` failure handler; all
  `google.script.run` calls now use it (no more `[object Object]` alerts).
- `edit()` broke on any plan containing an apostrophe or backslash: the plan text was
  embedded inside an inline `onclick` attribute, and HTML-entity decoding reintroduced
  the quote before JS parsing. `edit()` now receives only the plan `id` and looks the
  text up from client state; no user text is embedded in attributes.

### Tested
- None live. Google Apps Script was not deployed or executed in this environment.

### Not tested (requires live deployment)
- `setup()` sheet creation on a real Spreadsheet.
- All read/write round-trips (add/edit/delete/status, reflections, weekly/monthly saves).
- CSV download in a browser.
- Weekly/monthly count correctness against real rows.

### Static validation performed
- `Code.gs` passes `node --check` (as plain JS).
- `Index.html` inline script parses via `new Function(...)`.
- Reviewed client↔server function name/argument consistency by hand.
