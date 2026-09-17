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

## Deploy (for a non-developer PM)

You need a Google account. No other services, no install, no command line.

1. **Create the Sheet.** Go to <https://sheets.google.com>, create a blank
   spreadsheet, name it `PlanOS`. This spreadsheet is your database.
2. **Open Apps Script.** In the Sheet: **Extensions → Apps Script**. A code editor
   opens in a new tab, bound to this Sheet.
3. **Show the manifest file (once).** In Apps Script: the gear icon (**Project
   Settings**) → tick **"Show appsscript.json manifest file in editor"**.
4. **Add the files.** In the editor's file list (left panel), recreate the three files
   from this folder and paste their full contents:
   - `Code.gs` — replace the default `Code.gs` contents.
   - `Index.html` — **+ → HTML**, name it `Index` (no extension), paste `Index.html`.
   - `appsscript.json` — open the existing manifest and replace its contents.
   Save (Ctrl/Cmd+S).
5. **Run `setup()`.** In the toolbar, pick the function `setup` and click **Run**. This
   creates the sheets. It is safe to run more than once — it never deletes or overwrites
   existing data.
6. **Authorize.** The first run prompts for authorization. Choose your account →
   **Advanced → Go to (project) → Allow**. (The "unverified app" warning is expected
   for your own personal script.)
7. **Deploy as Web App.** **Deploy → New deployment → (gear) Web app**.
   - **Execute as:** *Me*.
   - **Who has access:** *Only myself* (recommended for personal use — keeps your Sheet
     private). Choose a wider option only if you deliberately want others to reach it.
   Click **Deploy**, authorize again if asked, and copy the **Web app URL**.
8. **Open the URL** on your phone or desktop. Bookmark it. This is PlanOS.
9. **Run the acceptance test.** Follow `PLANOS_ACCEPTANCE_TEST.md` end to end before
   relying on it daily.

> Note on timezone: the manifest uses `Asia/Kolkata`. If you are elsewhere, change
> `timeZone` in `appsscript.json` (or Project Settings → Time zone) before step 5, so
> "today" matches your local day.

> Re-deploying after code changes: **Deploy → Manage deployments → (edit) → New
> version → Deploy**. The URL stays the same.

The Sheet is the source of truth. The UI is intentionally just a thin execution layer.

## Validation status

Static and local validation (syntax, function-name/argument consistency, data-flow
reasoning) has been done. **This does not prove the live Apps Script deployment works.**
Behavior that can only be confirmed after deployment — sheet creation, all read/write
round-trips, CSV download, review counts against real rows — is listed in
`PLANOS_ACCEPTANCE_TEST.md` and must be checked by the PM on the deployed app.
