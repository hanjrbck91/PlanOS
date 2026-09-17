# PlanOS Changelog

Factual record of implementation changes. "Tested" means actually executed. Static/
syntax checks are recorded separately and are not "tested".

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
