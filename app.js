
/* ── SAFE HELPER FUNCTIONS (avoid nested template literals) ── */
function strikeDots(sk){return [0,1,2].map(function(j){var c=j<sk?(sk>=3?'danger':'hit'):'';return '<div class="sk '+c+'"></div>';}).join('');}
function moodColor(m){var n=parseInt(m);return n>=7?'var(--green)':n<=4?'var(--red)':'var(--gold)';}
function hsColor(hs){var n=parseInt(hs||0,10);return n>=80?'var(--green)':n>=60?'var(--gold)':n>=40?'var(--amber)':'var(--red)';}
function pnlColor(v){return v>0?'var(--green)':v<0?'var(--red)':'var(--text)';}
function statusClass(v){var s=(v||'active').toString().toLowerCase();return s==='watchlist'?'b-amber':s==='suspended'?'b-red':s==='exited'?'b-gray':'b-green';}
function statusLabel(v){var s=(v||'active').toString().toLowerCase();return s==='watchlist'?'Watchlist':s==='suspended'?'Suspended':s==='exited'?'Exited':'Active';}
function norm(v){return (v||'').toString().trim().toLowerCase();}
function signedFmt(n){var num=Number(n||0);return (num>0?'+':'')+fmt(num);}
function recentKeys(days){var out=[];var base=new Date();for(var i=0;i<days;i++){var d=new Date(base);d.setDate(base.getDate()-i);out.push(d.toISOString().split('T')[0]);}return out;}
function dateKey(row){if(!row) return '';var raw=row.trade_date||row.review_date||row.date||row.logged_at||row.occurred_at||row.created_at||row.updated_at||'';if(!raw) return '';var s=String(raw);return s.length>=10?s.slice(0,10):s;}
function tradePnl(row){var cands=[row&&row.net_pnl,row&&row.pnl,row&&row.profit_loss,row&&row.realized_pnl,row&&row.gross_pnl];for(var i=0;i<cands.length;i++){var v=Number(cands[i]);if(!isNaN(v)&&isFinite(v)) return v;}return 0;}
function tradeR(row){if(!row) return 0;var direct=[row.r_multiple,row.r,row.result_r,row.risk_multiple];for(var i=0;i<direct.length;i++){var v=Number(direct[i]);if(!isNaN(v)&&isFinite(v)) return v;}var pnl=tradePnl(row),risk=Number(row.risk_amount||row.risk||row.planned_risk||0);return risk? pnl/risk : 0;}
function scoreColor(s,t){return t===80?(s>=80?'var(--green)':s>=60?'var(--gold)':'var(--red)'):(s>=15?'var(--green)':'var(--red)');}
function scoreBarCls(s,t){return t===80?(s>=80?'bf-green':s>=60?'bf-gold':'bf-red'):(s>=15?'bf-green':'bf-red');}
function biasClass(b){return b==='bullish'?'bull':b==='bearish'?'bear':'neu';}
function phaseClass(p){return p==='1'?'b-gold':'b-green';}
function strikeClass(sk){return sk>=3?'b-red':sk>=1?'b-amber':'b-green';}
function strikeMsg(sk){return sk===0?'Clean record':sk===1?'1 strike':sk===2?'2 strikes — warning':'3 strikes — action required';}
function strikeColor(sk){return sk>=2?'var(--red)':sk>=1?'var(--amber)':'var(--green)';}
function dllClass(v){return v==='no'?'b-green':v==='yes'?'b-amber':'b-red';}
function repClass(v){return v==='yes'?'b-green':v==='late'?'b-amber':'b-red';}
function evalClass(s){return s==='passed'?'b-green':s==='active'?'b-blue':s==='blown'?'b-red':'b-gray';}

const M=3000,SPLIT=.5,FEE=500;
const AVC=['av1','av2','av3'];
const SDOT={application:'sd-app',test:'sd-test',interview:'sd-int',training:'sd-train',rejected:'sd-rej'};
const SLBL={application:'Application',test:'Screening test',interview:'Interview',training:'Training',rejected:'Rejected'};
const STEPS=['application','test','interview','training'];
const EV_COLORS={payout:'b-gold',eval:'b-red',review:'b-blue',mindset:'b-purple',training:'b-green',other:'b-gray'};

let S={traders:[],payouts:[],candidates:[],briefs:[],sessions:[],violations:[],community:[],oneOnOnes:[],events:[],evals:[],scorecards:[]};
let J={signals:{},alerts:[]};
let pipeFilter='all',charts={};

/* load replaced by loadAll() */
/* save replaced by dbUpsert() */
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,7);}
function today(){return new Date().toISOString().split('T')[0];}
function thisMonth(){const n=new Date();return`${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}`;}
function fmt(n){return'$'+Math.round(n).toLocaleString();}
function ini(n){return n.trim().split(' ').map(w=>w[0]||'').join('').slice(0,2).toUpperCase();}
function milTot(tid){return S.payouts.filter(p=>p.tid===tid).reduce((s,p)=>s+p.gross*SPLIT,0);}
function strikes(tid){return S.violations.filter(v=>v.tid===tid&&v.type==='soft').length;}
function healthScore(tid){
  const ts=S.sessions.filter(s=>s.tid===tid);
  const tv=S.violations.filter(v=>v.tid===tid);
  const rOk=ts.length?ts.filter(s=>s.rep==='yes').length/ts.length:1;
  const dOk=ts.length?ts.filter(s=>s.dll!=='breached').length/ts.length:1;
  const vPen=Math.max(0,1-tv.length*0.12);
  const pnlOk=ts.length?ts.filter(s=>s.pnl>0).length/ts.length:.5;
  return Math.round(rOk*25+dOk*25+vPen*25+pnlOk*25);
}

/* THEME */
function setTheme(t){document.documentElement.setAttribute('data-theme',t);document.getElementById('tbtn-dark').classList.toggle('on',t==='dark');document.getElementById('tbtn-light').classList.toggle('on',t==='light');localStorage.setItem('foundry_theme',t);destroyCharts();render();}
(function(){setTheme(localStorage.getItem('foundry_theme')||'dark');})();

/* SIDEBAR MOBILE */
function toggleSidebar(){document.getElementById('sidebar').classList.toggle('open');document.getElementById('mob-overlay').style.display=document.getElementById('sidebar').classList.contains('open')?'block':'none';}
function closeSidebar(){document.getElementById('sidebar').classList.remove('open');document.getElementById('mob-overlay').style.display='none';}

/* NAV */
const TITLES={today:'Command Center',analytics:'Analytics',calendar:'Desk Calendar',traders:'Traders',pipeline:'Pipeline','trader-profile':'Trader Profile','cand-profile':'Candidate Profile',community:'Community',payouts:'Payouts',briefings:'Morning Briefs',sessions:'Sessions',violations:'Violations',scorecard:'Weekly Scorecard',rules:'Desk Rules'};
const ADD_MAP={today:()=>openM('m-trader'),traders:()=>openM('m-trader'),pipeline:()=>openM('m-candidate'),community:()=>openM('m-community'),payouts:()=>openPayM(),briefings:()=>openBriefM(),sessions:()=>openSessM(),violations:()=>openViolM(),calendar:()=>openM('m-event'),scorecard:()=>openM('m-scorecard')};

function nav(id,btn){
  closeSidebar();
  document.querySelectorAll('.sec').forEach(s=>s.classList.remove('active'));
  const sec=document.getElementById('sec-'+id);if(sec)sec.classList.add('active');
  if(btn){document.querySelectorAll('.si').forEach(b=>b.classList.remove('active'));btn.classList.add('active');}
  document.getElementById('tb-title').textContent=TITLES[id]||id;
  const ab=document.getElementById('tb-add');ab.style.display=ADD_MAP[id]?'':'none';
  destroyCharts();render();
}
function back(id){nav(id,document.querySelector(`.si[onclick*="'${id}'"]`));}
function topAdd(){const a=document.querySelector('.si.active');if(!a)return;const m=a.getAttribute('onclick').match(/'([^']+)'/);if(m&&ADD_MAP[m[1]])ADD_MAP[m[1]]();}

/* BOTTOM NAV */
function setBnav(id){document.querySelectorAll('.bnav-item').forEach(b=>b.classList.remove('active'));const el=document.getElementById('bn-'+id);if(el)el.classList.add('active');}

/* KEYBOARD SHORTCUTS */
document.addEventListener('keydown',e=>{if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA'||e.target.tagName==='SELECT'||e.ctrlKey||e.metaKey)return;const map={t:()=>openM('m-trader'),p:()=>openPayM(),b:()=>openBriefM(),s:()=>openSessM(),c:()=>openM('m-candidate'),v:()=>openViolM(),Escape:()=>closeM()};if(map[e.key])map[e.key]();});

/* MODALS */
function openM(id){
  if(id==='m-trader'){document.getElementById('et-id').value='';document.getElementById('mt-title').textContent='Add Trader';['t-name','t-contact','t-firm','t-account','t-eval-no','t-doc1','t-journal','t-journal-user','t-notes'].forEach(x=>document.getElementById(x).value='');document.getElementById('t-date').value=today();document.getElementById('t-eval-exp').value='';document.getElementById('t-next-review').value='';document.getElementById('t-phase').value='1';document.getElementById('t-ostatus').value='active';document.getElementById('t-goal').value='';}
  if(id==='m-candidate'){document.getElementById('ec-id').value='';document.getElementById('mc-title').textContent='Add Candidate';['c-name','c-contact','c-score','c-iscore','c-rej','c-notes'].forEach(x=>document.getElementById(x).value='');document.getElementById('c-date').value=today();document.getElementById('c-stage').value='application';document.getElementById('c-dep').value='no';document.getElementById('c-week').value='0';}
  if(id==='m-community'){['cm-name','cm-contact'].forEach(x=>document.getElementById(x).value='');document.getElementById('cm-date').value=today();document.getElementById('cm-status').value='paid';}
  if(id==='m-event'){['ev-name','ev-notes'].forEach(x=>document.getElementById(x).value='');document.getElementById('ev-date').value=today();document.getElementById('ev-type').value='payout';document.getElementById('ev-trader').value='';populateTraderSels(['ev-trader'],true);}
  if(id==='m-eval'){populateTraderSels(['ev2-trader']);['ev2-firm'].forEach(x=>document.getElementById(x).value='');document.getElementById('ev2-no').value='1';document.getElementById('ev2-cost').value='';document.getElementById('ev2-start').value=today();document.getElementById('ev2-exp').value='';document.getElementById('ev2-status').value='active';document.getElementById('ev2-paid').value='desk';}
  if(id==='m-scorecard'){document.getElementById('sc-date').value=today();['sc-sess','sc-rep','sc-pnl','sc-wins','sc-issues','sc-focus'].forEach(x=>document.getElementById(x).value='');document.getElementById('sc-viols').value='0';document.getElementById('sc-mood').value='3';}
  if(id==='m-1on1'){populateTraderSels(['o-trader']);['o-discussed','o-pattern','o-actions','o-notes'].forEach(x=>document.getElementById(x).value='');document.getElementById('o-date').value=today();document.getElementById('o-type').value='weekly';document.getElementById('o-rating').value='3';}
  document.getElementById(id).classList.add('open');
}
function closeM(){document.querySelectorAll('.overlay').forEach(o=>o.classList.remove('open'));}
function populateTraderSels(ids,withAll=false){ids.forEach(id=>{const sel=document.getElementById(id);if(!sel)return;sel.innerHTML=withAll?'<option value="">All desk</option>':'<option value="">Select...</option>';S.traders.forEach(t=>{sel.innerHTML+=`<option value="${t.id}">${t.name}</option>`;});});}

function openPayM(){populateTraderSels(['p-trader'],false);document.getElementById('p-month').value=thisMonth();['p-gross','p-notes'].forEach(x=>document.getElementById(x).value='');document.getElementById('p-type').value='monthly';openM('m-payout');}
function openBriefM(){['br-levels','br-ma9','br-watch','br-news'].forEach(x=>document.getElementById(x).value='');document.getElementById('br-date').value=today();document.getElementById('br-bias').value='bullish';openM('m-brief');}
function openSessM(){populateTraderSels(['ss-trader']);document.getElementById('ss-date').value=today();['ss-trades','ss-pnl','ss-mood','ss-notes'].forEach(x=>document.getElementById(x).value='');document.getElementById('ss-dll').value='no';document.getElementById('ss-rep').value='yes';document.getElementById('ss-type').value='london';openM('m-session');}
function openViolM(){populateTraderSels(['vl-trader']);document.getElementById('vl-date').value=today();['vl-desc','vl-action'].forEach(x=>document.getElementById(x).value='');document.getElementById('vl-type').value='soft';document.getElementById('vl-rule').value='report';openM('m-viol');}
function openEditTrader(id){
  const t=S.traders.find(t=>t.id===id);if(!t)return;
  document.getElementById('et-id').value=id;document.getElementById('mt-title').textContent='Edit Trader';
  document.getElementById('t-name').value=t.name;document.getElementById('t-date').value=t.date;document.getElementById('t-contact').value=t.contact||'';document.getElementById('t-phase').value=t.phase;document.getElementById('t-ostatus').value=t.operatorStatus||'active';document.getElementById('t-next-review').value=t.nextReviewDate||'';document.getElementById('t-firm').value=t.firm||'';document.getElementById('t-account').value=t.account||'';document.getElementById('t-eval-no').value=t.evalNo||'';document.getElementById('t-eval-exp').value=t.evalExp||'';document.getElementById('t-doc1').value=t.doc1||'';document.getElementById('t-journal').value=t.journal||'';document.getElementById('t-journal-user').value=t.journalUserId||'';document.getElementById('t-goal').value=t.goal||'';document.getElementById('t-notes').value=t.notes||'';
  document.getElementById('m-trader').classList.add('open');
}
function openEditCand(id){
  const c=S.candidates.find(c=>c.id===id);if(!c)return;
  document.getElementById('ec-id').value=id;document.getElementById('mc-title').textContent='Edit Candidate';
  document.getElementById('c-name').value=c.name;document.getElementById('c-date').value=c.date;document.getElementById('c-contact').value=c.contact||'';document.getElementById('c-stage').value=c.stage;document.getElementById('c-score').value=c.score||'';document.getElementById('c-iscore').value=c.iscore||'';document.getElementById('c-dep').value=c.dep||'no';document.getElementById('c-week').value=c.week||'0';document.getElementById('c-rej').value=c.rejReason||'';document.getElementById('c-notes').value=c.notes||'';
  openM('m-candidate');
}

/* SAVES */

/* ── SUPABASE CONFIG ── */
const SUPA_URL = 'https://qubzrtrplkxyfwfmgxkd.supabase.co';
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1YnpydHJwbGt4eWZ3Zm1neGtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMzcxODYsImV4cCI6MjA5MDgxMzE4Nn0.-NCobtqU-ZqLVxtBMmiGWu7cPFv67Ymy9DoOPHXYmsk';
const SB_HEADERS = {
  'apikey': SUPA_KEY,
  'Authorization': 'Bearer ' + SUPA_KEY,
  'Content-Type': 'application/json',
  'Prefer': 'resolution=merge-duplicates,return=representation'
};

function setSyncStatus(state) {
  var el = document.getElementById('sync-status');
  if(!el) return;
  if(state==='ok') { el.textContent='● Cloud'; el.style.background='var(--greenbg)'; el.style.color='var(--green)'; }
  else if(state==='saving') { el.textContent='◐ Saving...'; el.style.background='var(--amberbg)'; el.style.color='var(--amber)'; }
  else { el.textContent='✕ Error'; el.style.background='var(--redbg)'; el.style.color='var(--red)'; }
}

async function dbGet(table) {
  try {
    var r = await fetch(SUPA_URL+'/rest/v1/'+table+'?order=created_at.asc', {headers:SB_HEADERS});
    if(!r.ok) throw new Error(r.status);
    return await r.json();
  } catch(e) { console.error('GET '+table, e); return []; }
}

async function dbQuery(table, query) {
  try {
    var r = await fetch(SUPA_URL+'/rest/v1/'+table+'?'+query, {headers:SB_HEADERS});
    if(!r.ok) throw new Error(r.status);
    return await r.json();
  } catch(e) { console.error('QUERY '+table, e); return []; }
}

function signalRiskLabel(sig){
  if(!sig) return {label:'Not linked', cls:'b-gray'};
  if(sig.attentionScore >= 6) return {label:'Needs action', cls:'b-red'};
  if(sig.attentionScore >= 3) return {label:'Watch', cls:'b-amber'};
  return {label:'Healthy', cls:'b-green'};
}

async function loadJournalSignals() {
  J = {signals:{}, alerts:[]};
  var linked = S.traders.filter(function(t){ return t.journalUserId; });
  if(!linked.length) return;
  var ids = Array.from(new Set(linked.map(function(t){ return String(t.journalUserId).trim(); }).filter(Boolean)));
  if(!ids.length) return;
  var inExpr = 'in.(' + ids.join(',') + ')';
  var q = 'select=*&user_id=' + inExpr;
  var results = await Promise.all([
    dbQuery('trades', q),
    dbQuery('reviews', q),
    dbQuery('missed_trades', q),
    dbQuery('discipline_incidents', q),
    dbQuery('setup_logs', q)
  ]);
  var trades = results[0] || [];
  var reviews = results[1] || [];
  var missed = results[2] || [];
  var incidents = results[3] || [];
  var setups = results[4] || [];
  var keys7 = recentKeys(7);
  linked.forEach(function(t){
    var uid = String(t.journalUserId).trim();
    var userTrades = trades.filter(function(r){ return String(r.user_id||'').trim()===uid && !r.deleted_at; });
    var userReviews = reviews.filter(function(r){ return String(r.user_id||'').trim()===uid; });
    var userMissed = missed.filter(function(r){ return String(r.user_id||'').trim()===uid; });
    var userIncidents = incidents.filter(function(r){ return String(r.user_id||'').trim()===uid; });
    var userSetups = setups.filter(function(r){ return String(r.user_id||'').trim()===uid; });

    var t7 = userTrades.filter(function(r){ return keys7.indexOf(dateKey(r)) !== -1; });
    var tradingDays = Array.from(new Set(t7.map(dateKey).filter(Boolean)));
    var closedTrades = t7.filter(function(r){ return norm(r.status) !== 'open'; });
    var pnl7 = closedTrades.reduce(function(sum,r){ return sum + tradePnl(r); }, 0);
    var winCount = closedTrades.filter(function(r){ return tradePnl(r) > 0; }).length;
    var rValues = closedTrades.map(tradeR).filter(function(v){ return isFinite(v); });
    var avgR = rValues.length ? rValues.reduce(function(a,b){ return a+b; },0) / rValues.length : 0;

    var r7 = userReviews.filter(function(r){ return keys7.indexOf(dateKey(r)) !== -1; });
    var reviewDays = Array.from(new Set(r7.map(dateKey).filter(Boolean)));
    var reviewCoverage = tradingDays.length ? Math.round((reviewDays.length / tradingDays.length) * 100) : 100;

    var missed7 = userMissed.filter(function(r){ return keys7.indexOf(dateKey(r)) !== -1; }).length;
    var careless7 = userIncidents.filter(function(r){
      if(keys7.indexOf(dateKey(r)) === -1) return false;
      return r.careless === true || r.careless === 'true' || norm(r.category).indexOf('careless') !== -1 || norm(r.rule_type).indexOf('careless') !== -1;
    }).length;
    var unjustifiedSkips7 = userSetups.filter(function(r){
      if(keys7.indexOf(dateKey(r)) === -1) return false;
      var taken = norm(r.taken||r.decision||r.action);
      var review = norm(r.operator_review||r.review_status||r.operator_verdict);
      return (taken === 'skipped' || taken === 'skip') && review === 'unjustified';
    }).length;

    var activityDates = [].concat(userTrades.map(dateKey), userReviews.map(dateKey), userMissed.map(dateKey), userIncidents.map(dateKey)).filter(Boolean).sort();
    var latestActivity = activityDates.length ? activityDates[activityDates.length - 1] : '';
    var stale = latestActivity ? Math.ceil((new Date(today()) - new Date(latestActivity)) / 86400000) >= 3 : false;
    var attentionScore = 0;
    if(tradingDays.length && reviewCoverage < 60) attentionScore += 2;
    if(careless7 > 0) attentionScore += careless7 * 3;
    if(unjustifiedSkips7 > 0) attentionScore += unjustifiedSkips7 * 2;
    if(missed7 >= 3) attentionScore += 1;
    if(stale) attentionScore += 1;

    J.signals[uid] = {
      pnl7:pnl7,
      tradeCount:closedTrades.length,
      winRate:closedTrades.length ? Math.round((winCount / closedTrades.length) * 100) : 0,
      avgR:avgR,
      reviewCoverage:reviewCoverage,
      missed7:missed7,
      careless7:careless7,
      unjustifiedSkips7:unjustifiedSkips7,
      tradingDays:tradingDays.length,
      latestActivity:latestActivity,
      stale:stale,
      attentionScore:attentionScore
    };

    if(tradingDays.length && reviewCoverage < 60) J.alerts.push({type:'warn', msg:t.name + ': review coverage is only ' + reviewCoverage + '% over the last 7 days'});
    if(careless7 > 0) J.alerts.push({type:'danger', msg:t.name + ': ' + careless7 + ' careless incident' + (careless7>1?'s':'') + ' recorded in the journal this week'});
    if(unjustifiedSkips7 > 0) J.alerts.push({type:'warn', msg:t.name + ': ' + unjustifiedSkips7 + ' unjustified skip' + (unjustifiedSkips7>1?'s':'') + ' logged in the last 7 days'});
    if(missed7 >= 3) J.alerts.push({type:'info', msg:t.name + ': missed-trade pressure is rising (' + missed7 + ' logged over the last 7 days)'});
    if(stale) J.alerts.push({type:'info', msg:t.name + ': no fresh journal activity in the last 3 days'});
  });
}

async function dbUpsert(table, row) {
  try {
    setSyncStatus('saving');
    var r = await fetch(SUPA_URL+'/rest/v1/'+table, {
      method:'POST', headers:SB_HEADERS, body:JSON.stringify(row)
    });
    if(!r.ok) { var err=await r.text(); throw new Error(err); }
    setSyncStatus('ok');
    var res = await r.json();
    return Array.isArray(res) ? res[0] : res;
  } catch(e) { setSyncStatus('err'); console.error('UPSERT '+table, e); return null; }
}

async function dbPatch(table, id, data) {
  try {
    setSyncStatus('saving');
    var r = await fetch(SUPA_URL+'/rest/v1/'+table+'?id=eq.'+id, {
      method:'PATCH', headers:SB_HEADERS, body:JSON.stringify(data)
    });
    if(!r.ok) throw new Error(r.status);
    setSyncStatus('ok');
  } catch(e) { setSyncStatus('err'); console.error('PATCH '+table, e); }
}

async function loadAll() {
  setSyncStatus('saving');
  try {
    var res = await Promise.all([
      dbGet('traders'), dbGet('payouts'), dbGet('candidates'),
      dbGet('briefs'), dbGet('sessions'), dbGet('violations'),
      dbGet('community'), dbGet('one_on_ones'), dbGet('events'),
      dbGet('evals'), dbGet('scorecards')
    ]);
    S.traders    = res[0].map(function(r){return {id:r.id,name:r.name,date:r.date,contact:r.contact,phase:r.phase,firm:r.firm,account:r.account,evalNo:r.eval_no,evalExp:r.eval_exp,doc1:r.doc1,journal:r.journal,goal:r.goal,notes:r.notes,initials:r.initials,operatorStatus:r.operator_status||'active',nextReviewDate:r.next_review_date||'',journalUserId:r.journal_user_id||''};});
    S.payouts    = res[1].map(function(r){return {id:r.id,tid:r.tid,traderName:r.trader_name,month:r.month,gross:parseFloat(r.gross)||0,type:r.type,notes:r.notes};});
    S.candidates = res[2].map(function(r){return {id:r.id,name:r.name,date:r.date,contact:r.contact,stage:r.stage,score:r.score,iscore:r.iscore,dep:r.dep,week:r.week,notes:r.notes};});
    S.briefs     = res[3];
    S.sessions   = res[4].map(function(r){return {id:r.id,tid:r.tid,traderName:r.trader_name,date:r.date,type:r.type,trades:r.trades,pnl:parseFloat(r.pnl)||0,dll:r.dll,rep:r.rep,mood:r.mood,notes:r.notes};});
    S.violations = res[5].map(function(r){return {id:r.id,tid:r.tid,traderName:r.trader_name,date:r.date,type:r.type,rule:r.rule,desc:r.description,action:r.action};});
    S.community  = res[6];
    S.oneOnOnes  = res[7].map(function(r){return {id:r.id,tid:r.tid,traderName:r.trader_name,date:r.date,type:r.type,rating:r.rating,discussed:r.discussed,pattern:r.pattern,actions:r.actions,notes:r.notes};});
    S.events     = res[8];
    S.evals      = res[9].map(function(r){return {id:r.id,tid:r.tid,traderName:r.trader_name,no:r.no,firm:r.firm,cost:r.cost,start:r.start_date,exp:r.exp_date,status:r.status,paid:r.paid_by};});
    S.scorecards = res[10];
    await loadJournalSignals();
    setSyncStatus('ok');
  } catch(e) { setSyncStatus('err'); console.error('loadAll', e); }
  render();
}

function exportBackup() {
  var b = new Blob([JSON.stringify(S,null,2)],{type:'application/json'});
  var a = document.createElement('a'); a.href=URL.createObjectURL(b); a.download='foundry-backup-'+today()+'.json'; a.click();
}

async function saveTrader(){
  const id=document.getElementById('et-id').value||uid();
  const d={
    id:id,
    name:document.getElementById('t-name').value.trim(),
    date:document.getElementById('t-date').value,
    contact:document.getElementById('t-contact').value.trim(),
    phase:document.getElementById('t-phase').value,
    operator_status:document.getElementById('t-ostatus').value,
    next_review_date:document.getElementById('t-next-review').value,
    firm:document.getElementById('t-firm').value.trim(),
    account:document.getElementById('t-account').value.trim(),
    eval_no:document.getElementById('t-eval-no').value.trim(),
    eval_exp:document.getElementById('t-eval-exp').value,
    doc1:document.getElementById('t-doc1').value.trim(),
    journal:document.getElementById('t-journal').value.trim(),
    journal_user_id:document.getElementById('t-journal-user').value.trim(),
    goal:document.getElementById('t-goal').value,
    notes:document.getElementById('t-notes').value.trim(),
    initials:ini(document.getElementById('t-name').value.trim())
  };
  if(!d.name||!d.date)return;
  const saved = await dbUpsert('traders', d);
  if(saved){
    closeM();
    await loadAll();
  }
}
async function savePayout(){
  const tid=document.getElementById('p-trader').value,month=document.getElementById('p-month').value,gross=parseFloat(document.getElementById('p-gross').value);
  if(!tid||!month||isNaN(gross)||gross<=0)return;
  const trader=S.traders.find(t=>t.id===tid);if(!trader)return;
  S.payouts.push({id:uid(),tid,traderName:trader.name,month,gross,type:document.getElementById('p-type').value,notes:document.getElementById('p-notes').value.trim()});
  /* cloud auto-saves */closeM();render();
}
async function saveCand(){
  const id=document.getElementById('ec-id').value;
  const d={name:document.getElementById('c-name').value.trim(),date:document.getElementById('c-date').value,contact:document.getElementById('c-contact').value.trim(),stage:document.getElementById('c-stage').value,score:document.getElementById('c-score').value,iscore:document.getElementById('c-iscore').value,dep:document.getElementById('c-dep').value,week:document.getElementById('c-week').value,rejReason:document.getElementById('c-rej').value.trim(),notes:document.getElementById('c-notes').value.trim()};
  if(!d.name||!d.date)return;
  if(id){const c=S.candidates.find(c=>c.id===id);if(c)Object.assign(c,d);}else S.candidates.push({id:uid(),...d});
  document.getElementById('ec-id').value='';/* cloud auto-saves */closeM();render();
}
async function saveBrief(){S.briefs.push({id:uid(),date:document.getElementById('br-date').value,bias:document.getElementById('br-bias').value,levels:document.getElementById('br-levels').value.trim(),ma9:document.getElementById('br-ma9').value.trim(),watch:document.getElementById('br-watch').value.trim(),news:document.getElementById('br-news').value.trim()});/* cloud auto-saves */closeM();render();}
async function saveSess(){
  const tid=document.getElementById('ss-trader').value;if(!tid)return;
  const trader=S.traders.find(t=>t.id===tid);if(!trader)return;
  const dll=document.getElementById('ss-dll').value,rep=document.getElementById('ss-rep').value;
  const pnl=parseFloat(document.getElementById('ss-pnl').value)||0;
  S.sessions.push({id:uid(),tid,traderName:trader.name,date:document.getElementById('ss-date').value,type:document.getElementById('ss-type').value,trades:parseInt(document.getElementById('ss-trades').value)||0,pnl,dll,rep,mood:document.getElementById('ss-mood').value,notes:document.getElementById('ss-notes').value.trim()});
  if(dll==='breached')S.violations.push({id:uid(),tid,traderName:trader.name,date:document.getElementById('ss-date').value,type:'soft',rule:'dll',desc:'Traded past DLL — auto-logged',action:'Review required'});
  if(rep==='no')S.violations.push({id:uid(),tid,traderName:trader.name,date:document.getElementById('ss-date').value,type:'soft',rule:'report',desc:'Session report not submitted — auto-logged',action:'Review required'});
  /* cloud auto-saves */closeM();render();
}
async function saveViol(){
  const tid=document.getElementById('vl-trader').value;if(!tid)return;
  const trader=S.traders.find(t=>t.id===tid);if(!trader)return;
  S.violations.push({id:uid(),tid,traderName:trader.name,date:document.getElementById('vl-date').value,type:document.getElementById('vl-type').value,rule:document.getElementById('vl-rule').value,desc:document.getElementById('vl-desc').value.trim(),action:document.getElementById('vl-action').value.trim()});
  /* cloud auto-saves */closeM();render();
}
async function saveComm(){const name=document.getElementById('cm-name').value.trim();if(!name)return;S.community.push({id:uid(),name,contact:document.getElementById('cm-contact').value.trim(),date:document.getElementById('cm-date').value,status:document.getElementById('cm-status').value,initials:ini(name)});/* cloud auto-saves */closeM();render();}
async function save1on1(){
  const tid=document.getElementById('o-trader').value;if(!tid)return;
  const trader=S.traders.find(t=>t.id===tid);if(!trader)return;
  S.oneOnOnes.push({id:uid(),tid,traderName:trader.name,date:document.getElementById('o-date').value,type:document.getElementById('o-type').value,rating:document.getElementById('o-rating').value,discussed:document.getElementById('o-discussed').value.trim(),pattern:document.getElementById('o-pattern').value.trim(),actions:document.getElementById('o-actions').value.trim(),notes:document.getElementById('o-notes').value.trim()});
  /* cloud auto-saves */closeM();render();
}
async function saveEvent(){const name=document.getElementById('ev-name').value.trim();if(!name)return;const tid=document.getElementById('ev-trader').value;const trader=tid?S.traders.find(t=>t.id===tid):null;S.events.push({id:uid(),name,date:document.getElementById('ev-date').value,type:document.getElementById('ev-type').value,tid:tid||'',traderName:trader?trader.name:'All desk',notes:document.getElementById('ev-notes').value.trim()});/* cloud auto-saves */closeM();render();}
async function saveEval(){
  const tid=document.getElementById('ev2-trader').value;if(!tid)return;
  const trader=S.traders.find(t=>t.id===tid);if(!trader)return;
  S.evals.push({id:uid(),tid,traderName:trader.name,no:document.getElementById('ev2-no').value,firm:document.getElementById('ev2-firm').value.trim(),cost:document.getElementById('ev2-cost').value,start:document.getElementById('ev2-start').value,exp:document.getElementById('ev2-exp').value,status:document.getElementById('ev2-status').value,paid:document.getElementById('ev2-paid').value});
  /* cloud auto-saves */closeM();render();
}
async function saveScorecard(){S.scorecards.push({id:uid(),date:document.getElementById('sc-date').value,sessions:document.getElementById('sc-sess').value,reports:document.getElementById('sc-rep').value,pnl:parseFloat(document.getElementById('sc-pnl').value)||0,viols:document.getElementById('sc-viols').value,mood:document.getElementById('sc-mood').value,wins:document.getElementById('sc-wins').value.trim(),issues:document.getElementById('sc-issues').value.trim(),focus:document.getElementById('sc-focus').value.trim()});/* cloud auto-saves */closeM();render();}
function setCmStatus(id,v){const m=S.community.find(m=>m.id===id);if(m){m.status=v;/* cloud auto-saves */render();}}
function updateEvalStatus(id,v){const e=S.evals.find(e=>e.id===id);if(e){e.status=v;/* cloud auto-saves */render();}}

/* PROFILES */
function openTraderProfile(id){
  const t=S.traders.find(t=>t.id===id);if(!t)return;
  const av=AVC[S.traders.indexOf(t)%3],tot=milTot(id),pct=Math.min(100,Math.round(tot/M*100)),done=tot>=M;
  const sk=strikes(id),hs=healthScore(id),hsC=hsColor(hs);
  const tp=S.payouts.filter(p=>p.tid===id),tv=S.violations.filter(v=>v.tid===id);
  const ts=S.sessions.filter(s=>s.tid===id),to=S.oneOnOnes.filter(o=>o.tid===id);
  const te=S.evals.filter(e=>e.tid===id);
  const avgP=tp.length?tp.reduce((s,p)=>s+p.gross,0)/tp.length:0;
  const proj=tp.length&&tot<M?Math.ceil((M-tot)/(tot/tp.length)):null;
  const lastPnl=ts.slice(-3).map(s=>s.pnl);
  const pnlTrend=lastPnl.length>1?(lastPnl[lastPnl.length-1]>lastPnl[0]?'↑ Improving':'↓ Declining'):'—';
  const goalMet=t.goal&&tp.filter(p=>p.month===thisMonth()).reduce((s,p)=>s+p.gross,0)>=parseFloat(t.goal);
  const js=t.journalUserId?J.signals[t.journalUserId]:null;
  const jr=signalRiskLabel(js);

  const obChecks=[
    {label:'Desk agreement signed',done:!!t.doc1},
    {label:'Credentials configured',done:true},
    {label:'First trading session logged',done:ts.length>0},
    {label:'First payout received',done:tp.length>0},
    {label:'First 1-on-1 completed',done:to.length>0},
    {label:'Journal account linked',done:!!t.journalUserId},
  ];

  document.getElementById('tp-content').innerHTML=`
    <div class="ph">
      <div class="av av-xl ${av}">${t.initials}</div>
      <div class="pm" style="flex:1;min-width:0">
        <h2>${t.name}</h2>
        <div class="psub">${t.firm||'No firm set'} &middot; ${t.account||'No account'} &middot; ${t.contact||'No contact'}</div>
        <div class="tags">
          <span class="bdg ${phaseClass(t.phase)}">Phase ${t.phase==='1'?'1 — Active':'2B — Community'}</span>
          <span class="bdg ${statusClass(t.operatorStatus)}">${statusLabel(t.operatorStatus)}</span>
          <span class="bdg ${strikeClass(sk)}">${sk} strike${sk!==1?'s':''}</span>
          <span class="bdg b-blue">Health ${hs}/100</span>
          ${done?'<span class="bdg b-green">✓ Phase 2 ready</span>':''}
          ${t.goal?`<span class="bdg ${goalMet?'b-green':'b-gray'}">Goal ${goalMet?'✓ Met':'Pending'}</span>`:''}
          ${t.nextReviewDate?`<span class="bdg b-gray">Next review ${t.nextReviewDate}</span>`:''}
        </div>
      </div>
      <div style="display:flex;gap:7px;flex-shrink:0;flex-wrap:wrap">
        <button class="btn btn-ghost btn-sm" onclick="openEditTrader('${id}')">Edit</button>
        <button class="btn btn-ghost btn-sm" onclick="open1on1Modal('${id}')">+ 1-on-1</button>
        ${t.journal?`<button class="btn btn-ghost btn-sm" onclick="openJournalForTrader('${id}')">Open journal ↗</button>`:''}
        <button class="btn btn-primary btn-sm" onclick="openPayM()">Log payout</button>
      </div>
    </div>

    <div class="mrow">
      <div class="mc mc-gold"><div class="mc-ico">$</div><div class="mc-lbl">Your earnings</div><div class="mc-val">${fmt(tot)}</div><div class="mc-sub">50% of gross</div></div>
      <div class="mc"><div class="mc-ico">#</div><div class="mc-lbl">Payouts</div><div class="mc-val">${tp.length}</div><div class="mc-sub">Avg ${fmt(avgP)}</div></div>
      <div class="mc ${hs>=70?'mc-green':hs>=40?'mc-gold':'mc-red'}"><div class="mc-ico">♥</div><div class="mc-lbl">Health score</div><div class="mc-val">${hs}</div><div class="mc-sub">${pnlTrend}</div></div>
      <div class="mc"><div class="mc-ico">🎯</div><div class="mc-lbl">Monthly goal</div><div class="mc-val">${t.goal?fmt(t.goal):'—'}</div><div class="mc-sub">${goalMet?'✓ Met this month':'Not set'}</div></div>
    </div>

    <div class="g2">
      <div>
        <div class="card">
          <div class="ct">Milestone progress</div>
          <div style="display:flex;justify-content:space-between;font-size:14px;margin-bottom:9px"><span class="fw7">${fmt(tot)}</span><span class="muted">${fmt(Math.max(0,M-tot))} remaining</span></div>
          <div class="bar bar-lg"><div class="bf ${done?'bf-green':'bf-gold'}" style="width:${pct}%"></div></div>
          <div style="display:flex;justify-content:space-between;margin-top:7px;font-size:12px"><span class="muted">${pct}% complete</span>${proj?`<span class="muted">~${proj} month${proj!==1?'s':''} at current pace</span>`:''}</div>
        </div>
        <div class="card mt1">
          <div class="ct">Onboarding checklist</div>
          ${obChecks.map(c=>`<div class="ob"><div class="ob-c ${c.done?'ob-done':'ob-pend'}">${c.done?'✓':'·'}</div><span style="color:${c.done?'var(--text)':'var(--text3)'};font-size:13px">${c.label}</span></div>`).join('')}
        </div>
        ${t.doc1||t.journal||t.journalUserId?`<div class="card mt1"><div class="ct">Links & identifiers</div>${t.doc1?`<div class="sr"><span class="sl">Desk agreement</span><a href="${t.doc1}" target="_blank" style="color:var(--blue);font-size:12px">Open ↗</a></div>`:''} ${t.journal?`<div class="sr"><span class="sl">Journal app</span><a href="${t.journal}" target="_blank" style="color:var(--blue);font-size:12px">Open ↗</a></div>`:''} ${t.journalUserId?`<div class="sr"><span class="sl">Journal user ID</span><span class="sv" style="font-size:12px">${t.journalUserId}</span></div>`:''}</div>`:''}
      </div>
      <div>
        <div class="card">
          <div class="ct">Discipline status</div>
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px">
            <div class="sk-wrap">${[0,1,2].map(i=>`<div class="sk ${i<sk?(sk>=3?'danger':'hit'):''}"></div>`).join('')}</div>
            <span style="font-size:13px;color:${strikeColor(sk)};font-weight:700">${strikeMsg(sk)}</span>
          </div>
          ${tv.slice(-3).map(v=>`<div style="font-size:12px;color:var(--text3);padding:4px 0;border-bottom:1px solid var(--border)">${v.date} &middot; <span style="color:${v.type==='hard'?'var(--red)':'var(--amber)'}">${v.type}</span> &middot; ${v.rule}</div>`).join('')||'<div class="muted ts">No violations</div>'}
        </div>
        <div class="card mt1">
          <div class="ctr"><div class="ct">Journal snapshot</div>${t.journal?`<button class="btn btn-ghost btn-xs" onclick="openJournalForTrader('${id}')">Open journal ↗</button>`:''}</div>
          ${js?`
            <div class="sr"><span class="sl">7-day P&L</span><span class="sv" style="color:${js.pnl7>0?'var(--green)':js.pnl7<0?'var(--red)':'var(--text)'}">${signedFmt(js.pnl7)}</span></div>
            <div class="sr"><span class="sl">Closed trades</span><span class="sv">${js.tradeCount}</span></div>
            <div class="sr"><span class="sl">Win rate</span><span class="sv">${js.winRate}%</span></div>
            <div class="sr"><span class="sl">Average R</span><span class="sv">${js.avgR.toFixed(2)}R</span></div>
            <div class="sr"><span class="sl">Review coverage</span><span class="sv">${js.reviewCoverage}%</span></div>
            <div class="sr"><span class="sl">Missed trades (7d)</span><span class="sv">${js.missed7}</span></div>
            <div class="sr"><span class="sl">Careless incidents (7d)</span><span class="sv">${js.careless7}</span></div>
            <div class="sr"><span class="sl">Unjustified skips (7d)</span><span class="sv">${js.unjustifiedSkips7}</span></div>
            <div class="sr"><span class="sl">Desk reading</span><span class="bdg ${jr.cls}">${jr.label}</span></div>
            <div class="txs muted" style="margin-top:10px">Latest journal activity: ${js.latestActivity||'No recent activity'}</div>
          `:`<div class="empty" style="padding:1rem"><div class="empty-t">Journal not linked yet</div><div class="txs muted">Edit trader and paste the exact journal user ID to pull live execution, review, and discipline signals here.</div></div>`}
        </div>
        <div class="card mt1">
          <div class="ctr"><div class="ct">1-on-1 history</div><button class="btn btn-ghost btn-xs" onclick="open1on1Modal('${id}')">+ Log</button></div>
          ${to.length?to.slice(-4).reverse().map(o=>`<div class="tl-item"><div class="tl-dot tl-${parseInt(o.rating)>=4?'good':parseInt(o.rating)>=3?'info':'warn'}"></div><div style="flex:1"><div style="font-size:13px;font-weight:600">${o.type} <span class="muted ts">${o.date}</span></div>${o.discussed?`<div class="ts muted">${o.discussed.slice(0,60)}${o.discussed.length>60?'...':''}</div>`:''}${o.actions?`<div class="ts" style="color:var(--blue);margin-top:3px">→ ${o.actions.slice(0,50)}${o.actions.length>50?'...':''}</div>`:''}</div><span class="bdg ${parseInt(o.rating)>=4?'b-green':parseInt(o.rating)>=3?'b-blue':'b-amber'}">${o.rating}/5</span></div>`).join(''):'<div class="muted ts">No 1-on-1s logged yet</div>'}
        </div>
      </div>
    </div>

    ${te.length?`<div class="card mt1"><div class="ctr"><div class="ct">Evaluation accounts</div><button class="btn btn-ghost btn-xs" onclick="openM('m-eval')">+ Add eval</button></div><div class="tw" style="box-shadow:none;border:none"><table><thead><tr><th>Eval #</th><th>Firm</th><th>Cost</th><th>Start</th><th>Expiry</th><th>Status</th><th>Who paid</th><th>Update</th></tr></thead><tbody>${te.map(e=>`<tr><td class="fw6">${e.no}</td><td>${e.firm||'—'}</td><td>${e.cost?fmt(e.cost):'—'}</td><td>${e.start||'—'}</td><td>${e.exp||'—'}</td><td><span class="bdg ${evalClass(e.status)}">${e.status}</span></td><td>${e.paid}</td><td><select onchange="updateEvalStatus('${e.id}',this.value)" style="font-size:11px;padding:3px 6px;background:var(--bg3);border:1px solid var(--border2);border-radius:5px;color:var(--text);font-family:inherit"><option ${e.status==='active'?'selected':''} value="active">Active</option><option ${e.status==='passed'?'selected':''} value="passed">Passed</option><option ${e.status==='blown'?'selected':''} value="blown">Blown</option><option ${e.status==='expired'?'selected':''} value="expired">Expired</option></select></td></tr>`).join('')}</tbody></table></div></div>`:''}

    <div class="card mt1">
      <div class="ct">Payout history</div>
      <div class="tw" style="box-shadow:none;border:none"><table><thead><tr><th>Month</th><th>Type</th><th>Gross</th><th>Your 50%</th><th>Notes</th></tr></thead>
      <tbody>${tp.length?[...tp].reverse().map(p=>`<tr><td class="fw7">${p.month}</td><td><span class="bdg b-gray txs">${p.type||'monthly'}</span></td><td>${fmt(p.gross)}</td><td class="green">${fmt(p.gross*SPLIT)}</td><td class="td-sm">${p.notes||'—'}</td></tr>`).join(''):'<tr><td colspan="5" style="text-align:center;padding:1.5rem" class="muted">No payouts yet</td></tr>'}</tbody></table>
      </div>
    </div>
    ${t.notes?`<div class="note mt1"><strong style="font-size:10px;text-transform:uppercase;letter-spacing:.5px">Private notes</strong><br>${t.notes}</div>`:''}
  `;
  nav('trader-profile',null);
  document.getElementById('tb-title').textContent=t.name;
  document.getElementById('tb-add').style.display='none';
}


function openJournalForTrader(tid){
  var t=S.traders.find(function(x){return x.id===tid;});
  if(t&&t.journal){ window.open(t.journal,'_blank'); }
}

function open1on1Modal(tid){populateTraderSels(['o-trader']);document.getElementById('o-trader').value=tid;document.getElementById('o-date').value=today();['o-discussed','o-pattern','o-actions','o-notes'].forEach(x=>document.getElementById(x).value='');document.getElementById('o-type').value='weekly';document.getElementById('o-rating').value='3';document.getElementById('m-1on1').classList.add('open');}

function openCandProfile(id){
  const c=S.candidates.find(c=>c.id===id);if(!c)return;
  const si=STEPS.indexOf(c.stage),score=parseFloat(c.score)||0,iscore=parseFloat(c.iscore)||0;
  const stH=STEPS.map((s,i)=>{const cls=i<si?'s-done':i===si?'s-active':'s-pend';return`<div class="step ${cls}"><div class="s-line"></div><div class="s-circ">${i<si?'✓':i+1}</div><div class="s-lbl">${SLBL[s]}</div></div>`;}).join('');
  document.getElementById('cp-content').innerHTML=`
    <div class="ph">
      <div class="av av-xl av2">${ini(c.name)}</div>
      <div class="pm" style="flex:1">
        <h2>${c.name}</h2>
        <div class="psub">${c.contact||'No contact'} &middot; Added ${c.date}</div>
        <div class="tags">
          <span class="bdg ${c.stage==='rejected'?'b-red':c.stage==='training'?'b-green':'b-gold'}">${SLBL[c.stage]}</span>
          <span class="bdg ${c.dep==='yes'?'b-green':c.dep==='forfeited'?'b-red':'b-gray'}">${c.dep==='yes'?'$600 paid':c.dep==='forfeited'?'Forfeited':'No deposit'}</span>
          ${score?`<span class="bdg ${score>=80?'b-green':score>=60?'b-gold':'b-red'}">Test ${Math.round(score)}/100</span>`:''}
        </div>
      </div>
      <button class="btn btn-ghost btn-sm" onclick="openEditCand('${id}')">Edit</button>
    </div>
    ${c.stage!=='rejected'?`<div class="steps">${stH}</div>`:''}
    <div class="g2">
      <div class="card"><div class="ct">Screening test</div>${score?`<div style="font-size:30px;font-weight:700;color:${scoreColor(score,80)};margin-bottom:9px">${Math.round(score)}<span class="muted" style="font-size:15px">/100</span></div><div class="bar bar-lg"><div class="bf ${scoreBarCls(score,80)}" style="width:${score}%"></div></div><div class="txs muted mt1">${score>=80?'Strong candidate — proceed to interview':score>=60?'Conditional — targeted interview questions':'Below threshold — do not proceed'}</div>`:'<div class="muted ts">No score recorded</div>'}</div>
      <div class="card"><div class="ct">Interview score</div>${iscore?`<div style="font-size:30px;font-weight:700;color:${scoreColor(iscore,15)};margin-bottom:9px">${Math.round(iscore)}<span class="muted" style="font-size:15px">/25</span></div><div class="bar bar-lg"><div class="bf ${scoreBarCls(iscore,15)}" style="width:${iscore/25*100}%"></div></div><div class="txs muted mt1">${iscore>=15?'Meets minimum threshold':'Below threshold — do not proceed'}</div>`:'<div class="muted ts">No score recorded</div>'}</div>
      <div class="card"><div class="sr"><span class="sl">Training week</span><span class="sv">${c.week==='0'?'Not started':c.week==='pass'?'✓ Passed':c.week==='fail'?'✗ Failed':'Week '+c.week}</span></div><div class="sr"><span class="sl">Deposit</span><span class="sv">${c.dep==='yes'?'Paid $600':c.dep==='forfeited'?'Forfeited':'Not paid'}</span></div>${c.rejReason?`<div class="sr"><span class="sl">Rejection reason</span><span class="sv red">${c.rejReason}</span></div>`:''}</div>
      ${c.notes?`<div class="card"><div class="note">${c.notes}</div></div>`:'<div class="card"><div class="muted ts">No notes recorded</div></div>'}
    </div>`;
  nav('cand-profile',null);
  document.getElementById('tb-title').textContent=c.name;
  document.getElementById('tb-add').style.display='none';
}

function pf(f,btn){pipeFilter=f;document.querySelectorAll('#pipe-tabs .tab').forEach(t=>t.classList.remove('active'));btn.classList.add('active');renderPipeline();}

/* CHARTS */
function destroyCharts(){Object.values(charts).forEach(c=>{try{c.destroy();}catch(e){}});charts={};}
function mkChart(id,type,labels,datasets,opts={}){
  const canvas=document.getElementById(id);if(!canvas)return;
  const isDark=document.documentElement.getAttribute('data-theme')==='dark';
  const gc=isDark?'rgba(255,255,255,.04)':'rgba(0,0,0,.04)';
  const tc=isDark?'#5c5a57':'#9a9895';
  var _opts={responsive:true,maintainAspectRatio:false,plugins:{legend:{display:datasets.length>1,labels:{color:tc,font:{size:11},boxWidth:10}}},scales:{x:{ticks:{color:tc,font:{size:10}},grid:{display:false}},y:{ticks:{color:tc,font:{size:10},callback:function(v){return '$'+Math.round(v).toLocaleString();}},grid:{color:gc}}}};charts[id]=new Chart(canvas,{type:type,data:{labels:labels,datasets:datasets},options:_opts});
}

/* DATA / IMPORT / EXPORT */
function exportData(){const b=new Blob([JSON.stringify(S,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=`foundry-${today()}.json`;a.click();}
function importData(e){const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>{try{S=JSON.parse(ev.target.result);/* cloud auto-saves */destroyCharts();render();alert('Data imported successfully.');}catch{alert('Invalid file.');}};r.readAsText(f);e.target.value='';}

/* MAIN RENDER */
function render(){
  document.getElementById('tb-date').textContent=new Date().toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short',year:'numeric'});
  const ph1=S.traders.filter(t=>t.phase==='1'),ph2=S.traders.filter(t=>t.phase==='2');
  const totalY=S.payouts.reduce((s,p)=>s+p.gross*SPLIT,0);
  const mn=thisMonth(),monthY=S.payouts.filter(p=>p.month===mn).reduce((s,p)=>s+p.gross*SPLIT,0);
  const prevMn=new Date(new Date().setMonth(new Date().getMonth()-1)).toISOString().slice(0,7);
  const prevY=S.payouts.filter(p=>p.month===prevMn).reduce((s,p)=>s+p.gross*SPLIT,0);
  const hardV=S.violations.filter(v=>v.type==='hard').length;

  document.getElementById('sb-t').textContent=ph1.length;
  document.getElementById('sb-p').textContent=S.candidates.filter(c=>c.stage!=='rejected').length;
  document.getElementById('sb-c').textContent=S.community.length;
  const sv=document.getElementById('sb-v');sv.textContent=hardV;sv.style.display=hardV?'':'none';

  if(document.getElementById('sec-today').classList.contains('active')){
    document.getElementById('td-yours').textContent=fmt(totalY);
    const trend=monthY>prevY?`<span class="trend-up">↑ vs last month</span>`:monthY<prevY?`<span class="trend-dn">↓ vs last month</span>`:'';
    document.getElementById('td-trend').innerHTML=trend||'All time';
    document.getElementById('td-traders').textContent=ph1.length;
    document.getElementById('td-month').textContent=fmt(monthY);
    document.getElementById('td-comm').textContent=fmt(S.community.length*FEE)+'/mo';

    const alerts=[];
    S.traders.filter(t=>t.phase==='1').forEach(t=>{
      const sk=strikes(t.id);const tot=milTot(t.id);
      if(sk>=3)alerts.push({type:'danger',msg:`${t.name} has 3 strikes — removal action required`});
      else if(sk===2)alerts.push({type:'warn',msg:`${t.name} has 2 strikes — one more means removal`});
      if(tot>=M)alerts.push({type:'success',msg:`${t.name} has reached the $3,000 milestone — Phase 2 conversation due`});
      if(t.evalExp&&t.evalExp<=new Date(Date.now()+7*86400000).toISOString().split('T')[0])alerts.push({type:'warn',msg:`${t.name}'s evaluation account expires ${t.evalExp}`});
      if(t.goal){const gp=S.payouts.filter(p=>p.tid===t.id&&p.month===mn).reduce((s,p)=>s+p.gross,0);if(gp>=parseFloat(t.goal))alerts.push({type:'success',msg:`${t.name} hit their monthly goal of ${fmt(t.goal)} this month`});}
    });
    S.community.filter(m=>m.status==='overdue'||m.status==='suspended').forEach(m=>alerts.push({type:'warn',msg:`${m.name}: community fee is ${m.status}`}));
    const todayEv=S.events.filter(e=>e.date===today());todayEv.forEach(e=>alerts.push({type:'info',msg:`Today: ${e.name}${e.traderName&&e.traderName!=='All desk'?' — '+e.traderName:''}`}));
    if(!S.briefs.length||S.briefs[S.briefs.length-1].date!==today())alerts.push({type:'info',msg:"Today's morning brief has not been posted yet"});
    const AB={danger:'al-danger',warn:'al-warn',info:'al-info',success:'al-success'};
    const AI={danger:'🚨',warn:'⚠️',info:'📋',success:'🎉'};
    var mergedAlerts = alerts.concat(J.alerts);
    document.getElementById('today-alerts').innerHTML=mergedAlerts.map(a=>`<div class="al ${AB[a.type]}"><span>${AI[a.type]}</span><span>${a.msg}</span></div>`).join('');

    document.getElementById('td-milestones').innerHTML=ph1.length?ph1.map(t=>{const tot=milTot(t.id),pct=Math.min(100,Math.round(tot/M*100)),done=tot>=M;return`<div style="margin-bottom:11px"><div style="display:flex;justify-content:space-between;font-size:14px;margin-bottom:6px;font-weight:700"><span>${t.name}</span><span class="${done?'green':'gold'}">${fmt(tot)} / ${fmt(M)}</span></div><div class="bar bar-lg"><div class="bf ${done?'bf-green':'bf-gold'}" style="width:${pct}%"></div></div><div class="txs muted" style="margin-top:4px">${pct}% to Phase 2</div></div>`;}).join(''):'<div class="empty" style="padding:1.2rem"><div class="empty-ico">📊</div>No active traders</div>';

    const lb=S.briefs.length?S.briefs[S.briefs.length-1]:null;
    document.getElementById('td-brief').innerHTML=lb?`<div class="bf-head"><span class="fw7 ts">${lb.date}</span><span class="bias ${biasClass(lb.bias)}">${lb.bias}</span></div>${lb.levels?`<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">${lb.levels.split(',').map(l=>`<span class="lvl-tag">${l.trim()}</span>`).join('')}</div>`:''}<div class="ts" style="color:var(--text2)"><b>MA9:</b> ${lb.ma9||'—'}</div>${lb.watch?`<div class="ts muted mt1">${lb.watch}</div>`:''}`:'<div class="muted ts">No brief posted yet today</div>';

    const linkedWatch=ph1.map(function(t){var sig=t.journalUserId?J.signals[t.journalUserId]:null;var risk=signalRiskLabel(sig);var score=sig?sig.attentionScore:(t.journalUserId?0:-1);return {trader:t,signal:sig,risk:risk,score:score};}).sort(function(a,b){return b.score-a.score;});
    document.getElementById('td-jw-count').textContent=(linkedWatch.filter(function(x){return x.score>0;}).length||0)+' items';
    document.getElementById('td-journal-watch').innerHTML=linkedWatch.length?linkedWatch.slice(0,4).map(function(x,i){var t=x.trader,s=x.signal;return `<div style="display:flex;align-items:center;gap:11px;padding:10px 0;border-bottom:1px solid var(--border)"><div class="av av-s ${AVC[i%3]}">${t.initials}</div><div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:700">${t.name}</div><div class="txs muted">${s?`7d ${signedFmt(s.pnl7)} · reviews ${s.reviewCoverage}% · careless ${s.careless7}`:(t.journalUserId?'Journal looks clean or inactive':'Journal not linked')}</div></div><span class="bdg ${x.risk.cls} txs">${x.risk.label}</span></div>`;}).join(''):'<div class="muted ts">No trader records yet</div>';

    const active=S.candidates.filter(c=>c.stage!=='rejected');
    const activeEvals=S.evals.filter(function(e){return e.status==='active';}).length;
    const overdueCommunity=S.community.filter(function(m){return m.status==='overdue'||m.status==='suspended';}).length;
    const nextReviews=S.traders.filter(function(t){return t.nextReviewDate && t.nextReviewDate<=new Date(Date.now()+7*86400000).toISOString().split('T')[0];}).length;
    const linkedJournal=S.traders.filter(function(t){return !!t.journalUserId;}).length;
    document.getElementById('td-anatomy').innerHTML=`<div class="sr"><span class="sl">Revenue mix</span><span class="sv">${fmt(monthY)} split · ${fmt(S.community.length*FEE)}/mo community</span></div><div class="sr"><span class="sl">Desk seats</span><span class="sv">${ph1.length} active · ${ph2.length} community</span></div><div class="sr"><span class="sl">Pipeline pressure</span><span class="sv">${active.length} active candidate${active.length!==1?'s':''}</span></div><div class="sr"><span class="sl">Active eval exposure</span><span class="sv">${activeEvals} eval account${activeEvals!==1?'s':''}</span></div><div class="sr"><span class="sl">Journal-linked traders</span><span class="sv">${linkedJournal} / ${S.traders.length}</span></div><div class="sr"><span class="sl">Upcoming obligations</span><span class="sv">${nextReviews} review · ${overdueCommunity} overdue fee</span></div>`;
  }

  if(document.getElementById('sec-analytics').classList.contains('active')){
    const avgP=S.payouts.length?S.payouts.reduce((s,p)=>s+p.gross,0)/S.payouts.length:0;
    const conv=S.candidates.length?Math.round(S.traders.length/S.candidates.length*100):0;
    const closest=ph1.length?ph1.reduce((b,t)=>milTot(t.id)>milTot(b.id)?t:b,ph1[0]):null;
    document.getElementById('an-total').textContent=fmt(totalY);document.getElementById('an-avg').textContent=fmt(avgP);document.getElementById('an-conv').textContent=conv+'%';document.getElementById('an-close').textContent=closest?closest.name.split(' ')[0]:'—';

    // earnings chart
    if(!charts['ch-earn']){
      const mMap={};S.payouts.forEach(p=>{if(!mMap[p.month])mMap[p.month]=0;mMap[p.month]+=p.gross*SPLIT;});
      const mk=Object.keys(mMap).sort().slice(-8);
      const mv=mk.map(k=>Math.round(mMap[k]));
      const isDark=document.documentElement.getAttribute('data-theme')==='dark';
      if(mk.length)mkChart('ch-earn','bar',mk,[{data:mv,backgroundColor:isDark?'rgba(212,168,67,.45)':'rgba(184,135,10,.35)',borderColor:isDark?'#d4a843':'#b8870a',borderWidth:1.5,borderRadius:5}]);
      else document.getElementById('ch-earn').parentElement.innerHTML='<div class="empty" style="margin:0">No payout data yet</div>';
    }

    // P&L chart per trader
    if(!charts['ch-pnl']&&ph1.length){
      const mPnl={};S.sessions.forEach(s=>{const mo=s.date.slice(0,7);if(!mPnl[mo])mPnl[mo]={};if(!mPnl[mo][s.tid])mPnl[mo][s.tid]=0;mPnl[mo][s.tid]+=s.pnl;});
      const allMo=[...new Set(S.sessions.map(s=>s.date.slice(0,7)))].sort().slice(-6);
      const colors=['#d4a843','#4fa876','#5b8dd4','#d4893a'];
      if(allMo.length){
        const datasets=ph1.slice(0,3).map((t,i)=>({label:t.name.split(' ')[0],data:allMo.map(m=>Math.round(mPnl[m]?.[t.id]||0)),borderColor:colors[i%colors.length],backgroundColor:'transparent',tension:.35,pointRadius:3,borderWidth:2}));
        mkChart('ch-pnl','line',allMo,datasets);
      }else document.getElementById('ch-pnl').parentElement.innerHTML='<div class="empty" style="margin:0">No session data yet</div>';
    }

    document.getElementById('an-vel').innerHTML=ph1.length?ph1.map(t=>{const tot=milTot(t.id),pct=Math.min(100,Math.round(tot/M*100)),tp=S.payouts.filter(p=>p.tid===t.id),proj=tp.length&&tot<M?Math.ceil((M-tot)/(tot/tp.length)):null;const monthlyEarn=tp.filter(p=>p.month===mn).reduce((s,p)=>s+p.gross*SPLIT,0);return`<div style="margin-bottom:16px"><div style="display:flex;justify-content:space-between;font-size:14px;margin-bottom:6px"><span class="fw7">${t.name}</span><span class="muted ts">${proj?`~${proj}mo to Phase 2`:'✓ Milestone reached'}</span></div><div class="bar bar-lg"><div class="bf bf-gold" style="width:${pct}%"></div></div><div style="display:flex;justify-content:space-between;margin-top:5px"><span class="txs muted">${fmt(tot)} of ${fmt(M)}</span><span class="txs muted">This month: ${fmt(monthlyEarn)}</span></div></div>`;}).join(''):'<div class="muted ts">No active traders</div>';

    document.getElementById('an-break').innerHTML=S.traders.length?`<div class="tw" style="box-shadow:none;border:none"><table><thead><tr><th>Trader</th><th>Payouts</th><th>Gross total</th><th>Your earnings</th><th>Avg/payout</th><th>Health</th><th>Strikes</th><th>Phase</th></tr></thead><tbody>${S.traders.map(t=>{const tp=S.payouts.filter(p=>p.tid===t.id),tg=tp.reduce((s,p)=>s+p.gross,0),te=tg*SPLIT,av=tp.length?tg/tp.length:0,hs=healthScore(t.id),sk=strikes(t.id);return`<tr><td class="fw7">${t.name}</td><td>${tp.length}</td><td>${fmt(tg)}</td><td class="green">${fmt(te)}</td><td>${fmt(av)}</td><td style="color:${hsColor(hs)};font-weight:700">${hs}</td><td><div class="sk-wrap">${strikeDots(sk)}</div></td><td><span class="bdg ${phaseClass(t.phase)}">Ph.${t.phase==='1'?'1':'2B'}</span></td></tr>`;}).join('')}</tbody></table></div>`:'<div class="muted ts">No traders</div>';
  }

  if(document.getElementById('sec-calendar').classList.contains('active')){
    const upcoming=S.events.filter(e=>e.date>=today()).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,8);
    document.getElementById('cal-upcoming').innerHTML=upcoming.length?upcoming.map(e=>{const daysUntil=Math.ceil((new Date(e.date)-new Date(today()))/(86400000));return`<div class="pi" style="cursor:default"><span class="bdg ${EV_COLORS[e.type]||'b-gray'} txs">${daysUntil===0?'Today':daysUntil===1?'Tomorrow':daysUntil+'d'}</span><div style="flex:1"><div style="font-size:13px;font-weight:600">${e.name}</div><div class="txs muted">${e.date} &middot; ${e.traderName||'All desk'}</div></div></div>`;}).join(''):'<div class="muted ts">No upcoming events</div>';

    const daysInMonth=new Date(new Date().getFullYear(),new Date().getMonth()+1,0).getDate();
    const mEvents=S.events.filter(e=>e.date.startsWith(thisMonth()));
    document.getElementById('cal-month').innerHTML=mEvents.length?mEvents.map(e=>`<div class="sr"><span class="sl">${e.date.slice(-2)}</span><span style="font-size:13px;font-weight:600">${e.name}</span><span class="bdg ${EV_COLORS[e.type]||'b-gray'} txs">${e.type}</span></div>`).join(''):'<div class="muted ts">No events this month</div>';

    document.getElementById('cal-evals').innerHTML=S.evals.length?S.evals.map(e=>{const daysLeft=e.exp?Math.ceil((new Date(e.exp)-new Date(today()))/(86400000)):null;return`<div class="sr"><span class="sl">${e.traderName}</span><div style="flex:1;margin-left:8px"><span class="fw6 ts">${e.no} &middot; ${e.firm||'—'}</span></div><span class="bdg ${e.status==='passed'?'b-green':e.status==='active'?daysLeft&&daysLeft<=7?'b-red':'b-blue':e.status==='blown'?'b-red':'b-gray'}">${e.status}${daysLeft!==null&&e.status==='active'?` (${daysLeft}d)`:''}</span></div>`;}).join(''):'<div class="muted ts">No evaluations tracked</div>';
  }

  if(document.getElementById('sec-traders').classList.contains('active')){
    const tc=document.getElementById('trader-cards'),te=document.getElementById('t-empty');
    if(!S.traders.length){tc.innerHTML='';te.style.display='block';}
    else{te.style.display='none';tc.innerHTML=S.traders.map((t,i)=>{const tot=milTot(t.id),pct=Math.min(100,Math.round(tot/M*100)),done=tot>=M,sk=strikes(t.id),hs=healthScore(t.id),hsC=hsColor(hs);const monthlyGross=S.payouts.filter(p=>p.tid===t.id&&p.month===mn).reduce((s,p)=>s+p.gross,0);return`<div class="card" style="cursor:pointer;transition:transform .14s" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform=''" onclick="openTraderProfile('${t.id}')"><div style="display:flex;align-items:center;gap:11px;margin-bottom:13px"><div class="av av-m ${AVC[i%3]}">${t.initials}</div><div style="flex:1;min-width:0"><div style="font-size:15px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${t.name}</div><div class="ts muted">${t.firm||'No firm'} &middot; Since ${t.date}</div></div><span class="bdg ${phaseClass(t.phase)}">Ph.${t.phase==='1'?'1':'2B'}</span><span class="bdg ${statusClass(t.operatorStatus)} txs">${statusLabel(t.operatorStatus)}</span></div><div class="sr"><span class="sl">Your earnings</span><span class="gold">${fmt(tot)}</span></div><div class="sr"><span class="sl">This month</span><span style="color:var(--text);font-weight:600">${fmt(monthlyGross*SPLIT)}</span></div><div class="sr"><span class="sl">Health</span><span style="color:${hsC};font-weight:700">${hs}/100</span></div><div class="sr"><span class="sl">Strikes</span><div class="sk-wrap">${strikeDots(sk)}</div></div>${t.phase==='1'?`<div style="margin-top:10px"><div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text3);margin-bottom:5px"><span>Milestone</span><span>${pct}%</span></div><div class="bar"><div class="bf ${done?'bf-green':'bf-gold'}" style="width:${pct}%"></div></div></div>`:'<div class="sr"><span class="sl">Community fee</span><span class="sv">$500/mo</span></div>'}</div>`;}).join('');}
  }

  renderPipeline();

  if(document.getElementById('sec-community').classList.contains('active')){
    const paid=S.community.filter(m=>m.status==='paid').length,ov=S.community.filter(m=>m.status==='overdue'||m.status==='suspended').length;
    document.getElementById('cm-cnt').textContent=S.community.length;document.getElementById('cm-fees').textContent=fmt(S.community.length*FEE)+'/mo';document.getElementById('cm-paid').textContent=fmt(paid*FEE);document.getElementById('cm-ov').textContent=fmt(ov*FEE);
    document.getElementById('cm-rows').innerHTML=S.community.length?S.community.map(m=>`<tr><td><div style="display:flex;align-items:center;gap:9px"><div class="av av-s av2">${m.initials}</div><div><div class="fw6">${m.name}</div><div class="txs muted">${m.contact||'—'}</div></div></div></td><td>${m.date}</td><td>${m.contact||'—'}</td><td><span class="bdg ${m.status==='paid'?'b-green':m.status==='pending'?'b-amber':'b-red'}">${m.status}</span></td><td><span class="bdg ${m.status==='suspended'?'b-red':'b-green'}">${m.status==='suspended'?'Suspended':'Active'}</span></td><td><select onchange="setCmStatus('${m.id}',this.value)" style="font-size:11px;padding:3px 6px;background:var(--bg3);border:1px solid var(--border2);border-radius:5px;color:var(--text);font-family:inherit"><option ${m.status==='paid'?'selected':''} value="paid">Paid</option><option ${m.status==='pending'?'selected':''} value="pending">Pending</option><option ${m.status==='overdue'?'selected':''} value="overdue">Overdue</option><option ${m.status==='suspended'?'selected':''} value="suspended">Suspended</option></select></td></tr>`).join(''):'<tr><td colspan="6" style="text-align:center;padding:2.5rem" class="muted">No community members yet</td></tr>';
  }

  if(document.getElementById('sec-payouts').classList.contains('active')){
    document.getElementById('py-total').textContent=fmt(totalY);document.getElementById('py-month').textContent=fmt(monthY);document.getElementById('py-cnt').textContent=S.payouts.length;document.getElementById('py-act').textContent=ph1.length;
    const rm={};
    document.getElementById('py-rows').innerHTML=S.payouts.length?[...S.payouts].reverse().map(p=>{if(!rm[p.tid])rm[p.tid]=0;rm[p.tid]+=p.gross*SPLIT;const done=rm[p.tid]>=M;return`<tr><td class="fw7">${p.month}</td><td>${p.traderName}</td><td><span class="bdg b-gray txs">${p.type||'monthly'}</span></td><td>${fmt(p.gross)}</td><td class="green">${fmt(p.gross*SPLIT)}</td><td>${fmt(rm[p.tid])}</td><td><span class="bdg ${done?'b-green':'b-gray'}">${done?'✓ Phase 2':Math.round(rm[p.tid]/M*100)+'%'}</span></td><td class="td-sm">${p.notes||'—'}</td></tr>`;}).join(''):'<tr><td colspan="8" style="text-align:center;padding:2.5rem" class="muted">No payouts logged yet</td></tr>';
  }

  if(document.getElementById('sec-briefings').classList.contains('active')){
    const bl=document.getElementById('brief-list'),be=document.getElementById('brief-empty');
    if(!S.briefs.length){bl.innerHTML='';be.style.display='block';}
    else{be.style.display='none';bl.innerHTML=[...S.briefs].reverse().map(b=>`<div class="bf-card"><div class="bf-head"><span class="fw7">${b.date}</span><span class="bias ${biasClass(b.bias)}">${b.bias}</span></div>${b.levels?`<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">${b.levels.split(',').map(l=>`<span class="lvl-tag">${l.trim()}</span>`).join('')}</div>`:''}<div class="ts" style="color:var(--text2);margin-bottom:4px"><b>MA9:</b> ${b.ma9||'—'}</div><div class="ts" style="color:var(--text2);margin-bottom:4px"><b>Watch:</b> ${b.watch||'—'}</div>${b.news?`<div class="txs muted"><b>News:</b> ${b.news}</div>`:''}</div>`).join('');}
  }

  if(document.getElementById('sec-sessions').classList.contains('active')){
    document.getElementById('ss-rows').innerHTML=S.sessions.length?[...S.sessions].reverse().map(s=>`<tr><td class="fw6">${s.date}</td><td><span class="bdg b-gray txs">${s.type}</span></td><td>${s.traderName}</td><td>${s.trades}</td><td style="color:${pnlColor(s.pnl)};font-weight:700">${s.pnl>0?'+':''}${fmt(s.pnl)}</td><td><span class="bdg ${dllClass(s.dll)} txs">${s.dll}</span></td><td><span class="bdg ${repClass(s.rep)} txs">${s.rep}</span></td><td style="font-weight:700;color:${moodColor(s.mood)}">${s.mood||'—'}/10</td><td class="td-sm" style="max-width:110px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${s.notes||'—'}</td></tr>`).join(''):'<tr><td colspan="9" style="text-align:center;padding:2.5rem" class="muted">No sessions logged yet</td></tr>';
  }

  if(document.getElementById('sec-violations').classList.contains('active')){
    const hard=S.violations.filter(v=>v.type==='hard').length,soft=S.violations.filter(v=>v.type==='soft').length,risk=S.traders.filter(t=>strikes(t.id)>=2).length;
    document.getElementById('vl-tot').textContent=S.violations.length;document.getElementById('vl-hard').textContent=hard;document.getElementById('vl-soft').textContent=soft;document.getElementById('vl-risk').textContent=risk;
    document.getElementById('vl-rows').innerHTML=S.violations.length?[...S.violations].reverse().map(v=>`<tr><td>${v.date}</td><td class="fw7">${v.traderName}</td><td><span class="bdg ${v.type==='hard'?'b-red':'b-amber'} txs">${v.type}</span></td><td>${v.rule}</td><td style="font-weight:700;color:${strikes(v.tid)>=3?'var(--red)':strikes(v.tid)>=2?'var(--amber)':'var(--text)'}">${strikes(v.tid)}</td><td class="td-sm">${v.desc||'—'}</td><td class="td-sm">${v.action||'—'}</td></tr>`).join(''):'<tr><td colspan="7" style="text-align:center;padding:2.5rem" class="muted">No violations logged</td></tr>';
  }

  if(document.getElementById('sec-scorecard').classList.contains('active')){
    const sl=document.getElementById('sc-list'),se=document.getElementById('sc-empty');
    if(!S.scorecards.length){sl.innerHTML='';se.style.display='block';}
    else{se.style.display='none';sl.innerHTML=[...S.scorecards].reverse().map(sc=>{const moodC=parseInt(sc.mood)>=4?'var(--green)':parseInt(sc.mood)>=3?'var(--gold)':'var(--red)';return`<div class="card mb1"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><span class="fw7">${sc.date}</span><span style="font-size:15px;font-weight:700;color:${moodC}">Mood ${sc.mood}/5</span></div><div class="g3 mb1"><div style="text-align:center;background:var(--bg3);padding:10px;border-radius:8px"><div class="ts muted">Sessions</div><div style="font-size:18px;font-weight:700">${sc.sessions||0}</div></div><div style="text-align:center;background:var(--bg3);padding:10px;border-radius:8px"><div class="ts muted">Reports on time</div><div style="font-size:18px;font-weight:700">${sc.reports||0}</div></div><div style="text-align:center;background:var(--bg3);padding:10px;border-radius:8px"><div class="ts muted">Total P&L</div><div style="font-size:18px;font-weight:700;color:${parseFloat(sc.pnl)>0?'var(--green)':parseFloat(sc.pnl)<0?'var(--red)':'var(--text)'}">${parseFloat(sc.pnl)>0?'+':''}${fmt(sc.pnl)}</div></div></div>${sc.wins?`<div class="ts mb1"><b style="color:var(--green)">✓ Wins:</b> ${sc.wins}</div>`:''} ${sc.issues?`<div class="ts mb1"><b style="color:var(--red)">✗ Issues:</b> ${sc.issues}</div>`:''} ${sc.focus?`<div class="ts"><b style="color:var(--blue)">→ Focus next week:</b> ${sc.focus}</div>`:''}</div>`;}).join('');}
  }
}

function renderPipeline(){
  if(!document.getElementById('sec-pipeline').classList.contains('active'))return;
  const pl=document.getElementById('pipe-list'),pe=document.getElementById('pipe-empty');
  const filtered=pipeFilter==='all'?S.candidates:S.candidates.filter(c=>c.stage===pipeFilter);
  if(!filtered.length){pl.innerHTML='';pe.style.display='block';}
  else{pe.style.display='none';pl.innerHTML=filtered.map(c=>{const sc=parseFloat(c.score)||0;return`<div class="pi" onclick="openCandProfile('${c.id}')"><span class="sdot ${SDOT[c.stage]}"></span><div style="flex:1;min-width:0"><div style="font-size:14px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${c.name}</div><div class="txs muted">${c.contact||'—'} &middot; ${c.date}</div></div>${sc?`<span class="bdg ${sc>=80?'b-green':sc>=60?'b-gold':'b-red'} txs">${Math.round(sc)}/100</span>`:''}<span class="bdg ${c.stage==='rejected'?'b-red':c.stage==='training'?'b-green':'b-gold'}">${SLBL[c.stage]}</span><span class="bdg ${c.dep==='yes'?'b-green':'b-gray'} txs">${c.dep==='yes'?'$600':'No dep.'}</span></div>`;}).join('');}
}

document.querySelectorAll('.overlay').forEach(o=>{o.addEventListener('click',e=>{if(e.target===o)closeM();});});
loadAll();