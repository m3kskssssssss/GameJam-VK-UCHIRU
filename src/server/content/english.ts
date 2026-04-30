// English content catalog.
// Level 1: 10 word-translation multiple_choice items (RU → EN basic vocab).
// Four options each; correct answer is the English word.
// Levels 2–10 are stubs re-using level-1 items with shifted IDs until Phase 5.

import type { TaskItem } from './types'

const LEVEL_1_ITEMS: TaskItem[] = [
  {
    id: 'english-1-01',
    type: 'multiple_choice',
    prompt: 'Как по-английски «кошка»?',
    options: ['dog', 'cat', 'cow', 'hen'],
    correct: 'cat',
  },
  {
    id: 'english-1-02',
    type: 'multiple_choice',
    prompt: 'Как по-английски «собака»?',
    options: ['cat', 'fox', 'dog', 'pig'],
    correct: 'dog',
  },
  {
    id: 'english-1-03',
    type: 'multiple_choice',
    prompt: 'Как по-английски «солнце»?',
    options: ['moon', 'star', 'sky', 'sun'],
    correct: 'sun',
  },
  {
    id: 'english-1-04',
    type: 'multiple_choice',
    prompt: 'Как по-английски «яблоко»?',
    options: ['pear', 'apple', 'plum', 'grape'],
    correct: 'apple',
  },
  {
    id: 'english-1-05',
    type: 'multiple_choice',
    prompt: 'Как по-английски «дом»?',
    options: ['room', 'door', 'house', 'wall'],
    correct: 'house',
  },
  {
    id: 'english-1-06',
    type: 'multiple_choice',
    prompt: 'Как по-английски «книга»?',
    options: ['pen', 'book', 'desk', 'bag'],
    correct: 'book',
  },
  {
    id: 'english-1-07',
    type: 'multiple_choice',
    prompt: 'Как по-английски «дерево»?',
    options: ['leaf', 'bush', 'tree', 'flower'],
    correct: 'tree',
  },
  {
    id: 'english-1-08',
    type: 'multiple_choice',
    prompt: 'Как по-английски «вода»?',
    options: ['milk', 'juice', 'tea', 'water'],
    correct: 'water',
  },
  {
    id: 'english-1-09',
    type: 'multiple_choice',
    prompt: 'Как по-английски «хлеб»?',
    options: ['cake', 'bread', 'rice', 'soup'],
    correct: 'bread',
  },
  {
    id: 'english-1-10',
    type: 'multiple_choice',
    prompt: 'Как по-английски «рыба»?',
    options: ['bird', 'frog', 'fish', 'bear'],
    correct: 'fish',
  },
]

// --- Grade-aware levels (1-7) ---
//
// Each grade has 5 levels; each level mixes question types for variety.
// Vocabulary themes scale up with grade.

const G1L1: TaskItem[] = [
  { id: 'en-g1-l1-01', type: 'multiple_choice', prompt: 'Как по-английски «кошка»?', options: ['dog', 'cat', 'cow', 'hen'], correct: 'cat' },
  { id: 'en-g1-l1-02', type: 'multiple_choice', prompt: 'Как по-английски «собака»?', options: ['cat', 'fox', 'dog', 'pig'], correct: 'dog' },
  { id: 'en-g1-l1-03', type: 'text_input', prompt: 'Напиши по-английски «солнце»', correct: 'sun', acceptable: ['Sun', 'SUN'], inputMode: 'text' },
  { id: 'en-g1-l1-04', type: 'multiple_choice', prompt: 'Как по-английски «яблоко»?', options: ['pear', 'apple', 'plum', 'grape'], correct: 'apple' },
  { id: 'en-g1-l1-05', type: 'true_false', prompt: 'Слово «book» переводится как «книга».', correct: true },
  { id: 'en-g1-l1-06', type: 'match_pairs', prompt: 'Соедини слово и перевод', pairs: [
    { left: 'cat', right: 'кошка' },
    { left: 'dog', right: 'собака' },
    { left: 'sun', right: 'солнце' },
    { left: 'apple', right: 'яблоко' },
  ]},
  { id: 'en-g1-l1-07', type: 'fill_blank', prompt: 'I see a ___', before: 'I see a', after: '(кошка)', correct: 'cat', acceptable: ['Cat', 'CAT'] },
  { id: 'en-g1-l1-08', type: 'multiple_choice', prompt: 'Как по-английски «вода»?', options: ['milk', 'juice', 'tea', 'water'], correct: 'water' },
  { id: 'en-g1-l1-09', type: 'text_input', prompt: 'Напиши по-английски «дом»', correct: 'house', acceptable: ['House', 'HOUSE'] },
  { id: 'en-g1-l1-10', type: 'true_false', prompt: 'Слово «fish» переводится как «птица».', correct: false },
]

const G1L2: TaskItem[] = [
  { id: 'en-g1-l2-01', type: 'multiple_choice', prompt: 'Какая цифра — «three»?', options: ['2', '3', '4', '5'], correct: '3' },
  { id: 'en-g1-l2-02', type: 'multiple_choice', prompt: 'Какая цифра — «seven»?', options: ['5', '6', '7', '8'], correct: '7' },
  { id: 'en-g1-l2-03', type: 'text_input', prompt: 'Напиши цифру 5 английским словом', correct: 'five', acceptable: ['Five', 'FIVE'] },
  { id: 'en-g1-l2-04', type: 'match_pairs', prompt: 'Соедини цвет и перевод', pairs: [
    { left: 'red', right: 'красный' },
    { left: 'blue', right: 'синий' },
    { left: 'green', right: 'зелёный' },
    { left: 'yellow', right: 'жёлтый' },
  ]},
  { id: 'en-g1-l2-05', type: 'multiple_choice', prompt: 'Цвет «black» — это…', options: ['белый', 'чёрный', 'синий', 'красный'], correct: 'чёрный' },
  { id: 'en-g1-l2-06', type: 'true_false', prompt: 'Слово «white» — белый цвет.', correct: true },
  { id: 'en-g1-l2-07', type: 'text_input', prompt: 'Напиши слово «дерево»', correct: 'tree', acceptable: ['Tree', 'TREE'] },
  { id: 'en-g1-l2-08', type: 'fill_blank', prompt: 'I have ___ apples (3)', before: 'I have', after: 'apples', correct: 'three', acceptable: ['Three', '3'] },
  { id: 'en-g1-l2-09', type: 'multiple_choice', prompt: 'Как по-английски «один»?', options: ['two', 'three', 'one', 'ten'], correct: 'one' },
  { id: 'en-g1-l2-10', type: 'multiple_choice', prompt: 'Как по-английски «десять»?', options: ['nine', 'ten', 'eight', 'seven'], correct: 'ten' },
]

const G2L1: TaskItem[] = [
  { id: 'en-g2-l1-01', type: 'multiple_choice', prompt: 'Глагол to be в форме I: I ___', options: ['is', 'am', 'are', 'be'], correct: 'am' },
  { id: 'en-g2-l1-02', type: 'multiple_choice', prompt: 'Глагол to be в форме he: he ___', options: ['am', 'is', 'are', 'be'], correct: 'is' },
  { id: 'en-g2-l1-03', type: 'fill_blank', prompt: 'They ___ students.', before: 'They', after: 'students.', correct: 'are', acceptable: ['Are'] },
  { id: 'en-g2-l1-04', type: 'true_false', prompt: 'Правильно: «She are happy».', correct: false },
  { id: 'en-g2-l1-05', type: 'text_input', prompt: 'Заполни: We ___ friends.', correct: 'are', acceptable: ['Are'] },
  { id: 'en-g2-l1-06', type: 'multiple_choice', prompt: 'Семья: «отец» по-английски', options: ['mother', 'father', 'sister', 'brother'], correct: 'father' },
  { id: 'en-g2-l1-07', type: 'match_pairs', prompt: 'Семья — соедини', pairs: [
    { left: 'mother', right: 'мама' },
    { left: 'father', right: 'папа' },
    { left: 'sister', right: 'сестра' },
    { left: 'brother', right: 'брат' },
  ]},
  { id: 'en-g2-l1-08', type: 'multiple_choice', prompt: 'Еда: «хлеб» по-английски', options: ['milk', 'bread', 'meat', 'cheese'], correct: 'bread' },
  { id: 'en-g2-l1-09', type: 'text_input', prompt: 'Напиши «молоко» по-английски', correct: 'milk', acceptable: ['Milk', 'MILK'] },
  { id: 'en-g2-l1-10', type: 'fill_blank', prompt: 'I ___ a student.', before: 'I', after: 'a student.', correct: 'am', acceptable: ['Am'] },
]

const G3L1: TaskItem[] = [
  { id: 'en-g3-l1-01', type: 'multiple_choice', prompt: 'Present Simple: He ___ football.', options: ['play', 'plays', 'playing', 'played'], correct: 'plays' },
  { id: 'en-g3-l1-02', type: 'fill_blank', prompt: 'She ___ to school every day.', before: 'She', after: 'to school every day.', correct: 'goes', acceptable: ['Goes'] },
  { id: 'en-g3-l1-03', type: 'true_false', prompt: 'Правильно: «He don\'t like apples».', correct: false },
  { id: 'en-g3-l1-04', type: 'multiple_choice', prompt: 'Какой артикль: ___ apple', options: ['a', 'an', 'the', '–'], correct: 'an' },
  { id: 'en-g3-l1-05', type: 'multiple_choice', prompt: 'Какой артикль: ___ book', options: ['a', 'an', 'the', '–'], correct: 'a' },
  { id: 'en-g3-l1-06', type: 'text_input', prompt: 'Множественное число от cat', correct: 'cats', acceptable: ['Cats'] },
  { id: 'en-g3-l1-07', type: 'text_input', prompt: 'Множественное число от child', correct: 'children', acceptable: ['Children'] },
  { id: 'en-g3-l1-08', type: 'match_pairs', prompt: 'Соедини единственное и множественное', pairs: [
    { left: 'man', right: 'men' },
    { left: 'foot', right: 'feet' },
    { left: 'tooth', right: 'teeth' },
    { left: 'mouse', right: 'mice' },
  ]},
  { id: 'en-g3-l1-09', type: 'fill_blank', prompt: 'My friend ___ (have) a dog.', before: 'My friend', after: 'a dog.', correct: 'has', acceptable: ['Has'] },
  { id: 'en-g3-l1-10', type: 'true_false', prompt: 'Глагол do/does для he/she — это «does».', correct: true },
]

const G4L1: TaskItem[] = [
  { id: 'en-g4-l1-01', type: 'multiple_choice', prompt: 'Past Simple от «go»', options: ['goed', 'went', 'gone', 'going'], correct: 'went' },
  { id: 'en-g4-l1-02', type: 'multiple_choice', prompt: 'Past Simple от «see»', options: ['seed', 'seen', 'saw', 'seeing'], correct: 'saw' },
  { id: 'en-g4-l1-03', type: 'text_input', prompt: 'Past Simple от «eat»', correct: 'ate', acceptable: ['Ate'] },
  { id: 'en-g4-l1-04', type: 'fill_blank', prompt: 'Yesterday I ___ a film.', before: 'Yesterday I', after: 'a film.', correct: 'watched', acceptable: ['Watched'] },
  { id: 'en-g4-l1-05', type: 'true_false', prompt: 'Was — это форма прошедшего времени для I/he/she/it.', correct: true },
  { id: 'en-g4-l1-06', type: 'match_pairs', prompt: 'Соедини глагол и Past Simple', pairs: [
    { left: 'go', right: 'went' },
    { left: 'see', right: 'saw' },
    { left: 'eat', right: 'ate' },
    { left: 'do', right: 'did' },
  ]},
  { id: 'en-g4-l1-07', type: 'multiple_choice', prompt: 'They ___ at school yesterday.', options: ['was', 'were', 'is', 'are'], correct: 'were' },
  { id: 'en-g4-l1-08', type: 'text_input', prompt: 'Past Simple от «have»', correct: 'had', acceptable: ['Had'] },
  { id: 'en-g4-l1-09', type: 'fill_blank', prompt: 'She ___ (be) tired.', before: 'She', after: 'tired.', correct: 'was', acceptable: ['Was'] },
  { id: 'en-g4-l1-10', type: 'multiple_choice', prompt: 'Past Simple от «buy»', options: ['buyed', 'bought', 'buy', 'buys'], correct: 'bought' },
]

const G5L1: TaskItem[] = [
  { id: 'en-g5-l1-01', type: 'multiple_choice', prompt: 'Present Continuous: I am ___', options: ['read', 'reads', 'reading', 'readed'], correct: 'reading' },
  { id: 'en-g5-l1-02', type: 'fill_blank', prompt: 'Look! She ___ (sing) now.', before: 'Look! She', after: 'now.', correct: 'is singing', acceptable: ['is singing.'] },
  { id: 'en-g5-l1-03', type: 'true_false', prompt: 'Present Continuous = to be + V-ing.', correct: true },
  { id: 'en-g5-l1-04', type: 'multiple_choice', prompt: 'Предлог: He lives ___ Moscow.', options: ['at', 'on', 'in', 'for'], correct: 'in' },
  { id: 'en-g5-l1-05', type: 'multiple_choice', prompt: 'Предлог: The book is ___ the table.', options: ['in', 'on', 'at', 'by'], correct: 'on' },
  { id: 'en-g5-l1-06', type: 'text_input', prompt: 'V-ing форма от «run»', correct: 'running', acceptable: ['Running'] },
  { id: 'en-g5-l1-07', type: 'match_pairs', prompt: 'Соедини предлог и значение', pairs: [
    { left: 'in', right: 'в' },
    { left: 'on', right: 'на' },
    { left: 'under', right: 'под' },
    { left: 'between', right: 'между' },
  ]},
  { id: 'en-g5-l1-08', type: 'fill_blank', prompt: 'They ___ (play) football right now.', before: 'They', after: 'football right now.', correct: 'are playing', acceptable: ['are playing.'] },
  { id: 'en-g5-l1-09', type: 'true_false', prompt: 'Always используется в Present Continuous постоянно.', correct: false },
  { id: 'en-g5-l1-10', type: 'multiple_choice', prompt: 'I usually ___ tea in the morning.', options: ['drink', 'am drinking', 'drinks', 'drinking'], correct: 'drink' },
]

const G6L1: TaskItem[] = [
  { id: 'en-g6-l1-01', type: 'multiple_choice', prompt: 'Present Perfect: I have ___ the book.', options: ['read', 'reading', 'reads', 'readed'], correct: 'read' },
  { id: 'en-g6-l1-02', type: 'fill_blank', prompt: 'She ___ (live) here for 5 years.', before: 'She', after: 'here for 5 years.', correct: 'has lived', acceptable: ['has lived.'] },
  { id: 'en-g6-l1-03', type: 'multiple_choice', prompt: 'Сравнительная: tall → ___', options: ['taller', 'tallest', 'more tall', 'most tall'], correct: 'taller' },
  { id: 'en-g6-l1-04', type: 'multiple_choice', prompt: 'Превосходная: good → the ___', options: ['gooder', 'goodest', 'better', 'best'], correct: 'best' },
  { id: 'en-g6-l1-05', type: 'true_false', prompt: 'Better — сравнительная степень от good.', correct: true },
  { id: 'en-g6-l1-06', type: 'text_input', prompt: 'Сравнительная от «big»', correct: 'bigger', acceptable: ['Bigger'] },
  { id: 'en-g6-l1-07', type: 'multiple_choice', prompt: 'Modal: You ___ smoke here. (запрет)', options: ['must', 'should', 'mustn\'t', 'can'], correct: 'mustn\'t' },
  { id: 'en-g6-l1-08', type: 'match_pairs', prompt: 'Сравнительная степень', pairs: [
    { left: 'good', right: 'better' },
    { left: 'bad', right: 'worse' },
    { left: 'far', right: 'further' },
    { left: 'little', right: 'less' },
  ]},
  { id: 'en-g6-l1-09', type: 'fill_blank', prompt: 'I ___ already finished my homework.', before: 'I', after: 'already finished my homework.', correct: 'have', acceptable: ['Have', 'have'] },
  { id: 'en-g6-l1-10', type: 'true_false', prompt: '«More beautiful» — правильная сравнительная степень.', correct: true },
]

const G7L1: TaskItem[] = [
  { id: 'en-g7-l1-01', type: 'multiple_choice', prompt: 'Passive: The book ___ by John.', options: ['wrote', 'was written', 'writing', 'is wrote'], correct: 'was written' },
  { id: 'en-g7-l1-02', type: 'fill_blank', prompt: 'The cake ___ (eat) by them.', before: 'The cake', after: 'by them.', correct: 'was eaten', acceptable: ['was eaten.'] },
  { id: 'en-g7-l1-03', type: 'multiple_choice', prompt: 'Conditional 1: If it ___, I will stay home.', options: ['rain', 'rains', 'will rain', 'rained'], correct: 'rains' },
  { id: 'en-g7-l1-04', type: 'multiple_choice', prompt: 'Conditional 2: If I ___ rich, I would travel.', options: ['am', 'was', 'were', 'be'], correct: 'were' },
  { id: 'en-g7-l1-05', type: 'true_false', prompt: 'Reported speech: He said he was tired — правильно.', correct: true },
  { id: 'en-g7-l1-06', type: 'text_input', prompt: 'Past Participle от «write»', correct: 'written', acceptable: ['Written'] },
  { id: 'en-g7-l1-07', type: 'match_pairs', prompt: 'Соедини активное и пассивное', pairs: [
    { left: 'They build', right: 'is built' },
    { left: 'They built', right: 'was built' },
    { left: 'They will build', right: 'will be built' },
    { left: 'They are building', right: 'is being built' },
  ]},
  { id: 'en-g7-l1-08', type: 'fill_blank', prompt: 'If I ___ you, I would say sorry.', before: 'If I', after: 'you, I would say sorry.', correct: 'were', acceptable: ['Were', 'was'] },
  { id: 'en-g7-l1-09', type: 'multiple_choice', prompt: 'Reported: She said «I am tired» → She said she ___ tired.', options: ['is', 'was', 'am', 'were'], correct: 'was' },
  { id: 'en-g7-l1-10', type: 'true_false', prompt: 'В пассиве используется глагол «to be» + Past Participle.', correct: true },
]

// Pool of unique levels per grade. Cycled deterministically by level, then
// items + multiple-choice options shuffled by a level seed so subsequent
// passes feel different even when content is reused.
const GRADE_POOLS: TaskItem[][][] = [
  [G1L1, G1L2], // grade 1
  [G2L1],       // grade 2
  [G3L1],       // grade 3
  [G4L1],       // grade 4
  [G5L1],       // grade 5
  [G6L1],       // grade 6
  [G7L1],       // grade 7
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
 * Returns 10 TaskItems for the given English (grade, level).
 * grade: 1-7, level: 1-10. Items and multiple-choice options are shuffled
 * deterministically per (grade, level) so each level feels distinct.
 */
export function getLevel(grade: number, level: number): TaskItem[] {
  const g = Math.max(1, Math.min(7, Math.round(grade)))
  const lvl = Math.max(1, Math.min(10, Math.round(level)))
  const pool = GRADE_POOLS[g - 1] ?? GRADE_POOLS[0]!
  const base = pool[(lvl - 1) % pool.length] ?? pool[0] ?? LEVEL_1_ITEMS

  const rng = mulberry32(g * 10_000 + lvl * 100 + 13)
  const shuffled = shuffle(base, rng)
  return shuffled.map((item, idx) => {
    const withLevelId = { ...item, id: `${item.id}-srv-${lvl}-${idx}` } as TaskItem
    if (withLevelId.type === 'multiple_choice') {
      return { ...withLevelId, options: shuffle(withLevelId.options, rng) }
    }
    return withLevelId
  })
}
