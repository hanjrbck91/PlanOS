# PlanOS Changelog

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
