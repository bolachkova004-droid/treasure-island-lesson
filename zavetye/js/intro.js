'use strict';
/* =====================================================================
   ВСТУПЛЕНИЕ — легенда о свадьбе 1962 года, перед прологом
   Шесть планов: медленная камера по картине, туман, огни, колыбельная
   без последней строки; между планами протягивается красная нить.
   Каждый план берёт лучшее, что есть: ролик из Kling (c_legend_N),
   иллюстрацию (il_legend_N) или фон игры. Пропуск — кнопкой, Esc,
   пробелом или Enter.
   ===================================================================== */
const INTRO = [
  { pic:['il_legend_1', 'bg_forest_stop_l'], vid:'c_legend_1', grade:'night', cam:[[.5, .5, 1.04], [.5, .46, 1.14]], dur:9, fx:['fog', 'flies'],
    lines:[ [.6, 'Про Заветье в районе говорят коротко: оттуда не уезжают.'], [4.8, 'А в самом Заветье говорят иначе: лес хранит несбывшееся.'] ] },
  { pic:['il_legend_2', 'bg_street_2'], vid:'c_legend_2', grade:'night', glow:'l_bg_street_2', cam:[[.3, .5, 1.12], [.45, .5, 1.04]], dur:9, fx:['fog', 'embers'],
    lines:[ [.5, 'В купальскую ночь шестьдесят второго года здесь играли свадьбу.'], [4.6, 'Невеста за кузнеца не хотела. У реки её ждала машина.'] ] },
  { pic:['il_legend_3', 'bg_river'], vid:'c_legend_3', grade:'dusk', cam:[[.58, .55, 1.16], [.62, .52, 1.06]], dur:7.5, fx:['fog', 'car'],
    lines:[ [.5, 'Машина ждала до четырёх утра. Фары горели на том берегу.'] ] },
  { pic:['il_legend_4', 'bg_grunya_house'], vid:'c_legend_4', grade:'warm', lamp:[.545, .3], cam:[[.5, .5, 1.03], [.52, .42, 1.15]], dur:11, fx:['dust'], hum:'lull',
    lines:[ [.5, 'Младшая сестра пела невесте колыбельную, чтобы та уснула и никуда не ушла.'], [4.4, '«Баю-баюшки-баю, не ложися на краю…»', 'song'], [8, 'Последнюю строчку она не допела.'] ] },
  { pic:['il_legend_5', 'bg_forest_stop'], vid:'c_legend_5', grade:'dawn', cam:[[.5, .5, 1.02], [.62, .5, 1.12]], dur:9.5, fx:['frozen'],
    lines:[ [.5, 'Утром невесты не было ни в доме, ни у реки. Она ушла в лес.'], [4.6, 'С тех пор всё, что здесь не случилось, лес держит у себя. И ждёт.'] ] },
  { pic:['il_legend_6', 'bg_road'], vid:'c_legend_6', grade:'dawn', cam:[[.45, .5, 1.1], [.5, .5, 1.02]], dur:7, fx:['fog'], title:true, lines:[] },
];
const IN = { on:false };
function introKeys(){ return INTRO.flatMap(s => s.pic).concat(INTRO.map(s => s.glow).filter(Boolean)).filter(k => ASSETS[k]); }
function introUI(){
  let el = document.getElementById('intro'); if(el) return el;
  el = document.createElement('div'); el.id = 'intro'; el.className = 'intro';
  el.innerHTML = '<canvas class="in-cv"></canvas><div class="cut-bar top"></div><div class="cut-bar bot"></div><p class="in-line" aria-live="polite"></p><div class="in-title"><b>Заветье</b><i>Лес хранит несбывшееся</i></div><button type="button" class="cut-skip in-skip">Пропустить <span aria-hidden="true">›</span></button><div class="in-fade"></div>';
  document.body.appendChild(el); return el;
}
function playIntro(done){
  const auto = 'INTRO_AUTO' in window ? window.INTRO_AUTO : navigator.webdriver;   // автотесты сразу идут дальше
  if(auto){ done(); return; }
  const el = introUI(), cv = el.querySelector('.in-cv'), g = cv.getContext('2d'), line = el.querySelector('.in-line'), ttl = el.querySelector('.in-title'), fade = el.querySelector('.in-fade');
  let finished = false, raf = 0, t0 = 0, curLine = null, hummed = new Set();
  IN.on = true; ui.cut = true; el.classList.add('on'); fade.style.opacity = 1; line.classList.remove('on'); ttl.classList.remove('on');
  const vids = {};
  const size = () => { const d = Math.min(2, devicePixelRatio || 1); cv.width = innerWidth * d | 0; cv.height = innerHeight * d | 0; g.setTransform(d, 0, 0, d, 0, 0); };
  const finish = () => { if(finished) return; finished = true; cancelAnimationFrame(raf); removeEventListener('resize', size); fade.style.transition = 'opacity .7s ease'; fade.style.opacity = 1;
    setTimeout(() => { el.classList.remove('on'); IN.on = false; ui.cut = false; for(const v of Object.values(vids)) { v.pause(); v.removeAttribute('src'); } done(); }, 750); };
  el.querySelector('.in-skip').onclick = () => { track('intro_skipped', {}); finish(); };
  IN.skip = finish; size(); addEventListener('resize', size);
  const starts = []; let acc = 0; for(const s of INTRO){ starts.push(acc); acc += s.dur; } const TOTAL = acc;
  const XF = 1.4;   // нахлёст планов
  const picOf = s => { for(const k of s.pic){ if(IMG[k]) return IMG[k]; } return null; };
  const vidOf = s => { if(typeof vsrc !== 'function' || !vsrc(s.vid)) return null; if(!vids[s.vid]){ const v = document.createElement('video'); v.muted = true; v.playsInline = true; v.preload = 'auto'; v.src = vsrc(s.vid); vids[s.vid] = v; } return vids[s.vid]; };
  ensure(introKeys(), 6000).then(() => {
    if(finished) return; trackOnce('intro_started'); t0 = performance.now();
    const loop = now => {
      if(finished) return;
      const t = (now - t0) / 1000 * (window.INTRO_SPEED ?? 1) + (window.INTRO_T0 || 0), W = innerWidth, H = innerHeight;
      if(t >= TOTAL){ finish(); return; }
      let i = 0; while(i < INTRO.length - 1 && t >= starts[i + 1]) i++;
      g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.fillStyle = '#050608'; g.fillRect(0, 0, W, H);
      const lt = t - starts[i], s = INTRO[i];
      // уходящий план дотаивает под новым
      if(i > 0 && lt < XF) introShot(g, INTRO[i - 1], INTRO[i - 1].dur + lt, W, H, 1, picOf, vidOf);
      introShot(g, s, lt, W, H, i > 0 ? Math.min(1, lt / XF) : 1, picOf, vidOf);
      if(i > 0 && lt < XF + .3) introThread(g, Math.min(1, lt / (XF + .3)), W, H);
      introVignette(g, W, H);
      // строки рассказа
      let L = null; for(const l of s.lines) if(lt >= l[0]) L = l;
      const key = L ? i + ':' + L[0] : null;
      if(key !== curLine){ curLine = key; line.classList.remove('on'); setTimeout(() => { if(finished || curLine !== key) return; line.textContent = L ? L[1] : ''; line.classList.toggle('in-song', !!(L && L[2])); if(L) line.classList.add('on'); }, 260); }
      if(L && lt > s.dur - .6) line.classList.remove('on');
      if(s.hum && !hummed.has(i) && lt > 4.3){ hummed.add(i); if(typeof lullaby === 'function') lullaby(); }
      ttl.classList.toggle('on', !!s.title && lt > 1);
      fade.style.transition = 'none'; fade.style.opacity = t < 1.4 ? 1 - t / 1.4 : t > TOTAL - 1.2 ? (t - TOTAL + 1.2) / 1.2 : 0;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
  });
}
/* один план: картина (или ролик) с медленной камерой, свет по времени суток и живые мелочи */
function introShot(g, s, lt, W, H, alpha, picOf, vidOf){
  const v = vidOf(s), im = v && v.readyState >= 2 ? v : picOf(s); if(!im) return;
  if(v && v.paused && lt < s.dur) v.play().catch(() => {});
  const q = Math.max(0, Math.min(1, lt / s.dur)), e = q * q * (3 - 2 * q), [a, b] = s.cam;
  const cx = a[0] + (b[0] - a[0]) * e, cy = a[1] + (b[1] - a[1]) * e, z = v ? 1 : a[2] + (b[2] - a[2]) * e;
  const iw = im.videoWidth || im.width, ih = im.videoHeight || im.height, sc = Math.max(W / iw, H / ih) * z, w = iw * sc, h = ih * sc;
  const x = Math.min(0, Math.max(W - w, W / 2 - cx * w)), y = Math.min(0, Math.max(H - h, H / 2 - cy * h));
  g.save(); g.globalAlpha = alpha; g.drawImage(im, x, y, w, h);
  const at = (fx, fy) => [x + fx * w, y + fy * h];
  const fill = (op, col) => { g.globalCompositeOperation = op; g.fillStyle = col; g.fillRect(0, 0, W, H); };
  if(s.grade === 'night'){ fill('multiply', 'rgb(88,98,138)'); fill('screen', 'rgba(16,22,42,.45)'); }
  if(s.grade === 'dawn'){ fill('soft-light', 'rgba(150,170,200,.35)'); fill('multiply', 'rgb(206,212,226)'); }
  if(s.grade === 'dusk'){ fill('multiply', 'rgb(196,170,170)'); }
  if(s.grade === 'warm'){ fill('multiply', 'rgb(214,196,176)'); }
  g.globalCompositeOperation = 'lighter';
  if(s.glow && typeof bloomOf === 'function'){ const bl = bloomOf(s.glow), lm = IMG[s.glow]; if(lm){ g.globalAlpha = alpha * .85; g.drawImage(lm, x, y, w, h); } if(bl){ g.globalAlpha = alpha * .7; g.drawImage(bl, x, y, w, h); } g.globalAlpha = alpha; }
  if(s.lamp){ const [lx, ly] = at(...s.lamp), f = .8 + .12 * Math.sin(lt * 7.3) + .08 * Math.sin(lt * 13.1), r = h * .32 * f, gr = g.createRadialGradient(lx, ly, 0, lx, ly, r);
    gr.addColorStop(0, 'rgba(255,196,120,.42)'); gr.addColorStop(1, 'rgba(255,170,90,0)'); g.fillStyle = gr; g.fillRect(lx - r, ly - r, r * 2, r * 2); }
  const T2 = lt;
  for(const f of s.fx || []){
    if(f === 'car'){ const [cx2, cy2] = at(.82, .49);   // две фары на дальнем берегу и их дрожащее отражение в воде
      for(const d of [-1, 1]){ const fl = .85 + .15 * Math.sin(T2 * 3 + d), r = h * .011, px = cx2 + d * h * .0065, gr = g.createRadialGradient(px, cy2, 0, px, cy2, r * 3); gr.addColorStop(0, `rgba(255,240,200,${.95 * fl})`); gr.addColorStop(.25, `rgba(255,220,160,${.4 * fl})`); gr.addColorStop(1, 'rgba(255,220,160,0)'); g.fillStyle = gr; g.fillRect(px - r * 3, cy2 - r * 3, r * 6, r * 6);
        for(let k = 1; k < 9; k++){ const yy = cy2 + h * (.012 + k * .009), ww = h * .004 * (1 + k * .25), wob = Math.sin(T2 * 2.2 + k * 1.7) * h * .002; g.fillStyle = `rgba(255,220,160,${.22 * fl * (1 - k / 9)})`; g.fillRect(px - ww / 2 + wob, yy, ww, h * .003); } } }
    if(f === 'flies' || f === 'embers'){ const r = rng(f === 'flies' ? 7 : 11), n = f === 'flies' ? 22 : 30;
      for(let k = 0; k < n; k++){ const bx = r(), by = r(), sp = .3 + r(), ph = r() * 6.28;
        const px = (bx + (f === 'embers' ? Math.sin(T2 * .6 + ph) * .01 : Math.sin(T2 * .3 * sp + ph) * .03)) * W, py = f === 'embers' ? H * (1 - ((by + T2 * .05 * sp) % 1)) : (by * .7 + .25 + Math.sin(T2 * .4 * sp + ph) * .02) * H;
        const tw = f === 'flies' ? Math.max(0, Math.sin(T2 * sp * 1.4 + ph)) : .6 + .4 * Math.sin(T2 * 5 + ph); if(tw < .1) continue;
        const rr = (f === 'flies' ? 2.2 : 1.6) * (1 + tw), col = f === 'flies' ? '220,240,150' : '255,160,70', gr = g.createRadialGradient(px, py, 0, px, py, rr * 4);
        gr.addColorStop(0, `rgba(${col},${.8 * tw})`); gr.addColorStop(1, `rgba(${col},0)`); g.fillStyle = gr; g.fillRect(px - rr * 4, py - rr * 4, rr * 8, rr * 8); } }
    if(f === 'dust'){ const r = rng(3); for(let k = 0; k < 40; k++){ const bx = r(), by = r(), ph = r() * 6.28, px = (bx + Math.sin(T2 * .2 + ph) * .01) * W, py = ((by + T2 * .006) % 1) * H, tw = .5 + .5 * Math.sin(T2 * 1.3 + ph);
      g.fillStyle = `rgba(255,220,170,${.35 * tw})`; g.beginPath(); g.arc(px, py, 1.2, 0, 6.29); g.fill(); } }
  }
  g.globalCompositeOperation = 'source-over';
  if((s.fx || []).includes('fog')){ const tex = typeof fogTex === 'function' ? fogTex(s.grade === 'night' ? 3 : 0) : null; if(tex){ g.globalAlpha = alpha * .5; const tw = W * 1.4, off = -((T2 * 22) % tw); for(let xx = off; xx < W; xx += tw) g.drawImage(tex, xx, H * .52, tw, H * .5); } }
  if((s.fx || []).includes('frozen')){ g.globalAlpha = alpha * .35; const tex = typeof fogTex === 'function' ? fogTex(0) : null; if(tex) g.drawImage(tex, -W * .1, H * .45, W * 1.4, H * .5); }   // туман стоит: здесь время не идёт
  g.restore();
}
/* красная нить между планами: протягивается слева направо и провисает */
function introThread(g, k, W, H){
  const e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2, x1 = W * e, y = H * .6, sag = H * .035;
  g.save(); g.globalAlpha = Math.min(1, (1 - k) * 3);
  g.strokeStyle = 'rgba(176,44,36,.95)'; g.lineWidth = 2.2; g.lineCap = 'round'; g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 6;
  g.beginPath(); g.moveTo(-10, y); g.quadraticCurveTo(x1 / 2, y + sag, x1, y); g.stroke();
  g.shadowBlur = 0; g.fillStyle = 'rgba(210,70,56,1)'; g.beginPath(); g.arc(x1, y, 3.4, 0, 6.29); g.fill();
  g.restore();
}
function introVignette(g, W, H){ const v = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .3, W / 2, H / 2, Math.max(W, H) * .7); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.6)'); g.fillStyle = v; g.fillRect(0, 0, W, H); }
addEventListener('keydown', e => { if(!IN.on) return; e.stopImmediatePropagation(); e.preventDefault(); if(['Escape', 'Enter', 'Space'].includes(e.code) && IN.skip) IN.skip(); }, true);
