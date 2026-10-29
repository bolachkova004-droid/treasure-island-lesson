'use strict';
/* =====================================================================
   СВЕТ И ПЛЁНКА — живые источники поверх картины
   - огонь в печи, лампа, свеча: мерцают и «дышат» тёплым светом;
   - лучи из окон: мягкие, с медленной тенью облака и пылью внутри луча;
   - ночью на улице: свет от фонарика телефона у Анны и темнота по краям;
   - зерно плёнки (#grain) теперь живое: чуть сдвигается, как на плёнке.
   Координаты — доли картины (как на сетке фона), поэтому свет стоит
   ровно там, где на картине окно или печь.
   ===================================================================== */
const LUX = {
  aglaya: [ { t:'fire', at:[.39, .5], r:.46, col:'255,150,60', a:.5 },
            { t:'shaft', win:[.645, .27, .745, .48], to:[-.13, .44], a:.46 } ],
  grunya: [ { t:'fire', at:[.545, .3], r:.34, col:'255,190,110', a:.42, sway:true },
            { t:'fire', at:[.33, .42], r:.12, col:'255,182,96', a:.38 },
            { t:'fire', at:[.78, .53], r:.26, col:'255,140,50', a:.42 } ],
  school: [ { t:'shaft', win:[.285, .23, .435, .52], to:[.02, .3], a:.34 },
            { t:'shaft', win:[.505, .23, .64, .52], to:[.02, .3], a:.34 } ],
  laptev: [ { t:'shaft', win:[.375, .27, .495, .43], to:[-.03, .42], a:.32 } ],
  flat:   [ { t:'shaft', win:[.63, .1, .92, .66], to:[-.16, .26], a:.13 } ],
};
/* цвет луча по времени суток: утро холодное, день белёсый, вечер тёплый, ночь — луна */
const SHAFT_COL = ['205,220,240', '240,240,232', '255,200,140', '150,176,232'];
const LUXS = { cache:{}, motes:{} };

/* мерцание огня: несколько синусов разной частоты, чтобы не было заметного ритма */
const flick = (t, seed) => .78 + .1 * Math.sin(t * 7.3 + seed) + .07 * Math.sin(t * 13.1 + seed * 2.3) + .05 * Math.sin(t * 2.1 + seed * .7);

function luxPos(strip, part, fx, fy){
  const Ly = layout(strip); if(!Ly) return null; const sg = Ly.segs[part || 0]; if(!sg) return null;
  const { s, oy } = VIEW, camX = CAM.x;
  return [ (sg.r0 + fx * sg.rw - camX) * s, oy + fy * VH * s, sg.rw * s, VH * s ];
}
/* лучи всей комнаты рисуются один раз в слой размером с картину, мягкими, и потом только накладываются */
function shaftLayer(strip, ph, list, iw, ih){
  const key = strip + ph; if(LUXS.cache[key]) return LUXS.cache[key];
  const W = 900, H = Math.round(W * ih / iw), c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d'), col = SHAFT_COL[ph];
  try{ g.filter = 'blur(6px)'; }catch(e){}
  for(const L of list){ if(L.t !== 'shaft') continue;
    const [x0, y0, x1, y1] = L.win, [dx, dy] = L.to, a = L.a * (ph === 3 ? 1.15 : ph === 2 ? 1.1 : 1);
    const gr = g.createLinearGradient(((x0 + x1) / 2) * W, y0 * H, ((x0 + x1) / 2 + dx) * W, (y1 + dy) * H);
    gr.addColorStop(0, `rgba(${col},${a})`); gr.addColorStop(.55, `rgba(${col},${a * .45})`); gr.addColorStop(1, `rgba(${col},0)`);
    g.fillStyle = gr; g.beginPath(); g.moveTo(x0 * W, y0 * H); g.lineTo(x1 * W, y0 * H); g.lineTo((x1 + dx) * W, (y1 + dy) * H); g.lineTo((x0 + dx) * W, (y1 + dy) * H); g.closePath(); g.fill();
    // пятно света на полу
    const fx = ((x0 + x1) / 2 + dx) * W, fy = (y1 + dy) * H, rw = (x1 - x0) * W * 1.1, pool = g.createRadialGradient(fx, fy, 0, fx, fy, rw);
    pool.addColorStop(0, `rgba(${col},${a * .7})`); pool.addColorStop(1, `rgba(${col},0)`); g.fillStyle = pool; g.save(); g.translate(fx, fy); g.scale(1, .28); g.translate(-fx, -fy); g.fillRect(fx - rw, fy - rw, rw * 2, rw * 2); g.restore(); }
  return LUXS.cache[key] = c;
}
/* пылинки — только внутри лучей: так они читаются как пыль на свету, а не как точки на экране */
function motesFor(strip, list){
  if(LUXS.motes[strip]) return LUXS.motes[strip];
  const M = []; const r = rng(strip.length * 97 + 3);
  for(const L of list){ if(L.t !== 'shaft') continue; const [x0, y0, x1, y1] = L.win, [dx, dy] = L.to;
    for(let i = 0; i < 26; i++){ const u = r(), v = r(); M.push({ L, u, v, p:r() * 6.28, sp:.2 + r() * .5, sz:.6 + r() * 1.3 }); } }
  return LUXS.motes[strip] = M;
}
function luxLight(g, v, camX, anna, ph, indoor){
  if(window.NOLUX) return;   // на слабом устройстве (LOWQ) остаются огонь и фонарик, без лучей и пыли
  const list = LUX[v.strip], { s, oy, cw, ch } = VIEW, t = T;
  g.setTransform(1, 0, 0, 1, 0, 0);
  if(list){
    const P0 = luxPos(v.strip, 0, 0, 0), im = artParts(v.strip, ph) && artParts(v.strip, ph).imgs[0];
    // лучи
    if(P0 && im && !LOWQ.on && list.some(L => L.t === 'shaft')){
      const lay = shaftLayer(v.strip, ph, list, im.width, im.height), cloud = .82 + .18 * Math.sin(t * .23) * Math.sin(t * .11 + 1);
      g.save(); g.globalCompositeOperation = 'screen'; g.globalAlpha = cloud; g.drawImage(lay, P0[0], P0[1], P0[2], P0[3]); g.restore();
      // пыль в луче
      g.save(); g.globalCompositeOperation = 'lighter'; const col = SHAFT_COL[ph];
      for(const m of motesFor(v.strip, list)){ const [x0, y0, x1, y1] = m.L.win, [dx, dy] = m.L.to;
        const k = (m.v + t * m.sp * .012) % 1, fx = x0 + (x1 - x0) * m.u + dx * k + Math.sin(t * .4 + m.p) * .004, fy = y0 + (y1 + dy - y0) * k + Math.sin(t * .3 + m.p * 2) * .003;
        const x = P0[0] + fx * P0[2], y = P0[1] + fy * P0[3], tw = .5 + .5 * Math.sin(t * 1.3 + m.p), a = .5 * tw * Math.sin(k * Math.PI) * cloud;
        if(a < .02) continue; g.fillStyle = `rgba(${col},${a})`; g.beginPath(); g.arc(x, y, m.sz * s, 0, 6.29); g.fill(); }
      g.restore(); }
    // огонь, лампа, свеча
    g.save(); g.globalCompositeOperation = 'lighter';
    list.forEach((L, i) => { if(L.t !== 'fire' || !P0) return;
      const f = flick(t, i * 1.7), sw = L.sway ? Math.sin(t * .9) * .004 : 0, x = P0[0] + (L.at[0] + sw) * P0[2], y = P0[1] + L.at[1] * P0[3], r = L.r * P0[3] * (.94 + .06 * f);
      const night = ph === 3 ? 1.25 : ph === 2 ? 1.1 : .8, a = L.a * f * night;
      const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${L.col},${a * .55})`); gr.addColorStop(.35, `rgba(${L.col},${a * .22})`); gr.addColorStop(1, `rgba(${L.col},0)`);
      g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); });
    g.restore();
  }
  if(v.strip === 'village' && ph >= 2 && !LOWQ.on){ luxBloom(g, camX, ph); luxWet(g, camX, ph); }
  // ночь на улице: фонарик телефона и темнота по краям
  if(ph === 3 && !indoor && anna && !STRIPS[v.strip].frozen){
    const k = charK(v.strip), ax = (R(v.strip, anna.x) - camX) * s, fy = oy + GY * s, h = 124 * k * s, dir = anna.dir || 1;
    const dark = g.createRadialGradient(ax, fy - h * .5, h * .9, ax, fy - h * .5, Math.max(cw, ch) * .75);
    dark.addColorStop(0, 'rgba(3,5,12,0)'); dark.addColorStop(1, 'rgba(3,5,12,.42)'); g.fillStyle = dark; g.fillRect(0, 0, cw, ch);
    const hx = ax + dir * h * .16, hy = fy - h * .5, tx = ax + dir * h * 1.9, flickT = .96 + .04 * Math.sin(t * 31) * Math.sin(t * 3);
    g.save(); g.globalCompositeOperation = 'lighter';
    const cone = g.createLinearGradient(hx, hy, tx, fy); cone.addColorStop(0, `rgba(220,230,255,${.16 * flickT})`); cone.addColorStop(1, 'rgba(220,230,255,0)');
    g.fillStyle = cone; g.beginPath(); g.moveTo(hx, hy - h * .03); g.lineTo(tx, fy - h * .45); g.lineTo(tx + dir * h * .2, fy + h * .1); g.lineTo(hx, hy + h * .03); g.closePath(); g.fill();
    const px = ax + dir * h * 1.1, pool = g.createRadialGradient(px, fy, 0, px, fy, h * .9); pool.addColorStop(0, `rgba(210,222,255,${.2 * flickT})`); pool.addColorStop(1, 'rgba(210,222,255,0)');
    g.save(); g.translate(px, fy); g.scale(1, .22); g.translate(-px, -fy); g.fillStyle = pool; g.fillRect(px - h, fy - h, h * 2, h * 2); g.restore();
    const dot = g.createRadialGradient(hx, hy, 0, hx, hy, h * .05); dot.addColorStop(0, 'rgba(240,245,255,.65)'); dot.addColorStop(1, 'rgba(240,245,255,0)'); g.fillStyle = dot; g.fillRect(hx - h * .1, hy - h * .1, h * .2, h * .2);
    g.restore(); }
}

/* ---------- лужи на улице: близкая лужа отражает небо, а не дальние окна ----------
   Вечером — тёплый отсвет заката, ночью — холодный отблеск неба и мерцающие блики луны.
   Только в мокрых местах картины (WET), с мягким краем. */
const WET_Y = [.75, .91], _wetC = { c:null };
function luxWet(g, camX, ph){
  const Ly = layout('village'); if(!Ly) return;
  const { s, oy, cw } = VIEW, t = T, H = VH * s, sky = ph === 3 ? '150,170,230' : '255,170,110', amt = ph === 3 ? .2 : .13;
  for(const [pi, x0, x1] of WET.village || []){
    const sg = Ly.segs[pi], im = sg && sg.img; if(!im) continue;
    const q = sg.rw / im.width, sx0 = (sg.r0 + x0 * q - camX) * s, sx1 = (sg.r0 + x1 * q - camX) * s; if(sx1 < 0 || sx0 > cw) continue;
    const yA = oy + WET_Y[0] * H, yB = oy + WET_Y[1] * H, w = Math.ceil(sx1 - sx0), h = Math.ceil(yB - yA); if(w < 4 || h < 4) continue;
    if(!_wetC.c) _wetC.c = document.createElement('canvas'); const c = _wetC.c; if(c.width < w || c.height < h){ c.width = Math.max(c.width, w); c.height = Math.max(c.height, h); }
    const L = c.getContext('2d'); L.globalCompositeOperation = 'source-over'; L.globalAlpha = 1; L.clearRect(0, 0, c.width, c.height);
    // отблеск неба: ярче к дальнему краю лужи, рябь по строкам
    const sh = L.createLinearGradient(0, 0, 0, h); sh.addColorStop(0, `rgba(${sky},${amt})`); sh.addColorStop(1, `rgba(${sky},${amt * .35})`); L.fillStyle = sh;
    for(let y = 0; y < h; y += 3){ const wob = Math.sin(t * 1.3 + y * .3) * 3 * s; L.fillRect(wob, y, w, 2); }
    if(ph === 3){ const r = rng(pi * 131 + x0); L.fillStyle = 'rgba(214,226,255,1)';
      for(let i = 0; i < 16; i++){ const bx = r() * w, by = h * (.12 + r() * .78), sp = 1 + r() * 1.5, ph0 = r() * 6.28, tw = Math.max(0, Math.sin(t * sp + ph0)); if(tw < .4) continue;
        L.globalAlpha = .55 * tw; L.fillRect(bx + Math.sin(t * .7 + i) * 2 * s, by, (3 + r() * 9) * s, Math.max(1, .9 * s)); }
      L.globalAlpha = 1; }
    L.globalCompositeOperation = 'destination-in';
    const gr = L.createRadialGradient(w / 2, h / 2, Math.min(w, h) * .1, w / 2, h / 2, w / 2); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(.6, 'rgba(0,0,0,.75)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    L.save(); L.translate(w / 2, h / 2); L.scale(1, h / w); L.translate(-w / 2, -h / 2); L.fillStyle = gr; L.fillRect(-w, -w, w * 3, w * 3); L.restore();
    g.save(); g.globalCompositeOperation = 'screen'; g.drawImage(c, 0, 0, w, h, sx0, yA, w, h); g.restore();
  }
}

/* ---------- ореол у окон: та же карта света, заранее размытая, поверх — тёплое свечение в сыром воздухе ---------- */
const _bloom = {};
function bloomOf(key){ if(_bloom[key] !== undefined) return _bloom[key]; const im = IMG[key]; if(!im) return null;
  try{ const c = document.createElement('canvas'); c.width = im.width / 2; c.height = im.height / 2; const q = c.getContext('2d'); q.filter = 'blur(9px)'; q.drawImage(im, 0, 0, c.width, c.height); return _bloom[key] = c; }catch(e){ return _bloom[key] = null; } }
function luxBloom(g, camX, ph){
  const a = STRIP_ART.village, Ly = layout('village'); if(!Ly) return; const { s, oy } = VIEW;
  g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = ph === 3 ? .55 : .3;
  Ly.segs.forEach((sg, i) => { const b = bloomOf('l_' + a.parts[i]); if(!b || sg.r0 + sg.rw < camX - 10 || sg.r0 > camX + VIEW.viewW + 10) return;
    g.drawImage(b, (sg.r0 - camX) * s, oy, sg.rw * s + 1, VH * s); });
  g.restore();
}
