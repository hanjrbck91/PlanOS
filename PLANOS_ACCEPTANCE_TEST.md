# PlanOS V0 Acceptance Test

A simple PM checklist for validating the **deployed** product. Run every section on the
live Web App URL. This is not a developer test suite.

## Environment

Deployment URL:
Date:
Browser:

---

## 1. Today

[ ] Add 3 plans

[ ] Mark one Done (tap the circle until it shows ✓)

[ ] Mark one Partial (keep tapping until it shows ~)

[ ] Leave one unchanged (stays ○ / planned)

[ ] Refresh the page

Expected:
All three plans remain, each with the correct status.

Note: the status button cycles planned → done → partial → skipped → moved → planned.
Tap repeatedly to reach the state you want.

---

## 2. Edit (special characters)

[ ] Create a plan containing an apostrophe:
Buy John's running shoes

[ ] Tap the plan text and edit it (change a word), confirm

[ ] Create a plan containing a backslash:
Path: C:\Projects\Test

[ ] Tap the plan text and edit it, confirm

[ ] Refresh

Expected:
Both plans can be edited normally and the edited text persists after refresh.

---

## 3. Tomorrow

[ ] Add one plan in the Tomorrow section

[ ] Refresh

Expected:
The plan stays under Tomorrow (not Today).

Optional (confirms date handling): if you can revisit the next calendar day, the item
you added under Tomorrow should now appear under Today.

---

## 4. Daily Reflection

[ ] Write a reflection in "Close today"

[ ] Click Save reflection (footer shows "Reflection saved.")

[ ] Refresh

Expected:
The reflection text is still there.

---

## 5. Weekly Review

[ ] Click "Review" in the footer

[ ] Check the week's counts against today's test data
    (Plans = total plans this week; Done / Partial / Skipped / Moved match what you set)

[ ] Write a weekly reflection

[ ] Click Save weekly (footer shows "Weekly saved.")

[ ] Refresh

[ ] Reopen Review

Expected:
The weekly reflection remains and the counts are correct.

Note: the week runs Monday–Sunday. Counts cover all plans dated in the current week.

---

## 6. Monthly Review

[ ] In the same Review panel, check the month's counts

[ ] Write a monthly reflection

[ ] Click Save monthly (footer shows "Monthly saved.")

[ ] Refresh

[ ] Reopen Review

Expected:
The monthly reflection remains (counts cover all plans in the current calendar month).

---

## 7. CSV

[ ] Click "Export CSV" in the footer

[ ] Open the downloaded files

Expected:
Four files download: PlanOS_Plans.csv, PlanOS_Reflections.csv,
PlanOS_WeeklyReviews.csv, PlanOS_MonthlyReviews.csv. Your test plans and reflections
appear in them with columns matching the sheets.

---

## 8. Persistence sanity

[ ] Open the Google Sheet directly

Expected:
Sheets exist: Plans, Reflections, WeeklyReviews, MonthlyReviews, Settings. Your test
rows are present. Nothing was wiped by running the app.

---

## Result

[ ] PASS — ready for real-world use

[ ] FAIL — issue found

Issues:
...
