const SHEETS = {
  PLANS: 'Plans',
  REFLECTIONS: 'Reflections',
  WEEKLY: 'WeeklyReviews',
  MONTHLY: 'MonthlyReviews',
  SETTINGS: 'Settings'
};

const STATUSES = ['planned','done','partial','skipped','moved'];

function doGet() {
  // The <meta viewport> inside Index.html lives in the sandbox iframe and does NOT
  // control the outer served page. addMetaTag injects the viewport onto that outer
  // page, so mobile browsers use device-width instead of the ~980px desktop default
  // (which was forcing the >=760px two-column layout and a zoomed-out render).
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('PlanOS')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureSheet_(ss, SHEETS.PLANS, ['id','date','plan','status','created_at','updated_at']);
  ensureSheet_(ss, SHEETS.REFLECTIONS, ['id','date','reflection','created_at','updated_at']);
  ensureSheet_(ss, SHEETS.WEEKLY, ['id','week','reflection','created_at','updated_at']);
  ensureSheet_(ss, SHEETS.MONTHLY, ['id','month','reflection','created_at','updated_at']);
  ensureSheet_(ss, SHEETS.SETTINGS, ['key','value']);
  CacheService.getScriptCache().put('planos_ready', '1', 21600);
  return 'PlanOS setup complete';
}

// Cheap readiness guard for hot paths: run full setup() at most once per cache window
// (6h) instead of on every request. setup() itself remains safe to run explicitly.
function ensureReady_() {
  if (CacheService.getScriptCache().get('planos_ready')) return;
  setup();
}

function getBootstrap() {
  ensureReady_();
  const today = dateKey_(new Date());
  const tomorrow = dateKey_(addDays_(new Date(), 1));
  const plans = readRows_(SHEETS.PLANS).filter(r => dayKey_(r.date) === today || dayKey_(r.date) === tomorrow);
  const reflections = readRows_(SHEETS.REFLECTIONS)
    .filter(r => dayKey_(r.date) === today)
    .sort(byCreatedDesc_);
  return {
    today,
    tomorrow,
    todayPlans: plans.filter(r => dayKey_(r.date) === today),
    tomorrowPlans: plans.filter(r => dayKey_(r.date) === tomorrow),
    reflections
  };
}

// Mutations return only the affected record so the client updates local state without a
// full re-read/re-render. The Sheet stays the source of truth (server-confirmed values).
function addPlan(date, plan) {
  ensureReady_();
  if (!plan || !String(plan).trim()) throw new Error('Plan cannot be empty.');
  const now = new Date().toISOString();
  const id = Utilities.getUuid();
  const text = String(plan).trim();
  sheet_(SHEETS.PLANS).appendRow([id, date, text, 'planned', now, now]);
  return {id, date, plan: text, status: 'planned', created_at: now, updated_at: now};
}

function updatePlan(id, plan) {
  if (!plan || !String(plan).trim()) throw new Error('Plan cannot be empty.');
  const now = new Date().toISOString();
  const text = String(plan).trim();
  updateRow_(SHEETS.PLANS, id, {plan: text, updated_at: now});
  return {id, plan: text, updated_at: now};
}

function setPlanStatus(id, status) {
  if (!STATUSES.includes(status)) throw new Error('Invalid status.');
  const now = new Date().toISOString();
  updateRow_(SHEETS.PLANS, id, {status, updated_at: now});
  return {id, status, updated_at: now};
}

function deletePlan(id) {
  deleteRow_(SHEETS.PLANS, id);
  return {id};
}

// Reflections are append-only observations: every save adds a new row, never overwrites.
// Returns the newly created row so the client can prepend it to its history.
function saveReflection(date, reflection) {
  ensureReady_();
  const text = String(reflection || '').trim();
  if (!text) return null;
  const now = new Date().toISOString();
  const id = Utilities.getUuid();
  sheet_(SHEETS.REFLECTIONS).appendRow([id, date, text, now, now]);
  return {id, date, reflection: text, created_at: now, updated_at: now};
}

// --- Weekly review ---
function getWeeklySummary(week) {
  ensureReady_();
  const start = week ? week : weekStart_(new Date());
  const end = dateKey_(addDays_(new Date(start + 'T00:00:00'), 6));
  const plans = readRows_(SHEETS.PLANS).filter(r => { const k = dayKey_(r.date); return k >= start && k <= end; });
  const reflections = readRows_(SHEETS.WEEKLY)
    .filter(r => dayKey_(r.week) === start)
    .sort(byCreatedDesc_);
  return {
    week: start,
    start, end,
    counts: countStatuses_(plans),
    reflections
  };
}

function saveWeeklyReflection(week, reflection) {
  return appendReview_(SHEETS.WEEKLY, 'week', week, reflection);
}

// --- Monthly review ---
function getMonthlySummary(month) {
  ensureReady_();
  const key = month ? month : monthKey_(new Date());
  const plans = readRows_(SHEETS.PLANS).filter(r => monthKeyOf_(r.date) === key);
  const reflections = readRows_(SHEETS.MONTHLY)
    .filter(r => monthKeyOf_(r.month) === key)
    .sort(byCreatedDesc_);
  return {
    month: key,
    counts: countStatuses_(plans),
    reflections
  };
}

function saveMonthlyReflection(month, reflection) {
  return appendReview_(SHEETS.MONTHLY, 'month', month, reflection);
}

function exportCsv() {
  ensureReady_();
  return {
    plans: csv_(readRows_(SHEETS.PLANS), ['id','date','plan','status','created_at','updated_at']),
    reflections: csv_(readRows_(SHEETS.REFLECTIONS), ['id','date','reflection','created_at','updated_at']),
    weekly: csv_(readRows_(SHEETS.WEEKLY), ['id','week','reflection','created_at','updated_at']),
    monthly: csv_(readRows_(SHEETS.MONTHLY), ['id','month','reflection','created_at','updated_at'])
  };
}

function countStatuses_(plans) {
  const c = {total: plans.length};
  STATUSES.forEach(s => c[s] = 0);
  plans.forEach(p => { if (c[p.status] !== undefined) c[p.status]++; });
  return c;
}

// Append-only: each weekly/monthly review save adds a new entry and returns that row.
function appendReview_(sheetName, keyCol, keyVal, reflection) {
  ensureReady_();
  const text = String(reflection || '').trim();
  if (!text) return null;
  const now = new Date().toISOString();
  const id = Utilities.getUuid();
  sheet_(sheetName).appendRow([id, keyVal, text, now, now]);
  const row = {id, reflection: text, created_at: now, updated_at: now};
  row[keyCol] = keyVal;
  return row;
}

// Sort reflection/review rows newest-first by created_at (ISO strings sort chronologically).
function byCreatedDesc_(a, b) { return String(b.created_at).localeCompare(String(a.created_at)); }

function ensureSheet_(ss, name, headers) {
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  if (sh.getLastRow() === 0) sh.appendRow(headers);
}
function sheet_(name) { return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name); }
function readRows_(name) {
  const sh = sheet_(name); const values = sh.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0];
  return values.slice(1).filter(row => row.some(v => v !== '')).map(row => Object.fromEntries(headers.map((h,i)=>[h, row[i] instanceof Date ? row[i].toISOString() : String(row[i])])));
}
function updateRow_(name, id, patch) {
  const sh = sheet_(name), values = sh.getDataRange().getValues(), headers = values[0], idCol = headers.indexOf('id');
  for (let r=1;r<values.length;r++) if (String(values[r][idCol]) === String(id)) {
    Object.entries(patch).forEach(([k,v]) => { const c=headers.indexOf(k); if(c>=0) sh.getRange(r+1,c+1).setValue(v); });
    return;
  }
  throw new Error('Record not found.');
}
function deleteRow_(name,id) {
  const sh=sheet_(name), values=sh.getDataRange().getValues(), idCol=values[0].indexOf('id');
  for(let r=1;r<values.length;r++) if(String(values[r][idCol])===String(id)){sh.deleteRow(r+1);return;}
}
function dateKey_(d){return Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM-dd');}
// Normalize a stored date/week value to a 'yyyy-MM-dd' key in the script timezone.
// Google Sheets coerces appended date strings into Date cells, which readRows_ then
// serializes via toISOString() (UTC). This recovers the intended local day, and passes
// through values already in 'yyyy-MM-dd' form unchanged.
function dayKey_(v){
  if (v instanceof Date) return dateKey_(v);
  var s = String(v);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  var d = new Date(s);
  return isNaN(d.getTime()) ? s : dateKey_(d);
}
function monthKeyOf_(v){ return dayKey_(v).slice(0,7); }
function monthKey_(d){return Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM');}
function weekStart_(d){const x=new Date(d);const day=(x.getDay()+6)%7;x.setDate(x.getDate()-day);return dateKey_(x);} // Monday
function addDays_(d,n){const x=new Date(d);x.setDate(x.getDate()+n);return x;}
function csv_(rows,headers){const esc=v=>'"'+String(v??'').replace(/"/g,'""')+'"';return [headers.join(','),...rows.map(r=>headers.map(h=>esc(r[h])).join(','))].join('\n');}
