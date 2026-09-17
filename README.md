# PlanOS MVP

A deliberately small PlanOS prototype using Google Sheets + Google Apps Script.

## MVP loop

Plan → Execute → Reflect → Prepare tomorrow.

### Included
- Today view
- Tomorrow view
- Add/edit/delete plans
- Status: planned, done, partial, skipped, moved
- Daily text reflection
- Weekly review (status counts + weekly reflection) — behind the footer "Review" toggle
- Monthly review (status counts + monthly reflection) — same toggle
- Persistent Google Sheet storage (Plans, Reflections, WeeklyReviews, MonthlyReviews)
- CSV export (all four sheets)
- Mobile-friendly single-page UI

### Deliberately excluded
- AI
- Voice
- Categories/areas in the UI
- RunnerOS/LearnOS/other integrations
- Complex goals/projects
- Gamification
- Dashboards

## Setup
1. Create a Google Sheet.
2. Open Extensions → Apps Script.
3. Add `Code.gs`, `Index.html`, and `appsscript.json` from this folder.
4. Run `setup()` once and authorize it.
5. Deploy → New deployment → Web app.
6. Open the deployed URL on your phone/desktop.

The Sheet is the source of truth. The UI is intentionally just a thin execution layer.
