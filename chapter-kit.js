/* Движок страниц с главами Treasure Island.
   Каждая страница главы задаёт window.CHAPTER (тексты и ответы),
   а здесь — шапка, десять заданий, проверки и сохранение прогресса. */
(() => {
'use strict';
const C = window.CHAPTER;
const app = document.getElementById('app');

/* ============ разметка страницы ============ */
const NAV = [['III','chapter-3.html'],['IV','chapter-4.html'],['V','chapter-5.html']];
app.innerHTML =
  '<div class="wrap"><header class="top"><div>' +
  '<span class="mark">TREASURE ISLAND · ГЛАВА ' + C.num + '</span>' +
  '<h1>' + C.title + '<i>' + C.titleRu + '</i></h1><p>' + C.intro + '</p>' +
  '<div class="progress"><span>Выполнено</span><div class="bar"><i id="progFill"></i></div><span id="progText">0 / 10</span></div>' +
  '<nav class="chapters" aria-label="Главы">' + NAV.map(([n, href]) => '<a href="' + href + '" class="' + (n === C.num ? 'on' : '') + '">Глава ' + n + '</a>').join('') + '</nav>' +
  '<div class="top-links"><a href="index.html">← Главы I–II</a><a href="a2-words.html">Тренажёр слов A2</a><a href="#" id="voiceBtn" role="button">🔊 Голос</a></div>' +
  '</div>' + C.art + '</header>' +
  '<nav class="steps" id="steps" aria-label="Задания главы ' + C.num + '"></nav>' +
  '<main class="stage" id="stage" aria-live="polite"></main></div>' +
  '<div class="foot"><button class="btn ghost" id="prevBtn">← Назад</button><span class="mid" id="footLabel"></span><button class="btn go" id="nextBtn">Дальше →</button></div>' +
  '<div class="toast" id="toast" role="status" aria-live="polite"></div>';

/* ============ состояние ============ */
let S = { step:0, done:[], predict:[], order:[], quiz:null, truth:{}, chest:{}, chestChecked:false,
  gram:{}, gw:[], vote:'', talkQ:0, talkT:-1, req:[], diary:'', gaps:{}, hw:null };
try { S = { ...S, ...JSON.parse(localStorage.getItem(C.key) || '{}') }; } catch(e){}
['done','predict','order','req','gw'].forEach(k => { if(!Array.isArray(S[k])) S[k] = []; });
while(S.gw.length < C.gram.writes.length) S.gw.push('');
if(S.order.length !== C.events.length) S.order = C.order0.slice();
['truth','chest','gram','gaps'].forEach(k => { if(!S[k] || typeof S[k] !== 'object') S[k] = {}; });
S.hw = { tr:{}, br:{}, dc:{}, txt:'', chk:[], ...(S.hw && typeof S.hw === 'object' ? S.hw : {}) };
const save = () => { try { localStorage.setItem(C.key, JSON.stringify(S)); } catch(e){} };

/* ============ помощники ============ */
const $ = id => document.getElementById(id);
const stage = $('stage');
const clean = s => (s || '').toLowerCase().replace(/[’']/g, "'").replace(/[^a-z0-9'\s-]/g, ' ').replace(/\s+/g, ' ').trim();
const shuffle = a => { a = [...a]; for(let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
const countWords = v => v ? v.split(' ').length : 0;
function toast(msg){ const t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 2600); }
function speak(text, rate){ if(window.TTS) TTS.speak(text, rate); else toast('Озвучка не загрузилась — обнови страницу'); }
let actx = null;
function blip(freq, dur, type){
  try{
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const o = actx.createOscillator(), g = actx.createGain();
    o.type = type || 'triangle'; o.frequency.value = freq;
    g.gain.setValueAtTime(.0001, actx.currentTime);
    g.gain.exponentialRampToValueAtTime(.12, actx.currentTime + .02);
    g.gain.exponentialRampToValueAtTime(.0001, actx.currentTime + (dur || .18));
    o.connect(g); g.connect(actx.destination); o.start(); o.stop(actx.currentTime + (dur || .18) + .02);
  } catch(e){}
}
const good = () => { blip(660,.12); setTimeout(() => blip(990,.16), 90); };
const bad = () => blip(180,.22,'sawtooth');
const teach = text => '<details class="teach"><summary>🎓 Для преподавателя</summary><p>' + text + '</p></details>';

const STEPS = [
  { id:'recap', render:recap }, { id:'words', render:words }, { id:'chain', render:chain }, { id:'truth', render:truth },
  { id:'chest', render:pick }, { id:'gram', render:gram }, { id:'talk', render:talk }, { id:'diary', render:diary },
  { id:'exit', render:exit }, { id:'home', render:homework }
].map((st, i) => ({ ...st, ...C.steps[i] }));

function complete(id){
  if(S.done.includes(id)) return;
  S.done.push(id); save(); renderSteps(); good();
  toast('Задание выполнено: ' + STEPS.find(s => s.id === id).short + ' ✓');
}

/* ============ навигация ============ */
function renderSteps(){
  $('steps').innerHTML = STEPS.map((st, i) =>
    '<button class="step ' + (i === S.step ? 'on ' : '') + (S.done.includes(st.id) ? 'done' : '') + '" data-step="' + i + '" aria-current="' + (i === S.step) + '">' +
    '<b><em>' + (i + 1) + '</em></b><span>' + st.short + '</span></button>').join('');
  const n = S.done.length;
  $('progFill').style.width = Math.round(n / STEPS.length * 100) + '%';
  $('progText').textContent = n + ' / ' + STEPS.length;
  const on = $('steps').querySelector('.step.on');
  if(on && $('steps').scrollWidth > $('steps').clientWidth) $('steps').scrollLeft = on.offsetLeft - 40;
}
$('steps').addEventListener('click', e => { const b = e.target.closest('[data-step]'); if(b) go(+b.dataset.step); });
function go(i){
  if(window.TTS && TTS.stop) TTS.stop();
  S.step = Math.max(0, Math.min(STEPS.length - 1, i)); save();
  try { history.replaceState(null, '', '#task-' + (S.step + 1)); } catch(e){}
  show();
  stage.scrollIntoView({ block:'start' });
}
function show(){
  const st = STEPS[S.step];
  renderSteps();
  stage.innerHTML = '<div class="pop"><div class="head"><div><p class="kicker">Задание ' + (S.step + 1) + ' · ' + st.kicker + '</p><h2>' + st.title + '</h2></div><span class="stamp">' + st.min + '</span></div><div id="body"></div></div>';
  st.render($('body'));
  $('prevBtn').disabled = S.step === 0;
  $('nextBtn').textContent = S.step === STEPS.length - 1 ? 'К заданию 1 ↺' : 'Дальше →';
  $('footLabel').textContent = 'Задание ' + (S.step + 1) + ' из ' + STEPS.length + ' · ' + st.short;
}
$('prevBtn').addEventListener('click', () => go(S.step - 1));
$('nextBtn').addEventListener('click', () => go(S.step === STEPS.length - 1 ? 0 : S.step + 1));
$('voiceBtn').addEventListener('click', e => { e.preventDefault(); if(window.TTS) TTS.openPicker(); });

/* ============ 1. прогноз ============ */
function recap(el){
  const R = C.recap, items = C.pick.items, N = R.pickN || 3;
  el.innerHTML = '<div class="note">' + R.html + '</div>' +
    '<p class="task" style="margin-top:16px">' + R.task + '</p>' +
    '<div class="opts" id="predict">' + items.map(c =>
      '<button class="opt ' + (S.predict.includes(c.id) ? 'pick' : '') + '" data-p="' + c.id + '"><span style="font-size:24px">' + c.icon + '</span><span>' + c.en + '<small>' + c.ru + '</small></span></button>').join('') + '</div>' +
    '<div class="status" id="pStatus"></div>' +
    '<div class="frame"><b>Скажи вслух:</b> ' + R.frame + '</div>' + teach(R.teach);
  const upd = () => {
    $('pStatus').textContent = S.predict.length === N ? R.doneText : 'Выбрано: ' + S.predict.length + ' из ' + N;
    $('pStatus').className = 'status' + (S.predict.length === N ? ' ok' : '');
  };
  el.querySelectorAll('[data-p]').forEach(b => b.addEventListener('click', () => {
    const id = b.dataset.p;
    S.predict = S.predict.includes(id) ? S.predict.filter(x => x !== id) : [...S.predict, id].slice(-N);
    save();
    el.querySelectorAll('[data-p]').forEach(x => x.classList.toggle('pick', S.predict.includes(x.dataset.p)));
    upd();
    if(S.predict.length === N) complete('recap');
  }));
  upd();
}

/* ============ 2. слова ============ */
function words(el){
  const W = C.words.items;
  el.innerHTML =
    '<p class="task">' + W.length + ' выражений из главы, которые пригодятся и в обычной речи. Сначала прочитай пример и попробуй догадаться о значении, потом открой перевод. В конце — быстрая проверка.</p>' +
    '<div class="cards">' + W.map(w =>
      '<article class="card"><h3 class="term">' + w.en + '</h3><p class="ex">' + w.ex + '</p><p class="ru" id="ru-' + w.id + '">' + w.ru + '</p>' +
      '<div class="acts"><button data-say="' + esc(w.ex) + '">🔊</button><button data-ru="' + w.id + '">перевод</button></div></article>').join('') + '</div>' +
    '<div class="note ballast"><b>Понять и отпустить (в активный запас не идут):</b> ' + C.words.ballast + '</div>' +
    '<div class="quiz" id="quiz"></div>' +
    teach('Сначала пример, потом догадка, потом перевод. В проверке слова идут в случайном порядке; 6 из 8 и выше — можно переходить к говорению, ниже — повторить карточки.');
  el.querySelectorAll('[data-say]').forEach(b => b.addEventListener('click', () => speak(b.dataset.say, .85)));
  el.querySelectorAll('[data-ru]').forEach(b => b.addEventListener('click', () => $('ru-' + b.dataset.ru).classList.toggle('open')));
  quizStart();
}
function quizStart(){
  const box = $('quiz'), n = C.words.items.length;
  if(S.quiz !== null){
    box.innerHTML = '<p class="quiz-q"><small>Проверка пройдена</small>' + S.quiz + ' из ' + n + '</p><div class="row" style="justify-content:center"><button class="btn ghost small" id="qAgain">Пройти ещё раз</button></div>';
    $('qAgain').addEventListener('click', () => { S.quiz = null; save(); quizRun(); });
    return;
  }
  box.innerHTML = '<p class="quiz-q"><small>Быстрая проверка</small>Русское значение → английское выражение</p><div class="row" style="justify-content:center"><button class="btn warm" id="qGo">Начать проверку</button></div>';
  $('qGo').addEventListener('click', quizRun);
}
function quizRun(){
  const W = C.words.items, box = $('quiz'), items = shuffle(W), pass = Math.ceil(W.length * .75);
  let n = 0, score = 0, locked = false;
  const next = () => {
    if(n >= items.length){ S.quiz = score; save(); if(score >= pass) complete('words'); else toast('Повтори карточки и попробуй ещё раз'); quizStart(); return; }
    locked = false;
    const w = items[n], opts = shuffle([w, ...shuffle(W.filter(x => x !== w)).slice(0, 3)]);
    box.innerHTML = '<p class="quiz-q pop"><small>' + (n + 1) + ' из ' + items.length + '</small>' + w.ru + '</p>' +
      '<div class="opts">' + opts.map(o => '<button class="opt" data-q="' + o.id + '">' + o.en + '</button>').join('') + '</div><div class="status" id="qFb"></div>';
    box.querySelectorAll('[data-q]').forEach(b => b.addEventListener('click', () => {
      if(locked) return; locked = true;
      const ok = b.dataset.q === w.id;
      box.querySelectorAll('[data-q]').forEach(x => { if(x.dataset.q === w.id) x.classList.add('hit'); });
      if(ok){ score++; good(); } else { b.classList.add('miss'); bad(); }
      $('qFb').className = 'status ' + (ok ? 'ok' : 'no');
      $('qFb').textContent = w.ex;
      speak(w.ex, .9);
      n++; setTimeout(next, ok ? 1300 : 2300);
    }));
  };
  next();
}

/* ============ 3. цепь ============ */
function chain(el){
  const E = C.events;
  el.innerHTML = '<p class="task">Расставь ' + E.length + ' событий главы по порядку. <b>Книгу не открывай</b> — вспоминай. Стрелки двигают строку вверх и вниз.</p>' +
    '<div class="chain" id="chain"></div>' +
    '<div class="row" style="margin-top:14px"><button class="btn warm" id="chCheck">Проверить порядок</button><button class="btn ghost" id="chMix">Перемешать</button></div>' +
    '<div class="status" id="chStatus"></div>' +
    teach('После проверки — пересказ цепочки за 40 секунд со словами first / then / after that / suddenly / in the end. Ошибки во время пересказа не исправляйте, запишите две и вернитесь к ним в задании 6.');
  const draw = () => {
    $('chain').innerHTML = S.order.map((n, pos) =>
      '<div class="link" data-pos="' + pos + '"><span>' + E[n] + '</span><div class="arrows"><button data-mv="-1" aria-label="Выше">↑</button><button data-mv="1" aria-label="Ниже">↓</button></div></div>').join('');
    $('chain').querySelectorAll('[data-mv]').forEach(b => b.addEventListener('click', () => {
      const p = +b.closest('.link').dataset.pos, q = p + +b.dataset.mv;
      if(q < 0 || q >= S.order.length) return;
      [S.order[p], S.order[q]] = [S.order[q], S.order[p]]; save(); draw(); $('chStatus').textContent = '';
    }));
  };
  draw();
  $('chCheck').addEventListener('click', () => {
    const all = S.order.every((n, i) => n === i);
    [...$('chain').children].forEach((row, i) => { row.classList.remove('ok','no'); row.classList.add(S.order[i] === i ? 'ok' : 'no'); });
    $('chStatus').className = 'status ' + (all ? 'ok' : 'no');
    $('chStatus').textContent = all ? 'Верно! Перескажи главу за 40 секунд: first, then, suddenly, in the end.' : 'Есть сбой. ' + C.chainHint;
    if(all) complete('chain'); else bad();
  });
  $('chMix').addEventListener('click', () => { S.order = shuffle(S.order); save(); draw(); $('chStatus').textContent = ''; });
}

/* ============ 4. правда или ложь ============ */
function truth(el){
  const T = C.truth;
  el.innerHTML = '<p class="task">' + T.length + ' утверждений о главе. Отметь <b>True</b> или <b>False</b>. После ответа появится объяснение — прочитай его, даже если ответ верный.</p><div id="tfList"></div><div class="status" id="tfStatus"></div>' +
    teach('Для неверных утверждений просите исправить фразу вслух по-английски: “No, he didn’t. He…”. Это тренирует отрицания в Past Simple.');
  const draw = () => {
    $('tfList').innerHTML = T.map((q, i) => {
      const ans = S.truth[i];
      const cls = v => ans === undefined ? '' : (v === q.a ? 'right' : (ans === v ? 'wrong' : ''));
      return '<div class="tf"><span>' + (i + 1) + '. ' + q.t + '</span><div class="pair">' +
        '<button class="' + cls(true) + '" data-tf="' + i + '" data-v="1">True</button><button class="' + cls(false) + '" data-tf="' + i + '" data-v="0">False</button></div>' +
        (ans !== undefined ? '<div class="why">' + (ans === q.a ? '✓ ' : '✗ ') + q.why + '</div>' : '') + '</div>';
    }).join('');
    $('tfList').querySelectorAll('[data-tf]').forEach(b => b.addEventListener('click', () => {
      const i = +b.dataset.tf; if(S.truth[i] !== undefined) return;
      S.truth[i] = b.dataset.v === '1'; save();
      (S.truth[i] === T[i].a ? good : bad)();
      draw();
    }));
    const done = Object.keys(S.truth).length, right = T.filter((q, i) => S.truth[i] === q.a).length;
    $('tfStatus').className = 'status' + (done === T.length ? ' ok' : '');
    $('tfStatus').innerHTML = done === T.length
      ? 'Верно: ' + right + ' из ' + T.length + '. <button class="btn ghost small" id="tfReset" style="margin-left:8px">Заново</button>'
      : 'Отвечено: ' + done + ' из ' + T.length;
    if(done === T.length){
      $('tfReset').addEventListener('click', () => { S.truth = {}; save(); draw(); });
      complete('truth');
    }
  };
  draw();
}

/* ============ 5. выбор деталей ============ */
function pick(el){
  const P = C.pick, items = P.items, outN = items.filter(c => !c.in).length;
  el.innerHTML = '<p class="task">' + P.task + '</p>' +
    '<div class="chest" id="chestGrid"></div>' +
    '<div class="row" style="margin-top:16px"><button class="btn warm" id="chCheck2">' + P.checkLabel + '</button><button class="btn ghost" id="chReset">Начать заново</button></div>' +
    '<div class="status" id="chestStatus"></div>' +
    '<div class="frame"><b>Скажи вслух:</b> ' + P.frame + '</div>' + teach(P.teach);
  const draw = () => {
    $('chestGrid').innerHTML = items.map(c => {
      const picked = !!S.chest[c.id];
      const cls = S.chestChecked ? (picked === c.in ? 'right' : 'wrong') : (picked ? 'in' : '');
      return '<button class="item ' + cls + '" data-c="' + c.id + '" aria-pressed="' + picked + '"><i>' + c.icon + '</i><b>' + c.en + '</b><span>' + c.ru + '</span></button>';
    }).join('');
    $('chestGrid').querySelectorAll('[data-c]').forEach(b => b.addEventListener('click', () => {
      if(S.chestChecked) return;
      S.chest[b.dataset.c] = !S.chest[b.dataset.c]; save(); draw();
    }));
  };
  const report = () => {
    const right = items.filter(c => !!S.chest[c.id] === c.in).length;
    const hits = S.predict.filter(id => (items.find(c => c.id === id) || {}).in).length;
    const ok = right >= items.length - 2;
    $('chestStatus').className = 'status ' + (ok ? 'ok' : 'no');
    $('chestStatus').innerHTML = 'Верно: ' + right + ' из ' + items.length + '. ' +
      (S.predict.length === (C.recap.pickN || 3) ? 'Твой прогноз угадал ' + hits + ' из ' + S.predict.length + '. ' : '') + P.extra;
    if(ok) complete('chest');
  };
  draw();
  if(S.chestChecked) report();
  $('chCheck2').addEventListener('click', () => { S.chestChecked = true; save(); draw(); report(); });
  $('chReset').addEventListener('click', () => { S.chestChecked = false; S.chest = {}; save(); draw(); $('chestStatus').textContent = ''; });
  if(outN === 0) console.warn('pick: no distractors');
}

/* ============ 6. грамматика ============ */
function gram(el){
  const G = C.gram;
  el.innerHTML = G.rules +
    '<p class="task">Выбери правильную форму.</p><div id="gList"></div><div class="status" id="gStatus"></div>' +
    '<h3 style="font-size:21px;margin:22px 0 10px">Now write it yourself</h3>' +
    '<p class="task">' + G.writeTask + '</p>' +
    '<div id="gWrite"></div><div class="row" style="margin-top:12px"><button class="btn warm" id="gwCheck">Проверить предложения</button></div>' + teach(G.teach);
  const draw = () => {
    $('gList').innerHTML = G.items.map((g, i) => {
      const ans = S.gram[i];
      return '<div class="gline"><span>' + (i + 1) + '. ' + g.pre + ' <b>…</b> ' + g.post + '</span><div class="pair">' +
        g.opts.map((o, n) => '<button class="' + (ans === undefined ? '' : n === g.a ? 'right' : ans === n ? 'wrong' : '') + '" data-g="' + i + '" data-o="' + n + '">' + o + '</button>').join('') +
        '</div>' + (ans !== undefined ? '<div class="why">' + (ans === g.a ? '✓ ' : '✗ ') + g.why + '</div>' : '') + '</div>';
    }).join('');
    $('gList').querySelectorAll('[data-g]').forEach(b => b.addEventListener('click', () => {
      const i = +b.dataset.g; if(S.gram[i] !== undefined) return;
      S.gram[i] = +b.dataset.o; save(); (S.gram[i] === G.items[i].a ? good : bad)(); draw(); checkDone();
    }));
    const done = Object.keys(S.gram).length, right = G.items.filter((g, i) => S.gram[i] === g.a).length;
    $('gStatus').className = 'status' + (done === G.items.length ? ' ok' : '');
    $('gStatus').innerHTML = done === G.items.length ? 'Верно: ' + right + ' из ' + G.items.length + ' <button class="btn ghost small" id="gReset" style="margin-left:8px">Заново</button>' : 'Отвечено: ' + done + ' из ' + G.items.length;
    if($('gReset')) $('gReset').addEventListener('click', () => { S.gram = {}; save(); draw(); });
  };
  $('gWrite').innerHTML = G.writes.map((w, i) =>
    '<div class="write" data-w="' + i + '"><div class="q">' + w.label + '</div><input class="field" data-gw="' + i + '" autocomplete="off" spellcheck="false"><div class="fb" data-wfb="' + i + '"></div></div>').join('');
  $('gWrite').querySelectorAll('[data-gw]').forEach(inp => {
    const i = +inp.dataset.gw; inp.value = S.gw[i] || '';
    inp.addEventListener('input', () => { S.gw[i] = inp.value; save(); });
  });
  const problems = (w, v) => {
    const miss = w.checks.filter(c => !c.re.test(v)).map(c => c.miss);
    if(countWords(v) < (w.minWords || 6)) miss.push('слишком коротко');
    return miss;
  };
  function checkDone(){
    if(Object.keys(S.gram).length === G.items.length && G.writes.every((w, i) => problems(w, clean(S.gw[i])).length === 0)) complete('gram');
  }
  $('gwCheck').addEventListener('click', () => {
    G.writes.forEach((w, i) => {
      const v = clean(S.gw[i]), box = document.querySelector('[data-w="' + i + '"]'), fb = document.querySelector('[data-wfb="' + i + '"]');
      if(!v){ box.classList.remove('ok','no'); fb.textContent = 'Пусто.'; return; }
      const miss = problems(w, v), ok = !miss.length;
      box.classList.toggle('ok', ok); box.classList.toggle('no', !ok);
      fb.innerHTML = (ok ? 'Конструкция на месте.' : 'Пока не так: ' + miss.join(', ') + '.') + '<span class="model">Пример: ' + w.model + '</span>';
    });
    checkDone();
    if(Object.keys(S.gram).length < G.items.length) toast('Не забудь выбрать формы в предложениях выше');
  });
  draw();
}

/* ============ 7. разговор ============ */
let clockInt = null, clockLeft = 60;
function talk(el){
  const T = C.talk;
  el.innerHTML =
    '<p class="task">' + T.intro + '</p>' +
    '<div class="grid2"><div class="slab"><h3>Твой вердикт</h3><div class="opts" style="grid-template-columns:1fr" id="vote">' +
    T.votes.map(([id, t, d]) => '<button class="opt ' + (S.vote === id ? 'pick' : '') + '" data-vote="' + id + '"><span>' + t + '<small>' + d + '</small></span></button>').join('') + '</div>' +
    '<div class="frame">' + T.frame + '</div></div>' +
    '<div class="slab"><h3>Одна минута</h3><p class="note" style="padding:8px 10px">Говори без чтения с экрана. Потом отметь, что получилось.</p>' +
    '<div class="clock"><b id="clockFace">01:00</b><div class="row" style="justify-content:center;margin-top:8px"><button class="btn small" id="clockGo">Старт</button><button class="btn small ghost" id="clockReset">Сброс</button></div></div>' +
    '<div style="margin-top:12px">' + T.checks.map((t, i) =>
      '<label class="check"><input type="checkbox" data-req="' + i + '" ' + (S.req[i] ? 'checked' : '') + '> ' + t + '</label>').join('') + '</div></div></div>' +
    '<div class="talk"><div><p class="kicker" style="color:#ffe1b8">Пауза на разговор</p><h3>Pick a side</h3><p>Вытяни карту, ответь и задай один встречный вопрос.</p></div>' +
    '<div class="talk-card"><p class="talk-q" id="talkQ"></p><div class="row"><button class="btn small" id="talkDraw">другая карта</button><button class="btn small ghost" id="talkTwist">поворот</button></div><div class="twist" id="talkTw" hidden></div></div></div>' +
    teach(T.teach);
  const drawTalk = () => {
    $('talkQ').textContent = T.qs[S.talkQ % T.qs.length];
    $('talkTw').hidden = S.talkT < 0;
    if(S.talkT >= 0) $('talkTw').textContent = T.tw[S.talkT % T.tw.length];
  };
  drawTalk();
  $('talkDraw').addEventListener('click', () => { S.talkQ = (S.talkQ + 1 + Math.floor(Math.random() * (T.qs.length - 1))) % T.qs.length; S.talkT = -1; save(); drawTalk(); });
  $('talkTwist').addEventListener('click', () => { let n = Math.floor(Math.random() * T.tw.length); if(n === S.talkT) n = (n + 1) % T.tw.length; S.talkT = n; save(); drawTalk(); });
  const maybeDone = () => { if(S.vote && S.req.filter(Boolean).length >= 3) complete('talk'); };
  el.querySelectorAll('[data-vote]').forEach(b => b.addEventListener('click', () => {
    S.vote = b.dataset.vote; save();
    el.querySelectorAll('[data-vote]').forEach(x => x.classList.toggle('pick', x.dataset.vote === S.vote));
    maybeDone();
  }));
  el.querySelectorAll('[data-req]').forEach(c => c.addEventListener('change', () => { S.req[+c.dataset.req] = c.checked; save(); maybeDone(); }));
  const face = () => { $('clockFace').textContent = '0' + Math.floor(clockLeft / 60) + ':' + String(clockLeft % 60).padStart(2, '0'); };
  clearInterval(clockInt); clockInt = null; clockLeft = 60; face();
  $('clockGo').addEventListener('click', () => {
    if(clockInt){ clearInterval(clockInt); clockInt = null; $('clockGo').textContent = 'Продолжить'; return; }
    if(clockLeft <= 0) clockLeft = 60;
    $('clockGo').textContent = 'Пауза';
    clockInt = setInterval(() => {
      clockLeft--; face();
      if(clockLeft <= 0){ clearInterval(clockInt); clockInt = null; $('clockGo').textContent = 'Ещё раз'; blip(880,.3); toast('Время! Договори начатое предложение.'); }
    }, 1000);
  });
  $('clockReset').addEventListener('click', () => { clearInterval(clockInt); clockInt = null; clockLeft = 60; face(); $('clockGo').textContent = 'Старт'; });
}

/* ============ 8. дневник ============ */
function diary(el){
  const D = C.diary;
  el.innerHTML =
    '<p class="task">' + D.task + '</p>' +
    '<div class="targets" id="dTargets"></div>' +
    '<textarea class="field" id="dText" placeholder="' + esc(D.placeholder) + '"></textarea>' +
    '<div class="meter-row"><span>Слов: <b id="dWords">0</b></span><span>Выражений: <b id="dHits">0</b> / ' + D.hits + '</span><span>' + D.extra.label + ': <b id="dPc">нет</b></span></div>' +
    '<div class="row" style="margin-top:12px"><button class="btn warm" id="dCheck">Сдать запись</button><button class="btn ghost small" id="dModel">Показать образец</button><button class="btn ghost small" id="dCopy">Скопировать текст</button></div>' +
    '<div class="status" id="dStatus"></div><div class="note" id="dModelBox" hidden style="margin-top:12px"></div>' + teach(D.teach);
  const t = $('dText'); t.value = S.diary || '';
  const analyse = () => {
    const v = clean(t.value), w = countWords(v);
    const hits = D.targets.filter(d => d.re.test(v)).map(d => d.id);
    $('dTargets').innerHTML = D.targets.map(d => '<span class="' + (hits.includes(d.id) ? 'hit' : '') + '">' + d.label + '</span>').join('');
    $('dWords').textContent = w; $('dHits').textContent = hits.length; $('dPc').textContent = D.extra.re.test(v) ? 'есть' : 'нет';
    return { words:w, hits:hits.length, extra:D.extra.re.test(v) };
  };
  t.addEventListener('input', () => { S.diary = t.value; save(); analyse(); });
  analyse();
  $('dCheck').addEventListener('click', () => {
    const r = analyse(), miss = [];
    if(r.words < D.min) miss.push('добавь слов (сейчас ' + r.words + ')');
    if(r.words > D.max) miss.push('сократи до ' + D.max + ' слов');
    if(r.hits < D.hits) miss.push('нужно ещё выражений: ' + (D.hits - r.hits));
    if(!r.extra) miss.push(D.extra.miss);
    $('dStatus').className = 'status ' + (miss.length ? 'no' : 'ok');
    $('dStatus').textContent = miss.length ? 'Почти: ' + miss.join('; ') + '.' : 'Запись принята! Теперь прочитай её вслух, не глядя в текст через каждое слово.';
    if(!miss.length) complete('diary'); else bad();
  });
  $('dModel').addEventListener('click', () => { const b = $('dModelBox'); b.hidden = !b.hidden; b.textContent = D.model; });
  $('dCopy').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(t.value); toast('Текст скопирован — можно отправить преподавателю'); }
    catch(e){ t.select(); toast('Выдели и скопируй текст вручную'); }
  });
}

/* ============ 9. финал ============ */
function exit(el){
  const X = C.exit;
  el.innerHTML = '<div class="grid2"><div><p class="task">Впиши пропущенное слово без подсказок и без задания 2. Форму слова можно менять.</p><div id="gapList"></div>' +
    '<div class="row" style="margin-top:12px"><button class="btn warm" id="gapCheck">' + X.button + '</button></div></div>' +
    '<div class="slab"><div class="seal"><div><b id="sealScore">—</b><span>выражений вспомнено</span></div></div><p id="sealLine" style="text-align:center;font-weight:800;color:var(--ink-soft)">' + X.idle + '</p>' +
    '<h3>Can-do</h3>' + X.cando.map(t => '<label class="check"><input type="checkbox"> ' + t + '</label>').join('') + '</div></div>' + teach(X.teach);
  $('gapList').innerHTML = X.gaps.map((g, i) =>
    '<label class="gapline" data-gl="' + i + '"><span>' + g.pre + '<b>______</b>' + g.post + '</span><input class="field" data-gi="' + i + '" autocomplete="off" spellcheck="false" aria-label="Ответ ' + (i + 1) + '"></label>').join('');
  $('gapList').querySelectorAll('[data-gi]').forEach(inp => {
    const i = +inp.dataset.gi; inp.value = S.gaps[i] || '';
    inp.addEventListener('input', () => { S.gaps[i] = inp.value; save(); });
  });
  $('gapCheck').addEventListener('click', () => {
    let score = 0;
    X.gaps.forEach((g, i) => {
      const ok = g.ok.includes(clean(S.gaps[i]));
      if(ok) score++;
      const row = document.querySelector('[data-gl="' + i + '"]');
      row.classList.toggle('ok', ok); row.classList.toggle('no', !ok);
      if(!ok){ row.classList.remove('shake'); void row.offsetWidth; row.classList.add('shake'); }
    });
    const pass = score >= X.gaps.length - 2;
    $('sealScore').textContent = score + '/' + X.gaps.length;
    $('sealLine').textContent = pass ? X.passText : 'Пока рано: повтори задание 2 и попробуй снова';
    $('sealLine').style.color = pass ? '#2e9e3c' : 'var(--signal)';
    if(pass) complete('exit'); else bad();
  });
}

/* ============ 10. домашнее задание ============ */
function skeleton(t){ return t.split(' ').map(w => { const l = w.replace(/[^A-Za-z’']/g, ''); return l.length <= 2 ? w : w[0] + '_'.repeat(l.length - 1) + w.slice(l.length); }).join(' '); }
function homework(el){
  const H = S.hw, K = C.home;
  el.innerHTML =
    '<p class="task">Домашка из пяти частей, около 30–40 минут. Ответы сохраняются сами — можно делать в несколько подходов. В конце нажми <b>«Отправить преподавателю»</b>: все ответы соберутся в одно сообщение.</p>' +
    '<section class="hw-part" id="hwA"><h3><b>A</b> Переведи на английский</h3><p class="note" style="padding:8px 12px">Используй выражения из задания 2. Проверка смотрит на нужное выражение, а не на точное совпадение слов.</p><div id="hwTr"></div>' +
      '<div class="row" style="margin-top:12px"><button class="btn warm" id="hwTrCheck">Проверить перевод</button><span class="note" id="hwTrScore" style="padding:6px 12px"></span></div></section>' +
    '<section class="hw-part" id="hwB"><h3><b>B</b> ' + K.brTitle + '</h3><p class="note" style="padding:8px 12px">' + K.brNote + '</p><div id="hwBr"></div>' +
      '<div class="row" style="margin-top:12px"><button class="btn warm" id="hwBrCheck">Проверить формы</button><span class="note" id="hwBrScore" style="padding:6px 12px"></span></div></section>' +
    '<section class="hw-part" id="hwC"><h3><b>C</b> Диктант на слух</h3><p class="note" style="padding:8px 12px">Четыре новых предложения о главе ' + C.num + '. Слушай сколько угодно и записывай <b>целиком</b>. Голос с акцентом? Нажми <button class="btn ghost small" type="button" id="hwVoice">🔊 Голос</button></p><div id="hwDc"></div>' +
      '<div class="row" style="margin-top:12px"><button class="btn warm" id="hwDcCheck">Проверить диктант</button><span class="note" id="hwDcScore" style="padding:6px 12px"></span></div></section>' +
    '<section class="hw-part" id="hwD"><h3><b>D</b> ' + K.prompt.title + '</h3>' +
      '<p class="task" style="font-size:16px">' + K.prompt.html + ' <b>40–70 слов</b>. Можно вместо текста записать голосовое на 60 секунд и отправить преподавателю.</p>' +
      '<div class="frame" style="margin:0 0 10px;border:0;padding:0"><b>Опоры:</b> ' + K.prompt.frames + '</div>' +
      '<textarea class="field" id="hwTxt" style="min-height:140px" placeholder="' + esc(K.prompt.placeholder) + '"></textarea>' +
      '<div class="meter-row"><span>Слов: <b id="hwWords">0</b> / 40–70</span><span id="hwTxtState"></span></div></section>' +
    '<section class="hw-part" id="hwE"><h3><b>E</b> Подготовка к следующему уроку</h3>' +
      K.checklist.map((t, i) => '<label class="check"><input type="checkbox" data-hwchk="' + i + '" ' + (H.chk[i] ? 'checked' : '') + '> ' + t + '</label>').join('') + '</section>' +
    '<div class="tally" style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:12px;margin-top:20px;padding:16px;background:#fff8dc;border:2px dashed #f0d27a;border-radius:20px">' +
      '<span id="hwSummary" style="font-family:var(--ui);font-weight:800;color:#8a5a00"></span>' +
      '<button class="btn go" id="hwSend">📨 Отправить преподавателю</button></div>' +
    teach('Части A–C проверяются автоматически, D и E — вами. Если в части C больше двух ошибок, попросите переслушать с кнопкой «медленнее» и записать заново; сравнение «было/стало» полезнее новой порции.');

  $('hwTr').innerHTML = K.tr.map((it, i) =>
    '<div class="hw-line" data-tr="' + i + '"><div class="q">' + (i + 1) + '. ' + it.ru + '</div>' +
    '<input class="field" data-trin="' + i + '" autocomplete="off" spellcheck="false" placeholder="по-английски"><div class="fb" data-trfb="' + i + '"></div></div>').join('');
  $('hwBr').innerHTML = K.br.map((it, i) =>
    '<div class="hw-line" data-br="' + i + '"><div class="q">' + (i + 1) + '. ' + it.pre + ' ____ (<i>' + it.verb + '</i>) ' + it.post + '</div>' +
    '<input class="field" data-brin="' + i + '" autocomplete="off" spellcheck="false" placeholder="форма глагола"><div class="fb" data-brfb="' + i + '"></div></div>').join('');
  $('hwDc').innerHTML = K.dict.map((t, i) =>
    '<div class="hw-line" data-dc="' + i + '"><div class="tools"><b style="align-self:center;margin-right:4px">№ ' + (i + 1) + '</b>' +
    '<button class="btn ghost small" data-dcplay="' + i + '">▶ слушать</button><button class="btn ghost small" data-dcslow="' + i + '">🐢 медленнее</button><button class="btn ghost small" data-dctip="' + i + '">подсказка</button></div>' +
    '<input class="field" data-dcin="' + i + '" autocomplete="off" spellcheck="false" placeholder="запиши предложение целиком"><div class="fb" data-dcfb="' + i + '"></div></div>').join('');

  const bind = (attr, store) => el.querySelectorAll('[' + attr + ']').forEach(inp => {
    const i = inp.getAttribute(attr); inp.value = store[i] || '';
    inp.addEventListener('input', () => { store[i] = inp.value; save(); });
  });
  bind('data-trin', H.tr); bind('data-brin', H.br); bind('data-dcin', H.dc);

  el.querySelectorAll('[data-dcplay]').forEach(b => b.addEventListener('click', () => speak(K.dict[+b.dataset.dcplay], .9)));
  el.querySelectorAll('[data-dcslow]').forEach(b => b.addEventListener('click', () => speak(K.dict[+b.dataset.dcslow], .7)));
  el.querySelectorAll('[data-dctip]').forEach(b => b.addEventListener('click', () => {
    document.querySelector('[data-dcfb="' + b.dataset.dctip + '"]').innerHTML = 'Скелет: <b>' + skeleton(K.dict[+b.dataset.dctip]) + '</b>';
  }));
  $('hwVoice').addEventListener('click', () => window.TTS && TTS.openPicker());

  const mark = (sel, ok) => { const box = document.querySelector(sel); box.classList.toggle('ok', ok); box.classList.toggle('no', !ok); };
  const trOk = i => { const v = clean(H.tr[i]); return !!v && K.tr[i].must.every(re => re.test(v)); };
  const brOk = i => K.br[i].ok.includes(clean(H.br[i]));
  const dcRes = i => {
    const target = clean(K.dict[i]).split(' '), given = clean(H.dc[i]).split(' ').filter(Boolean);
    let right = 0;
    const marked = target.map((w, n) => { const ok = given[n] === w; if(ok) right++; return '<span class="' + (ok ? 'w-ok' : 'w-no') + '">' + (given[n] || '…') + '</span>'; }).join(' ');
    return { full: right === target.length && given.length === target.length, right, total: target.length, marked, empty: !given.length };
  };
  const scores = () => ({
    tr: K.tr.filter((t, i) => trOk(i)).length,
    br: K.br.filter((t, i) => brOk(i)).length,
    dc: K.dict.filter((t, i) => dcRes(i).full).length,
    words: countWords(clean(H.txt))
  });
  function summary(){
    const sc = scores();
    $('hwA').classList.toggle('done', sc.tr >= 4); $('hwB').classList.toggle('done', sc.br >= 4);
    $('hwC').classList.toggle('done', sc.dc >= 3); $('hwD').classList.toggle('done', sc.words >= 40 && sc.words <= 70);
    $('hwE').classList.toggle('done', H.chk.filter(Boolean).length === K.checklist.length);
    $('hwSummary').textContent = 'A ' + sc.tr + '/' + K.tr.length + ' · B ' + sc.br + '/' + K.br.length + ' · C ' + sc.dc + '/' + K.dict.length + ' · D ' + sc.words + ' слов';
    if(sc.tr >= 4 && sc.br >= 4 && sc.dc >= 3 && sc.words >= 40) complete('home');
  }

  $('hwTrCheck').addEventListener('click', () => {
    K.tr.forEach((it, i) => {
      const fb = document.querySelector('[data-trfb="' + i + '"]');
      if(!clean(H.tr[i])){ fb.textContent = 'Пусто.'; return; }
      const ok = trOk(i); mark('[data-tr="' + i + '"]', ok);
      fb.innerHTML = ok ? 'Выражение на месте. <span class="model">Вариант: ' + it.model + '</span>' : 'Нужно выражение <b>' + it.tip + '</b>. <span class="model">Вариант: ' + it.model + '</span>';
    });
    const n = scores().tr; $('hwTrScore').textContent = 'Принято: ' + n + ' из ' + K.tr.length; (n >= 4 ? good : bad)(); summary();
  });
  $('hwBrCheck').addEventListener('click', () => {
    K.br.forEach((it, i) => {
      const fb = document.querySelector('[data-brfb="' + i + '"]');
      if(!clean(H.br[i])){ fb.textContent = 'Пусто.'; return; }
      const ok = brOk(i); mark('[data-br="' + i + '"]', ok);
      fb.innerHTML = ok ? 'Верно.' : 'Правильно: <b>' + it.ok[0] + '</b>' + (it.why ? ' — ' + it.why : '') + '.';
    });
    const n = scores().br; $('hwBrScore').textContent = 'Верно: ' + n + ' из ' + K.br.length; (n >= 4 ? good : bad)(); summary();
  });
  $('hwDcCheck').addEventListener('click', () => {
    K.dict.forEach((t, i) => {
      const r = dcRes(i), fb = document.querySelector('[data-dcfb="' + i + '"]');
      if(r.empty){ fb.textContent = 'Пусто.'; return; }
      mark('[data-dc="' + i + '"]', r.full);
      fb.innerHTML = (r.full ? 'Точно! ' : 'Верных слов: ' + r.right + ' из ' + r.total + '. ') + r.marked + (r.full ? '' : '<span class="model">Оригинал: ' + t + '</span>');
    });
    const n = scores().dc; $('hwDcScore').textContent = 'Точно: ' + n + ' из ' + K.dict.length; (n >= 3 ? good : bad)(); summary();
  });
  const t = $('hwTxt'); t.value = H.txt || '';
  const txtState = () => {
    const w = scores().words; $('hwWords').textContent = w;
    $('hwTxtState').textContent = w < 40 ? 'нужно ещё ' + (40 - w) : w > 70 ? 'слишком длинно' : '✓ объём в норме';
  };
  t.addEventListener('input', () => { H.txt = t.value; save(); txtState(); summary(); });
  el.querySelectorAll('[data-hwchk]').forEach(c => c.addEventListener('change', () => { H.chk[+c.dataset.hwchk] = c.checked; save(); summary(); }));

  $('hwSend').addEventListener('click', async () => {
    const sc = scores();
    const text = [
      'Treasure Island · глава ' + C.num + ' · домашнее задание', '',
      'A. Перевод (' + sc.tr + '/' + K.tr.length + '):', ...K.tr.map((it, i) => (i + 1) + '. ' + (H.tr[i] || '—')), '',
      'B. ' + K.brTitle + ' (' + sc.br + '/' + K.br.length + '):', ...K.br.map((it, i) => (i + 1) + '. ' + (H.br[i] || '—')), '',
      'C. Диктант (' + sc.dc + '/' + K.dict.length + '):', ...K.dict.map((it, i) => (i + 1) + '. ' + (H.dc[i] || '—')), '',
      'D. ' + K.prompt.title + ' (' + sc.words + ' слов):', H.txt || '— (голосовое отдельно)', '',
      'E. Подготовка: ' + H.chk.filter(Boolean).length + '/' + K.checklist.length
    ].join('\n');
    if(navigator.share){ try { await navigator.share({ title:'Домашнее задание · глава ' + C.num, text }); return; } catch(e){ if(e && e.name === 'AbortError') return; } }
    try { await navigator.clipboard.writeText(text); toast('Ответы скопированы — вставь их в сообщение преподавателю'); }
    catch(e){
      let out = $('hwOut');
      if(!out){ out = document.createElement('textarea'); out.id = 'hwOut'; out.className = 'field'; out.readOnly = true; out.style.marginTop = '12px'; $('hwSend').parentNode.after(out); }
      out.value = text; out.select(); toast('Скопируй текст из поля ниже и отправь преподавателю');
    }
  });
  txtState(); summary();
}

/* ============ запуск ============ */
const fromHash = location.hash.match(/^#task-(\d+)$/);
if(fromHash) S.step = Math.max(0, Math.min(STEPS.length - 1, +fromHash[1] - 1));
show();
})();
