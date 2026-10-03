/* Английская озвучка для всех страниц урока.
   Браузер сам по себе часто читает английский русским голосом или
   голосом-«шуткой» (на Mac: Albert, Bad News…). Здесь выбираем лучший
   доступный английский голос, даём выбрать его вручную и держим скорость
   в диапазоне, где речь не ломается. */
(() => {
'use strict';

const synth = 'speechSynthesis' in window ? window.speechSynthesis : null;
const PREF = 'tts-voice-v1';
const SAMPLE = 'Jim had to keep an eye out for a sailor with one leg.';

/* голоса-эффекты macOS и роботизированные Eloquence */
const NOVELTY = /^(albert|bad news|bahh|bells|boing|bubbles|cellos|good news|jester|organ|pipe organ|superstar|trinoids|whisper|wobble|zarvox|deranged|hysterical|fred|junior|ralph|kathy|princess)\b/i;
const ROBOTIC = /^(eddy|flo|grandma|grandpa|reed|rocko|sandy|shelley)\b/i;
const NICE = /(samantha|daniel|serena|kate|oliver|arthur|martha|karen|moira|tessa|libby|sonia|ryan|aria|jenny|guy|hazel|susan|george|google uk english|google us english)/i;
const HQ = /(natural|neural|premium|enhanced|online)/i;

let voices = [];
function load(){ if(synth) voices = synth.getVoices() || []; return voices; }
if(synth){
  load();
  if(typeof synth.addEventListener === 'function') synth.addEventListener('voiceschanged', () => { load(); refreshPicker(); });
  else synth.onvoiceschanged = () => { load(); refreshPicker(); };
}

function score(v){
  const lang = (v.lang || '').replace('_', '-').toLowerCase();
  if(!lang.startsWith('en')) return -1;
  const name = v.name || '';
  if(NOVELTY.test(name)) return -1;
  let s = 10;
  if(ROBOTIC.test(name)) s -= 30;
  if(HQ.test(name)) s += 50;
  if(NICE.test(name)) s += 40;
  if(/^microsoft .* desktop/i.test(name)) s += 5;
  if(lang === 'en-gb') s += 20; else if(lang === 'en-us') s += 15; else s += 5;
  return s;
}
function english(){
  return load().filter(v => score(v) > -1).sort((a, b) => score(b) - score(a));
}
function current(){
  const list = english();
  let pref = '';
  try { pref = localStorage.getItem(PREF) || ''; } catch(e){}
  return list.find(v => v.voiceURI === pref || v.name === pref) || list[0] || null;
}

let warned = false;
function notice(msg){
  const t = document.getElementById('toast');
  if(t){ t.textContent = msg; t.classList.add('show'); clearTimeout(notice._t); notice._t = setTimeout(() => t.classList.remove('show'), 3200); }
}

/* rate: 1 — обычная речь; всё ниже .7 у большинства голосов звучит «сломанно» */
function speak(text, rate, voiceOverride){
  if(!synth){ notice('В этом браузере нет озвучки. Попробуйте Chrome, Edge или Safari.'); return false; }
  const v = voiceOverride || current();
  if(!v && !warned){ warned = true; notice('На устройстве нет английского голоса — нажмите «🔊 Голос», там инструкция.'); }
  synth.cancel();
  const u = new SpeechSynthesisUtterance(String(text));
  if(v){ u.voice = v; u.lang = v.lang; } else u.lang = 'en-GB';
  const r = Number(rate) || .9;
  u.rate = Math.min(1.05, Math.max(.72, r < .75 ? .72 : r + .08));
  u.pitch = 1;
  window.__ttsUtterance = u;           /* Chrome иначе может собрать фразу сборщиком мусора и оборвать её */
  setTimeout(() => synth.speak(u), 50); /* Chrome теряет фразу, если speak вызвать сразу после cancel */
  return true;
}

/* ---------- окно выбора голоса ---------- */
let box = null;
function css(){
  if(document.getElementById('tts-style')) return;
  const st = document.createElement('style'); st.id = 'tts-style';
  st.textContent =
    '.tts-bg{position:fixed;inset:0;z-index:200;display:none;align-items:flex-end;justify-content:center;background:rgba(35,58,87,.45)}' +
    '.tts-bg.open{display:flex}' +
    '.tts{width:min(560px,100%);max-height:88vh;overflow-y:auto;padding:22px 18px calc(22px + env(safe-area-inset-bottom));color:#233a57;background:#f4f9ff;border-radius:26px 26px 0 0;font-family:Nunito,"Trebuchet MS",sans-serif;font-weight:600}' +
    '@media (min-width:640px){.tts-bg{align-items:center}.tts{border-radius:26px}}' +
    '.tts h2{margin:0;font-family:Rubik,"Trebuchet MS",sans-serif;font-size:26px;font-weight:800}' +
    '.tts p{margin:8px 0;font-size:15px;color:#5d6f88}' +
    '.tts-row{display:grid;grid-template-columns:1fr auto auto;gap:8px;align-items:center;margin-top:8px;padding:10px 12px;background:#fff;border:2px solid #dbe7f3;border-radius:16px}' +
    '.tts-row.on{border-color:#4cc25a;background:#eafbe9}' +
    '.tts-row b{display:block;font-family:Rubik,"Trebuchet MS",sans-serif;font-size:15.5px}' +
    '.tts-row span{font-size:13px;color:#5d6f88}' +
    '.tts-row em{display:inline-block;margin-left:6px;padding:1px 7px;font-style:normal;font-size:11px;font-weight:800;color:#fff;background:#ffb020;border-radius:999px}' +
    '.tts button{min-height:40px;padding:6px 12px;font-family:Rubik,"Trebuchet MS",sans-serif;font-size:13.5px;font-weight:800;color:#233a57;background:#fff;border:2px solid #dbe7f3;border-radius:12px;cursor:pointer}' +
    '.tts button.pick{color:#fff;background:#38b6ff;border-color:#38b6ff}' +
    '.tts .tts-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}' +
    '.tts details{margin-top:14px;padding:10px 12px;background:#fff8dc;border:2px dashed #f0d27a;border-radius:16px;font-size:14.5px}' +
    '.tts summary{font-family:Rubik,"Trebuchet MS",sans-serif;font-weight:800;color:#b07a00;cursor:pointer}' +
    '.tts details li{margin:6px 0}' +
    '.tts .tts-empty{padding:14px;text-align:center;background:#fff0f0;border:2px solid #ffd0d2;border-radius:16px;color:#b82c31}';
  document.head.appendChild(st);
}
function rows(){
  const list = english().slice(0, 14), cur = current();
  if(!list.length){
    return '<div class="tts-empty">Английских голосов на этом устройстве не найдено. Установите голос по инструкции ниже и перезагрузите страницу.</div>';
  }
  return list.map((v, i) =>
    '<div class="tts-row ' + (cur && v.voiceURI === cur.voiceURI ? 'on' : '') + '"><div><b>' + v.name.replace(/</g, '&lt;') +
    (HQ.test(v.name) || NICE.test(v.name) ? '<em>хороший</em>' : '') + '</b><span>' + v.lang + (v.localService === false ? ' · нужен интернет' : '') + '</span></div>' +
    '<button data-tts-try="' + i + '" aria-label="Послушать">▶</button>' +
    '<button class="' + (cur && v.voiceURI === cur.voiceURI ? 'pick' : '') + '" data-tts-use="' + i + '">' + (cur && v.voiceURI === cur.voiceURI ? 'выбран' : 'выбрать') + '</button></div>').join('');
}
function refreshPicker(){
  if(!box || !box.classList.contains('open')) return;
  const list = english().slice(0, 14);
  box.querySelector('#ttsList').innerHTML = rows();
  box.querySelectorAll('[data-tts-try]').forEach(b => b.addEventListener('click', () => speak(SAMPLE, .9, list[+b.dataset.ttsTry])));
  box.querySelectorAll('[data-tts-use]').forEach(b => b.addEventListener('click', () => {
    const v = list[+b.dataset.ttsUse];
    try { localStorage.setItem(PREF, v.voiceURI || v.name); } catch(e){}
    speak(SAMPLE, .9, v); refreshPicker();
  }));
}
function openPicker(){
  css();
  if(!box){
    box = document.createElement('div');
    box.className = 'tts-bg';
    box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', 'Выбор голоса');
    box.innerHTML = '<div class="tts"><div class="tts-head"><div><h2>Английский голос</h2>' +
      '<p>Нажми ▶, чтобы послушать, и выбери голос, который звучит естественно. Лучшие стоят сверху и помечены «хороший».</p></div>' +
      '<button data-tts-close>Закрыть</button></div><div id="ttsList"></div>' +
      '<details><summary>Голос звучит плохо или его нет?</summary><ul>' +
      '<li><b>iPhone / iPad:</b> Настройки → Универсальный доступ → Устный контент → Голоса → Английский → скачайте голос с пометкой «улучшенный» или «премиум» (например, Serena, Daniel, Samantha).</li>' +
      '<li><b>Mac:</b> Системные настройки → Универсальный доступ → Устный контент → Системный голос → Управлять голосами → English.</li>' +
      '<li><b>Windows:</b> откройте урок в Microsoft Edge — там есть естественные голоса (Libby, Sonia, Ryan).</li>' +
      '<li><b>Android:</b> Настройки → Специальные возможности → Синтез речи → Синтезатор Google → установите английский язык.</li>' +
      '<li>После установки перезагрузите страницу.</li></ul></details></div>';
    document.body.appendChild(box);
    box.addEventListener('click', e => { if(e.target === box || e.target.closest('[data-tts-close]')) box.classList.remove('open'); });
    document.addEventListener('keydown', e => { if(e.key === 'Escape') box.classList.remove('open'); });
  }
  load();
  box.classList.add('open');
  refreshPicker();
}

window.TTS = { speak, openPicker, current, available: () => !!synth };
})();
