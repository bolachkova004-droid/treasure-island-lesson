# Заветье: промпты для иллюстраций

Стилевой ориентир — присланный пример: живописная полуреалистичная иллюстрация, золотой час или сумерки, туман над водой, вышивка на одежде, болотная жуть. По настроению — «И поглотит нас морок» из «Клуба Романтики».

**Главное правило контраста:** квартира матери в городе светлая, дневная, тёплая. Заветье всегда в тумане: приглушённые цвета, тёплый свет только в окнах и у печи.

Промпты написаны по-английски: так генераторы понимают их точнее. Подходят Midjourney, Leonardo, Kandinsky/Шедеврум, Nano Banana, Flux.

---

## 1. Общий стилевой блок

Добавляйте его в конец каждого промпта, чтобы все картинки были из одного мира.

```
dark atmospheric painterly digital illustration, Slavic folk horror, northern Russian village, cinematic lighting, thick low fog, muted desaturated palette of moss green, peat brown and slate blue, warm amber light only from windows and fire, soft volumetric light, fine painterly texture, realistic proportions, story-game key art, highly detailed
```

Для квартиры матери замените туман и приглушённые цвета на это:

```
bright soft daylight, warm clean colors, calm and cozy, no fog
```

Во всех промптах **не должно быть** текста, логотипов и водяных знаков. Если генератор поддерживает отдельное поле для запретов (negative prompt), впишите туда:

```
text, letters, watermark, logo, signature, modern cars, extra fingers, deformed hands, blurry, cartoon, anime, 3d render
```

---

## 2. С чего начать: пробная партия

Сначала сделайте четыре картинки, пришлите их, я встрою и покажу, как это выглядит в игре. Когда стиль совпадёт, делаем остальное.

1. `bg_street_a` — первая половина улицы;
2. `p_anna_neutral` — портрет Анны;
3. `s_anna` — Анна в полный рост сбоку;
4. `p_grunya_warm` — портрет Груни.

---

## 3. Фоны для ходьбы (панорамы, вид сбоку)

**Формат:** широкая панорама, **3840 × 1080** или соотношение 32:9. Если генератор так не умеет, делайте 21:9, это тоже подойдёт.

**Правила кадра:**
- вид строго сбоку, **без людей**;
- дорога или тропинка идёт горизонтально через весь кадр, в **нижней пятой части картинки** — по ней будет ходить Анна;
- постройки стоят вдоль дороги **слева направо в указанном порядке**. Точно генератор не повторит, но порядок помогает: к каждому дому я привяжу место, где Анна с ним взаимодействует.

Время суток я тонирую в игре сама: утро, полдень, вечер. **Ночь лучше сгенерировать отдельно** с тем же промптом и припиской `at night, moonlight, only two windows lit` и сохранить с суффиксом `_night`. Для обеих половин улицы и дороги это заметно красивее.

| Файл | Промпт (перед общим стилевым блоком) |
|---|---|
| `bg_street_a` | side view panorama of a northern Russian village street at dusk, from left to right: dark spruce forest edge with a wooden signpost, a lonely old log house with boarded-up windows with carved white frames, faint smoke from its chimney, a crooked picket fence, a narrow path going down to a river, a village healer's log house with bundles of herbs under the eaves and warm lit windows, a wooden bench, a tall well sweep (shadoof), dirt road running horizontally across the whole image, thick fog creeping between houses |
| `bg_street_b` | side view panorama continuing the same village street at dusk, from left to right: two birches, an old two-storey wooden school with peeling blue paint and one broken window, a neighbour's log house with blue carved window frames, a yard behind a picket fence with a wooden shed and a red old Jawa motorcycle, a log house with an old brown suitcase standing by the door, a clothesline with white sheets, an apple tree with a tire swing, a small dark bathhouse (banya) with a heavy latch on the outside of its door, dirt road running horizontally, fog |
| `bg_road` | side view of an empty old country road through a spruce forest at dusk, cracked asphalt running horizontally, a lonely concrete slab on the roadside with four rusty bolts where a bus stop used to be, a single white chamomile on the slab, leaning telegraph poles with sagging wires, a rusty sign, low fog |
| `bg_field` | side view of a rye field, from left to right: the dark wall of a spruce forest with a faded red thread tied on a lower branch and an old stump, then the rye field in midday haze with heat shimmer, a scarecrow in a red shirt, a distant wooden windmill on the horizon, a narrow path running horizontally |
| `bg_river` | side view of a slow dark river at golden hour, from left to right: a path going up the bank to the village, reeds and cattails, a wooden footbridge (mostki) stretching into the water, weeping willows, a distant old windmill on the far bank, thick mist over the water, water like black glass with warm reflections |
| `bg_forest_stop` | side view of a new black asphalt road inside a dense ancient spruce forest at dawn, a small early-2000s bus stop shelter with a tin roof and a bench, a round bus stop sign, cold grey-blue light, frozen still mist, everything unnaturally quiet, time stopped |
| `bg_aglaya_house` | interior side view of an old Russian log house at night, from left to right: a plank door, a carved spinning wheel in the dark corner, a large whitewashed Russian stove (pech) with glowing fire in its mouth, embroidered towel (rushnik) on the wall, a table with an embroidered cloth and a single cup, a moonlit window, a shelf with old school notebooks, a wooden bench with a blanket, warm firelight and deep shadows |
| `bg_grunya_house` | interior side view of an old village healer's izba in the evening, from left to right: a door, a painted red wooden chest of drawers, bundles of dried herbs hanging from the ceiling beams, a table with bread and a hanging kerosene lamp, a window, a whitewashed stove, cozy but uneasy warm light |
| `bg_laptev_house` | interior side view of a modest village house, from left to right: a door, coats on hooks, an old framed bus timetable under cracked glass on the wall, a kitchen table, a partition, an old tiled Dutch stove in the dim entryway, grey morning light |
| `bg_school` | interior side view of an abandoned village school classroom, from left to right: a broken window, dusty desks, a blackboard with faint chalk words, a wall newspaper with student photos, a teacher's desk, dust in the daylight |
| `bg_city_flat` | interior side view of a bright modern city apartment, from left to right: a tall wardrobe with an old cardboard parcel on the top shelf, a big window with daylight, a table with boxes, plants, light walls, calm and cozy (use the daylight modifier instead of fog) |

---

## 4. Персонажи

Для героев нужны два вида картинок.

1. **Портрет для диалогов** `p_<кто>_<эмоция>` — по пояс, 2:3 (например, 1024 × 1536), лицом в сторону зрителя или чуть вбок, **на однотонном светло-сером фоне**. Фон я уберу сама, или присылайте сразу PNG с прозрачностью.
2. **Фигура для ходьбы** `s_<кто>` — в полный рост, **вид строго сбоку, лицом вправо**, на однотонном светло-сером фоне. Для Анны, если получится, сделайте 2–4 кадра шага: `s_anna_1` … `s_anna_4`.

**Как добиться, чтобы героиня была одной и той же на всех картинках:**
- сначала сделайте «лист персонажа» (character sheet) и выберите лучший вариант;
- дальше каждую картинку этого героя генерируйте с листом в качестве референса: в Midjourney это `--cref`, в Leonardo — Character Reference, в Nano Banana и Kandinsky — изображение-образец.

**Как игра выбирает портрет:** если нужной эмоции нет, берётся `neutral`, а если нет и её — любой портрет этого героя. Поэтому можно начать с одного портрета на героя и добавлять эмоции постепенно.

| Кто | Портреты (эмоции) | Фигура для ходьбы |
|---|---|---|
| Анна | `p_anna_neutral`, `p_anna_afraid`, `p_anna_sad` | `s_anna` или `s_anna_1…4` |
| Груня | `p_grunya_warm`, `p_grunya_cold`, `p_grunya_humming` | `s_grunya` |
| Гриша | `p_grisha_cheerful`, `p_grisha_confused`, `p_grisha_broken` | `s_grisha` |
| Гриша, 18 лет | `p_young_neutral` | `s_young` (сидит на лавке) |
| Нина Петровна | `p_nina_stern`, `p_nina_guilty` | `s_nina` |
| Варя | `p_varya_neutral` | `s_varya` |
| Полудница | `p_noon_neutral` | `s_noon` |
| Леший | `p_leshy_neutral` | `s_leshy` (сидит на пне) |
| Домовой | `p_domovoi_neutral` | `s_domovoi` |
| Аглая | `p_aglaya_photo` (старая фотография) | не нужна |

Пока у героя нет фигуры, в игре он виден тёмным силуэтом, чтобы не спорить с живописным фоном.

### Анна (главная героиня)
```
Anna, a 30-year-old Russian woman, calm tired intelligent face, grey-green eyes, dark blonde hair in a low loose bun with loose strands, dark charcoal wool coat, long knitted red scarf, a thin red woolen thread tied around her left wrist, city clothes that look out of place in the village
```
Эмоции: `neutral, attentive` · `afraid, wide eyes` · `sad, determined`.

### Груня, Аграфена Кузьминична
```
Grunya, a warm kind-looking old village midwife in her seventies, round soft face, deep wrinkles around smiling eyes, grey headscarf with small white dots tied under the chin, dark wool dress, linen apron with red embroidered hem, bundle of dried herbs in her hands, something unsettling in her too-steady gaze
```
Эмоции: `warm smile` · `cold, unreadable, not smiling` · `humming quietly, eyes closed`.

### Гриша
```
Grisha, a 40-year-old village man, friendly slightly lost face, stubble, oil-stained worn olive work jacket, old flat cap, holding a wrench, cheerful but empty eyes as if he forgot something important
```
Эмоции: `cheerful` · `confused, remembering` · `broken, holding an old cassette player`.

### Гриша в 18 лет
```
Grisha at 18 in 2004, thin young man, messy hair, oversized denim jacket, wired headphones of a cassette player around his neck, an old brown suitcase, hopeful, checking his wristwatch, pale cold dawn light, slightly translucent like a memory
```

### Нина Петровна, мать Гриши
```
Nina Petrovna, a stern thin woman around 70, tightly buttoned grey knitted cardigan, grey hair in a strict bun, faded red woolen thread on her wrist, lips pressed together, avoids eye contact
```
Эмоции: `stern` · `guilty, eyes full of tears`.

### Варя, дочь Гриши
```
Varya, a sharp-eyed 12-year-old village girl, two light brown braids, yellow raincoat, rubber boots, holding a book, curious and too serious for her age
```

### Полудница
```
Poludnitsa, the noon spirit of Slavic folklore, a very tall woman in a long white linen shirt with red embroidery, long pale hair moving without wind, her face hidden in blinding white light, a sickle in her hand, heat haze around her, eerie and holy
```

### Леший
```
Leshy, the forest spirit, a tall gaunt old man sitting on a mossy stump, sheepskin coat buttoned on the wrong side, beard like dry twigs and lichen, eyes like wet moss glowing faintly, he casts no shadow, indifferent and ancient
```

### Домовой
```
Domovoi, the house spirit, a tiny hunched old man with a long grey beard and shaggy hair, peeking from behind a whitewashed Russian stove, two amber glowing eyes in the darkness, grumpy but protective
```

### Аглая (фотография 2004 года)
```
old faded 2004 class photograph, Aglaya, a strict village English teacher in her forties in a dark dress, hair pulled back, film grain, slightly damaged photo
```

---

## 5. Как прислать

Прямо в этот чат: можно по одной или пачкой. Если название не совпадает с таблицами, просто напишите, что это за картинка. Переименую, уберу фон у портретов, сожму для веба и положу в `zavetye/art/`.
