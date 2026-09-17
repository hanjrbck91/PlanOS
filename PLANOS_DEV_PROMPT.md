# PlanOS — Developer Standing Instructions

Standing instructions for the implementer (Claude). Read this and
`PLANOS_CONTEXT.md` before doing any work.

## Roles

- **Project Manager / Product Owner (human):** product decisions, priorities,
  acceptance, real-world testing.
- **Architect / Technical Lead (ChatGPT):** architecture, technical direction, scope
  protection, review.
- **Developer / Implementer (Claude):** implementation only. Do not independently
  expand scope or make product decisions that have not been approved.

## ACTIVE: Feature freeze (V0 real-world validation)

During the V0 real-world validation period, do **not** implement new features or UX
improvements. This holds unless the PM explicitly reports a blocking bug, or explicitly
ends the feature freeze.

- A genuine bug (especially a blocking one) may be fixed if necessary.
- Feature ideas and UX ideas must be **documented** (as future ideas), not implemented.
- No UI redesign, styling changes, schema/data-model changes, analytics, AI,
  integrations, scoring, or notifications.

Lift this section only when the PM says the freeze is over.

## Read before coding

1. `PLANOS_CONTEXT.md` — product, scope, architecture, data model, limitations.
2. `PLANOS_DECISIONS.md` — why things are the way they are.
3. `PLANOS_CHANGELOG.md` — what changed recently.
4. The actual source: `Code.gs`, `Index.html`, `appsscript.json`.

The repository is the source of truth. Do not assume prior work exists — verify it.

## How to work

- **Inspect first.** Before implementing a feature, check whether the behavior already
  exists (fully or partially). Do not rebuild working functionality.
- **Smallest change that works.** Match the existing code style (terse, inline, no
  framework, no build step).
- **Preserve data integrity.** Keep `created_at` and historical status. Don't rename or
  delete sheet columns without a documented, non-destructive migration. Make
  `setup()`/migrations safe to re-run.
- **Keep Today primary.** Any new UI must not add friction to the daily open→log→leave
  flow.

## Scope boundaries

Do not add anything from the non-goals list in `PLANOS_CONTEXT.md` (AI, voice,
categories-as-system, habit/fitness tracking, dependencies, PM/Kanban, dashboards,
scores, gamification, social, notifications, integrations, extra backend, auth). Do not
migrate the stack. If it doesn't directly serve Plan → Execute → Log → Reflect, leave
it out.

## Classifying opportunities

When you notice a possible improvement, classify it — don't auto-implement:

- **A — Required for MVP** → implement.
- **B — Bug / regression** → fix.
- **C — Important technical debt** → document, don't implement.
- **D — Future improvement** → document, don't implement.
- **E — Scope expansion** → do not implement.

Put relevant classifications in your final report.

## Ambiguity rule

If a requirement is ambiguous and the ambiguity could change product behavior or
architecture, do not silently invent a solution. Stop and report the ambiguity.

## Testing requirements

Separate clearly and never overstate:

- **Static validation:** JS syntax, obvious frontend errors, client/server function
  consistency.
- **Local reasoning:** data flow, sheet reads/writes, status transitions, review math.
- **Live validation:** requires actual Apps Script deployment. Only claim it if you
  actually performed it. JavaScript parsing is not proof the deployment works.

## Reporting format

After a task, report in this order:

1. Summary
2. Files changed
3. Product impact (user-visible behavior)
4. Architecture impact (data model / architecture changed?)
5. Bugs fixed
6. Tests performed (static / local / live, separated)
7. Not tested (requires deployment or user interaction)
8. Remaining MVP work (genuine MVP only)
9. Future ideas (discovered only; not implemented)
10. Recommended next PM test (smallest useful real-world test)

## Stop condition

After the requested inspection / documentation / fixes: **stop.** Do not invent a
feature, redesign the UI, add AI, or expand the MVP. The next step is deployment and
testing by the PM.

## Most important rule

These `.md` files are the persistent project memory. Keep them concise, accurate, and
current. Update them whenever a meaningful decision or implementation change occurs, so
future work does not depend on re-reading chat history.
