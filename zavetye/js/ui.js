'use strict';
/* =====================================================================
   ИНТЕРФЕЙС — диалоги, портреты, HUD, обучение, меню, титул и финал.
   Тетрадь — в notebook.js.
   Правило одного фокуса: на body висит класс того, что сейчас главное
   (f-dlg — разговор, f-area — название места, f-nb — тетрадь).
   ===================================================================== */
function focusSync(){
  const b = document.body.classList;
  b.toggle('f-dlg', !!ui.dlg); b.toggle('f-nb', !!ui.nb); b.toggle('f-area', $('area').classList.contains('on'));
}

/* ---------- сцены и диалог ---------- */
function atPlace(p){ const d = PLACES[p]; return d && st.strip === d[0] && Math.abs(st.x - d[1]) < 420; }
function openScene(id){
  if(!S[id]){ console.warn('нет сцены', id); return closeDlg(); }
  let p = SCENE_PLACE[id]; if(typeof p === 'function') p = p();
  if(p && !atPlace(p)){ hideDlg(); teleport(PLACES[p], () => openScene(id)); return; }
  // новый день начинается с карточки дня — переход между днями отмечен орнаментом
  if(id === 'morning' && !ui.cardShown){ ui.cardShown = true; dayCard(() => { ui.cardShown = false; showScene(id); }); return; }
  // обряд в первый раз — 3D кат-сцена, потом разговор
  { const c = typeof cutFor === 'function' && cutFor(id); if(c){ playCut(id, () => { window.CUT_QUIET = true; showScene(id); setTimeout(() => { window.CUT_QUIET = false; }, 1500); }); return; } }
  showScene(id);
}
/* иллюстрации на весь экран для видений: показываются, только если картинка уже есть */
const ILLUS = { noon_vision:'il_vision', forest_night:'il_izba', river_rite:'il_rusal' };
function showIllus(id){ const k = ILLUS[id], el = $('illus'); if(!el) return; const im = k && IMG[k];
  if(im){ el.querySelector('img').src = im.src; el.classList.add('on'); } else el.classList.remove('on'); }
function showScene(id){
  if(id === 'p_bus') st.bus = { x:1300, mode:'park' };
  if(id === 'morning') st.wake = null;
  st.scene = id;
  const sc = S[id]();
  loreHook(id, sc);
  if(SONG_PEND){ sc.text.push(addLore(SONG_PEND)); SONG_PEND = null; }
  st.view = { id, title: sc.title || '', cap: !!sc.cap, away: !!sc.away, pages: sc.text.filter(Boolean).map(wrapP) };
  DLG = { i:0 }; curChoices = sc.choices || [];
  { const sp = speakerOf(id); if(sp && !PORTRAIT_KEYS(sp[0]).every(k => IMG[k])) ensure(PORTRAIT_KEYS(sp[0]), 0).then(() => { if(st && st.view && st.view.id === id) portraitPage(); }); }
  if(['noon_vision','varya_song'].includes(id)){ lullaby(); caption('♪ Кто-то тихо напевает колыбельную. Мелодия обрывается на последней строке.', 6000); }
  ui.dlg = true; $('dlg').classList.remove('chsheet'); hideHint(); $('area').classList.remove('on');
  trackOnce('first_dialogue');
  if(!st.tut.dlg){ st.tut.dlg = 1; setTimeout(() => caption(coarse() ? 'Нажмите на текст, чтобы читать дальше.' : 'Щелчок или пробел — читать дальше.', 4200), 600); }
  showIllus(id); showPortrait(id); renderDlg(); updateHud(); focusSync(); save();
}
function resumeDlg(){ const id = st.scene; const sc = S[id](); curChoices = sc.choices || []; if(!st.view || st.view.id !== id) st.view = { id, title: sc.title || '', cap: !!sc.cap, away: !!sc.away, pages: sc.text.filter(Boolean).map(wrapP) }; DLG = { i: st.view.pages.length - 1 }; ui.dlg = true; showPortrait(id); renderDlg(); focusSync(); }
const coarse = () => matchMedia('(pointer:coarse)').matches;
const NAMES = { anna:'Анна', grunya:'Груня', grisha:'Гриша', nina:'Нина Петровна', varya:'Варя', young:'Парень с чемоданом', noon:'Полудница', leshy:'Леший', domovoi:'Голос из-за печи' };
/* реплика Анны в выборе — как настоящая фраза */
const sayText = t => '— ' + t.replace(/^«([^»]*)»/, '$1');
const KEY_SCENES = ['p_house_in','fr_tell','res_village','bus_sunday','gr_dinner','p_parcel'];
function renderDlg(){
  const v = st.view, last = DLG.i >= v.pages.length - 1, el = $('dlg'), page = v.pages[DLG.i] || '';
  el.hidden = false;
  const who = portraitPage();
  const w = $('dlgWho'); w.textContent = who ? NAMES[who] || '' : v.title; w.classList.toggle('narr', !who);
  const t = $('dlgText'); t.innerHTML = page; t.classList.toggle('cap', v.cap && DLG.i === 0 && !page.startsWith('<p class="dl"'));
  $('dlgMore').hidden = last;
  const hasCh = last && curChoices.length > 0, key = KEY_SCENES.includes(v.id);
  el.classList.toggle('has-ch', hasCh);
  $('dlgCh').innerHTML = last ? curChoices.map((c, i) => `<button type="button" class="ch ${c.say ? 'say' : 'act'}${key && !/^(Отойти|Уйти|Попрощаться|Не сейчас|Ещё подумать)/.test(c.t) ? ' key' : ''}" data-i="${i}"${c.dis ? ' disabled' : ''} style="animation-delay:${i * 40}ms"><span class="n">${i + 1}</span><span class="tx">${c.say ? sayText(c.t) : c.t}${c.sub ? `<span class="sub">${c.sub}</span>` : ''}</span>${c.play ? '<span class="cost play">· действие</span>' : ''}${c.cost ? '<span class="cost">· время</span>' : ''}</button>`).join('') : '';
  $('dlgBody').scrollTop = 0;
  if(last && curChoices.length && !coarse()){ const f = $('dlgCh').querySelector('.ch:not([disabled])'); if(f) f.focus({ preventScroll:true }); }
}
function advance(){
  if(!DLG) return; const n = st.view.pages.length;
  if(DLG.i < n - 1){ DLG.i++; renderDlg(); sfx('page'); }
  else if(!curChoices.length) closeDlg();
  else if(innerWidth <= 760) $('dlg').classList.add('chsheet');
}
function choose(i){
  const c = curChoices[i]; if(!c || c.dis) return;
  if(DLG.i < st.view.pages.length - 1) return;
  let next = c.go || 'walk';
  if(c.fn){ const r = c.fn(); if(typeof r === 'string') next = r; }
  if(c.cost){ pass(c.cost); updateHud(); }
  if(c.play) return runPlay(c);
  if(next === 'loc' || next === 'walk') closeDlg(); else openScene(next);
}
/* выбор, который ведёт в действие (js/acts.js): исход действия решает, какая сцена дальше */
function runPlay(c){
  hideDlg(); st.scene = null; st.view = null; DLG = null; curChoices = [];
  playAct(c.play, win => { const f = win ? c.winFn : c.loseFn; if(f) f(); updateHud();
    const nx = win ? c.win : c.lose; if(!nx || nx === 'loc' || nx === 'walk') closeDlg(); else openScene(nx); });
}
function hideDlg(){ $('dlg').hidden = true; ui.dlg = false; hidePortrait(); focusSync(); }
function closeDlg(){
  showIllus(null); hideDlg(); st.scene = null; st.view = null; DLG = null; curChoices = [];
  if(ui.end) return save();
  if(st.pend){ const p = st.pend; st.pend = null; teleport(p, closeDlg); return; }
  if(st.day >= 5 && !F('busDone')){ busArrive(); return; }
  if(st.morningDue){ st.morningDue = false; openScene('morning'); return; }
  updateHud(); saveMark(); tutAfterDialog();
}
function busArrive(){
  const go = () => { st.bus = { x:2300, mode:'arrive' }; ui.cut = true; caption('Со стороны трассы слышно, как подходит автобус.', 4000); };
  if(st.strip !== 'road') teleport(['road', 1040], go); else go();
}
function busLeave(){ if(st.bus) st.bus.mode = 'leave'; }

/* ---------- портреты: говорящий ярко, слушающий в тени; настойчивость — отворачиваются ---------- */
function portraitFor(who, mood){
  if(IMG[`p_${who}_${mood}`]) return IMG[`p_${who}_${mood}`];
  if(IMG[`p_${who}_neutral`]) return IMG[`p_${who}_neutral`];
  const k = Object.keys(IMG).find(n => n.startsWith(`p_${who}_`)); return k ? IMG[k] : null;
}
const PSLOT = { L:{ key:null }, R:{ key:null } };
const slotEl = s => $(s === 'L' ? 'portL' : 'portR');
function setSlot(s, who, mood){
  const el = slotEl(s), P = PSLOT[s], im = who ? portraitFor(who, mood) : null;
  if(!im){ el.classList.remove('on'); P.key = null; return false; }
  if(P.key !== im.src){
    const [a, b] = el.querySelectorAll('img'), cur = a.classList.contains('cur') ? a : b, nxt = cur === a ? b : a;
    if(P.key && el.classList.contains('on')){
      nxt.src = im.src; cur.classList.remove('cur'); nxt.classList.add('cur');
      const fx = el.querySelector('.fx'); fx.classList.remove('flinch', 'pop'); void fx.offsetWidth; if(['afraid', 'broken'].includes(mood)) fx.classList.add('flinch');   // движение — только на испуге и надломе
    } else cur.src = im.src;
    P.key = im.src;
  }
  el.classList.add('on'); return true;
}
/* расставляет портреты по текущей странице и возвращает, кто сейчас говорит (или null — рассказ) */
function portraitPage(){
  if(!st || !st.view || !DLG){ hidePortrait(); return null; }
  const id = st.view.id, base = speakerOf(id);
  const pg = st.view.pages[DLG.i] || '', dl = pg.includes('class="dl"');
  if(!base){ hidePortrait(); return null; }
  const L = { who:'anna', mood: base[0] === 'anna' ? base[1] : 'neutral' };
  let R = base[0] === 'anna' ? null : { who:base[0], mood:base[1] }, sp = base[0] === 'anna' ? 'L' : 'R', who = null;
  const rules = MOODS.filter(r => r[0] === id);
  for(let k = 0; k <= DLG.i && k < st.view.pages.length; k++){
    const p = st.view.pages[k]; let hit = false, spk = null;
    for(const [, sub, spec] of rules){ if(!p.includes(sub)) continue; hit = true;
      for(const tok of spec.split(' ')){ const quiet = tok[0] === '~', [w, mood] = tok.replace('~', '').split(':');
        if(w === 'anna'){ if(mood) L.mood = mood; if(!quiet){ sp = 'L'; spk = 'anna'; } }
        else if(portraitFor(w, mood || 'neutral')){ R = { who:w, mood: mood || 'neutral' }; if(!quiet){ sp = 'R'; spk = w; } } } }
    if(!hit && p.includes('class="dl"') && R) sp = 'R';
    if(k === DLG.i) who = dl ? (spk || (sp === 'L' ? 'anna' : base[0])) : (spk === 'anna' ? null : spk);
  }
  const okR = R ? setSlot('R', R.who, R.mood) : setSlot('R', null);
  setSlot('L', L.who, L.mood);
  if(!okR) sp = 'L';
  slotEl('L').classList.toggle('listen', sp !== 'L'); slotEl('R').classList.toggle('listen', sp !== 'R');
  slotEl('R').classList.toggle('away', !!st.view.away);
  if(who === 'anna' && sp !== 'L') who = 'anna';
  return who;
}
function showPortrait(){ portraitPage(); }
function hidePortrait(){ for(const s of ['L', 'R']){ slotEl(s).classList.remove('on', 'listen', 'away'); PSLOT[s].key = null; } }

/* ---------- HUD: день и время, мысль Анны, тетрадь ---------- */
const GLYPH = [
  '<path d="M2 16h18" stroke="#ece3cf" stroke-width="1.5"/><path d="M5.5 16a5.5 5.5 0 0 1 11 0" fill="none" stroke="#ece3cf" stroke-width="1.5"/><g stroke="#c9ae75" stroke-width="1.5" stroke-linecap="round"><path d="M11 4.5v2.5M4.5 8l1.8 1.8M17.5 8l-1.8 1.8"/></g>',
  '<circle cx="11" cy="11" r="4.6" fill="none" stroke="#ece3cf" stroke-width="1.5"/><g stroke="#c9ae75" stroke-width="1.5" stroke-linecap="round"><path d="M11 2v2.6M11 17.4V20M2 11h2.6M17.4 11H20M4.6 4.6l1.8 1.8M15.6 15.6l1.8 1.8M4.6 17.4l1.8-1.8M15.6 6.4l1.8-1.8"/></g>',
  '<path d="M2 14.5h18" stroke="#ece3cf" stroke-width="1.5"/><path d="M4.5 14.5a6.5 6.5 0 0 1 13 0" fill="none" stroke="#c9ae75" stroke-width="1.5"/><path d="M5 18h12" stroke="#ece3cf" stroke-width="1.2" opacity=".6"/>',
  '<path d="M14.5 3.5a7.5 7.5 0 1 0 4 12.5A8 8 0 0 1 14.5 3.5z" fill="none" stroke="#ece3cf" stroke-width="1.5"/><path d="M17 4.5l.6 1.3 1.3.6-1.3.6-.6 1.3-.6-1.3-1.3-.6 1.3-.6z" fill="#c9ae75"/>' ];
let lastGoal = null;
function updateHud(){
  if(!st) return;
  const pro = !F('arrived') && st.day === 0;
  $('clk').textContent = pro ? 'пролог' : `${dayName(st.day).toLowerCase()} · ${PHASES[st.phase]}`;
  $('glyph').innerHTML = GLYPH[st.phase];
  [...$('signal').children].forEach((b, i) => b.classList.toggle('on', i < st.signal));
  $('signal').hidden = F('arrived');          // связь видна, только пока она важна для сюжета
  $('bookDot').hidden = !st.unseen;
  const g = goalText(); if(g !== lastGoal){ const first = lastGoal === null; lastGoal = g; if(!first || !st.scene) showThought(first ? 1800 : 400); }
}
/* мысль Анны: показывается при входе и когда меняется, потом гаснет; нажатие на время — вспомнить */
let thoughtT = null;
function showThought(delay = 0){
  clearTimeout(thoughtT);
  thoughtT = setTimeout(() => { const el = $('thought'); el.textContent = goalText(); el.classList.add('on'); thoughtT = setTimeout(() => el.classList.remove('on'), 6500); }, delay);
}
function goalText(){
  if(!F('arrived')) return st.strip === 'flat' ? 'Надо разобрать мамин шкаф.' : 'Нижняя улица, семь. Последний дом у леса.';
  if(!F('caseOpen')) return 'Надо отдохнуть с дороги.';
  if(st.outcome) return F('busDone') ? 'Можно просто пройтись по Заветью.' : 'В воскресенье утром — автобус на старой дороге.';
  if(F('foundRoad')) return 'Надо решить, что случилось с Гришей, и рассказать ему на лесной остановке.';
  if(has('c_timetable') || has('e3')) return 'Где-то есть Гриша, который до сих пор ждёт автобус. Дорогу знает Леший на опушке.';
  if(!F('talkedGrisha')) return 'Надо поговорить с Гришей.';
  return 'Почему Гриша двадцать два года не может уехать?';
}

/* ---------- обучение по ходу дела: движение → подойти ближе → осмотреть → тетрадь ---------- */
let hintT = null;
function hint(html, ms = 8000){ const h = $('hint'); h.innerHTML = html; h.classList.remove('off'); clearTimeout(hintT); hintT = setTimeout(hideHint, ms); }
function hideHint(){ $('hint').classList.add('off'); }
function showHint(){ if(!st || st.tut.move) return; hint(coarse() ? 'Нажмите на пол, чтобы Анна пошла туда.' : '<kbd>←</kbd> <kbd>→</kbd> или <kbd>A</kbd> <kbd>D</kbd> — идти. Можно и просто щёлкнуть, куда идти.', 12000); }
function tutTick(){
  if(!st || ui.title || ui.end || blocked()) return;
  const T0 = st.tut;
  if(moving && !T0.move){ T0.move = 1; hideHint(); trackOnce('first_move'); }
  if(!T0.move) return;
  if(curHot && !T0.act){ T0.act = 1; hint(coarse() ? 'Нажмите на подпись над предметом, чтобы ' + lc(curHot.ph) + '.' : 'Нажмите <kbd>E</kbd> или щёлкните по подписи, чтобы ' + lc(curHot.ph) + '.'); return; }
  if(!curHot && !T0.near && !T0.act){ const h = nearAhead(); if(h){ T0.near = 1; hint('Подойдите ближе: рядом что-то есть.', 6000); } }
  if(T0.act && !T0.run && !coarse() && !STRIPS[st.strip].indoor && st.strip === 'village'){ T0.run = 1; hint('<kbd>Shift</kbd> — бежать.', 5000); }
}
const lc = s => s.charAt(0).toLowerCase() + s.slice(1);
function nearAhead(){ let best = null; for(const h of hotsFor()){ const d = Math.abs(h.x - st.x); if(d > 75 && d < 520 && (!best || d < Math.abs(best.x - st.x))) best = h; } return best; }
function tutAfterDialog(){ if(!st || st.tut.book || !st.order.length && !st.notes.length) return; st.tut.book = 1; setTimeout(() => hint(coarse() ? 'Запись появилась в тетради — значок тетради вверху справа.' : 'Запись появилась в тетради. <kbd>Tab</kbd> — открыть тетрадь.', 9000), 500); }

/* ---------- название места: крупно и только при первом входе ---------- */
let areaT = null;
function showArea(){
  if(!st) return;
  if(st.seen.includes(st.strip)){ showThought(500); return; }
  st.seen.push(st.strip);
  const s = STRIPS[st.strip]; $('areaName').textContent = s.name; $('areaSub').textContent = s.sub || '';
  $('area').classList.remove('chapter'); $('area').classList.add('on'); focusSync();
  clearTimeout(areaT); areaT = setTimeout(() => { $('area').classList.remove('on'); focusSync(); showThought(300); }, 2600);
}
/* карточка нового дня — орнамент только здесь, на переходе между днями */
function dayCard(then){
  ui.fading = true;
  $('areaName').textContent = dayName(st.day); $('areaSub').innerHTML = '<span class="thread-orn"></span>' + (SAYINGS[st.day] || '');
  $('area').classList.add('on', 'chapter'); focusSync();
  setTimeout(() => { $('area').classList.remove('on', 'chapter'); ui.fading = false; focusSync(); then(); }, 2300);
}

/* ---------- меню: продолжить, звук, текст, языковая поддержка, управление, заново ---------- */
const LANG_NAMES = { easy:'С поддержкой', normal:'Самостоятельно', hard:'Погружение' };
function renderMenu(){
  for(const [k, id, o] of [['music','volMusic','oMusic'], ['amb','volAmb','oAmb'], ['fx','volFx','oFx']]){ $(id).value = SET[k]; $(o).textContent = SET[k]; }
  $('mSize').innerHTML = [['s','Мельче'], ['m','Обычный'], ['l','Крупнее']].map(([k, l]) => `<button type="button" data-size="${k}" aria-pressed="${SET.size === k}">${l}</button>`).join('');
  $('mLang').innerHTML = Object.entries(LANG_NAMES).map(([k, l]) => `<button type="button" data-sd="${k}" aria-pressed="${!!st && st.diff === k}"${st ? '' : ' disabled'}>${l}</button>`).join('');
  $('mKeys').innerHTML = coarse() ? '<li>Нажмите на пол — Анна пойдёт туда.</li><li>Нажмите на подпись над вещью — действие.</li><li>Значок тетради — тетрадь.</li>'
    : '<li><kbd>A</kbd> <kbd>D</kbd> или <kbd>←</kbd> <kbd>→</kbd> — идти, <kbd>Shift</kbd> — бежать</li><li><kbd>E</kbd> — действие, <kbd>Пробел</kbd> — дальше</li><li><kbd>1</kbd>–<kbd>9</kbd> — ответ, <kbd>Tab</kbd> — тетрадь, <kbd>Esc</kbd> — меню</li>';
  const own = $('mOwner'); if(own) own.remove();
  if(AN.owner){ const d = document.createElement('div'); d.className = 'sec'; d.id = 'mOwner'; d.innerHTML = '<span class="label">Только для автора</span><button class="it" type="button" data-m="funnel">Как играют: воронка</button><div id="funnelBox"></div>'; $('menu').insertBefore(d, $('menu').lastElementChild); }
}
function openMenu(){ renderMenu(); $('menu').hidden = false; }
function closeMenu(){ $('menu').hidden = true; }
async function showFunnel(){
  const box = $('funnelBox'); if(!box) return; box.innerHTML = '<p class="keys">Считаю…</p>';
  const r = await funnelReport();
  if(!r){ box.innerHTML = '<p class="keys">Данных пока нет. Записываются игроки с доступом «Contributor» и выше.</p>'; return; }
  const top = Math.max(1, r.steps[0].n);
  box.innerHTML = `<ul class="keys">${r.steps.map(s => `<li>${s.label}: <b>${s.n}</b> (${Math.round(100 * s.n / top)}%)</li>`).join('')}<li>Подсматривали перевод: ${r.tr}</li><li>Меняли версию после английской улики: ${r.lensAfter}</li>${r.where.length ? '<li>Чаще всего бросают: ' + r.where.map(([k, n]) => `${esc(k)} (${n})`).join(', ') + '</li>' : ''}</ul>`;
}
/* подтверждение перед тем, как стереть сохранение */
let confirmYes = null;
function askConfirm(title, text, yes){ $('cfH').textContent = title; $('cfP').textContent = text; confirmYes = yes; $('confirm').hidden = false; $('cfNo').focus(); }
$('cfNo').onclick = () => { $('confirm').hidden = true; confirmYes = null; };
$('cfYes').onclick = () => { $('confirm').hidden = true; const f = confirmYes; confirmYes = null; if(f) f(); };
function restartGame(){ wipeSave(); st = null; $('endScr').hidden = true; ui.end = false; showTitle(); }
$('menu').addEventListener('input', e => { const r = e.target.closest('[data-vol]'); if(!r) return; SET[r.dataset.vol] = +r.value; saveSet(); applyVolumes(); renderMenu(); });

/* ---------- финал: дело Анны ---------- */
/* итог по английскому для дела Анны */
function enStats(){
  if(typeof formsSeen !== 'function') return '';
  const E = st.en || { gaps:{}, docs:{}, quiz:{ right:0, total:0 } }, f = formsSeen().size, g = GAPS.filter(x => E.gaps[x.id] && E.gaps[x.id].done).length;
  const d = Object.values(E.docs || {}).filter(x => x.first === true).length, nd = Object.keys(E.docs || {}).length;
  return `<p>Конструкций встретилось: ${f} из ${Object.keys(FORMS).length}. Стёртых строк восстановлено: ${g} из ${GAPS.length}. Документов понято с первого раза: ${d} из ${nd}.${E.quiz && E.quiz.total ? ` Самопроверка: ${E.quiz.right} из ${E.quiz.total}.` : ''}</p>`;
}
function showEnd(kind){
  const o = st.outcome, a = st.flags.answer;
  const title = kind === 'leave' && !o ? 'Лес подождёт' : ({ truth:'Остановка на старой дороге', half:'Ржавый навес', convenient:'Заросшая дорога', erase:'Чистые страницы', loop:'Шесть тридцать восемь' }[o] || 'Заветье');
  const truthTold = o === 'truth';
  const happened = 'Утром двенадцатого июня 2004 года Гриша собирался уехать автобусом в 6:40: билет куплен, чемодан собран. Мать заперла его в бане. Ему сказали, что он проспал, и он поверил.';
  const kept = st.ver.att.filter(id => has(id) && !st.clues[id].doubt && !st.clues[id].blank);
  const top = (kept.length ? kept : st.order.filter(id => !CLUES[id].fake && !st.clues[id].doubt)).slice(0, 3);
  const lies = [];
  if(has('c_forged')) lies.push(`Записка «Сам так решил» — ${st.clues.c_forged.doubt ? 'подброшена, Анна это поняла' : 'подброшена, а Анна ей поверила'}.`);
  if(has('c_nina')) lies.push('«Проспал он тогда» — так говорила Нина Петровна.');
  if(has('c_grunya')) lies.push('«Сам раздумал» — так говорила Груня.');
  const enUsed = st.order.filter(id => CLUES[id].kind === 'en' && st.clues[id].lens && !st.clues[id].blank);
  const enLine = enUsed.length ? enUsed.map(id => { const c = CLUES[id], L = LENSES[st.clues[id].lens], right = st.clues[id].lens === c.lens;
    return `<li><span class="hand">${enMark(c.en)}</span><br>Анна прочла: «${L.label}»${right ? '' : ' — а по-английски тут другое'}. <i>${LENSES[c.lens].form}</i></li>`; }).join('') : '<li>Английские записи остались непрочитанными.</li>';
  const open = [ 'Кто стоял у калитки и пел колыбельную без последней строки?', 'Кем Аглая приходилась маме — и почему семья её не помнит?', F('sawIzba') ? 'Чья изба стоит в лесу на порогах?' : 'Куда в лесу ведут пороги, о которых молчит Груня?' ];
  if(st.flags.cEff === 'advice') open.shift();
  const pv = kind === 'leave' ? (o ? 'Анна уезжает воскресным автобусом.' : 'Анна уезжает, не закрыв дело. Где-то в лесу парень с чемоданом смотрит на часы: 6:38.') : 'Анна остаётся. В доме Аглаи тепло.';
  $('endBody').innerHTML = `<span class="stamp">${o ? 'Дело закрыто' : 'Дело открыто'}</span>
    <h1>${title}</h1>
    <p class="lead">${pv}</p>
    <div class="cf-grid">
      <section class="cf-sec"><h3>Ваша версия</h3><p class="hand">${o ? sentence() : 'Версия не рассказана.'}</p><p>Лес ${o ? 'принял её: ' + ({ truth:'остановка снова стоит на старой дороге.', half:'на дороге остался ржавый навес.', convenient:'дорога заросла.', erase:'тетрадь Гриши опустела.', loop:'парень с чемоданом остался ждать.' }[o]) : 'ждёт.'}</p></section>
      <section class="cf-sec"><h3>Что случилось на самом деле</h3><p>${truthTold ? happened : 'Анна узнает это, если вернётся к делу. Подсказка: всё, что пересказывают, могли переписать. Домашние задания не пересказывает никто.'}</p></section>
      <section class="cf-sec"><h3>Три главные улики</h3><ul>${top.length ? top.map(id => `<li>${CLUES[id].t}</li>`).join('') : '<li>Улик не собрано.</li>'}</ul></section>
      <section class="cf-sec"><h3>Что оказалось ложью</h3><ul>${lies.length ? lies.map(x => `<li class="lie">${x}</li>`).join('') : '<li>Анна не успела услышать неправду. Или не заметила её.</li>'}</ul></section>
      <section class="cf-sec wide"><h3>Какой английский помог</h3><ul>${enLine}</ul>${enStats()}</section>
      <section class="cf-sec wide"><h3>Что осталось необъяснённым</h3><ul>${open.map(x => `<li>${x}</li>`).join('')}</ul>${a ? `<p>Грише Анна сказала: ${{ leave:'«Уезжай».', stay:'«Оставайся».', choice:'«Решай сам».', silence:'ничего.' }[a]}</p>` : ''}</section>
    </div>
    <div class="teaser">Утром Анна замечает в доме Аглаи дверь. Вчера её не было.<b>ДЕЛО II — СКОРО</b></div>
    <div class="cf-acts"><button class="tbtn danger" type="button" id="endRestart">Сыграть заново</button>${kind === 'stay' ? '<button class="tbtn" type="button" id="endStay">Остаться и погулять</button>' : ''}<button class="tbtn" type="button" id="endTitle">На титульный экран</button></div>`;
  ui.end = true; $('endScr').hidden = false; $('endScr').scrollTop = 0; $('hud').hidden = true; $('prompt').hidden = true;
  setF('ended', kind); save();
  if(o){ trackOnce('chapter_completed'); } trackOnce('game_completed', { outcome:o || 'open' });
  $('endRestart').onclick = () => askConfirm('Сыграть заново?', 'Это сохранение будет удалено. Начнётся новая история с пролога.', restartGame);
  $('endTitle').onclick = () => { $('endScr').hidden = true; ui.end = false; showTitle(); };
  const sb = $('endStay'); if(sb) sb.onclick = () => { $('endScr').hidden = true; ui.end = false; st.flags.ended = false; $('hud').hidden = false; save(); };
}

/* ---------- титул: название, подзаголовок, две кнопки. Языковая поддержка — вторым шагом ---------- */
let pickDiff = 'normal';
try{ pickDiff = localStorage.getItem('zavetye.lang') || 'normal'; }catch(e){}
const TITLE_V = { strip:'road', phase:2, day:0, x:1130, dir:-1, flags:{}, bus:null, scene:null, outcome:null };
let titleCam = 700;
function drawTitle(dt){ const vw = VIEW.viewW, ax = R('road', 1150), W = RW('road'); titleCam = Math.max(0, Math.min(W - vw, ax - vw * (innerWidth < 760 ? .5 : .62) + Math.sin(T * .05) * 20)); drawFrame(TITLE_V, titleCam, { x:1150, dir:-1, move:false, ph:0 }); }
function showTitle(){
  ui.title = true; ui.dlg = false; hideDlg(); closeBook(); closeMenu(); $('hud').hidden = true; $('prompt').hidden = true; $('endScr').hidden = true; $('langScr').hidden = true;
  const sv = loadSave(); $('bCont').hidden = !sv || !!(sv.flags && sv.flags.ended);
  $('titleScr').hidden = false; hideHint();
  if(st){ st = null; }
}
function startGame(s){
  st = upgrade(s); ui.title = false; $('titleScr').hidden = true; $('langScr').hidden = true; $('hud').hidden = false; audioInit();
  lastGoal = null; snapCam(); updateHud(); showArea(); preloadNear(st.strip);
  if(st.scene) resumeDlg(); else if(!F('parcelSeen')){ setF('parcelSeen'); setTimeout(showHint, 1200); }
}
function showLang(){ $('titleScr').hidden = true; $('langScr').hidden = false; document.querySelectorAll('#modePick .mode').forEach(b => b.setAttribute('aria-pressed', b.dataset.d === pickDiff)); $('bGo').focus(); }
$('bNew').onclick = () => { if(!LOAD.ready) return; audioInit(); const sv = loadSave(); if(sv && !(sv.flags && sv.flags.ended)) askConfirm('Начать историю заново?', 'Текущее сохранение будет удалено: улики, версия и всё, что изменилось в Заветье.', showLang); else showLang(); };
$('bCont').onclick = () => { if(!LOAD.ready) return; const sv = loadSave(); if(sv) startGame(sv); };
$('bBack').onclick = () => { $('langScr').hidden = true; $('titleScr').hidden = false; };
$('bGo').onclick = () => { wipeSave(); try{ localStorage.setItem('zavetye.lang', pickDiff); }catch(e){} track('language_mode_selected', { mode:pickDiff }); startGame(fresh(pickDiff)); track('new_game_started', { mode:pickDiff }); };
$('modePick').onclick = e => { const b = e.target.closest('.mode'); if(!b) return; pickDiff = b.dataset.d; document.querySelectorAll('#modePick .mode').forEach(x => x.setAttribute('aria-pressed', x === b)); };
function setDiff(d){
  st.diff = d;
  save(); if(ui.nb) renderBook(); toast('Языковая поддержка: ' + LANG_NAMES[d].toLowerCase()); track('language_mode_selected', { mode:d });
}

/* ---------- зерно: одинаковая фактура поверх всех картин ---------- */
(function(){ const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'), im = g.createImageData(256, 256);
  for(let i = 0; i < im.data.length; i += 4){ const v = 128 + (Math.random() - .5) * 90; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; }
  g.putImageData(im, 0, 0); $('grain').style.backgroundImage = `url(${c.toDataURL()})`; })();
