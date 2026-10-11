'use strict';
/* =====================================================================
   ЗАВЕТЬЕ — движок
   Состояние, время, сохранение, настройки игрока, английский текст.
   ===================================================================== */
const SAVE_KEY = 'zavetye.save.v3';
const SET_KEY = 'zavetye.settings.v1';
const WEEK = ['Понедельник','Вторник','Среда','Четверг','Пятница','Суббота','Воскресенье'];
const PHASES = ['утро','полдень','вечер','ночь'];
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

let st = null;

function fresh(diff){
  return { v:3, diff, day:0, phase:2, strip:'flat', x:720, dir:-1, scene:null, view:null, wake:null, bus:null,
    flags:{}, clues:{}, order:[], notes:[], changes:[], people:[], rel:{grisha:0,grunya:0,varya:0,nina:0},
    signal:3, unseen:0, morningDue:false, ver:{ s:null, att:[] }, outcome:null,
    seen:[], press:{}, tut:{}, lore:[] };
}
/* старые сохранения дополняются новыми полями */
function upgrade(s){ if(!s) return s; s.seen = s.seen || []; s.press = s.press || {}; s.tut = s.tut || {}; s.lore = s.lore || []; return s; }
const dayName = d => WEEK[(1 + d) % 7];
const F = k => !!(st && st.flags[k]);
const setF = (k, v = true) => { st.flags[k] = v; };
const isPhase = (...p) => p.includes(st.phase);

/* ---------- сохранение ---------- */
function save(){ try{ localStorage.setItem(SAVE_KEY, JSON.stringify(st)); }catch(e){} }
function loadSave(){ try{ const s = localStorage.getItem(SAVE_KEY); if(!s) return null; const o = JSON.parse(s); return o && o.v === 3 ? upgrade(o) : null; }catch(e){ return null; } }
function wipeSave(){ try{ localStorage.removeItem(SAVE_KEY); }catch(e){} }
/* после важных событий — короткая отметка «сохранено» */
let savedT = null;
function saveMark(){ save(); const el = $('saved'); if(!el) return; el.classList.add('on'); clearTimeout(savedT); savedT = setTimeout(() => el.classList.remove('on'), 1600); }

/* ---------- настройки игрока (отдельно от сохранения игры) ---------- */
const SET = { music:70, amb:80, fx:80, size:'m' };
try{ Object.assign(SET, JSON.parse(localStorage.getItem(SET_KEY) || '{}')); }catch(e){}
try{ if(localStorage.getItem('zavetye.mute') === '1'){ SET.music = SET.amb = SET.fx = 0; localStorage.removeItem('zavetye.mute'); } }catch(e){}
function saveSet(){ try{ localStorage.setItem(SET_KEY, JSON.stringify(SET)); }catch(e){} }
const SIZES = { s:.9, m:1, l:1.15 };
function applySize(){ document.documentElement.style.setProperty('--fs', SIZES[SET.size] || 1); }
applySize();

/* ---------- время ---------- */
function pass(n){
  for(let i = 0; i < n; i++){
    st.phase++;
    if(st.phase > 3){ st.phase = 0; st.day++; st.morningDue = true; st.wake = 'bed'; }
  }
}
function sleep(){ st.day++; st.phase = 0; st.morningDue = true; st.wake = 'bed'; }

/* ---------- английский: как чернила; перевод — карандашная пометка под оригиналом ----------
   В строке английского ключевая конструкция может быть отмечена [квадратными скобками]:
   она подчёркивается красной нитью. */
const enMark = s => s.replace(/\[([^\]]+)\]/g, '<u>$1</u>');
const enPlain = s => s.replace(/[\[\]]/g, '');
function en(s, ru){
  const e = `<span class="en" lang="en">${enMark(s)}</span>`;
  // перевод не висит постоянно: его подсматривают по «?» (в режиме поддержки он ещё и открывается после первой попытки)
  if(!st || st.diff === 'easy' || st.diff === 'normal') return `<span class="enw">${e}<button type="button" class="trb" data-tr="${esc(ru)}" aria-label="Подсмотреть перевод" title="Подсмотреть перевод">?</button></span>`;
  return e;
}

/* ---------- мелочи интерфейса ---------- */
let toastT = null;
function toast(msg){
  const t = $('toast'); t.textContent = msg; t.classList.add('on');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 2800);
}
/* подпись к важному звуку — чтобы подсказку понял и тот, кто играет без звука */
let capT = null;
function caption(msg, ms = 3800){
  const c = $('caption'); if(!c) return; c.textContent = msg; c.classList.add('on');
  clearTimeout(capT); capT = setTimeout(() => c.classList.remove('on'), ms);
}
