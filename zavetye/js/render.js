'use strict';
/* =====================================================================
   ОТРИСОВКА — лубок. Чёрный контур, плоские цвета, штриховка, орнамент.
   Мировые координаты: высота 540, линия земли GY.
   ===================================================================== */
const GY = 430, VH = 540;
const BASE = {
  ink:'#1c1611', paper:'#f1e6c8', cream:'#f5ecd2', white:'#faf4e2', cin:'#b8321f', cinD:'#8a2416', ochre:'#d19a2e', gold:'#e8c14e',
  green:'#3f7044', greenD:'#28503a', greenL:'#86a650', spruce:'#2f5c45', spruceD:'#1f4033', spruceL:'#4f7f55', olive:'#7a7a3e',
  indigo:'#2a3968', blue:'#4f76a8', blueL:'#8fb0cc', log:'#a8703c', logD:'#744624', logL:'#cf9a5c', roof:'#6a4128', roofD:'#4a2c1a',
  brown:'#5c3522', grey:'#8e897c', greyL:'#b9b2a0', stone:'#c2b89c', skin:'#f2d1ab', cheek:'#e2785f', hair:'#5a3620', hairL:'#c9a060',
  earth:'#b98a48', earthD:'#8c6534', grass:'#6b8a3c', grassD:'#4d6b2c', denim:'#4a6c9c', yellow:'#e2b53c', water:'#4f86a0', waterD:'#2f5a74',
  glass:'#2b3c5c', rye:'#d9a93c', ryeD:'#b07f22', bark:'#6b5a3a', wall:'#b07a44', wallD:'#8a5a30', plaster:'#ece2c8',
};
const TINT = [ ['#dde6ef', .3], [null, 0], ['#f09a62', .45], ['#2e3c78', .8] ];
const SKY = [
  ['#a9c4d4','#bcd0d9','#cddbdc','#dde3d9','#ebe6d2','#f3e9cc'],
  ['#78aac8','#8fbad2','#a8c9d8','#c2d8dc','#dce5d8','#f2ebcc'],
  ['#2f3668','#4b3f72','#7b4a70','#b4566a','#d9744f','#eb9f4e','#f3c064'],
  ['#0e1432','#131b40','#19234d','#1f2c5a','#263567','#2f3f72'],
];
const hexRGB = h => { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
const rgbStr = a => `rgb(${a.map(v => Math.round(v)).join(',')})`;
const mix = (a, b, t) => { const A = hexRGB(a), B = hexRGB(b); return rgbStr(A.map((v, i) => v + (B[i] - v) * t)); };
const palCache = {};
function palette(ph){
  if(palCache[ph]) return palCache[ph];
  const [tc, k] = TINT[ph], P = {};
  for(const [n, c] of Object.entries(BASE)){
    if(!tc || n === 'ink'){ P[n] = c; continue; }
    const A = hexRGB(c), Tt = hexRGB(tc); P[n] = rgbStr(A.map((v, i) => v + (v * Tt[i] / 255 - v) * k));
  }
  P.ink = ph === 3 ? '#0c1024' : '#1c1611';
  return palCache[ph] = P;
}
let C = palette(0), V = null, T = 0, GLOWS = [];
const VF = k => !!(V && V.flags && V.flags[k]);
const glow = (x, y, r, a = 1, col = '255,196,96') => GLOWS.push({ x, y, r, a, col });

/* ---------- базовые штрихи ---------- */
function ol(g, lw = 2){ g.lineJoin = 'round'; g.lineCap = 'round'; g.strokeStyle = C.ink; g.lineWidth = lw; g.stroke(); }
let SIL = null;   // режим силуэта: фигуры поверх живописного фона рисуются тёмной тенью
function shape(g, fill, fn, lw = 2){ g.beginPath(); fn(); if(SIL){ if(fill){ g.fillStyle = SIL; g.fill(); } return; } if(fill){ g.fillStyle = fill; g.fill(); } if(lw) ol(g, lw); }
function rect(g, x, y, w, h, fill, lw = 2){ shape(g, fill, () => g.rect(x, y, w, h), lw); }
function circ(g, x, y, r, fill, lw = 2){ shape(g, fill, () => g.arc(x, y, r, 0, Math.PI * 2), lw); }
function hatch(g, clip, x0, y0, x1, y1, gap, col, lw = 1, ang = .9){
  g.save(); g.beginPath(); clip(); g.clip(); g.strokeStyle = col; g.lineWidth = lw; g.beginPath();
  const d = (y1 - y0) / Math.tan(ang); for(let x = x0 - Math.abs(d) - 10; x < x1 + 10; x += gap){ g.moveTo(x, y1); g.lineTo(x + d, y0); } g.stroke(); g.restore();
}
function limb(g, pts, w, col){
  g.lineCap = 'round'; g.lineJoin = 'round';
  g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for(let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
  if(SIL){ g.strokeStyle = SIL; g.lineWidth = w + 1.5; g.stroke(); return; }
  g.strokeStyle = C.ink; g.lineWidth = w + 3.2; g.stroke(); g.strokeStyle = col; g.lineWidth = w; g.stroke();
}
function rng(seed){ let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const hashStr = s => { let h = 2166136261; for(const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; };

/* ---------- природа ---------- */
function spruce(g, x, y, h, fill, dark, lw = 2){
  const tiers = 5, w = h * .36;
  rect(g, x - h * .03, y - h * .13, h * .06, h * .13, C.logD, lw * .8);
  for(let i = 0; i < tiers; i++){
    const t0 = i / tiers, ty = y - h * .1 - h * .84 * t0, tw = w * (1 - t0 * .8), th = h * .84 / tiers * 1.55;
    g.beginPath(); g.moveTo(x, ty - th);
    g.quadraticCurveTo(x + tw * .3, ty - th * .45, x + tw, ty);
    const n = 3; for(let k = n; k > 0; k--){ const xa = x - tw + 2 * tw * k / n, xb = x - tw + 2 * tw * (k - 1) / n; g.quadraticCurveTo((xa + xb) / 2, ty - th * .2, xb, ty); }
    g.quadraticCurveTo(x - tw * .3, ty - th * .45, x, ty - th); g.closePath();
    g.fillStyle = fill; g.fill(); ol(g, lw);
    g.strokeStyle = dark; g.lineWidth = lw * .7; g.beginPath();
    for(let k = -2; k <= 2; k++){ const sx = x + k * tw * .28; g.moveTo(sx, ty - th * .35 + Math.abs(k) * th * .08); g.lineTo(sx + k * tw * .08, ty - th * .08); } g.stroke();
  }
}
function birch(g, x, y, h, lw = 2){
  const r = rng(Math.round(x));
  g.strokeStyle = C.ink; g.lineWidth = lw * 1.2; g.beginPath();
  for(let i = 0; i < 6; i++){ const by = y - h * (.55 + i * .07), s = i % 2 ? 1 : -1; g.moveTo(x, by); g.quadraticCurveTo(x + s * 30, by - 22, x + s * (46 + r() * 14), by - 10 - r() * 20); } g.stroke();
  shape(g, C.white, () => { g.moveTo(x - 6, y); g.lineTo(x - 4, y - h); g.lineTo(x + 4, y - h); g.lineTo(x + 6, y); g.closePath(); }, lw);
  g.fillStyle = C.ink; for(let i = 0; i < 10; i++){ const yy = y - h * (i + .5) / 10; g.fillRect(x - 5 + (i % 2) * 4, yy, 4 + (i % 3) * 2, 2.4); }
  const cy = y - h * .88;
  for(let i = 0; i < 22; i++){ const a = r() * Math.PI * 2, d = r() * 52, lx = x + Math.cos(a) * d, ly = cy + Math.sin(a) * d * .7 + 10, sway = Math.sin(T * 1.4 + i) * 1.5;
    shape(g, i % 3 ? C.greenL : C.green, () => g.ellipse(lx + sway, ly, 9, 6, a, 0, Math.PI * 2), lw * .7); }
}
function tuft(g, x, y, s, col){
  shape(g, col, () => { g.moveTo(x - 6 * s, y); g.quadraticCurveTo(x - 7 * s, y - 8 * s, x - 11 * s, y - 13 * s); g.quadraticCurveTo(x - 3 * s, y - 9 * s, x, y - 18 * s); g.quadraticCurveTo(x + 3 * s, y - 9 * s, x + 11 * s, y - 13 * s); g.quadraticCurveTo(x + 7 * s, y - 8 * s, x + 6 * s, y); g.closePath(); }, 1.5);
}
function flower(g, x, y, col){ g.strokeStyle = C.ink; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - 12); g.stroke(); for(let i = 0; i < 5; i++){ const a = i / 5 * Math.PI * 2; circ(g, x + Math.cos(a) * 3.2, y - 12 + Math.sin(a) * 3.2, 2.4, col, 1); } circ(g, x, y - 12, 1.8, C.gold, .8); }
function cloud(g, x, y, w, col, lw = 2){
  const n = Math.max(3, Math.round(w / 38)), r = w / n * .6;
  g.beginPath(); g.moveTo(x - r * .6, y);
  for(let i = 0; i < n; i++){ const cx = x + i * (w / n), up = i % 2 ? r * .35 : 0; g.arc(cx, y - up, r, Math.PI, 0); }
  g.lineTo(x + w - w / n + r * .6, y); g.closePath(); g.fillStyle = col; g.fill(); ol(g, lw);
  g.lineWidth = lw * .8; g.beginPath(); for(let i = 0; i < n; i++){ const cx = x + i * (w / n), up = i % 2 ? r * .35 : 0; g.moveTo(cx + r * .35, y - up - r * .1); g.arc(cx, y - up - r * .1, r * .35, 0, Math.PI * 1.4); } g.stroke();
}
function sunDisc(g, x, y, r, ph){
  const rays = 18;
  for(let i = 0; i < rays; i++){ const a = i / rays * Math.PI * 2 + T * .05, a2 = a + Math.PI / rays;
    shape(g, i % 2 ? C.cin : C.gold, () => { g.moveTo(x + Math.cos(a - .12) * r * 1.05, y + Math.sin(a - .12) * r * 1.05); g.lineTo(x + Math.cos(a) * r * (i % 2 ? 1.7 : 1.9), y + Math.sin(a) * r * (i % 2 ? 1.7 : 1.9)); g.lineTo(x + Math.cos(a + .12) * r * 1.05, y + Math.sin(a + .12) * r * 1.05); g.closePath(); }, 1.6); }
  circ(g, x, y, r, ph === 2 ? '#f09a42' : C.gold, 2.2); g.strokeStyle = C.ink; g.lineWidth = 1.2; g.beginPath(); g.arc(x, y, r * .72, 0, Math.PI * 2); g.stroke();
}
function moonCres(g, x, y, r){
  shape(g, '#f3e7b8', () => { g.arc(x, y, r, Math.PI * .35, Math.PI * 1.65); g.quadraticCurveTo(x - r * .1, y, x + Math.cos(Math.PI * .35) * r, y + Math.sin(Math.PI * .35) * r); }, 2);
}
function star(g, x, y, s){ shape(g, '#f0d98a', () => { g.moveTo(x, y - s); g.quadraticCurveTo(x, y, x + s, y); g.quadraticCurveTo(x, y, x, y + s); g.quadraticCurveTo(x, y, x - s, y); g.quadraticCurveTo(x, y, x, y - s); }, 1); }

/* ---------- постройки ---------- */
function logWall(g, x, top, w, h, lw = 2){
  const rows = Math.max(3, Math.round(h / 15)), lh = h / rows;
  for(let i = 0; i < rows; i++){ const y = top + i * lh;
    shape(g, i % 2 ? C.log : C.logL, () => { g.moveTo(x, y + lh); g.lineTo(x, y + 2); g.quadraticCurveTo(x + w / 2, y - 1.5, x + w, y + 2); g.lineTo(x + w, y + lh); }, lw * .8);
    g.strokeStyle = C.logD; g.lineWidth = 1; g.beginPath(); const r = (i * 97) % 40; g.moveTo(x + 20 + r, y + lh * .55); g.lineTo(x + 70 + r, y + lh * .55); g.moveTo(x + w - 90 + r / 2, y + lh * .5); g.lineTo(x + w - 40 + r / 2, y + lh * .5); g.stroke(); }
  for(let i = 0; i < rows; i++){ const y = top + i * lh + lh / 2; for(const ex of [x - 3, x + w + 3]){ circ(g, ex, y, lh * .52, C.logL, lw * .8); g.beginPath(); g.arc(ex, y, lh * .25, 0, Math.PI * 2); g.lineWidth = .9; g.stroke(); } }
}
function nalichnik(g, wx, wy, ww, wh, lit, boarded, paint){
  const sp = paint || C.blue;
  for(const s of [-1, 1]){ const sx = s < 0 ? wx - ww * .55 - 6 : wx + ww + 6; rect(g, sx, wy - 2, ww * .55, wh + 4, sp, 1.8);
    const cx = sx + ww * .275, cy = wy + wh / 2; for(let i = 0; i < 4; i++){ const a = i * Math.PI / 2; shape(g, C.cream, () => g.ellipse(cx + Math.cos(a) * 4, cy + Math.sin(a) * 4, 3.4, 2, a, 0, Math.PI * 2), .9); } circ(g, cx, cy, 2.2, C.cin, .9); }
  shape(g, C.cream, () => { g.moveTo(wx - 8, wy - 4); g.lineTo(wx - 8, wy - 10); g.quadraticCurveTo(wx + ww / 2, wy - 40, wx + ww + 8, wy - 10); g.lineTo(wx + ww + 8, wy - 4); g.closePath(); }, 1.8);
  shape(g, C.cin, () => { g.moveTo(wx + ww / 2, wy - 30); g.bezierCurveTo(wx + ww / 2 + 9, wy - 34, wx + ww / 2 + 7, wy - 20, wx + ww / 2, wy - 15); g.bezierCurveTo(wx + ww / 2 - 7, wy - 20, wx + ww / 2 - 9, wy - 34, wx + ww / 2, wy - 30); }, 1);
  rect(g, wx - 6, wy - 5, ww + 12, wh + 10, C.cream, 1.8);
  rect(g, wx, wy, ww, wh, lit ? '#ffd35a' : C.glass, 1.6);
  if(lit){ glow(wx + ww / 2, wy + wh / 2, 120, 1); g.fillStyle = 'rgba(255,255,240,.6)'; g.fillRect(wx + 3, wy + 3, ww * .35, wh * .35); }
  else { g.strokeStyle = 'rgba(255,255,255,.25)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(wx + 4, wy + wh - 6); g.lineTo(wx + ww * .45, wy + 6); g.stroke(); }
  g.strokeStyle = C.ink; g.lineWidth = 2; g.beginPath(); g.moveTo(wx + ww / 2, wy); g.lineTo(wx + ww / 2, wy + wh); g.moveTo(wx, wy + wh * .42); g.lineTo(wx + ww, wy + wh * .42); g.stroke();
  shape(g, C.cream, () => { g.rect(wx - 12, wy + wh + 4, ww + 24, 6); }, 1.6);
  for(let i = 0; i < 6; i++){ const dx = wx - 10 + i * (ww + 20) / 5; shape(g, i % 2 ? C.cin : C.cream, () => { g.moveTo(dx - 3.5, wy + wh + 10); g.lineTo(dx, wy + wh + 18); g.lineTo(dx + 3.5, wy + wh + 10); g.closePath(); }, 1); }
  if(boarded){ for(const [a, b] of [[[wx - 6, wy + 4], [wx + ww + 6, wy + wh - 4]], [[wx + ww + 6, wy + 4], [wx - 6, wy + wh - 4]]]){ g.save(); g.translate(a[0], a[1]); const ang = Math.atan2(b[1] - a[1], b[0] - a[0]), L = Math.hypot(b[0] - a[0], b[1] - a[1]); g.rotate(ang); rect(g, 0, -4, L, 8, C.greyL, 1.6); g.restore(); } }
}
function izba(g, x, o = {}){
  const w = o.w || 280, h = o.h || 150, top = GY - h, rh = o.roofH || h * .8, ov = 26;
  // фронтон
  shape(g, C.wallD, () => { g.moveTo(x - 4, top + 2); g.lineTo(x + w / 2, top - rh + 14); g.lineTo(x + w + 4, top + 2); g.closePath(); }, 2);
  hatch(g, () => { g.moveTo(x - 4, top + 2); g.lineTo(x + w / 2, top - rh + 14); g.lineTo(x + w + 4, top + 2); g.closePath(); }, x, top - rh, x + w, top + 2, 9, C.logD, 1, Math.PI / 2);
  // слуховое окошко с солнцем
  const gx = x + w / 2, gy = top - rh * .38; circ(g, gx, gy, 13, C.cream, 1.8); circ(g, gx, gy, 8, o.lit ? '#ffd35a' : C.glass, 1.4);
  for(let i = 0; i < 12; i++){ const a = i / 12 * Math.PI * 2; g.beginPath(); g.moveTo(gx + Math.cos(a) * 14, gy + Math.sin(a) * 14); g.lineTo(gx + Math.cos(a) * 19, gy + Math.sin(a) * 19); ol(g, 1.3); }
  // печная труба и дым
  const cx = x + w * .74; rect(g, cx, top - rh * .7, 20, rh * .5, '#9a4a32', 1.8); rect(g, cx - 4, top - rh * .7 - 6, 28, 7, '#7a3a26', 1.6);
  if(o.smoke){ g.save(); for(let i = 0; i < 4; i++){ const k = (T * .08 + i / 4) % 1, sx = cx + 10 + k * 70 + Math.sin(k * 5 + i) * 5, sy = top - rh * .7 - 8 - k * 110, rr = 4 + k * 9;
    g.globalAlpha = (1 - k) * .85; g.beginPath(); g.moveTo(sx - rr * 1.6, sy); g.arc(sx - rr * .7, sy, rr * .9, Math.PI, 0); g.arc(sx + rr * .6, sy - rr * .3, rr * 1.1, Math.PI, 0); g.arc(sx + rr * 1.6, sy, rr * .6, Math.PI, 0); g.closePath(); g.fillStyle = C.white; g.fill(); ol(g, 1.2);
    g.beginPath(); g.arc(sx + rr * .6, sy - rr * .45, rr * .45, 0, Math.PI * 1.4); ol(g, .9); } g.restore(); }
  // скаты крыши
  for(const s of [-1, 1]){
    const ex = s < 0 ? x - ov : x + w + ov, px = x + w / 2;
    shape(g, C.roof, () => { g.moveTo(px, top - rh); g.lineTo(ex, top + 8); g.lineTo(ex + s * -24, top + 18); g.lineTo(px, top - rh + 26); g.closePath(); }, 2);
    g.save(); g.beginPath(); g.moveTo(px, top - rh); g.lineTo(ex, top + 8); g.lineTo(ex + s * -24, top + 18); g.lineTo(px, top - rh + 26); g.closePath(); g.clip();
    g.strokeStyle = C.roofD; g.lineWidth = 1.2; g.beginPath(); for(let t = .05; t < 1; t += .07){ const ax = px + (ex - px) * t, ay = top - rh + (top + 8 - top + rh) * t; g.moveTo(ax, ay); g.lineTo(ax - s * 16, ay + 16); } g.stroke(); g.restore();
    // причелина с резьбой
    for(let t = .08; t < .98; t += .09){ const ax = px + (ex - s * 12 - px) * t, ay = top - rh + 22 + (top + 14 - (top - rh + 22)) * t;
      shape(g, t * 100 % 2 < 1 ? C.cream : C.cin, () => { g.moveTo(ax - 5, ay); g.lineTo(ax, ay + 10); g.lineTo(ax + 5, ay); g.closePath(); }, 1); circ(g, ax, ay + 12, 1.8, C.cream, .8); }
  }
  // конёк
  const kx = x + w / 2, ky = top - rh; shape(g, C.cream, () => { g.moveTo(kx - 6, ky + 4); g.quadraticCurveTo(kx - 4, ky - 20, kx + 8, ky - 26); g.quadraticCurveTo(kx + 20, ky - 28, kx + 22, ky - 20); g.lineTo(kx + 12, ky - 16); g.quadraticCurveTo(kx + 6, ky - 10, kx + 6, ky + 4); g.closePath(); }, 1.8);
  circ(g, kx + 12, ky - 22, 1.5, C.ink, 0);
  // брёвна
  logWall(g, x, top, w, h);
  const xs = o.winX || Array.from({ length:o.win || 3 }, (_, i) => w * (i + 1) / ((o.win || 3) + 1) - 17);
  for(const ox of xs) nalichnik(g, x + ox, top + 34, 34, 46, o.lit, o.boarded, o.paint);
  if(o.door){ const dx = x + o.door;
    rect(g, dx - 44, GY - 14, 88, 14, C.logD, 1.8); rect(g, dx - 38, GY - 26, 76, 12, C.log, 1.8);
    rect(g, dx - 24, GY - 110, 48, 84, C.logD, 2); g.strokeStyle = C.ink; g.lineWidth = 1; g.beginPath(); for(let k = 1; k < 4; k++){ g.moveTo(dx - 24 + k * 12, GY - 108); g.lineTo(dx - 24 + k * 12, GY - 28); } g.stroke();
    circ(g, dx + 14, GY - 68, 2.5, C.gold, 1);
    rect(g, dx - 30, GY - 118, 60, 10, C.cream, 1.6);
    for(const px of [dx - 40, dx + 36]){ rect(g, px, GY - 116, 5, 92, C.logL, 1.4); }
    if(o.lit) glow(dx, GY - 60, 90, .7);
    if(o.number){ rect(g, dx + 34, GY - 150, 24, 22, C.blue, 1.6); g.fillStyle = C.cream; g.font = '700 15px "PT Serif", Georgia, serif'; g.textAlign = 'center'; g.fillText(o.number, dx + 46, GY - 133); g.textAlign = 'left'; }
  }
}
function fence(g, x0, x1, h = 52, col){
  rect(g, x0, GY - h * .72, x1 - x0, 5, C.logD, 1.5); rect(g, x0, GY - h * .3, x1 - x0, 5, C.logD, 1.5);
  for(let x = x0; x < x1; x += 14){ const hh = h + ((x * 7) % 7) - 3; shape(g, (x / 14) % 2 < 1 ? C.log : C.logL, () => { g.moveTo(x, GY); g.lineTo(x, GY - hh); g.lineTo(x + 5, GY - hh - 7); g.lineTo(x + 10, GY - hh); g.lineTo(x + 10, GY); g.closePath(); }, 1.5); }
}
function signpost(g, x, text, dir = 1){
  rect(g, x - 4, GY - 104, 8, 104, C.logD, 1.8);
  const w = 26 + text.length * 8.4, y = GY - 100;
  shape(g, C.cream, () => { if(dir > 0){ g.moveTo(x - 12, y); g.lineTo(x + w - 12, y); g.lineTo(x + w, y + 13); g.lineTo(x + w - 12, y + 26); g.lineTo(x - 12, y + 26); } else { g.moveTo(x + 12, y); g.lineTo(x + 12, y + 26); g.lineTo(x - w + 12, y + 26); g.lineTo(x - w, y + 13); g.lineTo(x - w + 12, y); } g.closePath(); }, 1.8);
  g.fillStyle = C.ink; g.font = '700 17px Caveat, cursive'; g.textAlign = dir > 0 ? 'left' : 'right'; g.fillText(text, dir > 0 ? x - 4 : x + 4, y + 19); g.textAlign = 'left';
}
function wellSweep(g, x){
  rect(g, x - 38, GY - 44, 76, 44, C.log, 2); g.strokeStyle = C.ink; g.lineWidth = 1; g.beginPath(); for(let y = GY - 34; y < GY; y += 11){ g.moveTo(x - 38, y); g.lineTo(x + 38, y); } g.stroke();
  rect(g, x - 42, GY - 50, 84, 8, C.logD, 1.8);
  rect(g, x + 70, GY - 160, 9, 160, C.logD, 1.8);
  const a = -.42 + Math.sin(T * .4) * .03; g.save(); g.translate(x + 74, GY - 156); g.rotate(a); rect(g, -155, -3.5, 250, 7, C.logL, 1.6); rect(g, 72, -12, 24, 22, C.greyL, 1.6); g.restore();
  const ex = x + 74 + Math.cos(a) * -150, ey = GY - 156 + Math.sin(a) * -150; g.strokeStyle = C.ink; g.lineWidth = 1.5; g.beginPath(); g.moveTo(ex, ey); g.lineTo(ex, GY - 64); g.stroke();
  shape(g, C.greyL, () => { g.moveTo(ex - 9, GY - 66); g.lineTo(ex + 9, GY - 66); g.lineTo(ex + 7, GY - 48); g.lineTo(ex - 7, GY - 48); g.closePath(); }, 1.6);
}
function bench(g, x){ rect(g, x - 44, GY - 30, 88, 8, C.logL, 1.8); rect(g, x - 38, GY - 22, 7, 22, C.logD, 1.4); rect(g, x + 31, GY - 22, 7, 22, C.logD, 1.4); }
function motorcycle(g, x){
  for(const wx of [x - 36, x + 38]){ circ(g, wx, GY - 20, 19, C.ink, 0); circ(g, wx, GY - 20, 13, C.greyL, 1.6); circ(g, wx, GY - 20, 3, C.ink, 0); }
  shape(g, C.cin, () => { g.moveTo(x - 36, GY - 22); g.lineTo(x - 14, GY - 50); g.quadraticCurveTo(x + 6, GY - 62, x + 26, GY - 50); g.lineTo(x + 38, GY - 22); g.lineTo(x + 10, GY - 26); g.closePath(); }, 2);
  shape(g, C.ink, () => { g.moveTo(x - 22, GY - 60); g.quadraticCurveTo(x - 4, GY - 68, x + 12, GY - 60); g.lineTo(x + 10, GY - 54); g.lineTo(x - 20, GY - 54); g.closePath(); }, 1.5);
  g.fillStyle = C.cream; g.font = 'italic 700 10px "PT Serif", Georgia, serif'; g.fillText('Ява', x - 2, GY - 36);
  g.strokeStyle = C.ink; g.lineWidth = 3; g.beginPath(); g.moveTo(x + 26, GY - 50); g.lineTo(x + 32, GY - 76); g.lineTo(x + 44, GY - 78); g.stroke();
}
function suitcase(g, x, y, col){ rect(g, x - 19, y - 32, 38, 32, col || C.brown, 1.8); g.fillStyle = C.ink; g.fillRect(x - 11, y - 32, 3, 32); g.fillRect(x + 8, y - 32, 3, 32); g.strokeStyle = C.ink; g.lineWidth = 3; g.beginPath(); g.arc(x, y - 34, 6, Math.PI, 0); g.stroke(); rect(g, x - 15, y - 26, 10, 7, C.cream, 1); }
function banya(g, x){
  const w = 130, h = 96;
  shape(g, C.roof, () => { g.moveTo(x - 16, GY - h + 2); g.lineTo(x + w * .45, GY - h - 50); g.lineTo(x + w + 16, GY - h + 2); g.closePath(); }, 2);
  hatch(g, () => { g.moveTo(x - 16, GY - h + 2); g.lineTo(x + w * .45, GY - h - 50); g.lineTo(x + w + 16, GY - h + 2); g.closePath(); }, x - 16, GY - h - 50, x + w + 16, GY - h, 8, C.roofD, 1.2, .5);
  rect(g, x + 96, GY - h - 36, 13, 30, '#9a4a32', 1.6);
  logWall(g, x, GY - h, w, h);
  rect(g, x + 48, GY - 74, 38, 74, C.logD, 2); g.strokeStyle = C.ink; g.lineWidth = 1; g.beginPath(); g.moveTo(x + 60, GY - 72); g.lineTo(x + 60, GY - 2); g.moveTo(x + 73, GY - 72); g.lineTo(x + 73, GY - 2); g.stroke();
  rect(g, x + 38, GY - 46, 58, 7, C.grey, 1.6); circ(g, x + 44, GY - 42.5, 2, C.ink, 0); circ(g, x + 90, GY - 42.5, 2, C.ink, 0);
}
function school(g, x){
  const w = 480, h = 214, top = GY - h;
  shape(g, C.roof, () => { g.moveTo(x - 20, top + 4); g.lineTo(x + 44, top - 60); g.lineTo(x + w - 44, top - 60); g.lineTo(x + w + 20, top + 4); g.closePath(); }, 2.2);
  hatch(g, () => { g.moveTo(x - 20, top + 4); g.lineTo(x + 44, top - 60); g.lineTo(x + w - 44, top - 60); g.lineTo(x + w + 20, top + 4); g.closePath(); }, x - 20, top - 60, x + w + 20, top + 4, 10, C.roofD, 1.2, Math.PI / 2);
  rect(g, x, top, w, h, '#8fae9c', 2.2);
  g.strokeStyle = 'rgba(28,22,17,.35)'; g.lineWidth = 1; g.beginPath(); for(let y = top + 10; y < GY; y += 10){ g.moveTo(x, y); g.lineTo(x + w, y); } g.stroke();
  rect(g, x, top + h * .5 - 4, w, 8, C.cream, 1.6);
  for(let f = 0; f < 2; f++) for(let i = 0; i < 7; i++){ const wx = x + 28 + i * 64, wy = top + 24 + f * 106; if(f === 1 && i === 5) continue;
    rect(g, wx - 6, wy - 6, 42, 62, C.cream, 1.6); const broken = f === 1 && i === 2; rect(g, wx, wy, 30, 50, broken ? C.ink : C.glass, 1.4);
    if(!broken){ g.strokeStyle = C.ink; g.lineWidth = 1.6; g.beginPath(); g.moveTo(wx + 15, wy); g.lineTo(wx + 15, wy + 50); g.moveTo(wx, wy + 20); g.lineTo(wx + 30, wy + 20); g.stroke(); }
    else { g.strokeStyle = C.greyL; g.lineWidth = 1.2; g.beginPath(); g.moveTo(wx + 2, wy + 4); g.lineTo(wx + 12, wy + 18); g.lineTo(wx + 6, wy + 30); g.stroke(); } }
  rect(g, x + 328, GY - 96, 54, 96, C.logD, 2); rect(g, x + 316, GY - 104, 78, 10, C.cream, 1.6);
  rect(g, x + 298, top + 112, 116, 22, C.cin, 1.8); g.fillStyle = C.cream; g.font = '700 11.5px "PT Serif", Georgia, serif'; g.textAlign = 'center'; g.fillText('ЗАВЕТЬЕВСКАЯ ШКОЛА', x + 356, top + 127); g.textAlign = 'left';
  rect(g, x + 348, GY - 58, 12, 14, C.gold, 1.4);
}
function laundry(g, x0, x1){
  rect(g, x0, GY - 124, 6, 124, C.logD, 1.6); rect(g, x1, GY - 124, 6, 124, C.logD, 1.6);
  g.strokeStyle = C.ink; g.lineWidth = 1.3; g.beginPath(); g.moveTo(x0 + 3, GY - 118); g.quadraticCurveTo((x0 + x1) / 2, GY - 104, x1 + 3, GY - 118); g.stroke();
  for(const [t, sw, sh, col] of [[.22, 36, 58, C.white], [.52, 42, 66, C.cream], [.8, 24, 38, C.blueL]]){
    const sx = x0 + (x1 - x0) * t, sy = GY - 114 + Math.sin(t * Math.PI) * 9, wv = Math.sin(T * 1.6 + t * 9) * 4;
    shape(g, col, () => { g.moveTo(sx - sw / 2, sy); g.lineTo(sx + sw / 2, sy); g.lineTo(sx + sw / 2 + wv, sy + sh); g.quadraticCurveTo(sx, sy + sh + wv * .6, sx - sw / 2 + wv, sy + sh); g.closePath(); }, 1.5);
    g.strokeStyle = C.cin; g.lineWidth = 2; g.beginPath(); g.moveTo(sx - sw / 2 + wv * .9, sy + sh - 6); g.lineTo(sx + sw / 2 + wv * .9, sy + sh - 6); g.stroke();
  }
}
function appleTree(g, x, swingA){
  shape(g, C.bark, () => { g.moveTo(x - 12, GY); g.quadraticCurveTo(x - 6, GY - 100, x - 14, GY - 190); g.lineTo(x + 8, GY - 190); g.quadraticCurveTo(x + 4, GY - 100, x + 12, GY); g.closePath(); }, 2);
  shape(g, C.bark, () => { g.moveTo(x, GY - 150); g.quadraticCurveTo(x + 40, GY - 176, x + 96, GY - 170); g.lineTo(x + 96, GY - 162); g.quadraticCurveTo(x + 40, GY - 166, x + 2, GY - 136); g.closePath(); }, 1.8);
  const r = rng(31); const blobs = [[-40, -222, 46], [10, -240, 52], [58, -218, 44], [-10, -196, 40], [44, -196, 40], [90, -200, 30]];
  for(const [bx, by, br] of blobs) circ(g, x + bx, GY + by, br, C.green, 2);
  for(const [bx, by, br] of blobs){ g.strokeStyle = C.greenD; g.lineWidth = 1.2; g.beginPath(); g.arc(x + bx - br * .2, GY + by + br * .2, br * .55, Math.PI * .2, Math.PI * .9); g.stroke(); }
  for(let i = 0; i < 14; i++) circ(g, x - 70 + r() * 170, GY - 250 + r() * 80, 4.5, C.cin, 1.2);
  const px = x + 76, py = GY - 166, len = 120; const ex = px + Math.sin(swingA) * len, ey = py + Math.cos(swingA) * len;
  g.strokeStyle = C.ink; g.lineWidth = 1.8; g.beginPath(); g.moveTo(px - 8, py); g.lineTo(ex - 11, ey); g.moveTo(px + 8, py); g.lineTo(ex + 11, ey); g.stroke();
  shape(g, C.ink, () => g.ellipse(ex, ey + 4, 20, 7, 0, 0, Math.PI * 2), 0); shape(g, C.grey, () => g.ellipse(ex, ey + 4, 11, 3, 0, 0, Math.PI * 2), 1);
  return [ex, ey];
}
function busStop(g, x, kind){
  const col = kind === 'rust' ? '#9a5a36' : C.blue;
  rect(g, x, GY - 122, 7, 122, col, 1.6); rect(g, x + 112, GY - 122, 7, 122, col, 1.6);
  shape(g, kind === 'rust' ? '#8a4a2a' : C.cin, () => { g.moveTo(x - 14, GY - 122); g.lineTo(x + 133, GY - 122); g.lineTo(x + 124, GY - 136); g.lineTo(x - 5, GY - 136); g.closePath(); }, 2);
  rect(g, x + 10, GY - 44, 99, 7, C.logL, 1.5); rect(g, x + 16, GY - 37, 5, 37, C.logD, 1.2); rect(g, x + 98, GY - 37, 5, 37, C.logD, 1.2);
  if(kind !== 'rust'){ rect(g, x + 152, GY - 156, 5, 156, C.grey, 1.4); circ(g, x + 154, GY - 162, 15, kind === 'new' ? C.cin : C.gold, 1.8); g.fillStyle = C.cream; g.font = '700 14px "PT Serif", Georgia, serif'; g.textAlign = 'center'; g.fillText('А', x + 154, GY - 157); g.textAlign = 'left';
    rect(g, x + 140, GY - 136, 28, 32, C.cream, 1.4); g.strokeStyle = C.ink; g.lineWidth = .8; g.beginPath(); for(let i = 0; i < 4; i++){ g.moveTo(x + 144, GY - 128 + i * 6); g.lineTo(x + 164, GY - 128 + i * 6); } g.stroke(); }
}
function bus(g, x){
  const w = 270, h = 124, y = GY - 20;
  shape(g, C.cream, () => { g.moveTo(x, y); g.lineTo(x, y - h + 18); g.quadraticCurveTo(x, y - h, x + 18, y - h); g.lineTo(x + w - 26, y - h); g.quadraticCurveTo(x + w, y - h, x + w, y - h + 34); g.lineTo(x + w, y); g.closePath(); }, 2.4);
  rect(g, x, y - 52, w, 16, C.cin, 2);
  for(let i = 0; i < 5; i++){ const lit = V && V.phase >= 2; rect(g, x + 14 + i * 48, y - h + 18, 40, 36, lit ? '#f7cf6a' : C.glass, 1.6); if(lit) glow(x + 34 + i * 48, y - h + 36, 50, .6); }
  for(const wx of [x + 54, x + w - 54]){ circ(g, wx, y + 2, 19, C.ink, 0); circ(g, wx, y + 2, 10, C.greyL, 1.6); }
  rect(g, x + 2, y - 30, 7, 11, '#ff5a3c', 1); rect(g, x + w - 9, y - 32, 7, 12, '#fff0b8', 1);
  glow(x + w, y - 26, 200, .9); glow(x, y - 25, 70, .7, '255,90,60');
}
function stump(g, x){ shape(g, C.bark, () => { g.moveTo(x - 28, GY); g.lineTo(x - 22, GY - 36); g.lineTo(x + 22, GY - 36); g.lineTo(x + 28, GY); g.closePath(); }, 2); shape(g, C.logL, () => g.ellipse(x, GY - 36, 22, 6, 0, 0, Math.PI * 2), 1.8); g.beginPath(); g.ellipse(x, GY - 36, 11, 3, 0, 0, Math.PI * 2); ol(g, 1); }
function scarecrow(g, x){
  rect(g, x - 4, GY - 170, 8, 170, C.logD, 1.6); rect(g, x - 52, GY - 138, 104, 7, C.logD, 1.6);
  shape(g, C.cin, () => { g.moveTo(x - 32, GY - 140); g.lineTo(x + 32, GY - 140); g.lineTo(x + 24, GY - 74); g.lineTo(x - 24, GY - 74); g.closePath(); }, 2);
  for(let i = 0; i < 4; i++) circ(g, x - 14 + i * 9, GY - 110 + (i % 2) * 12, 2.4, C.cream, .8);
  circ(g, x, GY - 154, 14, C.cream, 1.8); circ(g, x + 5, GY - 156, 1.8, C.ink, 0); circ(g, x - 3, GY - 156, 1.8, C.ink, 0);
  shape(g, C.ochre, () => { g.moveTo(x - 26, GY - 160); g.lineTo(x + 26, GY - 160); g.lineTo(x, GY - 186); g.closePath(); }, 1.8);
}
function windmill(g, x, y, s = 1){
  shape(g, C.logL, () => { g.moveTo(x - 16 * s, y); g.lineTo(x - 10 * s, y - 58 * s); g.lineTo(x + 10 * s, y - 58 * s); g.lineTo(x + 16 * s, y); g.closePath(); }, 1.5);
  shape(g, C.roof, () => { g.moveTo(x - 14 * s, y - 56 * s); g.lineTo(x, y - 72 * s); g.lineTo(x + 14 * s, y - 56 * s); g.closePath(); }, 1.5);
  g.save(); g.translate(x, y - 60 * s); g.rotate(T * .15); for(let i = 0; i < 4; i++){ g.rotate(Math.PI / 2); rect(g, -1.5 * s, 0, 3 * s, 46 * s, C.logD, 1); rect(g, 2 * s, 12 * s, 9 * s, 32 * s, C.cream, 1); } g.restore();
}

/* ---------- люди и нелюди ---------- */
const LOOKS = {
  anna:  { h:120, coat:'indigo', coatLen:.78, legs:'ink', boots:'brown', skin:'skin', hair:'hair', hairStyle:'bun', scarf:true },
  grisha:{ h:126, coat:'olive', coatLen:.35, legs:'indigo', boots:'ink', skin:'skin', hair:'hair', cap:true },
  grunya:{ h:102, coat:'brown', coatLen:.97, legs:'brown', boots:'ink', skin:'skin', headscarf:'cin', apron:true, stoop:.12 },
  nina:  { h:112, coat:'grey', coatLen:.9, legs:'ink', boots:'ink', skin:'skin', hair:'greyL', hairStyle:'bun' },
  varya: { h:84,  coat:'yellow', coatLen:.62, legs:'blue', boots:'green', skin:'skin', hair:'hairL', hairStyle:'braids' },
  young: { h:122, coat:'denim', coatLen:.35, legs:'indigo', boots:'ink', skin:'skin', hair:'hair', headphones:true },
  leshy: { h:176, coat:'greenD', coatLen:.95, legs:'bark', boots:'bark', skin:'#c9b48a', hair:'olive', beard:true, eyes:'#d8f07a' },
  noon:  { h:238, coat:'white', coatLen:1.02, legs:'white', boots:'white', skin:'#fbf1dc', hair:'#f4e2a8', hairStyle:'long', hem:true, pale:true },
};
const col = k => (k && k[0] === '#') ? k : (C[k] || k);
function figure(g, x, L, o = {}){
  const h = L.h, U = h / 120, f = o.face || 1, mv = o.move ? 1 : 0, ph = o.ph || 0;
  const sw = Math.sin(ph) * .55 * mv, bob = mv ? Math.abs(Math.sin(ph)) * 2.4 : Math.sin(T * 1.5 + x * .01) * .7;
  if(!o.noShadow){ g.fillStyle = 'rgba(28,22,17,.25)'; g.beginPath(); g.ellipse(x, GY + 3, 22 * U, 4.5, 0, 0, Math.PI * 2); g.fill(); }
  g.save(); g.translate(x, GY - bob); g.scale(f, 1);
  const hip = -56 * U, sh = -95 * U, hy = -107 * U, lw = 2;
  const coatC = col(L.coat), legC = col(L.legs), bootC = col(L.boots), skin = col(L.skin);
  if(o.sit){
    limb(g, [[-2 * U, -40 * U], [20 * U, -40 * U], [22 * U, -4 * U]], 9 * U, legC); shape(g, bootC, () => g.ellipse(26 * U, -3 * U, 8 * U, 4 * U, 0, 0, Math.PI * 2), 1.5);
    shape(g, coatC, () => { g.moveTo(-13 * U, -34 * U); g.lineTo(-12 * U, sh + 3 * U); g.quadraticCurveTo(0, sh - 4 * U, 11 * U, sh + 3 * U); g.lineTo(13 * U, -34 * U); g.closePath(); }, lw);
    limb(g, [[4 * U, sh + 6 * U], [14 * U, -58 * U], [22 * U, -46 * U]], 7 * U, coatC); circ(g, 23 * U, -45 * U, 3.6 * U, skin, 1.4);
    head(g, U, hy + 2 * U, L, skin);
    if(L.headphones){ g.strokeStyle = C.ink; g.lineWidth = 3; g.beginPath(); g.arc(0, hy + 2 * U, 13 * U, Math.PI * 1.05, Math.PI * 1.95); g.stroke(); shape(g, C.cin, () => g.ellipse(-2 * U, hy + 6 * U, 4 * U, 6 * U, 0, 0, Math.PI * 2), 1.4); }
    g.restore(); return;
  }
  const legAt = s => { const a = sw * s, kx = Math.sin(a) * 23 * U, ky = hip + Math.cos(a) * 23 * U, lift = mv ? Math.max(0, -Math.sin(ph * s)) * 4 * U : 0; return [[0, hip], [kx, ky], [kx + Math.sin(a * .3) * 25 * U, -3 * U - lift]]; };
  const armAt = (s, up) => { const a = up ? -2.3 : o.work ? -.9 - Math.sin(T * 5) * .15 : -sw * s * .9; const ex = Math.sin(a) * 19 * U, ey = sh + 5 * U + Math.cos(a) * 19 * U; return [[2 * U, sh + 5 * U], [ex, ey], [ex + Math.sin(a * .6 + (o.work ? .8 : 0)) * 17 * U, ey + Math.cos(a * .6) * 17 * U]]; };
  // дальние конечности
  const bl = legAt(-1); if(!L.pale){ limb(g, bl, 8.5 * U, legC); } if(!L.pale) shape(g, bootC, () => g.ellipse(bl[2][0] + 4 * U, bl[2][1], 8 * U, 4.2 * U, 0, 0, Math.PI * 2), 1.5);
  const ba = armAt(-1, o.armsUp); limb(g, ba, 7 * U, coatC); circ(g, ba[2][0], ba[2][1], 3.6 * U, skin, 1.4);
  // тело
  const hem = hip + (L.coatLen) * 58 * U, fl = (L.coatLen > .6 ? 6 + Math.sin(ph) * 2 * mv : 2) * U;
  g.save();
  shape(g, coatC, () => { g.moveTo(-12 * U, sh + 3 * U); g.quadraticCurveTo(-15 * U, sh + 18 * U, -13 * U - fl * .4, hip); g.lineTo(-15 * U - fl, hem); g.quadraticCurveTo(0, hem + 3 * U, 15 * U + fl, hem); g.lineTo(13 * U + fl * .4, hip); g.quadraticCurveTo(15 * U, sh + 18 * U, 12 * U, sh + 3 * U); g.quadraticCurveTo(0, sh - 5 * U, -12 * U, sh + 3 * U); g.closePath(); }, lw);
  if(L.coatLen > .5 && !L.apron){ g.beginPath(); g.moveTo(6 * U, sh + 2 * U); g.lineTo(8 * U + fl * .5, hem); ol(g, 1.1); for(let i = 0; i < 3; i++) circ(g, 4 * U, sh + (12 + i * 12) * U, 1.4 * U, C.ink, 0); }
  if(L.hem || L.apron){ for(let i = -4; i <= 4; i++){ const hx = i * 3.6 * U; shape(g, C.cin, () => { g.moveTo(hx - 1.8 * U, hem - 1); g.lineTo(hx, hem - 6 * U); g.lineTo(hx + 1.8 * U, hem - 1); g.closePath(); }, .8); } }
  if(L.apron){ shape(g, C.white, () => { g.moveTo(3 * U, hip - 10 * U); g.lineTo(15 * U + fl * .4, hip - 8 * U); g.lineTo(16 * U + fl, hem - 8 * U); g.lineTo(5 * U, hem - 6 * U); g.closePath(); }, 1.4); g.strokeStyle = C.cin; g.lineWidth = 2; g.beginPath(); g.moveTo(5 * U, hem - 11 * U); g.lineTo(16 * U + fl, hem - 12 * U); g.stroke(); }
  g.restore();
  if(L.coatLen < .96){ const fl2 = legAt(1); limb(g, fl2, 8.5 * U, legC); shape(g, bootC, () => g.ellipse(fl2[2][0] + 4 * U, fl2[2][1], 8 * U, 4.2 * U, 0, 0, Math.PI * 2), 1.5); }
  else if(!L.pale){ const fl2 = legAt(1); shape(g, bootC, () => g.ellipse(fl2[2][0] + 4 * U, -3 * U, 7 * U, 3.8 * U, 0, 0, Math.PI * 2), 1.5); }
  if(o.carry){ const hx = 14 * U, hyy = -44 * U; suitcase(g, hx + 4 * U, -8 * U, C.brown); limb(g, [[2 * U, sh + 5 * U], [8 * U, -64 * U], [hx, hyy]], 7 * U, coatC); circ(g, hx, hyy, 3.6 * U, skin, 1.4); }
  else { const fa = armAt(1, o.armsUp); limb(g, fa, 7 * U, coatC); circ(g, fa[2][0], fa[2][1], 3.6 * U, skin, 1.4); if(o.sickle){ g.strokeStyle = C.ink; g.lineWidth = 5; g.beginPath(); g.moveTo(fa[2][0], fa[2][1]); g.lineTo(fa[2][0] + 4 * U, fa[2][1] - 40 * U); g.stroke(); g.strokeStyle = C.gold; g.lineWidth = 2.5; g.stroke(); g.beginPath(); g.arc(fa[2][0] - 12 * U, fa[2][1] - 40 * U, 17 * U, Math.PI * 1.9, Math.PI * .95, true); g.strokeStyle = C.ink; g.lineWidth = 6; g.stroke(); g.strokeStyle = C.gold; g.lineWidth = 3; g.stroke(); } }
  if(L.scarf){ const silSave = SIL; SIL = null; const wv = Math.sin(T * 3 + ph) * 2.5, tl = mv ? 1.5 : .7;
    shape(g, C.cin, () => { g.moveTo(-4 * U, sh); g.quadraticCurveTo(-18 * U * tl, sh + 8 * U + wv, -26 * U * tl, sh + 26 * U - wv); g.lineTo(-19 * U * tl, sh + 28 * U + wv); g.quadraticCurveTo(-11 * U, sh + 14 * U, 0, sh + 5 * U); g.closePath(); }, 1.6);
    shape(g, C.cin, () => g.ellipse(0, sh - 1 * U, 10.5 * U, 5 * U, 0, 0, Math.PI * 2), 1.6); g.strokeStyle = C.cream; g.lineWidth = 1.4; g.beginPath(); g.moveTo(-9 * U, sh - 1 * U); g.lineTo(9 * U, sh - 1 * U); g.stroke(); SIL = silSave; }
  head(g, U, hy, L, skin, o);
  g.restore();
}
function head(g, U, hy, L, skin, o = {}){
  if(L.hairStyle === 'long'){ const wv = Math.sin(T * 1.2) * 6; shape(g, col(L.hair), () => { g.moveTo(-8 * U, hy - 10 * U); g.bezierCurveTo(-24 * U, hy + 10 * U, -22 * U + wv, hy + 60 * U, -34 * U + wv, hy + 110 * U); g.lineTo(-14 * U + wv, hy + 100 * U); g.bezierCurveTo(-10 * U, hy + 50 * U, 2 * U, hy + 10 * U, 4 * U, hy - 10 * U); g.closePath(); }, 1.6); }
  if(L.hairStyle === 'braids'){ for(const s of [0, 1]){ limb(g, [[-7 * U + s * 3, hy + 2 * U], [-11 * U + s * 3, hy + 14 * U], [-9 * U + s * 3, hy + 24 * U]], 3.2 * U, col(L.hair)); } }
  shape(g, skin, () => { g.ellipse(0, hy, 10 * U, 11 * U, 0, 0, Math.PI * 2); }, 2);
  shape(g, skin, () => { g.moveTo(8.5 * U, hy - 3 * U); g.quadraticCurveTo(13.5 * U, hy + 1 * U, 9 * U, hy + 3 * U); }, 1.4);
  if(L.pale){ } else { g.fillStyle = 'rgba(226,120,95,.55)'; g.beginPath(); g.arc(4.5 * U, hy + 4 * U, 2.8 * U, 0, Math.PI * 2); g.fill(); }
  const blink = (T + (L.h || 0)) % 4.2 < .12;
  if(L.eyes){ g.fillStyle = L.eyes; g.beginPath(); g.arc(5 * U, hy - 2 * U, 1.8 * U, 0, Math.PI * 2); g.fill(); }
  else if(!blink){ g.fillStyle = C.ink; g.beginPath(); g.arc(5 * U, hy - 2 * U, 1.3 * U, 0, Math.PI * 2); g.fill(); }
  else { g.strokeStyle = C.ink; g.lineWidth = 1.2; g.beginPath(); g.moveTo(3.6 * U, hy - 2 * U); g.lineTo(6.4 * U, hy - 2 * U); g.stroke(); }
  g.strokeStyle = C.ink; g.lineWidth = 1.2; g.beginPath(); g.moveTo(2.6 * U, hy - 5.3 * U); g.quadraticCurveTo(5 * U, hy - 6.4 * U, 7.4 * U, hy - 5.1 * U); g.moveTo(5 * U, hy + 7 * U); g.lineTo(7.6 * U, hy + 6.6 * U); g.stroke();
  if(L.headscarf){ shape(g, col(L.headscarf), () => { g.moveTo(9 * U, hy - 4 * U); g.quadraticCurveTo(8 * U, hy - 15 * U, -2 * U, hy - 13 * U); g.quadraticCurveTo(-13 * U, hy - 10 * U, -12 * U, hy + 2 * U); g.lineTo(-20 * U, hy + 18 * U); g.lineTo(-4 * U, hy + 10 * U); g.lineTo(3 * U, hy + 11 * U); g.quadraticCurveTo(-2 * U, hy + 2 * U, -3 * U, hy - 5 * U); g.quadraticCurveTo(3 * U, hy - 8 * U, 9 * U, hy - 4 * U); g.closePath(); }, 1.6);
    for(let i = 0; i < 7; i++) circ(g, -12 * U + (i % 4) * 5 * U, hy - 9 * U + Math.floor(i / 4) * 8 * U + (i % 2) * 2 * U, 1.2 * U, C.white, 0);
    shape(g, col(L.headscarf), () => g.ellipse(2 * U, hy + 11 * U, 3 * U, 2 * U, 0, 0, Math.PI * 2), 1.2); return; }
  if(L.hair && L.hairStyle !== 'long'){ shape(g, col(L.hair), () => { g.moveTo(8 * U, hy - 7 * U); g.quadraticCurveTo(4 * U, hy - 13 * U, -3 * U, hy - 12 * U); g.quadraticCurveTo(-12 * U, hy - 10 * U, -10.5 * U, hy + 4 * U); g.lineTo(-6 * U, hy + 6 * U); g.quadraticCurveTo(-6 * U, hy - 4 * U, 0, hy - 7 * U); g.quadraticCurveTo(4 * U, hy - 8 * U, 8 * U, hy - 7 * U); g.closePath(); }, 1.6); }
  if(L.hairStyle === 'long'){ shape(g, col(L.hair), () => { g.moveTo(9 * U, hy - 6 * U); g.quadraticCurveTo(2 * U, hy - 15 * U, -8 * U, hy - 10 * U); g.quadraticCurveTo(-12 * U, hy, -9 * U, hy + 10 * U); g.lineTo(-4 * U, hy - 2 * U); g.quadraticCurveTo(2 * U, hy - 8 * U, 9 * U, hy - 6 * U); }, 1.4); shape(g, C.cin, () => { g.rect(-9 * U, hy - 11 * U, 19 * U, 3 * U); }, 1); }
  if(L.hairStyle === 'bun') circ(g, -9 * U, hy - 9 * U, 5.5 * U, col(L.hair), 1.6);
  if(L.cap){ shape(g, C.brown, () => { g.moveTo(-10 * U, hy - 5 * U); g.quadraticCurveTo(-8 * U, hy - 16 * U, 3 * U, hy - 14 * U); g.quadraticCurveTo(10 * U, hy - 12 * U, 10 * U, hy - 7 * U); g.lineTo(17 * U, hy - 6 * U); g.lineTo(16 * U, hy - 3.5 * U); g.lineTo(-10 * U, hy - 4 * U); g.closePath(); }, 1.6); }
  if(L.beard){ shape(g, col(L.hair), () => { g.moveTo(9 * U, hy + 2 * U); g.lineTo(12 * U, hy + 16 * U); g.lineTo(6 * U, hy + 28 * U); g.lineTo(0, hy + 20 * U); g.lineTo(-6 * U, hy + 30 * U); g.lineTo(-7 * U, hy + 8 * U); g.closePath(); }, 1.6); g.strokeStyle = C.ink; g.lineWidth = 1; g.beginPath(); for(let i = 0; i < 4; i++){ g.moveTo(-3 * U + i * 3 * U, hy + 8 * U); g.lineTo(-4 * U + i * 3 * U, hy + 22 * U); } g.stroke(); }
}
function annaDraw(g, x, dir, move, ph){ if(typeof annaRigReady === 'function' && annaRigReady() && !IMG.s_anna_1) return drawAnnaRig(g, x, 124, dir, ph, move, typeof keys !== 'undefined' && keys.run); const sp = typeof spriteFor === 'function' && spriteFor('anna', ph, move); if(sp) return drawSprite(g, sp, x, 124, dir, move ? Math.abs(Math.sin(ph)) * 2 : 0); figure(g, x, LOOKS.anna, { face:dir, move, ph }); }
function drawNpc(g, n){
  const sp = typeof spriteFor === 'function' && spriteFor(n.id, 0, false);
  if(sp && n.id === 'domovoi'){   // Домовой у печи: в тени, видны космы и янтарные глаза
    const H = 46, w = sp.width / sp.height * H, x = n.x;
    g.save(); g.filter = SIL ? 'brightness(.86)' : 'none'; g.translate(x, GY); g.scale(-1, 1); g.drawImage(sp, -w / 2, -H, w, H); g.restore(); g.filter = 'none';
    if((T % 4.3) < 4.05){ const ex = x - (.74 - .5) * w, ey = GY - H + .168 * H; g.save(); g.globalCompositeOperation = 'lighter'; const gr = g.createRadialGradient(ex, ey, 0, ex, ey, 6); gr.addColorStop(0, 'rgba(255,190,80,.7)'); gr.addColorStop(1, 'rgba(255,190,80,0)'); g.fillStyle = gr; g.fillRect(ex - 6, ey - 6, 12, 12); g.restore(); glow(ex, ey, 26, .5); }
    return; }
  if(sp){ const H = { grisha:136, grunya:110, nina:116, varya:110, young:102, leshy:176, noon:238, domovoi:44 }[n.id] || 120; if(n.id === 'noon') glow(n.x, GY - 140, 300, 1, '255,248,220'); drawSprite(g, sp, n.x, H, n.id === 'grisha' && n.pose === 'suitcase' ? 1 : -1); return; }
  switch(n.id){
    case 'grisha': if(n.pose === 'suitcase') figure(g, n.x, LOOKS.grisha, { face:1, carry:true }); else figure(g, n.x, LOOKS.grisha, { face:-1, stoop:.3, work:true }); break;
    case 'nina': figure(g, n.x, LOOKS.nina, { face:-1, armsUp: Math.sin(T * .5) > .3 }); break;
    case 'grunya': figure(g, n.x, LOOKS.grunya, { face:-1 }); break;
    case 'young': figure(g, n.x, LOOKS.young, { face:-1, sit:true }); suitcase(g, n.x - 40, GY, C.brown); break;
    case 'leshy': if(SIL){ const sv = SIL; SIL = 'rgba(18,28,16,.88)'; g.save(); g.translate(0, -30); figure(g, n.x, LOOKS.leshy, { face:1, sit:true, noShadow:true }); g.restore(); SIL = null; for(const ex of [-4, 5]){ g.fillStyle = 'rgba(190,240,110,.95)'; g.beginPath(); g.arc(n.x + 8 + ex, GY - 30 - 176 * .89 + 2, 1.8, 0, Math.PI * 2); g.fill(); } SIL = sv; glow(n.x + 8, GY - 30 - 176 * .89, 26, .9, '190,240,110'); break; } stump(g, n.x); g.save(); g.translate(0, -30); figure(g, n.x, LOOKS.leshy, { face:1, sit:true, noShadow:true }); g.restore(); glow(n.x + 8, GY - 30 - 176 * .89, 18, .9, '210,240,120'); break;
    case 'noon': { const x = n.x + Math.sin(T * .8) * 5; glow(x, GY - 140, 300, 1, '255,248,220');
      if(SIL){ // на живописи — сияющий белый призрак, а не тень
        g.save(); g.translate(x, GY); g.scale(.8, .8); g.translate(-x, -GY); // герои на улице стали крупнее — Полудница остаётся прежнего роста
        const sv = SIL; g.save(); g.globalAlpha = .42 + Math.sin(T * 2.3) * .07; SIL = 'rgba(255,250,236,1)'; figure(g, x, LOOKS.noon, { face:-1, noShadow:true, sickle:true });
        g.globalAlpha = .25; g.translate(x, 0); g.scale(1.06, 1.02); g.translate(-x, 0); figure(g, x, LOOKS.noon, { face:-1, noShadow:true, sickle:true }); g.restore(); SIL = sv;
        const gr = g.createRadialGradient(x, GY - 120, 10, x, GY - 120, 170); gr.addColorStop(0, 'rgba(255,252,235,.35)'); gr.addColorStop(1, 'rgba(255,252,235,0)'); g.fillStyle = gr; g.fillRect(x - 170, GY - 290, 340, 340); g.restore(); break; }
      g.save(); g.globalAlpha = .93; figure(g, x, LOOKS.noon, { face:-1, noShadow:true, sickle:true }); g.restore(); break; }
    case 'domovoi': { const x = n.x;
      if(SIL){ // на живописи — только косматая тень у печи и два янтарных глаза
        const gr = g.createRadialGradient(x, GY - 18, 4, x, GY - 18, 34); gr.addColorStop(0, 'rgba(12,8,6,.85)'); gr.addColorStop(1, 'rgba(12,8,6,0)'); g.fillStyle = gr; g.fillRect(x - 40, GY - 56, 80, 60);
        if((T % 4.3) < 4.05){ const sv = SIL; SIL = null; for(const ex of [-6, 6]){ g.fillStyle = '#ffc24a'; g.beginPath(); g.ellipse(x + ex, GY - 26, 2.4, 1.6 + Math.sin(T * 3) * .3, 0, 0, Math.PI * 2); g.fill(); } SIL = sv; glow(x, GY - 26, 34, .8); } break; }
      shape(g, C.brown, () => { g.moveTo(x - 20, GY); g.quadraticCurveTo(x - 24, GY - 30, x, GY - 38); g.quadraticCurveTo(x + 24, GY - 30, x + 20, GY); g.closePath(); }, 2);
      shape(g, C.greyL, () => { g.moveTo(x - 12, GY - 22); g.lineTo(x, GY - 2); g.lineTo(x + 12, GY - 22); g.closePath(); }, 1.5);
      const bl = (T % 4) < 3.8; if(bl){ circ(g, x - 6, GY - 26, 2.8, '#ffcc55', 1); circ(g, x + 6, GY - 26, 2.8, '#ffcc55', 1); glow(x, GY - 26, 40, .7); } break; }
  }
}

/* ---------- параллакс (плитки кешируются) ---------- */
const TILE_W = 1600, tiles = {};
function tile(kind, ph, s){
  const key = kind + ph + ':' + Math.round(s * 100);
  if(tiles[key]) return tiles[key];
  const W = Math.ceil(TILE_W * s), H = Math.ceil(VH * s);
  const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'); g.scale(s, s);
  const saved = C; C = palette(ph); const r = rng(hashStr(kind));
  const rep = (x, w, fn) => { fn(x); if(x - w < 0) fn(x + TILE_W); if(x + w > TILE_W) fn(x - TILE_W); };
  const hillY = x => 312 + Math.sin(x / TILE_W * Math.PI * 4) * 16 + Math.sin(x / TILE_W * Math.PI * 10) * 6;
  switch(kind){
    case 'hills': {
      const far = mix(BASE.greenL, SKY[ph][SKY[ph].length - 1], .45);
      shape(g, ph === 3 ? C.greenD : far, () => { g.moveTo(-5, VH); for(let x = -5; x <= TILE_W + 5; x += 10) g.lineTo(x, hillY(x)); g.lineTo(TILE_W + 5, VH); g.closePath(); }, 1.8);
      g.strokeStyle = 'rgba(28,22,17,.35)'; g.lineWidth = 1; g.beginPath(); for(let k = 1; k < 5; k++){ for(let x = 0; x <= TILE_W; x += 10){ const y = hillY(x) + k * 14; x ? g.lineTo(x, y) : g.moveTo(x, y); } } g.stroke();
      for(let x = 20; x < TILE_W; x += 26 + r() * 40){ const y = hillY(x); rep(x, 20, xx => spruce(g, xx, y + 4, 22 + r() * 16, C.spruceL, C.spruce, 1.2)); }
      break; }
    case 'forest': {
      for(let x = 0; x < TILE_W; x += 22 + r() * 22){ const hh = 90 + r() * 80; rep(x, 40, xx => spruce(g, xx, 392 + r() * 6, hh, r() < .5 ? C.spruce : C.spruceL, C.spruceD, 1.6)); }
      shape(g, C.spruce, () => g.rect(-5, 390, TILE_W + 10, VH), 0);
      g.strokeStyle = C.ink; g.lineWidth = 1.6; g.beginPath(); g.moveTo(0, 390); g.lineTo(TILE_W, 390); g.stroke();
      break; }
    case 'village_back': {
      for(let x = 0; x < TILE_W; x += 110 + r() * 140){
        if(r() < .6){ const w = 70 + r() * 40, hh = 40 + r() * 16, lit = r() < .6; rep(x, w, xx => {
          shape(g, C.roof, () => { g.moveTo(xx - 8, 404 - hh); g.lineTo(xx + w / 2, 404 - hh - hh * .75); g.lineTo(xx + w + 8, 404 - hh); g.closePath(); }, 1.4);
          rect(g, xx, 404 - hh, w, hh, C.log, 1.4); for(const wx of [.25, .6]) rect(g, xx + w * wx, 404 - hh * .72, 10, 12, (lit && ph >= 2) ? '#ffd35a' : C.glass, 1); }); }
        else { const hh = 50 + r() * 40; rep(x, 30, xx => spruce(g, xx, 410, hh, C.spruceL, C.spruce, 1.3)); }
      }
      shape(g, C.grass, () => g.rect(-5, 402, TILE_W + 10, VH), 1.4);
      break; }
    case 'field_back': {
      for(let x = 0; x < TILE_W; x += 18 + r() * 20) rep(x, 20, xx => spruce(g, xx, 392, 34 + r() * 30, C.spruceL, C.spruce, 1.3));
      shape(g, mix(BASE.rye, SKY[ph][SKY[ph].length - 1], .3), () => g.rect(-5, 388, TILE_W + 10, VH), 1.4);
      for(let i = 0; i < 4; i++){ const x = 150 + i * 380 + r() * 120; rep(x, 30, xx => { shape(g, C.ochre, () => { g.moveTo(xx - 26, 392); g.quadraticCurveTo(xx, 332, xx + 26, 392); g.closePath(); }, 1.4); g.strokeStyle = C.ink; g.lineWidth = .9; g.beginPath(); for(let k = -2; k <= 2; k++){ g.moveTo(xx + k * 8, 388); g.lineTo(xx + k * 5, 352); } g.stroke(); }); }
      break; }
    case 'poles': {
      for(let x = 100; x < TILE_W; x += 400){ rect(g, x - 3.5, 246, 7, 188, C.logD, 1.4); rect(g, x - 26, 258, 52, 5, C.logD, 1.2); rect(g, x - 20, 272, 40, 4, C.logD, 1.2); for(const dx of [-22, -8, 8, 22]) circ(g, x + dx, 256, 2.4, C.cream, .8); }
      g.strokeStyle = C.ink; g.lineWidth = 1; for(const dy of [258, 272]) for(let x = 100 - 400; x < TILE_W + 400; x += 400){ g.beginPath(); g.moveTo(x - 22, dy); g.quadraticCurveTo(x + 180, dy + 26, x + 378, dy); g.stroke(); }
      break; }
    case 'deep': {
      for(let x = 0; x < TILE_W; x += 26 + r() * 30){ const w = 10 + r() * 14; rep(x, w, xx => { rect(g, xx, -5, w, 445, r() < .5 ? C.bark : C.logD, 1.4); g.strokeStyle = C.ink; g.lineWidth = .8; g.beginPath(); for(let y = 20; y < 430; y += 30 + r() * 30){ g.moveTo(xx + 2, y); g.lineTo(xx + w - 3, y + 6); } g.stroke(); }); }
      for(let x = 0; x < TILE_W; x += 40 + r() * 40){ const hh = 160 + r() * 120; rep(x, 60, xx => spruce(g, xx, 440, hh, C.spruce, C.spruceD, 1.6)); }
      shape(g, C.spruceD, () => g.rect(-5, 436, TILE_W + 10, VH), 1.4);
      break; }
    case 'river_back': {
      shape(g, C.grass, () => g.rect(-5, 402, TILE_W + 10, VH), 1.4);
      for(let x = 0; x < TILE_W; x += 170 + r() * 200){ const hh = 120 + r() * 50; rep(x, 90, xx => {
        shape(g, C.bark, () => { g.moveTo(xx - 7, 404); g.quadraticCurveTo(xx - 2, 404 - hh * .5, xx - 14, 404 - hh); g.lineTo(xx + 4, 404 - hh); g.quadraticCurveTo(xx + 8, 404 - hh * .5, xx + 7, 404); g.closePath(); }, 1.4);
        shape(g, C.greenL, () => g.ellipse(xx - 4, 404 - hh + 8, 64, 34, 0, Math.PI, 0), 1.6);
        g.strokeStyle = C.ink; g.lineWidth = 1.2; for(let i = 0; i < 22; i++){ const sx = xx - 62 + i * 6, sy = 404 - hh + 8 - Math.sin(i / 21 * Math.PI) * 30; g.beginPath(); g.moveTo(sx, sy); g.quadraticCurveTo(sx - 4, sy + hh * .35, sx + (i % 2) * 3, 404 - hh * .22 + (i % 4) * 8); g.stroke(); } }); }
      break; }
    case 'fg': {
      for(let x = 0; x < TILE_W; x += 26 + r() * 40) rep(x, 20, xx => tuft(g, xx, VH + 2, 1.2 + r() * .9, r() < .5 ? C.grassD : C.greenD));
      for(let x = 0; x < TILE_W; x += 140 + r() * 200) rep(x, 10, xx => flower(g, xx, VH - 4, r() < .5 ? C.cin : C.white));
      break; }
  }
  C = saved;
  return tiles[key] = { c, W };
}
function drawTile(g, kind, ph, s, camX, f, oy, cw){
  const t = tile(kind, ph, s);
  let off = -((camX * f * s) % t.W); if(off > 0) off -= t.W;
  for(let x = off; x < cw; x += t.W) g.drawImage(t.c, Math.round(x), Math.round(oy));
}

/* =====================================================================
   ДУХИ НА ЖИВОПИСИ — Полудница и Леший рисуются прямо в картину, за героями:
   у них свой свет, и общая подкраска персонажей их не трогает.
   ===================================================================== */
/* без картинки духи рисуются кодом прямо в картину; с картинкой — как все герои, в общем слое со светом сцены */
function spiritOwn(n){ return (n.id === 'noon' || n.id === 'leshy') && !IMG['s_' + n.id]; }
function spiritAir(n){ return n.id === 'noon' && IMG.s_noon; }
/* если есть картинка духа — рисуем её вместо фигуры из кода (рост в единицах мира, низ — у ног) */
function spiritImg(L, key, h){ const im = IMG[key]; if(!im) return false; const w = im.width / im.height * h; L.drawImage(im, -w / 2, -h, w, h); return true; }
const _rnd = i => { const v = Math.sin(i * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
/* неровный, «косматый» край: каждый отрезок дробится и чуть сдвигается */
function shagPath(g, pts, amp, seed){
  g.beginPath();
  for(let i = 0; i < pts.length; i++){
    const [x0, y0] = pts[i], [x1, y1] = pts[(i + 1) % pts.length], L = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.round(L / 4)), nx = -(y1 - y0) / (L || 1), ny = (x1 - x0) / (L || 1);
    for(let j = 0; j < n; j++){ const t = j / n, a = amp * (_rnd(seed + i * 31 + j) - .35); const x = x0 + (x1 - x0) * t + nx * a, y = y0 + (y1 - y0) * t + ny * a; if(i + j === 0) g.moveTo(x, y); else g.lineTo(x, y); }
  }
  g.closePath();
}
/* дрожащий от жары воздух: полосы картины чуть ездят вбок */
function heatHaze(g, x0, y0, w, h, amp){
  const c = g.canvas, m = g.getTransform(), X = Math.round(m.a * x0 + m.e), Y = Math.round(m.d * y0 + m.f), W = Math.round(m.a * w), H = Math.round(m.d * h);
  if(W <= 0 || H <= 0) return;
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
  const band = Math.max(2, Math.round(3 * m.a));
  for(let y = Math.max(0, Y); y < Math.min(c.height, Y + H); y += band){
    const q = (y - Y) / H, fall = Math.sin(Math.PI * q) * (.4 + .6 * q);   // сильнее у земли, слабее вверху и по краям
    const dx = Math.sin(y * .045 / m.a + T * 5.2) * amp * m.a * fall + Math.sin(y * .11 / m.a - T * 3.1) * amp * .4 * m.a * fall;
    g.drawImage(c, X, y, W, band, X + dx, y, W, band);
  }
  g.restore();
}
/* свой небольшой слой для духа: рисуем чётко, потом растворяем низ и даём свечение */
const _SPL = {};
function spiritLayer(g, key, x0, y0, w, h, paint, post){
  const m = g.getTransform(), sc = m.a, W = Math.ceil(w * sc), H = Math.ceil(h * sc); if(W < 2 || H < 2) return;
  let c = _SPL[key]; if(!c){ c = _SPL[key] = document.createElement('canvas'); } if(c.width !== W || c.height !== H){ c.width = W; c.height = H; }
  const L = c.getContext('2d'); L.setTransform(1, 0, 0, 1, 0, 0); L.clearRect(0, 0, W, H); L.setTransform(sc, 0, 0, sc, -x0 * sc, -y0 * sc);
  paint(L); L.setTransform(sc, 0, 0, sc, -x0 * sc, -y0 * sc); if(post) post(L);
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); return { c, X: m.a * x0 + m.e, Y: m.d * y0 + m.f, W, H, done:() => g.restore() };
}
function fadeDown(L, x0, w, yA, yB, a){ L.globalCompositeOperation = 'destination-out'; const gr = L.createLinearGradient(0, yA, 0, yB); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, `rgba(0,0,0,${a})`); L.fillStyle = gr; L.fillRect(x0, yA, w, yB - yA + 40); L.globalCompositeOperation = 'source-over'; }
function drawNoonArt(g, x0){
  const x = x0 + Math.sin(T * .7) * 4, base = GY - 56, H = 208, br = .9 + Math.sin(T * 2.1) * .05 + Math.sin(T * 5.3) * .02;
  heatHaze(g, x - 110, base - H - 40, 220, H + 70, 3);
  g.save(); g.globalCompositeOperation = 'screen';   // жаркий воздух вокруг неё светлее
  let gr = g.createRadialGradient(x, base - H * .7, 4, x, base - H * .55, 150);
  gr.addColorStop(0, `rgba(255,244,210,${.32 * br})`); gr.addColorStop(.5, `rgba(255,236,190,${.1 * br})`); gr.addColorStop(1, 'rgba(255,236,190,0)');
  g.fillStyle = gr; g.fillRect(x - 160, base - H - 110, 320, H + 150); g.restore();
  const sw = Math.sin(T * 1.3) * 3, sw2 = Math.sin(T * 1.7 + 1) * 2.5, hw = Math.sin(T * .9) * 4;
  const paint = L => {
    L.translate(x, base); L.scale(-1, 1);   // смотрит влево, к деревне
    if(spiritImg(L, 's_noon', H + 8)) return;
    // волосы распущены до пояса, ветер их чуть ведёт
    L.fillStyle = 'rgb(236,222,178)'; shagPath(L, [[-3, -H - 2], [-11, -H + 6], [-15, -H + 26], [-17 - hw * .3, -H + 60], [-22 - hw, -H + 104], [-12 - hw * .6, -H + 100], [-8, -H + 64], [-4, -H + 30], [6, -H + 4]], 2.4, 11); L.fill();
    // рубаха до земли: узкие плечи, поясок, подол колоколом
    const shirt = [[-5, -H + 22], [-13, -H + 30], [-15, -H + 52], [-13, -H + 84], [-11, -H + 92], [-17, -H + 130], [-25 + sw2, -50], [-32 + sw, 0], [-12, 3], [6, 0], [26 + sw, 2], [22 + sw2, -50], [14, -H + 130], [10, -H + 92], [11, -H + 84], [12, -H + 52], [11, -H + 30], [5, -H + 22]];
    const fg = L.createLinearGradient(0, -H, 0, 0); fg.addColorStop(0, 'rgb(252,249,238)'); fg.addColorStop(.6, 'rgb(240,232,212)'); fg.addColorStop(1, 'rgb(222,208,176)');
    L.fillStyle = fg; shagPath(L, shirt, 1.2, 3); L.fill();
    L.fillStyle = 'rgba(170,150,112,.5)'; shagPath(L, [[-17, -H + 120], [-24 + sw2, -50], [-30 + sw, 0], [-20, 2], [-14, -H + 124]], 1, 7); L.fill();   // тень складок
    L.strokeStyle = 'rgba(150,128,96,.45)'; L.lineWidth = 1.2;
    for(const a of [-8, 1, 8]){ L.beginPath(); L.moveTo(a, -H + 96); L.quadraticCurveTo(a * 1.6 + sw * .3, -80, a * 2.2 + sw * .7, -2); L.stroke(); }
    L.strokeStyle = 'rgb(150,52,40)'; L.lineWidth = 2.2; L.beginPath(); L.moveTo(-11, -H + 90); L.lineTo(10, -H + 89); L.stroke();   // красный поясок
    L.beginPath(); L.moveTo(8, -H + 90); L.lineTo(10, -H + 108); L.lineWidth = 1.2; L.stroke();
    // опущенная рука вдоль тела
    L.strokeStyle = 'rgb(244,236,216)'; L.lineCap = 'round'; L.lineWidth = 6; L.beginPath(); L.moveTo(-10, -H + 30); L.quadraticCurveTo(-15, -H + 70, -13, -H + 104); L.stroke();
    // голова и шея; лицо не разобрать
    L.fillStyle = 'rgb(252,246,232)'; L.fillRect(-3, -H + 14, 6, 10); L.beginPath(); L.ellipse(1, -H + 6, 7, 9.5, .1, 0, Math.PI * 2); L.fill();
    L.strokeStyle = 'rgb(214,190,120)'; L.lineWidth = 2; L.beginPath(); L.arc(1, -H + 4, 8, Math.PI * 1.05, Math.PI * 1.95); L.stroke();   // венок из колосьев
    // рука на плече и серп: рукоять в кулаке, лезвие полумесяцем впереди головы
    L.strokeStyle = 'rgb(244,236,216)'; L.lineWidth = 6; L.beginPath(); L.moveTo(9, -H + 30); L.quadraticCurveTo(22, -H + 40, 17, -H + 20); L.stroke();
    L.strokeStyle = 'rgb(150,120,84)'; L.lineWidth = 2.6; L.beginPath(); L.moveTo(17, -H + 22); L.lineTo(20, -H + 2); L.stroke();
    const cx = 32, cy = -H + 4, R = 15; L.fillStyle = 'rgb(206,206,198)'; L.beginPath(); L.arc(cx, cy, R, Math.PI, Math.PI * 2.28, false); L.arc(cx + 3, cy + 3, R - 4, Math.PI * 2.24, Math.PI * 1.05, true); L.closePath(); L.fill();
    L.strokeStyle = 'rgba(255,255,255,.95)'; L.lineWidth = .9; L.beginPath(); L.arc(cx, cy, R - .4, Math.PI * 1.05, Math.PI * 2.2); L.stroke();
  };
  const post = L => { L.setTransform(1, 0, 0, 1, 0, 0); L.globalCompositeOperation = 'destination-out'; L.fillStyle = `rgba(0,0,0,${IMG.s_noon ? .06 : .18})`; L.fillRect(0, 0, L.canvas.width, L.canvas.height); L.globalCompositeOperation = 'source-over';
    const m = g.getTransform(); L.setTransform(m.a, 0, 0, m.a, -(x - 70) * m.a, -(base - H - 40) * m.a); fadeDown(L, x - 70, 140, base - 70, base + 2, 1); };   // полупрозрачна, а подол тонет в ржи
  const Lr = spiritLayer(g, 'noon', x - 70, base - H - 40, 140, H + 46, paint, post); if(!Lr) return;
  g.globalAlpha = (IMG.s_noon ? .1 : .42) * br; g.globalCompositeOperation = 'screen'; g.filter = `blur(${Math.max(4, Lr.W / 30)}px)`; g.drawImage(Lr.c, Lr.X, Lr.Y);   // ореол
  g.filter = `blur(${Math.max(.6, Lr.W / 260)}px)`; g.globalCompositeOperation = 'source-over'; g.globalAlpha = IMG.s_noon ? 1 : .86 * br; g.drawImage(Lr.c, Lr.X, Lr.Y); g.filter = 'none'; Lr.done();
  // на месте лица — слепящее пятно, блик бежит по лезвию
  g.save(); g.globalCompositeOperation = 'lighter';
  const fx = x - 1, fy = base - H + 6; gr = g.createRadialGradient(fx, fy, 0, fx, fy, 18); gr.addColorStop(0, `rgba(255,255,250,${.85 * br})`); gr.addColorStop(.4, `rgba(255,248,220,${.3 * br})`); gr.addColorStop(1, 'rgba(255,248,220,0)'); g.fillStyle = gr; g.fillRect(fx - 18, fy - 18, 36, 36);
  const ga = Math.PI + ((T * .5) % 1.8) * Math.PI * .7, SI = IMG.s_noon, gcx = SI ? x + 22 : x - 32, gcy = SI ? base - H + 14 : base - H + 4, gR = SI ? 12 : 15;
  if(ga < Math.PI * 2.28){ const bx = gcx - Math.cos(ga) * gR, by = gcy + Math.sin(ga) * gR;
    gr = g.createRadialGradient(bx, by, 0, bx, by, 12); gr.addColorStop(0, 'rgba(255,255,255,.95)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(bx - 12, by - 12, 24, 24);
    g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = .7; g.beginPath(); g.moveTo(bx - 9, by); g.lineTo(bx + 9, by); g.moveTo(bx, by - 9); g.lineTo(bx, by + 9); g.stroke(); }
  // пыльца в горячем воздухе
  for(let i = 0; i < 18; i++){ const t = (T * (.05 + .05 * _rnd(i)) + _rnd(i + 50)) % 1, px = x + (_rnd(i + 9) - .5) * 170 + Math.sin(T + i) * 6, py = base + 10 - t * (H + 50), a = Math.sin(Math.PI * t) * .2;
    g.fillStyle = `rgba(255,244,205,${a})`; g.beginPath(); g.arc(px, py, .8 + _rnd(i + 3), 0, Math.PI * 2); g.fill(); }
  g.restore();
}
/* Леший сидит на пне у развилки: сгорбленный, косматый, мох и ветки вместо волос. Тени у него нет. */
function drawLeshyArt(g, x0, ph){
  const im = IMG.s_leshy;
  if(im){   // картинка: пень на ней совмещён с пнём на картине поля, Леший смотрит влево, на тропинку
    const h = 196, w = im.width / im.height * h, gy = 348, cx = x0 + 2 - w * .3, br = Math.sin(T * 1.1) * .6;
    const Lr = spiritLayer(g, 'leshyImg', cx - w / 2 - 4, gy - h - 6, w + 8, h + 10, L => {
      L.translate(cx, gy); L.scale(-1, 1 + br / h); L.filter = 'brightness(.78) saturate(.8) contrast(1.05)'; L.drawImage(im, -w / 2, -h, w, h); L.filter = 'none'; },
      L => fadeDown(L, cx - w / 2 - 4, w + 8, gy - 26, gy + 2, .7));   // корни пня уходят в траву и туман
    if(!Lr) return;
    g.filter = `blur(${Math.max(.3, Lr.W / 900)}px)`; g.drawImage(Lr.c, Lr.X, Lr.Y); g.filter = 'none'; Lr.done();
    if((T % 5.7) < 5.5){ const ex = cx - (.636 - .5) * w, ey = gy - h + .105 * h; g.save(); g.globalCompositeOperation = 'lighter';   // глаза чуть светятся
      const gr = g.createRadialGradient(ex, ey, 0, ex, ey, 9); gr.addColorStop(0, 'rgba(190,240,130,.35)'); gr.addColorStop(1, 'rgba(190,240,130,0)'); g.fillStyle = gr; g.fillRect(ex - 9, ey - 9, 18, 18); g.restore(); }
    return;
  }
  const sy = 268, x = x0 + 2, K = .8;      // верх пня — по картине поля
  const bre = Math.sin(T * 1.1) * 1, rot = Math.sin(T * .45) * .012;
  const paint = L => {
    L.translate(x, sy); L.rotate(rot); L.scale(-K, K);   // лицом к тропинке, к Анне
    const mg = L.createLinearGradient(-20, -130, 30, 90); mg.addColorStop(0, 'rgb(40,44,32)'); mg.addColorStop(.4, 'rgb(23,26,19)'); mg.addColorStop(1, 'rgb(12,14,10)');
    L.fillStyle = 'rgb(16,19,13)';   // ноги в онучах, лапти
    shagPath(L, [[34, 8], [50, 4], [52, 40], [54, 74], [66, 80], [66, 86], [40, 86], [42, 70], [40, 30]], 2.5, 21); L.fill();
    shagPath(L, [[22, 10], [36, 12], [34, 44], [32, 78], [40, 84], [18, 86], [22, 72], [24, 40]], 2.5, 27); L.fill();
    // посох прислонён к плечу
    L.strokeStyle = 'rgb(34,29,20)'; L.lineWidth = 4; L.lineCap = 'round'; L.beginPath(); L.moveTo(70, 86); L.lineTo(64, 20); L.lineTo(58, -40); L.lineTo(50, -112); L.lineTo(56, -122); L.stroke();
    // тулуп: горб, широкая спина, полы лежат на коленях
    L.fillStyle = mg; shagPath(L, [[-12, -98 + bre], [-26, -84], [-33, -56], [-34, -22], [-31, 2], [-36, 16], [-6, 20], [24, 16], [52, 10], [54, -4], [44, -12], [22, -18], [16, -42], [16, -68], [10, -88 + bre]], 4.5, 5); L.fill();
    L.strokeStyle = 'rgba(70,64,46,.6)'; L.lineWidth = 1.4; L.beginPath(); L.moveTo(8, -84); L.quadraticCurveTo(-2, -40, 6, 16); L.stroke();   // запах на левую сторону
    // голова свешена вперёд, ниже плеч
    L.fillStyle = 'rgb(22,26,18)'; shagPath(L, [[8, -92 + bre], [6, -104 + bre], [14, -114 + bre], [26, -112 + bre], [32, -102 + bre], [30, -90 + bre], [20, -84 + bre]], 3, 41); L.fill();
    L.fillStyle = 'rgb(36,40,28)'; shagPath(L, [[16, -94 + bre], [32, -94 + bre], [33, -76], [28, -52], [24, -64], [19, -48], [16, -70]], 4, 61); L.fill();   // борода мочалом
    // рука лежит на колене
    L.strokeStyle = 'rgb(22,26,17)'; L.lineWidth = 10; L.beginPath(); L.moveTo(-2, -78); L.quadraticCurveTo(14, -40, 46, -8); L.stroke();
    L.fillStyle = 'rgb(58,50,36)'; L.beginPath(); L.ellipse(48, -7, 5, 4, 0, 0, Math.PI * 2); L.fill();
    // ветки и мох вместо шапки
    L.lineWidth = 1.5; L.strokeStyle = 'rgb(28,31,21)';
    const twig = (x, y, a, l, d) => { if(d > 3 || l < 4) return; const ex = x + Math.cos(a) * l, ey = y + Math.sin(a) * l; L.beginPath(); L.moveTo(x, y); L.lineTo(ex, ey); L.stroke(); twig(ex, ey, a - .45 - _rnd(d + l) * .2, l * .62, d + 1); twig(ex, ey, a + .4 + _rnd(d * 7 + l) * .2, l * .55, d + 1); };
    twig(12, -110 + bre, -Math.PI / 2 - .7, 18, 0); twig(20, -114 + bre, -Math.PI / 2 - .05, 16, 0); twig(27, -110 + bre, -Math.PI / 2 + .55, 13, 1);
    L.filter = 'blur(1.5px)'; L.fillStyle = 'rgba(88,104,58,.22)'; for(const [mx, my, rx, ry] of [[-14, -86, 14, 5], [2, -94, 9, 4], [-28, -40, 5, 12], [40, -8, 10, 4]]){ L.beginPath(); L.ellipse(mx, my, rx, ry, -.3, 0, Math.PI * 2); L.fill(); }
  };
  const post = L => { L.filter = 'none'; L.globalCompositeOperation = 'source-atop'; L.lineWidth = .9;   // свалявшаяся шерсть и мох
      for(let i = 0; i < 260; i++){ const px = x - 60 + _rnd(i) * 120, py = sy - 110 + _rnd(i + 400) * 190, a = (_rnd(i + 900) - .5) * .9 + Math.PI / 2, l = 2 + _rnd(i + 77) * 3;
        L.strokeStyle = i % 3 ? 'rgba(4,5,3,.35)' : 'rgba(78,84,58,.22)'; L.beginPath(); L.moveTo(px, py); L.lineTo(px + Math.cos(a) * l, py + Math.sin(a) * l); L.stroke(); }
      L.globalCompositeOperation = 'source-over'; fadeDown(L, x - 80, 160, sy + 14, sy + 60, .9); };   // ноги уходят в туман
  const Lr = spiritLayer(g, 'leshy', x - 80, sy - 130, 160, 210, paint, post); if(!Lr) return;
  g.filter = `blur(${Math.max(.5, Lr.W / 300)}px)`; g.globalAlpha = .96; g.drawImage(Lr.c, Lr.X, Lr.Y); g.filter = 'none'; g.globalAlpha = 1; Lr.done();
  // бледно-зелёные глаза из-под бровей, моргают
  if((T % 5.7) < 5.5){ g.save(); g.globalCompositeOperation = 'lighter';
    for(const ex of [21, 28]){ const ex2 = x - ex * K, ey = sy + (-101 + bre) * K, gr = g.createRadialGradient(ex2, ey, 0, ex2, ey, 6); gr.addColorStop(0, 'rgba(210,250,150,.9)'); gr.addColorStop(.35, 'rgba(160,220,100,.35)'); gr.addColorStop(1, 'rgba(160,220,100,0)'); g.fillStyle = gr; g.fillRect(ex2 - 6, ey - 6, 12, 12);
      g.fillStyle = 'rgba(232,255,190,1)'; g.beginPath(); g.ellipse(ex2, ey, 1.3, .9, 0, 0, Math.PI * 2); g.fill(); }
    g.restore(); }
}
function drawSpirits(g, list, ph){ for(const n of list){ if(n.id === 'noon') drawNoonArt(g, n.x); else if(n.id === 'leshy') drawLeshyArt(g, n.x, ph); } }

/* ---------- духи-картинки в общем слое героев: объёмные, со светом сцены, как остальные ---------- */
const _NOONF = { c:null, src:null };
function noonFaded(im){   // подол Полудницы тает в ржи: заранее растворённый низ картинки
  if(_NOONF.src === im) return _NOONF.c;
  const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const L = c.getContext('2d');
  L.drawImage(im, 0, 0); L.globalCompositeOperation = 'destination-out';
  const gr = L.createLinearGradient(0, im.height * .8, 0, im.height); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.85)');
  L.fillStyle = gr; L.fillRect(0, im.height * .8, im.width, im.height * .2); _NOONF.c = c; _NOONF.src = im; return c;
}
const NOON_H = 216, NOON_BASE = GY - 56;
function noonX(x0){ return x0 + Math.sin(T * .7) * 3; }
/* воздух вокруг Полудницы: марево и тёплое сияние на картине — до героев */
function drawNoonAir(g, x0){
  const x = noonX(x0), base = NOON_BASE, H = NOON_H;
  heatHaze(g, x - 110, base - H - 40, 220, H + 70, 2.4);
  g.save(); g.globalCompositeOperation = 'screen';
  const gr = g.createRadialGradient(x, base - H * .75, 4, x, base - H * .6, 140);
  gr.addColorStop(0, 'rgba(255,244,210,.22)'); gr.addColorStop(1, 'rgba(255,236,190,0)');
  g.fillStyle = gr; g.fillRect(x - 150, base - H - 100, 300, H + 140); g.restore();
}
function drawNoonSprite(g, x0){
  const im = IMG.s_noon; if(!im) return; const x = noonX(x0), h = NOON_H, w = im.width / im.height * h;
  g.save(); g.translate(x, NOON_BASE); g.scale(-1, 1); g.drawImage(noonFaded(im), -w / 2, -h, w, h); g.restore();
  glow(x - 3, NOON_BASE - h + .07 * h, 26, 1.2, '255,248,225');   // на месте лица — свет
  // блик пробегает по лезвию серпа
  const ga = Math.PI + ((T * .5) % 1.8) * Math.PI * .7;
  if(ga < Math.PI * 2.28) glow(x + 22 - Math.cos(ga) * 12, NOON_BASE - h + 14 + Math.sin(ga) * 12, 9, 1.4, '255,255,255');
}
/* Леший на пне у ельника: пень картинки совмещён с пнём на картине поля */
function drawLeshySprite(g, x0){
  const im = IMG.s_leshy; if(!im) return; const h = 196, w = im.width / im.height * h, gy = 348, cx = x0 + 2 - w * .3, br = Math.sin(T * 1.1) * .6;
  g.save(); g.translate(cx, gy); g.scale(-1, 1 + br / h); g.drawImage(im, -w / 2, -h, w, h); g.restore();
  if((T % 5.7) < 5.5) glow(cx - (.636 - .5) * w, gy - h + .105 * h, 8, .6, '190,240,130');
}
