'use strict';
/* ---------- звук: три канала со своей громкостью ----------
   Музыка — колыбельная, гусли, гул остановки. Атмосфера — ветер, вода, птицы, дождь.
   Эффекты — шаги, двери, страницы, мотор. Громкость — из меню (SET). */
const AU = { ctx:null, muted:false, out:null };
const volCurve = v => Math.pow(Math.max(0, Math.min(100, v)) / 100, 1.6);
function applyVolumes(){ if(!AU.ctx) return; const t = AU.ctx.currentTime; AU.music.gain.setTargetAtTime(volCurve(SET.music), t, .05); AU.amb.gain.setTargetAtTime(volCurve(SET.amb), t, .05); AU.fx.gain.setTargetAtTime(volCurve(SET.fx), t, .05); }
/* звуки, созданные внутри onBus, идут в нужный канал */
function onBus(bus, fn){ const prev = AU.out; AU.out = bus; try{ fn(); } finally { AU.out = prev; } }
function audioInit(){
  if(AU.ctx) return;
  try{ AU.ctx = new (window.AudioContext || window.webkitAudioContext)({ latencyHint:'interactive' }); }catch(e){ return; }
  const c = AU.ctx; AU.master = c.createGain(); AU.master.gain.value = .9; AU.master.connect(c.destination);
  for(const k of ['music','amb','fx']){ AU[k] = c.createGain(); AU[k].connect(AU.master); } applyVolumes();
  const len = c.sampleRate * 2, buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0); let b = 0; for(let i = 0; i < len; i++){ b = (b + .02 * (Math.random() * 2 - 1)) / 1.02; d[i] = b * 3.5; }
  AU.noise = buf;
  const mk = (freq, type = 'lowpass') => { const s = c.createBufferSource(); s.buffer = buf; s.loop = true; const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; const gn = c.createGain(); gn.gain.value = 0; s.connect(f); f.connect(gn); gn.connect(AU.amb); s.start(); return { f, g:gn }; };
  AU.wind = mk(420); AU.fire = mk(900, 'bandpass'); AU.fire.f.Q.value = .8;
  AU.water = mk(650, 'bandpass'); AU.water.f.Q.value = .6;
  AU.rain = mk(3200, 'bandpass'); AU.rain.f.Q.value = .35;
  loadStepRecordings(c);
  AU.steps = { mud:[1, 2, 3, 4, 5, 6, 7, 8].map(i => makeStepBuf(c, 'mud', i)), puddle:[11, 12, 13, 14, 15].map(i => makeStepBuf(c, 'puddle', i)) };
  const cityN = mk(160); AU.city = cityN.g;
  const dr = c.createOscillator(); dr.type = "sine"; dr.frequency.value = 55; AU.drone = c.createGain(); AU.drone.gain.value = 0; dr.connect(AU.drone); AU.drone.connect(AU.music); dr.start();
  const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 42; const of = c.createBiquadFilter(); of.type = 'lowpass'; of.frequency.value = 180; AU.eng = c.createGain(); AU.eng.gain.value = 0; o.connect(of); of.connect(AU.eng); AU.eng.connect(AU.fx); o.start();
}
function env(freq, dur, vol, type = 'sine', when = 0){ const c = AU.ctx; if(!c) return; const t = c.currentTime + when, o = c.createOscillator(), gn = c.createGain(); o.type = type; o.frequency.value = freq; gn.gain.setValueAtTime(0, t); gn.gain.linearRampToValueAtTime(vol, t + .02); gn.gain.exponentialRampToValueAtTime(.0001, t + dur); o.connect(gn); gn.connect(AU.out || AU.amb); o.start(t); o.stop(t + dur + .05); }
function burst(dur, vol, freq){ const c = AU.ctx; if(!c) return; const s = c.createBufferSource(); s.buffer = AU.noise; const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = freq; const gn = c.createGain(); const t = c.currentTime; gn.gain.setValueAtTime(vol, t); gn.gain.exponentialRampToValueAtTime(.0001, t + dur); s.connect(f); f.connect(gn); gn.connect(AU.out || AU.amb); s.start(t, Math.random()); s.stop(t + dur); }
/* Шаги по грязи и лужам собираются заранее как звуковые фрагменты.
   Хлюпанье — это лопающиеся пузырьки воды и воздуха под подошвой (затухающий тон с растущей частотой),
   плюс мягкий удар и вязкое продавливание; при отрыве ноги — тихий присос. */
function makeStepBuf(c, kind, seed){
  const sr = c.sampleRate, n = Math.floor(sr * .34), buf = c.createBuffer(1, n, sr), d = buf.getChannelData(0);
  let sd = seed * 9301 + 49297; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
  const lpA = fc => 1 - Math.exp(-2 * Math.PI * fc / sr), wet = kind === 'puddle';
  // пузырёк: тон, который быстро затухает и поднимается по высоте
  const bubble = (t0, f, dec, amp, rise) => { const st = Math.floor(t0 * sr); let ph = 0;
    for(let i = 0; st + i < n; i++){ const t = i / sr; if(t > dec * 5) break; ph += 2 * Math.PI * f * (1 + rise * t / dec) / sr;
      d[st + i] += Math.sin(ph) * amp * Math.min(1, t / .0015) * Math.exp(-t / dec); } };
  // шум через двойной фильтр с плавной огибающей
  const body = (t0, fc, att, dec, amp) => { const a = lpA(fc), st = Math.floor(t0 * sr); let y1 = 0, y2 = 0;
    for(let i = 0; st + i < n; i++){ const t = i / sr; if(t > att + dec * 6) break; y1 += a * ((rnd() * 2 - 1) - y1); y2 += a * (y1 - y2);
      d[st + i] += y2 * amp * Math.min(1, t / att) * Math.exp(-Math.max(0, t - att) / dec) * 8; } };
  body(0, 170, .006, .03, wet ? .5 : .8);                          // мягкий удар пятки
  body(.008, wet ? 1100 : 650, .018, .06, wet ? .35 : .45);        // вязкое продавливание
  const nb = wet ? 14 + (rnd() * 6 | 0) : 7 + (rnd() * 5 | 0);       // пузырьки под подошвой
  for(let k = 0; k < nb; k++){ const q = rnd();
    bubble(.012 + q * q * (wet ? .16 : .11), wet ? 450 + rnd() * 1100 : 170 + rnd() * 480, (wet ? .006 : .01) + rnd() * .012, (.12 + rnd() * .3) * (1 - q * .5), .4 + rnd() * .8); }
  const lift = .17 + rnd() * .05;                                  // присос при отрыве ноги
  body(lift, 500, .01, .025, wet ? .12 : .2);
  for(let k = 0; k < 2 + (rnd() * 3 | 0); k++) bubble(lift + rnd() * .04, wet ? 700 + rnd() * 900 : 300 + rnd() * 500, .006 + rnd() * .008, .08 + rnd() * .12, 1 + rnd());
  if(wet){ const aL = lpA(500), aH = lpA(3200); let l = 0, h = 0;   // всплеск
    for(let i = 0; i < n; i++){ const t = i / sr, x = rnd() * 2 - 1; l += aL * (x - l); h += aH * (x - h); d[i] += (h - l) * Math.min(1, t / .01) * Math.exp(-t / .055) * .3; } }
  { const a = lpA(wet ? 3800 : 2400); let y = 0, pk = 0; for(let i = 0; i < n; i++){ y += a * (d[i] - y); d[i] = y; pk = Math.max(pk, Math.abs(y)); }
    const g = .9 / (pk || 1); for(let i = 0; i < n; i++){ const fade = i > n - 400 ? (n - i) / 400 : 1; d[i] *= g * fade; } }
  return buf;
}
/* настоящие записи шагов (CC0, см. sfx/CREDITS.txt); синтез — запасной вариант */
const STEP_REC = { wet:3, concrete:5, grass:5, wood:5, carpet:5 };
const STEP_OF = { mud:['wet', .32, 1], puddle:['wet', .38, .92], asphalt:['concrete', .2, 1], grass:['grass', .22, 1], wood:['wood', .2, 1], planks:['wood', .24, .82], carpet:['carpet', .16, 1] };
function loadStepRecordings(c){
  AU.rec = {};
  for(const [k, n] of Object.entries(STEP_REC)) for(let i = 0; i < n; i++)
    fetch(`sfx/step_${k}_${i}.wav`).then(r => r.ok ? r.arrayBuffer() : Promise.reject()).then(b => new Promise((ok, no) => c.decodeAudioData(b, ok, no)))
      .then(buf => { (AU.rec[k] = AU.rec[k] || []).push(buf); }).catch(() => {});
}
function playBuf(buf, vol, rate = 1){ const c = AU.ctx, src = c.createBufferSource(), gn = c.createGain(); src.buffer = buf; src.playbackRate.value = rate; gn.gain.value = vol; src.connect(gn); gn.connect(AU.out || AU.amb); src.start(); }
/* шум через фильтр со сдвигом частоты: основа для шагов и брызг */
function nz(o){ const c = AU.ctx; if(!c) return; const t = c.currentTime + (o.when || 0), s = c.createBufferSource(); s.buffer = AU.noise;
  const f = c.createBiquadFilter(); f.type = o.type || 'bandpass'; f.Q.value = o.q || 1; f.frequency.setValueAtTime(o.f0, t); if(o.f1) f.frequency.exponentialRampToValueAtTime(o.f1, t + o.dur);
  const gn = c.createGain(); gn.gain.setValueAtTime(0, t); gn.gain.linearRampToValueAtTime(o.vol, t + (o.att || .006)); gn.gain.exponentialRampToValueAtTime(.0001, t + o.dur);
  s.connect(f); f.connect(gn); gn.connect(AU.out || AU.amb); s.start(t, Math.random() * 1.5); s.stop(t + o.dur + .05); }
function tone(o){ const c = AU.ctx; if(!c) return; const t = c.currentTime + (o.when || 0), os = c.createOscillator(), gn = c.createGain(); os.type = o.type || 'sine';
  os.frequency.setValueAtTime(o.f0, t); if(o.f1) os.frequency.exponentialRampToValueAtTime(o.f1, t + o.dur);
  gn.gain.setValueAtTime(0, t); gn.gain.linearRampToValueAtTime(o.vol, t + (o.att || .005)); gn.gain.exponentialRampToValueAtTime(.0001, t + o.dur);
  let out = os; if(o.lp){ const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.lp; f.Q.value = o.q || 1; os.connect(f); out = f; }
  out.connect(gn); gn.connect(AU.out || AU.amb); os.start(t); os.stop(t + o.dur + .05); }
/* шаги: у каждой поверхности свой звук */
function stepSound(surf, run){ if(!AU.ctx) return; onBus(AU.fx, () => stepSound0(surf, run)); }
function stepSound0(surf, run){
  const v = run ? 1.3 : 1, j = .85 + Math.random() * .3;
  const R = STEP_OF[surf], L = R && AU.rec && AU.rec[R[0]];
  if(L && L.length){ let b; do { b = L[Math.floor(Math.random() * L.length)]; } while(L.length > 2 && b === AU.lastStep); AU.lastStep = b;
    return playBuf(b, R[1] * v * (.8 + Math.random() * .3), R[2] * (.94 + Math.random() * .12)); }
  if(surf === 'mud' || surf === 'puddle'){             // грязь и лужи — заранее собранные фрагменты
    const L = AU.steps[surf], b = L[Math.floor(Math.random() * L.length)];
    playBuf(b, (surf === 'puddle' ? .13 : .12) * v * (.75 + Math.random() * .4), .9 + Math.random() * .2);
  } else if(surf === 'asphalt'){                        // каблук по старому асфальту
    nz({ f0:2600 * j, q:.8, dur:.045, vol:.12 * v, type:'highpass' });
    tone({ f0:120 * j, f1:70, dur:.07, vol:.09 * v });
    if(Math.random() < .35) nz({ f0:5000, q:2, dur:.05, vol:.03, when:.03 });   // хрустнул камешек
  } else if(surf === 'grass'){                          // шорох ржи
    nz({ f0:4200 * j, f1:2600, q:.7, dur:.2, vol:.07 * v, att:.03 });
    nz({ f0:3000 * j, q:.7, dur:.15, vol:.035 * v, att:.02, when:.07 });
  } else if(surf === 'planks'){                         // гулкие мостки
    tone({ f0:190 * j, f1:150, dur:.16, vol:.12 * v });
    nz({ f0:900, q:1, dur:.08, vol:.07 * v, type:'lowpass' });
  } else if(surf === 'wood'){                           // половицы, иногда скрипнут
    nz({ f0:520 * j, q:.8, dur:.1, vol:.15 * v, type:'lowpass' });
    tone({ f0:140 * j, f1:95, dur:.08, vol:.07 * v });
    if(Math.random() < .14) tone({ f0:250 + Math.random() * 60, f1:310 + Math.random() * 80, dur:.4, vol:.022, type:'sawtooth', lp:900, q:8, att:.08, when:.04 });
  } else {                                              // ковёр в городской квартире
    nz({ f0:380 * j, q:.7, dur:.07, vol:.08 * v, type:'lowpass' });
  }
}
/* щипок струны, похожий на гусли: шум в линии задержки с затуханием */
function pluck(freq, when = 0, vol = .12, dec = .996){
  const c = AU.ctx; if(!c) return; const sr = c.sampleRate, n = Math.floor(sr * 1.8), buf = c.createBuffer(1, n, sr), d = buf.getChannelData(0), P = Math.max(2, Math.round(sr / freq));
  const line = new Float32Array(P); for(let i = 0; i < P; i++) line[i] = Math.random() * 2 - 1;
  let prev = 0; for(let i = 0; i < n; i++){ const j = i % P, v = line[j]; d[i] = v; const nv = dec * .5 * (v + prev); prev = v; line[j] = nv; }
  for(let i = 0; i < 200; i++) d[i] *= i / 200;
  const s = c.createBufferSource(), f = c.createBiquadFilter(), gn = c.createGain(); s.buffer = buf; f.type = 'lowpass'; f.frequency.value = 3200; gn.gain.value = vol;
  s.connect(f); f.connect(gn); gn.connect(AU.out || AU.amb); s.start(c.currentTime + when); }
function cuckoo(n = 2 + (Math.random() * 3 | 0)){ for(let i = 0; i < n; i++){ tone({ f0:740, f1:720, dur:.18, vol:.03, att:.02, when:i * .62 }); tone({ f0:590, f1:575, dur:.3, vol:.03, att:.02, when:i * .62 + .2 }); } }
function sfx(k){ if(!AU.ctx) return; onBus(k === 'clue' || k === 'lore' ? AU.music : AU.fx, () => sfx0(k)); }
function sfx0(k){
  if(k === 'clue'){ [392, 523.3, 659.3, 784].forEach((f, i) => pluck(f, i * .09, .1)); }
  if(k === 'lore'){ [293.7, 392, 440, 587.3].forEach((f, i) => pluck(f, i * .14, .09, .997)); }
  if(k === 'step') stepSound(surfaceAt(st.strip, st.x), keys.run);
  if(k === 'door') burst(.35, .12, 300);
  if(k === 'page') burst(.12, .04, 3000);
}
function lullaby(){ if(!AU.ctx) return; onBus(AU.music, lullaby0); }
function lullaby0(){
  const N = [ [329.6, .5], [440, .5], [440, .5], [493.9, .5], [523.3, 1], [493.9, .5], [440, 1], [392, .5], [440, .5], [493.9, .5], [329.6, 1.2] ];
  let t = .3; for(const [f, d] of N){ env(f, d * 1.6, .05, 'triangle', t); t += d * .72; }
}
/* обрядовая песня: два голоса без слов, второй — на кварту ниже и тише, как хор у реки */
function hum(k){ if(!AU.ctx) return; onBus(AU.music, () => { if(k === 'lull') return lullaby0(); const N = SONG_MEL[k]; if(!N) return;
  let t = .3; for(const [f, d] of N){ env(f, d * 1.7, .045, 'triangle', t); env(f * .75, d * 1.7, .022, 'sine', t + .03); t += d * .78; } }); }
function audioTick(dt){ if(!AU.ctx) return; onBus(AU.amb, () => audioTick0(dt)); }
function audioTick0(dt){ const c = AU.ctx, t = c.currentTime;
  const v = st, out = v && !STRIPS[v.strip].indoor, ph = v ? phaseOf(v) : 3;
  const wind = AU.muted || !v ? 0 : out ? (.05 + (ph === 3 ? .05 : 0) + Math.sin(T * .3) * .02) : .01;
  AU.wind.g.gain.setTargetAtTime(ui.title ? .06 : wind, t, .5);
  const fire = !AU.muted && v && (v.strip === 'aglaya' || (v.strip === 'grunya' && v.phase === 2)) ? .05 : 0;
  AU.fire.g.gain.setTargetAtTime(fire * (Math.random() < .3 ? 2.2 : .6), t, .03);
  const eng = !AU.muted && v && v.bus && v.strip === 'road' ? .06 : 0; AU.eng.gain.setTargetAtTime(eng, t, .4);
  if(!AU.muted && out && ph >= 2 && Math.random() < dt * 1.6){ for(let i = 0; i < 3; i++) env(4300 + Math.random() * 300, .05, .012, 'sine', i * .07); }
  if(AU.muted || !v) return;
  const S = v.strip, rnd = Math.random;
  // вода у реки
  AU.water.g.gain.setTargetAtTime(S === 'river' ? .07 + Math.sin(T * .7) * .015 : 0, t, .6);
  // дождь: на улице шумит, в доме — тихо стучит по крыше
  { const w = weatherOf(v), r = w.rain || 0; AU.rain.g.gain.setTargetAtTime(r ? (out ? .05 + r * .1 : .02 + r * .02) : 0, t, .8); }
  // мёртвая тишина на лесной остановке: низкий гул и часы
  AU.drone.gain.setTargetAtTime(S === 'forestroad' ? .035 : 0, t, 1.2);
  if((S === 'forestroad' || S === 'laptev') && (AU.tick = (AU.tick || 0) + dt) > 1){ AU.tick = 0; nz({ f0:3500, q:4, dur:.03, vol:S === 'forestroad' ? .03 : .022 }); }
  if(S === 'flat'){ AU.city.gain.setTargetAtTime(.025, t, 1); } else AU.city.gain.setTargetAtTime(0, t, 1);
  if(!out || S === 'forestroad') return;
  // кукушка в лесу и у реки утром и днём
  if((S === 'field' || S === 'river' || S === 'village') && ph <= 1 && rnd() < dt * .03) cuckoo();
  // утром птицы
  if(ph === 0 && rnd() < dt * .7){ const f = 2600 + rnd() * 1400; for(let i = 0; i < 2 + (rnd() * 3 | 0); i++) tone({ f0:f, f1:f * (1.2 + rnd() * .4), dur:.07, vol:.018, when:i * .11 }); }
  // в полдень кузнечики в поле
  if(S === 'field' && ph === 1 && rnd() < dt * 2.2){ const f = 5200 + rnd() * 900; for(let i = 0; i < 6; i++) tone({ f0:f, dur:.025, vol:.008, when:i * .045 }); }
  // вечером и ночью лягушки у воды
  if(S === 'river' && ph >= 2 && rnd() < dt * .9){ const f = 95 + rnd() * 40; for(let i = 0; i < 3 + (rnd() * 3 | 0); i++) tone({ f0:f * 1.4, f1:f, dur:.06, vol:.05, type:'square', lp:420, when:i * .09 }); }
  // ночью сова
  if(ph === 3 && rnd() < dt * .05){ tone({ f0:390, f1:360, dur:.35, vol:.035, att:.06 }); tone({ f0:380, f1:340, dur:.6, vol:.035, att:.08, when:.55 }); }
  // вечером вороны
  if(ph === 2 && S === 'village' && rnd() < dt * .06){ for(let i = 0; i < 2 + (rnd() * 2 | 0); i++) tone({ f0:560 + rnd() * 60, f1:420, dur:.2, vol:.02, type:'sawtooth', lp:1500, q:4, when:i * .32 }); }
  // капли с крыш на мокрой улице
  if(S === 'village' && rnd() < dt * .5) tone({ f0:1500 + rnd() * 1200, f1:2600 + rnd() * 800, dur:.03, vol:.012 });
}
