'use strict';
/* =====================================================================
   ПЕРСОНАЖИ — кто есть кто, кто говорит в какой сцене и с каким лицом
   ===================================================================== */
const PEOPLE = {
  grunya:{ n:'Груня', d:'Аграфена Кузьминична, деревенская повитуха. Кормит, лечит, объясняет правила.' },
  grisha:{ n:'Гриша', d:'Григорий Лаптев, лет сорока. Чинит «Яву». Каждый день собирается уехать в субботу.' },
  varya:{ n:'Варя', d:'Дочь Гриши, двенадцать лет. Замечает всё, что взрослые привыкли не замечать.' },
  nina:{ n:'Нина Петровна', d:'Мать Гриши. Говорит, что никого никогда не держала.' },
  domovoi:{ n:'Домовой', d:'Живёт за печью в доме Аглаи. Правило: хозяйке отдаёт, гостье одалживает.' },
  noon:{ n:'Полудница', d:'Приходит в поле ровно в полдень. Отвечает только на вопрос «когда».' },
  leshy:{ n:'Леший', d:'Ведёт туда, куда ты на самом деле хочешь. Словами его не обмануть.' },
  young:{ n:'Гриша, 18 лет', d:'Сидит на лесной остановке. На его часах всегда 6:38.' },
};
function meet(id){ if(!st.people.includes(id)) st.people.push(id); }


function speakerOf(id){
  if(!id || !st) return null;
  if(id === 'morning') return st.day === 1 ? ['grunya','warm'] : null;
  if(id === 'm_wed2') return ['grisha','cheerful'];
  if(['gr_mother','gr_after','gr_snoop'].includes(id)) return ['grunya','cold'];
  if(id === 'gr_dinner') return ['grunya', F('heardTune') && has('c_lullaby') ? 'humming' : 'warm'];
  if(/^gr_/.test(id)) return ['grunya','warm'];
  if(id === 'gs_notebook') return ['grisha','confused'];
  if(/^gs_/.test(id)) return ['grisha', st.outcome === 'truth' ? 'confused' : 'cheerful'];
  if(id === 'res_village' || id === 'res_answer') return ['grisha','broken'];
  if(id === 'nina_banya') return ['nina','stern'];
  if(/^nina_/.test(id)) return ['nina', st.outcome === 'truth' ? 'guilty' : 'stern'];
  if(/^varya_/.test(id)) return ['varya','neutral'];
  if(/^fr/.test(id) || id === 'res_forest') return ['young','neutral'];
  if(/^noon/.test(id) && id !== 'noon_fail') return ['noon','neutral'];
  if(/^leshy/.test(id)) return ['leshy','neutral'];
  if(/^dom/.test(id)) return ['domovoi','neutral'];
  if(id === 'school_desk' || id === 'school_in') return ['aglaya','photo'];
  if(['p_house_in','p_silent','p_greet','forest_night'].includes(id)) return ['anna','afraid'];
  if(['p_call','after_case','stay_open','bus_sunday'].includes(id)) return ['anna','sad'];
  if(/^p_/.test(id)) return ['anna','neutral'];
  return null;
}
/* Портреты в разговоре: Анна слева, собеседник справа. Говорящий — ярко, слушающий — в тени.
   Эмоции меняются по ходу реплик: правило [сцена, кусок текста, 'кто:эмоция …'] действует с этой страницы дальше.
   Первый токен без «~» — тот, кто сейчас говорит; «~кто:эмоция» меняет лицо, не передавая слова. */
const MOODS = [
  ['m_wed', 'Хорошая была женщина', 'grunya:cold'],
  ['m_wed', 'Нитку-то кто повязал', 'grunya:cold ~anna:afraid'],
  ['m_wed', 'будто ищет на них что-то', '~anna:afraid'],
  ['m_wed', 'перечисляет правила', 'grunya:warm ~anna:neutral'],
  ['m_wed2', '— До воскресенья', 'grunya:warm'],
  ['m_wed2', 'Узнаешь — расскажешь', 'grunya:warm'],
  ['m_wed2', 'Через час под окнами', 'grisha:cheerful'],
  ['m_wed2', 'Позже Анна узнает', 'anna:surprised'],
  ['p_parcel', 'Внутри четыре вещи', 'anna:surprised'],
  ['p_call', 'Не было у нас никакой Аглаи', 'anna:surprised'],
  ['m_wed2', 'Анна открывает тетрадь', 'anna:neutral'],
  ['gr_aglaya', '— А куда она делась', 'anna'],
  ['gr_aglaya', '— В лес и ушла', 'grunya:cold'],
  ['gr_aglaya', 'Анна думает о фотографии', 'anna:sad'],
  ['gr_mother', 'Ложка в руке', 'grunya:cold'],
  ['gr_mother', 'Тебя здесь быть не должно', 'grunya:cold ~anna:afraid'],
  ['gr_mother', 'вспоминает, как улыбаться', 'grunya:warm'],
  ['gr_after', 'Правду сказала?', 'grunya:warm'],
  ['gr_after', 'как кипяток', 'grunya:cold'],
  ['gr_after', 'Кто стоял у калитки', 'anna:neutral'],
  ['gr_after', 'Груня долго на неё смотрит', 'grunya:cold ~anna:afraid'],
  ['gr_after', 'В её голосе нет ни злости', 'grunya:cold'],
  ['gr_after', 'успокоился', 'grunya:warm'],
  ['gr_after', 'полезнее потерять', 'grunya:cold ~anna:sad'],
  ['gr_dinner', 'Щи, хлеб', 'grunya:warm'],
  ['gr_dinner', 'тихонько напевать', 'grunya:humming ~anna:afraid'],
  ['gr_dinner', '— Что это за песня', 'anna:afraid'],
  ['gr_dinner', '— Колыбельная.', 'grunya:humming'],
  ['gr_dinner', 'Пойду в погреб', 'grunya:warm ~anna:neutral'],
  ['gr_snoop', 'В ящике лежат', 'anna:surprised'],
  ['gr_snoop', 'Б. В. Белова Вера', 'anna:afraid'],
  ['gr_snoop', 'Груня входит с банкой', 'grunya:cold'],
  ['gr_wait', 'похожим на нежность', 'grunya:warm'],
  ['gs_where', '— А дядька знает', 'anna'],
  ['gs_where', '— А как же. Я ему', 'grisha:confused'],
  ['gs_earlier', 'вежливым недоумением', 'grisha:confused'],
  ['gs_earlier', 'возвращается к мотору', 'grisha:cheerful'],
  ['gs_earlier', 'водителя автобуса', 'anna:surprised'],
  ['gs_suitcase', 'Смотрите, не жалко', 'grisha:cheerful'],
  ['gs_suitcase', 'Чемодан старый', 'anna:neutral'],
  ['gs_suitcase', 'Вещи сорокалетнего', 'anna:sad'],
  ['gs_suitcase', 'В боковом кармане', 'anna:surprised'],
  ['gs_notebook', 'берёт тетрадь двумя пальцами', 'grisha:confused'],
  ['gs_notebook', 'Мой почерк', 'grisha:confused'],
  ['nina_lie', 'не смотрит в сторону бани', 'anna:surprised'],
  ['nina_banya', 'прямо в глаза', 'nina:stern ~anna:afraid'],
  ['res_village', 'сидит на крыльце', 'grisha:broken'],
  ['res_village', 'без чемодана', 'grisha:confused'],
  ['res_village', 'Я вспомнил', 'grisha:broken'],
  ['res_village', 'Я боялась', 'nina:guilty ~anna:sad'],
  ['res_village', 'Мне сказали, что так будет лучше', 'nina:guilty ~anna:sad'],
  ['res_village', 'поднимает на Анну глаза', 'grisha:broken ~anna:sad'],
  ['res_answer', 'Легко тебе говорить', 'grisha:broken'],
  ['res_answer', 'Вот и мать так решила', 'grisha:broken'],
  ['res_answer', 'Двадцать два года за меня решали', 'grisha:confused'],
  ['res_answer', 'кивает, будто услышал', 'grisha:confused'],
  ['res_answer', 'нет хорошего конца', 'anna:sad'],
];
