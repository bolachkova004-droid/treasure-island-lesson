'use strict';
/* =====================================================================
   АННА ПО КАДРАМ — ходьба, разворот и стояние из роликов Kling
   Описание листов пишет tools/anna_frames.py (между META и END).
   Пока листов нет, Анна ходит по-старому, на шарнирах.
   ===================================================================== */
const ANNA_FRAMES = /*META*/{}/*END*/;
for(const k of Object.keys(ANNA_FRAMES)) ASSETS[ANNA_FRAMES[k].key] = 'art/' + ANNA_FRAMES[k].key + '.webp';
const AF_CYCLE = 1;   // сколько циклов ходьбы (два шага) на один оборот фазы шага; подгоняется, чтобы ноги не скользили
function annaFramesReady(){ const W = ANNA_FRAMES.walk; return !!(W && IMG[W.key]); }
function afDraw(g, M, i, x, h, flip, alpha = 1){
  const im = IMG[M.key]; if(!im) return false;
  const k = h / M.fig * 1.0, fi = Math.max(0, Math.min(M.n - 1, i | 0));
  g.save(); g.globalAlpha *= alpha; g.translate(x, GY); g.scale(flip * k, k);
  g.drawImage(im, fi * M.fw, 0, M.fw, M.fh, -M.ax, -M.foot, M.fw, M.fh); g.restore(); return true;
}
/* выбор кадра: разворот — по углу поворота, ходьба — по фазе шага, стоя — петля стояния (или кадр «ноги вместе») */
function drawAnnaFrames(g, x, h, face, ph){
  const AN = ANNA_ANIM, Wk = ANNA_FRAMES.walk, Tn = ANNA_FRAMES.turn, Id = ANNA_FRAMES.idle;
  softShadow(g, x, h * .14);
  const th = AN.th == null ? (face > 0 ? 0 : Math.PI) : AN.th;
  if(Tn && IMG[Tn.key] && th > .06 && th < Math.PI - .06) return afDraw(g, Tn, th / Math.PI * (Tn.n - 1), x, h, 1);
  const flip = th < Math.PI / 2 ? 1 : -1, m = AN.k;
  const cyc = ((ph / (Math.PI * 2) * AF_CYCLE) % 1 + 1) % 1;
  if(m > .02){ const wi = cyc * Wk.n;
    if(m < .98 && Id && IMG[Id.key]){ afDraw(g, Id, (performance.now() / 1000 * 8) % Id.n, x, h, flip, 1 - m); return afDraw(g, Wk, wi, x, h, flip, m); }
    return afDraw(g, Wk, wi, x, h, flip); }
  if(Id && IMG[Id.key]) return afDraw(g, Id, (performance.now() / 1000 * 8) % Id.n, x, h, flip);
  return afDraw(g, Wk, Wk.stand || 0, x, h, flip);
}
