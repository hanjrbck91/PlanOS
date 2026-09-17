const SHEETS = {
  PLANS: 'Plans',
  REFLECTIONS: 'Reflections',
  WEEKLY: 'WeeklyReviews',
  MONTHLY: 'MonthlyReviews',
  SETTINGS: 'Settings'
};

const STATUSES = ['planned','done','partial','skipped','moved'];

function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('PlanOS')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureSheet_(ss, SHEETS.PLANS, ['id','date','plan','status','created_at','updated_at']);
  ensureSheet_(ss, SHEETS.REFLECTIONS, ['id','date','reflection','created_at','updated_at']);
  ensureSheet_(ss, SHEETS.WEEKLY, ['id','week','reflection','created_at','updated_at']);
  ensureSheet_(ss, SHEETS.MONTHLY, ['id','month','reflection','created_at','updated_at']);
  ensureSheet_(ss, SHEETS.SETTINGS, ['key','value']);
  return 'PlanOS setup complete';
}

function getBootstrap() {
  setup();
  const today = dateKey_(new Date());
  const tomorrow = dateKey_(addDays_(new Date(), 1));
  const plans = readRows_(SHEETS.PLANS).filter(r => dayKey_(r.date) === today || dayKey_(r.date) === tomorrow);
  const reflections = readRows_(SHEETS.REFLECTIONS).filter(r => dayKey_(r.date) === today);
  return {
    today,
    tomorrow,
    todayPlans: plans.filter(r => dayKey_(r.date) === today),
    tomorrowPlans: plans.filter(r => dayKey_(r.date) === tomorrow),
    reflection: reflections[0] || null
  };
}

function addPlan(date, plan) {
  if (!plan || !String(plan).trim()) throw new Error('Plan cannot be empty.');
  const now = new Date().toISOString();
  const id = Utilities.getUuid();
  sheet_(SHEETS.PLANS).appendRow([id, date, String(plan).trim(), 'planned', now, now]);
  return getBootstrap();
}

function updatePlan(id, plan) {
  if (!plan || !String(plan).trim()) throw new Error('Plan cannot be empty.');
  updateRow_(SHEETS.PLANS, id, {plan: String(plan).trim(), updated_at: new Date().toISOString()});
  return getBootstrap();
}

function setPlanStatus(id, status) {
  if (!STATUSES.includes(status)) throw new Error('Invalid status.');
  updateRow_(SHEETS.PLANS, id, {status, updated_at: new Date().toISOString()});
  return getBootstrap();
}

function deletePlan(id) {
  deleteRow_(SHEETS.PLANS, id);
  return getBootstrap();
}

function saveReflection(date, reflection) {
  const text = String(reflection || '').trim();
  const existing = readRows_(SHEETS.REFLECTIONS).find(r => dayKey_(r.date) === date);
  const now = new Date().toISOString();
  if (existing) {
    updateRow_(SHEETS.REFLECTIONS, existing.id, {reflection: text, updated_at: now});
  } else if (text) {
    sheet_(SHEETS.REFLECTIONS).appendRow([Utilities.getUuid(), date, text, now, now]);
  }
  return getBootstrap();
}

// --- Weekly review ---
function getWeeklySummary(week) {
  setup();
  const start = week ? week : weekStart_(new Date());
  const end = dateKey_(addDays_(new Date(start + 'T00:00:00'), 6));
  const plans = readRows_(SHEETS.PLANS).filter(r => { const k = dayKey_(r.date); return k >= start && k <= end; });
  const review = readRows_(SHEETS.WEEKLY).find(r => dayKey_(r.week) === start);
  return {
    week: start,
    start, end,
    counts: countStatuses_(plans),
    reflection: review ? review.reflection : ''
  };
}

function saveWeeklyReflection(week, reflection) {
  return saveReview_(SHEETS.WEEKLY, 'week', week, reflection, dayKey_);
}

// --- Monthly review ---
function getMonthlySummary(month) {
  setup();
  const key = month ? month : monthKey_(new Date());
  const plans = readRows_(SHEETS.PLANS).filter(r => monthKeyOf_(r.date) === key);
  const review = readRows_(SHEETS.MONTHLY).find(r => monthKeyOf_(r.month) === key);
  return {
    month: key,
    counts: countStatuses_(plans),
    reflection: review ? review.reflection : ''
  };
}

function saveMonthlyReflection(month, reflection) {
  return saveReview_(SHEETS.MONTHLY, 'month', month, reflection, monthKeyOf_);
}

function exportCsv() {
  setup();
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

function saveReview_(sheetName, keyCol, keyVal, reflection, norm) {
  setup();
  const text = String(reflection || '').trim();
  const key = norm ? norm : (v => v);
  const existing = readRows_(sheetName).find(r => key(r[keyCol]) === keyVal);
  const now = new Date().toISOString();
  if (existing) {
    updateRow_(sheetName, existing.id, {reflection: text, updated_at: now});
  } else if (text) {
    sheet_(sheetName).appendRow([Utilities.getUuid(), keyVal, text, now, now]);
  }
  return true;
}

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
