// PE (Physical Education) content catalog.
// PE has no levels — each session picks one exercise from this list.
// Photos are taken at 10s and 60s automatically by the browser.

export type PEExercise = {
  key: string
  name: string
  illustration: string // path relative to /public
  instruction: string
}

export const PE_EXERCISES: PEExercise[] = [
  {
    key: 'squats',
    name: 'Приседания',
    illustration: '/images/pe/squats.png',
    instruction: 'Встань прямо, ноги на ширине плеч. Медленно приседай, держи спину ровно.',
  },
  {
    key: 'pushups',
    name: 'Отжимания от стены',
    illustration: '/images/pe/pushups.png',
    instruction: 'Встань лицом к стене, упрись ладонями. Сгибай и разгибай руки в локтях.',
  },
  {
    key: 'jumps',
    name: 'Прыжки на месте',
    illustration: '/images/pe/jumps.png',
    instruction: 'Прыгай на месте, отрываясь от пола двумя ногами. Приземляйся мягко.',
  },
  {
    key: 'runinplace',
    name: 'Бег на месте',
    illustration: '/images/pe/runinplace.png',
    instruction: 'Бегай на месте, высоко поднимая колени. Держи темп!',
  },
  {
    key: 'bends',
    name: 'Наклоны',
    illustration: '/images/pe/bends.png',
    instruction: 'Ноги на ширине плеч. Наклоняйся вперёд и в стороны, не сгибая коленей.',
  },
  {
    key: 'armcircles',
    name: 'Круговые движения руками',
    illustration: '/images/pe/armcircles.png',
    instruction: 'Разведи руки в стороны. Делай круговые движения вперёд, затем назад.',
  },
  {
    key: 'stretching',
    name: 'Потягивание',
    illustration: '/images/pe/stretching.png',
    instruction: 'Встань на носочки, потянись руками вверх как можно выше. Держи 3 секунды.',
  },
  {
    key: 'hops',
    name: 'Прыжки на одной ноге',
    illustration: '/images/pe/hops.png',
    instruction: 'Прыгай на правой ноге 10 раз, затем на левой 10 раз. Держи равновесие!',
  },
  {
    key: 'sidetwists',
    name: 'Повороты туловища',
    illustration: '/images/pe/sidetwists.png',
    instruction: 'Руки на поясе. Поворачивай туловище вправо и влево, не двигая ногами.',
  },
]

/** Find exercise by key; throws 'EXERCISE_NOT_FOUND' if missing. */
export function getPEExercise(key: string): PEExercise {
  const ex = PE_EXERCISES.find((e) => e.key === key)
  if (!ex) throw new Error('EXERCISE_NOT_FOUND')
  return ex
}
