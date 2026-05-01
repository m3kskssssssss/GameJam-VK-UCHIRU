// TEMPORARY — sample dialog nodes for Phase C UI testing.
// Phase D will replace this with the full grandparent dialog content.

import type { Emotion } from './portrait-paths'

export interface SampleOption {
  id: string
  label: string
  next: string // node id, or '__leave__' to navigate back to /play
}

export interface SampleNode {
  id: string
  text: string
  speakerLabel: string
  emotionLeft: Emotion
  emotionRight: Emotion
  options: SampleOption[]
}

export const SAMPLE_NODES: Record<string, SampleNode> = {
  entry: {
    id: 'entry',
    text: 'Ой, внучек! Как хорошо, что ты зашёл! Давно тебя не видела!',
    speakerLabel: 'Бабушка говорит',
    emotionLeft: 'hello',
    emotionRight: 'hello',
    options: [
      { id: 'ask_how', label: 'Как ты, бабуль?', next: 'how_are_you' },
      { id: 'go_tasks', label: 'Хочу помочь тебе!', next: 'menu' },
      { id: 'leave_entry', label: 'Уйти', next: '__leave__' },
    ],
  },

  how_are_you: {
    id: 'how_are_you',
    text: 'Всё хорошо, спасибо! Вот только надо кое-что сделать по дому... Не поможешь?',
    speakerLabel: 'Бабушка говорит',
    emotionLeft: 'happy',
    emotionRight: 'neutral',
    options: [
      { id: 'help_yes', label: 'Конечно помогу!', next: 'menu' },
      { id: 'help_no', label: 'Сегодня не смогу...', next: 'sad_branch' },
      { id: 'leave_how', label: 'Уйти', next: '__leave__' },
    ],
  },

  menu: {
    id: 'menu',
    text: 'Отлично! Выбирай, что тебе интереснее — посчитать, почитать или что-то по дому сделать?',
    speakerLabel: 'Бабушка говорит',
    emotionLeft: 'neutral',
    emotionRight: 'pointing',
    options: [
      { id: 'pick_math', label: 'Помогу с математикой!', next: 'happy_branch' },
      { id: 'pick_read', label: 'Почитаем вместе!', next: 'happy_branch' },
      { id: 'pick_not_now', label: 'Потом как-нибудь...', next: 'sad_branch' },
      { id: 'leave_menu', label: 'Уйти', next: '__leave__' },
    ],
  },

  happy_branch: {
    id: 'happy_branch',
    text: 'Вот умница! Я так рада! Ты у меня самый лучший внучек на свете!',
    speakerLabel: 'Бабушка говорит',
    emotionLeft: 'happy',
    emotionRight: 'happy',
    options: [
      { id: 'happy_back', label: 'Спасибо, бабуль! Ещё что-нибудь?', next: 'menu' },
      { id: 'happy_leave', label: 'Пора идти!', next: 'goodbye' },
    ],
  },

  sad_branch: {
    id: 'sad_branch',
    text: 'Ничего страшного, внучек. Приходи, когда будет время. Я никуда не тороплюсь.',
    speakerLabel: 'Бабушка говорит',
    emotionLeft: 'neutral',
    emotionRight: 'neutral',
    options: [
      { id: 'sad_change', label: 'Подожди, я передумал!', next: 'menu' },
      { id: 'sad_leave', label: 'До свидания!', next: 'goodbye' },
    ],
  },

  goodbye: {
    id: 'goodbye',
    text: 'Счастливо, внучек! Возвращайся скорее!',
    speakerLabel: 'Бабушка говорит',
    emotionLeft: 'hello',
    emotionRight: 'hello',
    options: [{ id: 'goodbye_leave', label: 'Пока!', next: '__leave__' }],
  },
}
