'use strict';
/* ---------- земля и полосы (лубок) ---------- */
let CAM = { x:0, w:960 };
const inView = (x, pad = 120) => x > CAM.x - pad && x < CAM.x + CAM.w + pad;
function ground(g, w, kind){
  shape(g, kind === 'bank' ? C.grass : C.grass, () => { g.moveTo(-10, GY); for(let x = 0; x <= w + 40; x += 40) g.lineTo(x, GY + Math.sin(x * .05) * 1.5); g.lineTo(w + 10, VH + 10); g.lineTo(-10, VH + 10); g.closePath(); }, 2);
  hatch(g, () => g.rect(CAM.x - 50, GY + 44, CAM.w + 100, VH), CAM.x - 50, GY + 44, CAM.x + CAM.w + 50, VH + 10, 11, C.grassD, 1.2, .8);
  if(kind === 'path'){ shape(g, C.earth, () => { g.moveTo(-10, GY + 6); for(let x = 0; x <= w + 60; x += 60) g.lineTo(x, GY + 6 + Math.sin(x / 150) * 3); g.lineTo(w + 10, GY + 34); for(let x = w; x >= -60; x -= 60) g.lineTo(x, GY + 34 + Math.sin(x / 110) * 3); g.closePath(); }, 1.8);
    const r = rng(9); for(let i = 0; i < w / 60; i++){ const x = r() * w, y = GY + 12 + r() * 16; if(inView(x)) shape(g, C.stone, () => g.ellipse(x, y, 4 + r() * 3, 2.4, 0, 0, Math.PI * 2), 1); } }
  if(kind === 'road'){ shape(g, C.greyL, () => g.rect(-10, GY + 6, w + 20, 42), 2); g.strokeStyle = C.ink; g.lineWidth = 1; g.beginPath(); const r = rng(4); for(let i = 0; i < w / 90; i++){ const x = r() * w; if(!inView(x)) continue; g.moveTo(x, GY + 14); g.lineTo(x + 12, GY + 22); g.lineTo(x + 6, GY + 32); } g.stroke(); }
  if(kind === 'asphalt'){ shape(g, '#23262c', () => g.rect(-10, GY + 6, w + 20, 44), 2); g.fillStyle = C.cream; for(let x = 0; x < w; x += 110) if(inView(x)) g.fillRect(x, GY + 26, 50, 4); }
  const r = rng(12); for(let x = 10; x < w; x += 34 + r() * 50){ const sc = .8 + r() * .7, c = r() < .5 ? C.grassD : C.greenD, fl = r(); if(!inView(x)) continue; tuft(g, x, GY + 3, sc, c); if(fl < .18) flower(g, x + 12, GY + 4, fl < .09 ? C.cin : C.white); }
}
const DRAW = {};
DRAW.village = g => {
  ground(g, 4400, 'path');
  if(inView(150, 300)){ for(const [x, hh] of [[40, 300], [130, 340], [220, 260]]) spruce(g, x, GY + 6, hh, C.spruce, C.spruceD); birch(g, 262, GY, 220); signpost(g, 320, 'Поле', -1); }
  if(inView(530, 400)) izba(g, 380, { w:310, h:160, winX:[34, 110, 256], door:220, boarded:true, lit: F('arrived') && V.phase >= 2, smoke:true, number:'7', paint:C.green });
  if(inView(900, 300)){ fence(g, 710, 1100); signpost(g, 1150, 'К реке', 1); fence(g, 1210, 1390); }
  if(inView(1535, 400)){ izba(g, 1400, { w:270, h:146, winX:[40, 210], door:160, lit: V.phase >= 1, smoke: V.phase !== 3, paint:C.cin });
    for(let i = 0; i < 6; i++){ const bx = 1418 + i * 18; g.strokeStyle = C.ink; g.lineWidth = 1; g.beginPath(); g.moveTo(bx + 3, GY - 150); g.lineTo(bx + 3, GY - 140); g.stroke(); shape(g, i % 2 ? C.greenL : C.olive, () => { g.moveTo(bx - 3, GY - 140); g.lineTo(bx + 9, GY - 140); g.lineTo(bx + 5, GY - 118 - (i % 3) * 4); g.lineTo(bx + 1, GY - 118 - (i % 3) * 4); g.closePath(); }, 1); } }
  if(inView(1780, 250)){ bench(g, 1700); wellSweep(g, 1860); }
  if(inView(2100, 200)){ birch(g, 2060, GY, 240); birch(g, 2130, GY, 200); }
  if(inView(2400, 400)) school(g, 2160);
  if(inView(2930, 300)) izba(g, 2810, { w:240, h:138, win:3, lit: V.phase >= 2, smoke:true, paint:C.blue });
  if(inView(3300, 500)){ fence(g, 3080, 3140); fence(g, 3200, 3370);
    rect(g, 3212, GY - 128, 140, 10, C.roof, 1.8); rect(g, 3220, GY - 118, 7, 118, C.logD, 1.6); rect(g, 3336, GY - 118, 7, 118, C.logD, 1.6);
    motorcycle(g, 3270);
    izba(g, 3390, { w:250, h:150, winX:[150, 200], door:110, lit: V.phase >= 2, paint:C.blue });
    if(V === st ? suitcaseVisible() : true) suitcase(g, 3438, GY, C.brown); }
  if(inView(3800, 400)){ laundry(g, 3570, 3720);
    const sw = appleTree(g, 3790, Math.sin(T * 1.4) * (V.phase === 1 || V.phase === 2 ? .35 : .05));
    if(npcsFor(V).some(n => n.id === 'varya')){ g.save(); g.translate(0, sw[1] - GY + 2); figure(g, sw[0], LOOKS.varya, { face:1, sit:true, noShadow:true }); g.restore(); }
    fence(g, 3660, 3740); }
  if(inView(4000, 300)){ banya(g, 3920); fence(g, 4060, 4090); signpost(g, 4200, 'Дорога', 1); for(const [x, hh] of [[4300, 280], [4380, 320]]) spruce(g, x, GY + 6, hh, C.spruce, C.spruceD); }
};
DRAW.road = g => {
  ground(g, 1800, 'road');
  if(inView(150, 300)){ for(const [x, hh] of [[30, 300], [110, 250], [190, 330]]) spruce(g, x, GY + 6, hh, C.spruce, C.spruceD); signpost(g, 260, 'Заветье', -1); }
  if(inView(540, 200)) birch(g, 540, GY, 230);
  const sx = 1090; rect(g, sx, GY - 4, 132, 12, C.stone, 1.8);
  if(VF('busstop')) busStop(g, sx + 6, 'new');
  else if(VF('rustystop')) busStop(g, sx + 6, 'rust');
  else if(VF('overgrown')){ for(let i = 0; i < 12; i++) shape(g, i % 2 ? C.grass : C.greenL, () => g.arc(sx + 6 + i * 11, GY + 2, 9 + (i * 7) % 6, Math.PI, 0), 1.4); }
  else { for(let i = 0; i < 4; i++) rect(g, sx + 14 + i * 32, GY - 14, 5, 10, '#8a4a2a', 1.2); flower(g, sx + 72, GY - 2, C.white); }
  rect(g, 1402, GY - 126, 6, 126, C.grey, 1.4); rect(g, 1370, GY - 142, 72, 28, C.cream, 1.8); g.fillStyle = C.ink; g.font = '700 13px Alegreya, serif'; g.fillText('ЗАВЕТЬЕ 2', 1378, GY - 123);
  signpost(g, 1740, 'Трасса 40', 1);
  if(V.bus) bus(g, V.bus.x);
};
DRAW.field = g => {
  ground(g, 2000, 'path');
  const r = rng(11);
  for(let i = 0; i < 220; i++){ const x = 250 + r() * 1750, hh = 44 + r() * 30; if(!inView(x, 40)) continue; const sw = Math.sin(T * 1.2 + x / 80) * 4;
    g.strokeStyle = C.ink; g.lineWidth = 2.6; g.beginPath(); g.moveTo(x, GY + 2); g.quadraticCurveTo(x + sw * .4, GY - hh * .5, x + sw, GY - hh); g.stroke(); g.strokeStyle = C.ryeD; g.lineWidth = 1.2; g.stroke();
    shape(g, i % 3 ? C.rye : C.gold, () => g.ellipse(x + sw, GY - hh - 6, 3.4, 8, .15, 0, Math.PI * 2), 1.2); }
  if(VF('noonDone') && inView(1100, 200)){ shape(g, C.cream, () => g.ellipse(1100, GY + 14, 130, 12, 0, 0, Math.PI * 2), 1.5); }
  if(inView(1560, 150)) scarecrow(g, 1560);
  if(inView(150, 350)){ for(const [x, hh] of [[20, 360], [95, 300], [160, 390], [225, 320], [50, 230]]) spruce(g, x, GY + 8, hh, C.spruce, C.spruceD);
    shape(g, C.cin, () => { g.moveTo(222, GY - 132); g.lineTo(236, GY - 128); g.lineTo(232, GY - 112); ol(g, 1.2); }, 0); g.strokeStyle = C.cin; g.lineWidth = 3; g.beginPath(); g.moveTo(220, GY - 130); g.lineTo(234, GY - 130); g.stroke();
    if(!npcsFor(V).some(n => n.id === 'leshy')) stump(g, 150); }
  if(inView(1900, 200)) signpost(g, 1900, 'Нижняя улица', 1);
};
DRAW.river = g => {
  shape(g, C.grass, () => g.rect(-10, GY - 2, 1520, 20), 2);
  const r = rng(3); for(let x = 10; x < 1500; x += 30 + r() * 30){ if(inView(x)) tuft(g, x, GY + 2, .8 + r() * .5, C.grassD); }
  shape(g, C.earth, () => { g.moveTo(110, GY + 4); g.quadraticCurveTo(170, GY - 30, 236, GY - 62); g.lineTo(262, GY - 62); g.quadraticCurveTo(206, GY - 22, 184, GY + 4); g.closePath(); }, 1.8);
  signpost(g, 272, 'В деревню', -1);
  for(const x of [400, 470, 1080, 1140, 1330]){ if(!inView(x)) continue; for(let i = 0; i < 7; i++){ const bx = x + i * 5; g.strokeStyle = C.ink; g.lineWidth = 3.2; g.beginPath(); g.moveTo(bx, GY + 12); g.quadraticCurveTo(bx + Math.sin(T + i) * 3, GY - 40, bx + i * 1.5 - 6, GY - 70 - (i % 3) * 14); g.stroke(); g.strokeStyle = C.greenL; g.lineWidth = 1.6; g.stroke();
    if(i % 3 === 0) shape(g, C.brown, () => g.ellipse(bx + i * 1.5 - 6, GY - 76 - (i % 3) * 14, 3, 9, 0, 0, Math.PI * 2), 1.2); } }
  rect(g, 760, GY - 6, 154, 9, C.logL, 1.8); for(const px of [770, 832, 898]) rect(g, px, GY + 2, 7, 58, C.logD, 1.4);
  g.fillStyle = C.ink; g.font = '700 12px Caveat, cursive'; g.fillText('вода берёт вещь', 774, GY - 10);
};
DRAW.forestroad = g => {
  ground(g, 1600, 'asphalt');
  for(const [x, hh] of [[40, 400], [140, 340], [240, 420], [1400, 380], [1500, 440], [1560, 320]]) if(inView(x, 200)) spruce(g, x, GY + 8, hh, C.spruce, C.spruceD);
  if(!V.outcome || V.outcome === 'truth') busStop(g, 880, 'old');
  if(['convenient','erase'].includes(V.outcome)) suitcase(g, 930, GY, C.brown);
};
/* интерьеры */
function room(g, w, o = {}){
  const rows = 14, lh = (GY - 40) / rows;
  for(let i = 0; i < rows; i++){ const y = 40 + i * lh; shape(g, i % 2 ? (o.wall || C.wall) : C.log, () => { g.moveTo(-5, y + lh); g.lineTo(-5, y + 2); g.quadraticCurveTo(w / 2, y - 2, w + 5, y + 2); g.lineTo(w + 5, y + lh); g.closePath(); }, 1.4);
    g.strokeStyle = C.logD; g.lineWidth = 1; g.beginPath(); const rr = (i * 131) % 300; g.moveTo(rr + 40, y + lh * .55); g.lineTo(rr + 110, y + lh * .55); g.moveTo(rr + 520, y + lh * .5); g.lineTo(rr + 600, y + lh * .5); g.stroke(); }
  rect(g, -5, -5, w + 10, 46, C.roofD, 2); for(let x = 60; x < w; x += 200) rect(g, x, 30, 18, 26, C.roof, 1.6);
  rect(g, -5, GY, w + 10, VH - GY + 10, C.earthD, 2); g.strokeStyle = C.ink; g.lineWidth = 1.2; g.beginPath(); for(let x = 0; x < w; x += 74){ g.moveTo(x, GY); g.lineTo(x - 30, VH); } g.stroke();
  for(const wx of o.windows || []){
    const bands = SKY[V.phase]; for(let i = 0; i < bands.length; i++){ g.fillStyle = bands[i]; g.fillRect(wx, 130 + i * 120 / bands.length, 92, 120 / bands.length + 1); }
    if(V.phase === 3){ moonCres(g, wx + 64, 160, 9); } if(V.phase <= 1) glow(wx + 46, 190, 220, .5, '255,250,225');
    rect(g, wx, 130, 92, 120, null, 2.2); g.strokeStyle = C.ink; g.lineWidth = 3; g.beginPath(); g.moveTo(wx + 46, 130); g.lineTo(wx + 46, 250); g.moveTo(wx, 186); g.lineTo(wx + 92, 186); g.stroke();
    shape(g, C.cream, () => { g.moveTo(wx - 12, 126); g.quadraticCurveTo(wx + 46, 92, wx + 104, 126); g.lineTo(wx + 104, 132); g.lineTo(wx - 12, 132); g.closePath(); }, 1.8);
    rect(g, wx - 12, 250, 116, 8, C.cream, 1.6);
    for(const s of [0, 1]){ const cx = s ? wx + 86 : wx - 14; shape(g, C.white, () => { g.moveTo(cx, 124); g.lineTo(cx + 20, 124); g.quadraticCurveTo(cx + 12, 200, cx + 18, 270); g.lineTo(cx, 270); g.closePath(); }, 1.6); g.fillStyle = C.cin; for(let k = 0; k < 5; k++) g.fillRect(cx + 4, 140 + k * 26, 8, 3); }
  }
  rect(g, 34, GY - 156, 70, 156, C.logD, 2); g.strokeStyle = C.ink; g.lineWidth = 1; g.beginPath(); for(let k = 1; k < 4; k++){ g.moveTo(34 + k * 17.5, GY - 154); g.lineTo(34 + k * 17.5, GY - 2); } g.stroke(); circ(g, 92, GY - 76, 3, C.gold, 1);
  if(o.rushnik){ const rx = o.rushnik; shape(g, C.white, () => { g.moveTo(rx, 70); g.lineTo(rx + 40, 70); g.lineTo(rx + 40, 170); g.lineTo(rx, 170); g.closePath(); }, 1.6); for(let k = 0; k < 3; k++){ rect(g, rx + 4, 136 + k * 10, 32, 4, C.cin, 0); } for(let k = 0; k < 4; k++){ shape(g, C.cin, () => { g.moveTo(rx + 5 + k * 9, 110); g.lineTo(rx + 9 + k * 9, 104); g.lineTo(rx + 13 + k * 9, 110); g.lineTo(rx + 9 + k * 9, 116); g.closePath(); }, .8); } g.strokeStyle = C.cin; g.lineWidth = 1.2; g.beginPath(); for(let k = 0; k < 9; k++){ g.moveTo(rx + 2 + k * 4.5, 170); g.lineTo(rx + 2 + k * 4.5, 180); } g.stroke(); }
}
function russianStove(g, x, fire){
  const w = 210, top = GY - 256;
  rect(g, x + 138, 38, 44, top - 30, C.plaster, 2);
  rect(g, x - 8, top - 10, w + 16, 16, C.plaster, 2);
  rect(g, x, top + 6, w, GY - top - 6, C.plaster, 2.2);
  for(const [tx, ty] of [[x + 24, top + 34], [x + 150, top + 34], [x + 24, top + 110], [x + 172, GY - 50]]){ for(let i = 0; i < 6; i++){ const a = i / 6 * Math.PI * 2; shape(g, i % 2 ? C.blue : C.cin, () => g.ellipse(tx + Math.cos(a) * 8, ty + Math.sin(a) * 8, 6, 3, a, 0, Math.PI * 2), 1); } circ(g, tx, ty, 3.2, C.gold, 1); }
  g.strokeStyle = C.blue; g.lineWidth = 2; g.beginPath(); g.moveTo(x + 8, top + 76); g.bezierCurveTo(x + 60, top + 60, x + 150, top + 92, x + w - 8, top + 72); g.stroke();
  shape(g, '#2a1d14', () => { g.moveTo(x + 52, GY - 62); g.lineTo(x + 52, GY - 124); g.quadraticCurveTo(x + 92, GY - 166, x + 132, GY - 124); g.lineTo(x + 132, GY - 62); g.closePath(); }, 2);
  rect(g, x + 30, GY - 64, 124, 10, C.plaster, 1.8);
  if(fire){ glow(x + 92, GY - 96, 300, 1.1);
    for(let i = 0; i < 5; i++){ const fx = x + 64 + i * 14, fh = 26 + Math.sin(T * 9 + i * 2) * 6 + (i % 2) * 8;
      shape(g, i % 2 ? C.gold : C.cin, () => { g.moveTo(fx - 8, GY - 66); g.quadraticCurveTo(fx - 8, GY - 66 - fh * .6, fx + Math.sin(T * 7 + i) * 3, GY - 66 - fh); g.quadraticCurveTo(fx + 8, GY - 66 - fh * .6, fx + 8, GY - 66); g.closePath(); }, 1.2); }
    for(let i = 0; i < 3; i++) rect(g, x + 66 + i * 20, GY - 72, 18, 7, C.logD, 1); }
}
function table(g, x, w, cloth){
  rect(g, x + 10, GY - 64, 8, 64, C.logD, 1.6); rect(g, x + w - 18, GY - 64, 8, 64, C.logD, 1.6);
  rect(g, x, GY - 76, w, 12, C.log, 1.8);
  if(cloth){ shape(g, C.white, () => { g.moveTo(x - 6, GY - 78); g.lineTo(x + w + 6, GY - 78); g.lineTo(x + w + 10, GY - 48); g.lineTo(x - 10, GY - 48); g.closePath(); }, 1.6); g.strokeStyle = C.cin; g.lineWidth = 2.5; g.beginPath(); g.moveTo(x - 9, GY - 54); g.lineTo(x + w + 9, GY - 54); g.stroke(); for(let k = 0; k < w / 16; k++) shape(g, C.cin, () => { const dx = x + 4 + k * 16; g.moveTo(dx, GY - 62); g.lineTo(dx + 4, GY - 66); g.lineTo(dx + 8, GY - 62); g.lineTo(dx + 4, GY - 58); g.closePath(); }, .6); }
}
function cup(g, x){ shape(g, C.white, () => { g.moveTo(x - 7, GY - 94); g.lineTo(x + 7, GY - 94); g.lineTo(x + 5, GY - 78); g.lineTo(x - 5, GY - 78); g.closePath(); }, 1.4); g.beginPath(); g.arc(x + 8, GY - 88, 4, -Math.PI / 2, Math.PI / 2); ol(g, 1.2); g.fillStyle = C.cin; g.fillRect(x - 6, GY - 90, 12, 2.4); }
function prialka(g, x){ rect(g, x - 26, GY - 12, 64, 12, C.logL, 1.6); shape(g, C.cin, () => { g.moveTo(x - 6, GY - 12); g.lineTo(x - 4, GY - 120); g.lineTo(x + 16, GY - 150); g.lineTo(x + 28, GY - 120); g.lineTo(x + 8, GY - 110); g.lineTo(x + 8, GY - 12); g.closePath(); }, 1.8); for(let k = 0; k < 3; k++) circ(g, x + 10, GY - 132 + k * 12, 3.2, C.gold, 1); }
DRAW.aglaya = g => {
  room(g, 1000, { windows:[470], rushnik:180 });
  prialka(g, 150);
  russianStove(g, 214, true);
  table(g, 480, 170, true); cup(g, 556); if(F('greeted')) cup(g, 582); if(F('hasNotebook')) rect(g, 604, GY - 86, 32, 7, C.brown, 1.2);
  if(V.phase >= 2){ rect(g, 616, GY - 102, 8, 24, C.white, 1.2); const f = Math.sin(T * 11) * 1.2; shape(g, C.gold, () => g.ellipse(620 + f * .4, GY - 108, 3.2, 7, 0, 0, Math.PI * 2), 1); glow(620, GY - 104, 180, .9); }
  rect(g, 700, 202, 140, 9, C.logD, 1.6); rect(g, 700, 264, 140, 9, C.logD, 1.6);
  const cols = [C.cin, C.blue, C.ochre, C.green, C.brown]; for(let i = 0; i < 10; i++){ if(i === 6 && !F('hasNotebook')){ rect(g, 710 + i * 12, 196, 10, 6, C.cream, .8); continue; } if(i === 6) continue; rect(g, 710 + i * 12, 174, 10, 28, cols[i % 5], 1.2); }
  rect(g, 760, 240, 30, 24, C.cream, 1.4); circ(g, 775, 250, 7, C.white, 1.2);
  rect(g, 846, GY - 50, 146, 12, C.log, 1.8); rect(g, 852, GY - 38, 8, 38, C.logD, 1.4); rect(g, 978, GY - 38, 8, 38, C.logD, 1.4);
  shape(g, F('greeted') ? C.blueL : C.cin, () => g.rect(856, GY - 64, 118, 14), 1.6); g.fillStyle = C.cream; for(let k = 0; k < 7; k++) g.fillRect(862 + k * 16, GY - 59, 6, 4);
};
DRAW.grunya = g => {
  room(g, 1000, { windows:[560], rushnik:380 });
  for(let i = 0; i < 20; i++){ const x = 130 + i * 40; g.strokeStyle = C.ink; g.lineWidth = 1; g.beginPath(); g.moveTo(x, 42); g.lineTo(x, 52); g.stroke(); shape(g, [C.greenL, C.olive, C.ochre][i % 3], () => { g.moveTo(x - 8, 52); g.lineTo(x + 8, 52); g.lineTo(x + 3, 96 + (i * 17) % 26); g.lineTo(x - 3, 96 + (i * 17) % 26); g.closePath(); }, 1.2); rect(g, x - 7, 52, 14, 4, C.cin, .8); }
  rect(g, 186, GY - 118, 118, 118, C.cin, 2); for(let k = 0; k < 3; k++){ rect(g, 194, GY - 110 + k * 36, 102, 30, C.cinD, 1.4); circ(g, 245, GY - 95 + k * 36, 3, C.gold, 1); } rect(g, 180, GY - 124, 130, 8, C.white, 1.4);
  table(g, 340, 200, true);
  g.strokeStyle = C.ink; g.lineWidth = 1.5; g.beginPath(); g.moveTo(440, 40); g.lineTo(440, 176); g.stroke();
  shape(g, C.gold, () => { g.moveTo(424, 194); g.lineTo(456, 194); g.lineTo(450, 178); g.lineTo(430, 178); g.closePath(); }, 1.6); shape(g, '#fff0b0', () => g.ellipse(440, 204, 10, 12, 0, 0, Math.PI * 2), 1.4); glow(440, 204, 300, 1);
  russianStove(g, 760, V.phase === 2);
};
DRAW.laptev = g => {
  room(g, 1000, { windows:[430] });
  rect(g, 248, 206, 96, 76, C.logD, 2); rect(g, 256, 214, 80, 60, C.white, 1.4); g.strokeStyle = C.ink; g.lineWidth = 1; g.beginPath(); for(let i = 0; i < 6; i++){ g.moveTo(262, 226 + i * 8); g.lineTo(312 - (i % 2) * 14, 226 + i * 8); } g.stroke(); g.strokeStyle = C.cin; g.lineWidth = 2; g.beginPath(); g.ellipse(302, 250, 13, 6, 0, 0, Math.PI * 2); g.stroke();
  g.strokeStyle = 'rgba(28,22,17,.6)'; g.lineWidth = 1; g.beginPath(); g.moveTo(262, 218); g.lineTo(330, 268); g.stroke();
  rect(g, 130, 150, 100, 8, C.logD, 1.4); for(const [x, c] of [[146, C.olive], [178, C.indigo], [206, C.brown]]){ shape(g, c, () => { g.moveTo(x - 12, 162); g.lineTo(x + 12, 162); g.lineTo(x + 16, 290); g.lineTo(x - 16, 290); g.closePath(); }, 1.6); }
  table(g, 510, 140, true); rect(g, 560, GY - 98, 30, 20, C.cin, 1.2);
  rect(g, 660, 40, 18, GY - 40, C.logD, 2);
  rect(g, 786, GY - 226, 118, 226, C.blueL, 2.2); for(let y = GY - 222; y < GY; y += 24) for(let x = 790; x < 900; x += 24){ rect(g, x, y, 20, 20, C.white, 1); circ(g, x + 10, y + 10, 4, C.blue, .8); }
  rect(g, 700, GY - 44, 70, 44, C.log, 1.8);
};
DRAW.school = g => {
  room(g, 1000, { windows:[150, 840], wall:'#8fae9c' });
  rect(g, 294, 104, 312, 158, C.logD, 2.2); rect(g, 302, 112, 296, 142, '#2e4a3a', 1.6);
  g.fillStyle = 'rgba(245,240,225,.85)'; g.font = '600 25px Caveat, cursive'; g.fillText('Present Perfect', 320, 148); g.fillText('I have lost. I have found.', 320, 190); g.font = '600 17px Caveat, cursive'; g.fillText('12.06.2004', 498, 240);
  rect(g, 640, 116, 126, 150, C.white, 1.8); g.fillStyle = C.violet || '#43378a'; g.fillStyle = '#43378a'; g.font = '600 17px Caveat, cursive'; g.fillText('What will I be?', 652, 138);
  for(let i = 0; i < 6; i++) rect(g, 652 + (i % 3) * 36, 150 + Math.floor(i / 3) * 54, 28, 34, C.greyL, 1.2);
  for(let i = 0; i < 4; i++){ rect(g, 246 + i * 150, GY - 66, 116, 10, C.log, 1.6); rect(g, 252 + i * 150, GY - 56, 7, 56, C.logD, 1.2); rect(g, 348 + i * 150, GY - 56, 7, 56, C.logD, 1.2); }
  rect(g, 828, GY - 84, 150, 12, C.logL, 1.8); rect(g, 836, GY - 72, 10, 72, C.logD, 1.4); rect(g, 958, GY - 72, 10, 72, C.logD, 1.4);
};
DRAW.flat = g => {
  rect(g, -5, -5, 1010, GY + 5, '#c9b89a', 2); for(let x = 0; x < 1000; x += 40){ for(let y = 20; y < GY; y += 40){ const k = ((x + y) / 40) % 2; shape(g, k ? '#b8a684' : null, () => { g.moveTo(x + 20, y - 6); g.lineTo(x + 26, y); g.lineTo(x + 20, y + 6); g.lineTo(x + 14, y); g.closePath(); }, 0); } }
  rect(g, -5, GY, 1010, VH - GY + 10, C.logD, 2);
  const bands = SKY[2]; for(let i = 0; i < bands.length; i++){ g.fillStyle = bands[i]; g.fillRect(560, 110 + i * 190 / bands.length, 220, 190 / bands.length + 1); }
  const r = rng(5); for(let i = 0; i < 10; i++){ const bx = 562 + r() * 196, bh = 50 + r() * 110, bw = 16 + r() * 18; rect(g, bx, 300 - bh, bw, bh, '#3a3050', 1.2); for(let k = 0; k < 4; k++) if(r() > .45) { g.fillStyle = '#ffd35a'; g.fillRect(bx + 3 + r() * (bw - 8), 304 - bh + r() * (bh - 12), 4, 4); } }
  rect(g, 560, 110, 220, 190, null, 3); g.strokeStyle = C.ink; g.lineWidth = 4; g.beginPath(); g.moveTo(670, 110); g.lineTo(670, 300); g.stroke(); rect(g, 548, 300, 244, 12, C.white, 1.8);
  rect(g, 200, 88, 200, GY - 88, C.logL, 2.2); g.strokeStyle = C.ink; g.lineWidth = 2; g.beginPath(); g.moveTo(300, 92); g.lineTo(300, GY); g.stroke(); circ(g, 290, 260, 4, C.gold, 1); circ(g, 310, 260, 4, C.gold, 1);
  rect(g, 244, 62, 112, 28, C.log, 1.8); g.strokeStyle = C.cin; g.lineWidth = 3; g.beginPath(); g.moveTo(300, 62); g.lineTo(300, 90); g.stroke();
  table(g, 470, 150, false); rect(g, 494, GY - 118, 44, 42, C.logL, 1.6); rect(g, 548, GY - 100, 52, 24, C.cream, 1.4);
  rect(g, 876, 150, 5, GY - 150, C.ink, 0); shape(g, C.gold, () => { g.moveTo(856, 152); g.lineTo(902, 152); g.lineTo(892, 124); g.lineTo(866, 124); g.closePath(); }, 1.8); rect(g, 856, GY - 8, 46, 8, C.ink, 0); glow(878, 170, 240, 1);
};

/* ---------- частицы ---------- */
const PARTS = [];
/* ---------- погода — по сюжету, а не случайно ----------
   rain — дождь 0..1, fog — сколько тумана, grey — серый «обычный» день, wet — мокро после дождя */
const WEATHER = {
  0:[ {}, {}, { rain:.35, grey:.5 }, { wet:1, fog:1.1 } ],                       // пролог: морось на дороге
  1:[ { fog:1.25 }, { grey:.3 }, { rain:.3, grey:.4 }, { wet:1 } ],              // среда: холодное туманное утро, вечером морось
  2:[ { rain:.25, grey:.6 }, { grey:.6 }, { rain:.7, grey:.6 }, { wet:1, fog:1.2 } ],   // четверг: серый, вечером дождь, ночь после дождя
  3:[ { fog:1.4 }, { fog:1.15, grey:.4 }, { rain:.3, grey:.4 }, { rain:.5 } ],   // пятница: туман
  4:[ { fog:1.5 }, { fog:1.15 }, { rain:.6, grey:.5 }, { wet:1 } ],               // суббота: в 6:40 туман стоит стеной
  5:[ { fog:1.1 }, {}, {}, {} ],
};
function weatherOf(v){
  const S0 = STRIPS[v.strip]; if(!S0 || S0.frozen || v.strip === 'flat') return { rain:0, fog:1, grey:0, wet:0 };
  let w = Object.assign({ rain:0, fog:1, grey:0, wet:0 }, (WEATHER[v.day] || WEATHER[5])[v.phase] || {});
  if(v.outcome === 'truth' && v.day >= 4) w = { rain:0, fog:.8, grey:0, wet:w.wet };        // после правды — ясно
  if(['convenient','erase'].includes(v.outcome)) w = { rain:0, fog:1.35, grey:.6, wet:0 };     // удобная ложь — мёртвый штиль и туман
  return w;
}
let WX = { rain:0, fog:1, grey:0, wet:0 };
const RAIN = [];
function drawRain(g, k, dt){
  const { cw, ch } = VIEW, n = Math.round(220 * k * Math.min(1.5, cw / 1400));
  while(RAIN.length < n) RAIN.push({ x:Math.random() * cw, y:Math.random() * ch, l:10 + Math.random() * 16, v:900 + Math.random() * 500 });
  RAIN.length = Math.min(RAIN.length, n);
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.strokeStyle = 'rgba(210,218,228,.28)'; g.lineWidth = Math.max(1, VIEW.dpr * .8); g.beginPath();
  for(const r of RAIN){ r.y += r.v * dt; r.x -= r.v * dt * .18; if(r.y > ch){ r.y = -r.l; r.x = Math.random() * (cw + 200); } g.moveTo(r.x, r.y); g.lineTo(r.x + r.l * .18 * VIEW.dpr, r.y - r.l * VIEW.dpr); }
  g.stroke(); g.restore();
}
let lastDraw = 0;
function tickParticles(dt, v, camX, viewW){
  const indoor = STRIPS[v.strip].indoor;
  while(PARTS.length < 34) PARTS.push({ x: camX + Math.random() * viewW, y: 120 + Math.random() * 300, vx: (Math.random() - .5) * 8, vy: (Math.random() - .5) * 4, t: Math.random() * 10 });
  for(const p of PARTS){ p.t += dt; p.x += (p.vx + (indoor ? 0 : 5)) * dt; p.y += (p.vy + Math.sin(p.t) * 3) * dt;
    if(p.x < camX - 40 || p.x > camX + viewW + 40 || p.y < 60 || p.y > GY + 40){ p.x = camX + Math.random() * viewW; p.y = 120 + Math.random() * 300; } }
}
function drawParticles(g, v){
  const ph = phaseOf(v), indoor = STRIPS[v.strip].indoor;
  for(const p of PARTS){
    if(ph === 3 && !indoor){ const a = Math.max(0, Math.sin(p.t * 1.7)); if(a < .05) continue; glow(p.x, p.y + 80, 14, a * .8, '255,230,120'); circ(g, p.x, p.y + 80, 2, '#ffe68a', .8); }
    else if(ph === 2 && !indoor){ g.fillStyle = 'rgba(255,220,160,.5)'; g.fillRect(p.x, p.y, 2, 2); }
    else if(ph === 1 && !indoor){ circ(g, p.x, p.y, 1.6, '#fff4c8', 0); }
    else if(indoor){ g.fillStyle = 'rgba(255,240,200,.35)'; g.fillRect(p.x, p.y, 1.8, 1.8); }
  }
}

/* =====================================================================
   КАДР
   ===================================================================== */
const cv = document.getElementById('cv'), g0 = cv.getContext('2d');
const refl = document.createElement('canvas'), rg = refl.getContext('2d');
let VIEW = { s:1, oy:0, viewW:960, cw:0, ch:0, dpr:1 };
const annaHist = [];
function resize(){
  const dpr = Math.min(2, window.devicePixelRatio || 1), cw = Math.round(innerWidth * dpr), ch = Math.round(innerHeight * dpr);
  if(cv.width !== cw || cv.height !== ch){ cv.width = cw; cv.height = ch; refl.width = cw; refl.height = ch; for(const k in tiles) delete tiles[k]; }
  const portrait = cw < ch, s = Math.min(ch / VH, cw / (portrait ? 400 : 620));
  VIEW = { s, oy: portrait ? Math.max(0, (ch - VH * s) * .3) : ch - VH * s, viewW: cw / s, cw, ch, dpr };
}
function drawFrame(v, camX, anna){
  const { s, oy, cw, ch } = VIEW, g = g0, strip = STRIPS[v.strip];
  V = v; const savedPhase = v.phase; if(strip.frozen) v.phase = 0;
  try{
  const ph = v.phase; C = palette(ph); GLOWS = []; CAM = { x:camX, w:VIEW.viewW };
  const P = artParts(v.strip, ph);
  if(P) return drawArtFrame(v, camX, anna, P, ph);
  if(artPending(v.strip)){ g.setTransform(1, 0, 0, 1, 0, 0); const gr = g.createLinearGradient(0, 0, 0, ch); gr.addColorStop(0, '#14161b'); gr.addColorStop(1, '#0b0b0e'); g.fillStyle = gr; g.fillRect(0, 0, cw, ch); drawFog(g, ph, camX, .6); return; }
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
  const world = () => g.setTransform(s, 0, 0, s, -camX * s, oy);
  if(!strip.indoor){
    const bands = SKY[ph], top = 0, bot = oy + 400 * s;
    for(let i = 0; i < bands.length; i++){ g.fillStyle = bands[i]; const y0 = i === 0 ? 0 : bot * (i / bands.length) ** .8, y1 = bot * ((i + 1) / bands.length) ** .8; g.fillRect(0, y0, cw, y1 - y0 + (i === bands.length - 1 ? ch : 1)); }
    g.setTransform(s, 0, 0, s, 0, oy);
    const vw = VIEW.viewW;
    if(ph === 3){ const r = rng(77); for(let i = 0; i < 38; i++){ const x = r() * vw, y = -oy / s + r() * (oy / s + 280), tw = .7 + Math.sin(T * 2 + i) * .3; star(g, x, y, (2.5 + r() * 3) * tw); } moonCres(g, vw * .76, 90, 24); }
    else if(ph === 0) sunDisc(g, vw * .18, 250, 22, ph);
    else if(ph === 1) sunDisc(g, vw * .58, 70, 28, ph);
    else if(ph === 2) sunDisc(g, vw * .8, 300, 34, ph);
    const ccol = ['#f7f1e2', '#fdf8ea', '#f3bc8e', '#3e4c80'][ph];
    for(let i = 0; i < 4; i++){ const span = vw + 500, cx = ((i * 430 + T * 5 - camX * .06) % span + span) % span - 250, cy = 60 + i * 42 + (i % 2) * 20; cloud(g, cx, cy, 140 + (i % 3) * 50, ccol, 1.8); }
    g.setTransform(1, 0, 0, 1, 0, 0);
    const fs = [.12, .3, .6];
    strip.layers.forEach((k, i) => drawTile(g, k, ph, s, camX, fs[i] ?? .6, oy, cw));
  } else { g.fillStyle = '#1c1611'; g.fillRect(0, 0, cw, ch); }
  world();
  DRAW[v.strip](g);
  const npcs = npcsFor(v); for(const n of npcs) if(n.id !== 'varya') drawNpc(g, n);
  if(strip.water){
    const wy = oy + (GY + 16) * s; g.setTransform(1, 0, 0, 1, 0, 0);
    rg.setTransform(1, 0, 0, 1, 0, 0); rg.clearRect(0, 0, cw, ch); rg.drawImage(cv, 0, 0);
    g.fillStyle = C.water; g.fillRect(0, wy, cw, ch - wy);
    g.save(); g.globalAlpha = .38; g.translate(0, wy * 2); g.scale(1, -1); g.drawImage(refl, 0, 0, cw, wy, 0, 0, cw, wy); g.restore();
    if(anna){ const lag = v.flags.reflection ? annaHist[0] || anna : anna; g.save(); g.globalAlpha = .45; g.setTransform(s, 0, 0, -s, -camX * s, wy * 2 - oy); annaDraw(g, lag.x, lag.dir, lag.move, lag.ph); g.restore(); }
    g.setTransform(s, 0, 0, s, -camX * s, oy);
    g.strokeStyle = C.white; g.lineWidth = 1.6; for(let row = 0; row < 5; row++){ const y = GY + 30 + row * 20; g.beginPath(); for(let x = Math.floor(camX / 40) * 40 - 40; x < camX + VIEW.viewW + 40; x += 40){ const xx = x + ((row % 2) * 20) + Math.sin(T * .8 + row) * 6; g.moveTo(xx, y); g.quadraticCurveTo(xx + 8, y - 6, xx + 16, y); } g.stroke(); }
    g.strokeStyle = C.ink; g.lineWidth = 2; g.beginPath(); g.moveTo(camX - 50, GY + 16); g.lineTo(camX + VIEW.viewW + 50, GY + 16); g.stroke();
  }
  world();
  drawFx(g);
  if(anna) annaDraw(g, anna.x, anna.dir, anna.move, anna.ph);
  drawFx(g, true);
  if(anna && ph === 3) glow(anna.x, GY - 70, strip.indoor ? 130 : 170, .8);
  drawParticles(g, v);
  g.setTransform(1, 0, 0, 1, 0, 0);
  if(oy + VH * s < ch){ g.fillStyle = strip.indoor ? C.earthD : C.grassD; g.fillRect(0, oy + VH * s - 1, cw, ch); }
  if(!strip.indoor) drawTile(g, 'fg', ph, s, camX, 1.2, oy, cw);
  if(ph >= 2 || strip.indoor){
    g.globalCompositeOperation = 'lighter';
    for(const L of GLOWS){ const x = (L.x - camX) * s, y = oy + L.y * s, r = L.r * s; if(r <= 0 || x < -r || x > cw + r) continue; const gr = g.createRadialGradient(x, y, 0, x, y, r); const a = (ph === 3 ? .34 : ph === 2 ? .2 : .16) * L.a; gr.addColorStop(0, `rgba(${L.col},${a})`); gr.addColorStop(1, `rgba(${L.col},0)`); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
    g.globalCompositeOperation = 'source-over';
  }
  if(!strip.indoor && v.strip !== 'flat') drawFog(g, ph, camX, .55);
  if(ph === 0 && !strip.indoor){ const fg = g.createLinearGradient(0, oy + 300 * s, 0, oy + 460 * s); fg.addColorStop(0, 'rgba(240,244,246,0)'); fg.addColorStop(1, 'rgba(240,244,246,.28)'); g.fillStyle = fg; g.fillRect(0, oy + 300 * s, cw, 160 * s); }
  } finally { v.phase = savedPhase; }
}

/* кадр с живописным фоном: фон-картина, силуэты или спрайты, туман, цветокоррекция */
function drawArtFrame(v, camX, anna, P, ph){
  const { s, oy, cw, ch } = VIEW, g = g0, strip = STRIPS[v.strip], a = STRIP_ART[v.strip], k = a.charScale || 1, rx = x => R(v.strip, x);
  g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#0b0b0e'; g.fillRect(0, 0, cw, ch);
  drawArtStrip(g, P, camX, v.strip);
  if(oy + VH * s < ch){ g.fillStyle = '#101014'; g.fillRect(0, oy + VH * s - 1, cw, ch); }
  WX = weatherOf(v);
  const fogK = (strip.indoor ? .12 : ph === 0 ? .55 : .9) * (strip.indoor ? 1 : WX.fog);
  // дальний туман — за героями, ближний — полупрозрачно поверх, чтобы фигуры не тонули
  if(!a.bright){ g.setTransform(1, 0, 0, 1, 0, 0); drawFog(g, ph, camX, fogK, 'back'); }
  g.setTransform(s, 0, 0, s, -camX * s, oy);
  // герои рисуются на отдельный слой и подкрашиваются светом сцены (огонь, туман, закат)
  const tint = LOWQ.off ? null : charTint(v.strip, ph), lc = tint ? charLayer(cw, ch) : null;
  if(anna && tint) sampleScene(g, (rx(anna.x) - camX) * s, oy + (GY - 124 * k) * s, 124 * k * s, v.strip + ph);
  const drawChars = g => {
  SIL = a.bright ? 'rgba(40,34,30,.9)' : strip.indoor ? 'rgba(22,16,12,.92)' : 'rgba(14,15,20,.9)';
  try{
    drawFx(g);
    const at = x => { g.setTransform(s * k, 0, 0, s * k, (x - camX) * s - x * s * k, oy + GY * s * (1 - k)); };
    for(const n of npcsFor(v)){ const m = { ...n, x:rx(n.x) }; at(m.x); if(n.id === 'young' && v.strip === 'forestroad' && artParts('forestroad', 0)){ g.translate(m.x, GY); g.scale(.8, .8); g.translate(-m.x, -GY - 100); } if(n.id === 'varya' && !IMG.s_varya){ figure(g, m.x, LOOKS.varya, { face:1 }); continue; } drawNpc(g, m); }
    if(v.strip === 'road'){ const sx = rx(spot('road', 'Бетонная плита', 1150)) - 60;
      if(v.flags.busstop){ at(sx); busStop(g, sx + 6, 'new'); } else if(v.flags.rustystop){ at(sx); busStop(g, sx + 6, 'rust'); } }
    if(anna){ at(rx(anna.x)); annaDraw(g, rx(anna.x), anna.dir, anna.move, anna.ph); }
    if(v.strip === 'road' && v.bus && IMG.s_bus){ const bx = rx(v.bus.x) + 190, im = IMG.s_bus, h = 185, w = im.width / im.height * h, face = v.bus.mode === 'leave' ? 1 : -1;
      at(bx); const sv = SIL; SIL = null; g.save(); g.translate(bx, GY + 8); g.scale(face, 1); g.drawImage(im, -w / 2, -h, w, h); g.restore();
      const hx = bx + face * w / 2, cone = g.createLinearGradient(hx, 0, hx + face * 260, 0); cone.addColorStop(0, 'rgba(255,236,180,.32)'); cone.addColorStop(1, 'rgba(255,236,180,0)');
      g.fillStyle = cone; g.beginPath(); g.moveTo(hx, GY - 36); g.lineTo(hx + face * 260, GY - 80); g.lineTo(hx + face * 260, GY + 10); g.closePath(); g.fill(); SIL = sv; }
    else if(v.strip === 'road' && v.bus){ const bx = rx(v.bus.x); at(bx); bus(g, bx);
      // в тумане у автобуса видны только тёплые окна, фары и габариты
      const sv = SIL; SIL = null; const y = GY - 20, h = 124;
      g.globalAlpha = .55; for(let i = 0; i < 5; i++){ g.fillStyle = 'rgba(247,207,106,.55)'; g.fillRect(bx + 14 + i * 48, y - h + 18, 40, 36); }
      g.globalAlpha = 1; g.fillStyle = '#fff0b8'; g.fillRect(bx + 261, y - 32, 7, 12); g.fillStyle = '#ff5a3c'; g.fillRect(bx + 2, y - 30, 7, 11);
      const cone = g.createLinearGradient(bx + 268, 0, bx + 520, 0); cone.addColorStop(0, 'rgba(255,240,190,.35)'); cone.addColorStop(1, 'rgba(255,240,190,0)');
      g.fillStyle = cone; g.beginPath(); g.moveTo(bx + 268, y - 30); g.lineTo(bx + 520, y - 70); g.lineTo(bx + 520, y + 20); g.closePath(); g.fill();
      SIL = sv; }
    g.setTransform(s, 0, 0, s, -camX * s, oy);
    drawFx(g, true);
  } finally { SIL = null; }
  };
  if(lc){
    // работаем только в полосе, где стоят герои: так в разы быстрее
    const xs = []; if(anna) xs.push(rx(anna.x)); for(const n of npcsFor(v)) xs.push(rx(n.x)); if(v.bus) xs.push(rx(v.bus.x) + 190);
    const lo = xs.length ? Math.min(...xs) : camX, hi = xs.length ? Math.max(...xs) : camX;
    const X0 = Math.max(0, Math.floor((lo - 220 - camX) * s)), X1 = Math.min(cw, Math.ceil((hi + 220 - camX) * s));
    const Y0 = Math.max(0, Math.floor(oy + (GY - 300 * Math.max(1, k)) * s)), Y1 = Math.min(ch, Math.ceil(oy + (GY + 30) * s));
    const BW = Math.max(1, X1 - X0), BH = Math.max(1, Y1 - Y0);
    const L = lc.getContext('2d'); L.setTransform(1, 0, 0, 1, 0, 0); L.globalCompositeOperation = 'source-over'; L.clearRect(X0, Y0, BW, BH);
    L.save(); L.beginPath(); L.rect(X0, Y0, BW, BH); L.clip();
    L.setTransform(s, 0, 0, s, -camX * s, oy); drawChars(L); L.restore();
    L.setTransform(1, 0, 0, 1, 0, 0);
    const mk = maskLayer(cw, ch), M = mk.getContext('2d'); M.globalCompositeOperation = 'copy'; M.drawImage(lc, X0, Y0, BW, BH, X0, Y0, BW, BH);
    // 1) яркость как у фона вокруг (герой не светится ярче сцены), 2) немного цвета самой сцены
    const SC = SCENE_LIGHT, f = SC.f;
    if(f < .99){ L.globalCompositeOperation = 'multiply'; const q = Math.round(255 * f); L.fillStyle = `rgb(${q},${q},${q})`; L.fillRect(X0, Y0, BW, BH); }
    L.globalCompositeOperation = 'color'; L.fillStyle = `rgba(${SC.r},${SC.g},${SC.b},.22)`; L.fillRect(X0, Y0, BW, BH);
    L.globalCompositeOperation = 'soft-light'; L.fillStyle = `rgba(${SC.r},${SC.g},${SC.b},.3)`; L.fillRect(X0, Y0, BW, BH);
    if(a.bright && anna){ // светлая квартира: свет из окна справа — чуть больше контраста, тёплый тон, теневая сторона слева
      L.globalCompositeOperation = 'overlay'; L.globalAlpha = .3; L.drawImage(mk, X0, Y0, BW, BH, X0, Y0, BW, BH); L.globalAlpha = 1;
      L.globalCompositeOperation = 'multiply'; L.fillStyle = 'rgb(232,208,180)'; L.fillRect(X0, Y0, BW, BH);
      const ax = (rx(anna.x) - camX) * s, hw = 46 * k * s, gr = L.createLinearGradient(ax - hw, 0, ax + hw, 0);
      gr.addColorStop(0, 'rgba(70,50,40,.55)'); gr.addColorStop(.6, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      L.fillStyle = gr; L.fillRect(X0, Y0, BW, BH); }
    if(!strip.indoor && !a.bright){ L.globalCompositeOperation = 'source-over'; L.fillStyle = `rgba(${SC.r},${SC.g},${SC.b},.18)`; L.fillRect(X0, Y0, BW, BH); } // воздух между зрителем и героем
    if(anna && !window.NODIR){ // свет сцены сбоку: со стороны печи/окна/заката — тёплый отсвет, с другой — тень
      const sd = SC.side, D = sd.lR - sd.lL, st2 = Math.min(1, Math.abs(D) * 4), lit = D > 0 ? 1 : -1;
      if(st2 > .05){ const ax = (rx(anna.x) - camX) * s, hw = 34 * k * s, c = lit > 0 ? sd.cR : sd.cL, m = Math.max(...c, 1), lc2 = c.map(v => Math.round(v / m * 255)).join(',');
        const gr = L.createLinearGradient(ax - 3 * hw * lit, 0, ax + 3 * hw * lit, 0); // 0 — тёмная сторона, 1 — светлая
        gr.addColorStop(0, 'rgba(40,36,40,0)'); gr.addColorStop(.3, `rgba(40,36,40,${.45 * st2})`); gr.addColorStop(.5, 'rgba(128,128,128,0)');
        gr.addColorStop(.62, `rgba(${lc2},${.3 * st2})`); gr.addColorStop(.72, `rgba(${lc2},${.45 * st2})`); gr.addColorStop(1, `rgba(${lc2},0)`);
        L.globalCompositeOperation = 'soft-light'; L.fillStyle = gr; L.fillRect(X0, Y0, BW, BH); } }
    L.globalCompositeOperation = 'destination-in'; L.drawImage(mk, X0, Y0, BW, BH, X0, Y0, BW, BH);
    if(!LOWQ.on) lightWrap(L, g.canvas, lc, X0, Y0, BW, BH, s);
    if(tint[1]){ L.globalCompositeOperation = 'source-atop'; const gr = L.createLinearGradient(0, oy, 0, oy + VH * s); gr.addColorStop(0, tint[1]); gr.addColorStop(1, 'rgba(0,0,0,0)'); L.fillStyle = gr; L.fillRect(X0, Y0, BW, BH); }
    if(tint[2] && !LOWQ.on && window.RIM){ // контровой свет: светлая кромка с той стороны, откуда падает свет
      const [col, side] = tint[2], rim = rimLayer(cw, ch), Rm = rim.getContext('2d'), dx = -side * Math.max(1, 1.5 * s);
      Rm.globalCompositeOperation = 'copy'; Rm.drawImage(lc, X0, Y0, BW, BH, X0, Y0, BW, BH);
      Rm.globalCompositeOperation = 'source-in'; Rm.fillStyle = col; Rm.fillRect(X0, Y0, BW, BH);
      Rm.globalCompositeOperation = 'destination-out'; Rm.drawImage(lc, X0, Y0, BW, BH, X0 + dx, Y0, BW, BH);
      L.globalCompositeOperation = 'source-atop'; L.drawImage(rim, X0, Y0, BW, BH, X0, Y0, BW, BH); }
    L.globalCompositeOperation = 'source-over'; g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(lc, X0, Y0, BW, BH, X0, Y0, BW, BH);
    if(!LOWQ.on && ['village', 'road', 'forestroad', 'river'].includes(v.strip)){ // отражение в мокрой земле и лужах
      const yG = oy + GY * s + 2, h = Math.min(BH, Math.max(0, yG - Y0)); if(h > 0){ g.save(); g.globalAlpha = WX.wet || WX.rain ? .2 : .12; g.translate(0, 2 * yG); g.scale(1, -1); g.drawImage(lc, X0, yG - h, BW, h, X0, yG - h, BW, h); g.restore(); } }
    g.setTransform(s, 0, 0, s, -camX * s, oy); }
  else drawChars(g);
  drawParticles(g, v);
  g.setTransform(1, 0, 0, 1, 0, 0);
  if(!a.bright) drawFog(g, ph, camX, fogK * .45, 'front');
  { const now = performance.now(), dt = Math.min(.05, (now - (lastDraw || now)) / 1000); lastDraw = now; if(WX.rain && !strip.indoor) drawRain(g, WX.rain, dt); }
  gradeArt(g, ph, P.nightArt, a.bright, strip.indoor, WX);
  if(ph >= 2 && !P.nightArt) drawArtLights(g, camX, v.strip, ph === 3 ? .95 : .4);
  if(GLOWS.length){ g.globalCompositeOperation = 'lighter'; for(const L of GLOWS){ const x = (L.x - camX) * s, y = oy + L.y * s, r = L.r * s; if(r <= 0) continue; const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${L.col},${.3 * L.a})`); gr.addColorStop(1, `rgba(${L.col},0)`); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); } g.globalCompositeOperation = 'source-over'; }
}
