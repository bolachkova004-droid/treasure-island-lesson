'use strict';
/* =====================================================================
   ЗАВЕТЬЕ — движок
   Состояние, время, улики, версии. Сцены — в SCENES ниже.
   ===================================================================== */
const SAVE_KEY = 'zavetye.save.v3';
const WEEK = ['Понедельник','Вторник','Среда','Четверг','Пятница','Суббота','Воскресенье'];
const PHASES = ['утро','полдень','вечер','ночь'];
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

let st = null;

function fresh(diff){
  return { v:3, diff, day:0, phase:2, strip:'flat', x:720, dir:-1, scene:null, view:null, wake:null, bus:null,
    flags:{}, clues:{}, order:[], notes:[], changes:[], people:[], rel:{grisha:0,grunya:0,varya:0,nina:0},
    signal:3, unseen:0, morningDue:false, ver:{ s:null, att:[] }, outcome:null };
}
const dayName = d => WEEK[(1 + d) % 7];
const F = k => !!(st && st.flags[k]);
const setF = (k, v = true) => { st.flags[k] = v; };
const isPhase = (...p) => p.includes(st.phase);

/* ---------- сохранение ---------- */
function save(){ try{ localStorage.setItem(SAVE_KEY, JSON.stringify(st)); }catch(e){} }
function loadSave(){ try{ const s = localStorage.getItem(SAVE_KEY); if(!s) return null; const o = JSON.parse(s); return o && o.v === 3 ? o : null; }catch(e){ return null; } }
function wipeSave(){ try{ localStorage.removeItem(SAVE_KEY); }catch(e){} }

/* ---------- время ---------- */
function pass(n){
  for(let i = 0; i < n; i++){
    st.phase++;
    if(st.phase > 3){ st.phase = 0; st.day++; st.morningDue = true; st.wake = 'bed'; }
  }
}
function sleep(){ st.day++; st.phase = 0; st.morningDue = true; st.wake = 'bed'; }

/* ---------- английский и перевод ---------- */
function en(s, ru){
  const e = `<span class="en" lang="en">${s}</span>`;
  if(!st || st.diff === 'easy') return `<span class="enw">${e}<span class="tr">${ru}</span></span>`;
  if(st.diff === 'normal') return `<span class="enw">${e}<button type="button" class="trb" data-tr="${esc(ru)}">перевод</button></span>`;
  return e;
}

/* ---------- мелочи интерфейса ---------- */
let toastT = null;
function toast(msg){
  const t = $('toast'); t.textContent = msg; t.classList.add('on');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 2600);
}
