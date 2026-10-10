'use strict';
/* =====================================================================
   ИНТЕРФЕЙС — диалоги, портреты, HUD, тетрадь, меню, титул и финал
   ===================================================================== */
/* ---------- диалоги ---------- */
function atPlace(p){ const d = PLACES[p]; return d && st.strip === d[0] && Math.abs(st.x - d[1]) < 420; }
function openScene(id){
  if(!S[id]){ console.warn('нет сцены', id); return closeDlg(); }
  let p = SCENE_PLACE[id]; if(typeof p === 'function') p = p();
  if(p && !atPlace(p)){ hideDlg(); teleport(PLACES[p], () => showScene(id)); return; }
  showScene(id);
}
function showScene(id){
  if(id === 'p_bus') st.bus = { x:1300, mode:'park' };
  if(id === 'morning') st.wake = null;
  st.scene = id;
  const sc = S[id]();
  loreHook(id, sc);
  st.view = { id, title: sc.title || '', pages: sc.text.filter(Boolean).map(wrapP) };
  DLG = { i:0 }; curChoices = sc.choices || [];
  { const sp = speakerOf(id); if(sp && !PORTRAIT_KEYS(sp[0]).every(k => IMG[k])) ensure(PORTRAIT_KEYS(sp[0]), 0).then(() => { if(st && st.view && st.view.id === id) portraitPage(); }); }
  if(['noon_vision','varya_song'].includes(id) || (id === 'gr_dinner' && F('heardTune') && has('c_lullaby'))) lullaby();
  ui.dlg = true; hideHint(); $('area').classList.remove('on'); showPortrait(id); renderDlg(); updateHud(); save();
}
function resumeDlg(){ const id = st.scene; showPortrait(id); const sc = S[id](); curChoices = sc.choices || []; if(!st.view || st.view.id !== id) st.view = { id, title: sc.title || '', pages: sc.text.filter(Boolean).map(wrapP) }; DLG = { i: st.view.pages.length - 1 }; ui.dlg = true; renderDlg(); }
function renderDlg(){
  const v = st.view, last = DLG.i >= v.pages.length - 1;
  $('dlg').hidden = false; $('dlgWho').textContent = STRIPS[st.strip].name + (v.title ? ' · ' + v.title : '');
  $('dlgPg').textContent = v.pages.length > 1 ? `${Math.min(DLG.i + 1, v.pages.length)} / ${v.pages.length}` : '';
  $('dlgText').innerHTML = v.pages.slice(0, DLG.i + 1).join('');
  $('dlgMore').hidden = last;
  portraitPage();
  $('dlgCh').innerHTML = last ? curChoices.map((c, i) => `<button type="button" class="ch${c.say ? ' say' : ''}" data-i="${i}"${c.dis ? ' disabled' : ''} style="animation-delay:${i * 40}ms"><span class="n"><b>${i + 1}</b></span><span class="tx">${c.t}${c.sub ? `<span class="sub">${c.sub}</span>` : ''}</span>${c.cost ? '<span class="cost">время</span>' : ''}</button>`).join('') : '';
  const b = $('dlgBody'); b.scrollTop = b.scrollHeight;
  if(last && curChoices.length && !matchMedia('(pointer:coarse)').matches){ const f = $('dlgCh').querySelector('.ch:not([disabled])'); if(f) f.focus({ preventScroll:true }); }
}
function advance(){
  if(!DLG) return; const n = st.view.pages.length;
  if(DLG.i < n - 1){ DLG.i++; renderDlg(); sfx('page'); }
  else if(!curChoices.length) closeDlg();
}
function choose(i){
  const c = curChoices[i]; if(!c || c.dis) return;
  if(DLG.i < st.view.pages.length - 1) return;
  let next = c.go || 'walk';
  if(c.fn){ const r = c.fn(); if(typeof r === 'string') next = r; }
  if(c.cost){ pass(c.cost); updateHud(); }
  if(next === 'loc' || next === 'walk') closeDlg(); else openScene(next);
}
function hideDlg(){ $('dlg').hidden = true; ui.dlg = false; hidePortrait(); }
function closeDlg(){
  hideDlg(); st.scene = null; st.view = null; DLG = null; curChoices = [];
  if(ui.end) return save();
  if(st.pend){ const p = st.pend; st.pend = null; teleport(p, closeDlg); return; }
  if(st.day >= 5 && !F('busDone')){ busArrive(); return; }
  if(st.morningDue){ st.morningDue = false; openScene('morning'); return; }
  updateHud(); save();
}
function busArrive(){
  const go = () => { st.bus = { x:2300, mode:'arrive' }; ui.cut = true; };
  if(st.strip !== 'road') teleport(['road', 1040], go); else go();
}
function busLeave(){ if(st.bus) st.bus.mode = 'leave'; }

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
      const fx = el.querySelector('.fx'); fx.classList.remove('flinch', 'pop'); void fx.offsetWidth; fx.classList.add(['afraid', 'broken', 'cold'].includes(mood) ? 'flinch' : 'pop');
    } else cur.src = im.src;
    P.key = im.src;
  }
  el.classList.add('on'); return true;
}
function portraitPage(){
  if(!st || !st.view || !DLG) return hidePortrait();
  const id = st.view.id, base = speakerOf(id);
  if(!base) return hidePortrait();
  const L = { who:'anna', mood: base[0] === 'anna' ? base[1] : 'neutral' };
  let R = base[0] === 'anna' ? null : { who:base[0], mood:base[1] }, sp = base[0] === 'anna' ? 'L' : 'R';
  const rules = MOODS.filter(r => r[0] === id);
  for(let k = 0; k <= DLG.i && k < st.view.pages.length; k++){
    const pg = st.view.pages[k]; let hit = false;
    for(const [, sub, spec] of rules){ if(!pg.includes(sub)) continue; hit = true;
      for(const tok of spec.split(' ')){ const quiet = tok[0] === '~', [who, mood] = tok.replace('~', '').split(':');
        if(who === 'anna'){ if(mood) L.mood = mood; if(!quiet) sp = 'L'; }
        else if(portraitFor(who, mood || 'neutral')){ R = { who, mood: mood || 'neutral' }; if(!quiet) sp = 'R'; } } }
    if(!hit && pg.includes('class="dl"') && R) sp = 'R';
  }
  const okR = R ? setSlot('R', R.who, R.mood) : setSlot('R', null);
  setSlot('L', L.who, L.mood);
  if(!okR) sp = 'L';
  slotEl('L').classList.toggle('listen', sp !== 'L'); slotEl('R').classList.toggle('listen', sp !== 'R');
}
function showPortrait(){ portraitPage(); }
function hidePortrait(){ for(const s of ['L', 'R']){ slotEl(s).classList.remove('on', 'listen'); PSLOT[s].key = null; } }

/* ---------- HUD ---------- */
const GLYPH = [
  '<path d="M2 16h18" stroke="#1c1611" stroke-width="1.6"/><path d="M5.5 16a5.5 5.5 0 0 1 11 0z" fill="#e8c14e" stroke="#1c1611" stroke-width="1.4"/><g stroke="#b8321f" stroke-width="1.8" stroke-linecap="round"><path d="M11 4v3M4 7.5l2 2M18 7.5l-2 2"/></g>',
  '<g stroke="#1c1611" stroke-width="1.2"><path d="M11 1.5l1.6 3.4h-3.2zM11 20.5l1.6-3.4h-3.2zM1.5 11l3.4-1.6v3.2zM20.5 11l-3.4-1.6v3.2z" fill="#b8321f"/><path d="M4.3 4.3l3.4 1.3-2.1 2.1zM17.7 17.7l-3.4-1.3 2.1-2.1zM4.3 17.7l1.3-3.4 2.1 2.1zM17.7 4.3l-1.3 3.4-2.1-2.1z" fill="#e8c14e"/></g><circle cx="11" cy="11" r="5" fill="#e8c14e" stroke="#1c1611" stroke-width="1.5"/>',
  '<path d="M2 15h18" stroke="#1c1611" stroke-width="1.6"/><path d="M4.5 15a6.5 6.5 0 0 1 13 0z" fill="#d9744f" stroke="#1c1611" stroke-width="1.4"/><path d="M2 18.5h18" stroke="#b8321f" stroke-width="1.6"/>',
  '<path d="M14.5 3.5a7.5 7.5 0 1 0 4 12.5A8 8 0 0 1 14.5 3.5z" fill="#f3e7b8" stroke="#1c1611" stroke-width="1.5"/><path d="M17 4l.8 1.7 1.7.8-1.7.8L17 9l-.8-1.7-1.7-.8 1.7-.8z" fill="#e8c14e" stroke="#1c1611" stroke-width=".8"/>' ];
function updateHud(){
  if(!st) return;
  const pro = !F('arrived') && st.day === 0;
  $('clk').textContent = pro ? 'пролог' : `${dayName(st.day).toLowerCase()} · ${PHASES[st.phase]}`;
  $('glyph').innerHTML = GLYPH[st.phase];
  [...$('signal').children].forEach((b, i) => b.classList.toggle('on', i < st.signal));
  $('signal').hidden = st.signal <= 0 && F('arrived');
  $('bookDot').hidden = !st.unseen; $('bookDot').textContent = st.unseen;
  $('goal').hidden = false; $('goal').innerHTML = '<small>Цель</small>' + goalText();
}
let hintT = null;
function showHint(){ const h = $('hint'); h.innerHTML = matchMedia('(pointer:coarse)').matches ? 'Нажмите на землю, чтобы идти. Нажмите на подсказку, чтобы действовать.' : '<b>A D</b> или <b>← →</b> идти · <b>Shift</b> бежать · <b>E</b> действие · <b>Tab</b> тетрадь · или просто кликайте'; h.classList.remove('off'); clearTimeout(hintT); hintT = setTimeout(hideHint, 9000); }
function hideHint(){ $('hint').classList.add('off'); }

/* ---------- тетрадь ---------- */
let bookTab = 'case';
const TABS = [ ['case','Улики'], ['ver','Версия'], ['leads','Зацепки'], ['notes','Записки'], ['world','Заветье'], ['lore','Поверья'], ['gram','Грамматика'] ];
function openBook(tab){ if(tab) bookTab = tab; ui.nb = true; $('nbw').hidden = false; st.unseen = 0; renderBook(); updateHud(); sfx('page'); }
function closeBook(){ ui.nb = false; $('nbw').hidden = true; }
function renderBook(){
  if(!st) return;
  $('nbSide').innerHTML = '<div class="nb-title">Тетрадь</div>' + TABS.filter(([k]) => k !== 'leads' || st.diff !== 'hard').map(([k, l]) => {
    const n = k === 'case' ? st.order.length : k === 'notes' ? st.notes.length : k === 'world' ? st.changes.length : k === 'lore' ? (st.lore || []).length : 0;
    return `<button type="button" class="nb-tab" data-tab="${k}" aria-selected="${k === bookTab}">${l}${n ? `<span class="n">${n}</span>` : ''}</button>`; }).join('') + '<button type="button" class="nb-close" id="nbClose">Закрыть</button>';
  $('nbMain').innerHTML = ({ case:caseUI, ver:verUI, leads:leadsUI, notes:notesUI, world:worldUI, lore:loreUI, gram:gramUI })[bookTab]();
}
function caseUI(){
  let h = '<div class="case-h">Дело первое</div><div class="case-q">Гриша, который уедет в субботу. Какую историю мне рассказывают неправильно?</div>';
  if(!st.order.length) return h + '<p class="empty">Пока пусто. Улики появятся, когда Анна начнёт разговаривать с людьми и осматривать дома.</p>';
  const enIds = st.order.filter(id => CLUES[id].kind === 'en'), rest = st.order.filter(id => CLUES[id].kind !== 'en');
  if(enIds.length) h += '<h3>Записи по-английски</h3><div class="cards">' + enIds.map(clueCard).join('') + '</div>';
  if(rest.length) h += '<h3>Свидетельства</h3><div class="cards">' + rest.slice().reverse().map(clueCard).join('') + '</div>';
  return h;
}
function clueCard(id){
  const c = CLUES[id], s = st.clues[id];
  let h = `<article class="clue${s.doubt ? ' doubt' : ''}"><div class="clue-meta"><span class="k">${KIND[c.kind]}</span><span>${c.src}</span></div><h5>${c.t}</h5>`;
  if(c.kind === 'en'){
    if(s.blank) h += '<p><em>Страница пуста. Здесь было что-то написано.</em></p>';
    else { h += `<p>${en(c.en, c.ru)}</p>`; if(c.red) h += `<div class="red">${c.red}</div>`; h += lensUI(id); }
  } else h += `<p>${c.text}</p>`;
  if(!s.blank) h += `<div class="clue-foot"><button type="button" class="doubt-b" data-doubt="${id}">${s.doubt ? 'Снова доверять' : 'Не доверять'}</button></div>`;
  return h + '</article>';
}
function lensUI(id){
  const c = CLUES[id], s = st.clues[id];
  if(st.diff === 'easy'){ const L = LENSES[c.lens]; return `<div class="tip">Что доказывает: <b>${L.label}</b> (${L.form}). ${L.tip}</div>`; }
  let h = '<div class="clue-foot"><span class="lens-q">Что доказывает эта запись?</span>';
  for(const [k, L] of Object.entries(LENSES)) h += `<button type="button" class="pill" data-lens="${id}:${k}" aria-pressed="${s.lens === k}">${L.label}</button>`;
  h += '</div>';
  if(s.lens && st.diff === 'normal') h += `<div class="tip">${LENSES[s.lens].tip}</div>`;
  return h;
}
function verUI(){
  let h = '<div class="case-h">Версия</div><div class="case-q">Выберите, что на самом деле случилось с Гришей, и приложите три свидетельства, которые не спорят друг с другом. Лес примет любую версию, даже неверную, если она так доказана.</div>';
  if(st.outcome) return h + `<span class="sentence">${sentence()}</span><p>Лес принял эту версию. Дело закрыто.</p>`;
  h += '<h3>Что случилось</h3><div class="stmts">' + Object.entries(STMTS).map(([k, S0]) => `<button type="button" class="stmt" data-stmt="${k}" aria-pressed="${st.ver.s === k}">${S0.t}</button>`).join('') + '</div>';
  if(!st.ver.s) return h + '<p class="empty">Сначала выберите версию.</p>';
  const p = proof(), hard = st.diff === 'hard', n = hard ? Math.min(3, st.ver.att.filter(has).length) : Math.min(3, p.pro);
  h += '<h3>Свидетельства</h3><div class="knots">' + [0, 1, 2].map(i => `<span class="knot${i < n ? ' on' : ''}"></span>`).join('') + '</div>';
  if(hard) h += `<p class="status${accepted() ? ' ok' : ''}">${accepted() ? 'Лес слышит эту версию.' : 'Лес пока не слышит.'}</p>`;
  else if(p.con > 0) h += '<p class="status bad">Среди приложенного есть свидетельство, которое этой версии противоречит.</p>';
  else if(p.pro >= NEED) h += '<p class="status ok">Версия держится. Её можно рассказать на лесной остановке.</p>';
  else h += `<p class="status">Нужно ещё ${NEED - p.pro}.</p>`;
  const pool = st.order.filter(id => !st.clues[id].blank);
  if(!pool.length) return h + '<p class="empty">Прикладывать пока нечего.</p>';
  h += '<ul class="att">';
  for(const id of pool){ const on = st.ver.att.includes(id), d = st.clues[id].doubt, c = CLUES[id]; let tag = '';
    if(d) tag = '<span class="tag nil">не доверяю</span>';
    else if(c.kind === 'en' && !st.clues[id].lens) tag = '<span class="tag nil">не разобрана</span>';
    else if(st.diff === 'easy'){ const v = relOf(id, st.ver.s); tag = v > 0 ? '<span class="tag pro">подтверждает</span>' : v < 0 ? '<span class="tag con">противоречит</span>' : '<span class="tag nil">не о том</span>'; }
    h += `<li><input type="checkbox" id="att-${id}" data-att="${id}"${on ? ' checked' : ''}${d ? ' disabled' : ''}><label for="att-${id}">${c.t}</label>${tag}</li>`; }
  return h + '</ul><p class="hint-line" style="margin-top:12px">Рассказать версию можно только там, где судьба оборвалась.</p>';
}
function goalText(){
  if(!F('arrived')) return st.strip === 'flat' ? 'Разобрать мамин шкаф' : 'Найти дом по адресу: Нижняя улица, 7';
  if(!F('caseOpen')) return 'Отдохнуть с дороги';
  if(st.outcome) return F('busDone') ? 'Осмотреться в Заветье' : 'Дождаться воскресного автобуса на старой дороге';
  if(F('foundRoad')) return 'Выбрать версию в тетради и рассказать её Грише на лесной остановке';
  if(has('c_timetable') || has('e3')) return 'Найти того Гришу, который до сих пор ждёт автобус. Дорогу знает Леший на опушке';
  return 'Узнать, почему Гриша двадцать два года не может уехать';
}
function leadsUI(){
  const L = [], easy = st.diff === 'easy', c = id => has(id);
  if(!F('searchedHouse')) L.push('Осмотреть дом Аглаи: в горнице полка с тетрадями учеников.');
  if(F('searchedHouse') && !F('hasNotebook')) L.push(F('greeted') ? 'Домовой одалживает гостям только за угощение: молоко и пирог от Груни. Звать его ночью у печи.' : 'Ночью позвать домового у печи.');
  if(!F('talkedGrisha')) L.push('Гриша чинит мотоцикл во дворе Лаптевых утром и днём, в конце Нижней улицы.');
  if(F('talkedGrisha') && !c('c_suitcase')) L.push('Попросить Гришу показать чемодан.');
  if(!c('c_nina')) L.push('Мать Гриши, Нина Петровна, бывает во дворе утром и вечером.');
  if(!c('c_timetable')) L.push('В доме Лаптевых что-то висит под стеклом у вешалки. Сначала поговорить с Ниной Петровной или Варей.');
  if(!F('schoolDone')) L.push('Старая школа закрыта. Варя знает, как попасть внутрь.');
  if(c('c_varya') && !c('c_banya')) L.push('Баня Лаптевых. Засов снаружи.');
  if(!F('noonDone')) L.push((c('c_timetable') || c('e3')) ? 'В полдень в поле кто-то ходит. Теперь известна точная дата.' : 'В полдень в поле спрашивают, который час. Нужна точная дата.');
  if((c('c_timetable') || c('e3')) && !F('foundRoad')) L.push('Леший на опушке ведёт туда, куда хочешь на самом деле. Теперь ясно, кого ищешь.');
  if(easy && F('heardTune') && !c('c_lullaby')) L.push('Колыбельную из видения кто-то поёт в деревне. Может, за ужином у Груни?');
  if(F('foundRoad') && !st.outcome) L.push('Выбрать версию в тетради, приложить три свидетельства и рассказать её парню на лесной остановке.');
  if(st.outcome) L.push('Дело закрыто. В воскресенье утром на старую дорогу придёт автобус.');
  return '<div class="case-h">Зацепки</div><div class="case-q">Куда можно пойти. На высокой сложности этой страницы нет.</div>' + (L.length ? `<ul class="leads">${L.map(x => `<li>${x}</li>`).join('')}</ul>` : '<p class="empty">Всё, что можно было найти, найдено.</p>');
}
function notesUI(){
  if(!st.notes.length) return '<p class="empty">Записок пока нет.</p>';
  let h = ''; const ag = st.notes.filter(id => !NOTES[id].ru), other = st.notes.filter(id => NOTES[id].ru);
  if(ag.length){ h += '<h3>Записки Аглаи</h3>'; for(const id of ag){ const n = NOTES[id], a = NOTE_ANN[id] ? NOTE_ANN[id]() : ''; h += `<div class="nt"><div class="src">${n.src}</div>${en(n.en, n.ru)}${a ? `<div class="ann">${a}</div>` : ''}</div>`; } }
  for(const id of other){ const n = NOTES[id], a = NOTE_ANN[id] ? NOTE_ANN[id]() : ''; h += `<h3>${n.title || 'Правила Груни'}</h3><div class="nt"><div class="src">${n.src}</div><ul>${n.items.map(x => `<li>${x}</li>`).join('')}</ul>${a ? `<div class="ann">${a}</div>` : ''}</div>`; }
  return h;
}
function worldUI(){
  let h = '<h3>Как меняется Заветье</h3>';
  h += st.changes.length ? st.changes.map(c => `<div class="chg"><small>${dayName(c.day)} · ${PHASES[c.phase]}</small>${c.text}</div>`).join('') : '<p class="empty">Пока всё как было. Или так только кажется.</p>';
  h += '<h3>Люди и не люди</h3>' + (st.people.length ? `<dl class="ppl">${st.people.map(p => `<dt>${PEOPLE[p].n}</dt><dd>${PEOPLE[p].d}</dd>`).join('')}</dl>` : '<p class="empty">Анна пока никого не знает.</p>');
  h += '<h3>Дом Аглаи</h3><p>' + (F('greeted') ? 'Анна поздоровалась с домом. Домовой принимает её как гостью: тепло и вежливо, но хозяйское только одалживает.' : F('silentEntry') ? 'Анна промолчала, как велела Аглая. Домовой зовёт её хозяйкой. Кто-то в углу с этим не согласен.' : 'Анна ещё не дошла до дома.') + '</p>';
  return h;
}
function gramUI(){
  return `<h3>Грамматика Аглаи</h3><p style="max-width:62ch">Страница, вклеенная в конец тетради. В Заветье память переписывает всё, что пересказывают. Домашние задания не пересказывает никто. Каждую английскую запись в тетради можно прочитать одним из трёх способов.</p>
  <div class="gram-wrap"><table class="gram"><thead><tr><th>Форма</th><th>По-русски</th><th>Что это доказывает</th></tr></thead><tbody>
  <tr class="key"><td>want to · will</td><td>хочу · уеду</td><td><b>Мечтал.</b> Желание и намерение, но без даты и билета.</td></tr>
  <tr class="key"><td>be going to · have bought</td><td>собираюсь · уже купил</td><td><b>Собирался.</b> План и сделанные шаги.</td></tr>
  <tr class="key"><td>would have left</td><td>уехал бы</td><td><b>Не случилось.</b> Что-то помешало.</td></tr></tbody></table></div>
  <p style="font:500 22px/1.25 var(--hand);color:var(--cin);margin-top:14px">Для расследования это разные вещи. — А. К.</p>`;
}
document.addEventListener('click', e => {
  const t = e.target;
  const trb = t.closest('.trb'); if(trb){ e.stopPropagation(); const s = document.createElement('span'); s.className = 'tr'; s.textContent = trb.dataset.tr; trb.replaceWith(s); return; }
  if(t.closest('#nbClose')){ closeBook(); return; }
  const tab = t.closest('[data-tab]'); if(tab){ bookTab = tab.dataset.tab; renderBook(); return; }
  const ln = t.closest('[data-lens]'); if(ln){ const [id, k] = ln.dataset.lens.split(':'); st.clues[id].lens = st.clues[id].lens === k ? null : k; save(); renderBook(); return; }
  const db = t.closest('[data-doubt]'); if(db){ const s = st.clues[db.dataset.doubt]; s.doubt = !s.doubt; save(); renderBook(); return; }
  const op = t.closest('[data-stmt]'); if(op){ const k = op.dataset.stmt; st.ver.s = st.ver.s === k ? null : k; save(); renderBook(); return; }
  const sd = t.closest('[data-sd]'); if(sd){ setDiff(sd.dataset.sd); renderMenu(); return; }
  const dp = t.closest('#diffPick button'); if(dp){ pickDiff = dp.dataset.d; document.querySelectorAll('#diffPick button').forEach(b => b.setAttribute('aria-pressed', b === dp)); return; }
  const mm = t.closest('[data-m]'); if(mm){ $('menu').hidden = true; if(mm.dataset.m === 'title'){ save(); showTitle(); } if(mm.dataset.m === 'restart'){ wipeSave(); st = null; showTitle(); } return; }
  if(t === $('nbw')) closeBook();
  if(!t.closest('#menu') && !t.closest('#bMenu')) $('menu').hidden = true;
});
document.addEventListener('change', e => {
  const a = e.target.closest('[data-att]'); if(!a) return;
  const id = a.dataset.att;
  if(a.checked){ if(!st.ver.att.includes(id)) st.ver.att.push(id); } else st.ver.att = st.ver.att.filter(x => x !== id);
  save(); renderBook();
});
$('bBook').onclick = () => (ui.nb ? closeBook() : openBook());
$('bMenu').onclick = () => { renderMenu(); $('menu').hidden = !$('menu').hidden; };

function loreUI(){
  const known = (st.lore || []).map(k => LORE[k]), n = Object.keys(LORE).length;
  let h = `<div class="case-h">Поверья Заветья</div><div class="case-q">Что здесь знают все, кроме приезжих. Найдено ${known.length} из ${n}.</div><span class="orn"></span>`;
  if(!known.length) return h + '<p class="empty">Пока пусто. Поверья рассказывают вещи и люди: печь, колодец, травы, река.</p>';
  return h + '<div class="lore-list">' + known.map(L => `<article class="lore-card"><small>${L.w}</small><h5>${L.t}</h5><p>${L.x}</p></article>`).join('') + '</div>';
}
/* ---------- финал ---------- */
function showEnd(kind){
  const o = st.outcome, a = st.flags.answer;
  const title = kind === 'leave' ? (o ? 'Автобус обратно' : 'Лес подождёт') : ({ truth:'Остановка на старой дороге', half:'Ржавый навес', convenient:'Заросшая дорога', erase:'Чистые страницы', loop:'Шесть тридцать восемь' }[o] || 'Заветье');
  const P = [];
  if(kind === 'leave'){
    P.push('Автобус трогается. В заднем стекле Заветье становится маленьким: дома, дым, лес. Телефон находит сеть на сороковом километре.');
    P.push('Через месяц Анна не может вспомнить, как звали учительницу, которая прислала ей посылку. Ключ лежит в ящике стола.' + (F('thread') === 'wrist' ? ' Нить на запястье до сих пор красная.' : ''));
    if(!o) P.push('А где-то в лесу парень с чемоданом смотрит на часы. На часах 6:38.');
  } else {
    P.push('Автобус уходит без неё. «Ну, до воскресенья», — говорит водитель. «Какого?» — спрашивает Анна. «А какого надо?»');
    P.push('В доме Аглаи тепло. А в стене горницы, где вчера была просто стена, теперь есть дверь. Анна точно помнит, что вчера её не было.');
  }
  const kept = st.order.filter(id => !CLUES[id].fake && !st.clues[id].doubt && !st.clues[id].blank).length;
  const L = [ ['Дом Аглаи принял Анну', F('greeted') ? 'как гостью' : 'как хозяйку'], ['Версия, которую принял лес', o ? sentence() : 'Никакой. Дело Гриши осталось открытым'],
    ['Свидетельств сохранено', String(kept)], ['Удобных окончаний закреплено', ['convenient','erase','loop'].includes(o) ? '1' : '0'] ];
  if(a) L.push(['Что Анна сказала Грише', { leave:'«Уезжай». Решила за него', stay:'«Оставайся». Решила за него', choice:'Вернула ему правду и отказалась решать за него', silence:'Промолчала' }[a]]);
  L.push(['Груня', [F('toldMother') ? 'знает, чья Анна дочь' : 'не знает, чья Анна дочь', F('grunyaNoticed') ? 'видела, как Анна открывала комод' : ''].filter(Boolean).join('; ')]);
  if(F('reflection')) L.push(['Отражение в Кромке', 'опаздывает на полсекунды']);
  $('endBody').innerHTML = `<h1 class="t-title" style="font-size:clamp(40px,7vw,76px)">${title}</h1><span class="t-orn"></span>
    ${P.map(x => `<p class="t-lead">${x}</p>`).join('')}
    <ul class="end-list">${L.map(([k, v]) => `<li><small>${k}</small>${v}</li>`).join('')}</ul>
    <div class="teaser"><b>Дело второе: дверь, которой вчера не было</b>В доме Аглаи появилась комната. В ней живёт кто-то, кого Анна не помнит, а он помнит её. Дальше — четыре легенды Заветья, Отражённая Анна и Изба Порогов.</div>
    <div class="acts" style="margin-top:20px"><button class="btn" type="button" id="endRestart">Сыграть заново</button>${kind === 'stay' ? '<button class="btn ghost" type="button" id="endStay">Остаться и погулять</button>' : ''}</div>
    <p class="t-foot">В следующий раз попробуйте иначе войти в дом. Там, где Анна поздоровалась, ей одалживают. Там, где промолчала, ей подбрасывают.</p>`;
  ui.end = true; $('endScr').hidden = false; $('endScr').scrollTop = 0; $('hud').hidden = true; $('prompt').hidden = true;
  setF('ended', kind); save();
  $('endRestart').onclick = () => { wipeSave(); st = null; $('endScr').hidden = true; ui.end = false; showTitle(); };
  const sb = $('endStay'); if(sb) sb.onclick = () => { $('endScr').hidden = true; ui.end = false; st.flags.ended = false; $('hud').hidden = false; save(); };
}

/* ---------- титул ---------- */
let pickDiff = 'normal';
const TITLE_V = { strip:'road', phase:2, day:0, x:1130, dir:-1, flags:{}, bus:null, scene:null, outcome:null };
let titleCam = 700;
function drawTitle(dt){ const vw = VIEW.viewW, ax = R('road', 1150), W = RW('road'); titleCam = Math.max(0, Math.min(W - vw, ax - vw * (innerWidth < 760 ? .5 : .62) + Math.sin(T * .05) * 20)); drawFrame(TITLE_V, titleCam, { x:1150, dir:-1, move:false, ph:0 }); }
function showTitle(){
  ui.title = true; ui.dlg = false; hideDlg(); closeBook(); $('hud').hidden = true; $('prompt').hidden = true; $('endScr').hidden = true;
  const sv = loadSave(); $('bCont').hidden = !sv || !!(sv.flags && sv.flags.ended);
  $('titleScr').hidden = false;
  if(st){ st = null; }
}
function startGame(s){
  st = s; ui.title = false; $('titleScr').hidden = true; $('hud').hidden = false; audioInit();
  snapCam(); updateHud(); showArea(); preloadNear(st.strip);
  if(st.scene) resumeDlg(); else if(!F('parcelSeen')){ setF('parcelSeen'); setTimeout(() => { showHint(); }, 900); }
}
$('bNew').onclick = () => { if(!LOAD.ready) return; wipeSave(); startGame(fresh(pickDiff)); };
$('bCont').onclick = () => { if(!LOAD.ready) return; const sv = loadSave(); if(sv) startGame(sv); };
function setDiff(d){
  st.diff = d; if(d === 'easy') for(const id of st.order) if(CLUES[id].kind === 'en' && !st.clues[id].lens) st.clues[id].lens = CLUES[id].lens;
  if(bookTab === 'leads' && d === 'hard') bookTab = 'case';
  save(); if(ui.nb) renderBook(); toast('Сложность: ' + ({ easy:'лёгкая', normal:'обычная', hard:'высокая' }[d]));
}
function renderMenu(){ $('menuDiff').innerHTML = ['easy','normal','hard'].map(d => `<button type="button" data-sd="${d}" aria-pressed="${!!st && st.diff === d}">${{ easy:'лёгкая', normal:'обычная', hard:'высокая' }[d]}</button>`).join(''); }

/* ---------- фактура бумаги ---------- */
(function(){ const c = document.createElement('canvas'); c.width = c.height = 220; const g = c.getContext('2d'), im = g.createImageData(220, 220);
  for(let i = 0; i < im.data.length; i += 4){ const v = 240 + Math.random() * 15; im.data[i] = v; im.data[i + 1] = v - 3; im.data[i + 2] = v - 11; im.data[i + 3] = 255; }
  g.putImageData(im, 0, 0); g.lineWidth = .7; for(let i = 0; i < 160; i++){ const x = Math.random() * 220, y = Math.random() * 220, a = Math.random() * 6.28, l = 3 + Math.random() * 10; g.strokeStyle = `rgba(140,105,60,${.12 + Math.random() * .12})`; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
  $('paperfx').style.backgroundImage = `url(${c.toDataURL()})`; })();

