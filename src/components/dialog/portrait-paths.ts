// Centralised helper for 2D portrait image paths.
// Files live in /public/emotions2d/ with flat naming: {prefix}{suffix}.png

export type Emotion = 'hello' | 'happy' | 'neutral' | 'pointing'
export type Speaker = 'boy' | 'girl' | 'grandma' | 'grandpa'

const SPEAKER_PREFIX: Record<Speaker, string> = {
  boy: 'boy',
  girl: 'girl',
  grandma: 'gma',
  grandpa: 'gpa',
}

const EMOTION_SUFFIX: Record<Emotion, string> = {
  hello: 'Hi',
  happy: 'Funny',
  neutral: 'Default',
  pointing: 'Pick',
}

export function portraitSrc(speaker: Speaker, emotion: Emotion): string {
  const prefix = SPEAKER_PREFIX[speaker]
  const suffix = EMOTION_SUFFIX[emotion]
  return `/emotions2d/${prefix}${suffix}.png`
}
