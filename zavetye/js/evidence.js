'use strict';
/* =====================================================================
   УЛИКИ
   sup — чему улика служит опорой: слот.вариант → вес (минус — противоречит).
   Английские записи получают опору через «линзу» — то, как игрок прочёл грамматику.
   ===================================================================== */
const KIND = { thing:'Вещь', word:'Слова', rec:'Запись', vision:'Видение', en:'Запись по-английски', being:'Сущность' };

const CLUES = {
  c_saturday:{ kind:'word', src:'Гриша', t:'«В субботу уеду»',
    text:'Гриша говорит это при каждой встрече, радостно и совершенно искренне. Кажется, он не помнит, что говорил то же самое вчера.',
    sup:{'A.plan':.5,'A.empty':.5} },
  c_suitcase:{ kind:'thing', src:'Двор Лаптевых', t:'Чемодан у двери',
    text:'Старый, с ремнями. Бирка «Лаптев Г., Тверь» выцвела. Внутри вещи двадцатилетней давности: джинсовая куртка, кассетный плеер, аттестат в файлике. Пыль лежит ровно, а ручка чистая: чемодан часто берут в руки.',
    sup:{'A.plan':1,'A.empty':-.5} },
  c_timetable:{ kind:'thing', src:'Дом Лаптевых', t:'Расписание автобуса, лето 2004',
    text:'Под треснувшим стеклом у вешалки: «Заветье — Тверь. Сб 06:40». Число 12.06 обведено карандашом, и обводили его много раз.',
    sup:{'A.plan':1} },
  c_nina:{ kind:'word', src:'Нина Петровна', t:'«Проспал он»',
    text:'«Проспал он тогда. А потом сам передумал. Я его не держала: чего держать, взрослый. Он и мечтал-то больше языком». Всё это время она не смотрит в сторону бани.',
    sup:{'B.accident':1,'B.self':1,'A.dream':.5,'A.empty':.5} },
  c_grunya:{ kind:'word', src:'Груня', t:'«Сам раздумал»',
    text:'«Проспал тогда свой автобус, говорят, а потом сам раздумал. Мать болела. Остался, и правильно. Пусть собирается, никому не мешает».',
    sup:{'B.accident':.5,'B.self':1,'A.empty':.5} },
  c_varya:{ kind:'word', src:'Варя', t:'Щеколда по субботам',
    text:'«Папа каждую пятницу собирает чемодан, а в субботу вечером разбирает. А бабушка каждую субботу с утра задвигает щеколду на бане. Снаружи. Даже когда там никого нет. Говорит — привычка».',
    sup:{'B.forced':1} },
  c_banya:{ kind:'thing', src:'Двор Лаптевых', t:'Засов на бане',
    text:'Тяжёлый засов с наружной стороны двери. Внутри, на косяке, на уровне глаз, гвоздём процарапано: «12.06 ВЫПУСТИТЕ». Царапины старые, потемневшие.',
    sup:{'B.forced':2,'B.self':-1,'B.accident':-1,'C.mother':1} },
  c_noon:{ kind:'vision', src:'Полудница', t:'Шесть сорок, двенадцатое июня',
    text:'Туман. Женщина в платке задвигает засов на бане, руки у неё дрожат. Изнутри стучат. У калитки стоит вторая тень, невысокая, в тёмном, и напевает колыбельную без последней строки. За полем гудит автобус и уходит.',
    sup:{'B.forced':2,'B.accident':-1,'C.mother':1,'C.advice':1} },
  c_lullaby:{ kind:'word', src:'Груня', t:'Колыбельная без последней строки',
    text:'Моя посуду, Груня напевает ту самую мелодию, что звучала у калитки в видении. «Колыбельная. Её тут все знают», — говорит она, не оборачиваясь.',
    sup:{'C.advice':1} },
  c_threads:{ kind:'thing', src:'Изба Груни', t:'Красные нитки в комоде',
    text:'В нижнем ящике лежат десятки мотков красной нити, каждый перехвачен бумажной биркой. Почти все надписи выцвели. На одной можно разобрать «Л. Г. 12.06». На другой — «Б. В.».',
    sup:{'C.advice':2} },
  c_young:{ kind:'word', src:'Гриша на лесной остановке', t:'«Мама сама сказала — езжай»',
    text:'«Мама болеет. Но она сказала — езжай. Сама сказала, вчера вечером. Потом к ней кто-то приходил, я уже спал».',
    sup:{'C.advice':1,'A.plan':1,'B.self':-.5} },
  c_forged:{ kind:'rec', src:'Вложено в тетрадь Гриши', t:'Записка «Сам так решил»', fake:true,
    text:'Листок между страницами: «Никуда я не поеду. Сам так решил. Г.». Синяя шариковая ручка, хотя вся тетрадь написана фиолетовыми чернилами.',
    sup:{'B.self':2,'A.empty':1} },

  /* записи по-английски: опора зависит от прочтения */
  e1:{ kind:'en', src:'Школа, стенгазета «What will I be?», сентябрь 2003', t:'Стенгазета',
    en:'I want to leave Zavetye. I want to repair motorbikes in a big city.',
    ru:'Я хочу уехать из Заветья. Я хочу чинить мотоциклы в большом городе.', lens:'dream' },
  e2:{ kind:'en', src:'Тетрадь Гриши, январь 2004', t:'«When I am eighteen»',
    en:'I will leave Zavetye when I am eighteen.',
    ru:'Я уеду из Заветья, когда мне исполнится восемнадцать.', lens:'dream' },
  e3:{ kind:'en', src:'Тетрадь Гриши, май 2004, тема «Plans»', t:'«Plans»', red:'Good! — A.K.',
    en:'I am going to leave on Saturday, the 12th of June. I have bought a ticket. I have packed my suitcase.',
    ru:'Я уезжаю в субботу, 12 июня. Я купил билет. Я собрал чемодан.', lens:'plan' },
  e4:{ kind:'en', src:'Тетрадь Гриши, май 2004', t:'Обещание',
    en:'I promised my mother I would come back every summer.',
    ru:'Я пообещал маме, что буду приезжать каждое лето.', lens:'plan' },
  e5:{ kind:'en', src:'Тетрадь Гриши, последняя страница, почерк Аглаи', t:'Красные чернила',
    en:'12 June. Grisha was not at the bus stop. He would have left.',
    ru:'12 июня. Гриши не было на остановке. Он бы уехал.', lens:'counter' },
};

const LENSES = {
  dream:  { label:'мечтал',       form:'want to · will',         tip:'<b>want to</b> и <b>will</b> без даты — желание и намерение. Мечта, но ещё не план.' },
  plan:   { label:'собирался',    form:'be going to · have done', tip:'<b>be going to</b> — план, решённый заранее. <b>have bought, have packed</b> — шаги, которые уже сделаны. <b>promised I would come back</b> — обещал вернуться, значит, собирался уехать.' },
  counter:{ label:'не случилось', form:'would have + V3',         tip:'<b>would have left</b> — «уехал бы». Намерение было настоящим, но что-то ему помешало.' },
};

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
  st.clues[id] = { lens: (c.kind === 'en' && st.diff === 'easy') ? c.lens : null, doubt:false, blank:false };
  st.order.push(id);
  st.unseen++;
  toast('В тетрадь: ' + c.t); sfx('clue');
  return `<span class="gain">В тетрадь: ${c.t}</span>`;
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
function change(text){ st.changes.push({ day:st.day, phase:st.phase, text }); return `<span class="change">${text}</span>`; }
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

