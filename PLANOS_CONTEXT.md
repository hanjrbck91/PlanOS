# PlanOS — Project Context

Permanent project context. Read this first before working on PlanOS. It should be
enough to understand the project without reading the chat history or full Git log.

## Project status

```text
MVP implementation:      COMPLETE
Deployment validation:   PASSED
Acceptance test:         PASSED
Real-world validation:   IN PROGRESS
Development status:      FEATURE FREEZE
```

The product is feature-complete for V0 and deployed. It is now in a 7-day real-world
validation period (single user: the creator). During this period development is frozen
— see the feature-freeze rule in `PLANOS_DEV_PROMPT.md` and the observation log in
`PLANOS_VALIDATION.md`. Behavioral validation is not yet concluded.

## Product purpose

PlanOS is a deliberately simple personal planning system. It exists to answer one
question through real use:

> Does having a dedicated place to plan my day, record what actually happened, and
> reflect at night improve my execution?

The first (and only) user for V0 is the creator. The goal of V0 is **behavioral
validation**, not building a product or validating infrastructure.

## Core philosophy

Don't bring people into the application to consume the application. Bring them in to
see what they need to see, log what they need to log, and leave.

Ideal session: **Open → See Today → Log → Reflect → Prepare Tomorrow → Close.**
A normal daily interaction takes seconds. The nightly reflection ~5–10 minutes.

Do not optimize for engagement, time-in-app, gamification, notifications, or feature
discovery. PlanOS is a personal instrument, not a productivity platform.

## Core loop

Plan → Execute → Log → Reflect → Plan again.

Planning horizons: Monthly → Weekly → Daily. Execution logging happens at the daily
level. **Today is the primary screen.**

## MVP scope (what PlanOS does)

- **Today**: see today's plans; add / edit / delete; mark status.
- **Tomorrow**: see and prepare tomorrow's plans before sleeping.
- **Daily reflection**: one free-text reflection per day.
- **Weekly review**: status counts for the week + free-text weekly reflection.
- **Monthly review**: status counts for the month + free-text monthly reflection.
- **Persistence**: Google Sheets is the source of truth.
- **CSV export**: exports all underlying data.

Statuses (preserved exactly): `planned`, `done`, `partial`, `skipped`, `moved`.
A missed task is information about reality, not a moral failure.

## Non-goals (explicitly NOT in this MVP)

AI / AI planning / AI recommendations, voice input, categories/areas as a major UI
system, habit tracking, running/fitness tracking, task dependencies, project
management, Kanban, complex dashboards, productivity scores, gamification, streaks,
badges, social features, notifications, calendar integration, external integrations,
complex analytics, auth systems, extra backend infrastructure.

These may belong to future versions or separate future products. They are out of scope.

## UX principles

Minimal, calm, fast, mobile-friendly, touch-friendly, low cognitive load. No
instructions needed to understand the main screen. No dashboard feel. Reviews stay
simple and human-readable. Reflection is free text — never a questionnaire (no mood /
energy / difficulty scores, no dropdowns).

## Architecture

- Google Sheets = source of truth (V0, intentional).
- Google Apps Script = server-side API (`Code.gs`).
- Single HTML page (`Index.html`) = frontend (inline CSS + JS), served by `doGet()`.
  `doGet` sets the mobile viewport via `addMetaTag` (required for the iframe-served page
  to be mobile-first — see Decision 008).
- `appsscript.json` = manifest (timezone `Asia/Kolkata`, V8 runtime, web app config).

Data flow: `Index.html` (`google.script.run`) → Apps Script functions in `Code.gs` →
Google Sheet. All server functions that mutate return a fresh `getBootstrap()` (or a
summary object) so the client re-renders from server truth.

Do not migrate to React/Next/Firebase/Postgres/Supabase/Notion or any other stack
without explicit approval. PlanOS is the planning layer only; future domain systems
(RunnerOS, LearnOS, MemoryOS, etc.) would own their own data — PlanOS must not
duplicate them.

## Attention-target rule (permanent)

PlanOS presents the user's current attention target first. On load, **only Today is
expanded**; Tomorrow, Reflection, Review, and Export are collapsed disclosures the user
opens on demand. Historical/contextual information stays available but never crowds the
initial screen. Do not restore an always-visible dashboard.

## UI design direction

Mobile-first, modular tile/card layout with a retro "digital instrument / personal OS"
feel — not a SaaS dashboard. Charcoal base; a small restrained palette carries
hierarchy (terracotta = Today hero, cream = Tomorrow, brown = Reflection, muted olive =
accents/save). Chunky monospace for headings/labels + status metadata; system-sans for
body. No external fonts, no frameworks, no animation libraries — plain CSS/JS in
`Index.html`. Desktop is a responsive expansion (2-column; Today spans full width);
mobile is the primary target (usable with no horizontal scroll from ~360px up). Status
glyphs: ○ planned, ✓ done, ◐ partial, – skipped, → moved. This is presentation only —
it does not change scope, data, or behavior.

## Data model (actual, verified in Code.gs)

Sheets are created/initialized idempotently by `setup()`; existing sheets and data are
never dropped.

| Sheet | Columns |
|-------|---------|
| `Plans` | `id, date, plan, status, created_at, updated_at` |
| `Reflections` | `id, date, reflection, created_at, updated_at` |
| `WeeklyReviews` | `id, week, reflection, created_at, updated_at` |
| `MonthlyReviews` | `id, month, reflection, created_at, updated_at` |
| `Settings` | `key, value` (reserved; currently unused) |

Keys: `date` and `week` are `yyyy-MM-dd` (week = the Monday of that week). `month` is
`yyyy-MM`. `id` is a UUID. Timestamps are ISO strings. Dates use the script timezone.

**Reflection history model:** `Reflections`, `WeeklyReviews`, and `MonthlyReviews` are
**append-only** — a period may hold many rows, ordered by `created_at`. `getBootstrap`
and the summaries return a `reflections` array (newest first). Reflections are
observations and are never overwritten; plans are intentions and remain editable in
place. Because Google Sheets coerces appended date strings into Date cells, all
date/week/month matching goes through `dayKey_()`/`monthKeyOf_()` (see Decision 006).

## Current functionality (verified present)

Server (`Code.gs`): `doGet`, `setup`, `ensureReady_` (cached readiness guard so full
`setup()` runs at most once per 6h window instead of every request), `getBootstrap`,
`addPlan`, `updatePlan`, `setPlanStatus`, `deletePlan`, `saveReflection`,
`getWeeklySummary`, `saveWeeklyReflection`, `getMonthlySummary`,
`saveMonthlyReflection`, `exportCsv`, plus private helpers (`ensureSheet_`, `readRows_`,
`updateRow_`, `deleteRow_`, `countStatuses_`, `appendReview_`, `byCreatedDesc_`,
`dayKey_`/`monthKeyOf_` and other date helpers, `csv_`).

Client (`Index.html`): Today + Tomorrow lists, add/edit/delete, one-tap status cycle
(planned→done→partial→skipped→moved→planned), append-only daily reflection with a
"Today's notes" history, Review panel (weekly + monthly counts + append-only history,
behind a footer toggle), CSV export of all four sheets, and a lightweight "Syncing…"
indicator during in-flight requests. Each action is one server round-trip.

## Known limitations

- **No plan-edit history.** `updatePlan` overwrites `plan` text in place (preserving
  `id` and `created_at`, updating `updated_at`). The original wording is not versioned.
  Acceptable for MVP; revisit only if intention-vs-reality history proves valuable.
- **No offline support / no optimistic UI.** Every action round-trips to the server.
- **Single-user assumption.** No auth beyond the Apps Script deployment's own access
  setting. No concurrency handling on the Sheet.
- **Live behavior unverified in this environment.** Only static + local validation is
  possible here; Apps Script execution requires actual deployment.

## Future direction (NOT to build now)

Export CSV → feed to an external LLM/ChatGPT project for pattern analysis. Possible
later: richer reviews, plan-edit history, an ecosystem of specialized OS products that
interconnect. All out of scope until V0 produces real usage data.

## Development rules

See `PLANOS_DEV_PROMPT.md`. In short: inspect before coding, keep the MVP small,
fix bugs but don't expand scope, report ambiguity instead of inventing behavior, never
claim live testing that was not performed, keep these docs current.
