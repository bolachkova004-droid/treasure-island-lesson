'use strict';
/* =====================================================================
   АНГЛИЙСКИЙ: больше, чем «прочитать и выбрать смысл»
   — документы на разные конструкции (чтение и понимание),
   — стёртые строки в тетради Гриши (сам ставишь форму глагола),
   — самопроверка на новых ситуациях (перенос навыка),
   — слова дела и озвучка любой английской фразы.
   ===================================================================== */

/* конструкции, которые встречаются в игре: от A2 к B1+ */
const FORMS = {
  want:   { t:'want to', lv:'A2', ru:'хочу — желание, но не план' },
  will:   { t:'will', lv:'A2', ru:'когда-нибудь сделаю — намерение без даты' },
  going:  { t:'be going to / be leaving', lv:'A2+', ru:'решено заранее, есть дата' },
  pp:     { t:'have done', lv:'B1', ru:'уже сделано, результат сейчас' },
  past:   { t:'did (Past Simple)', lv:'A2', ru:'случилось в прошлом, есть «когда»: yesterday, in 2004' },
  pres:   { t:'does (Present Simple)', lv:'A2', ru:'бывает регулярно: every Friday, always' },
  cond1:  { t:'if + present, will', lv:'A2+', ru:'реальное условие: если сделаешь — будет' },
  used:   { t:'used to', lv:'B1', ru:'так было раньше, а теперь нет' },
  wouldh: { t:'would have done', lv:'B1', ru:'сделал бы, но не случилось' },
  musth:  { t:'must have / can’t have done', lv:'B1+', ru:'догадка о прошлом: наверняка / не может быть' },
};
/* какие конструкции несёт каждая запись Гриши (улики e1–e5) */
const CLUE_FORMS = { e1:['want'], e2:['will'], e3:['going','pp'], e4:['wouldh'], e5:['wouldh'] };

/* документы: читаешь — отвечаешь, что из этого следует для дела */
const DOCS = {
  d_varya:{ t:'Домашнее задание Вари', src:'Тетрадь Вари, 6 класс, прошлая неделя', forms:['pres','past'],
    en:'My dad [packs] his suitcase every Friday. On Saturday evening he [unpacks] it. Last Saturday he [did not unpack] it. He [sat] on the porch all night.',
    ru:'Мой папа собирает чемодан каждую пятницу. В субботу вечером он его разбирает. В прошлую субботу он его не разобрал. Он всю ночь просидел на крыльце.',
    q:'Что изменилось в прошлую субботу?',
    opts:[ ['Обычно он разбирает чемодан, а в ту субботу — нет', true], ['Он никогда не разбирает чемодан', false], ['Он разберёт чемодан в эту субботу', false] ],
    note:'<u>packs</u>, <u>unpacks</u> — так бывает всегда, по привычке (every Friday). <u>did not unpack</u>, <u>sat</u> — один раз, в прошлую субботу. Привычка и случай — разные вещи.',
    words:['suitcase','pack','unpack','porch'] },
  d_aglaya:{ t:'Записка Аглаи в чемодане', src:'Боковой карман чемодана, под талоном', forms:['cond1'],
    en:'Grisha, [if you pass] your exams, I [will write] to your uncle myself. Do not let anyone change your plans. — A. K.',
    ru:'Гриша, если сдашь экзамены, я сама напишу твоему дяде. Не позволяй никому менять твои планы. — А. К.',
    q:'Что обещала Аглая?',
    opts:[ ['Написать дяде, если Гриша сдаст экзамены', true], ['Написать дяде когда-нибудь потом', false], ['Она уже написала дяде', false] ],
    note:'<u>if you pass</u> … <u>I will write</u> — реальное условие: после <i>if</i> настоящее время, в главной части <i>will</i>. Аглая обещала всерьёз — и Гриша экзамены сдал.',
    words:['exam','pass','uncle','plan'] },
  d_vera:{ t:'Сочинение «My village»', src:'Полка с тетрадями, листок «Белова В., 8 класс, 1990»', forms:['used'],
    en:'My village is small and quiet. I [used to swim] in the river every summer. I [used to sing] with my grandmother. Now I never go to the river. I am afraid of the water.',
    ru:'Моя деревня маленькая и тихая. Раньше я каждое лето купалась в реке. Раньше я пела с бабушкой. Теперь я никогда не хожу к реке. Я боюсь воды.',
    q:'Что эта страница говорит о маме Анны?',
    opts:[ ['Раньше она купалась в реке, а потом перестала и стала бояться воды', true], ['Она до сих пор купается каждое лето', false], ['Она собирается научиться плавать', false] ],
    note:'<u>used to swim</u> — «раньше купалась», а теперь нет. Так говорят о прошлой привычке, которая кончилась. Что-то случилось у реки.',
    words:['river','swim','grandmother','afraid'] },
  d_register:{ t:'Пометка в журнале', src:'Классный журнал 2003/04, на полях, рукой Аглаи', forms:['musth'],
    en:'12 June. Laptev [can’t have overslept]: he is never late. Someone [must have stopped] him.',
    ru:'12 июня. Не может быть, чтобы Лаптев проспал: он никогда не опаздывает. Наверняка кто-то его остановил.',
    q:'Что думала Аглая о двенадцатом июня?',
    opts:[ ['Она была уверена: Гриша не проспал, ему помешали', true], ['Она знала, что он проспал', false], ['Она думала, что он, может быть, уехал', false] ],
    note:'<u>can’t have overslept</u> — «не может быть, чтобы проспал». <u>must have stopped</u> — «наверняка остановил». Это язык следователя: вывод о прошлом по уликам.',
    words:['oversleep','late','stop','someone'] },
};

/* стёртые строки: черновик записки маме, написанный по-английски, чтобы мама не прочла */
const GAPS = [
  { id:'g1', before:'Mum, I', after:'on Saturday. The bus is at 6:40.', hint:'(leave)', ok:['am leaving','am going to leave',"i'm leaving","i'm going to leave"],
    opts:['am leaving','leave','left'], why:{ leave:'Без <i>am</i> это просто «уезжаю вообще». Есть дата — значит, решено: <u>am leaving</u>.', left:'<i>left</i> — уже уехал. А суббота ещё впереди.' }, form:'going' },
  { id:'g2', before:'I', after:'the ticket yesterday.', hint:'(buy)', ok:['bought'],
    opts:['bought','have bought','buy'], why:{ 'have bought':'Со словом <i>yesterday</i> — только Past Simple: <u>bought</u>. <i>have bought</i> не говорит «когда».', buy:'<i>buy</i> — «покупаю». А билет уже куплен вчера.' }, form:'past' },
  { id:'g3', before:'I', after:'my suitcase. It is by the door.', hint:'(pack)', ok:['have packed',"i've packed",'packed'],
    opts:['have packed','pack','will pack'], why:{ pack:'<i>pack</i> — «собираю (обычно)». А чемодан уже стоит собранный: <u>have packed</u>.', 'will pack':'<i>will pack</i> — «соберу». Но он уже у двери.' }, form:'pp' },
  { id:'g4', before:'If I miss the bus, I', after:'to the main road.', hint:'(walk)', ok:['will walk',"i'll walk"],
    opts:['will walk','walk','would walked'], why:{ walk:'После <i>if</i> — настоящее время, а в главной части — <u>will walk</u>.', 'would walked':'Такой формы нет. Реальное условие: <u>will walk</u>.' }, form:'cond1' },
  { id:'g5', before:'I', after:'every summer. I promise.', hint:'(come back)', ok:['will come back',"i'll come back"],
    opts:['will come back','came back','am come back'], why:{ 'came back':'<i>came back</i> — уже вернулся. А это обещание на будущее: <u>will come back</u>.', 'am come back':'Такой формы нет. Обещание — <u>will come back</u>.' }, form:'will' },
];

/* самопроверка: новая ситуация — выбрать английскую фразу. Открывается по мере того, как конструкции встретились */
const QUIZ = [
  { f:'want', ru:'Варя мечтает о собаке, но родители ещё не согласились.', opts:['Varya wants to have a dog.','Varya is going to get a dog on Monday.','Varya has got a dog.'], a:0 },
  { f:'will', ru:'Когда-нибудь, без даты, Анна напишет книгу.', opts:['Anna will write a book one day.','Anna wrote a book yesterday.','Anna is writing a book now.'], a:0 },
  { f:'going', ru:'Всё решено: в воскресенье Анна уезжает, билет куплен.', opts:['Anna is going to leave on Sunday.','Anna wants to leave someday.','Anna would have left on Sunday.'], a:0 },
  { f:'pp', ru:'Груня только что испекла пироги — вот они, на столе.', opts:['Grunya has baked pies.','Grunya bakes pies every year.','Grunya will bake pies.'], a:0 },
  { f:'past', ru:'Вчера вечером Анна была у Груни.', opts:['Anna visited Grunya last night.','Anna has visited Grunya last night.','Anna visits Grunya last night.'], a:0 },
  { f:'pres', ru:'Каждое утро Нина Петровна задвигает засов.', opts:['Nina bolts the door every morning.','Nina is bolting the door right now.','Nina bolted the door last Monday.'], a:0 },
  { f:'cond1', ru:'Если Анна спросит Лешего правильно, он покажет дорогу.', opts:['If Anna asks the right question, Leshy will show her the way.','If Anna will ask the right question, Leshy shows her the way.','If Anna asked, Leshy has shown the way.'], a:0 },
  { f:'used', ru:'Раньше в деревне ходил автобус. Теперь — нет.', opts:['A bus used to come to the village.','A bus comes to the village every day.','A bus is going to come to the village.'], a:0 },
  { f:'wouldh', ru:'Анна успела бы на поезд, но автобус опоздал.', opts:['Anna would have caught the train.','Anna will catch the train.','Anna has caught the train.'], a:0 },
  { f:'musth', ru:'На столе тёплая чашка. Наверняка здесь кто-то только что пил чай.', opts:['Someone must have drunk tea here.','Someone can’t have drunk tea here.','Someone drinks tea here every year.'], a:0 },
  { f:'musth', ru:'Гриша не мог проспать — он всегда встаёт в пять.', opts:['Grisha can’t have overslept.','Grisha must oversleep.','Grisha has overslept every day.'], a:0 },
  { f:'going', ru:'Варя уже решила: завтра она идёт в старую школу.', opts:['Varya is going to go to the old school tomorrow.','Varya wants to go to the old school one day.','Varya went to the old school yesterday.'], a:0 },
];

/* слова дела: встречаются в записях и документах */
const WORDS = {
  leave:['leave','уезжать'], ticket:['ticket','билет'], suitcase:['suitcase','чемодан'], pack:['pack','собирать (вещи)'], unpack:['unpack','разбирать (вещи)'],
  promise:['promise','обещать'], 'come back':['come back','возвращаться'], 'bus stop':['bus stop','остановка'], repair:['repair','чинить'], forest:['forest','лес'],
  stove:['stove','печь'], feed:['feed','кормить'], greet:['greet','здороваться'], retell:['retell','пересказывать'], homework:['homework','домашнее задание'],
  porch:['porch','крыльцо'], exam:['exam','экзамен'], pass:['pass (an exam)','сдать (экзамен)'], uncle:['uncle','дядя'], plan:['plan','план'],
  river:['river','река'], swim:['swim','плавать'], grandmother:['grandmother','бабушка'], afraid:['be afraid of','бояться'],
  birch:['birch','берёза'], rowan:['rowan','рябина'], owl:['owl','сова'], ribbon:['ribbon','лента'], towards:['towards','к, по направлению к'], follow:['follow','идти за кем-то'], lead:['lead','вести, выводить'], past:['go past','пройти мимо'],
  oversleep:['oversleep','проспать'], late:['be late','опаздывать'], stop:['stop','остановить'], someone:['someone','кто-то'],
};
const CLUE_WORDS = { e1:['leave','repair'], e2:['leave'], e3:['leave','ticket','suitcase','pack'], e4:['promise','come back'], e5:['bus stop','leave'] };
const NOTE_WORDS = { n1:['stove','greet'], n2:['feed'], n3:['forest'], n4:['forest','retell'], n5:['retell','homework'] };

function enState(){ if(!st.en) st.en = { docs:{}, gaps:{}, quiz:{ right:0, total:0, cur:null } }; return st.en; }

/* документ найден в сцене: короткая строка в разговоре, сам текст — в тетради */
function gainDoc(id){
  const E = enState(); if(E.docs[id]) return '';
  E.docs[id] = { a:null, tries:0 }; st.unseen++;
  toast('В тетрадь, English: ' + DOCS[id].t); sfx('clue'); trackOnce('first_english_doc');
  return `<span class="gain">${DOCS[id].t} — в тетради, раздел English</span>`;
}

/* какие конструкции игрок уже встретил */
function formsSeen(){
  const s = new Set();
  for(const id of st.order) for(const f of CLUE_FORMS[id] || []) s.add(f);
  const E = st.en || {}; for(const id of Object.keys(E.docs || {})) for(const f of DOCS[id].forms) s.add(f);
  for(const g of GAPS) if(E.gaps && E.gaps[g.id] && E.gaps[g.id].done) s.add(g.form);
  return s;
}
function wordsSeen(){
  const s = new Set();
  for(const id of st.order) for(const w of CLUE_WORDS[id] || []) s.add(w);
  for(const id of st.notes) for(const w of NOTE_WORDS[id] || []) s.add(w);
  const E = st.en || {}; for(const id of Object.keys(E.docs || {})) for(const w of DOCS[id].words) s.add(w);
  if(F('forestRead')) for(const w of ['birch','rowan','owl','ribbon','towards','follow','lead','past']) s.add(w);   // ночной лес по запискам Аглаи
  return [...s].filter(w => WORDS[w]);
}

/* ---------- озвучка: браузерный голос, британский или американский ---------- */
const TTS = { ok: typeof window !== 'undefined' && 'speechSynthesis' in window, voice:null };
function pickVoice(){ if(!TTS.ok) return; const v = speechSynthesis.getVoices(); TTS.voice = v.find(x => /en-GB/i.test(x.lang)) || v.find(x => /^en/i.test(x.lang)) || null; }
if(TTS.ok){ pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
function speak(text){
  if(!TTS.ok) return; speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text.replace(/[\[\]]/g, '')); u.lang = TTS.voice ? TTS.voice.lang : 'en-GB'; if(TTS.voice) u.voice = TTS.voice; u.rate = .88;
  speechSynthesis.speak(u); trackOnce('english_listened');
}
const listenBtn = s => TTS.ok ? `<button type="button" class="lsn" data-say="${esc(s.replace(/[\[\]]/g, ''))}" aria-label="Послушать по-английски" title="Послушать"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 6h2.5L9 3v10L5.5 10H3z" fill="currentColor"/><path d="M11 5.5c1 .8 1 4.2 0 5M12.8 4c1.9 1.6 1.9 6.4 0 8" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg></button>` : '';

/* ---------- разделы тетради ---------- */
function gapsUI(){
  if(!F('hasNotebook')) return '';
  const E = enState(), hard = st.diff === 'hard', done = GAPS.filter(g => E.gaps[g.id] && E.gaps[g.id].done).length;
  let h = `<h3>Стёртые строки · ${done} из ${GAPS.length}</h3><p class="pencil">На последней странице тетради Гриши — черновик записки маме, по-английски: так мама не прочла бы. Глаголы размыты. Восстановите их.</p><div class="gaps">`;
  for(const g of GAPS){
    const s = E.gaps[g.id] || {};
    if(s.done){ h += `<p class="gap done">${g.before} <b>${s.done}</b> ${g.after}${listenBtn(g.before + ' ' + s.done + ' ' + g.after)}</p>`; continue; }
    const field = hard
      ? `<input class="gap-in" data-gap="${g.id}" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Пропущенный глагол ${g.hint}" placeholder="${g.hint}"><button type="button" class="gap-ok" data-gapok="${g.id}">проверить</button>`
      : `<span class="blank-w">______</span> <i class="hint-w">${g.hint}</i>`;
    h += `<div class="gap"><p>${g.before} ${field} ${g.after}</p>`;
    if(!hard) h += '<div class="gap-opts">' + g.opts.map(o => `<button type="button" class="gap-o${s.last === o ? ' wrong' : ''}" data-gapo="${g.id}" data-v="${esc(o)}">${o}</button>`).join('') + '</div>';
    if(s.why) h += `<p class="why">${s.why}</p>`;
    h += '</div>';
  }
  h += '</div>';
  if(done === GAPS.length) h += '<p class="transfer">Страница восстановлена. Гриша писал так, как пишут люди, которые уже решили: дата, билет, собранный чемодан и обещание вернуться.</p>';
  return h;
}
function gapAnswer(id, v){
  const g = GAPS.find(x => x.id === id), E = enState(), s = E.gaps[id] = E.gaps[id] || { tries:0 };
  const norm = v.trim().toLowerCase().replace(/’/g, "'").replace(/\s+/g, ' ');
  s.tries++; s.last = v;
  if(g.ok.includes(norm)){ s.done = v.trim(); s.why = null; track('english_gap_done'); if(GAPS.every(x => E.gaps[x.id] && E.gaps[x.id].done)) trackOnce('english_gaps_all'); }
  else s.why = g.why[norm] || 'Не то. Посмотрите на слова вокруг: есть ли дата, «вчера», «если», обещание?';
  save(); renderBook();
}

function docsUI(){
  const E = st.en || { docs:{} }, ids = Object.keys(E.docs || {});
  if(!ids.length) return '<h3>Другие документы</h3><p class="empty">Английский в Заветье есть не только у Гриши. Ищите в домах и в школе.</p>';
  let h = '<h3>Другие документы</h3>';
  for(const id of ids){
    const D = DOCS[id], s = E.docs[id], open = s.a !== null || (st.diff === 'easy' && s.tries > 0);
    const text = open && st.diff !== 'hard' ? enMark(D.en) + `<span class="tr">${D.ru}</span>` : en(D.en, D.ru);
    let R = `<p class="q">${D.q}</p><div class="opts">` + D.opts.map(([o, ok], i) => `<button type="button" class="opt${s.a !== null ? (ok ? ' right' : i === s.pick ? ' wrong' : '') : ''}" data-doc="${id}:${i}"${s.a === null && s.tries && i === s.pick ? ' data-w="1"' : ''} aria-pressed="${s.pick === i}"${s.a !== null ? ' disabled' : ''}>${o}</button>`).join('') + '</div>';
    if(s.a !== null) R += `<div class="effect"><b>${s.a ? 'Верно' : 'Не совсем'}</b><p>${s.a ? 'Так и есть.' : 'Правильный ответ отмечен. Перечитайте подчёркнутое.'}</p></div>` + (st.diff !== 'hard' || !s.a ? `<p class="why">${D.note}</p>` : '');
    else if(s.tries) R += '<p class="why">Не то. Перечитайте подчёркнутое: что это за время?</p>';
    h += `<div class="ev"><div><div class="sheet"><span class="src">${D.src}</span><p>${text}</p></div></div><div>${R}</div></div>`;
  }
  return h;
}
function docAnswer(id, i){
  const D = DOCS[id], s = enState().docs[id], ok = D.opts[i][1];
  s.pick = i; s.tries++;
  // первая ошибка — ещё одна попытка; вторая — показываем ответ
  if(s.tries === 1) s.first = ok;   // для итога: понято с первого раза
  if(ok || s.tries >= 2){ s.a = ok; track('english_doc_answered', {}); }
  save(); renderBook();
}

function quizUI(){
  const seen = formsSeen(), pool = QUIZ.map((q, i) => ({ ...q, i })).filter(q => seen.has(q.f));
  if(pool.length < 3) return '';
  const Q = enState().quiz;
  if(Q.cur === null || !pool.some(q => q.i === Q.cur)) Q.cur = pool[Math.floor(Math.random() * pool.length)].i;
  const q = QUIZ[Q.cur];
  // варианты перемешиваются один раз на вопрос
  if(!Q.order || Q.order.q !== Q.cur){ const ord = [0, 1, 2].sort(() => Math.random() - .5); Q.order = { q:Q.cur, ord }; Q.pick = null; }
  let h = `<h3>Проверь себя · ${Q.right} из ${Q.total}</h3><p class="pencil">Новая ситуация — какая фраза по-английски говорит именно это?</p><div class="quiz"><p class="q">${q.ru}</p><div class="opts">`;
  h += Q.order.ord.map(k => `<button type="button" class="opt${Q.pick !== null ? (k === q.a ? ' right' : k === Q.pick ? ' wrong' : '') : ''}" data-quiz="${k}"${Q.pick !== null ? ' disabled' : ''} lang="en">${q.opts[k]}</button>`).join('') + '</div>';
  if(Q.pick !== null) h += `<p class="why">${FORMS[q.f].t} — ${FORMS[q.f].ru}.</p><button type="button" class="tbtn" data-quiznext="1">Ещё вопрос</button>`;
  return h + '</div>';
}
function quizAnswer(k){ const Q = enState().quiz, q = QUIZ[Q.cur]; if(Q.pick !== null) return; Q.pick = k; Q.total++; if(k === q.a) Q.right++; track('english_quiz', {}); save(); renderBook(); }
function quizNext(){ const Q = enState().quiz, seen = formsSeen(), pool = QUIZ.map((q, i) => i).filter(i => seen.has(QUIZ[i].f) && i !== Q.cur); Q.cur = pool.length ? pool[Math.floor(Math.random() * pool.length)] : Q.cur; Q.order = null; Q.pick = null; save(); renderBook(); }

function wordsUI(){
  const W = wordsSeen(); if(!W.length) return '';
  return `<h3>Слова дела · ${W.length}</h3><ul class="words">` + W.map(w => `<li><span lang="en">${WORDS[w][0]}</span>${listenBtn(WORDS[w][0])} <span class="ru">${WORDS[w][1]}</span></li>`).join('') + '</ul>';
}
function formsUI(){
  const seen = formsSeen(); if(!seen.size) return '';
  return '<h3>Что вы уже различаете</h3><ul class="forms">' + Object.entries(FORMS).filter(([k]) => seen.has(k)).map(([k, f]) => `<li><b lang="en">${f.t}</b> <span class="lv">${f.lv}</span> — ${f.ru}</li>`).join('') + '</ul>';
}

/* ---------- записка дня: утром под чашкой — вопрос по пройденному ----------
   Повторение с интервалом: сначала то, на чём ошибались, потом то, что давно не спрашивали.
   Верный ответ — приписка Аглаи с подсказкой, куда идти дальше: английский помогает делу. */
function dailyNote(){
  const E = enState(), seen = formsSeen();
  const pool = QUIZ.map((q, i) => i).filter(i => seen.has(QUIZ[i].f)); if(!pool.length) return '';
  E.daily = E.daily || {}; E.dq = E.dq || {};   // dq[i] = { n: сколько раз спрашивали, last: день, miss: ошибался }
  let D = E.daily[st.day];
  if(!D){ const score = i => { const r = E.dq[i] || { n:0, last:-9, miss:0 }; return (r.miss ? -10 : 0) + r.n * 3 - (st.day - r.last); };
    const i = pool.slice().sort((a, b) => score(a) - score(b))[0];
    D = E.daily[st.day] = { i, ord:[0, 1, 2].sort(() => Math.random() - .5), pick:null }; }
  const q = QUIZ[D.i];
  return `<div class="daily" data-dday="${st.day}"><p class="daily-h">Под чашкой снова лежал листок, тем же круглым почерком. По-английски, и сбоку вопрос: <i>Which one says it?</i></p>`
    + `<p class="daily-q">${q.ru}</p><div class="daily-o">${D.ord.map(k => `<button type="button" class="dopt" data-dq="${k}" lang="en">${q.opts[k]}</button>`).join('')}</div><p class="daily-r" aria-live="polite"></p></div>`;
}
function dailyAnswer(btn){
  const box = btn.closest('.daily'), day = +box.dataset.dday, E = enState(), D = E.daily && E.daily[day]; if(!D || D.pick !== null) return;
  const k = +btn.dataset.dq, q = QUIZ[D.i], ok = k === q.a; D.pick = k;
  const r = E.dq[D.i] || (E.dq[D.i] = { n:0, last:-9, miss:0 }); r.n++; r.last = day; r.miss = ok ? 0 : 1;
  E.quiz.total++; if(ok) E.quiz.right++;
  box.querySelectorAll('.dopt').forEach(b => { b.disabled = true; const kk = +b.dataset.dq; if(kk === q.a) b.classList.add('right'); else if(kk === k) b.classList.add('wrong'); });
  const f = FORMS[q.f], L = typeof leads === 'function' ? leads() : [], tip = L.length ? L[0] : '';
  box.querySelector('.daily-r').innerHTML = ok
    ? `<b>Верно.</b> <span lang="en">${f.t}</span> — ${f.ru}.${tip ? ` Внизу приписка красными чернилами: «${tip}»` : ''}`
    : `<b>Не то.</b> Здесь нужно <span lang="en">${f.t}</span> — ${f.ru}. Завтра Аглая спросит об этом ещё раз.`;
  if(typeof haptic === 'function') haptic(ok ? 14 : 30); sfx(ok ? 'clue' : 'page'); track('english_daily', { ok }); save();
}

/* клики в английском разделе */
document.addEventListener('click', e => {
  const t = e.target;
  const ls = t.closest('.lsn'); if(ls){ e.stopPropagation(); speak(ls.dataset.say); return; }
  const dq = t.closest('[data-dq]'); if(dq){ e.stopPropagation(); dailyAnswer(dq); return; }
  if(!ui.nb) return;
  const go = t.closest('[data-gapo]'); if(go){ gapAnswer(go.dataset.gapo, go.dataset.v); return; }
  const gk = t.closest('[data-gapok]'); if(gk){ const inp = document.querySelector(`.gap-in[data-gap="${gk.dataset.gapok}"]`); if(inp && inp.value.trim()) gapAnswer(gk.dataset.gapok, inp.value); return; }
  const dc = t.closest('[data-doc]'); if(dc && !dc.disabled){ const [id, i] = dc.dataset.doc.split(':'); docAnswer(id, +i); return; }
  const qz = t.closest('[data-quiz]'); if(qz && !qz.disabled){ quizAnswer(+qz.dataset.quiz); return; }
  if(t.closest('[data-quiznext]')){ quizNext(); return; }
}, true);
document.addEventListener('keydown', e => { const inp = e.target.closest && e.target.closest('.gap-in'); if(inp && e.key === 'Enter' && inp.value.trim()){ e.preventDefault(); gapAnswer(inp.dataset.gap, inp.value); } if(inp) e.stopPropagation(); }, true);
