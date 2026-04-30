// Reading content catalog.
// Convention: each level uses 2 short Russian texts (~50–80 words each),
// with 5 comprehension questions from text A and 5 from text B = 10 items total.
// All items are multiple_choice. The prompt includes a brief text snippet
// so the child can re-read it without UI-level "passage" support.
// Levels 2–10 are stubs re-using level-1 items with shifted IDs until Phase 5.

import type { TaskItem } from './types'

// --- Text A (Колобок snippet) ---
const TEXT_A =
  'Жил-был старик со старухой. Попросил старик испечь колобок. ' +
  'Старуха помела по амбару, наскребла муки, замесила тесто и испекла колобок. ' +
  'Положила его на окошко студиться. Колобок полежал-полежал да и покатился.'

// --- Text B (Солнышко snippet) ---
const TEXT_B =
  'Солнце встало рано-рано и послало первые лучи на землю. ' +
  'Птицы запели в лесу, цветы подняли головки навстречу теплу. ' +
  'Дети вышли во двор и радостно побежали на лужайку. ' +
  'Хорошо летом, когда светит яркое солнышко!'

const LEVEL_1_ITEMS: TaskItem[] = [
  // Text A questions
  {
    id: 'reading-1-01',
    type: 'multiple_choice',
    prompt: `Текст: "${TEXT_A}"\n\nКого попросил старик испечь колобок?`,
    options: ['Внучку', 'Дочку', 'Старуху', 'Соседку'],
    correct: 'Старуху',
  },
  {
    id: 'reading-1-02',
    type: 'multiple_choice',
    prompt: `Текст: "${TEXT_A}"\n\nОткуда старуха наскребла муки?`,
    options: ['Из погреба', 'По амбару', 'С огорода', 'Из магазина'],
    correct: 'По амбару',
  },
  {
    id: 'reading-1-03',
    type: 'multiple_choice',
    prompt: `Текст: "${TEXT_A}"\n\nКуда положили колобок студиться?`,
    options: ['На стол', 'В холодильник', 'На окошко', 'На печку'],
    correct: 'На окошко',
  },
  {
    id: 'reading-1-04',
    type: 'multiple_choice',
    prompt: `Текст: "${TEXT_A}"\n\nЧто сделал колобок после того, как полежал?`,
    options: ['Упал', 'Покатился', 'Заговорил', 'Остыл'],
    correct: 'Покатился',
  },
  {
    id: 'reading-1-05',
    type: 'multiple_choice',
    prompt: `Текст: "${TEXT_A}"\n\nЧто испекла старуха?`,
    options: ['Пирог', 'Хлеб', 'Блины', 'Колобок'],
    correct: 'Колобок',
  },
  // Text B questions
  {
    id: 'reading-1-06',
    type: 'multiple_choice',
    prompt: `Текст: "${TEXT_B}"\n\nКогда встало солнце?`,
    options: ['Поздно', 'В полдень', 'Рано-рано', 'Вечером'],
    correct: 'Рано-рано',
  },
  {
    id: 'reading-1-07',
    type: 'multiple_choice',
    prompt: `Текст: "${TEXT_B}"\n\nГде запели птицы?`,
    options: ['В городе', 'На лугу', 'В лесу', 'На реке'],
    correct: 'В лесу',
  },
  {
    id: 'reading-1-08',
    type: 'multiple_choice',
    prompt: `Текст: "${TEXT_B}"\n\nЧто сделали цветы навстречу теплу?`,
    options: ['Закрылись', 'Подняли головки', 'Завяли', 'Зацвели'],
    correct: 'Подняли головки',
  },
  {
    id: 'reading-1-09',
    type: 'multiple_choice',
    prompt: `Текст: "${TEXT_B}"\n\nКуда побежали дети?`,
    options: ['В лес', 'К реке', 'На лужайку', 'В дом'],
    correct: 'На лужайку',
  },
  {
    id: 'reading-1-10',
    type: 'multiple_choice',
    prompt: `Текст: "${TEXT_B}"\n\nКакое время года описано в тексте?`,
    options: ['Зима', 'Осень', 'Весна', 'Лето'],
    correct: 'Лето',
  },
]

// --- Level 2 texts ---

const TEXT_2A =
  'Жили-были дед да баба, и была у них курочка Ряба. ' +
  'Снесла курочка яичко, не простое — золотое! ' +
  'Дед бил-бил — не разбил. Баба bila-bila — не разбила. ' +
  'Мышка бежала, хвостиком махнула, яичко упало и разбилось. ' +
  'Плачет дед, плачет баба. А курочка им говорит: «Не плачь, дед, не плачь, баба — снесу вам яичко простое!»'

const TEXT_2B =
  'Пришла весна. Стало тепло и солнечно. ' +
  'На деревьях появились почки, а потом и первые листочки. ' +
  'В огороде дедушка посадил семена морковки и огурцов. ' +
  'Бабушка поливала их каждый день. Скоро взошли маленькие зелёные ростки. ' +
  'Дети помогали полоть сорняки. Всем было весело работать вместе.'

const LEVEL_2_ITEMS: TaskItem[] = [
  {
    id: 'reading-2-01',
    type: 'multiple_choice',
    prompt: `Текст: "${TEXT_2A}"\n\nКакое яичко снесла курочка Ряба?`,
    options: ['Простое', 'Красное', 'Золотое', 'Большое'],
    correct: 'Золотое',
  },
  {
    id: 'reading-2-02',
    type: 'multiple_choice',
    prompt: `Текст: "${TEXT_2A}"\n\nКто разбил яичко?`,
    options: ['Дед', 'Баба', 'Кошка', 'Мышка'],
    correct: 'Мышка',
  },
  {
    id: 'reading-2-03',
    type: 'multiple_choice',
    prompt: `Текст: "${TEXT_2A}"\n\nЧто пообещала курочка в конце?`,
    options: ['Снести золотое яйцо', 'Снести простое яйцо', 'Убежать', 'Найти яйцо'],
    correct: 'Снести простое яйцо',
  },
  {
    id: 'reading-2-04',
    type: 'multiple_choice',
    prompt: `Текст: "${TEXT_2A}"\n\nЧто сделал дед с яичком?`,
    options: ['Съел', 'Подарил', 'Бил-бил, но не разбил', 'Положил в холодильник'],
    correct: 'Бил-бил, но не разбил',
  },
  {
    id: 'reading-2-05',
    type: 'multiple_choice',
    prompt: `Текст: "${TEXT_2A}"\n\nКак реагировали дед и баба, когда яичко разбилось?`,
    options: ['Смеялись', 'Плакали', 'Пели', 'Спали'],
    correct: 'Плакали',
  },
  {
    id: 'reading-2-06',
    type: 'multiple_choice',
    prompt: `Текст: "${TEXT_2B}"\n\nКакое время года наступило?`,
    options: ['Осень', 'Зима', 'Весна', 'Лето'],
    correct: 'Весна',
  },
  {
    id: 'reading-2-07',
    type: 'multiple_choice',
    prompt: `Текст: "${TEXT_2B}"\n\nЧто посадил дедушка в огороде?`,
    options: ['Картошку и лук', 'Морковку и огурцы', 'Помидоры и перец', 'Яблоки и груши'],
    correct: 'Морковку и огурцы',
  },
  {
    id: 'reading-2-08',
    type: 'multiple_choice',
    prompt: `Текст: "${TEXT_2B}"\n\nЧто появилось на деревьях сначала?`,
    options: ['Цветы', 'Плоды', 'Почки', 'Листья'],
    correct: 'Почки',
  },
  {
    id: 'reading-2-09',
    type: 'multiple_choice',
    prompt: `Текст: "${TEXT_2B}"\n\nЧем занималась бабушка каждый день?`,
    options: ['Копала огород', 'Поливала посевы', 'Собирала урожай', 'Читала книги'],
    correct: 'Поливала посевы',
  },
  {
    id: 'reading-2-10',
    type: 'multiple_choice',
    prompt: `Текст: "${TEXT_2B}"\n\nЧем занимались дети в огороде?`,
    options: ['Поливали', 'Сажали семена', 'Пололи сорняки', 'Собирали урожай'],
    correct: 'Пололи сорняки',
  },
]

// --- Level 3 texts ---

const TEXT_3A =
  'В одном лесу жил медведь. Однажды он нашёл пчелиный улей в дупле дерева. ' +
  'Медведь очень любил мёд. Он залез на дерево и запустил лапу в дупло. ' +
  'Пчёлы налетели и стали жалить медведя. Медведь рычал и отмахивался, ' +
  'но пчёл было слишком много. Пришлось мишке убегать. ' +
  'Зато мёду он всё-таки немного попробовал!'

const TEXT_3B =
  'Маша пошла в лес за грибами. Она взяла с собой корзинку. ' +
  'В лесу было тихо и прохладно. Маша нашла несколько подберёзовиков под берёзой. ' +
  'Потом заметила рыжую лисичку, выглядывающую из травы. ' +
  'Маша наполнила корзинку доверху и радостная пошла домой. ' +
  'Бабушка сварила из грибов вкусный суп.'

const LEVEL_3_ITEMS: TaskItem[] = [
  {
    id: 'reading-3-01',
    type: 'multiple_choice',
    prompt: `Текст: "${TEXT_3A}"\n\nЧто нашёл медведь в дупле дерева?`,
    options: ['Орехи', 'Малину', 'Пчелиный улей', 'Птичье гнездо'],
    correct: 'Пчелиный улей',
  },
  {
    id: 'reading-3-02',
    type: 'multiple_choice',
    prompt: `Текст: "${TEXT_3A}"\n\nПочему медведю пришлось убегать?`,
    options: ['Дерево упало', 'Пчёлы кусали его', 'Пришли охотники', 'Пошёл дождь'],
    correct: 'Пчёлы кусали его',
  },
  {
    id: 'reading-3-03',
    type: 'multiple_choice',
    prompt: `Текст: "${TEXT_3A}"\n\nЧто больше всего любил медведь?`,
    options: ['Малину', 'Рыбу', 'Мёд', 'Орехи'],
    correct: 'Мёд',
  },
  {
    id: 'reading-3-04',
    type: 'multiple_choice',
    prompt: `Текст: "${TEXT_3A}"\n\nКуда медведь залез за мёдом?`,
    options: ['В нору', 'На дерево', 'В реку', 'Под камень'],
    correct: 'На дерево',
  },
  {
    id: 'reading-3-05',
    type: 'multiple_choice',
    prompt: `Текст: "${TEXT_3A}"\n\nУдалось ли медведю попробовать мёд?`,
    options: ['Нет, он убежал ни с чем', 'Да, немного попробовал', 'Да, наелся досыта', 'Нет, пчёлы прогнали его сразу'],
    correct: 'Да, немного попробовал',
  },
  {
    id: 'reading-3-06',
    type: 'multiple_choice',
    prompt: `Текст: "${TEXT_3B}"\n\nКуда пошла Маша?`,
    options: ['На реку', 'В огород', 'В лес за грибами', 'На рынок'],
    correct: 'В лес за грибами',
  },
  {
    id: 'reading-3-07',
    type: 'multiple_choice',
    prompt: `Текст: "${TEXT_3B}"\n\nКакие грибы нашла Маша под берёзой?`,
    options: ['Лисички', 'Подберёзовики', 'Опята', 'Мухоморы'],
    correct: 'Подберёзовики',
  },
  {
    id: 'reading-3-08',
    type: 'multiple_choice',
    prompt: `Текст: "${TEXT_3B}"\n\nЧто заметила Маша в траве?`,
    options: ['Зайца', 'Ёжика', 'Рыжую лисичку', 'Белку'],
    correct: 'Рыжую лисичку',
  },
  {
    id: 'reading-3-09',
    type: 'multiple_choice',
    prompt: `Текст: "${TEXT_3B}"\n\nЧто приготовила бабушка из грибов?`,
    options: ['Пирог', 'Жаркое', 'Суп', 'Котлеты'],
    correct: 'Суп',
  },
  {
    id: 'reading-3-10',
    type: 'multiple_choice',
    prompt: `Текст: "${TEXT_3B}"\n\nЧем была наполнена корзинка Маши?`,
    options: ['Ягодами', 'Грибами', 'Цветами', 'Орехами'],
    correct: 'Грибами',
  },
]

// --- Level 4 texts ---

const TEXT_4A =
  'Зима — самое холодное время года. Земля покрыта белым снегом, ' +
  'реки и озёра замёрзли. Деревья стоят без листьев. ' +
  'Зато как весело зимой! Дети катаются на санках и лыжах, лепят снеговиков, ' +
  'играют в снежки. Некоторые животные впадают в спячку — медведи и ежи. ' +
  'Другие — зайцы и лисы — остаются активными и ищут еду под снегом.'

const TEXT_4B =
  'Наташа и её брат Дима жили рядом с большим парком. ' +
  'Каждые выходные они ходили туда кормить уток на пруду. ' +
  'Однажды они заметили, что утки куда-то исчезли. ' +
  'Дедушка объяснил: «Утки улетели на юг, ведь наступила осень». ' +
  'Дима грустил, но дедушка пообещал, что весной утки вернутся. ' +
  'И правда — когда растаял снег, утки снова появились на пруду!'

const LEVEL_4_ITEMS: TaskItem[] = [
  {
    id: 'reading-4-01',
    type: 'multiple_choice',
    prompt: `Текст: "${TEXT_4A}"\n\nКакое время года описывается в тексте?`,
    options: ['Весна', 'Лето', 'Осень', 'Зима'],
    correct: 'Зима',
  },
  {
    id: 'reading-4-02',
    type: 'multiple_choice',
    prompt: `Текст: "${TEXT_4A}"\n\nЧто делают медведи и ежи зимой?`,
    options: ['Ищут еду', 'Мигрируют на юг', 'Впадают в спячку', 'Строят норы'],
    correct: 'Впадают в спячку',
  },
  {
    id: 'reading-4-03',
    type: 'multiple_choice',
    prompt: `Текст: "${TEXT_4A}"\n\nКак дети проводят зимой время?`,
    options: ['Купаются и загорают', 'Катаются на санках, лепят снеговиков', 'Собирают грибы и ягоды', 'Сидят дома'],
    correct: 'Катаются на санках, лепят снеговиков',
  },
  {
    id: 'reading-4-04',
    type: 'multiple_choice',
    prompt: `Текст: "${TEXT_4A}"\n\nЧто происходит с реками и озёрами зимой?`,
    options: ['Высыхают', 'Разливаются', 'Замерзают', 'Мелеют'],
    correct: 'Замерзают',
  },
  {
    id: 'reading-4-05',
    type: 'multiple_choice',
    prompt: `Текст: "${TEXT_4A}"\n\nКак зайцы и лисы переживают зиму?`,
    options: ['Спят в норах', 'Улетают на юг', 'Остаются активными, ищут еду', 'Не едят всю зиму'],
    correct: 'Остаются активными, ищут еду',
  },
  {
    id: 'reading-4-06',
    type: 'multiple_choice',
    prompt: `Текст: "${TEXT_4B}"\n\nКуда ходили Наташа и Дима по выходным?`,
    options: ['В зоопарк', 'На стадион', 'В парк кормить уток', 'В кино'],
    correct: 'В парк кормить уток',
  },
  {
    id: 'reading-4-07',
    type: 'multiple_choice',
    prompt: `Текст: "${TEXT_4B}"\n\nПочему утки исчезли с пруда?`,
    options: ['Их поймали', 'Улетели на юг с наступлением осени', 'Пруд замёрз', 'Их спугнули'],
    correct: 'Улетели на юг с наступлением осени',
  },
  {
    id: 'reading-4-08',
    type: 'multiple_choice',
    prompt: `Текст: "${TEXT_4B}"\n\nКто объяснил детям, куда пропали утки?`,
    options: ['Мама', 'Учительница', 'Дедушка', 'Сосед'],
    correct: 'Дедушка',
  },
  {
    id: 'reading-4-09',
    type: 'multiple_choice',
    prompt: `Текст: "${TEXT_4B}"\n\nКогда утки вернулись на пруд?`,
    options: ['Зимой', 'Когда растаял снег (весной)', 'Осенью', 'Летом'],
    correct: 'Когда растаял снег (весной)',
  },
  {
    id: 'reading-4-10',
    type: 'multiple_choice',
    prompt: `Текст: "${TEXT_4B}"\n\nКак звали брата Наташи?`,
    options: ['Саша', 'Петя', 'Ваня', 'Дима'],
    correct: 'Дима',
  },
]

// --- Level 5 texts ---

const TEXT_5A =
  'Дорогой дневник! Сегодня был мой первый день в новой школе. ' +
  'Я очень волновалась. Учительница зовут Елена Петровна — она добрая. ' +
  'Рядом со мной сидит девочка по имени Катя. ' +
  'Она сразу предложила мне помочь разобраться в расписании. ' +
  'На перемене мы вместе ели яблоки и болтали. ' +
  'Я думаю, что мы станем подругами. Кажется, здесь будет хорошо!'

const TEXT_5B =
  'Каждый год в России отмечают День Победы — 9 мая. ' +
  'В этот день чествуют ветеранов Великой Отечественной войны. ' +
  'По улицам проходит торжественный парад. ' +
  'Люди несут цветы к памятникам и возлагают венки. ' +
  'Вечером в небе расцветают праздничные фейерверки. ' +
  'Этот праздник напоминает нам о важности мира и о людях, ' +
  'которые защищали нашу страну.'

const LEVEL_5_ITEMS: TaskItem[] = [
  {
    id: 'reading-5-01',
    type: 'multiple_choice',
    prompt: `Текст: "${TEXT_5A}"\n\nКем написан этот текст?`,
    options: ['Учительницей', 'Самой девочкой (дневник)', 'Катей', 'Мамой'],
    correct: 'Самой девочкой (дневник)',
  },
  {
    id: 'reading-5-02',
    type: 'multiple_choice',
    prompt: `Текст: "${TEXT_5A}"\n\nКак зовут учительницу?`,
    options: ['Мария Ивановна', 'Елена Петровна', 'Ольга Сергеевна', 'Наталья Владимировна'],
    correct: 'Елена Петровна',
  },
  {
    id: 'reading-5-03',
    type: 'multiple_choice',
    prompt: `Текст: "${TEXT_5A}"\n\nЧто девочки делали на перемене?`,
    options: ['Играли в мяч', 'Ели яблоки и болтали', 'Читали книги', 'Рисовали'],
    correct: 'Ели яблоки и болтали',
  },
  {
    id: 'reading-5-04',
    type: 'multiple_choice',
    prompt: `Текст: "${TEXT_5A}"\n\nЧем занялась Катя при знакомстве?`,
    options: ['Поделилась едой', 'Помогла разобраться в расписании', 'Показала школу', 'Познакомила с другими'],
    correct: 'Помогла разобраться в расписании',
  },
  {
    id: 'reading-5-05',
    type: 'multiple_choice',
    prompt: `Текст: "${TEXT_5A}"\n\nКакое настроение у девочки в конце дня?`,
    options: ['Грустное', 'Испуганное', 'Обнадёживающее, хорошее', 'Злое'],
    correct: 'Обнадёживающее, хорошее',
  },
  {
    id: 'reading-5-06',
    type: 'multiple_choice',
    prompt: `Текст: "${TEXT_5B}"\n\nКакого числа отмечают День Победы?`,
    options: ['1 мая', '7 ноября', '9 мая', '23 февраля'],
    correct: '9 мая',
  },
  {
    id: 'reading-5-07',
    type: 'multiple_choice',
    prompt: `Текст: "${TEXT_5B}"\n\nКого чествуют в этот день?`,
    options: ['Учителей', 'Ветеранов войны', 'Космонавтов', 'Детей'],
    correct: 'Ветеранов войны',
  },
  {
    id: 'reading-5-08',
    type: 'multiple_choice',
    prompt: `Текст: "${TEXT_5B}"\n\nЧто происходит вечером на День Победы?`,
    options: ['Концерты в школах', 'Парад', 'Фейерверки', 'Ярмарки'],
    correct: 'Фейерверки',
  },
  {
    id: 'reading-5-09',
    type: 'multiple_choice',
    prompt: `Текст: "${TEXT_5B}"\n\nЧто люди несут к памятникам?`,
    options: ['Флаги', 'Цветы и венки', 'Подарки', 'Фотографии'],
    correct: 'Цветы и венки',
  },
  {
    id: 'reading-5-10',
    type: 'multiple_choice',
    prompt: `Текст: "${TEXT_5B}"\n\nО чём напоминает этот праздник?`,
    options: ['О важности спорта', 'О важности мира и защитниках страны', 'О наступлении весны', 'О дружбе народов'],
    correct: 'О важности мира и защитниках страны',
  },
]

// --- Grade-specific Russian language tasks (mixed types) ---

const GRADE_1_ITEMS: TaskItem[] = [
  { id: 'rd-g1-01', type: 'multiple_choice', prompt: 'Какая буква гласная?', options: ['К', 'А', 'Б', 'М'], correct: 'А' },
  { id: 'rd-g1-02', type: 'multiple_choice', prompt: 'Какая буква согласная?', options: ['О', 'У', 'Т', 'И'], correct: 'Т' },
  { id: 'rd-g1-03', type: 'true_false', prompt: 'Буква «Я» — гласная.', correct: true },
  { id: 'rd-g1-04', type: 'true_false', prompt: 'Буква «Р» — гласная.', correct: false },
  { id: 'rd-g1-05', type: 'match_pairs', prompt: 'Соедини слоги в слова', pairs: [
    { left: 'ма', right: 'ма' },
    { left: 'па', right: 'па' },
    { left: 'ко', right: 'т' },
    { left: 'ро', right: 'т' },
  ]},
  { id: 'rd-g1-06', type: 'fill_blank', prompt: 'Дополни: «Кош___»', before: 'Кош', after: '', correct: 'ка', acceptable: ['КА', 'Ка'] },
  { id: 'rd-g1-07', type: 'text_input', prompt: 'Какая первая буква в слове «мама»?', correct: 'м', acceptable: ['М'] },
  { id: 'rd-g1-08', type: 'multiple_choice', prompt: 'Сколько слогов в слове «мама»?', options: ['1', '2', '3', '4'], correct: '2' },
  { id: 'rd-g1-09', type: 'fill_blank', prompt: 'Кот сидит ___ окне.', before: 'Кот сидит', after: 'окне.', correct: 'на', acceptable: ['На', 'НА'] },
  { id: 'rd-g1-10', type: 'true_false', prompt: 'В слове «дом» три буквы.', correct: true },
]

const GRADE_2_ITEMS: TaskItem[] = [
  { id: 'rd-g2-01', type: 'multiple_choice', prompt: 'Какое слово с ударением на 1-й слог?', options: ['ка-ран-да́ш', 'кни́-га', 'те-тра́дь', 'дев-чо́н-ка'], correct: 'кни́-га' },
  { id: 'rd-g2-02', type: 'true_false', prompt: 'В слове «ёлка» пишется «ё».', correct: true },
  { id: 'rd-g2-03', type: 'fill_blank', prompt: 'У ___ёлок зелёные иголки.', before: 'У', after: 'ёлок зелёные иголки.', correct: 'этих', acceptable: ['Этих'] },
  { id: 'rd-g2-04', type: 'match_pairs', prompt: 'Найди антонимы', pairs: [
    { left: 'большой', right: 'маленький' },
    { left: 'горячий', right: 'холодный' },
    { left: 'высокий', right: 'низкий' },
    { left: 'светлый', right: 'тёмный' },
  ]},
  { id: 'rd-g2-05', type: 'multiple_choice', prompt: 'Что нужно писать после согласной перед «е»?', options: ['ъ', 'ь', '–', 'й'], correct: 'ь' },
  { id: 'rd-g2-06', type: 'text_input', prompt: 'Напиши слово, противоположное к «день»', correct: 'ночь', acceptable: ['Ночь', 'НОЧЬ'] },
  { id: 'rd-g2-07', type: 'multiple_choice', prompt: 'Сколько букв в слове «семья»?', options: ['4', '5', '6', '7'], correct: '5' },
  { id: 'rd-g2-08', type: 'true_false', prompt: 'В слове «жильё» пишется «ь».', correct: true },
  { id: 'rd-g2-09', type: 'fill_blank', prompt: 'У бабушки во дворе ___ кот.', before: 'У бабушки во дворе', after: 'кот.', correct: 'живёт', acceptable: ['Живёт'] },
  { id: 'rd-g2-10', type: 'multiple_choice', prompt: 'В слове «коньки» какая буква обозначает мягкость?', options: ['к', 'о', 'н', 'ь'], correct: 'ь' },
]

const GRADE_3_ITEMS: TaskItem[] = [
  { id: 'rd-g3-01', type: 'multiple_choice', prompt: 'Корень в слове «лесной»', options: ['лес', 'лесн', 'ной', 'ой'], correct: 'лес' },
  { id: 'rd-g3-02', type: 'multiple_choice', prompt: 'Приставка в слове «подъезд»', options: ['под', 'подъ', 'ъезд', 'езд'], correct: 'под' },
  { id: 'rd-g3-03', type: 'text_input', prompt: 'Корень слова «школьник»', correct: 'школ', acceptable: ['школ', 'школа'] },
  { id: 'rd-g3-04', type: 'fill_blank', prompt: 'Безударная гласная: в___да', before: 'в', after: 'да', correct: 'о', acceptable: ['О'] },
  { id: 'rd-g3-05', type: 'true_false', prompt: 'В слове «солнце» проверочное — «солнышко».', correct: true },
  { id: 'rd-g3-06', type: 'match_pairs', prompt: 'Соедини фразеологизмы', pairs: [
    { left: 'бить баклуши', right: 'бездельничать' },
    { left: 'водить за нос', right: 'обманывать' },
    { left: 'спустя рукава', right: 'небрежно' },
    { left: 'как снег на голову', right: 'неожиданно' },
  ]},
  { id: 'rd-g3-07', type: 'multiple_choice', prompt: 'Суффикс в слове «домик»', options: ['ик', 'омик', 'дом', 'мик'], correct: 'ик' },
  { id: 'rd-g3-08', type: 'fill_blank', prompt: 'Окончание в слове «мама»: ма___', before: 'ма', after: '', correct: 'ма', acceptable: ['а', 'А'] },
  { id: 'rd-g3-09', type: 'true_false', prompt: 'Слово «прибежал» имеет приставку «при-».', correct: true },
  { id: 'rd-g3-10', type: 'multiple_choice', prompt: 'Безударная гласная в слове «трава»', options: ['а', 'о', 'е', 'у'], correct: 'а' },
]

const GRADE_4_ITEMS: TaskItem[] = [
  { id: 'rd-g4-01', type: 'multiple_choice', prompt: 'Часть речи: «бежать»', options: ['существительное', 'прилагательное', 'глагол', 'наречие'], correct: 'глагол' },
  { id: 'rd-g4-02', type: 'multiple_choice', prompt: 'Часть речи: «красивый»', options: ['существительное', 'прилагательное', 'глагол', 'местоимение'], correct: 'прилагательное' },
  { id: 'rd-g4-03', type: 'text_input', prompt: 'Часть речи слова «стол» (одним словом)', correct: 'существительное', acceptable: ['Существительное', 'сущ', 'сущ.'] },
  { id: 'rd-g4-04', type: 'match_pairs', prompt: 'Соедини синонимы', pairs: [
    { left: 'храбрый', right: 'смелый' },
    { left: 'грустный', right: 'печальный' },
    { left: 'быстрый', right: 'скорый' },
    { left: 'весёлый', right: 'радостный' },
  ]},
  { id: 'rd-g4-05', type: 'true_false', prompt: 'Существительное обозначает действие.', correct: false },
  { id: 'rd-g4-06', type: 'multiple_choice', prompt: 'Падеж слова «маме» в «дать маме»', options: ['Именительный', 'Родительный', 'Дательный', 'Винительный'], correct: 'Дательный' },
  { id: 'rd-g4-07', type: 'fill_blank', prompt: 'Прилагательное «син___» к слову «небо»', before: 'син', after: '', correct: 'ее', acceptable: ['ее', 'Ее', 'ЕЕ'] },
  { id: 'rd-g4-08', type: 'multiple_choice', prompt: 'Какое слово — наречие?', options: ['быстро', 'быстрый', 'скорость', 'спешить'], correct: 'быстро' },
  { id: 'rd-g4-09', type: 'true_false', prompt: 'Местоимение заменяет существительное.', correct: true },
  { id: 'rd-g4-10', type: 'text_input', prompt: 'Какое местоимение 1-го лица единственного числа?', correct: 'я', acceptable: ['Я'] },
]

const GRADE_5_ITEMS: TaskItem[] = [
  { id: 'rd-g5-01', type: 'multiple_choice', prompt: 'Какое предложение повествовательное?', options: ['Куда ты идёшь?', 'Беги быстрее!', 'Я люблю читать.', 'Какой красивый день!'], correct: 'Я люблю читать.' },
  { id: 'rd-g5-02', type: 'multiple_choice', prompt: 'Какое предложение восклицательное?', options: ['Вот моя книга.', 'Какая чудесная погода!', 'Ты идёшь домой?', 'Я ем завтрак.'], correct: 'Какая чудесная погода!' },
  { id: 'rd-g5-03', type: 'text_input', prompt: 'Какой главный член предложения отвечает на вопрос «кто?» или «что?» (одним словом)', correct: 'подлежащее', acceptable: ['Подлежащее'] },
  { id: 'rd-g5-04', type: 'true_false', prompt: 'Сказуемое отвечает на вопрос «что делает?»', correct: true },
  { id: 'rd-g5-05', type: 'fill_blank', prompt: 'В предложении «Дети играют» подлежащее — это «___».', before: 'В предложении «Дети играют» подлежащее — это «', after: '».', correct: 'дети', acceptable: ['Дети', 'ДЕТИ'] },
  { id: 'rd-g5-06', type: 'match_pairs', prompt: 'Соедини член предложения и вопрос', pairs: [
    { left: 'подлежащее', right: 'кто? что?' },
    { left: 'сказуемое', right: 'что делает?' },
    { left: 'определение', right: 'какой?' },
    { left: 'обстоятельство', right: 'где? когда?' },
  ]},
  { id: 'rd-g5-07', type: 'multiple_choice', prompt: 'Тип предложения «Какая красивая роза!»', options: ['повествовательное', 'вопросительное', 'восклицательное', 'побудительное'], correct: 'восклицательное' },
  { id: 'rd-g5-08', type: 'fill_blank', prompt: '«Солнце светит» — основа предложения: ___ светит.', before: '«Солнце светит» — основа предложения:', after: 'светит.', correct: 'солнце', acceptable: ['Солнце'] },
  { id: 'rd-g5-09', type: 'multiple_choice', prompt: 'Что делает определение?', options: ['обозначает действие', 'обозначает признак', 'обозначает место', 'обозначает количество'], correct: 'обозначает признак' },
  { id: 'rd-g5-10', type: 'true_false', prompt: 'Простое предложение содержит одну грамматическую основу.', correct: true },
]

const GRADE_6_ITEMS: TaskItem[] = [
  { id: 'rd-g6-01', type: 'multiple_choice', prompt: 'Какое слово — причастие?', options: ['бежать', 'бегущий', 'бег', 'быстро'], correct: 'бегущий' },
  { id: 'rd-g6-02', type: 'multiple_choice', prompt: 'Какое слово — деепричастие?', options: ['читая', 'читал', 'чтение', 'читатель'], correct: 'читая' },
  { id: 'rd-g6-03', type: 'fill_blank', prompt: 'Сколько Н в слове «варё___ый»?', before: 'варё', after: 'ый', correct: 'н', acceptable: ['Н', 'нн', 'НН'] },
  { id: 'rd-g6-04', type: 'true_false', prompt: 'В причастиях, образованных от глаголов несовершенного вида, пишется одна Н.', correct: true },
  { id: 'rd-g6-05', type: 'match_pairs', prompt: 'Соедини глагол и причастие', pairs: [
    { left: 'читать', right: 'читающий' },
    { left: 'писать', right: 'пишущий' },
    { left: 'видеть', right: 'видящий' },
    { left: 'делать', right: 'делающий' },
  ]},
  { id: 'rd-g6-06', type: 'text_input', prompt: 'Напиши причастие настоящего времени от «играть»', correct: 'играющий', acceptable: ['Играющий'] },
  { id: 'rd-g6-07', type: 'multiple_choice', prompt: 'Сколько Н в «стеклянный»?', options: ['Н', 'НН', 'НИ', 'нет Н'], correct: 'НН' },
  { id: 'rd-g6-08', type: 'fill_blank', prompt: 'Деепричастие от «бежать» — ___', before: 'Деепричастие от «бежать» —', after: '', correct: 'бежа', acceptable: ['Бежа'] },
  { id: 'rd-g6-09', type: 'true_false', prompt: 'Причастный оборот выделяется запятыми, если стоит после определяемого слова.', correct: true },
  { id: 'rd-g6-10', type: 'multiple_choice', prompt: 'В каком слове пишется НН?', options: ['пуга...ый', 'мороже...ый', 'жаре...ый', 'варё...ый'], correct: 'пуга...ый' },
]

const GRADE_7_ITEMS: TaskItem[] = [
  { id: 'rd-g7-01', type: 'multiple_choice', prompt: 'Что такое предлог?', options: ['самостоятельная часть речи', 'служебная часть речи', 'союз', 'междометие'], correct: 'служебная часть речи' },
  { id: 'rd-g7-02', type: 'multiple_choice', prompt: 'Какое слово — союз?', options: ['и', 'на', 'не', 'до'], correct: 'и' },
  { id: 'rd-g7-03', type: 'multiple_choice', prompt: 'Какое слово — частица?', options: ['но', 'или', 'не', 'через'], correct: 'не' },
  { id: 'rd-g7-04', type: 'text_input', prompt: 'Союз, обозначающий противопоставление (одним словом)', correct: 'но', acceptable: ['Но', 'НО', 'а'] },
  { id: 'rd-g7-05', type: 'true_false', prompt: 'Предлог не является членом предложения.', correct: true },
  { id: 'rd-g7-06', type: 'match_pairs', prompt: 'Соедини и определи разряд', pairs: [
    { left: 'и', right: 'союз' },
    { left: 'на', right: 'предлог' },
    { left: 'не', right: 'частица' },
    { left: 'ах', right: 'междометие' },
  ]},
  { id: 'rd-g7-07', type: 'fill_blank', prompt: 'Я пошёл, ___ устал. (противопоставление)', before: 'Я пошёл,', after: 'устал.', correct: 'но', acceptable: ['Но', 'однако'] },
  { id: 'rd-g7-08', type: 'multiple_choice', prompt: 'Какой союз сочинительный?', options: ['чтобы', 'потому что', 'и', 'если'], correct: 'и' },
  { id: 'rd-g7-09', type: 'multiple_choice', prompt: 'Какой союз подчинительный?', options: ['и', 'но', 'или', 'если'], correct: 'если' },
  { id: 'rd-g7-10', type: 'true_false', prompt: 'Частица «бы» используется в условном наклонении.', correct: true },
]

const GRADE_LEVELS: TaskItem[][] = [
  GRADE_1_ITEMS,
  GRADE_2_ITEMS,
  GRADE_3_ITEMS,
  GRADE_4_ITEMS,
  GRADE_5_ITEMS,
  GRADE_6_ITEMS,
  GRADE_7_ITEMS,
]

const COMPREHENSION_LEVELS: TaskItem[][] = [
  LEVEL_1_ITEMS,
  LEVEL_2_ITEMS,
  LEVEL_3_ITEMS,
  LEVEL_4_ITEMS,
  LEVEL_5_ITEMS,
]

function mulberry32(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

/**
 * Returns 10 TaskItems for the given reading (grade, level).
 * grade: 1-7, level: 1-10.
 * - Odd levels (1, 3, 5, 7, 9) → grade-specific Russian language tasks (mixed types)
 * - Even levels (2, 4, 6, 8, 10) → reading comprehension texts (multiple_choice)
 *
 * Items and multiple-choice options are shuffled deterministically by (grade, level)
 * so subsequent passes through the same content feel different.
 */
export function getLevel(grade: number, level: number): TaskItem[] {
  const g = Math.max(1, Math.min(7, Math.round(grade)))
  const lvl = Math.max(1, Math.min(10, Math.round(level)))

  let base: TaskItem[]
  if (lvl % 2 === 1) {
    base = GRADE_LEVELS[g - 1] ?? GRADE_LEVELS[0] ?? GRADE_1_ITEMS
  } else {
    const compIdx = Math.floor((lvl - 1) / 2) % COMPREHENSION_LEVELS.length
    base = COMPREHENSION_LEVELS[compIdx] ?? LEVEL_1_ITEMS
  }

  const rng = mulberry32(g * 10_000 + lvl * 100 + 17)
  const shuffled = shuffle(base, rng)
  return shuffled.map((item, idx) => {
    const withLevelId = { ...item, id: `${item.id}-srv-${lvl}-${idx}` } as TaskItem
    if (withLevelId.type === 'multiple_choice') {
      return { ...withLevelId, options: shuffle(withLevelId.options, rng) }
    }
    return withLevelId
  })
}
