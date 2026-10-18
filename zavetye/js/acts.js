'use strict';
/* =====================================================================
   ДЕЙСТВИЯ — короткие игровые эпизоды между разговорами
   Выбор в сцене может вести не в следующую сцену, а в действие:
   { play:'search', win:'сцена', lose:'сцена', winFn, loseFn }.
   Каждое действие — 30–60 секунд, без смерти: проигрыш тоже ведёт
   по сюжету дальше, только другой дорогой. После неудачи можно
   попробовать ещё раз или принять то, что вышло.
   ===================================================================== */
const ACT = { on:false, raf:0, A:null };
const AC = {
  clamp:(v, a, b) => Math.max(a, Math.min(b, v)),
  lerp:(a, b, k) => a + (b - a) * k,
  rnd:(a, b) => a + Math.random() * (b - a),
  shuffle:a => { for(let i = a.length - 1; i > 0; i--){ const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; },
};
const actDiff = (easy, normal, hard) => (st && st.diff === 'easy' ? easy : st && st.diff === 'hard' ? hard : normal);
/* картинка на весь экран «по обрезу»; pan 0..1 — какая часть видна, если картинка шире или выше экрана */
function actCover(g, im, W, H, px = .5, py = .5, zoom = 1){
  const s = Math.max(W / im.width, H / im.height) * zoom, w = im.width * s, h = im.height * s;
  const ox = (W - w) * px, oy = (H - h) * py;
  g.drawImage(im, ox, oy, w, h);
  return { s, ox, oy, at:(fx, fy) => [ox + fx * w, oy + fy * h] };
}
function actNote(f, d, vol = .05){ if(!AU.ctx) return; onBus(AU.music, () => { env(f, d * 1.25, vol, 'triangle'); env(f / 2, d * 1.4, vol * .55, 'sine'); }); }
function actSfx(k){ if(!AU.ctx) return; onBus(AU.fx, () => {
  if(k === 'rustle') burst(.22, .07, 2400);
  if(k === 'prick'){ burst(.08, .1, 5000); env(1320, .12, .03, 'square'); }
  if(k === 'thud') burst(.3, .2, 220);
  if(k === 'heat'){ burst(.9, .12, 900); env(180, 1.2, .05, 'sawtooth'); }
  if(k === 'step') stepSound0('grass', true);
  if(k === 'hush') burst(1.4, .05, 600);
}); }

/* ---------- оболочка: холст, подписи, панель «ещё раз» ---------- */
function actUI(){
  let el = document.getElementById('act'); if(el) return el;
  el = document.createElement('div'); el.id = 'act'; el.className = 'acts';
  el.innerHTML = '<canvas class="act-cv"></canvas><div class="act-top"><p class="act-title"></p><p class="act-hint"></p><p class="act-count"></p></div>'
    + '<div class="act-card" hidden></div><button type="button" class="act-alt" hidden></button><p class="act-sub" aria-live="polite"></p>'
    + '<div class="act-panel" hidden role="dialog" aria-modal="true"><p class="act-msg"></p><div class="act-btns"></div></div><div class="act-fade"></div>';
  document.body.appendChild(el); return el;
}
function playAct(kind, done){
  const G = ACTS[kind];
  const auto = 'ACT_AUTO' in window ? window.ACT_AUTO : (navigator.webdriver ? 'win' : null);   // автотесты проходят действия сразу
  if(!G || auto){ setTimeout(() => done(auto !== 'lose'), 0); return; }
  if(ACT.on) return;
  const el = actUI(), cv = el.querySelector('.act-cv'), g = cv.getContext('2d');
  ui.cut = true; ACT.on = true; hideDlg(); hideHint(); $('prompt').hidden = true;
  el.className = 'acts on acts-' + kind; el.querySelector('.act-fade').style.opacity = 1;
  el.querySelector('.act-title').textContent = G.title;
  el.querySelector('.act-panel').hidden = true; el.querySelector('.act-sub').classList.remove('on'); el.querySelector('.act-card').hidden = true; el.querySelector('.act-alt').hidden = true; el.querySelector('.act-count').textContent = '';
  let subT = 0, finished = false;
  const A = ACT.A = { kind, g, t:0, tries:0, mx:-1, my:-1, down:false, keys:{}, over:false, paused:false,
    say(text, ms = 2600){ const s = el.querySelector('.act-sub'); s.textContent = text; s.classList.add('on'); subT = ms / 1000; },
    hint(text){ el.querySelector('.act-hint').textContent = text; },
    count(text){ el.querySelector('.act-count').textContent = text || ''; },
    card(html){ const c = el.querySelector('.act-card'); if(html == null){ c.hidden = true; return; } c.innerHTML = html; c.hidden = false; },
    alt(text, fn){ const b = el.querySelector('.act-alt'); if(!text){ b.hidden = true; b.onclick = null; return; } b.textContent = text; b.hidden = false; b.onclick = e => { e.stopPropagation(); b.hidden = true; fn(); }; },
    end(win, msg){ if(A.over) return; A.over = true; track(win ? 'act_win' : 'act_fail', { kind, tries:A.tries }); win ? setTimeout(() => panel(msg, [[ 'Дальше', () => close(true) ]]), 900) : setTimeout(() => panel(msg, [[ 'Ещё раз', restart ], [ G.accept || 'Пусть будет так', () => close(false) ]]), 700); },
  };
  const size = () => { const d = Math.min(2, devicePixelRatio || 1); A.W = innerWidth; A.H = innerHeight; cv.width = A.W * d | 0; cv.height = A.H * d | 0; g.setTransform(d, 0, 0, d, 0, 0); A.dpr = d; };
  const panel = (msg, btns) => { const p = el.querySelector('.act-panel'); p.querySelector('.act-msg').textContent = msg;
    const b = p.querySelector('.act-btns'); b.innerHTML = ''; btns.forEach(([t, f], i) => { const x = document.createElement('button'); x.type = 'button'; x.className = 'act-b' + (i ? '' : ' main'); x.textContent = t; x.onclick = e => { e.stopPropagation(); f(); }; b.appendChild(x); });
    p.hidden = false; A.paused = true; setTimeout(() => { const f = b.querySelector('button'); f && f.focus(); }, 30); };
  const restart = () => { A.tries++; A.over = false; A.paused = false; el.querySelector('.act-panel').hidden = true; A.card(null); A.alt(null); A.count(''); A.t = 0; G.init(A); };
  const close = win => { if(finished) return; finished = true; ACT.on = false; cancelAnimationFrame(ACT.raf); removeEventListener('resize', size);
    el.querySelector('.act-fade').style.opacity = 1;
    setTimeout(() => { el.classList.remove('on'); ui.cut = false; if(G.stop) G.stop(A); done(win); }, 420); };
  A.pause = () => { if(A.over || A.paused) return; panel('Пауза.', [[ 'Продолжить', () => { A.paused = false; el.querySelector('.act-panel').hidden = true; } ], [ G.accept || 'Пусть будет так', () => close(false) ]]); };
  ACT.close = close;
  /* ввод: палец/мышь и клавиши */
  const pos = e => { const r = cv.getBoundingClientRect(); A.mx = e.clientX - r.left; A.my = e.clientY - r.top; };
  cv.onpointerdown = e => { audioInit(); if(A.paused) return; pos(e); A.down = true; A.touch = e.pointerType !== 'mouse'; try{ cv.setPointerCapture(e.pointerId); }catch(_){} G.press && !A.over && G.press(A, A.mx, A.my); };
  cv.onpointermove = e => { pos(e); A.touch = e.pointerType !== 'mouse'; A.kSel = null; };
  cv.onpointerup = cv.onpointercancel = e => { A.down = false; G.release && G.release(A); };
  ACT.key = (e, down) => { if(down && e.code === 'Escape'){ if(A.paused){ const b = el.querySelector('.act-panel .act-b'); b && b.click(); } else A.pause(); return; }
    if(A.paused){ if(down && (e.code === 'Enter' || e.code === 'Space') && document.activeElement && document.activeElement.classList.contains('act-b')) document.activeElement.click(); return; }
    A.keys[e.code] = down; if(down && G.key && !A.over) G.key(A, e.code); };
  size(); addEventListener('resize', size);
  ensure(G.keys || [], 6000).then(() => {
    if(finished) return;
    G.init(A); trackOnce('act_' + kind);
    let last = performance.now();
    const loop = now => {
      if(finished) return;
      const dt = Math.min(.05, (now - last) / 1000); last = now;
      if(!A.paused){ A.t += dt; if(!A.over) G.step(A, dt); else if(G.after) G.after(A, dt); }
      g.save(); G.draw(g, A); g.restore();
      if(subT > 0){ subT -= dt; if(subT <= 0) el.querySelector('.act-sub').classList.remove('on'); }
      const f = el.querySelector('.act-fade'); if(A.t < .6) f.style.opacity = 1 - A.t / .6; else if(f.style.opacity !== '0' && !finished) f.style.opacity = 0;
      ACT.raf = requestAnimationFrame(loop);
    };
    ACT.raf = requestAnimationFrame(loop);
  });
}
/* во время действия клавиши не доходят до игры */
addEventListener('keydown', e => { if(!ACT.on) return; if(e.target.closest && e.target.closest('.act-card')) { if(e.code !== 'Escape') return; } e.stopImmediatePropagation(); if(!(e.code === 'Tab' && ACT.A && ACT.A.paused)) e.preventDefault(); ACT.key(e, true); }, true);
addEventListener('keyup', e => { if(!ACT.on) return; e.stopImmediatePropagation(); ACT.key(e, false); }, true);

/* ---------- общие кусочки рисования ---------- */
function actVignette(g, W, H, k = .75){ const v = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .25, W / 2, H / 2, Math.max(W, H) * .75); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, `rgba(0,0,0,${k})`); g.fillStyle = v; g.fillRect(0, 0, W, H); }
function actSil(g, im, x, y, h, col, flip, alpha = 1){   // силуэт по картинке: x — середина, y — ступни
  if(!im) return; const w = im.width / im.height * h;
  if(!ACT.silC) ACT.silC = document.createElement('canvas');
  const c = ACT.silC, cw = Math.ceil(w) + 2, ch = Math.ceil(h) + 2; if(c.width < cw) c.width = cw; if(c.height < ch) c.height = ch;
  const q = c.getContext('2d'); q.clearRect(0, 0, c.width, c.height); q.globalCompositeOperation = 'source-over'; q.drawImage(im, 0, 0, w, h); q.globalCompositeOperation = 'source-in'; q.fillStyle = col; q.fillRect(0, 0, w, h); q.globalCompositeOperation = 'source-over';
  g.save(); g.globalAlpha = alpha; g.translate(x, y - h); if(flip){ g.scale(-1, 1); g.translate(-w / 2, 0); } else g.translate(-w / 2, 0); g.drawImage(c, 0, 0, w, h, 0, 0, w, h); g.restore();
}
function actImg(g, im, x, y, h, flip, white = 0){   // спрайт как есть: x — середина, y — ступни; white — засвет полуденным жаром
  if(!im) return; const w = im.width / im.height * h; g.save(); g.translate(x, y - h); if(flip) g.scale(-1, 1); g.drawImage(im, -w / 2, 0, w, h);
  if(white){ g.globalCompositeOperation = 'source-atop'; g.fillStyle = `rgba(255,250,235,${white})`; g.fillRect(-w / 2, 0, w, h); } g.restore(); }
function actFlame(g, x, y, k, t){
  const f = 1 + Math.sin(t * 23) * .06 + Math.sin(t * 9.3) * .08;
  const gr = g.createRadialGradient(x, y - 10 * k, 1, x, y - 8 * k, 26 * k * f); gr.addColorStop(0, 'rgba(255,240,200,.95)'); gr.addColorStop(.35, 'rgba(255,170,70,.55)'); gr.addColorStop(1, 'rgba(255,120,30,0)');
  g.fillStyle = gr; g.beginPath(); g.arc(x, y - 8 * k, 26 * k * f, 0, 7); g.fill();
  g.fillStyle = 'rgba(255,248,225,.95)'; g.beginPath(); g.moveTo(x, y - 22 * k * f); g.quadraticCurveTo(x + 6 * k, y - 6 * k, x, y); g.quadraticCurveTo(x - 6 * k, y - 6 * k, x, y - 22 * k * f); g.fill();
}

const ACTS = {};

/* =====================================================================
   1. ОБЫСК ПРИ СВЕЧЕ — дом Аглаи
   ===================================================================== */
ACTS.search = {
  title:'Дом Аглаи', keys:['bg_aglaya_house'], accept:'Искать на ощупь',
  spots:[
    { x:.618, y:.512, t:'Записка под чашкой' },
    { x:.404, y:.272, t:'Печурка. За спичками ещё одна записка' },
    { x:.935, y:.372, t:'На полке пустое место. Пыли нет' },
    { x:.088, y:.43,  t:'Календарь в сенях: 2011 год' },
  ],
  init(A){ A.cx = A.W * .5; A.cy = A.H * .55; A.tx = A.cx; A.ty = A.cy; A.wax = 1; A.dur = actDiff(80, 60, 46); A.dom = 0;
    A.sp = this.spots.map(s => ({ ...s, hold:0, got:false, at:0 }));
    A.hint(A.touch || matchMedia('(pointer:coarse)').matches ? 'Ведите пальцем: свеча идёт за ним. Задержите свет на том, что кажется странным.' : 'Свеча идёт за мышью или стрелками. Задержите свет на том, что кажется странным.');
    A.count(`Найдено 0 из ${A.sp.length}`); },
  step(A, dt){
    if(!A.view) return;
    const k = A.keys, sp = 520 * dt;
    if(k.ArrowLeft || k.KeyA) A.tx -= sp; if(k.ArrowRight || k.KeyD) A.tx += sp; if(k.ArrowUp || k.KeyW) A.ty -= sp; if(k.ArrowDown || k.KeyS) A.ty += sp;
    if(A.mx >= 0 && (!A.touch || A.down)){ A.tx = A.mx; A.ty = A.my - (A.touch ? 70 : 0); A.mx0 = A.mx; }   // под пальцем свечу не видно — держим её чуть выше
    A.tx = AC.clamp(A.tx, 0, A.W); A.ty = AC.clamp(A.ty, 0, A.H);
    A.cx += (A.tx - A.cx) * Math.min(1, dt * 9); A.cy += (A.ty - A.cy) * Math.min(1, dt * 9);
    A.wax -= dt / A.dur;
    const R = this.radius(A);
    for(const s of A.sp){ if(s.got) continue; const [x, y] = A.view.at(s.x, s.y), d = Math.hypot(x - A.cx, y - A.cy);
      if(d < R * .5){ s.hold += dt; if(s.hold > .75){ s.got = true; s.at = A.t; sfx('clue'); A.say(s.t, 2400); const n = A.sp.filter(q => q.got).length; A.count(`Найдено ${n} из ${A.sp.length}`); } }
      else s.hold = Math.max(0, s.hold - dt * .6); }
    // за печью кто-то есть
    { const [x, y] = A.view.at(.495, .64); if(!A.dom && Math.hypot(x - A.cx, y - A.cy) < R * .7){ A.dom = A.t; A.say(F('greeted') ? 'За печью кто-то кашлянул: смотреть смотри, а трогать не надо.' : 'За печью кто-то довольно засопел.', 2800); } }
    if(A.sp.every(s => s.got)) A.end(true, 'Всё, что Аглая оставила на виду, Анна нашла. Свеча ещё горела.');
    else if(A.wax <= 0){ A.wax = 0; A.end(false, 'Свеча догорела. Остальное пришлось искать на ощупь, и на это ушёл весь день.'); }
  },
  radius(A){ return Math.min(A.W, A.H) * (.15 + .06 * Math.max(0, A.wax)) * (1 + Math.sin(A.t * 17) * .025 + Math.sin(A.t * 5.1) * .03); },
  draw(g, A){
    const { W, H } = A, im = IMG.bg_aglaya_house; g.fillStyle = '#050403'; g.fillRect(0, 0, W, H);
    if(!im) return;
    A.pan = A.pan || [.5, .5]; A.pan[0] += (AC.clamp(A.cx / W, 0, 1) - A.pan[0]) * .04; A.pan[1] += (AC.clamp(A.cy / H, .2, .8) - A.pan[1]) * .04;
    A.view = actCover(g, im, W, H, A.pan[0], A.pan[1], 1.08);
    // темнота с дыркой от свечи и от огня в печи
    if(!A.dk) A.dk = document.createElement('canvas');
    const d = A.dk; if(d.width !== cvW(A) || d.height !== cvH(A)){ d.width = cvW(A); d.height = cvH(A); }
    const q = d.getContext('2d'); q.setTransform(A.dpr, 0, 0, A.dpr, 0, 0); q.globalCompositeOperation = 'source-over'; q.clearRect(0, 0, W, H);
    q.fillStyle = 'rgba(3,2,1,.95)'; q.fillRect(0, 0, W, H); q.globalCompositeOperation = 'destination-out';
    const R = this.radius(A), hole = (x, y, r, a) => { const gr = q.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(0,0,0,${a})`); gr.addColorStop(.55, `rgba(0,0,0,${a * .75})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); q.fillStyle = gr; q.fillRect(x - r, y - r, r * 2, r * 2); };
    hole(A.cx, A.cy, R, 1);
    { const [fx, fy] = A.view.at(.39, .5); hole(fx, fy, Math.min(W, H) * .2, .55); }
    { const [mx, my] = A.view.at(.71, .36); hole(mx, my, Math.min(W, H) * .1, .25); }   // луна в окне
    g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(d, 0, 0); g.setTransform(A.dpr, 0, 0, A.dpr, 0, 0);
    // тёплый свет свечи
    g.globalCompositeOperation = 'lighter'; { const gr = g.createRadialGradient(A.cx, A.cy, 0, A.cx, A.cy, R * 1.1); gr.addColorStop(0, 'rgba(255,160,70,.16)'); gr.addColorStop(1, 'rgba(255,120,40,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); } g.globalCompositeOperation = 'source-over';
    // глаза за печью
    if(A.dom && A.t - A.dom < 1.6){ const [x, y] = A.view.at(.495, .64), a = Math.sin(Math.min(1, (A.t - A.dom) / 1.6) * Math.PI); for(const e of [-7, 7]){ g.fillStyle = `rgba(255,190,90,${.8 * a})`; g.beginPath(); g.arc(x + e, y, 2.4, 0, 7); g.fill(); } }
    // блики там, где что-то есть; найденное подписано
    for(const s of A.sp){ const [x, y] = A.view.at(s.x, s.y), dd = Math.hypot(x - A.cx, y - A.cy);
      if(!s.got){ const near = AC.clamp(1 - dd / (R * 1.4), 0, 1); if(near > 0){ const tw = .5 + .5 * Math.sin(A.t * 6 + s.x * 20), a = near * (.35 + .5 * tw); g.strokeStyle = `rgba(255,236,190,${a})`; g.lineWidth = 1.4; const r = 5 + 4 * tw; g.beginPath(); g.moveTo(x - r, y); g.lineTo(x + r, y); g.moveTo(x, y - r); g.lineTo(x, y + r); g.stroke(); }
        if(s.hold > 0){ g.strokeStyle = 'rgba(255,230,180,.85)'; g.lineWidth = 2; g.beginPath(); g.arc(x, y, 16, -Math.PI / 2, -Math.PI / 2 + s.hold / .75 * Math.PI * 2); g.stroke(); } }
      else { const a = Math.min(1, (A.t - s.at) * 3); g.globalAlpha = a; g.fillStyle = 'rgba(122,42,38,.95)'; g.beginPath(); g.arc(x, y, 4, 0, 7); g.fill(); g.globalAlpha = 1; }
    }
    actFlame(g, A.cx, A.cy + 8, 1, A.t);
    // свеча сбоку: сколько осталось
    const cx = W - 34, top = H * .3, h = H * .4, left = Math.max(0, A.wax);
    g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(cx - 5, top, 10, h);
    g.fillStyle = 'rgba(236,224,196,.75)'; g.fillRect(cx - 5, top + h * (1 - left), 10, h * left);
    actVignette(g, W, H, .6);
  },
};
const cvW = A => Math.round(A.W * A.dpr), cvH = A => Math.round(A.H * A.dpr);

/* =====================================================================
   2. ПОЛДЕНЬ — уйти из поля, пока поют; замереть, когда песня смолкла
   ===================================================================== */
ACTS.noon = {
  title:'Полдень', keys:['bg_field', 's_noon', 's_anna'], accept:'Остановиться',
  init(A){ A.prog = 0; A.heat = 0; A.mode = 'sing'; A.mt = AC.rnd(2.2, 3.4); A.wt = 0; A.ni = 0; A.nt = 0; A.li = 0; A.flash = 0; A.walkPh = 0; A.still = 0; A.lastMove = false;
    A.hint('Держите, чтобы идти (пробел, → или палец на экране). Когда песня смолкнет — отпустите и замрите.');
    A.say(SONGS.zhniv.lines[0], 2800); },
  moving(A){ const k = A.keys; return !!(A.down || k.Space || k.ArrowRight || k.KeyD || k.Enter); },
  step(A, dt){
    const mv = this.moving(A), W = A.W;
    A.mt -= dt;
    if(A.mode === 'sing'){
      A.nt -= dt; if(A.nt <= 0){ const N = SONG_MEL.zhniv, n = N[A.ni % N.length]; actNote(n[0], n[1] * .9, .045); A.nt = n[1]; A.ni++; }
      if(A.mt <= 0){ A.mode = 'warn'; A.mt = actDiff(.85, .6, .45); A.say('Песня оборвалась.', 1200); actSfx('hush'); }
    } else if(A.mode === 'warn'){ if(A.mt <= 0){ A.mode = 'watch'; A.mt = AC.rnd(1.5, 2.6); A.wt = 0; } }
    else if(A.mode === 'watch'){
      A.wt += dt;
      if(mv && A.wt > actDiff(.3, .18, .1)){ A.flash = 1; actSfx('heat'); A.end(false, 'Полудница обернулась. Жар накрыл Анну с головой, и рожь вокруг стала белой.'); return; }
      if(A.mt <= 0){ A.mode = 'sing'; A.mt = AC.rnd(actDiff(2.6, 2.1, 1.6), actDiff(4.2, 3.6, 3.0)); A.nt = .2; A.li = (A.li + 1) % SONGS.zhniv.lines.length; A.say(SONGS.zhniv.lines[A.li], 2800); }
    }
    if(mv && A.mode !== 'watch'){ A.prog += dt / actDiff(11, 13, 14); A.walkPh += dt * 9; if(Math.floor(A.walkPh / Math.PI) !== Math.floor((A.walkPh - dt * 9) / Math.PI)) actSfx('step'); }
    // полуденный жар: кто стоит в поле в полдень, того печёт
    A.heat += dt / actDiff(75, 55, 45) * (mv ? .7 : 1.25);
    if(A.heat >= 1){ A.flash = 1; actSfx('heat'); A.end(false, 'Солнце стояло прямо над головой. Анна села в рожь и уже не смогла подняться.'); return; }
    A.count(A.mode === 'watch' ? 'Она смотрит' : A.mode === 'warn' ? 'Тихо…' : 'Поют');
    if(A.prog >= 1){ A.prog = 1; A.end(true, 'Рожь кончилась. За спиной снова тянулась песня, но уже далеко.'); }
  },
  after(A, dt){ A.flash = Math.max(0, A.flash - dt * .6); },
  draw(g, A){
    const { W, H } = A, im = IMG.bg_field, look = A.mode === 'watch' ? Math.min(1, A.wt * 4) : A.mode === 'warn' ? .25 : 0;
    g.fillStyle = '#d8c79a'; g.fillRect(0, 0, W, H);
    if(im) actCover(g, im, W, H, .15 + A.prog * .7, .55, 1.32);
    // марево и белый полуденный свет
    g.fillStyle = `rgba(255,248,225,${.12 + A.heat * .28 + look * .12})`; g.fillRect(0, 0, W, H);
    // она стоит в глубине поля
    const nx = W * .66 - A.prog * W * .22, nh = H * .52, ny = H * .72;
    if(IMG.s_noon){ g.save(); g.globalAlpha = .55 + look * .4; if(look > .3){ const gr = g.createRadialGradient(nx, ny - nh * .8, 0, nx, ny - nh * .8, nh * .7); gr.addColorStop(0, `rgba(255,252,235,${.6 * look})`); gr.addColorStop(1, 'rgba(255,250,230,0)'); g.fillStyle = gr; g.fillRect(nx - nh, ny - nh * 1.6, nh * 2, nh * 1.6); }
      const w = IMG.s_noon.width / IMG.s_noon.height * nh, wob = Math.sin(A.t * 2.2) * 2;
      g.translate(nx + wob, ny - nh); if(A.mode === 'sing') g.scale(-1, 1);   // поёт — стоит к Анне спиной
      g.drawImage(IMG.s_noon, -w / 2, 0, w, nh); g.restore(); }
    // рожь на переднем плане: качается, пока поют, и замирает, когда она смотрит
    const sway = A.mode === 'sing' ? 1 : A.mode === 'warn' ? .3 : .05, base = H * .78;
    const ax = W * (.1 + A.prog * .72), mv = this.moving(A) && A.mode !== 'watch', crouch = !mv;
    A.cr = AC.lerp(A.cr || 0, crouch ? 1 : 0, .15);
    const ah = H * .42 * (1 - A.cr * .2), bob = mv ? Math.abs(Math.sin(A.walkPh)) * H * .008 : 0;
    this.rye(g, A, sway, 0);
    actImg(g, IMG.s_anna, ax, H * .98 + A.cr * H * .06 - bob, ah, false, A.mode === 'watch' ? .25 : 0);
    this.rye(g, A, sway, 1);
    if(A.flash > 0){ g.fillStyle = `rgba(255,252,240,${A.flash})`; g.fillRect(0, 0, W, H); }
    // жар — полоска внизу
    g.fillStyle = 'rgba(60,30,10,.25)'; g.fillRect(W * .3, H - 18, W * .4, 3); g.fillStyle = 'rgba(190,80,25,.85)'; g.fillRect(W * .3, H - 18, W * .4 * A.heat, 3);
    actVignette(g, W, H, .35);
  },
  /* рожь берём из самой картины: полоса колосьев, отражённая встык, качается вертикальными ломтиками */
  ryeTex(A){ if(A.ryeT) return A.ryeT; const im = IMG.bg_field; if(!im) return null;
    const sx = im.width * .3, sy = im.height * .5, sw = im.width * .34, sh = im.height * .2, c = document.createElement('canvas'); c.width = sw * 2 | 0; c.height = sh | 0;
    const q = c.getContext('2d'); q.drawImage(im, sx, sy, sw, sh, 0, 0, sw, sh); q.save(); q.translate(sw * 2, 0); q.scale(-1, 1); q.drawImage(im, sx, sy, sw, sh, 0, 0, sw, sh); q.restore();
    q.globalCompositeOperation = 'destination-in'; const gr = q.createLinearGradient(0, 0, 0, sh); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(.4, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,1)'); q.fillStyle = gr; q.fillRect(0, 0, c.width, sh);
    return A.ryeT = c; },
  rye(g, A, sway, layer){
    const T = this.ryeTex(A); if(!T) return;
    const { W, H } = A, top = H * (layer ? .7 : .6), h = H * (layer ? .36 : .3), k = h / T.height, tw = T.width * k, off = A.prog * W * (layer ? 1.15 : .75) + (layer ? tw * .37 : 0);
    const n = 56, gx = Math.sin(A.t * 1.1 + layer) * 5 * sway;   // ломтики встык, без нахлёста: колосья качаются вверх-вниз, вся полоса — чуть вбок
    for(let i = 0; i < n; i++){ const x0 = Math.round(i * W / n), x1 = Math.round((i + 1) * W / n), dy = Math.sin(A.t * 2.1 + i * .35 + layer * 2) * 5 * sway;
      let u = (((x0 + off) % tw) + tw) % tw / k; const uw = (x1 - x0) / k; if(u + uw > T.width) u = T.width - uw;
      g.drawImage(T, u, 0, uw, T.height, x0 + gx, top + dy, x1 - x0, h - dy); }
    if(layer){ const gr = g.createLinearGradient(0, H, 0, top + h * .3); gr.addColorStop(0, 'rgba(30,20,8,.55)'); gr.addColorStop(1, 'rgba(30,20,8,0)'); g.fillStyle = gr; g.fillRect(0, top, W, H - top); }
  },
};

/* =====================================================================
   3. ЗАЛОМ — разобрать узел по одной соломине, сверху вниз
   ===================================================================== */
ACTS.knot = {
  title:'Залом', keys:['bg_field'], accept:'Дёрнуть как есть',
  init(A){
    const n = actDiff(7, 9, 10); A.err = 0; A.maxErr = actDiff(5, 3, 2); A.shake = 0; A.prick = null;
    A.hint('Тяните сначала верхние соломины — те, что ничем не придавлены. Красную нить — последней.');
    this.layout(A, n); A.count(`Ошибок можно сделать: ${A.maxErr}`);
  },
  layout(A, n){
    const cx = A.W / 2, cy = A.H * .55, r = Math.min(A.W * .44, A.H * .36);
    A.c = [cx, cy, r]; A.st = [];
    for(let i = 0; i < n; i++){
      const red = i === 0, a = (i / n) * Math.PI + AC.rnd(-.25, .25), d = AC.rnd(-.5, .5);
      const p0 = [cx + Math.cos(a) * r, cy + Math.sin(a) * r * .8], p3 = [cx - Math.cos(a + d) * r, cy - Math.sin(a + d) * r * .8];
      const p1 = [cx + AC.rnd(-.45, .45) * r, cy + AC.rnd(-.4, .4) * r], p2 = [cx + AC.rnd(-.45, .45) * r, cy + AC.rnd(-.4, .4) * r];
      const pts = []; for(let k = 0; k <= 30; k++){ const t = k / 30, u = 1 - t; pts.push([u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0], u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]]); }
      A.st.push({ pts, red, alive:true, out:0, dir:[p0[0] - p3[0], p0[1] - p3[1]], w: red ? r * .03 : r * AC.rnd(.045, .06), tone:Math.random() });
    }
    const cross = (a, b) => { for(let i = 0; i < a.length - 1; i++) for(let j = 0; j < b.length - 1; j++) if(segX(a[i], a[i + 1], b[j], b[j + 1])) return true; return false; };
    A.X = A.st.map((s, i) => A.st.map((q, j) => j > i && cross(s.pts, q.pts)));
  },
  free(A, i){ for(let j = i + 1; j < A.st.length; j++) if(A.st[j].alive && A.X[i][j]) return false; return true; },
  hit(A, x, y){ for(let i = A.st.length - 1; i >= 0; i--){ const s = A.st[i]; if(!s.alive) continue; if(polyDist(s.pts, x, y) < s.w * .5 + (A.touch ? 14 : 7)) return i; } return -1; },
  press(A, x, y){ this.pull(A, this.hit(A, x, y), x, y); },
  /* с клавиатуры: стрелками выбрать соломину, пробелом тянуть */
  key(A, code){ const alive = A.st.map((s, i) => i).filter(i => A.st[i].alive); if(!alive.length) return;
    if(code === 'ArrowLeft' || code === 'ArrowRight' || code === 'Tab'){ const p = alive.indexOf(A.kSel); A.kSel = alive[(p + (code === 'ArrowLeft' ? alive.length - 1 : 1) + alive.length) % alive.length]; }
    if((code === 'Space' || code === 'Enter') && alive.includes(A.kSel)){ const s = A.st[A.kSel], m = s.pts[15]; this.pull(A, A.kSel, m[0], m[1]); } },
  pull(A, i, x, y){
    if(i < 0) return;
    const s = A.st[i];
    if(this.free(A, i)){ s.alive = false; s.out = .001; actSfx('rustle');
      const left = A.st.filter(q => q.alive).length;
      if(s.red) A.say('Красная нитка. Она лежала в самой середине узла.', 2600);
      if(!left) A.end(true, 'Узел разошёлся. Колосья распрямились, а в ладони осталась красная нитка.');
    } else { A.err++; A.shake = .35; A.prick = [x ?? A.c[0], y ?? A.c[1], A.t]; actSfx('prick');
      A.say(A.err >= A.maxErr ? 'Узел затянулся.' : 'Соломина не идёт: сверху её прижимают другие. Колос уколол палец.', 2000);
      A.count(`Ошибок можно сделать: ${Math.max(0, A.maxErr - A.err)}`);
      if(A.err >= A.maxErr) A.end(false, 'Узел затянулся туже и врезался в пальцы. Пришлось рвать как есть.'); }
  },
  step(A, dt){ A.shake = Math.max(0, A.shake - dt); for(const s of A.st) if(s.out) s.out = Math.min(1, s.out + dt * 2.2); },
  after(A, dt){ this.step(A, dt); },
  draw(g, A){
    const { W, H } = A; g.fillStyle = '#1b140c'; g.fillRect(0, 0, W, H);
    if(IMG.bg_field) actCover(g, IMG.bg_field, W, H, .4, .75, 2.2);
    g.fillStyle = 'rgba(20,14,8,.7)'; g.fillRect(0, 0, W, H);
    const [cx, cy, r] = A.c, sh = A.shake > 0 ? Math.sin(A.t * 90) * 5 * A.shake / .35 : 0;
    { const gr = g.createRadialGradient(cx, cy, r * .1, cx, cy, r * 1.3); gr.addColorStop(0, 'rgba(255,220,150,.16)'); gr.addColorStop(1, 'rgba(255,220,150,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
    g.save(); g.translate(sh, 0);
    const hv = A.over ? -1 : A.kSel != null && A.st[A.kSel] && A.st[A.kSel].alive ? A.kSel : A.touch ? -1 : this.hit(A, A.mx, A.my);
    g.lineCap = 'round'; g.lineJoin = 'round';
    for(let i = 0; i < A.st.length; i++){
      const s = A.st[i]; if(s.out >= 1) continue;
      g.save(); if(s.out){ const k = s.out * s.out; g.globalAlpha = 1 - k; g.translate(s.dir[0] * k * .9, s.dir[1] * k * .9 - k * 40); }
      const path = () => { g.beginPath(); g.moveTo(s.pts[0][0], s.pts[0][1]); for(const p of s.pts) g.lineTo(p[0], p[1]); };
      path(); g.strokeStyle = 'rgba(22,14,6,.85)'; g.lineWidth = s.w + 4; g.stroke();
      path(); g.strokeStyle = s.red ? '#9b231c' : `rgb(${196 + s.tone * 30 | 0},${150 + s.tone * 30 | 0},${72 + s.tone * 20 | 0})`; g.lineWidth = s.w; g.stroke();
      path(); g.strokeStyle = s.red ? 'rgba(220,90,70,.55)' : 'rgba(250,228,160,.55)'; g.lineWidth = Math.max(1, s.w * .25); g.stroke();
      if(i === hv){ path(); g.strokeStyle = 'rgba(255,248,230,.5)'; g.lineWidth = s.w + 6; g.globalCompositeOperation = 'lighter'; g.stroke(); g.globalCompositeOperation = 'source-over'; }
      if(!s.red){ const [x, y] = s.pts[0], [x2, y2] = s.pts[2], a = Math.atan2(y - y2, x - x2); g.translate(x, y); g.rotate(a);   // колос на конце
        for(let k = 0; k < 6; k++){ g.fillStyle = `rgb(${206 + s.tone * 30 | 0},${168 + s.tone * 30 | 0},${80 + s.tone * 20 | 0})`; g.beginPath(); g.ellipse(6 + k * 6, (k % 2 ? 1 : -1) * 3, 5, 2.6, (k % 2 ? 1 : -1) * .4, 0, 7); g.fill(); g.strokeStyle = 'rgba(40,28,10,.6)'; g.lineWidth = 1; g.stroke(); } }
      g.restore();
    }
    g.restore();
    if(A.prick && A.t - A.prick[2] < .6){ const a = 1 - (A.t - A.prick[2]) / .6; g.fillStyle = `rgba(160,30,25,${.7 * a})`; g.beginPath(); g.arc(A.prick[0], A.prick[1], 6 + 10 * (1 - a), 0, 7); g.fill(); }
    actVignette(g, W, H, .7);
  },
};
function segX(a, b, c, d){
  const o = (p, q, r) => (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
  return (o(a, b, c) > 0) !== (o(a, b, d) > 0) && (o(c, d, a) > 0) !== (o(c, d, b) > 0);
}
function polyDist(pts, x, y){ let best = 1e9; for(let i = 0; i < pts.length - 1; i++){ const [ax, ay] = pts[i], [bx, by] = pts[i + 1], dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy || 1, t = AC.clamp(((x - ax) * dx + (y - ay) * dy) / L, 0, 1); best = Math.min(best, Math.hypot(x - ax - dx * t, y - ay - dy * t)); } return best; }

/* =====================================================================
   4. НОЧНОЙ ЛЕС — пять развилок; дорогу подсказывает записка Аглаи
   по-английски. Ошибся — снова тот же пень и тот же мужик на нём.
   ===================================================================== */
const PATH_SIGNS = { birch:'a birch', rowan:'a rowan', owl:'an owl', ribbon:'a red ribbon', light:'a light', stones:'stones' };
const PATH_FORKS = [
  { signs:['rowan', 'birch', 'light'], ok:'rowan', en:'Rowan keeps you safe. Walk [towards] the rowan.', ru:'Рябина бережёт. Иди к рябине.' },
  { signs:['light', 'stones', 'owl'], ok:'stones', en:'[Don\'t follow] a light in the forest. [Don\'t wake] the owl.', ru:'Не иди за огоньком в лесу. Не буди сову.' },
  { signs:['ribbon', 'birch', 'owl'], ok:'ribbon', en:'Find the red thread. It [will lead] you.', ru:'Найди красную нить. Она выведет.' },
  { signs:['stones', 'light', 'birch'], ok:'birch', en:'The right path [goes past] the white trees.', ru:'Верная тропа идёт мимо белых деревьев.' },
  { signs:['owl', 'rowan', 'light'], ok:'light', en:'At the very end, the light [is] yours. [Go] to it.', ru:'В самом конце огонёк — твой. Иди к нему.' },
];
ACTS.path = {
  title:'Ночной лес', keys:['bg_forest_stop_l', 's_leshy'], accept:'Сесть и ждать утра',
  init(A){ setF('forestRead'); A.step = 0; A.loops = 0; A.turned = false; A.trans = 0; A.loopT = 0; A.sel = -1; this.fork(A);
    A.hint(matchMedia('(pointer:coarse)').matches ? 'Перевод записки — по «?». Нажмите на тропу, по которой пойдёт Анна.' : 'Перевод записки — по «?». Выберите тропу кликом или клавишами 1–3.'); },
  fork(A){ const F0 = PATH_FORKS[A.step]; A.order = AC.shuffle(F0.signs.slice());
    A.card(`<span class="act-from">Аглая · строка ${A.step + 1} из ${PATH_FORKS.length}</span><span class="act-en" lang="en">${enMark(F0.en)}</span>${typeof listenBtn === 'function' ? listenBtn(F0.en) : ''}<button type="button" class="trb act-tr" aria-label="Перевод">?</button><span class="act-ru" hidden>${F0.ru}</span>`);
    const c = document.querySelector('#act .act-card'), b = c.querySelector('.act-tr'); if(b) b.onclick = e => { e.stopPropagation(); const r = c.querySelector('.act-ru'); r.hidden = !r.hidden; if(!r.hidden) track('act_translate', { step:A.step }); };
    A.count(A.loops ? `Кругов по лесу: ${A.loops} из 3` : ''); },
  xs(A){ return [.2, .5, .8].map(k => A.W * k); },
  pick(A, i){
    if(A.trans || A.loopT || i < 0 || i > 2) return;
    const F0 = PATH_FORKS[A.step];
    if(A.order[i] === F0.ok){ A.trans = .001; A.sel = i; actSfx('step'); setTimeout(() => actSfx('step'), 260); }
    else { A.loopT = .001; A.sel = i; A.loops++; actSfx('rustle');
      setTimeout(() => { if(!ACT.on) return; A.say(A.loops === 1 ? '— Опять ты, — сказал мужик на пне. — Тут все кругами ходят.' : A.loops === 2 ? '— Третий раз мимо меня, — мужик на пне зевнул.' : 'Пень, тулуп, застёгнутый на левую сторону. Опять.', 3200); }, 650); }
  },
  press(A, x){ if(A.my < A.H * .22) return; const xs = this.xs(A); let bi = 0; xs.forEach((v, i) => { if(Math.abs(v - x) < Math.abs(xs[bi] - x)) bi = i; }); this.pick(A, bi); },
  key(A, code){ const m = { Digit1:0, Digit2:1, Digit3:2, Numpad1:0, Numpad2:1, Numpad3:2, ArrowLeft:0, KeyA:0, ArrowUp:1, KeyW:1, ArrowRight:2, KeyD:2 }; if(code in m) this.pick(A, m[code]); },
  step(A, dt){
    if(A.trans){ A.trans += dt / .9; if(A.trans >= 1){ A.trans = 0; A.step++; A.sel = -1;
      if(A.step >= PATH_FORKS.length){ A.card(null); A.alt(null); A.end(true, 'Между стволами показался свет. Изба стояла на порогах, и порогов было больше, чем дверей.'); return; }
      this.fork(A); } }
    if(A.loopT){ A.loopT += dt / 3.4; if(A.loopT >= 1){ A.loopT = 0; A.sel = -1;
      if(A.loops >= 3){ A.card(null); A.alt(null); A.end(false, 'Лес водил Анну до рассвета. Очнулась она на опушке, в мокрой траве.'); return; }
      A.step = Math.max(0, A.step - 1); this.fork(A);
      if(A.loops >= 1 && !A.turned) A.alt('Вывернуть куртку наизнанку', () => { A.turned = true; A.loops = 0; A.count(''); A.say('Анна вывернула куртку наизнанку, как учила Груня. Мужик на пне хмыкнул и отвернулся.', 3400); }); } }
  },
  draw(g, A){
    const { W, H } = A, im = IMG.bg_forest_stop_l, k = A.trans ? A.trans : 0, lp = A.loopT;
    g.fillStyle = '#04060b'; g.fillRect(0, 0, W, H);
    const xs = this.xs(A), hy = H * .52, zoom = 1 + k * .5;
    g.save(); if(k){ const fx = xs[A.sel]; g.translate(fx, hy); g.scale(zoom, zoom); g.translate(-fx, -hy); }
    if(im){ g.globalAlpha = .55; actCover(g, im, W, H, .5 + Math.sin(A.t * .3) * .05, .4, 1.15); g.globalAlpha = 1; }
    g.fillStyle = 'rgba(6,12,26,.6)'; g.fillRect(0, 0, W, H);
    // тропы — бледные полосы к просветам
    xs.forEach((x, i) => { const gr = g.createLinearGradient(0, H, 0, hy); gr.addColorStop(0, 'rgba(150,165,190,.22)'); gr.addColorStop(1, 'rgba(150,165,190,0)'); g.fillStyle = gr;
      const bw = W * .13, tw = W * .02; g.beginPath(); g.moveTo(x - bw, H); g.lineTo(x - tw, hy); g.lineTo(x + tw, hy); g.lineTo(x + bw, H); g.fill();
      const lg = g.createRadialGradient(x, hy, 0, x, hy, W * .07); lg.addColorStop(0, 'rgba(120,140,170,.25)'); lg.addColorStop(1, 'rgba(120,140,170,0)'); g.fillStyle = lg; g.fillRect(x - W * .08, hy - W * .08, W * .16, W * .16); });
    // ели между тропами
    for(const x of [0, .35, .65, 1].map(v => v * W)) this.spruce(g, x, H * .98, Math.min(H * .75, W * .8), A);
    if(!lp) A.order.forEach((s, i) => this.sign(g, s, xs[i] + W * .075, H, A, i));
    g.restore();
    // туман понизу
    { const gr = g.createLinearGradient(0, H * .7, 0, H); gr.addColorStop(0, 'rgba(160,175,200,0)'); gr.addColorStop(1, 'rgba(160,175,200,.22)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
    // наведённая тропа
    if(!A.touch && !k && !lp && A.mx >= 0 && A.my > H * .22){ let bi = 0; xs.forEach((v, i) => { if(Math.abs(v - A.mx) < Math.abs(xs[bi] - A.mx)) bi = i; }); g.strokeStyle = 'rgba(240,230,210,.35)'; g.lineWidth = 1; g.beginPath(); g.moveTo(xs[bi] - W * .05, H * .93); g.lineTo(xs[bi] + W * .05, H * .93); g.stroke();
      g.fillStyle = 'rgba(240,230,210,.8)'; g.font = `400 ${Math.round(15 * (SET.size === 'l' ? 1.15 : 1))}px 'PT Serif', serif`; g.textAlign = 'center'; g.fillText(PATH_SIGNS[A.order[bi]], xs[bi], H * .96); }
    // круг: тот же пень и тот же мужик
    if(lp){ const a = Math.sin(Math.min(1, lp) * Math.PI); g.fillStyle = `rgba(2,3,6,${a * .7})`; g.fillRect(0, 0, W, H);
      if(lp > .12 && lp < .92){ const b = Math.min(1, (lp - .12) * 5, (.92 - lp) * 5), sx = W / 2, sy = H * .82;
        g.fillStyle = `rgba(40,30,22,${b})`; g.beginPath(); g.ellipse(sx, sy, W * .07, H * .03, 0, 0, 7); g.fill(); g.fillRect(sx - W * .06, sy - H * .07, W * .12, H * .07);
        if(IMG.s_leshy) actSil(g, IMG.s_leshy, sx, sy - H * .05, H * .36, 'rgba(14,22,14,.95)', false, b);
        for(const e of [-6, 6]){ g.fillStyle = `rgba(190,240,110,${b * .9})`; g.beginPath(); g.arc(sx + e, sy - H * .36, 2.2, 0, 7); g.fill(); } } }
    if(k > .6){ g.fillStyle = `rgba(0,0,0,${(k - .6) / .4})`; g.fillRect(0, 0, W, H); }
    actVignette(g, W, H, .8);
  },
  spruce(g, x, y, h, A){ g.fillStyle = '#02040a'; const w = h * .28; g.beginPath(); g.moveTo(x, y - h);
    for(let i = 1; i <= 7; i++){ const yy = y - h + h * i / 7, ww = w * i / 7; g.lineTo(x + ww, yy); g.lineTo(x + ww * .45, yy - h * .02); } for(let i = 7; i >= 1; i--){ const yy = y - h + h * i / 7, ww = w * i / 7; g.lineTo(x - ww * .45, yy - h * .02); g.lineTo(x - ww, yy); } g.closePath(); g.fill(); },
  sign(g, s, x, H, A, i){
    const t = A.t, base = H * .86; H = Math.min(H, A.W * 1.1);   // на узком экране знаки не вытягиваются в рост
    g.save();
    if(s === 'birch'){ g.fillStyle = '#d9d6cc'; g.fillRect(x - 7, base - H * .5, 14, H * .5); g.fillStyle = '#1a1a1a'; for(let k = 0; k < 9; k++){ const yy = base - H * .5 + k * H * .055 + (k * 37 % 11); g.fillRect(x - 7 + (k % 2) * 6, yy, 8, 3); } g.strokeStyle = '#cfcabd'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, base - H * .38); g.lineTo(x + 30, base - H * .44); g.stroke(); }
    if(s === 'rowan'){ g.strokeStyle = '#2a1d14'; g.lineWidth = 6; g.beginPath(); g.moveTo(x, base); g.lineTo(x, base - H * .38); g.stroke(); g.lineWidth = 2.5; for(const [dx, dy] of [[-30, -.3], [26, -.34], [-18, -.4], [20, -.24]]){ g.beginPath(); g.moveTo(x, base + dy * H + 20); g.lineTo(x + dx, base + dy * H); g.stroke();
        g.fillStyle = '#b1261b'; for(let b = 0; b < 7; b++){ g.beginPath(); g.arc(x + dx + Math.cos(b * 2.1) * 5, base + dy * H + 5 + Math.sin(b * 2.1) * 4, 3, 0, 7); g.fill(); } } }
    if(s === 'owl'){ const by = base - H * .4; g.strokeStyle = '#1e160f'; g.lineWidth = 4; g.beginPath(); g.moveTo(x - 50, by + 22); g.lineTo(x + 40, by + 16); g.stroke(); g.fillStyle = '#16120d'; g.beginPath(); g.ellipse(x, by, 15, 22, 0, 0, 7); g.fill();
      const blink = (t + i) % 4.5 < .14 ? .1 : 1; for(const e of [-6, 6]){ g.fillStyle = `rgba(250,200,70,${.95 * blink})`; g.beginPath(); g.arc(x + e, by - 8, 3.4, 0, 7); g.fill(); } }
    if(s === 'ribbon'){ const by = base - H * .34; g.strokeStyle = '#1e160f'; g.lineWidth = 4; g.beginPath(); g.moveTo(x - 46, by); g.lineTo(x + 36, by - 8); g.stroke(); g.fillStyle = '#a3231d'; g.beginPath(); g.moveTo(x, by - 4);
      for(let k = 0; k <= 10; k++) g.lineTo(x + Math.sin(t * 3 + k * .6) * 6 + k * 1.5, by + k * 6); for(let k = 10; k >= 0; k--) g.lineTo(x + Math.sin(t * 3 + k * .6) * 6 + k * 1.5 + 6, by + k * 6); g.fill(); }
    if(s === 'light'){ const by = base - H * .3 + Math.sin(t * 1.7 + i) * 12, gr = g.createRadialGradient(x, by, 0, x, by, 34); gr.addColorStop(0, 'rgba(210,255,235,.95)'); gr.addColorStop(.2, 'rgba(140,230,210,.5)'); gr.addColorStop(1, 'rgba(120,220,200,0)'); g.globalCompositeOperation = 'lighter'; g.fillStyle = gr; g.fillRect(x - 40, by - 40, 80, 80); }
    if(s === 'stones'){ g.fillStyle = '#4a4c52'; for(const [dx, dy, r] of [[-14, 0, 14], [12, 0, 12], [0, -16, 10]]){ g.beginPath(); g.ellipse(x + dx, base - 8 + dy, r * 1.2, r * .85, 0, 0, 7); g.fill(); } g.fillStyle = 'rgba(200,210,230,.12)'; g.beginPath(); g.ellipse(x - 4, base - 30, 6, 3, 0, 0, 7); g.fill(); }
    g.restore();
  },
};

/* =====================================================================
   5. НЕ ОГЛЯДЫВАЙСЯ — бег от реки к околице
   ===================================================================== */
const RUN_CALLS = [ 'Аня…', 'Аня, подожди меня.', 'Оглянись. Это же я.', 'Не бросай меня тут…', 'Анечка. Холодно.' ];
ACTS.run = {
  title:'Не оглядывайся', keys:['s_anna'], accept:'Обернуться',
  init(A){ A.d = 0; A.len = actDiff(20, 25, 28); A.y = 0; A.vy = 0; A.obs = []; A.next = 1.6; A.hits = 0; A.slow = 0; A.mist = .08; A.ci = 0; A.ct = 2.4; A.ph = 0; A.flash = 0;
    A.hint('Прыжок — пробел, ↑ или касание. Споткнётесь трижды — она догонит.'); A.count('◦ ◦ ◦'); },
  jump(A){ if(A.y === 0 && !A.over){ A.vy = 6.45; A.y = .001; actSfx('rustle'); } },
  press(A){ this.jump(A); }, key(A, c){ if(['Space', 'ArrowUp', 'KeyW', 'Enter'].includes(c)) this.jump(A); },
  step(A, dt){
    const sp = A.slow > 0 ? .45 : 1; A.slow = Math.max(0, A.slow - dt); A.flash = Math.max(0, A.flash - dt * 2);
    A.d += dt * sp; A.ph += dt * 13 * sp;
    if(Math.floor(A.ph / Math.PI) !== Math.floor((A.ph - dt * 13 * sp) / Math.PI) && A.y === 0) actSfx('step');
    // прыжок: 0..1 высоты, около 0.62 с в воздухе
    if(A.y > 0){ A.y += A.vy * dt; A.vy -= dt * 20.8; if(A.y <= 0){ A.y = 0; A.vy = 0; } }
    const v = A.W * .62 * sp, ax = A.W * .36;
    A.next -= dt * sp; if(A.next <= 0 && A.d < A.len - 2){ A.obs.push({ x:A.W + 60, kind:Math.random() < .55 ? 'root' : 'log', hit:false }); A.next = AC.rnd(actDiff(1.25, 1, .85), actDiff(2, 1.7, 1.4)); }
    for(const o of A.obs){ o.x -= v * dt; const w = o.kind === 'log' ? 44 : 30;
      if(!o.hit && Math.abs(o.x - ax) < w * .5 + 10 && A.y < (o.kind === 'log' ? .34 : .26)){ o.hit = true; A.hits++; A.slow = .7; A.flash = 1; A.mist += .16; actSfx('thud'); A.say(A.hits >= 3 ? 'Анна упала.' : 'Корень под ногой. Сзади смеются, совсем близко.', 1800);
        A.count('● '.repeat(A.hits) + '◦ '.repeat(Math.max(0, 3 - A.hits))); } }
    A.obs = A.obs.filter(o => o.x > -80);
    A.mist = Math.max(.08, A.mist - dt * .012);
    A.ct -= dt; if(A.ct <= 0){ A.say(RUN_CALLS[A.ci % RUN_CALLS.length], 2200); A.ci++; A.ct = AC.rnd(3.4, 5); }
    if(A.hits >= 3){ A.end(false, 'Анна споткнулась в третий раз и, падая, обернулась.'); return; }
    if(A.d >= A.len) A.end(true, 'Впереди качались факелы, околица была совсем рядом. Смех за спиной отстал.');
  },
  draw(g, A){
    const { W, H } = A, gy = H * .78, prog = A.d / A.len, scroll = A.d * W * .62;
    { const gr = g.createLinearGradient(0, 0, 0, gy); gr.addColorStop(0, '#05081a'); gr.addColorStop(1, '#16223a'); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
    { const mx = W * .78, my = H * .2, gr = g.createRadialGradient(mx, my, 0, mx, my, H * .2); gr.addColorStop(0, 'rgba(230,236,255,.5)'); gr.addColorStop(1, 'rgba(200,210,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); g.fillStyle = '#e8ecf6'; g.beginPath(); g.arc(mx, my, H * .035, 0, 7); g.fill(); }
    // дальний лес и околица впереди
    this.ridge(g, A, scroll * .15, gy - H * .14, H * .16, '#0a1020', 1);
    if(prog > .7){ const a = (prog - .7) / .3, hx = W * (1.25 - a * .35); g.fillStyle = '#080c16'; for(let k = 0; k < 3; k++){ const x = hx + k * W * .12; g.fillRect(x, gy - H * .12, W * .08, H * .12); g.beginPath(); g.moveTo(x - 8, gy - H * .12); g.lineTo(x + W * .04, gy - H * .2); g.lineTo(x + W * .08 + 8, gy - H * .12); g.fill(); g.fillStyle = 'rgba(255,190,90,.8)'; g.fillRect(x + W * .03, gy - H * .08, W * .018, H * .025); g.fillStyle = '#080c16'; } }
    this.ridge(g, A, scroll * .45, gy - H * .04, H * .12, '#060914', 2);
    // факелы бегущих впереди женщин
    for(let k = 0; k < 4; k++){ const x = W * (.66 + k * .08) + Math.sin(A.t * 2 + k) * 10, y = gy - H * .2 - Math.abs(Math.sin(A.t * 7 + k * 1.3)) * 6, gr = g.createRadialGradient(x, y, 0, x, y, 26); gr.addColorStop(0, 'rgba(255,210,120,.95)'); gr.addColorStop(.3, 'rgba(255,140,50,.45)'); gr.addColorStop(1, 'rgba(255,120,40,0)'); g.globalCompositeOperation = 'lighter'; g.fillStyle = gr; g.fillRect(x - 30, y - 30, 60, 60); g.globalCompositeOperation = 'source-over'; }
    // земля и тропа
    g.fillStyle = '#05070c'; g.fillRect(0, gy, W, H - gy); g.fillStyle = '#1a1f2a'; g.fillRect(0, gy, W, 4);
    g.strokeStyle = '#0c1018'; g.lineWidth = 2; for(let k = 0; k < 60; k++){ const x = ((k * 53 - scroll) % W + W) % W; g.beginPath(); g.moveTo(x, gy + 2); g.lineTo(x + 4, gy - 10 - (k * 7 % 9)); g.stroke(); }
    for(const o of A.obs){ g.fillStyle = '#0b0805'; if(o.kind === 'log'){ g.beginPath(); g.ellipse(o.x, gy - 9, 26, 11, 0, 0, 7); g.fill(); g.fillStyle = '#2a2116'; g.beginPath(); g.ellipse(o.x + 24, gy - 9, 5, 10, 0, 0, 7); g.fill(); }
      else { g.strokeStyle = '#120d08'; g.lineWidth = 6; g.beginPath(); g.moveTo(o.x - 22, gy + 2); g.quadraticCurveTo(o.x, gy - 26, o.x + 20, gy + 2); g.stroke(); } }
    // Анна
    const ax = W * .36, ah = H * .28, jy = Math.sin(Math.min(1, A.y) * Math.PI / 2) * H * .17, bob = A.y ? 0 : Math.abs(Math.sin(A.ph)) * H * .012;
    g.save(); g.translate(ax, gy); g.rotate(.08); g.translate(-ax, -gy); actSil(g, IMG.s_anna, ax, gy - jy - bob + 2, ah, '#020306', false); g.restore();
    // туман сзади и та, что в нём
    const mx = W * A.mist; { const gr = g.createLinearGradient(0, 0, mx + W * .18, 0); gr.addColorStop(0, 'rgba(200,215,235,.6)'); gr.addColorStop(mx / (mx + W * .18), 'rgba(200,215,235,.32)'); gr.addColorStop(1, 'rgba(200,215,235,0)'); g.fillStyle = gr; g.fillRect(0, 0, mx + W * .18, H); }
    { const gx = mx - W * .02, a = AC.clamp(A.mist * 2.2, .2, .85); g.fillStyle = `rgba(235,240,250,${a * .55})`; g.beginPath(); g.ellipse(gx, gy - ah * .86, ah * .06, ah * .075, 0, 0, 7); g.fill();
      g.beginPath(); g.moveTo(gx - ah * .08, gy - ah * .8); g.quadraticCurveTo(gx - ah * .16, gy - ah * .3, gx - ah * .12, gy); g.lineTo(gx + ah * .12, gy); g.quadraticCurveTo(gx + ah * .14, gy - ah * .3, gx + ah * .07, gy - ah * .8); g.fill(); }
    if(A.flash){ g.fillStyle = `rgba(200,215,235,${A.flash * .35})`; g.fillRect(0, 0, W, H); }
    // сколько осталось до околицы
    g.fillStyle = 'rgba(255,255,255,.1)'; g.fillRect(W * .3, H - 18, W * .4, 2); g.fillStyle = 'rgba(255,190,110,.8)'; g.fillRect(W * .3, H - 18, W * .4 * Math.min(1, prog), 2);
    actVignette(g, W, H, .7);
  },
  ridge(g, A, off, y, h, col, seed){ const { W } = A; g.fillStyle = col; g.beginPath(); g.moveTo(0, A.H);
    for(let x = -40; x <= W + 40; x += 18){ const u = x + off, k = Math.sin(u * .013 * seed + seed) * .5 + Math.sin(u * .041 + seed * 3) * .3 + Math.sin(u * .11) * .2; g.lineTo(x, y - h * (.5 + k * .5) * ((Math.floor(u / 18) % 2) ? 1 : .7)); }
    g.lineTo(W, A.H); g.closePath(); g.fill(); },
};
