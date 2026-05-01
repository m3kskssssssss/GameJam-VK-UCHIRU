// Grandpa NPC — tasks and dialog graph.
// Grandpa is good-natured and engineering-minded: origami, blueprints, building things.

import type { GrandparentBundle, GrandparentTask, DialogNode } from './grandparents-types'

const GRANDPA_TASKS: GrandparentTask[] = [
  {
    key: 'grandpa_origami_boat',
    npc: 'grandpa',
    category: 'origami',
    title: 'Сложи кораблик-оригами',
    npcDescription:
      'Возьми листок бумаги и сложи кораблик — я в детстве пускал такие по ручью. Схему можно найти в интернете!',
    difficulty: 1,
    rewardCoins: 60,
    rewardEnergy: 50,
  },
  {
    key: 'grandpa_origami_plane',
    npc: 'grandpa',
    category: 'origami',
    title: 'Сложи самолётик',
    npcDescription:
      'Сложи бумажный самолётик и запусти его — посмотрим, далеко ли полетит! Главное — ровные сгибы.',
    difficulty: 1,
    rewardCoins: 60,
    rewardEnergy: 50,
  },
  {
    key: 'grandpa_origami_crane',
    npc: 'grandpa',
    category: 'origami',
    title: 'Сложи журавлика',
    npcDescription:
      'Журавлик — самое красивое оригами. Я складывал таких из газет на токарном заводе в обеденный перерыв. Попробуй!',
    difficulty: 3,
    rewardCoins: 90,
    rewardEnergy: 70,
  },
  {
    key: 'grandpa_friend_walk',
    npc: 'grandpa',
    category: 'real',
    title: 'Сделай фото с другом на прогулке',
    npcDescription:
      'Выйди погулять с другом и попроси кого-нибудь вас сфотографировать. Дружба — это самое важное в жизни!',
    difficulty: 2,
    rewardCoins: 75,
    rewardEnergy: 60,
  },
  {
    key: 'grandpa_build_car',
    npc: 'grandpa',
    category: 'real',
    title: 'Собери машинку из конструктора',
    npcDescription:
      'Возьми любой конструктор и собери машинку — можно свою придумать. Я в молодости чертил такие по схемам на кальке!',
    difficulty: 2,
    rewardCoins: 75,
    rewardEnergy: 60,
  },
  {
    key: 'grandpa_plant_tree',
    npc: 'grandpa',
    category: 'real',
    title: 'Посади дерево и сфотографируй',
    npcDescription:
      'Посади любое деревце или цветок на улице или в горшке и сфотографируй. Я сажал яблоню в детстве — она до сих пор растёт!',
    difficulty: 3,
    rewardCoins: 90,
    rewardEnergy: 70,
  },
]

function makeTaskIntroNode(task: GrandparentTask): DialogNode {
  return {
    id: `task_intro_${task.key}`,
    text: `${task.npcDescription} Хочешь попробовать?`,
    speakerLabel: 'Дедушка',
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
        label: 'Пока не готов',
        action: 'goto',
        next: 'task_decline',
      },
    ],
  }
}

const taskMenuOptions = GRANDPA_TASKS.map((t) => ({
  id: `menu_task_${t.key}`,
  label: t.title,
  action: 'goto' as const,
  next: `task_intro_${t.key}`,
}))

const GRANDPA_STATIC_NODES: Record<string, DialogNode> = {
  entry: {
    id: 'entry',
    text: 'Ого, внучек! Вот это гость! Заходи, не стесняйся — я как раз разбирал старые чертежи, вспоминал молодость.',
    speakerLabel: 'Дедушка',
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
    speakerLabel: 'Дедушка',
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
    text: 'Хорошо, дружок! Вчера сложил журавлика из газеты — руки ещё помнят! А завтра пойду проверять яблоню в саду.',
    speakerLabel: 'Дедушка',
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
    text: 'Я работал инженером на заводе тридцать лет. Мы проектировали станки — всё вручную, на кальке. Один чертёж мог занять неделю!',
    speakerLabel: 'Дедушка',
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
    text: 'А оригами я открыл случайно — коллега принёс книжку из Японии. С тех пор складывал фигурки в обеденный перерыв. Говорят, это успокаивает!',
    speakerLabel: 'Дедушка',
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
    text: 'Ничего страшного, внучек. Заходи, когда будешь готов — я буду здесь.',
    speakerLabel: 'Дедушка',
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

const GRANDPA_TASK_INTRO_NODES: Record<string, DialogNode> = Object.fromEntries(
  GRANDPA_TASKS.map((t) => [`task_intro_${t.key}`, makeTaskIntroNode(t)])
)

export const GRANDPA_BUNDLE: GrandparentBundle = {
  tasks: GRANDPA_TASKS,
  nodes: {
    ...GRANDPA_STATIC_NODES,
    ...GRANDPA_TASK_INTRO_NODES,
  },
  entryNodeId: 'entry',
}
