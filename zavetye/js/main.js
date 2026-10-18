'use strict';
/* =====================================================================
   ИГРА — цикл, переходы, управление, запуск
   ===================================================================== */
const ui = { dlg:false, nb:false, title:false, end:false, fading:false, cut:false };
let breathT = 1.5, camX = 0, walkPh = 0, moving = false, target = null, targetHot = null, curHot = null, curChoices = [], DLG = null, saveT = 0, lastStep = 0;
const keys = {};
const blocked = () => ui.dlg || ui.nb || ui.title || ui.end || ui.fading || ui.cut;
const wrapP = s => (s.startsWith('<') ? s : `<p>${s}</p>`).replace(/^<p>— /, '<p class="dl">— ');

/* ---------- переходы ---------- */
function teleport(dest, then){
  ui.fading = true; $('fade').classList.add('on'); sfx('door');
  Promise.all([new Promise(r => setTimeout(r, 460)), ensure(STRIP_KEYS(dest[0]), 8000)]).then(() => {
    const [strip, x] = dest, changed = st.strip !== strip;
    st.strip = strip; st.x = x; st.dir = x > STRIPS[strip].w / 2 ? -1 : 1; target = null; targetHot = null;
    snapCam(); PARTS.length = 0; annaHist.length = 0; FX.length = 0; ANNA_ANIM.face = ANNA_ANIM.dirPrev = st.dir; ANNA_ANIM.th = ANNA_ANIM.thTo = st.dir > 0 ? 0 : Math.PI; ANNA_ANIM.look = ANNA_ANIM.idle = 0;
    $('fade').classList.remove('on');
    setTimeout(() => { ui.fading = false; if(changed) showArea(); saveMark(); if(st.strip === 'village' && F('arrived')) trackOnce('reached_zavetye'); if(then) then(); }, 300);
    preloadNear(strip);
  });
}
/* соседние места догружаются заранее, пока Анна гуляет здесь */
const NEAR = { flat:['road'], road:['village'], village:['aglaya','grunya','laptev','school','river','field'], field:['forestroad','village'], aglaya:['village'], grunya:['village'], laptev:['village'], school:['village'], river:['village'], forestroad:['field'] };
function preloadNear(strip){ for(const n of NEAR[strip] || []) ensure(STRIP_KEYS(n), 0); }
function snapCam(){ const W = RW(st.strip), ax = R(st.strip, st.x), vw = VIEW.viewW; camX = camClamp(st.strip, ax - vw / 2, vw); }
/* ---------- взаимодействие ---------- */
function interact(h){
  if(!h) return; target = null; targetHot = null;
  const r = h.act(); if(!r) return;
  trackOnce('first_interaction'); hideHint();
  if(typeof r === 'object'){ if(r.cost){ pass(r.cost); updateHud(); } if(r.play) runPlay(r); else openScene(r.scene); }
  else openScene(r);
}
function nearestHot(){
  let best = null, bd = 1e9;
  for(const h of hotsFor()){ const d = Math.abs(h.x - st.x); if(d < (h.r || 75) && d < bd){ best = h; bd = d; } }
  return best;
}

/* ---------- цикл ---------- */
let last = performance.now();
function loop(now){
  const dt = Math.min(.05, (now - last) / 1000); last = now; T += dt;
  resize();
  if(ui.title && !st){ drawTitle(dt); }
  else if(st){ update(dt); drawFrame(st, camX, { x:st.x, dir:st.dir, move:moving, ph:walkPh }); qualityTick(dt); }
  audioTick(dt);
  requestAnimationFrame(loop);
}
/* на живописных полосах логика сжата в картину — шаг ускоряем, чтобы ноги не скользили */
function stripPace(){ const a = STRIP_ART[st.strip], w = STRIPS[st.strip].w; if(!a || !artParts(st.strip, 0)) return 1; const k = w / RW(st.strip) * (a.charScale || 1); return Math.max(1, Math.min(2.4, k)); }
function update(dt){
  const S0 = STRIPS[st.strip];
  moving = false;
  if(st.bus){
    const b = st.bus;
    if(b.mode === 'leave'){ b.v = (b.v || 0) + 60 * dt; b.x += b.v * dt * 4; if(b.x > S0.w + 400) st.bus = null; }
    if(b.mode === 'arrive'){ b.x -= Math.max(40, (b.x - 1290) * 1.4) * dt; if(b.x <= 1292){ b.x = 1290; b.mode = 'park'; ui.cut = false; openScene('bus_sunday'); } }
  }
  if(!blocked()){
    let d = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
    if(d){ target = null; targetHot = null; }
    else if(target != null){ const dx = target - st.x; if(Math.abs(dx) < 8 * stripPace()){ target = null; const h = targetHot; targetHot = null; if(h) interact(h); } else d = Math.sign(dx); }
    if(d){
      const sp = (keys.run ? 330 : 190) * dt * (.3 + .7 * Math.abs(ANNA_ANIM.face)) * stripPace(); st.x += d * sp; st.dir = d; moving = true; walkPh += dt * (keys.run ? 19 : 13.5);
      const plant = Math.floor((walkPh - Math.PI / 2) / Math.PI);   // момент, когда пятка встаёт на землю
      if(plant !== lastStep){ lastStep = plant; const surf = surfaceAt(st.strip, st.x + st.dir * 14); stepSound(surf, keys.run); footFx(st.strip, st.x + st.dir * 14, surf, keys.run); }
      if(st.tut.move && !st.tut.act) hideHint();
    }
    const minX = S0.minX || 30, maxX = S0.maxX || S0.w - 30;
    if(S0.exits && S0.exits.left && st.x < 26) return teleport(S0.exits.left);
    if(S0.exits && S0.exits.right && st.x > S0.w - 26) return teleport(S0.exits.right);
    st.x = Math.max(S0.exits && S0.exits.left ? 20 : minX, Math.min(S0.exits && S0.exits.right ? S0.w - 20 : maxX, st.x));
    // сюжетные триггеры
    if(st.strip === 'road' && F('arrivedRoad') !== true && !st.bus && st.x < 1080 && !F('pRoad') && !F('arrived')){ setF('pRoad'); openScene('p_road'); }
    if(st.strip === 'field' && st.phase === 1 && !F('noonDone') && Math.abs(st.x - 1100) < 300 && !F('noonAsk' + st.day)){ setF('noonAsk' + st.day); target = null; openScene('field_noon'); }
    saveT += dt; if(saveT > 4){ saveT = 0; save(); }
  }
  // плавный разгон/остановка и разворот; пар изо рта на холоде
  const AN = ANNA_ANIM, tk = moving ? 1 : 0;
  AN.k += (tk - AN.k) * Math.min(1, dt * (moving ? 9 : 7));
  AN.run += ((moving && keys.run ? 1 : 0) - AN.run) * Math.min(1, dt * 5);
  if(st.dir !== AN.dirPrev){ AN.via = 'front'; AN.dirPrev = st.dir; }
  // поворот: фиксированная длительность (~0.32 с на разворот), мягкий старт и финиш
  { const target = st.dir > 0 ? 0 : Math.PI; if(AN.th == null) AN.th = target;
    if(AN.thTo !== target){ AN.thFrom = AN.th; AN.thTo = target; AN.thT = 0; AN.thDur = .08 + .24 * Math.abs(target - AN.th) / Math.PI; }
    if(AN.th !== target){ AN.thT += dt; const q = Math.min(1, AN.thT / AN.thDur), e = q * q * (3 - 2 * q); AN.th = q >= 1 ? target : AN.thFrom + (target - AN.thFrom) * e; }
    AN.face = Math.cos(AN.th); }
  AN.look = 0;
  const cold = !STRIPS[st.strip].indoor && st.strip !== 'flat' && phaseOf(st) !== 1;
  breathT -= dt * (1 + AN.k * .8 + AN.run * 1.2);
  if(breathT <= 0){ breathT = 2.4 + Math.random() * .8; if(cold && !STRIPS[st.strip].frozen) breathFx(st.strip, st.x, AN.face >= 0 ? 1 : -1); }
  fxStep(dt);
  annaHist.push({ x:st.x, dir:st.dir, move:moving, ph:walkPh }); if(annaHist.length > 32) annaHist.shift();
  const vw = VIEW.viewW, W = RW(st.strip), ax = R(st.strip, st.x), tx = camClamp(st.strip, ax - vw / 2 + st.dir * vw * .08, vw);
  camX += (tx - camX) * Math.min(1, dt * 3.2);
  tickParticles(dt, st, camX, vw);
  curHot = blocked() ? null : nearestHot();
  const pr = $('prompt');
  tutTick();
  if(curHot){ pr.hidden = false; $('promptTx').textContent = curHot.ph;
    const sx = (R(st.strip, curHot.x) - camX) * VIEW.s / VIEW.dpr, sy = (VIEW.oy + (GY - 124 * charK(st.strip) - (curHot.npc ? 40 : 18)) * VIEW.s) / VIEW.dpr; // над головой, не на лице
    pr.style.left = Math.max(90, Math.min(innerWidth - 90, sx)) + 'px'; pr.style.top = Math.max(80, sy) + 'px'; }
  else pr.hidden = true;
}

/* ---------- ввод ---------- */
const KMAP = { ArrowLeft:'left', KeyA:'left', ArrowRight:'right', KeyD:'right', ShiftLeft:'run', ShiftRight:'run' };
addEventListener('keydown', e => {
  if(e.target.closest && e.target.closest('input,textarea')) return;
  if(!$('confirm').hidden){ if(e.code === 'Escape') $('cfNo').click(); return; }
  if(KMAP[e.code]){ keys[KMAP[e.code]] = true; if(!ui.dlg && !ui.nb) e.preventDefault(); }
  if(e.code === 'Escape'){ if(!$('menu').hidden) closeMenu(); else if(ui.nb) closeBook(); else if(st && !ui.title && !ui.end) openMenu(); return; }
  if(e.code === 'Tab' || e.code === 'KeyN'){ if(st && !ui.title && !ui.end){ e.preventDefault(); closeMenu(); ui.nb ? closeBook() : openBook(); } return; }
  if(ui.nb || ui.title || ui.end || !$('menu').hidden) return;
  if(ui.dlg){
    if(/^Digit[1-9]$/.test(e.code)){ choose(+e.code.slice(5) - 1); e.preventDefault(); return; }
    if(['Space','Enter','KeyE'].includes(e.code)){ if(document.activeElement && document.activeElement.classList.contains('ch') && DLG && DLG.i >= st.view.pages.length - 1) return; e.preventDefault(); advance(); }
    return;
  }
  if(['KeyE','Space','Enter','ArrowUp','KeyW'].includes(e.code) && curHot && !blocked()){ e.preventDefault(); interact(curHot); }
});
addEventListener('keyup', e => { if(KMAP[e.code]) keys[KMAP[e.code]] = false; });
addEventListener('blur', () => { for(const k in keys) keys[k] = false; });
function hotAt(e){
  const wx = Lg(st.strip, camX + e.clientX * VIEW.dpr / VIEW.s), wy = (e.clientY * VIEW.dpr - VIEW.oy) / VIEW.s;
  let hit = null, bd = 1e9; for(const h of hotsFor()){ const d = Math.abs(h.x - wx); if(d < 80 && d < bd && wy > GY - 330 && wy < GY + 60){ hit = h; bd = d; } }
  return { hit, wx };
}
cv.addEventListener('pointerdown', e => {
  audioInit();
  if(ui.dlg){ advance(); return; }
  if(!$('menu').hidden){ closeMenu(); return; }
  if(blocked() || !st) return;
  const { hit, wx } = hotAt(e);
  if(hit){ if(Math.abs(hit.x - st.x) < 60) interact(hit); else { target = hit.x - Math.sign(hit.x - st.x) * 30; targetHot = hit; } }
  else { target = Math.max(10, Math.min(STRIPS[st.strip].w - 10, wx)); targetHot = null; }
});
/* обычный курсор в мире; над тем, с чем можно что-то сделать, — ромб */
cv.addEventListener('pointermove', e => { if(e.pointerType !== 'mouse' || !st || blocked()){ cv.classList.remove('hot'); return; } cv.classList.toggle('hot', !!hotAt(e).hit); });
$('prompt').onclick = () => { audioInit(); if(curHot) interact(curHot); };
$('dlgBody').onclick = () => advance();
$('dlgMore').onclick = () => advance();
$('dlgReply').onclick = () => $('dlg').classList.add('chsheet');
$('dlgCh').onclick = e => { const b = e.target.closest('.ch'); if(b) choose(+b.dataset.i); };
$('bBook').onclick = () => { closeMenu(); ui.nb ? closeBook() : openBook(); };
$('bMenu').onclick = e => { e.stopPropagation(); $('menu').hidden ? openMenu() : closeMenu(); };
$('when').onclick = () => showThought(0);
document.addEventListener('click', e => {
  const t = e.target;
  const mm = t.closest('[data-m]');
  if(mm){ const m = mm.dataset.m;
    if(m === 'funnel'){ showFunnel(); return; }
    closeMenu();
    if(m === 'title'){ save(); showTitle(); }
    if(m === 'restart') askConfirm('Начать заново?', 'Текущее сохранение будет удалено: улики, версия и всё, что изменилось в Заветье.', restartGame);
    return; }
  const sd = t.closest('[data-sd]'); if(sd && st){ setDiff(sd.dataset.sd); renderMenu(); return; }
  const sz = t.closest('[data-size]'); if(sz){ SET.size = sz.dataset.size; saveSet(); applySize(); renderMenu(); if(ui.nb) renderBook(); return; }
  if(!t.closest('#menu') && !t.closest('#bMenu') && !$('menu').hidden) closeMenu();
});

/* ---------- запуск ---------- */
function boot(data){
  resize(); loadAssets();
  if(data && data.st){ startGame(data.st); if(st.flags.ended) showEnd(st.flags.ended); }
  else showTitle();
  requestAnimationFrame(t => { last = t; loop(t); });
}
window.claude?.hot?.snapshot?.(() => ({ st }));
if(window.claude?.hot?.ready) window.claude.hot.ready(boot); else boot(window.claude?.hot?.data ?? {});
