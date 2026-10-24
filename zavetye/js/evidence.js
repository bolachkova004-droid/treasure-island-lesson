'use strict';
/* =====================================================================
   УЛИКИ
   sup — чему улика служит опорой: слот.вариант → вес (минус — противоречит).
   Английские записи получают опору через «линзу» — то, как игрок прочёл грамматику.
   ===================================================================== */
const KIND = { thing:'Вещь', word:'Слова', rec:'Запись', vision:'Видение', en:'Запись по-английски', being:'Сущность' };

const CLUES = {
  c_saturday:{ form:'testi', kind:'word', src:'Гриша', t:'«В субботу уеду»',
    text:'Гриша говорит это при каждой встрече, радостно и совершенно искренне. Кажется, он не помнит, что говорил то же самое вчера.',
    sup:{'A.plan':.5,'A.empty':.5} },
  c_suitcase:{ form:'photo', img:'ev_suitcase', kind:'thing', src:'Двор Лаптевых', t:'Чемодан у двери',
    text:'Старый, с ремнями. Бирка «Лаптев Г., Тверь» выцвела. Внутри вещи двадцатилетней давности: джинсовая куртка, кассетный плеер, аттестат в файлике. Пыль лежит ровно, а ручка чистая: чемодан часто берут в руки.',
    sup:{'A.plan':1,'A.empty':-.5} },
  c_timetable:{ form:'ticket', kind:'thing', src:'Дом Лаптевых', t:'Расписание автобуса, лето 2004',
    text:'Под треснувшим стеклом у вешалки: «Заветье — Тверь. Сб 06:40». Число 12.06 обведено карандашом, и обводили его много раз.',
    sup:{'A.plan':1} },
  c_nina:{ form:'testi', kind:'word', src:'Нина Петровна', t:'«Проспал он»',
    text:'«Проспал он тогда. А потом сам передумал. Я его не держала: чего держать, взрослый. Он и мечтал-то больше языком». Всё это время она не смотрит в сторону бани.',
    sup:{'B.accident':1,'B.self':1,'A.dream':.5,'A.empty':.5} },
  c_grunya:{ form:'testi', kind:'word', src:'Груня', t:'«Сам раздумал»',
    text:'«Проспал тогда свой автобус, говорят, а потом сам раздумал. Мать болела. Остался, и правильно. Пусть собирается, никому не мешает».',
    sup:{'B.accident':.5,'B.self':1,'A.empty':.5} },
  c_varya:{ form:'testi', kind:'word', src:'Варя', t:'Щеколда по субботам',
    text:'«Папа каждую пятницу собирает чемодан, а в субботу вечером разбирает. А бабушка каждую субботу с утра задвигает щеколду на бане. Снаружи. Даже когда там никого нет. Говорит — привычка».',
    sup:{'B.forced':1} },
  c_banya:{ form:'photo', img:'ev_banya', kind:'thing', src:'Двор Лаптевых', t:'Засов на бане',
    text:'Тяжёлый засов с наружной стороны двери. Внутри, на косяке, на уровне глаз, гвоздём процарапано: «12.06 ВЫПУСТИТЕ». Царапины старые, потемневшие.',
    sup:{'B.forced':2,'B.self':-1,'B.accident':-1,'C.mother':1} },
  c_noon:{ form:'drawing', img:'sk_field', kind:'vision', src:'Полудница', t:'Шесть сорок, двенадцатое июня',
    text:'Туман. Женщина в платке задвигает засов на бане, руки у неё дрожат. Изнутри стучат. У калитки стоит вторая тень, невысокая, в тёмном, и напевает колыбельную без последней строки. За полем гудит автобус и уходит.',
    sup:{'B.forced':2,'B.accident':-1,'C.mother':1,'C.advice':1} },
  c_lullaby:{ form:'testi', kind:'word', src:'Груня', t:'Колыбельная без последней строки',
    text:'Моя посуду, Груня напевает ту самую мелодию, что звучала у калитки в видении. «Колыбельная. Её тут все знают», — говорит она, не оборачиваясь.',
    sup:{'C.advice':1} },
  c_threads:{ form:'photo', img:'ev_threads', kind:'thing', src:'Изба Груни', t:'Красные нитки в комоде',
    text:'В нижнем ящике лежат десятки мотков красной нити, каждый перехвачен бумажной биркой. Почти все надписи выцвели. На одной можно разобрать «Л. Г. 12.06». На другой — «Б. В.».',
    sup:{'C.advice':2} },
  c_young:{ form:'testi', kind:'word', src:'Гриша на лесной остановке', t:'«Мама сама сказала — езжай»',
    text:'«Мама болеет. Но она сказала — езжай. Сама сказала, вчера вечером. Потом к ней кто-то приходил, я уже спал».',
    sup:{'C.advice':1,'A.plan':1,'B.self':-.5} },
  c_forged:{ form:'letter', kind:'rec', src:'Вложено в тетрадь Гриши', t:'Записка «Сам так решил»', fake:true,
    text:'Листок между страницами: «Никуда я не поеду. Сам так решил. Г.». Синяя шариковая ручка, хотя вся тетрадь написана фиолетовыми чернилами.',
    sup:{'B.self':2,'A.empty':1} },

  /* записи по-английски: опора зависит от прочтения */
  e1:{ form:'sheet', kind:'en', src:'Школа, стенгазета «What will I be?», сентябрь 2003', t:'Стенгазета',
    en:'I [want to leave] Zavetye. I [want to repair] motorbikes in a big city.',
    ru:'Я хочу уехать из Заветья. Я хочу чинить мотоциклы в большом городе.', lens:'dream' },
  e2:{ form:'sheet', kind:'en', src:'Тетрадь Гриши, январь 2004', t:'«When I am eighteen»',
    en:'I [will leave] Zavetye when I am eighteen.',
    ru:'Я уеду из Заветья, когда мне исполнится восемнадцать.', lens:'dream' },
  e3:{ form:'sheet', kind:'en', src:'Тетрадь Гриши, май 2004, тема «Plans»', t:'«Plans»', red:'Good! — A.K.',
    en:'I [am going to leave] on Saturday, the 12th of June. I [have bought] a ticket. I [have packed] my suitcase.',
    ru:'Я уезжаю в субботу, 12 июня. Я купил билет. Я собрал чемодан.', lens:'plan' },
  e4:{ form:'sheet', kind:'en', src:'Тетрадь Гриши, май 2004', t:'Обещание',
    en:'I [promised] my mother I [would come back] every summer.',
    ru:'Я пообещал маме, что буду приезжать каждое лето.', lens:'plan' },
  e5:{ form:'sheet', kind:'en', src:'Тетрадь Гриши, последняя страница, почерк Аглаи', t:'Красные чернила',
    en:'12 June. Grisha was not at the bus stop. He [would have left].',
    ru:'12 июня. Гриши не было на остановке. Он бы уехал.', lens:'counter' },
};

/* английская запись — улика: игрок решает, о каком намерении она говорит. Вопрос задан через дело,
   грамматика объясняется после решения (заметкой Аглаи). */
const LENS_Q = 'Что эта запись позволяет доказать?';
const LENSES = {
  dream:  { label:'только мечтал', a:'Он только мечтал уехать: ни даты, ни билета', meaning:'это была только мечта, без даты и без билета',
            form:'want to · will', tip:'<u>want to</u> — «хочу». <u>will</u> без даты — «когда-нибудь уеду». Желание и намерение, но ещё не план.' },
  plan:   { label:'твёрдо собирался', a:'Он твёрдо собирался: была дата, билет, вещи', meaning:'план был настоящим: назначен день, куплен билет, собран чемодан',
            form:'be going to · have done', tip:'<u>am going to leave</u> — решено заранее. <u>have bought</u>, <u>have packed</u> — шаги уже сделаны. <u>promised I would come back</u> — обещал вернуться, значит, уезжал всерьёз.' },
  counter:{ label:'собирался, но помешали', a:'Он собирался, но ему помешали', meaning:'он должен был уехать, но что-то ему помешало',
            form:'would have + V3', tip:'<u>would have left</u> — «уехал бы»: намерение было настоящим, но не случилось. Так говорят о том, чему помешали.' },
};
/* коротко о каждой версии — для пояснений «за» и «против» */
const STMT_SHORT = { empty:'это были просто слова', self:'проспал и передумал сам', mother:'мать заперла его в бане', advice:'матери кто-то велел' };
/* что меняет прочтение записи: какие версии оно поддерживает и каким противоречит */
function lensEffect(lens){
  const key = 'L:' + lens, pro = [], con = [];
  for(const [k, S0] of Object.entries(STMTS)){ if(S0.pro.includes(key)) pro.push(k); else if(S0.con.includes(key)) con.push(k); }
  return { meaning: LENSES[lens].meaning, pro, con };
}

function supOf(id){
  const c = CLUES[id], s = st.clues[id];
  if(!c || !s || s.doubt || s.blank) return {};
  if(c.kind === 'en') return {};
  return c.sup || {};
}
const has = id => !!st.clues[id];

function gain(id, silent){
  if(has(id)) return '';
  const c = CLUES[id];
  st.clues[id] = { lens:null, doubt:false, blank:false };
  st.order.push(id);
  st.unseen++;
  if(typeof clueFly === 'function') clueFly(c); else toast('В тетрадь: ' + c.t); sfx('clue');
  trackOnce('first_clue'); if(c.kind === 'en') trackOnce('first_english_clue'); track('evidence_added');
  return `<span class="gain">${c.t}</span>`;
}

/* ---------- записки Аглаи и прочие записи ---------- */
const NOTES = {
  n1:{ src:'Посылка, 2009', en:'When the stove is warm, do not greet the house.', ru:'Когда печь тёплая, не здоровайся с домом.' },
  n2:{ src:'Под чашкой на столе', en:'Grunya will feed you. Eat.', ru:'Груня тебя накормит. Ешь.' },
  n3:{ src:'В печурке, за спичками', en:'Do not go into the forest at night.', ru:'Не ходи ночью в лес.' },
  n4:{ src:'Обложка тетради Гриши, изнутри', en:'The forest does not lie. People retell.', ru:'Лес не лжёт. Лгут пересказы.' },
  n5:{ src:'Ящик учительского стола', en:'Look for what nobody retells. Nobody retells homework.', ru:'Ищи то, что никто не пересказывает. Домашние задания не пересказывает никто.' },
  rules:{ src:'Со слов Груни', ru:true, items:['Ночью в лес не ходи.','В полдень в поле не стой.','К воде низко не наклоняйся.','Если за печкой шепчутся — не отвечай, пока не спросят.','Вечером заходи — покормлю.'] },
  legends:{ src:'Со слов Груни', ru:true, title:'Четыре сказки Заветья', items:['Невеста, что идёт по дороге и никак не дойдёт.','Кузнец, который куёт клинок и не может его докончить.','Мельникова дочь, забывшая последнюю строку колыбельной.','Охотник, что вечно целится в золотого оленя.'] },
};
const NOTE_ANN = {
  n3: () => F('sawIzba') ? 'Я пошла. В лесу стоит изба на порогах, и в окне женщина. Аглая не хотела, чтобы я её увидела. Или чтобы я её искала?' : '',
  n1: () => F('greeted') ? 'Я поздоровалась. Теперь я здесь гостья.' : (F('silentEntry') ? 'Я промолчала. Домовой зовёт меня хозяйкой. Кто-то в углу с ним не согласен.' : ''),
  legends: () => F('legendHint') ? 'Колыбельная без последней строки звучала у калитки Лаптевых в видении Полудницы.' : '',
};
function note(id){
  if(st.notes.includes(id)) return '';
  st.notes.push(id); st.unseen++;
  toast('Записка в тетради'); sfx('clue');
  return '';
}

/* ---------- изменения Заветья и люди ---------- */
function change(text, key){ st.changes.push({ day:st.day, phase:st.phase, text, key }); return `<span class="change"><b>Заветье изменилось</b>${text}</span>`; }
/* =====================================================================
   ВЕРСИЯ
   ===================================================================== */
const STMTS = {
  empty:  { t:'Гриша никогда всерьёз не собирался уезжать. Это были просто слова.', pro:['c_nina','c_grunya','c_forged','L:dream'], con:['c_suitcase','c_timetable','c_banya','c_noon','c_varya','c_young','L:plan','L:counter'] },
  self:   { t:'Гриша собирался уехать, но проспал автобус и потом сам передумал.', pro:['c_nina','c_grunya','c_forged','c_suitcase','c_timetable','L:plan'], con:['c_banya','c_noon','c_varya','c_young','L:counter'] },
  mother: { t:'Гриша собирался уехать, но утром двенадцатого июня мать заперла его в бане.', pro:['c_banya','c_noon','c_varya','c_suitcase','c_timetable','L:plan','L:counter'], con:['c_nina','c_grunya','c_forged'] },
  advice: { t:'Мать заперла Гришу в бане, но решила так не сама: ночью к ней кто-то приходил и велел.', pro:['c_noon','c_young','c_lullaby','c_threads'], con:['c_nina','c_grunya','c_forged'] },
};
const NEED = 3;
function relOf(id, sk){
  const c = CLUES[id], s = st.clues[id]; if(!c || !s || s.doubt || s.blank || !sk) return 0;
  const key = c.kind === 'en' ? (s.lens ? 'L:' + s.lens : null) : id; if(!key) return 0;
  return STMTS[sk].pro.includes(key) ? 1 : STMTS[sk].con.includes(key) ? -1 : 0;
}
function proof(){ let pro = 0, con = 0; for(const id of st.ver.att){ if(!has(id)) continue; const r = relOf(id, st.ver.s); if(r > 0) pro++; else if(r < 0) con++; } return { pro, con }; }
function accepted(){ const p = proof(); return !!st.ver.s && p.pro >= NEED && p.con === 0; }
function sentence(){ return st.ver.s ? STMTS[st.ver.s].t : '…'; }
function verdict(){ return { empty:'erase', self:'convenient', mother:'truth', advice:'truth' }[st.ver.s] || null; }

