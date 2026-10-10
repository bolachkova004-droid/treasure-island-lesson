'use strict';
/* =====================================================================
   АНАЛИТИКА — единая шина событий и простая воронка.
   Каждый игрок — одна запись: когда впервые случилось каждое событие и сколько раз.
   Запись хранится в браузере игрока и, если страница опубликована с хранилищем,
   в общей базе (funnel/<id игрока>), которую читает только автор игры.
   Имена и тексты игроков не собираются.
   ===================================================================== */
const EVENTS = ['game_opened','new_game_started','language_mode_selected','first_move','first_interaction','first_dialogue',
  'reached_zavetye','first_clue','first_english_clue','translation_used','language_lens_selected','version_changed_after_language',
  'notebook_opened','evidence_added','theory_started','theory_submitted','chapter_completed','game_completed','game_abandoned'];
/* главная воронка: открыли → начали → дошли до Заветья → первая улика → English Evidence → версия → завершили */
const FUNNEL = [ ['game_opened','Открыли игру'], ['new_game_started','Начали историю'], ['reached_zavetye','Дошли до Заветья'],
  ['first_clue','Нашли первую улику'], ['language_lens_selected','Использовали английскую улику'], ['theory_submitted','Рассказали версию'], ['game_completed','Завершили'] ];
const AN_KEY = 'zavetye.analytics.v1';
const AN = { rec:{ v:1, first:{}, count:{}, mode:null, last:null, startedAt:null }, db:null, uid:null, owner:false, t:null, busy:false, dirty:false };
try{ const o = JSON.parse(localStorage.getItem(AN_KEY) || 'null'); if(o && o.v === 1) AN.rec = o; }catch(e){}

function track(name, props){
  const r = AN.rec, now = Date.now();
  if(!r.first[name]) r.first[name] = now;
  r.count[name] = (r.count[name] || 0) + 1;
  if(props && props.mode) r.mode = props.mode;
  if(name === 'new_game_started') r.startedAt = now;
  if(st) r.last = { day:st.day, phase:st.phase, strip:st.strip, scene:st.scene || null, outcome:st.outcome || null, at:now };
  try{ localStorage.setItem(AN_KEY, JSON.stringify(r)); }catch(e){}
  AN.dirty = true; flushSoon(name === 'game_completed' || name === 'theory_submitted' ? 300 : 8000);
}
/* «впервые»: событие пишется один раз за игру */
function trackOnce(name, props){ if(!st || !st.tut) return track(name, props); const k = 'ev_' + name; if(st.tut[k]) return; st.tut[k] = 1; track(name, props); }

function flushSoon(ms){ clearTimeout(AN.t); AN.t = setTimeout(flush, ms); }
async function flush(){
  if(!AN.db || !AN.uid || AN.busy || !AN.dirty) return;
  AN.busy = true; AN.dirty = false;
  try{ await AN.db.doc('funnel/' + AN.uid).set(JSON.parse(JSON.stringify(AN.rec))); }
  catch(e){ if(e && e.code === 'invalid_argument') AN.db = null; else AN.dirty = true; }
  AN.busy = false;
}
/* брошенная игра — последнее место, где игрок был, когда закрыл страницу */
addEventListener('visibilitychange', () => { if(document.visibilityState === 'hidden' && st && !st.outcome && AN.rec.startedAt){ track('game_abandoned'); flush(); } });

(async () => {
  track('game_opened');
  if(!window.claude || !window.claude.use) return;
  try{
    const [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]);
    if(!db || !user) return;
    AN.owner = !!(user.isOwner && await user.isOwner());
    const id = await user.id(); if(!id) return;
    const can = user.can ? await user.can('data.write') : null;
    AN.db = db; AN.uid = id;
    if(can === false && !AN.owner) AN.db = null;   // зритель без права записи — события остаются в его браузере
    flushSoon(20000);   // не сразу: превью и миниатюры не считаются открытием
    if(typeof renderMenu === 'function') renderMenu();
  }catch(e){}
})();

/* для автора: воронка по всем игрокам */
async function funnelReport(){
  if(!AN.owner || !window.claude) return null;
  try{
    const db = AN.db || await window.claude.use('db'); if(!db) return null;
    const snap = await db.collection('funnel').limit(1000).get();
    const rows = snap.docs.map(d => d.data()).filter(Boolean);
    const steps = FUNNEL.map(([k, label]) => ({ k, label, n: rows.filter(r => r.first && r.first[k]).length }));
    const tr = rows.filter(r => r.count && r.count.translation_used).length;
    const lensAfter = rows.filter(r => r.first && r.first.version_changed_after_language).length;
    const where = {}; for(const r of rows) if(r.last && !(r.first && r.first.game_completed) && r.first && r.first.new_game_started){ const k = r.last.strip + (r.last.scene ? ' · ' + r.last.scene : ''); where[k] = (where[k] || 0) + 1; }
    return { players: rows.length, steps, tr, lensAfter, where: Object.entries(where).sort((a, b) => b[1] - a[1]).slice(0, 5) };
  }catch(e){ return null; }
}
