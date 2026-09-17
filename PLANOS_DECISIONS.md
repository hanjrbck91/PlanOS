# PlanOS Decisions

Record only meaningful product/architecture decisions. Not a diary.

## Decision 001 — Google Sheets as V0 Source of Truth

Status: Accepted

Decision:
Use Google Sheets (via Google Apps Script) as the source of truth for PlanOS V0.

Reason:
The purpose of V0 is behavioral validation, not infrastructure validation. Sheets is
zero-setup, free, inspectable by the user, trivially exportable, and good enough for a
single user.

Alternatives considered:
Firebase/Firestore, Postgres/Supabase, Notion API, local-only storage. All add
infrastructure and setup cost that does not help answer the V0 question.

Revisit when:
Multi-user, concurrency, or data volume becomes a real constraint — none of which apply
to single-user validation.

## Decision 002 — Keep the stack minimal (no frontend framework)

Status: Accepted

Decision:
Single HTML page with inline CSS/JS served by Apps Script `doGet()`. No React, Next,
build step, or package manager.

Reason:
The UI is intentionally tiny (Today, Tomorrow, reflection, reviews). A framework adds
tooling and cognitive overhead with no benefit at this scale.

Revisit when:
The UI grows beyond what plain HTML/JS can maintain cleanly — not expected in the MVP.

## Decision 003 — Five fixed execution statuses

Status: Accepted

Decision:
Statuses are exactly `planned`, `done`, `partial`, `skipped`, `moved`. One-tap cycling
in the UI.

Reason:
Captures the plan-vs-reality distinction without a scoring system. A missed task is
information, not failure.

Revisit when:
Real usage shows a genuinely missing state. Do not add states speculatively.

## Decision 004 — Weekly/monthly reviews behind a toggle, counts only

Status: Accepted

Decision:
Reviews live behind a footer "Review" toggle, showing plain status counts plus a
free-text reflection. No charts, no productivity score, no gamification.

Reason:
Today must stay the primary screen. Reviews are periodic, not daily, so they should not
add friction to the main flow. Counts + human reflection are enough for validation.

Revisit when:
The PM explicitly approves richer review visuals after real usage.

## Decision 005 — Plan edits overwrite in place (no versioning) for V0

Status: Accepted

Decision:
`updatePlan` overwrites the plan text, preserving `id`/`created_at` and bumping
`updated_at`. No edit history is kept.

Reason:
Full intention-vs-reality versioning is elaborate and unproven in value. The spec
explicitly warns against prematurely building versioning. Status transitions already
capture most of the plan-vs-reality signal.

Revisit when:
Real usage shows the historical wording of plans is valuable to preserve.

## Decision 006 — Normalize dates on read; never rely on exact string date matches

Status: Accepted

Decision:
Treat stored `date`/`week`/`month` values as untrusted formats and normalize them with
`dayKey_()` / `monthKeyOf_()` before comparing. Do not compare a stored date directly to
a `'yyyy-MM-dd'` key with `===`.

Reason:
Google Sheets auto-coerces appended date-like strings into Date cells, and `readRows_`
serializes Dates via `toISOString()` (UTC). A stored date therefore reads back as a full
ISO timestamp, so exact string matches silently fail — the live root cause behind Today
showing `0/0` and duplicate rows. Normalizing on read is a small, non-destructive fix
that works whether a cell is a coerced Date or a plain `'yyyy-MM-dd'` string, and it is
timezone-correct (formats in the script timezone).

Alternatives considered:
Forcing the date column to plain-text format (only helps new sheets; leaves existing
data mismatched); changing `readRows_` to blanket-format all Dates (would corrupt
`created_at`/`updated_at` timestamps in CSV export).

Revisit when:
The storage layer changes away from Google Sheets (a real DB would remove the coercion),
at which point the normalization can be simplified.

## Decision 007 — Reflections are append-only observations; plans are mutable intentions

Status: Accepted

Decision:
Every reflection save (daily, weekly, monthly) appends a new row. Reflections are never
overwritten or deduplicated by date/week/month. Plans, by contrast, remain editable in
place (Decision 005).

Reason:
A reflection records what the user thought at a point in time — its value is the
historical record, so overwriting destroys data and misrepresents the day. A plan is an
intended action, so correcting its wording is legitimate. The existing schemas already
allow multiple rows sharing a date/week/month (`id` + `created_at`), so no schema change
is needed.

Alternatives considered:
Single mutable reflection per period (the previous behavior) — rejected: it silently
lost earlier entries. A new `sequence`/`version` column — unnecessary; `id` +
`created_at` already order the history.

Revisit when:
Never expected to revert. If editing/deleting an individual reflection entry is ever
wanted, add it as an explicit per-entry action, not by returning to overwrite-on-save.

## Decision 008 — Set the mobile viewport via doGet's addMetaTag, not just Index.html

Status: Accepted

Decision:
`doGet` must call `.addMetaTag('viewport', 'width=device-width, initial-scale=1')`. Do
not rely on the `<meta viewport>` inside `Index.html` for mobile behavior.

Reason:
Apps Script serves the HTML inside a sandbox iframe. A viewport meta inside that iframe
does not control the outer served page, so without `addMetaTag` mobile browsers render
the outer page at the ~980px desktop default and scale it down — defeating the
mobile-first CSS. This was the real cause of the iPhone showing a two-column,
zoomed-out layout.

Alternatives considered:
Only lowering the CSS breakpoint — rejected: the media query was never the problem; the
content was being laid out at desktop width regardless.

Revisit when:
The app is no longer served through Apps Script HtmlService.
