'use strict';
/* =====================================================================
   ИЛЛЮСТРАЦИИ — сгенерированные фоны, портреты и фигуры
   Пока картинки не добавлены, игра рисует мир кодом (лубок).
   Как только файл появляется в ASSETS и загружается, он заменяет рисунок.

   Имена файлов:
     bg_<место>[_night]   — фон-панорама (вид сбоку, земля на 80% высоты)
     p_<кто>_<эмоция>     — портрет по пояс для диалогов (PNG с прозрачностью)
     s_<кто>[_1.._4]      — фигура в полный рост, вид сбоку, лицом вправо
   ===================================================================== */
const ASSETS = {
  'bg_street_1': 'art/bg_street_1.jpg',
  'bg_street_2': 'art/bg_street_2.jpg',
  'bg_street_3': 'art/bg_street_3.jpg',
  'bg_street_4': 'art/bg_street_4.jpg',
  'l_bg_street_2': 'art/l_bg_street_2.jpg',
  'l_bg_street_3': 'art/l_bg_street_3.jpg',
  'l_bg_street_4': 'art/l_bg_street_4.jpg',
  'bg_road_l': 'art/bg_road_l.jpg',
  'bg_road': 'art/bg_road.jpg',
  'bg_field_l': 'art/bg_field_l.jpg',
  'bg_field': 'art/bg_field.jpg',
  's_bus': 'art/s_bus.webp',
  'bg_river': 'art/bg_river.jpg',
  'bg_river_r': 'art/bg_river_r.jpg',
  'bg_forest_stop_l': 'art/bg_forest_stop_l.jpg',
  'bg_forest_stop': 'art/bg_forest_stop.jpg',
  'bg_aglaya_house': 'art/bg_aglaya_house.jpg',
  'bg_grunya_house': 'art/bg_grunya_house.jpg',
  'bg_laptev_house': 'art/bg_laptev_house.jpg',
  'bg_school': 'art/bg_school.jpg',
  'bg_city_flat': 'art/bg_city_flat.jpg',
  'p_anna_neutral': 'art/p_anna_neutral.webp',
  'p_anna_afraid': 'art/p_anna_afraid.webp',
  'p_anna_sad': 'art/p_anna_sad.webp',
  'p_anna_surprised': 'art/p_anna_surprised.webp',
  'p_grunya_warm': 'art/p_grunya_warm.webp',
  'p_grunya_cold': 'art/p_grunya_cold.webp',
  'p_grunya_humming': 'art/p_grunya_humming.webp',
  's_grunya': 'art/s_grunya.webp',
  's_grisha': 'art/s_grisha.webp',
  's_nina': 'art/s_nina.webp',
  's_varya': 'art/s_varya.webp',
  's_young': 'art/s_young.webp',
  'p_young_neutral': 'art/p_young_neutral.webp',
  'p_varya_neutral': 'art/p_varya_neutral.webp',
  'p_nina_stern': 'art/p_nina_stern.webp',
  'p_nina_guilty': 'art/p_nina_guilty.webp',
  'p_grisha_cheerful': 'art/p_grisha_cheerful.webp',
  'p_grisha_confused': 'art/p_grisha_confused.webp',
  'p_grisha_broken': 'art/p_grisha_broken.webp',
  's_anna': 'art/s_anna.webp',
  's_anna_body': 'art/s_anna_body.webp',
  's_anna_front': 'art/s_anna_front.webp',
  's_anna_back': 'art/s_anna_back.webp',
  's_anna_q_front': 'art/s_anna_q_front.webp',
  's_anna_q_back': 'art/s_anna_q_back.webp',
  's_anna_head': 'art/s_anna_head.webp',
  's_anna_arm': 'art/s_anna_arm.webp',
  's_anna_bag': 'art/s_anna_bag.webp',
  's_anna_scarf': 'art/s_anna_scarf.webp',
  's_anna_thigh': 'art/s_anna_thigh.webp',
  's_anna_thigh2': 'art/s_anna_thigh2.webp',
  's_anna_shin': 'art/s_anna_shin.webp',
  's_anna_shin2': 'art/s_anna_shin2.webp',
  // 'bg_street_a': 'art/bg_street_a.jpg',
  // 'p_grunya_warm': 'art/p_grunya_warm.webp',
};
const IMG = {};
/* места, куда игра переносит Анну, следуют за нарисованными домами */
function syncPlaces(){ PLACES.house = ['village', spot('village', 'Дом Аглаи', 600)]; PLACES.grisha = ['village', spot('village', 'Дом Лаптевых', 3430) - 100]; }
/* загрузка по очереди: сначала титул (старая дорога), затем Анна и первая локация, остальное — в фоне.
   Перед переходом в новое место его картины догружаются заранее, пока экран затемнён. */
const LOAD = { ready:false, crit:[], pend:{}, queue:[], active:0 };
const STRIP_KEYS = strip => { const a = STRIP_ART[strip]; if(!a) return []; return a.parts.flatMap(p => [p, 'l_' + p, p + '_night']).filter(k => ASSETS[k]); };
const ANNA_KEYS = () => Object.keys(ASSETS).filter(k => k.startsWith('s_anna'));
const PORTRAIT_KEYS = who => Object.keys(ASSETS).filter(k => k.startsWith('p_' + who + '_'));
function loadOne(k){
  if(IMG[k]) return Promise.resolve(IMG[k]);
  if(LOAD.pend[k]) return LOAD.pend[k];
  return LOAD.pend[k] = new Promise(res => {
    const go = tries => { const im = new Image(); im.decoding = 'async';
      im.onload = () => { IMG[k] = im; fadedCache.clear(); syncPlaces(); res(im); };
      im.onerror = () => { if(tries < 3) setTimeout(() => go(tries + 1), 600 * (tries + 1)); else res(null); };
      im.src = ASSETS[k] + (tries ? '?r=' + tries : ''); };
    go(0); });
}
/* загрузить набор картинок; не ждать дольше ms (тогда покажется тёмная сцена с туманом, а картина доедет сама) */
function ensure(keys, ms = 9000){ const all = Promise.all(keys.filter(k => ASSETS[k]).map(loadOne)); return ms ? Promise.race([all, new Promise(r => setTimeout(r, ms))]) : all; }
function startKeys(s){ const strip = s ? s.strip : 'flat'; return [...STRIP_KEYS(strip), ...ANNA_KEYS(), ...PORTRAIT_KEYS('anna')]; }
function loadAssets(){
  const crit = [...STRIP_KEYS('road'), ...startKeys(loadSave())]; LOAD.crit = crit;
  const tick = () => loadTick();
  crit.forEach(k => loadOne(k).then(tick));
  ensure(crit, 20000).then(() => { LOAD.ready = true; tick(); background(); });
}
/* фон: сначала то, что понадобится скоро (деревня, дом Аглаи, люди), потом всё остальное по две картинки за раз */
function background(){
  const order = ['village','aglaya','grunya','laptev','river','field','school','forestroad'].flatMap(STRIP_KEYS);
  const rest = Object.keys(ASSETS).filter(k => !order.includes(k));
  const q = [...order, ...rest.filter(k => k.startsWith('s_')), ...rest.filter(k => k.startsWith('p_')), ...rest].filter((k, i, A) => A.indexOf(k) === i && !IMG[k]);
  const next = () => { const k = q.shift(); if(!k) return; loadOne(k).then(() => setTimeout(next, 30)); };
  next(); next();
}
function loadTick(){
  const n = LOAD.crit.length, done = LOAD.crit.filter(k => IMG[k]).length;
  const el = $('loadNote'), b = $('bNew'), c = $('bCont');
  if(el){ el.hidden = LOAD.ready; el.textContent = `Загружаем Заветье… ${Math.round(100 * done / Math.max(1, n))}%`; }
  if(b) b.disabled = !LOAD.ready; if(c) c.disabled = !LOAD.ready;
}
/* у места есть живопись, но она ещё не загрузилась — рисуем тёмную сцену с туманом, а не старый рисунок */
function artPending(strip){ return !!STRIP_ART[strip] && !artParts(strip, 0); }
/* какие фоны у какой полосы: части склеиваются слева направо */
const STRIP_ART = {
  // улица из четырёх картин; segs — какие участки логической улицы покрывает каждая картина
  village:   { parts:['bg_street_1','bg_street_2','bg_street_3','bg_street_4'], segs:[0, 1100, 2150, 3050, 4400], charScale:1.25,
               hotPx:{ 'Дом Аглаи':[0, 1030], 'Изба Груни':[1, 215], 'Лавка у колодца':[1, 590], 'Тропа к реке':[1, 880], 'Колодец-журавль':[1, 1290],
                      'Окно школы':[2, 850], 'Дверь школы':[2, 1000], 'Соседский дом':[2, 1370],
                      'Чемодан':[3, 745], 'Дом Лаптевых':[3, 820], 'Баня':[3, 1360] },
               npcPx:{ grisha:[3, 330], nina:[3, 990], varya:[3, 1150] } },
  road:      { parts:['bg_road_l','bg_road'], segs:[0, 450, 1800], charScale:1.25, hotPx:{ 'Бетонная плита':[1, 680] } },
  field:     { parts:['bg_field_l','bg_field'], segs:[0, 480, 2000], charScale:1.2, hotPx:{ 'Ельник':[1, 225] }, npcPx:{ leshy:[1, 225] } },
  river:     { parts:['bg_river','bg_river_r'], segs:[0, 1250, 1500], charScale:1.25, hotPx:{ 'В деревню':[0, 110], 'Надпись':[0, 560], 'На мостки':[0, 900] } },
  forestroad:{ parts:['bg_forest_stop_l','bg_forest_stop'], segs:[0, 420, 1600], noNight:true, charScale:.9, npcPx:{ young:[1, 880] } },
  aglaya:    { pad:68, parts:['bg_aglaya_house'], nightBase:true, charScale:2.05, hotPx:{ 'На улицу':[0, 220], 'Прялка':[0, 400], 'Печь':[0, 720], 'Того, кто за печью':[0, 900], 'Стол':[0, 1150], 'Полка с тетрадями':[0, 1540], 'Лавка':[0, 1610] }, npcPx:{ grunya:[0, 400], domovoi:[0, 905] } },
  grunya:    { pad:68, parts:['bg_grunya_house'], nightBase:true, charScale:2.05, hotPx:{ 'На улицу':[0, 310], 'Комод':[0, 590], 'Травы':[0, 840] }, npcPx:{ grunya:[0, 1190] } },
  laptev:    { pad:68, parts:['bg_laptev_house'], charScale:1.75, hotPx:{ 'Во двор':[0, 270], 'Стекло у вешалки':[0, 585], 'Голландка в сенях':[0, 1540] } },
  school:    { pad:68, parts:['bg_school'], charScale:1.6, hotPx:{ 'В окно':[0, 630], 'Учительский стол':[0, 1310], 'Доска':[0, 1480], 'Стенгазета':[0, 1650] } },
  flat:      { pad:109, parts:['bg_city_flat'], bright:true, charScale:2.45, hotPx:{ 'Шкаф':[0, 440] } },
};
function artParts(strip, ph){
  const a = STRIP_ART[strip]; if(!a) return null;
  const night = ph === 3 && !a.noNight;
  const list = a.parts.map(p => (night && IMG[p + '_night']) || IMG[p] || null);
  if(a.segs ? !list.some(Boolean) : !list.every(Boolean)) return null;
  return { imgs:list, nightArt: night && (a.nightBase || a.parts.every(p => IMG[p + '_night'])) };
}
/* раскладка: логические участки полосы → отрезки на картинах.
   Соседние картины заходят друг на друга на OV единиц и плавно перетекают. */
const OV = 110;
function layout(strip){
  const a = STRIP_ART[strip], P = artParts(strip, 0), w = STRIPS[strip].w;
  if(!P) return null;
  const segs = a.segs || [0, w], out = [], n = P.imgs.length; let r = 0;
  for(let i = 0; i < n; i++){
    const im = P.imgs[i], la = segs[i], lb = segs[i + 1] ?? w, rw = im ? im.width / im.height * VH : (lb - la);
    const r0 = i ? r - OV : r;
    out.push({ la, lb, r0, rw, img:im, ra: r0 + (i ? OV / 2 : 0), rb: r0 + rw - (i < n - 1 ? OV / 2 : 0) });
    r = r0 + rw;
  }
  return { segs:out, total:r };
}
function R(strip, x){ const Ly = layout(strip); if(!Ly) return x; const S = Ly.segs; for(const s of S) if(x <= s.lb || s === S[S.length - 1]) return s.ra + (x - s.la) / (s.lb - s.la) * (s.rb - s.ra); return x; }
function Lg(strip, rx){ const Ly = layout(strip); if(!Ly) return rx; const S = Ly.segs; for(const s of S) if(rx <= s.rb || s === S[S.length - 1]) return s.la + (rx - s.ra) / (s.rb - s.ra) * (s.lb - s.la); return rx; }
function RW(strip){ const Ly = layout(strip); return Ly ? Ly.total : STRIPS[strip].w; }
/* картина с растворённым левым краем — для перетекания */
const fadedCache = new Map();
function fadedLeft(im, frac){
  const key = im.src + frac; if(fadedCache.has(key)) return fadedCache.get(key);
  const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const g = c.getContext('2d');
  g.drawImage(im, 0, 0); g.globalCompositeOperation = 'destination-in';
  const gr = g.createLinearGradient(0, 0, im.width, 0); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(Math.min(.5, frac), 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,1)');
  g.fillStyle = gr; g.fillRect(0, 0, im.width, im.height);
  fadedCache.set(key, c); return c;
}
/* логическая точка у нарисованного места (куда ставить Анну, выходя из дома) */
function spot(strip, label, fx){
  const a = STRIP_ART[strip], hp = a && a.hotPx && a.hotPx[label], Ly = hp && layout(strip); if(!Ly) return fx;
  const s = Ly.segs[hp[0]]; return s && s.img ? Lg(strip, s.r0 + hp[1] / s.img.width * s.rw) : fx;
}
/* люди на картине: id → [номер картины, x в пикселях] */
function applyNpcPx(strip, list){
  const a = STRIP_ART[strip], Ly = a && a.npcPx && layout(strip); if(!Ly) return;
  for(const n of list){ const hp = a.npcPx[n.id]; if(!hp) continue; const s = Ly.segs[hp[0]]; if(!s || !s.img) continue; n.x = Lg(strip, s.r0 + hp[1] / s.img.width * s.rw) + (n.pose === 'suitcase' ? 90 : 0); }
}
/* точные места на картине: подпись точки → [номер картины, x в пикселях картины] */
function applyHotPx(strip, list){
  const a = STRIP_ART[strip], Ly = a && a.hotPx && layout(strip); if(!Ly) return;
  for(const h of list){ const hp = a.hotPx[h.label]; if(!hp) continue; const s = Ly.segs[hp[0]]; if(!s || !s.img) continue; h.x = Lg(strip, s.r0 + hp[1] / s.img.width * s.rw); }
}

/* ---------- кто говорит в сцене ---------- */
/* ---------- фигура из картинки ---------- */
function spriteFor(who, walkPh, moving){
  const frames = [1, 2, 3, 4].map(i => IMG[`s_${who}_${i}`]).filter(Boolean);
  if(frames.length && moving) return frames[Math.floor(walkPh / Math.PI * 1.2) % frames.length];
  return IMG[`s_${who}`] || frames[0] || null;
}
function softShadow(g, x, r){ g.save(); g.translate(x, GY + 2); g.scale(1, .16); const gr = g.createRadialGradient(0, 0, 0, 0, 0, r); gr.addColorStop(0, 'rgba(8,6,6,.42)'); gr.addColorStop(.55, 'rgba(8,6,6,.2)'); gr.addColorStop(1, 'rgba(8,6,6,0)'); g.fillStyle = gr; g.fillRect(-r, -r, 2 * r, 2 * r); g.restore(); }
function drawSprite(g, im, x, h, face, bob = 0){
  const w = im.width / im.height * h;
  softShadow(g, x, w * .42);
  g.save(); g.translate(x, GY - bob); g.scale(face, 1); g.drawImage(im, -w / 2, -h, w, h); g.restore();
}

/* Анна на шарнирах: голова, корпус, рука, шарф, сумка и две ноги (бедро + голень).
   Координаты — в пикселях картинки s_anna (161×600). Бедро и плечо спрятаны под пальто. */
const ANNA_RIG = { W:161, H:600, hip:[70, 372], knee:[70, 478], shoulder:[84, 112], strap:[36, 184], neck:[98, 82], mouth:[127, 70], foot:221,
  pos:{ head:[28,0], arm:[66,96], bag:[1,179], scarf:[109,133], thigh:[37,385], thigh2:[37,385], shin:[36,472], shin2:[36,472] } };
const RIG_PARTS = ['body', ...Object.keys(ANNA_RIG.pos)];
const ANNA_ANIM = { k:0, face:1, run:0, via:'front', look:0, idle:0, dirPrev:1 };   // разгон/остановка, разворот через фас/спину, взгляд в сторону зрителя
function annaRigReady(){ return RIG_PARTS.every(p => IMG['s_anna_' + p]) && IMG.s_anna_front; }
/* ракурсы в три четверти подхватываются, если файлы есть */
const smooth = (a, b, x) => { const q = Math.max(0, Math.min(1, (x - a) / (b - a))); return q * q * (3 - 2 * q); };
/* Анна целиком: в профиль — на шарнирах; в повороте — через ракурсы.
   Угол th: 0 — смотрит вправо, π/2 — на нас (или спиной), π — влево.
   Ракурсы: профиль, три четверти (если есть картинка), фас/спина. Соседние ракурсы перетекают друг в друга. */
/* центр тела на каждой картинке (по ногам и по массе), чтобы при смене ракурса фигура не прыгала */
const ANNA_AX = { side:84, front:99, back:97.6, q_front:102, q_back:95 };
function annaViews(via){
  const qn = via === 'front' ? 'q_front' : 'q_back', q = IMG['s_anna_' + qn];
  const mn = IMG['s_anna_' + via] ? via : 'front', mid = IMG['s_anna_' + mn];
  const V = [{ th:0, side:1 }];
  if(q) V.push({ th:Math.PI / 4, im:q, flip:1, ax:ANNA_AX[qn] });
  V.push({ th:Math.PI / 2, im:mid, flip:1, ax:ANNA_AX[mn] });
  if(q) V.push({ th:Math.PI * 3 / 4, im:q, flip:-1, ax:ANNA_AX[qn] });
  V.push({ th:Math.PI, side:-1 });
  return V;
}
function drawAnnaRig(g, x, h, face, ph, moving, run){
  const AN = ANNA_ANIM, k = h / ANNA_RIG.H;
  // угол поворота: из положения «лицом вправо/влево» плюс взгляд на зрителя
  let th = Math.acos(Math.max(-1, Math.min(1, AN.face)));
  const lookTh = AN.look * Math.PI / 2; th = th <= Math.PI / 2 ? Math.max(th, lookTh) : Math.min(th, Math.PI - lookTh);
  const via = AN.look > .05 ? 'front' : AN.via, V = annaViews(via);
  softShadow(g, x, ANNA_RIG.W * k * .5);
  let i = 0; while(i < V.length - 2 && th > V[i + 1].th) i++;
  const A = V[i], B = V[i + 1], lp = (th - A.th) / (B.th - A.th), w = smooth(.4, .6, lp);
  // между ракурсами фигура сужается — как будто поворачивается в глубину
  const squash = 1 - (V.length > 3 ? .04 : .15) * Math.sin(lp * Math.PI);
  const drawV = (v, alpha, near) => { if(alpha <= 0) return; g.save(); g.globalAlpha = alpha;
    const sq = squash * (near ? 1 : 1);
    if(v.side) drawAnnaSide(g, x, h, v.side * sq, ph);
    else { const br = Math.sin(performance.now() / 1000 * 1.7) * .003; g.translate(x, GY); g.scale(v.flip * sq * k, k * (1 + br)); g.drawImage(v.im, -v.ax, -v.im.height); }
    g.restore(); };
  // перетекание без «призрака»: сначала уходящий ракурс, потом приходящий
  if(w < .5){ drawV(A, 1); drawV(B, w * 2); }
  else { drawV(A, (1 - w) * 2); drawV(B, 1); }
}
function drawAnnaSide(g, x, h, face, ph){
  const R = ANNA_RIG, k = h / R.H, P = R.pos, im = n => IMG['s_anna_' + n];
  const t = performance.now() / 1000, m = ANNA_ANIM.k, rn = ANNA_ANIM.run;
  const A = (.4 + .12 * rn) * m, sn = Math.sin(ph);
  const legPose = s => { const th = -A * Math.sin(ph + s), sw = Math.cos(ph + s);
    return { th, bend: (Math.max(0, sw) ** 1.5 * (.75 + .25 * rn) + .04) * m }; };
  const near = legPose(0), far = legPose(Math.PI);
  const stance = near.bend < far.bend ? near : far;
  const drop = R.foot * (1 - Math.cos(stance.th)) + 1.5 * m;
  const idle = 1 - m;
  const breathe = Math.sin(t * 1.7) * 1.4 * idle;
  g.save(); g.translate(x, GY); g.scale(face * k, k); g.translate(-ANNA_AX.side, -R.H + drop);
  const put = (n, dx = 0, dy = 0) => g.drawImage(im(n), P[n][0] + dx, P[n][1] + dy);
  const rot = (px, py, a, fn) => { g.save(); g.translate(px, py); g.rotate(a); g.translate(-px, -py); fn(); g.restore(); };
  const leg = (L, sfx) => rot(R.hip[0], R.hip[1], L.th, () => { put('thigh' + sfx); rot(R.knee[0], R.knee[1], L.bend, () => put('shin' + sfx)); });
  leg(far, '2'); leg(near, '');
  // стоя — переминается с ноги на ногу; в ходьбе — наклон вперёд и пружинка
  const lean = m * (.035 + .02 * rn + Math.sin(ph * 2) * .012) + idle * Math.sin(t * .55) * .003;
  rot(R.hip[0], R.hip[1], lean, () => {
    g.translate(0, breathe * .35 - m * Math.abs(Math.cos(ph)) * 2.5);
    // голова: кивает в такт шагу, стоя — оглядывается и опускает взгляд
    const look = idle * Math.sin(t * .3) * .012;
    rot(R.neck[0], R.neck[1], m * (Math.sin(ph * 2 + .5) * .03 - .02) + look, () => put('head'));
    const body = im('body'), y0 = 300, y1 = 445, sway = -(2.5 + 2 * Math.sin(ph * 2 + .6)) * (1 + .7 * rn) * m + Math.sin(t * .9) * .5 * idle;
    g.save(); g.translate(0, R.hip[1]); g.scale(1, 1 + breathe * .002); g.translate(0, -R.hip[1]);
    g.drawImage(body, 0, 0, R.W, y0 + 2, 0, 0, R.W, y0 + 2);
    g.restore();
    for(let y = y0; y < y1; y += 5){ const q = ((y - y0) / (y1 - y0)) ** 1.6, hh = Math.min(8, y1 + 20 - y); g.drawImage(body, 0, y, R.W, hh, sway * q, y, R.W, hh); }
    // сумка качается на ремне с запаздыванием
    rot(R.strap[0], R.strap[1], m * (Math.sin(ph * 2 - 1.2) * (.07 + .04 * rn) + .04) + idle * Math.sin(t * .8) * .012, () => put('bag'));
    // шарф: концы отстают назад и волной колышутся (и на ветру, когда стоит)
    const sc = im('scarf'), sh = sc.height, trail = (5 + 6 * rn) * m;
    for(let y = 0; y < sh; y += 4){ const q = y / sh, hh = Math.min(7, sh - y), dx = -trail * q ** 1.3 + Math.sin(t * (1.7 + 5.5 * m) - q * 4) * (.9 + 1.6 * m) * q;
      g.drawImage(sc, 0, y, sc.width, hh, P.scarf[0] + dx, P.scarf[1] + y, sc.width, hh); }
    // рука в противоход ближней ноге; стоя — чуть покачивается
    rot(R.shoulder[0], R.shoulder[1], -near.th * (.8 + .3 * rn) + .03 * m + idle * Math.sin(t * .9 + 2) * .015, () => put('arm'));
  });
  g.restore();
}

/* ---------- живые мелочи: брызги из-под ног, круги на лужах, пар изо рта ---------- */
const FX = [];
/* лужи на картине улицы: [номер картины, от, до] в пикселях */
const WET = { village: [[0, 1280, 1460], [1, 690, 960], [2, 117, 390], [2, 664, 840], [3, 0, 254]] };
function surfaceAt(strip, x){
  const S = STRIPS[strip];
  if(strip === 'flat') return 'carpet';
  if(S.indoor) return 'wood';
  if(strip === 'road' || strip === 'forestroad') return 'asphalt';
  if(strip === 'field') return 'grass';
  if(strip === 'river') return x > 760 && x < 1010 ? 'planks' : 'mud';
  if(WET[strip]){ const Ly = layout(strip); if(Ly){ const rx = R(strip, x);
    for(const [i, a, b] of WET[strip]){ const s = Ly.segs[i]; if(!s || !s.img) continue; const k = s.rw / s.img.width; if(rx > s.r0 + a * k && rx < s.r0 + b * k) return 'puddle'; } } }
  return 'mud';
}
function charK(strip){ const a = STRIP_ART[strip]; return a && artParts(strip, 0) ? a.charScale || 1 : 1; }
function footFx(strip, x, surf, run){
  const rx = R(strip, x), rnd = (a, b) => a + Math.random() * (b - a), n = run ? 1.6 : 1;
  if(surf === 'mud' || surf === 'puddle'){
    const wet = surf === 'puddle';
    for(let i = 0; i < (wet ? 7 : 4) * n; i++) FX.push({ k:'drop', x:rx + rnd(-4, 4), y:GY - 1, vx:rnd(-55, 55), vy:rnd(-95, -40) * (wet ? 1.1 : .8), t:0, life:rnd(.35, .6), r:rnd(.6, 1.3), c:wet ? '120,112,100' : '52,38,28' });
    if(wet){ FX.push({ k:'ring', x:rx, y:GY + 2, t:0, life:1.1 }); FX.push({ k:'ring', x:rx + rnd(-6, 6), y:GY + 3, t:-.15, life:1.1 }); }
    else FX.push({ k:'splat', x:rx, y:GY + 2, t:0, life:1.6 });
  } else if(surf === 'grass'){
    for(let i = 0; i < 4 * n; i++) FX.push({ k:'chaff', x:rx + rnd(-8, 8), y:GY - rnd(2, 10), vx:rnd(-12, 12), vy:rnd(-30, -10), t:0, life:rnd(.8, 1.4), r:rnd(.8, 1.4) });
  } else if(surf !== 'carpet'){
    FX.push({ k:'puff', x:rx, y:GY - 2, t:0, life:.6, r:surf === 'wood' ? 7 : 9 });
  }
}
function breathFx(strip, x, face){
  const R0 = ANNA_RIG, cs = charK(strip), u = 124 / R0.H * cs, rx = R(strip, x);
  const front = ANNA_ANIM.look > .5;
  for(let i = 0; i < 3; i++) FX.push({ k:'breath', x:rx + (front ? 0 : face * (R0.mouth[0] - R0.W / 2) * u), y:GY - (R0.H - R0.mouth[1]) * u, vx:front ? (Math.random() - .5) * 8 : face * (14 + Math.random() * 10), vy:-6 - Math.random() * 6, t:-i * .05, life:1.7, r:1.5 });
}
function fxStep(dt){
  for(const f of FX){ f.t += dt; if(f.t < 0) continue;
    if(f.vx !== undefined){ f.x += f.vx * dt; f.y += f.vy * dt; }
    if(f.k === 'drop'){ f.vy += 420 * dt; if(f.y > GY + 2){ f.y = GY + 2; f.vy = 0; f.vx *= .3; } }
    if(f.k === 'chaff'){ f.vy += 6 * dt; f.vx += Math.sin(f.t * 5) * 8 * dt; }
    if(f.k === 'breath'){ f.vx *= 1 - dt * .9; f.vy -= 2 * dt; f.r += dt * 7; } }
  for(let i = FX.length - 1; i >= 0; i--) if(FX[i].t > FX[i].life) FX.splice(i, 1);
}
function drawFx(g, air = false){
  for(const f of FX){ if(f.t < 0 || (f.k === 'breath') !== air) continue; const q = f.t / f.life, a = 1 - q;
    if(f.k === 'drop'){ g.fillStyle = `rgba(${f.c},${a * .9})`; g.beginPath(); g.arc(f.x, f.y, f.r, 0, Math.PI * 2); g.fill(); }
    else if(f.k === 'splat'){ g.fillStyle = `rgba(30,22,16,${a * .35})`; g.beginPath(); g.ellipse(f.x, f.y, 7 + q * 3, 1.6, 0, 0, Math.PI * 2); g.fill(); }
    else if(f.k === 'ring'){ const r = 3 + q * 20; g.strokeStyle = `rgba(250,214,160,${a * .28})`; g.lineWidth = .8; g.beginPath(); g.ellipse(f.x, f.y, r, r * .2, 0, 0, Math.PI * 2); g.stroke(); }
    else if(f.k === 'chaff'){ g.fillStyle = `rgba(222,196,120,${a * .8})`; g.fillRect(f.x, f.y, f.r * 2, f.r * .7); }
    else if(f.k === 'puff'){ const r = f.r * (.5 + q); const gr = g.createRadialGradient(f.x, f.y, 0, f.x, f.y, r); gr.addColorStop(0, `rgba(150,140,128,${a * .25})`); gr.addColorStop(1, 'rgba(150,140,128,0)'); g.fillStyle = gr; g.fillRect(f.x - r, f.y - r, r * 2, r * 2); }
    else if(f.k === 'breath'){ const gr = g.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r); const al = Math.min(1, f.t * 6) * a * .5; gr.addColorStop(0, `rgba(236,240,244,${al})`); gr.addColorStop(1, 'rgba(236,240,244,0)'); g.fillStyle = gr; g.fillRect(f.x - f.r, f.y - f.r, f.r * 2, f.r * 2); }
  }
}

/* свет сцены вокруг Анны: средний цвет и яркость фона рядом с ней (замер раз в несколько кадров) */
/* если компьютер не тянет — сначала убираем кромку и отражения, потом весь слой света; звук шагов привязан к кадрам, так что плавность важна */
const LOWQ = { on:false, off:false, acc:0, n:0 };
function qualityTick(dt){ if(dt <= 0 || dt > .25) return; LOWQ.acc += dt; LOWQ.n++; if(LOWQ.n < 90) return; const avg = LOWQ.acc / LOWQ.n; LOWQ.acc = 0; LOWQ.n = 0;
  if(avg > 1 / 38){ if(!LOWQ.on) LOWQ.on = true; else LOWQ.off = true; } }
const SCENE_LIGHT = { f:1, r:128, g:128, b:128, key:null, n:0, la:0, side:{ lL:0, lR:0, cL:[255,255,255], cR:[255,255,255] } };
function spriteLum(){
  if(SCENE_LIGHT.la) return SCENE_LIGHT.la; const im = IMG.s_anna; if(!im) return .3;
  const c = document.createElement('canvas'); c.width = 40; c.height = 150; const x = c.getContext('2d', { willReadFrequently:true }); x.drawImage(im, 0, 0, 40, 150);
  const d = x.getImageData(0, 0, 40, 150).data; let L = 0, n = 0; for(let i = 0; i < d.length; i += 4) if(d[i + 3] > 200){ L += (.3 * d[i] + .59 * d[i + 1] + .11 * d[i + 2]) / 255; n++; }
  return SCENE_LIGHT.la = n ? L / n : .3;
}
function sampleScene(g, ax, top, h, key){
  const SL = SCENE_LIGHT; SL.n++;
  if(SL.key === key && SL.n % 12) return;
  try{ // одно чтение пикселей: середина — яркость и цвет вокруг героини, края — откуда свет (печь или окно могут быть поодаль)
    const W2 = Math.max(16, h * 1.5), x0 = Math.max(0, ax - W2) | 0, y0 = Math.max(0, top) | 0, sw = Math.max(2, Math.min(g.canvas.width - x0, 2 * W2) | 0), hh = Math.max(8, h) | 0;
    const d = g.getImageData(x0, y0, sw, hh).data, side = [[0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0]];
    let r = 0, gg = 0, b = 0, n = 0;
    for(let i = 0; i < d.length; i += 16){ const dx = x0 + (i >> 2) % sw - ax, l = (.3 * d[i] + .59 * d[i + 1] + .11 * d[i + 2]) / 255;
      if(Math.abs(dx) < h * .8){ r += d[i]; gg += d[i + 1]; b += d[i + 2]; n++; }
      if(Math.abs(dx) > h * .18){ const S2 = side[dx < 0 ? 0 : 1], wt = l * l * l; S2[0] += d[i] * wt; S2[1] += d[i + 1] * wt; S2[2] += d[i + 2] * wt; S2[3] += wt; S2[4] += l * l; S2[5]++; } }
    if(!n) return;
    r /= n; gg /= n; b /= n; const Lb = (.3 * r + .59 * gg + .11 * b) / 255, La = spriteLum();
    const tf = Math.max(.45, Math.min(1, (Lb * 1.3 + .05) / La)), first = SL.key !== key;
    const a = first ? 1 : .35; SL.f += (tf - SL.f) * a; SL.r += (r - SL.r) * a; SL.g += (gg - SL.g) * a; SL.b += (b - SL.b) * a; SL.key = key;
    const sd = SL.side;
    [['L', side[0]], ['R', side[1]]].forEach(([k, S2]) => { const lv = S2[5] ? Math.sqrt(S2[4] / S2[5]) : 0, c = S2[3] ? [S2[0] / S2[3], S2[1] / S2[3], S2[2] / S2[3]] : [255, 255, 255];
      sd['l' + k] += (lv - sd['l' + k]) * a; sd['c' + k] = sd['c' + k].map((v, j) => v + (c[j] - v) * a); });
  }catch(e){}
}
/* камера не заезжает на дорисованные по краям полосы, если экран позволяет */
function camClamp(strip, x, vw){
  const W = RW(strip), a = STRIP_ART[strip], pad = a && artParts(strip, 0) ? (a.pad || 0) : 0;
  if(W <= vw) return (W - vw) / 2;
  const lo = W - 2 * pad >= vw ? pad : Math.max(0, (W - vw) / 2 - Math.max(0, W - vw - 0) / 2), hi = W - 2 * pad >= vw ? W - pad - vw : W - vw - lo;
  return Math.max(lo, Math.min(hi, x));
}
/* свет сцены на героях: [заливка поверх, отсвет сверху] по месту и времени суток */
let _cl = null;
let _rl = null, _ml = null;
function maskLayer(w, h){ if(!_ml) _ml = document.createElement('canvas'); if(_ml.width !== w || _ml.height !== h){ _ml.width = w; _ml.height = h; } return _ml; }
function rimLayer(w, h){ if(!_rl) _rl = document.createElement('canvas'); if(_rl.width !== w || _rl.height !== h){ _rl.width = w; _rl.height = h; } return _rl; }
/* «обволакивающий свет»: по краю фигуры проступают размытые краски фона — фигура не вырезана, а стоит в сцене */
let _ws = null, _we = null;
function lightWrap(L, bg, lc, X0, Y0, BW, BH, s){ // считается в половинном размере: край и так мягкий, а кадр дешевле
  const k = 8, sw = Math.max(1, Math.ceil(BW / k)), sh = Math.max(1, Math.ceil(BH / k)), hw = Math.max(1, BW >> 1), hh = Math.max(1, BH >> 1);
  if(!_ws){ _ws = document.createElement('canvas'); _we = document.createElement('canvas'); }
  if(_ws.width !== sw || _ws.height !== sh){ _ws.width = sw; _ws.height = sh; }
  if(_we.width !== hw || _we.height !== hh){ _we.width = hw; _we.height = hh; }
  const S = _ws.getContext('2d'), E = _we.getContext('2d');
  S.drawImage(bg, X0, Y0, BW, BH, 0, 0, sw, sh);                                   // фон вокруг, уменьшенный = размытый
  E.globalCompositeOperation = 'copy'; E.drawImage(lc, X0, Y0, BW, BH, 0, 0, hw, hh);
  E.globalCompositeOperation = 'destination-out'; const d = Math.max(.7, .65 * s);
  for(const [dx, dy] of [[d, 0], [-d, 0], [0, -d]]) E.drawImage(lc, X0, Y0, BW, BH, dx, dy, hw, hh);
  E.globalCompositeOperation = 'source-in'; E.drawImage(_ws, 0, 0, sw, sh, 0, 0, hw, hh);
  L.save(); L.globalCompositeOperation = 'source-atop'; L.globalAlpha = .35; L.drawImage(_we, 0, 0, hw, hh, X0, Y0, BW, BH); L.restore();
}
function charLayer(w, h){ if(!_cl) _cl = document.createElement('canvas'); if(_cl.width !== w || _cl.height !== h){ _cl.width = w; _cl.height = h; } return _cl; }
function charTint(strip, ph){ if(window.NOTINT) return null;
  // [тон сцены (мягкий свет, плотный цвет), отсвет сверху, контровой свет [цвет, сторона]]
  const T = {
    aglaya:     ['rgba(255,140,60,.55)',  'rgba(255,190,120,.07)', ['rgba(255,150,60,.18)', -1]],
    grunya:     ['rgba(255,150,70,.50)',  'rgba(255,200,130,.06)', ['rgba(255,190,110,.15)', 1]],
    laptev:     ['rgba(120,130,150,.45)', null,                    ['rgba(220,228,240,.16)', -1]],
    school:     ['rgba(140,140,145,.40)', null,                    ['rgba(235,238,245,.18)', -1]],
    forestroad: ['rgba(90,120,170,.60)',  'rgba(170,190,220,.05)', ['rgba(255,170,130,.10)', 1]],
    flat:       ['rgba(255,200,130,.55)', 'rgba(255,225,180,.10)', ['rgba(255,236,200,.22)', 1]],
  }[strip];
  if(T) return T;
  return [['rgba(160,185,215,.55)', null, null], ['rgba(255,230,180,.45)', null, ['rgba(255,245,215,.10)', 1]],
          ['rgba(255,135,70,.55)', 'rgba(255,175,115,.06)', ['rgba(255,150,70,.16)', 1]], ['rgba(50,70,140,.70)', null, ['rgba(170,190,255,.10)', 1]]][ph];
}

/* ---------- туман и цветокоррекция ---------- */
const FOGCFG = [ { c:'223,231,236', a:.8 }, { c:'246,240,224', a:.28 }, { c:'233,196,180', a:.5 }, { c:'140,160,196', a:.55 } ];
const fogCache = {};
function fogTex(ph){
  if(fogCache[ph]) return fogCache[ph];
  const c = document.createElement('canvas'); c.width = 1024; c.height = 256; const g = c.getContext('2d'), r = rng(5);
  for(let i = 0; i < 150; i++){ const x = r() * 1024, y = 90 + r() * 130, rr = 40 + r() * 120;
    for(const dx of [-1024, 0, 1024]){ const gr = g.createRadialGradient(x + dx, y, 0, x + dx, y, rr); gr.addColorStop(0, `rgba(${FOGCFG[ph].c},.2)`); gr.addColorStop(1, `rgba(${FOGCFG[ph].c},0)`); g.fillStyle = gr; g.fillRect(x + dx - rr, y - rr, rr * 2, rr * 2); } }
  return fogCache[ph] = c;
}
function drawFog(g, ph, camX, strength = 1, part = 'all'){
  const { s, oy, cw } = VIEW, tex = fogTex(ph), a = FOGCFG[ph].a * strength;
  const layers = [ { y:GY - 220, h:300, sp:5, par:.45, a:.55 }, { y:GY - 110, h:240, sp:12, par:.9, a:.85 }, { y:GY - 20, h:190, sp:20, par:1.25, a:1 } ];
  for(const [i, L] of layers.entries()){
    if(part === 'back' && i === 2 || part === 'front' && i < 2) continue;
    const tw = 1024 * 1.4 * s, th = L.h * s, y = oy + L.y * s;
    let off = -(((camX * L.par + T * L.sp) * s) % tw); if(off > 0) off -= tw;
    g.globalAlpha = Math.min(1, a * L.a);
    for(let x = off; x < cw; x += tw) g.drawImage(tex, x, y, tw, th);
  }
  g.globalAlpha = 1;
}
function gradeArt(g, ph, nightArt, bright, indoor){
  const { cw, ch } = VIEW;
  if(bright) return;
  const fill = (op, col) => { g.globalCompositeOperation = op; g.fillStyle = col; g.fillRect(0, 0, cw, ch); };
  // утро: холодный рассеянный свет, лёгкий туман только на улице
  if(ph === 0){ fill('color', 'rgba(170,190,205,.4)'); if(!indoor) fill('screen', 'rgba(110,125,140,.14)'); }
  // полдень: убрать закатную рыжину (картины написаны в золотой час), чуть больше дневного света, без молочной пелены
  if(ph === 1 && !indoor){ fill('saturation', 'rgba(128,128,128,.22)'); fill('color', 'rgba(200,195,170,.14)'); fill('soft-light', 'rgba(255,250,235,.18)'); }
  if(ph === 1 && indoor && !nightArt){ fill('soft-light', 'rgba(255,240,215,.12)'); }
  if(ph === 3 && !nightArt){ fill('multiply', 'rgb(62,78,128)'); }
  g.globalCompositeOperation = 'source-over';
  const v = g.createRadialGradient(cw / 2, ch * .45, Math.min(cw, ch) * .3, cw / 2, ch * .45, Math.max(cw, ch) * .75);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, `rgba(8,8,14,${ph === 3 ? .6 : .4})`); g.fillStyle = v; g.fillRect(0, 0, cw, ch);
}
/* вечером и ночью окна и огонь в избах светятся: заранее вырезанная из картины карта тёплого света (art/l_*.jpg) */
function drawArtLights(g, camX, strip, k){
  const a = STRIP_ART[strip]; if(!a || k <= 0) return;
  const { s, oy } = VIEW, Ly = layout(strip);
  g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = k;
  Ly.segs.forEach((sg, i) => { const im = IMG['l_' + a.parts[i]], x = sg.r0, w = sg.rw; if(!im || x + w < camX - 10 || x > camX + VIEW.viewW + 10) return;
    g.drawImage(i ? fadedLeft(im, OV / w) : im, (x - camX) * s, oy, w * s + 1, VH * s); });
  g.restore();
}
function drawArtStrip(g, P, camX, strip){
  const { s, oy } = VIEW, Ly = layout(strip);
  Ly.segs.forEach((sg, i) => { const im = P.imgs[i], x = sg.r0, w = sg.rw; if(x + w < camX - 10 || x > camX + VIEW.viewW + 10) return;
    if(im) g.drawImage(i ? fadedLeft(im, OV / w) : im, (x - camX) * s, oy, w * s + 1, VH * s);
    else { const gr = g.createLinearGradient(0, oy, 0, oy + VH * s); gr.addColorStop(0, '#2a2530'); gr.addColorStop(.75, '#3a3530'); gr.addColorStop(1, '#1a1814'); g.fillStyle = gr; g.fillRect((x - camX) * s, oy, w * s + 1, VH * s); } });
}
