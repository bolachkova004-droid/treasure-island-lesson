'use strict';
/* =====================================================================
   ТЕТРАДЬ АННЫ — физическая вещь: бумага, закладки, вклеенные фото,
   карандашные подписи, перечёркивания и красная нить между записями.
   Разделы: Дело · Люди · Заветье · Записи · English.
   На телефоне — четыре пункта внизу: Дело · Люди · Мир · English.
   ===================================================================== */
let bookTab = 'case';
const TABS = [ ['case','Дело'], ['people','Люди'], ['world','Заветье'], ['notes','Записи'], ['en','English'] ];
const MTABS = [ ['case','Дело'], ['people','Люди'], ['world','Мир'], ['en','English'] ];
const TAB_ALIAS = { ver:'case', leads:'case', lore:'world', gram:'en' };
const mobile = () => innerWidth <= 760 || innerHeight <= 500;

function openBook(tab){
  if(tab) bookTab = TAB_ALIAS[tab] || tab;
  ui.nb = true; $('nbw').hidden = false; st.unseen = 0; renderBook(); updateHud(); sfx('page'); focusSync(); hideHint();
  trackOnce('notebook_opened'); track('notebook_opened');
}
function closeBook(){ ui.nb = false; $('nbw').hidden = true; if(typeof focusSync === 'function') focusSync(); }
function tabCount(k){
  if(!st) return 0;
  return { case: st.order.filter(id => CLUES[id].kind !== 'en').length, people: st.people.length, world: st.changes.length + st.lore.length + (st.songs || []).length,
    notes: st.notes.length, en: st.order.filter(id => CLUES[id].kind === 'en').length + Object.keys((st.en && st.en.docs) || {}).length }[k] || 0;
}
function renderBook(){
  if(!st) return;
  if(mobile() && bookTab === 'notes') bookTab = 'world';
  $('nbSide').innerHTML = TABS.map(([k, l]) => { const n = tabCount(k); return `<button type="button" class="mark${k === 'en' ? ' en-mark' : ''}" role="tab" data-tab="${k}" aria-selected="${k === bookTab}">${l}${n ? `<span class="n">${n}</span>` : ''}</button>`; }).join('');
  $('nbMob').innerHTML = MTABS.map(([k, l]) => { const n = k === 'world' ? tabCount('world') + tabCount('notes') : tabCount(k); return `<button type="button" role="tab" data-tab="${k}" aria-selected="${k === bookTab}">${l}${n ? `<span class="n">${n}</span>` : ''}</button>`; }).join('');
  const main = $('nbMain');
  const keep = BK.tab === bookTab; if(!keep){ BK.tab = bookTab; BK.p = 0; }
  const sl = main.scrollTop;
  main.innerHTML = ({ case:caseUI, people:peopleUI, world: () => worldUI() + (mobile() ? '<h3>Записи</h3>' + notesUI(true) : ''), notes:notesUI, en:enUI })[bookTab]();
  main.scrollTop = keep ? sl : 0;
  spreadLayout();
  requestAnimationFrame(drawThreads);
}

/* ---------- разворот: на большом экране тетрадь — книга на две страницы ----------
   Текст сам перетекает со страницы на страницу (колонки), разворот листается:
   правая страница поднимается вместе с текстом и ложится налево. */
const BK = { tab:null, p:0, n:1, step:0, busy:false };
const spreadOK = () => innerWidth >= 1000 && innerHeight >= 640;
function spreadLayout(){
  const m = $('nbMain'), b = m.closest('.book'), on = spreadOK();
  b.classList.toggle('spread', on); bookFoot(on);
  if(!on){ BK.n = 1; return; }
  const cs = getComputedStyle(m), pl = parseFloat(cs.paddingLeft), pr = parseFloat(cs.paddingRight), gap = parseFloat(cs.columnGap) || 0;
  const cw = m.clientWidth - pl - pr, colW = (cw - gap) / 2; BK.step = cw + gap;
  m.scrollLeft = 0; const cols = Math.max(1, Math.round((m.scrollWidth - pl - pr + gap) / (colW + gap)));
  BK.n = Math.max(1, Math.ceil(cols / 2)); BK.p = Math.min(BK.p, BK.n - 1);
  m.scrollLeft = BK.p * BK.step; bookFoot(true);
}
function bookFoot(on){
  const b = $('nbMain').closest('.book'); let f = b.querySelector('.bk-foot');
  if(!f){ f = document.createElement('div'); f.className = 'bk-foot'; f.innerHTML = '<button type="button" class="bk-prev" aria-label="Предыдущий разворот"><span aria-hidden="true">‹</span> <i></i></button><button type="button" class="bk-next" aria-label="Следующий разворот"><i></i> <span aria-hidden="true">›</span></button>'; b.appendChild(f);
    f.querySelector('.bk-prev').onclick = () => turnPage(-1); f.querySelector('.bk-next').onclick = () => turnPage(1); }
  f.hidden = !on; if(!on) return;
  const [pv, nx] = f.querySelectorAll('button');
  pv.querySelector('i').textContent = BK.p * 2 + 1; nx.querySelector('i').textContent = BK.p * 2 + 2;
  pv.disabled = BK.p <= 0; nx.disabled = BK.p >= BK.n - 1; f.classList.toggle('single', BK.n <= 1);
}
/* копия страницы для перелистывания: без id, прокручена на нужный разворот */
function pageClone(m, scroll){ const c = m.cloneNode(true); c.removeAttribute('id'); c.querySelectorAll('[id]').forEach(e => e.removeAttribute('id')); c.classList.add('pclone'); c.setAttribute('aria-hidden', 'true'); c.style.width = m.clientWidth + 'px'; c.style.height = m.clientHeight + 'px'; c._sl = scroll; return c; }
function turnPage(d){
  if(BK.busy || !spreadOK()) return; const np = BK.p + d; if(np < 0 || np >= BK.n) return;
  const m = $('nbMain'), b = m.closest('.book'), W = m.clientWidth, H = m.clientHeight, half = W / 2, old = BK.p * BK.step, nw = np * BK.step;
  sfx('page'); BK.busy = true;
  const done = () => { BK.p = np; m.scrollLeft = nw; bookFoot(true); requestAnimationFrame(drawThreads); BK.busy = false; };
  if(matchMedia('(prefers-reduced-motion: reduce)').matches || !Element.prototype.animate){ done(); return; }
  try{
    const box = (x, cls) => { const e = document.createElement('div'); e.className = cls; e.style.left = (m.offsetLeft + x) + 'px'; e.style.top = m.offsetTop + 'px'; e.style.width = half + 'px'; e.style.height = H + 'px'; return e; };
    const fill = (face, scroll, showRight) => { const c = pageClone(m, scroll); c.style.left = showRight ? -half + 'px' : '0px'; face.appendChild(c); return c; };
    // под листом: та половина старого разворота, которую лист ещё не накрыл
    const under = box(d > 0 ? 0 : half, 'leaf-under'); fill(under, old, d < 0);
    const leaf = box(d > 0 ? half : 0, 'leaf ' + (d > 0 ? 'fwd' : 'back'));
    const front = document.createElement('div'), back = document.createElement('div'); front.className = 'face front'; back.className = 'face back';
    fill(front, old, d > 0); fill(back, nw, d < 0); leaf.append(front, back);
    b.append(under, leaf);
    for(const c of [...under.children, ...front.children, ...back.children]) c.scrollLeft = c._sl;
    m.scrollLeft = nw;   // под поднимающимся листом уже новый разворот
    const a = leaf.animate([{ transform:'rotateY(0deg)' }, { transform:`rotateY(${d > 0 ? -180 : 180}deg)` }], { duration:680, easing:'cubic-bezier(.45,.05,.25,1)' });
    setTimeout(() => under.remove(), 340);
    a.onfinish = () => { leaf.remove(); under.remove(); done(); };
  }catch(e){ document.querySelectorAll('.leaf,.leaf-under').forEach(x => x.remove()); done(); }
}
addEventListener('keydown', e => { if(!ui.nb || !spreadOK() || (e.target.closest && e.target.closest('input,textarea'))) return;
  const d = { ArrowRight:1, PageDown:1, KeyD:1, ArrowLeft:-1, PageUp:-1, KeyA:-1 }[e.code]; if(!d) return;
  e.preventDefault(); e.stopImmediatePropagation(); turnPage(d); }, true);
/* фокус с клавиатуры может увести на соседний разворот — выравниваем, чтобы страницы не съезжали */
$('nbMain').addEventListener('scroll', () => { const m = $('nbMain'); if(BK.busy || !spreadOK() || !BK.step) return;
  const p = Math.max(0, Math.min(BK.n - 1, Math.round(m.scrollLeft / BK.step))); if(Math.abs(m.scrollLeft - p * BK.step) > 1) m.scrollLeft = p * BK.step; if(p !== BK.p){ BK.p = p; bookFoot(true); requestAnimationFrame(drawThreads); } });
let wheelT = 0;
document.addEventListener('wheel', e => { if(!ui.nb || !spreadOK() || !e.target.closest('#nbMain')) return; e.preventDefault();
  const now = performance.now(); if(now - wheelT < 500 || Math.abs(e.deltaY) + Math.abs(e.deltaX) < 12) return; wheelT = now; turnPage((e.deltaY || e.deltaX) > 0 ? 1 : -1); }, { passive:false });

/* ---------- Дело: мысль Анны, доска версии, улики-предметы, куда сходить ---------- */
function caseUI(){
  let h = '<div class="case-h">Дело первое</div><div class="case-q">Гриша, который уедет в субботу. Какую историю мне рассказывают неправильно?</div>';
  h += `<p class="pencil">Сейчас: ${goalText()}</p>`;
  h += '<h3>Версия</h3>' + boardUI();
  const things = st.order.filter(id => CLUES[id].kind !== 'en');
  h += '<h3>Улики</h3>' + (things.length ? `<div class="objs">${things.slice().reverse().map(objUI).join('')}</div>` : '<p class="empty">Пока пусто. Улики появятся, когда Анна начнёт разговаривать с людьми и осматривать дома.</p>');
  if(st.diff !== 'hard'){ const L = leads(); h += '<h3>Куда сходить</h3>' + (L.length ? `<ul class="leads">${L.map(x => `<li>${x}</li>`).join('')}</ul>` : '<p class="empty">Всё, что можно было найти, найдено.</p>'); }
  return h;
}
/* улика — свой предмет: фото, билет, показания, письмо, рисунок */
function objUI(id){
  const c = CLUES[id], s = st.clues[id], pinned = st.ver.att.includes(id);
  let body = '';
  switch(c.form){
    case 'photo': body = `<div class="photo"><img src="art/${c.img}.webp" alt="" loading="lazy"><p class="cap">${c.t}</p></div>`; break;
    case 'drawing': body = `<div class="drawing"><img src="art/${c.img}.webp" alt="" loading="lazy"></div><p class="cap">${c.t}</p>`; break;
    case 'ticket': body = '<div class="ticket"><b>РАСПИСАНИЕ ДВИЖЕНИЯ · ЛЕТО 2004</b>Заветье — Тверь&nbsp;&nbsp;Сб 06:40<br>Тверь — Заветье&nbsp;&nbsp;Вс 17:10<br>Обведено карандашом: <span class="circ">12.06</span></div>'; break;
    case 'letter': body = '<div class="letter"><span class="pen">Никуда я не поеду. Сам так решил. Г.</span></div>'; break;
    default: body = `<div class="testi"><span class="src">Со слов: ${c.src}</span><q>${c.t.replace(/^«|»$/g, '')}</q></div>`;
  }
  const src = c.form === 'testi' ? '' : `<span class="src">${c.src}</span>`;
  const acts = [];
  if(!st.outcome && st.ver.s && !s.doubt) acts.push(`<button type="button" data-pin="${id}" class="${pinned ? 'on' : ''}">${pinned ? 'снять с доски' : 'приколоть к версии'}</button>`);
  acts.push(`<button type="button" data-doubt="${id}">${s.doubt ? 'снова доверять' : 'не доверять'}</button>`);
  return `<article class="obj${s.doubt ? ' doubt' : ''}${pinned ? ' pinned' : ''}">${src}${body}<p class="txt">${c.text}</p><div class="obj-acts">${acts.join('')}</div></article>`;
}
function leads(){
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
  if((st.day === 2 || st.day === 3) && !F('rusalDone')) L.push('Ночью у реки провожают русалок. Груня звала стоять с ними.');
  if(easy && F('heardTune') && !c('c_lullaby')) L.push('Колыбельную из видения кто-то поёт в деревне. Может, за ужином у Груни?');
  if(F('foundRoad') && !st.outcome) L.push('Выбрать версию, приколоть три улики и рассказать её парню на лесной остановке.');
  if(st.outcome) L.push('Дело закрыто. В воскресенье утром на старую дорогу придёт автобус.');
  return L;
}

/* ---------- доска версии: тезис + приколотые улики, нить натягивается по решению игрока ---------- */
function boardUI(){
  const hard = st.diff === 'hard', p = proof();
  let h = '<div class="board" id="board"><svg class="threads" id="threads" aria-hidden="true"></svg>';
  const sel = st.ver.s;
  h += '<span class="board-k">Тезис</span>';
  if(!sel) h += '<div class="thesis-row">' + Object.entries(STMTS).map(([k, S0]) => `<button type="button" class="thesis" data-stmt="${k}" aria-pressed="false">${S0.t}</button>`).join('') + '</div>';
  else h += `<div class="thesis-row"><button type="button" class="thesis" data-stmt="${sel}" aria-pressed="true"${st.outcome ? ' disabled' : ''}>${STMTS[sel].t}</button></div>`;
  if(sel){
    const pins = st.ver.att.filter(id => has(id));
    h += '<span class="board-k pins-k">Приколото к версии</span><div class="pins">' + pins.map(id => { const c = CLUES[id], tag = st.diff === 'easy' ? relTag(id) : '';
      return `<div class="pin" data-pinned="${id}"><small>${c.kind === 'en' ? 'по-английски' : KIND[c.kind]}</small>${c.t}${tag}${st.outcome ? '' : `<button type="button" class="x" data-pin="${id}" aria-label="Открепить">×</button>`}</div>`; }).join('');
    for(let i = pins.length; i < NEED; i++) h += '<div class="pin empty-slot">сюда — улику</div>';
    h += '</div>';
  }
  h += '</div>';
  if(!sel) return h + '<p class="pencil">Что на самом деле случилось с Гришей? Выберите версию — потом приколите к ней улики.</p>';
  if(st.outcome) return h + '<p class="status ok">Лес принял эту версию. Дело закрыто.</p>';
  if(hard) h += `<p class="status${accepted() ? ' ok' : ''}">${accepted() ? 'Лес слышит эту версию.' : 'Лес пока не слышит.'}</p>`;
  else if(p.con > 0) h += '<p class="status bad">Одна из приколотых улик этой версии противоречит.</p>';
  else if(p.pro >= NEED) h += '<p class="status ok">Версия держится. Её можно рассказать на лесной остановке.</p>';
  else h += `<p class="status">Нужно ещё ${NEED - p.pro}.</p>`;
  h += '<h3>Улики в тетради</h3><div class="pool">' + st.order.filter(id => !st.clues[id].blank).map(id => {
    const on = st.ver.att.includes(id), d = st.clues[id].doubt, c = CLUES[id];
    const tag = d ? '<span class="tag">не доверяю</span>' : (c.kind === 'en' && !st.clues[id].lens) ? '<span class="tag">не прочитана — см. English</span>' : st.diff === 'easy' ? relTag(id) : '';
    return `<button type="button" class="chip${on ? ' on' : ''}${d ? ' off' : ''}" data-pin="${id}"${d ? ' disabled' : ''}>${c.t}${tag}</button>`; }).join('') + '</div>';
  return h + '<p class="pencil" style="margin-top:12px">Рассказать версию можно только там, где судьба оборвалась.</p>';
}
function relTag(id){ const v = relOf(id, st.ver.s); return v > 0 ? '<span class="tag pro">подтверждает</span>' : v < 0 ? '<span class="tag con">противоречит</span>' : '<span class="tag">не о том</span>'; }
/* красная нить: от версии к каждой приколотой улике, с провисанием */
function drawThreads(){
  const b = $('board'), svg = $('threads'); if(!b || !svg) return;
  const th = b.querySelector('.thesis[aria-pressed="true"]'), pins = [...b.querySelectorAll('.pin[data-pinned]')];
  if(!th || !pins.length){ svg.innerHTML = ''; return; }
  const R0 = b.getBoundingClientRect(), t = th.getBoundingClientRect();
  const x1 = t.left + t.width / 2 - R0.left, y1 = t.bottom - R0.top - 6;
  svg.setAttribute('viewBox', `0 0 ${R0.width} ${R0.height}`);
  const was = drawThreads.seen || (drawThreads.seen = new Set()), key = th.dataset.stmt || '';
  svg.innerHTML = pins.map(p => { const r = p.getBoundingClientRect(), x2 = r.left + r.width / 2 - R0.left, y2 = r.top - R0.top; const sag = 26 + Math.abs(x2 - x1) * .08, k = key + ':' + p.dataset.pinned, fresh = !was.has(k); was.add(k);
    return `<path${fresh ? ' class="fresh" pathLength="1"' : ''} d="M${x1} ${y1} C ${x1} ${y1 + sag}, ${x2} ${y2 - sag * .3 + sag}, ${x2} ${y2}"/>`; }).join('');
}
addEventListener('resize', () => { if(ui.nb){ spreadLayout(); drawThreads(); } });

/* ---------- Люди ---------- */
const PEOPLE_PIC = { grunya:'p_grunya_warm', grisha:'p_grisha_cheerful', varya:'p_varya_neutral', nina:'p_nina_stern', young:'p_young_neutral' };
function personState(id){
  const S0 = [];
  if(id === 'grunya'){ if(F('toldMother')) S0.push('Знает, чья я дочь.'); if(F('grunyaNoticed')) S0.push('Видела, что я открывала комод.'); }
  if(id === 'nina' && F('ninaThread')) S0.push('Прячет нитку на запястье.');
  if(id === 'grisha'){ if(has('c_suitcase')) S0.push('Дал посмотреть чемодан.'); if(F('showedGrisha')) S0.push('Не помнит, что писал в тетради.'); if(st.outcome === 'truth') S0.push('Вспомнил то утро.'); }
  if(id === 'varya' && F('forgedChecked')) S0.push('Узнала свою ручку в записке.');
  if(id === 'domovoi') S0.push(F('greeted') ? 'Я для него гостья: одалживает.' : 'Я для него хозяйка: отдаёт.');
  if(st.press && st.press.day === st.day && (st.press[id] || 0) >= (id === 'grunya' ? 3 : id === 'grisha' ? 1 : 2)) S0.push('Сегодня со мной больше не говорит.');
  return S0;
}
function peopleUI(){
  let h = '<div class="case-h">Люди и не люди</div><div class="case-q">Кто здесь кто. И кто кем притворяется.</div>';
  if(!st.people.length) return h + '<p class="empty">Анна пока никого не знает.</p>';
  return h + '<div class="people">' + st.people.map(id => { const P = PEOPLE[id], pic = PEOPLE_PIC[id], s = personState(id);
    return `<article class="person"><div class="ph${pic ? '' : ' none'}">${pic ? `<div style="background-image:url(art/${pic}.webp)"></div>` : '<div>?</div>'}<span>${P.n}</span></div><p>${P.d}</p>${s.map(x => `<span class="state">${x}</span>`).join('')}</article>`; }).join('') + '</div>';
}

/* ---------- Заветье: вчера / сегодня, дом Аглаи, поверья ---------- */
const SKETCH = {
  busstop:   { img:'sk_slab', draw:'<path d="M112 128V42M313 128V42M92 44l124-8 124 8"/><path d="M92 44h248"/><path d="M128 106h170M128 112h170"/><path d="M350 128V34" /><circle cx="350" cy="28" r="10" class="red"/><path d="M344 28h12" class="red"/>' },
  rustystop: { img:'sk_slab', draw:'<path d="M112 128V52M313 128V60M92 54l110-6 128 14"/><path d="M180 60l6 10M240 58l-4 12M140 62l3 9" class="red"/><path d="M128 110h120"/>' },
  overgrown: { img:'sk_slab', draw:'<path class="moss" d="M98 122c10-8 18 6 28-2s16 6 26-2 18 6 28-2 16 6 26-2 18 6 28-2 16 6 26-2 18 6 26-2M104 130c12-6 20 4 30-2s18 4 28-2 18 4 28-2 18 4 28-2 18 4 30-2"/><path class="moss" d="M110 104l4 18M130 100l2 22M287 100l-2 22M313 106l-3 16"/>' },
  loop:      { img:'sk_stop', draw:'<circle cx="352" cy="66" r="28"/><path d="M352 66l-6 16M352 66l-12-16"/><path d="M352 40v4M352 88v4M326 66h4M374 66h4"/><text x="336" y="118" style="font:700 15px var(--body);fill:#7a2a26;stroke:none">6:38</text>' },
};
function vsUI(c){
  const S0 = SKETCH[c.key];
  const when = `<span class="vs-when">${dayName(c.day)} · ${PHASES[c.phase]}</span>`;
  if(c.key === 'erase') return `<div class="vs"><figure><div class="sk sheet" style="min-height:120px"><span class="en">I am going to leave on Saturday…</span></div><figcaption>Вчера</figcaption></figure><figure><div class="sk sheet" style="min-height:120px"></div><figcaption>Сегодня</figcaption></figure><p class="vs-text">${when} ${c.text}</p></div>`;
  if(!S0) return `<div class="nt"><span class="vs-when">${dayName(c.day)} · ${PHASES[c.phase]}</span><p>${c.text}</p></div>`;
  const img = `<img src="art/${S0.img}.webp" alt="" loading="lazy">`;
  return `<div class="vs"><figure><div class="sk">${img}</div><figcaption>Вчера</figcaption></figure><figure><div class="sk">${img}<svg viewBox="0 0 420 315" aria-hidden="true">${S0.draw}</svg></div><figcaption>Сегодня</figcaption></figure><p class="vs-text">${when} ${c.text}</p></div>`;
}
function worldUI(){
  let h = '<div class="case-h">Заветье</div><div class="case-q">Что здесь меняется, когда кто-то говорит достаточно крепко.</div>';
  h += '<h3>Вчера и сегодня</h3>' + (st.changes.length ? st.changes.map(vsUI).join('') : '<p class="empty">Пока всё как было. Или так только кажется.</p>');
  h += '<h3>Дом Аглаи</h3><p>' + (F('greeted') ? 'Анна поздоровалась с домом. Домовой принимает её как гостью: тепло и вежливо, но хозяйское только одалживает.' : F('silentEntry') ? 'Анна промолчала, как велела Аглая. Домовой зовёт её хозяйкой. Кто-то в углу с этим не согласен.' : 'Анна ещё не дошла до дома.') + '</p>';
  return h + songsUI() + loreUI();
}
function songsUI(){
  const S = (st.songs || []).filter(k => SONGS[k]), n = Object.keys(SONGS).length;
  let h = `<h3>Песни без конца · ${S.length} из ${n}</h3>`;
  if(!S.length) return h + '<p class="empty">В Заветье поют — у печи, на реке, в поле. Слушайте.</p>';
  return h + '<p class="pencil">Ни одна не допета. Груня говорит, последнюю строчку оставляют лесу.</p><div class="songs">' + S.map(k => { const s0 = SONGS[k]; return `<article class="song nb-song"><span class="song-k">${s0.t} · ${s0.src}</span>${s0.lines.join('<br>')}<span class="song-miss">…</span></article>`; }).join('') + '</div>';
}
const CHILD_SVG = '<svg viewBox="0 0 70 60" aria-hidden="true"><g fill="none" stroke="#3c5a8a" stroke-width="2" stroke-linecap="round"><path d="M10 50h50M18 50V30l12-10 12 10v20"/><path d="M26 50V38h8v12"/><circle cx="54" cy="12" r="6" stroke="#c98a2a"/></g></svg>';
function loreUI(){
  const known = st.lore.map(k => LORE[k]), n = Object.keys(LORE).length;
  let h = `<h3>Поверья · найдено ${known.length} из ${n}</h3>`;
  if(!known.length) return h + '<p class="empty">Пока пусто. Поверья рассказывают вещи и люди: печь, колодец, травы, река.</p>';
  return h + '<div class="srcs">' + known.map(L => `<article class="src-item src-${L.by}">${L.by === 'child' ? CHILD_SVG : ''}<span class="by">${LORE_BY[L.by]} · ${L.w}</span><h5>${L.t}</h5><p>${L.x}</p></article>`).join('') + '</div>';
}

/* ---------- Записи: записки Аглаи, правила, сказки ---------- */
function notesUI(inner){
  let h = inner ? '' : '<div class="case-h">Записи</div><div class="case-q">Что оставила Аглая. Что рассказала Груня.</div>';
  if(!st.notes.length) return h + '<p class="empty">Записок пока нет.</p>';
  const ag = st.notes.filter(id => NOTES[id].en), other = st.notes.filter(id => NOTES[id].items);
  for(const id of ag){ const n = NOTES[id], a = NOTE_ANN[id] ? NOTE_ANN[id]() : ''; h += `<div class="nt ag"><div class="src">${n.src}</div>${en(n.en, n.ru)}${a ? `<div class="ann">${a}</div>` : ''}</div>`; }
  for(const id of other){ const n = NOTES[id], a = NOTE_ANN[id] ? NOTE_ANN[id]() : ''; h += `<div class="nt"><div class="src">${n.title ? n.title + ' · ' : 'Правила Груни · '}${n.src}</div><ul>${n.items.map(x => `<li>${x}</li>`).join('')}</ul>${a ? `<div class="ann">${a}</div>` : ''}</div>`; }
  return h;
}

/* ---------- English: язык как улика ---------- */
function enUI(){
  let h = '<div class="case-h">Язык как улика</div><div class="case-q">В Заветье память переписывает всё, что пересказывают. Домашние задания не пересказывает никто.</div>';
  const ids = st.order.filter(id => CLUES[id].kind === 'en');
  if(!ids.length) h += '<p class="empty">Английских записей пока нет. Гриша писал по-английски в школе — у Аглаи.</p>';
  for(const id of ids){
    const c = CLUES[id], s = st.clues[id];
    if(s.blank){ h += `<div class="ev"><div class="sheet"><span class="src">${c.src}</span><p class="blank">Страница пуста. Здесь было что-то написано.</p></div><div></div></div>`; continue; }
    // поддержка: перевод не выдаётся заранее, а открывается после первой попытки
    const open = st.diff === 'easy' && s.lens;
    let L = `<div class="sheet"><span class="src">${c.src}</span><p>${open ? enMark(c.en) + `<span class="tr">${c.ru}</span>` : en(c.en, c.ru)}</p>${c.red ? `<span class="red">${c.red}</span>` : ''}</div>`;
    let R = `<p class="q">${LENS_Q}</p><div class="opts">` + Object.entries(LENSES).map(([k, Ls]) => `<button type="button" class="opt" data-lens="${id}:${k}" aria-pressed="${s.lens === k}">${Ls.a}</button>`).join('') + '</div>';
    if(s.lens){ const E = lensEffect(s.lens), q = k => '«' + STMT_SHORT[k] + '»';
      R += `<div class="effect"><b>Версия изменилась</b><p>Теперь запись говорит, что ${E.meaning}.${E.pro.length ? ' Это за ' + E.pro.map(q).join(' и ') + '.' : ''}${E.con.length ? ' Против ' + E.con.map(q).join(' и ') + '.' : ''}</p></div>`;
      if(st.diff !== 'hard') R += `<p class="why">${LENSES[s.lens].tip}</p>`; }
    h += `<div class="ev"><div>${L}</div><div>${R}</div></div>`;
  }
  // перенос навыка: один раз, когда прочитаны две-три записи
  if(ids.filter(id => st.clues[id].lens).length >= 2) h += '<p class="transfer">Вы сейчас различили мечту, твёрдый план и то, чему помешали. Это тот же навык, что нужен в обычной речи: <i>I want to</i>, <i>I’m going to</i>, <i>I would have</i> говорят о разном.</p>';
  h += gapsUI() + docsUI() + quizUI() + formsUI() + wordsUI();
  const fs = formsSeen();
  h += '<h3>Заметки Аглаи</h3><div class="agl"><p><u>want to</u>, <u>will</u> — хочу, уеду когда-нибудь. Мечта.</p><p><u>am going to</u>, <u>have bought</u>, <u>have packed</u> — решено и сделано. План.</p><p><u>would have left</u> — уехал бы. Значит, помешали.</p>'
    + (fs.has('past') || fs.has('pres') ? '<p><u>packs</u> — всегда так. <u>packed</u> — один раз, вчера.</p>' : '')
    + (fs.has('cond1') ? '<p><u>if you pass</u>, <u>I will write</u> — если сделаешь, будет.</p>' : '')
    + (fs.has('used') ? '<p><u>used to swim</u> — раньше купалась. Теперь — нет.</p>' : '')
    + (fs.has('musth') ? '<p><u>must have</u> — наверняка. <u>can’t have</u> — не может быть.</p>' : '')
    + '<p class="sig">Для дела это разные вещи. — А. К.</p></div>';
  return h;
}

/* ---------- действия в тетради ---------- */
document.addEventListener('click', e => {
  const t = e.target;
  const trb = t.closest('.trb'); if(trb){ e.stopPropagation(); const s = document.createElement('span'); s.className = 'tr'; s.textContent = trb.dataset.tr; trb.replaceWith(s); track('translation_used'); return; }
  if(!ui.nb) return;
  if(t.closest('#nbClose')){ closeBook(); return; }
  const tab = t.closest('[data-tab]'); if(tab){ bookTab = tab.dataset.tab; renderBook(); return; }
  const ln = t.closest('[data-lens]'); if(ln && !ln.disabled){ const [id, k] = ln.dataset.lens.split(':'); st.clues[id].lens = st.clues[id].lens === k ? null : k; if(st.clues[id].lens){ track('language_lens_selected'); st.tut.lensAt = 1; } save(); renderBook(); return; }
  const db = t.closest('[data-doubt]'); if(db){ const s = st.clues[db.dataset.doubt]; s.doubt = !s.doubt; if(s.doubt) st.ver.att = st.ver.att.filter(x => x !== db.dataset.doubt); verChanged(); save(); renderBook(); return; }
  const op = t.closest('[data-stmt]'); if(op && !st.outcome){ const k = op.dataset.stmt; st.ver.s = st.ver.s === k ? null : k; if(st.ver.s) trackOnce('theory_started'); verChanged(); save(); renderBook(); return; }
  const pn = t.closest('[data-pin]'); if(pn && !st.outcome && st.ver.s){ const id = pn.dataset.pin; if(st.ver.att.includes(id)) st.ver.att = st.ver.att.filter(x => x !== id); else st.ver.att.push(id); verChanged(); save(); renderBook(); return; }
  if(t === $('nbw')) closeBook();
});
function verChanged(){ if(st.tut.lensAt) trackOnce('version_changed_after_language'); }
