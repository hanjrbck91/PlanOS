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
