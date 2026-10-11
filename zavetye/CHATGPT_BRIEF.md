# Задание для ChatGPT: иллюстрации к игре «Заветье»

Ты — художник-иллюстратор. Мы делаем браузерную сюжетную игру «Заветье: Лес хранит несбывшееся» — славянский фолк-хоррор и детектив. Героиня Анна, 30 лет, приезжает из города в северную деревню Заветье, где лес хранит отнятые у людей судьбы. Анна ходит по деревне (вид сбоку, как в театральной декорации) и разговаривает с людьми и духами. В разговорах на экране появляется большой портрет собеседника, как в визуальных новеллах «Клуба Романтики».

Твоя задача — сгенерировать все иллюстрации к игре по списку ниже.

---

## Как мы работаем

1. **Одна картинка за одно сообщение.** Генерируй строго по списку, по порядку.
2. **Под каждой картинкой** напиши жирным её имя файла из списка (например, **bg_street_1**) и спроси: «Оставляем или переделать?»
3. Если я пишу **«дальше»**, переходи к следующему пункту. Если пишу **«переделай»** и замечание, сгенерируй этот же пункт заново с учётом замечания.
4. **Прикреплённая картинка — образец атмосферы**: живописная полуреалистичная иллюстрация, сумерки, туман над водой, вышивка на одежде, болотная жуть. Бери у неё стиль, свет, цвет и настроение, но не копируй её сюжет и героев.
5. **Персонажи.** Для каждого героя сначала делай «лист персонажа». Когда я его одобрю, все следующие картинки этого героя делай с тем же лицом, причёской, возрастом и одеждой. Сверяйся с одобренным листом.
6. **На картинках не должно быть** текста, букв, подписей, логотипов и водяных знаков.
7. **После каждого этапа** напомни мне скачать картинки и отправить их в Claude.

---

## Стиль (для всех картинок)

Тёмная атмосферная живописная иллюстрация, полуреализм, как ключевой арт сюжетной игры. Северная русская деревня, славянский фолк-хоррор. Кинематографичный свет, густой низкий туман, приглушённые цвета: мох, торф, серо-синий. Тёплый янтарный свет только из окон и от огня. Мягкий объёмный свет, живописная фактура, реалистичные пропорции, много деталей.

В промпт каждой картинки добавляй этот стилевой блок:

```
dark atmospheric painterly digital illustration, semi-realistic, Slavic folk horror, northern Russian village, cinematic lighting, thick low fog, muted desaturated palette of moss green, peat brown and slate blue, warm amber light only from windows and fire, soft volumetric light, painterly texture, realistic proportions, story-game key art, highly detailed, no text, no letters, no watermark
```

**Исключение — квартира матери в городе (пункт 23).** Там наоборот: светло, дневной свет, тепло и уютно, без тумана:

```
bright soft daylight, warm clean colors, calm and cozy, no fog, painterly digital illustration, semi-realistic, no text, no watermark
```

---

## Технические требования

**Фоны (имена на `bg_`):**
- горизонтальный формат **1536 × 1024**;
- вид **строго сбоку**, как театральная декорация, камера на уровне глаз человека;
- **без людей и животных**;
- дорога или тропинка проходит **горизонтально через весь кадр в нижней четверти** картинки — по ней будет ходить героиня;
- всё важное (дома, предметы) — в средней части кадра, самый верх и низ я могу обрезать.

**Улица деревни — это 4 картинки, которые продолжают друг друга слева направо** (пункты 1, 6, 7, 8). У них должны совпадать линия горизонта, высота дороги, освещение и время суток. Левый край каждой следующей картинки продолжает правый край предыдущей.

**Портреты (имена на `p_`):**
- вертикальный формат **1024 × 1536**, по пояс;
- лицо видно; **Анна смотрит чуть вправо, все остальные герои — чуть влево** (так в разговоре они смотрят друг на друга);
- **однотонный тёмно-серый фон** (`plain dark grey background`): с него волосы вырезаются чисто, без белого ореола.

**Фигуры для ходьбы (имена на `s_`):**
- вертикальный формат **1024 × 1536**, **в полный рост**, ноги целиком в кадре;
- вид **строго сбоку, лицом вправо**;
- **однотонный тёмно-серый фон** (`plain dark grey background`).

---

## Список картинок

### Этап 1. Проба стиля (5 картинок)

Пять картинок. Сделай их первыми, я проверю в игре и вернусь с ответом.

**1. `bg_street_1`** — начало деревенской улицы, сумерки.
> side view of a northern Russian village street at dusk, left part of the street: the dark edge of a spruce forest with a wooden signpost, then a lonely old log house (izba) with boarded-up windows framed by carved white window frames, faint smoke from its chimney although it looks abandoned, a crooked picket fence, a dirt road running horizontally across the whole image in the lower quarter, fog creeping along the ground

**2. `anna_sheet`** — лист персонажа Анны (вид спереди, сбоку, со спины, на однотонном фоне).
> character sheet of Anna, a 30-year-old Russian woman, calm tired intelligent face, grey-green eyes, dark blonde hair in a low loose bun with loose strands, dark charcoal wool coat to the knees, long knitted red scarf, a thin red woolen thread tied around her left wrist, dark boots, modern city clothes that look out of place in a village; front view, side view and back view, full body, plain light grey background

**3. `p_anna_neutral`** — портрет Анны, спокойная и внимательная.
> waist-up portrait of Anna (same as the approved character sheet), neutral attentive expression, looking slightly to the side, foggy twilight light, plain dark grey background

**4. `s_anna`** — Анна в полный рост, идёт вправо.
> full body of Anna (same as the approved character sheet), strict side view facing right, walking, full figure with feet visible, plain dark grey background

**5. `p_grunya_warm`** — портрет Груни. Сначала сделай для неё лист персонажа и покажи его мне, потом портрет.
> Grunya, a warm kind-looking old village midwife in her seventies, round soft face, deep wrinkles around smiling eyes, grey headscarf with small white dots tied under the chin, dark wool dress, linen apron with red embroidered hem, holding a bundle of dried herbs, something unsettling in her too-steady gaze; waist-up portrait, warm gentle smile, plain dark grey background

### Этап 2. Остальная улица и места

**6. `bg_street_2`** — продолжение улицы вправо.
> continuation of the same village street to the right, same horizon, same road height, same dusk light: a narrow path going down the slope toward a river, a village healer's log house with bundles of dried herbs hanging under the eaves and warm lit windows, a wooden bench, a tall well sweep (shadoof), fog

**7. `bg_street_3`** — продолжение улицы вправо.
> continuation of the same village street to the right: two birches, an old two-storey wooden village school with peeling blue paint and one broken window on the ground floor, a neighbour's log house with blue carved window frames, fog

**8. `bg_street_4`** — конец улицы, двор Лаптевых.
> continuation of the same village street to the right, the end of the street: a yard behind a picket fence with a wooden shed and an old red Jawa motorcycle, a log house with an old brown suitcase standing by the door, a clothesline with white sheets, an apple tree with a tire swing, a small dark bathhouse (banya) with a heavy wooden latch on the OUTSIDE of its door, a signpost, the forest beyond, fog

**9. `bg_road`** — старая дорога, где высаживает автобус.
> side view of an empty old country road through a spruce forest at dusk, cracked asphalt running horizontally, a lonely concrete slab on the roadside with four rusty bolts sticking out where a bus stop used to be, a single white chamomile lying on the slab, leaning telegraph poles with sagging wires, a rusty road sign, low fog

**10. `bg_field`** — ржаное поле у леса.
> side view of a rye field at midday, from left to right: the dark wall of a spruce forest with a faded red thread tied on a lower branch and an old stump in front of it, then golden rye in heat haze, a scarecrow in a red shirt, a distant wooden windmill on the horizon, a narrow path running horizontally, eerie stillness

**11. `bg_river`** — река Кромка.
> side view of a slow dark river at golden hour, from left to right: a path going up the bank toward the village, reeds and cattails, a wooden footbridge stretching into the water, weeping willows, a distant old windmill on the far bank, thick mist over the water, water like black glass with warm reflections

**12. `bg_forest_stop`** — остановка в лесу, где время остановилось.
> side view of a new black asphalt road inside a dense ancient spruce forest at dawn, a small early-2000s bus stop shelter with a tin roof and a bench, a round bus stop sign on a pole, cold grey-blue light, frozen still mist, everything unnaturally quiet as if time has stopped

**13. `bg_aglaya_house`** — дом Аглаи внутри, ночь.
> interior side view of an old Russian log house at night, from left to right: a plank door, a carved spinning wheel in a dark corner, a large whitewashed Russian stove (pech) with glowing fire in its mouth, an embroidered towel (rushnik) on the wall, a table with an embroidered cloth and a single cup, a moonlit window, a shelf with old school notebooks, a wooden bench with a blanket, warm firelight and deep shadows

**14. `bg_grunya_house`** — изба Груни внутри, вечер.
> interior side view of an old village healer's log house in the evening, from left to right: a door, a painted red wooden chest of drawers, many bundles of dried herbs hanging from the ceiling beams, a table with bread under a hanging kerosene lamp, a small window, a whitewashed stove, cozy but uneasy warm light

**15. `bg_laptev_house`** — дом Лаптевых внутри.
> interior side view of a modest village house, from left to right: a door, old coats on hooks, an old framed bus timetable under cracked glass on the wall, a kitchen table, a wooden partition, an old tiled Dutch stove in the dim entryway, grey morning light

**16. `bg_school`** — класс в заброшенной школе.
> interior side view of an abandoned village school classroom, from left to right: a broken window, dusty wooden desks, a blackboard with faint chalk marks, a wall newspaper with small student photos, a teacher's desk, dust floating in daylight

### Этап 3. Герои

Для каждого героя сначала лист персонажа (на однотонном фоне, спереди и сбоку, в полный рост), жди моего «дальше». Потом портреты и фигуру с тем же лицом и одеждой.

**Груня** (лист уже сделан в этапе 1)
- `p_grunya_cold` — портрет, холодная, без улыбки, непроницаемый взгляд
- `p_grunya_humming` — портрет, тихо напевает, глаза прикрыты
- `s_grunya` — в полный рост, сбоку, лицом вправо, чуть сутулится

**Анна** (лист уже сделан в этапе 1)
- `p_anna_afraid` — портрет, испуг, широко раскрытые глаза
- `p_anna_sad` — портрет, грустная и решительная

**Гриша** — `grisha_sheet`
> Grisha, a 40-year-old village man, friendly slightly lost face, stubble, oil-stained worn olive work jacket, old flat cap, holding a wrench, cheerful but empty eyes as if he forgot something important
- `p_grisha_cheerful` — портрет, радостный («в субботу уеду!»)
- `p_grisha_confused` — портрет, растерянный, вспоминает
- `p_grisha_broken` — портрет, раздавленный, держит старый кассетный плеер
- `s_grisha` — в полный рост, сбоку, лицом вправо, с гаечным ключом

**Гриша в 18 лет** — `young_sheet`
> Grisha at 18 in 2004, same face as adult Grisha but young and thin, messy hair, oversized denim jacket, wired headphones of a cassette player around his neck, an old brown suitcase, hopeful, pale cold dawn light, slightly translucent like a memory
- `p_young_neutral` — портрет, с надеждой смотрит на часы
- `s_young` — сидит на лавке, вид сбоку, лицом вправо, чемодан рядом

**Нина Петровна, мать Гриши** — `nina_sheet`
> Nina Petrovna, a stern thin woman around 70, tightly buttoned grey knitted cardigan, dark skirt, grey hair in a strict bun, a faded red woolen thread on her wrist, lips pressed together, avoids eye contact
- `p_nina_stern` — портрет, строгая
- `p_nina_guilty` — портрет, виноватая, в глазах слёзы
- `s_nina` — в полный рост, сбоку, лицом вправо

**Варя, дочь Гриши** — `varya_sheet`
> Varya, a sharp-eyed 12-year-old village girl, two light brown braids, yellow raincoat, rubber boots, holding a book, curious and too serious for her age
- `p_varya_neutral` — портрет
- `s_varya` — сидит на качелях из шины, вид сбоку

**Полудница, дух полудня** — `noon_sheet`
> Poludnitsa, the noon spirit of Slavic folklore, a very tall woman in a long white linen shirt with red embroidery, long pale hair moving without wind, her face hidden in blinding white light, a sickle in her hand, heat haze around her, eerie and holy
- `p_noon_neutral` — портрет
- `s_noon` — в полный рост, сбоку, лицом вправо, с серпом

**Леший** — `leshy_sheet`
> Leshy, the forest spirit, a tall gaunt old man, sheepskin coat buttoned on the wrong side, beard like dry twigs and lichen, eyes like wet moss glowing faintly, casts no shadow, indifferent and ancient
- `p_leshy_neutral` — портрет
- `s_leshy` — сидит на замшелом пне, вид сбоку, лицом вправо

**Домовой** — без листа, сразу:
- `p_domovoi_neutral` — портрет: крошечный сгорбленный старичок с длинной седой бородой выглядывает из-за белёной печи, в темноте светятся два янтарных глаза, ворчливый, но добрый
- `s_domovoi` — он же в полный рост, маленький, вид сбоку

**Аглая** — одна картинка:
- `p_aglaya_photo` — старая выцветшая фотография 2004 года: строгая сельская учительница английского лет сорока, в тёмном платье, волосы убраны, зернистость плёнки, фото слегка повреждено

### Этап 4. Ночь и город

**17–20. `bg_street_1_night` … `bg_street_4_night`** — те же четыре картинки улицы, но ночью: лунный свет сквозь туман, светятся только два-три окна, светлячки над травой. Композиция и ракурс — точь-в-точь как в дневных.

**21. `bg_road_night`** — та же старая дорога ночью, лунный свет, туман.

**22. `bg_river_night`** — та же река ночью, лунная дорожка на воде, туман.

**23. `bg_city_flat`** — квартира матери в городе (светлый стиль, см. «Исключение» выше).
> interior side view of a modest Russian city apartment in an old Soviet panel building, late autumn afternoon: a tall old dark polished Soviet wardrobe with a parcel tied with string on top, a patterned wall carpet, a window with lace tulle and a cast-iron radiator, grey panel blocks and yellow birches outside, a small table with cardboard boxes and old books, geranium on the windowsill, parquet floor with a faded rug, soft grey-golden daylight

---

## Арт-дирекция: единый стандарт для новых картинок

Чтобы новые фоны не выглядели отдельными наборами картинок, у всех одинаковые правила.

**Формат и масштаб.**
- Фон — **1792 × 1024** (или 1920 × 1080, если не нужна панорама).
- Камера на уровне глаз человека, вид строго сбоку, как театральная декорация. Это фирменный язык игры: читаемый горизонт и понятный путь слева направо.
- **Горизонт** — на 40–45 % высоты кадра. **Земля, по которой идёт Анна**, — горизонтальная полоса на 80 % высоты.
- **Двери** у домов на переднем плане — примерно на 35 % высоты кадра: так Анна ростом 1,65 м стоит у дома в правильном масштабе.

**Свет.** Во всех промтах одна система:
- утро — холодный рассеянный свет, туман у земли;
- день — **холодный серый**, пасмурно, без закатной рыжины;
- вечер — **охра в светах и холодные тени**;
- ночь — **серо-синяя, но не провал в чёрный**: детали видны, светятся два-три окна.

**Фактура.** Одинаковое мелкое зерно, умеренный контраст, живописный мазок, без «AI-гладкости» кожи и тканей.

**Не всё должно быть открыткой.** Среди красивых кадров нужны обычные: мокрая остановка, серый двор, неуютная кухня, пустая улица. Мистика вторгается в обычное, а не живёт в открытке.

Стилевой блок для этого этапа (вместо прежнего, где был «золотой час»):

```
painterly digital illustration, semi-realistic, northern Russian village, Slavic folk horror, side view like a theatre set, camera at human eye level, horizon at 42% of the frame height, the walkable ground is a horizontal strip at 80% of the frame height, subtle film grain, moderate contrast, muted palette of moss green, peat brown, slate grey and faded beige, no golden-hour orange, no people, no animals, no text, no letters, no watermark, 1792x1024
```

### Этап 5. Ночные версии и обычные места

Ночью ключевые места не просто темнеют — в них меняются детали. Каждая ночная картинка — **та же композиция**, что и дневная (лучше всего в ChatGPT: «Edit this exact image» с дневной картинкой).

**24. `bg_aglaya_house_day`** — дом Аглаи днём (сейчас в окне видна луна даже в полдень).
> Edit this exact image: same room, same camera, same furniture. Make it a grey overcast autumn day: soft cold daylight from the window, no moon, a grey sky and wet birch branches outside, the stove fire is low embers. Keep everything else exactly in place.

**25. `bg_school_night`** — школа ночью: в заброшенном классе горит свет.
> Edit this exact image: same classroom, same camera. Night. The school is abandoned, but one ceiling lamp is on and glows warm, lighting the first desks and the blackboard; deep grey-blue shadows everywhere else; the windows show a dark blue night with fog. Nobody is in the room.

**26. `bg_street_1_night` … `bg_street_4_night`** — улица ночью.
> Edit this exact image: same street, same houses, same camera. Night after rain: grey-blue moonlight through fog, wet road with puddles reflecting two or three warm lit windows, the rest of the windows dark, a few fireflies above the grass. Not pitch black: every house is still readable.

**27. `bg_river_night`** — река ночью.
> Edit this exact image: same river, same footbridge, same camera. Night: grey-blue fog on the water, a pale moon path, the reflection of the footbridge is slightly wrong — it lags behind, as if the water remembers a moment ago. Calm and cold.

**28. `bg_forest_stop_night`** — лесная остановка ночью.
> Edit this exact image: same bus stop, same forest, same camera. Night: the bus stop roof drips, a single cold street lamp that should not exist here lights the bench, everything else is grey-blue fog.

**29. `bg_yard_grey`** — обычный серый двор (для дневных сцен у Лаптевых).
> Side view of an ordinary Russian village yard on a grey rainy day: a muddy path, a sagging fence, a plastic basin, laundry that was forgotten in the rain, a rusty Java motorcycle under a tarp, a small banya with a heavy bolt on the outside of its door. Nothing pretty, just tired everyday life. Cold grey light, drizzle.

**30. `bg_kitchen`** — неуютная кухня (для разговоров в доме Лаптевых).
> Interior side view of a cramped village kitchen: an oilcloth on the table, a dripping tap, a calendar from 2004 that was never changed, a bus timetable under cracked glass by the coat rack, a bare bulb. Grey daylight from a small window. Uncomfortable, quiet, real.

**31. `bg_stop_wet`** — мокрая остановка на старой дороге.
> Side view of an empty rural bus stop by an old broken asphalt road in the rain: a rusty metal shelter, a bench with peeling paint, a faded timetable, puddles, a grey forest behind. Ordinary and lonely. Cold grey light, steady drizzle.

### Этап 6. Духи: Полудница и Леший

Сейчас в игре они нарисованы кодом прямо в картину: Полудница — светящаяся фигура в дрожащем от жары воздухе, Леший — тёмный силуэт на пне у ельника с зелёными глазами. Если сделать для них картинки, игра возьмёт их вместо этого. Фон — **ровный нейтральный серый, без теней и пола**: так их легко вырезать.

**32. `s_noon`** — Полудница в полный рост.
> Full-body side view, facing right, of Poludnitsa, the noon spirit of Slavic folklore: a very tall thin woman in a long white linen shirt down to the ground with a thin red woven belt, long pale wheat-coloured hair loose to the waist, a small wreath of rye ears. Her right hand rests on her shoulder holding an old sickle, the curved blade above her shoulder catching a spark of sunlight. Her face is lost in a soft blinding glow, no features visible. The hem of the shirt fades into heat haze. Painted in the same muted realistic painterly style as the backgrounds, warm noon light from above. Plain flat neutral grey background, no floor, no shadow, nothing else in the frame.

**33. `p_noon_neutral`** — Полудница, портрет по пояс.
> Waist-up portrait of the same Poludnitsa, three-quarter view: white linen shirt with faded red embroidery at the collar, pale loose hair, the sickle on her shoulder. Where her face should be there is only bright overexposed light, as if looking at the sun; you can barely sense the eyes. Heat shimmer around her outline. Holy and frightening at once. Muted painterly realism. Plain flat neutral grey background.

**34. `s_leshy`** — Леший сидит на пне.
> Full-body side view, facing right, of Leshy, the forest spirit of Slavic folklore, sitting hunched on a low mossy stump: an old gaunt man in a worn dark sheepskin coat buttoned on the wrong (left) side, one arm resting on his knee, a crooked walking stick leaning on his shoulder, bast shoes. His long beard is like dry grey lichen, small bare twigs and moss grow out of his hair instead of a hat, faint pale green eyes. Dark, earthy, desaturated colours — he almost merges with a spruce forest. He casts no shadow. Muted realistic painterly style, cold morning light. Plain flat neutral grey background, the stump included, no ground, nothing else.

**35. `p_leshy_neutral`** — Леший, портрет по пояс.
> Waist-up portrait of the same Leshy, three-quarter view, head slightly lowered, looking up from under heavy brows: weathered face like old bark, lichen beard, twigs and moss in the hair, faintly glowing pale green eyes, the sheepskin collar buttoned on the wrong side. Calm, ancient, indifferent. Muted painterly realism, cold forest light. Plain flat neutral grey background.

---

Когда всё будет готово, напомни мне скачать все картинки и отправить их в Claude вместе с именами файлов.
