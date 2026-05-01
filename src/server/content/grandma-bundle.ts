// Grandma NPC — tasks and dialog graph.
// Grandma is warm and artistic: paintings, sketchbooks, plasticine.

import type { GrandparentBundle, GrandparentTask, DialogNode } from './grandparents-types'

const GRANDMA_TASKS: GrandparentTask[] = [
  {
    key: 'grandma_draw_sun',
    npc: 'grandma',
    category: 'draw',
    title: 'Нарисуй солнышко',
    npcDescription:
      'Возьми любой листочек и нарисуй большое яркое солнышко — с лучиками и улыбкой! Мой старый этюдник одобряет.',
    difficulty: 1,
    rewardCoins: 60,
    rewardEnergy: 50,
  },
  {
    key: 'grandma_draw_cat',
    npc: 'grandma',
    category: 'draw',
    title: 'Нарисуй кота',
    npcDescription:
      'А помнишь, у нас жил рыжий кот Апельсин? Нарисуй любого кота — пусть будет пушистый и с усами!',
    difficulty: 2,
    rewardCoins: 75,
    rewardEnergy: 60,
  },
  {
    key: 'grandma_draw_house',
    npc: 'grandma',
    category: 'draw',
    title: 'Нарисуй домик с садом',
    npcDescription:
      'Нарисуй домик, как у нас в деревне — с трубой, окошками и садиком вокруг. Яблоню можно тоже добавить!',
    difficulty: 2,
    rewardCoins: 75,
    rewardEnergy: 60,
  },
  {
    key: 'grandma_draw_portrait',
    npc: 'grandma',
    category: 'draw',
    title: 'Нарисуй автопортрет',
    npcDescription:
      'Встань перед зеркалом и попробуй нарисовать себя. Художники называют это автопортретом — это моё любимое упражнение!',
    difficulty: 3,
    rewardCoins: 90,
    rewardEnergy: 70,
  },
  {
    key: 'grandma_sculpt_apple',
    npc: 'grandma',
    category: 'sculpt',
    title: 'Слепи яблоко из пластилина',
    npcDescription:
      'Возьми красный или зелёный пластилин и слепи яблочко — можно с листиком сверху. Я в детстве часами лепила!',
    difficulty: 1,
    rewardCoins: 60,
    rewardEnergy: 50,
  },
  {
    key: 'grandma_sculpt_animal',
    npc: 'grandma',
    category: 'sculpt',
    title: 'Слепи любого зверька',
    npcDescription:
      'Придумай и слепи любого зверька: зайчика, мышку, медвежонка — кого захочешь. Пусть у него будет имя!',
    difficulty: 2,
    rewardCoins: 75,
    rewardEnergy: 60,
  },
]

function makeTaskIntroNode(task: GrandparentTask): DialogNode {
  return {
    id: `task_intro_${task.key}`,
    text: `${task.npcDescription} Хочешь попробовать?`,
    speakerLabel: 'Бабушка',
    emotionLeft: 'neutral',
    emotionRight: 'pointing',
    options: [
      {
        id: 'do_task',
        label: 'Приложить фото результата',
        action: 'open_task',
        taskKey: task.key,
      },
      {
        id: 'not_ready',
        label: 'Пока не готова',
        action: 'goto',
        next: 'task_decline',
      },
    ],
  }
}

const taskMenuOptions = GRANDMA_TASKS.map((t) => ({
  id: `menu_task_${t.key}`,
  label: t.title,
  action: 'goto' as const,
  next: `task_intro_${t.key}`,
}))

const GRANDMA_STATIC_NODES: Record<string, DialogNode> = {
  entry: {
    id: 'entry',
    text: 'Ой, внучек, кто к нам пришёл! Как же я рада тебя видеть — давненько не заходил, соскучилась!',
    speakerLabel: 'Бабушка',
    emotionLeft: 'hello',
    emotionRight: 'hello',
    options: [
      {
        id: 'greet',
        label: 'Привет!',
        action: 'goto',
        next: 'menu',
      },
    ],
  },

  menu: {
    id: 'menu',
    text: 'О чём поговорим, дружок?',
    speakerLabel: 'Бабушка',
    emotionLeft: 'neutral',
    emotionRight: 'pointing',
    options: [
      {
        id: 'chitchat',
        label: 'Как у тебя дела?',
        action: 'goto',
        next: 'chitchat',
      },
      {
        id: 'lore',
        label: 'Расскажи про своё прошлое',
        action: 'goto',
        next: 'lore_1',
      },
      ...taskMenuOptions,
      {
        id: 'leave',
        label: 'Мне пора, до встречи!',
        action: 'close',
      },
    ],
  },

  chitchat: {
    id: 'chitchat',
    text: 'Всё хорошо, внучек! Вчера достала старый этюдник с чердака — краски ещё не засохли, представь! Буду рисовать закат.',
    speakerLabel: 'Бабушка',
    emotionLeft: 'happy',
    emotionRight: 'happy',
    options: [
      {
        id: 'chitchat_back',
        label: 'Понятно!',
        action: 'goto',
        next: 'menu',
      },
    ],
  },

  lore_1: {
    id: 'lore_1',
    text: 'В молодости я училась в художественном училище. Мы рисовали акварелью, маслом, углём — всё подряд! Я даже выставлялась в городском музее.',
    speakerLabel: 'Бабушка',
    emotionLeft: 'neutral',
    emotionRight: 'happy',
    options: [
      {
        id: 'lore_more',
        label: 'А что ещё?',
        action: 'goto',
        next: 'lore_2',
      },
    ],
  },

  lore_2: {
    id: 'lore_2',
    text: 'Ещё я очень любила лепить из пластилина — дедушка до сих пор хранит маленького котика, которого я слепила пятьдесят лет назад. Вот как бывает!',
    speakerLabel: 'Бабушка',
    emotionLeft: 'happy',
    emotionRight: 'happy',
    options: [
      {
        id: 'lore_back',
        label: 'Здорово!',
        action: 'goto',
        next: 'menu',
      },
    ],
  },

  task_decline: {
    id: 'task_decline',
    text: 'Ничего страшного, внучек. Заходи, когда будешь готов — я никуда не тороплюсь.',
    speakerLabel: 'Бабушка',
    emotionLeft: 'neutral',
    emotionRight: 'neutral',
    options: [
      {
        id: 'decline_back',
        label: 'Хорошо',
        action: 'goto',
        next: 'menu',
      },
    ],
  },
}

const GRANDMA_TASK_INTRO_NODES: Record<string, DialogNode> = Object.fromEntries(
  GRANDMA_TASKS.map((t) => [`task_intro_${t.key}`, makeTaskIntroNode(t)])
)

export const GRANDMA_BUNDLE: GrandparentBundle = {
  tasks: GRANDMA_TASKS,
  nodes: {
    ...GRANDMA_STATIC_NODES,
    ...GRANDMA_TASK_INTRO_NODES,
  },
  entryNodeId: 'entry',
}
