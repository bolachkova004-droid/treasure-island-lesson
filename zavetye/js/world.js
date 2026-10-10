'use strict';
/* =====================================================================
   МИР — полосы (локации), их содержимое, точки интереса и сборка кадра
   ===================================================================== */
const STRIPS = {
  flat:      { name:'Квартира матери', sub:'город', w:1000, indoor:true },
  road:      { name:'Старая дорога', w:1800, layers:['hills','forest','poles'], exits:{ left:['village', 4290] }, maxX:1720 },
  village:   { name:'Нижняя улица', w:4400, layers:['hills','forest','village_back'], exits:{ left:['field', 1880], right:['road', 110] } },
  field:     { name:'Поле за околицей', w:2000, layers:['hills','field_back'], exits:{ right:['village', 110] }, minX:250 },
  river:     { name:'Река Кромка', w:1500, layers:['hills','forest','river_back'], water:true, minX:120, maxX:1440 },
  forestroad:{ name:'Лесная остановка', sub:'на часах 6:38', w:1600, layers:['forest','deep'], exits:{ left:['field', 320] }, frozen:true },
  aglaya:    { name:'Дом Аглаи', w:1000, indoor:true },
  grunya:    { name:'Изба Груни', w:1000, indoor:true },
  laptev:    { name:'Дом Лаптевых', w:1000, indoor:true },
  school:    { name:'Старая школа', sub:'кабинет английского', w:1000, indoor:true },
};
const PLACES = { bed:['aglaya', 880], aglaya_in:['aglaya', 180], house:['village', 600], grisha:['village', 3330], edge:['field', 320],
  road:['road', 1060], bus:['road', 1220], forestroad:['forestroad', 720], school_in:['school', 180] };
function tp(p){ st.pend = PLACES[p]; }
const phaseOf = v => (STRIPS[v.strip] && STRIPS[v.strip].frozen) ? 0 : v.phase;

/* ---------- кто где стоит ---------- */
function npcsFor(v){
  const N = [], n = (id, x, o = {}) => N.push({ id, x, ...o });
  const A = v.flags.arrived && v.day >= 1, sc = v.scene || '';
  if(v.strip === 'village' && A){
    if(v.phase <= 1){ const sat = v.day === 4 && !v.outcome; n('grisha', sat ? 3170 : 3290, { scene:'gs_talk', label:'Гриша', pose: sat ? 'suitcase' : 'fix' }); }
    if(v.phase === 0 || v.phase === 2) n('nina', 3630, { scene:'nina_talk', label:'Нина Петровна' });
    if(v.phase === 1 || v.phase === 2) n('varya', 3870, { scene:'varya_talk', label:'Варя' });
  }
  if(v.strip === 'grunya' && v.phase <= 2) n('grunya', 440, { scene:'gr_menu', label:'Груня' });
  if(v.strip === 'aglaya' && sc === 'morning' && v.day === 1) n('grunya', 240, {});
  if(v.strip === 'aglaya' && (v.phase === 3 || sc.startsWith('dom'))) n('domovoi', 262, {});
  if(v.strip === 'forestroad' && (!v.outcome || v.outcome === 'loop')) n('young', 960, { scene:'fr', label:'Парень с чемоданом' });
  if(v.strip === 'field' && v.phase === 1 && !v.flags.noonDone) n('noon', 1100, {});
  if(v.strip === 'field' && sc.startsWith('leshy')) n('leshy', 150, {});
  applyNpcPx(v.strip, N);
  return N;
}

/* ---------- точки интереса ---------- */
function enter(strip, x){ teleport([strip, x]); return null; }
function hotsFor(){
  const L = [], h = (x, verb, label, act, o = {}) => L.push({ x, verb, label, act, ...o });
  const A = F('arrived'), later = s => () => (A ? (typeof s === 'function' ? s() : s) : 'too_late');
  switch(st.strip){
    case 'flat': h(300, 'Осмотреть', 'Шкаф', () => 'p_flat'); break;
    case 'village':
      h(600, 'Войти', 'Дом Аглаи', () => (A ? enter('aglaya', 150) : 'p_house_out'));
      h(1150, 'Спуститься', 'Тропа к реке', later(() => enter('river', 200)));
      h(1560, 'Войти', 'Изба Груни', later(() => (st.phase === 3 ? 'gr_closed' : enter('grunya', 150))));
      h(1700, 'Присесть', 'Лавка у колодца', later('bench'));
      h(1860, 'Осмотреть', 'Колодец-журавль', () => 'well');
      h(2322, 'Залезть', 'Окно школы', later('school_window'));
      h(2500, 'Осмотреть', 'Дверь школы', () => 'school_door');
      h(2940, 'Осмотреть', 'Соседский дом', () => 'neighbors');
      if(suitcaseVisible()) h(3430, 'Осмотреть', 'Чемодан', () => 'suitcase_look');
      h(3500, 'Войти', 'Дом Лаптевых', later(() => ((F('talkedNina') || F('talkedVarya') || st.phase >= 2) ? enter('laptev', 150) : 'lap_closed')));
      h(3990, 'Осмотреть', 'Баня', later('banya'));
      break;
    case 'aglaya':
      h(70, 'Выйти', 'На улицу', () => enter('village', spot('village', 'Дом Аглаи', 600)));
      h(160, 'Осмотреть', 'Прялка', () => 'h_corner');
      h(330, st.phase === 3 ? 'Позвать' : 'Осмотреть', st.phase === 3 ? 'Того, кто за печью' : 'Печь', () => (st.phase === 3 ? 'dom' : 'h_stove'));
      h(560, 'Осмотреть', 'Стол', () => 'h_table');
      h(760, 'Осмотреть', 'Полка с тетрадями', () => ((!F('searchedHouse') && st.phase <= 2) ? { scene:'h_search', cost:1 } : 'h_shelf'));
      h(900, st.phase >= 2 ? 'Лечь' : 'Присесть', 'Лавка', () => 'h_bed');
      break;
    case 'grunya':
      h(70, 'Выйти', 'На улицу', () => enter('village', spot('village', 'Изба Груни', 1560)));
      h(240, 'Осмотреть', 'Комод', () => 'gr_chest');
      h(640, 'Осмотреть', 'Травы', () => 'gr_herbs');
      break;
    case 'laptev':
      h(70, 'Выйти', 'Во двор', () => enter('village', spot('village', 'Дом Лаптевых', 3500)));
      h(290, 'Осмотреть', 'Стекло у вешалки', () => 'lap_timetable');
      h(840, 'Осмотреть', 'Голландка в сенях', () => 'lap_stove');
      break;
    case 'school':
      h(70, 'Вылезти', 'В окно', () => enter('village', spot('village', 'Окно школы', 2322)));
      h(450, 'Прочитать', 'Доска', () => 'school_again');
      h(700, 'Осмотреть', 'Стенгазета', () => 'school_paper');
      h(890, 'Осмотреть', 'Учительский стол', () => 'school_desk');
      break;
    case 'field':
      h(180, st.phase === 3 ? 'Войти' : 'Войти', 'Ельник', () => 'forest_edge');
      if(F('noonDone')) h(1100, 'Осмотреть', 'Выжженный круг', () => 'field_circle');
      break;
    case 'river':
      h(170, 'Подняться', 'В деревню', () => enter('village', spot('village', 'Тропа к реке', 1150)));
      h(690, 'Прочитать', 'Надпись', () => 'river_sign');
      h(830, 'Встать', 'На мостки', () => 'river_bridge');
      break;
    case 'road':
      h(1150, 'Осмотреть', 'Бетонная плита', () => 'road_slab');
      h(1710, 'Прочитать', 'Указатель', () => 'road_end');
      break;
  }
  for(const n of npcsFor(st)) if(n.scene) L.push({ x:n.x, verb:'Поговорить', label:n.label, act:() => n.scene, npc:true });
  applyHotPx(st.strip, L);
  for(const h of L) h.ph = phraseOf(h);
  return L;
}
function suitcaseVisible(){ return F('arrived') && st.day >= 1 && !(st.day === 4 && st.phase <= 1 && !st.outcome) && !['convenient','erase','half'].includes(st.outcome); }


/* подпись над предметом — живая фраза: «Осмотреть чемодан», «Поговорить с Груней» */
const PHRASE = {
  'Шкаф':'Разобрать мамин шкаф', 'Дом Аглаи':'Войти в дом Аглаи', 'Тропа к реке':'Спуститься к реке', 'Изба Груни':'Зайти к Груне',
  'Лавка у колодца':'Присесть на лавку', 'Колодец-журавль':'Заглянуть в колодец', 'Окно школы':'Залезть в окно школы', 'Дверь школы':'Осмотреть дверь школы',
  'Соседский дом':'Посмотреть на соседский дом', 'Чемодан':'Осмотреть чемодан', 'Дом Лаптевых':'Зайти к Лаптевым', 'Баня':'Осмотреть баню',
  'На улицу':'Выйти на улицу', 'Прялка':'Осмотреть прялку', 'Печь':'Осмотреть печь', 'Того, кто за печью':'Позвать того, кто за печью', 'Стол':'Осмотреть стол',
  'Полка с тетрадями':'Осмотреть полку с тетрадями', 'Комод':'Осмотреть комод', 'Травы':'Посмотреть на травы', 'Во двор':'Выйти во двор',
  'Стекло у вешалки':'Посмотреть, что под стеклом', 'Голландка в сенях':'Осмотреть голландку', 'В окно':'Вылезти в окно', 'Доска':'Прочитать доску',
  'Стенгазета':'Прочитать стенгазету', 'Учительский стол':'Осмотреть учительский стол', 'Ельник':'Подойти к ельнику', 'Выжженный круг':'Осмотреть выжженный круг',
  'В деревню':'Подняться в деревню', 'Надпись':'Прочитать надпись', 'На мостки':'Встать на мостки', 'Бетонная плита':'Осмотреть плиту у дороги', 'Указатель':'Прочитать указатель',
  'Гриша':'Поговорить с Гришей', 'Нина Петровна':'Поговорить с Ниной Петровной', 'Варя':'Поговорить с Варей', 'Груня':'Поговорить с Груней', 'Парень с чемоданом':'Поговорить с парнем',
};
function phraseOf(h){ if(h.label === 'Лавка') return h.verb === 'Лечь' ? 'Лечь спать' : 'Присесть на лавку'; return PHRASE[h.label] || (h.verb + ' · ' + h.label); }
