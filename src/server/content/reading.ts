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

/**
 * Returns 10 TaskItems for the given reading level.
 * Level 1: Russian fairy-tale / nature text comprehension.
 * Levels 2–10: stubs (level-1 items with shifted IDs). Phase 5 will replace.
 */
export function getLevel(level: number): TaskItem[] {
  if (level < 1 || level > 10) {
    throw new Error('LEVEL_NOT_FOUND')
  }
  if (level === 1) return LEVEL_1_ITEMS

  return LEVEL_1_ITEMS.map((item) => ({
    ...item,
    id: `reading-${level}-${item.id.split('-').pop() ?? '00'}`,
  }))
}
