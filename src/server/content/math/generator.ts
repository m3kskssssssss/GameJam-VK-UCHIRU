// Deterministic procedural math task generator. Same (grade, level) always
// produces the same 10 tasks, so a child gets a stable session and the server
// can re-derive correct answers without storing them.

import type { TaskItem } from '../types'

// Mulberry32 — small, fast, deterministic PRNG.
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

function intIn(rng: () => number, lo: number, hi: number): number {
  return Math.floor(rng() * (hi - lo + 1)) + lo
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function uniqueOptions(correct: string, distractorPool: string[], count: number, rng: () => number): string[] {
  const opts = new Set<string>([correct])
  const pool = shuffle(distractorPool.filter((d) => d !== correct), rng)
  for (const d of pool) {
    if (opts.size >= count) break
    opts.add(d)
  }
  return shuffle([...opts], rng)
}

// ---------------------------------------------------------------------------
// Per-grade question builders
// ---------------------------------------------------------------------------

function genGrade1(rng: () => number, idx: number): TaskItem {
  // Addition / subtraction within 20.
  const variant = idx % 4
  if (variant === 0) {
    const a = intIn(rng, 1, 10)
    const b = intIn(rng, 1, 10)
    const sum = a + b
    return {
      id: `math-g1-mc-${idx}`,
      type: 'multiple_choice',
      prompt: `${a} + ${b} = ?`,
      options: uniqueOptions(
        String(sum),
        [String(sum - 1), String(sum + 1), String(sum + 2), String(sum - 2), String(sum + 3)],
        4,
        rng,
      ),
      correct: String(sum),
    }
  }
  if (variant === 1) {
    const a = intIn(rng, 5, 20)
    const b = intIn(rng, 1, a - 1)
    const diff = a - b
    return {
      id: `math-g1-mc-${idx}`,
      type: 'multiple_choice',
      prompt: `${a} − ${b} = ?`,
      options: uniqueOptions(
        String(diff),
        [String(diff + 1), String(diff - 1), String(diff + 2)],
        4,
        rng,
      ),
      correct: String(diff),
    }
  }
  if (variant === 2) {
    const a = intIn(rng, 1, 10)
    const b = intIn(rng, 1, 10)
    const guess = a + b + (rng() < 0.5 ? 0 : intIn(rng, -2, 2))
    return {
      id: `math-g1-tf-${idx}`,
      type: 'true_false',
      prompt: `${a} + ${b} = ${guess}`,
      correct: guess === a + b,
    }
  }
  // text_input
  const a = intIn(rng, 1, 9)
  const b = intIn(rng, 1, 9)
  return {
    id: `math-g1-ti-${idx}`,
    type: 'text_input',
    prompt: `Сколько будет ${a} + ${b}?`,
    correct: String(a + b),
    inputMode: 'numeric',
  }
}

function genGrade2(rng: () => number, idx: number): TaskItem {
  // +/- within 100.
  const variant = idx % 4
  if (variant === 0) {
    const a = intIn(rng, 10, 99)
    const b = intIn(rng, 10, 99 - a > 0 ? 99 - a : 1)
    const sum = a + b
    return {
      id: `math-g2-mc-${idx}`,
      type: 'multiple_choice',
      prompt: `${a} + ${b} = ?`,
      options: uniqueOptions(
        String(sum),
        [String(sum + 10), String(sum - 10), String(sum + 1), String(sum - 1)],
        4,
        rng,
      ),
      correct: String(sum),
    }
  }
  if (variant === 1) {
    const a = intIn(rng, 30, 99)
    const b = intIn(rng, 1, a)
    return {
      id: `math-g2-ti-${idx}`,
      type: 'text_input',
      prompt: `${a} − ${b} = ?`,
      correct: String(a - b),
      inputMode: 'numeric',
    }
  }
  if (variant === 2) {
    const a = intIn(rng, 10, 50)
    const b = intIn(rng, 1, 50)
    const stated = a + b + (rng() < 0.5 ? 0 : intIn(rng, -3, 3))
    return {
      id: `math-g2-tf-${idx}`,
      type: 'true_false',
      prompt: `${a} + ${b} = ${stated}`,
      correct: stated === a + b,
    }
  }
  const a = intIn(rng, 20, 99)
  const b = intIn(rng, 5, a - 1)
  return {
    id: `math-g2-mc-${idx}`,
    type: 'multiple_choice',
    prompt: `${a} − ${b} = ?`,
    options: uniqueOptions(
      String(a - b),
      [String(a - b + 5), String(a - b - 5), String(a - b + 1)],
      4,
      rng,
    ),
    correct: String(a - b),
  }
}

function genGrade3(rng: () => number, idx: number): TaskItem {
  // Multiplication tables, division.
  const variant = idx % 4
  if (variant === 0) {
    const a = intIn(rng, 2, 9)
    const b = intIn(rng, 2, 9)
    return {
      id: `math-g3-mc-${idx}`,
      type: 'multiple_choice',
      prompt: `${a} × ${b} = ?`,
      options: uniqueOptions(
        String(a * b),
        [String(a * b + a), String(a * b - b), String(a * b + 1), String(a * b - 1)],
        4,
        rng,
      ),
      correct: String(a * b),
    }
  }
  if (variant === 1) {
    const b = intIn(rng, 2, 9)
    const q = intIn(rng, 2, 9)
    const a = b * q
    return {
      id: `math-g3-ti-${idx}`,
      type: 'text_input',
      prompt: `${a} : ${b} = ?`,
      correct: String(q),
      inputMode: 'numeric',
    }
  }
  if (variant === 2) {
    const a = intIn(rng, 2, 9)
    const b = intIn(rng, 2, 9)
    const stated = a * b + (rng() < 0.5 ? 0 : intIn(rng, -5, 5))
    return {
      id: `math-g3-tf-${idx}`,
      type: 'true_false',
      prompt: `${a} × ${b} = ${stated}`,
      correct: stated === a * b,
    }
  }
  const a = intIn(rng, 20, 50)
  const b = intIn(rng, 2, 9)
  const q = Math.floor(a / b)
  const r = a - q * b
  return {
    id: `math-g3-ti-${idx}`,
    type: 'text_input',
    prompt: `Найди частное: ${a} : ${b} (целая часть)`,
    correct: String(q),
    acceptable: r === 0 ? [] : [String(q + 1)],
    inputMode: 'numeric',
  }
}

function genGrade4(rng: () => number, idx: number): TaskItem {
  // Two-digit multiplication, simple fractions.
  const variant = idx % 4
  if (variant === 0) {
    const a = intIn(rng, 11, 25)
    const b = intIn(rng, 2, 9)
    return {
      id: `math-g4-mc-${idx}`,
      type: 'multiple_choice',
      prompt: `${a} × ${b} = ?`,
      options: uniqueOptions(
        String(a * b),
        [String(a * b + 10), String(a * b - 10), String(a * b + b)],
        4,
        rng,
      ),
      correct: String(a * b),
    }
  }
  if (variant === 1) {
    return {
      id: `math-g4-mp-${idx}`,
      type: 'match_pairs',
      prompt: 'Соотнеси дробь и её название',
      pairs: shuffle(
        [
          { left: '1/2', right: 'половина' },
          { left: '1/3', right: 'треть' },
          { left: '1/4', right: 'четверть' },
          { left: '1/10', right: 'десятая' },
        ],
        rng,
      ),
    }
  }
  if (variant === 2) {
    const a = intIn(rng, 100, 999)
    const b = intIn(rng, 2, 9)
    return {
      id: `math-g4-ti-${idx}`,
      type: 'text_input',
      prompt: `${a} : ${b} (округли вниз)`,
      correct: String(Math.floor(a / b)),
      inputMode: 'numeric',
    }
  }
  const den = pickFrom([2, 3, 4, 5, 6, 8, 10], rng)
  const num1 = intIn(rng, 1, den - 1)
  const num2 = intIn(rng, 1, den - num1)
  return {
    id: `math-g4-ti-${idx}`,
    type: 'text_input',
    prompt: `${num1}/${den} + ${num2}/${den} = ?/${den}`,
    correct: String(num1 + num2),
    inputMode: 'numeric',
  }
}

function genGrade5(rng: () => number, idx: number): TaskItem {
  // Fractions, decimals, percent basics.
  const variant = idx % 4
  if (variant === 0) {
    const den = pickFrom([4, 5, 8, 10], rng)
    const a = intIn(rng, 1, den - 1)
    const b = intIn(rng, 1, den - a)
    return {
      id: `math-g5-mc-${idx}`,
      type: 'multiple_choice',
      prompt: `${a}/${den} + ${b}/${den} = ?`,
      options: uniqueOptions(
        `${a + b}/${den}`,
        [`${a + b + 1}/${den}`, `${a + b}/${den * 2}`, `${a}/${den}`],
        4,
        rng,
      ),
      correct: `${a + b}/${den}`,
    }
  }
  if (variant === 1) {
    const total = pickFrom([20, 50, 100, 200], rng)
    const pct = pickFrom([10, 25, 50, 75], rng)
    return {
      id: `math-g5-ti-${idx}`,
      type: 'text_input',
      prompt: `Сколько ${pct}% от ${total}?`,
      correct: String((total * pct) / 100),
      inputMode: 'numeric',
    }
  }
  if (variant === 2) {
    const a = intIn(rng, 10, 99) / 10
    const b = intIn(rng, 10, 99) / 10
    return {
      id: `math-g5-ti-${idx}`,
      type: 'text_input',
      prompt: `${a.toFixed(1)} + ${b.toFixed(1)} = ? (десятичная)`,
      correct: (a + b).toFixed(1),
      inputMode: 'numeric',
    }
  }
  const den = pickFrom([3, 5, 7, 9], rng)
  const a = intIn(rng, 1, den)
  const b = intIn(rng, 1, den)
  return {
    id: `math-g5-tf-${idx}`,
    type: 'true_false',
    prompt: `Утверждение: ${a}/${den} + ${b}/${den} = ${a + b}/${den}`,
    correct: true,
  }
}

function genGrade6(rng: () => number, idx: number): TaskItem {
  // Linear equations, negatives.
  const variant = idx % 4
  if (variant === 0) {
    const x = intIn(rng, -10, 10)
    const a = intIn(rng, 2, 9)
    const b = intIn(rng, -10, 10)
    return {
      id: `math-g6-ti-${idx}`,
      type: 'text_input',
      prompt: `Реши уравнение: ${a}x + ${b} = ${a * x + b}. x = ?`,
      correct: String(x),
      inputMode: 'numeric',
    }
  }
  if (variant === 1) {
    const a = intIn(rng, -20, 20)
    const b = intIn(rng, -20, 20)
    return {
      id: `math-g6-mc-${idx}`,
      type: 'multiple_choice',
      prompt: `${a} + (${b}) = ?`,
      options: uniqueOptions(
        String(a + b),
        [String(a - b), String(-(a + b)), String(a + b + 1)],
        4,
        rng,
      ),
      correct: String(a + b),
    }
  }
  if (variant === 2) {
    const a = intIn(rng, 10, 50)
    const b = intIn(rng, 1, 9)
    return {
      id: `math-g6-ti-${idx}`,
      type: 'text_input',
      prompt: `НОД(${a}, ${b}) = ?`,
      correct: String(gcd(a, b)),
      inputMode: 'numeric',
    }
  }
  const a = intIn(rng, -10, -1)
  const b = intIn(rng, 1, 10)
  return {
    id: `math-g6-tf-${idx}`,
    type: 'true_false',
    prompt: `${a} × ${b} — отрицательное число?`,
    correct: true,
  }
}

function genGrade7(rng: () => number, idx: number): TaskItem {
  // Powers, basic algebra.
  const variant = idx % 4
  if (variant === 0) {
    const a = intIn(rng, 2, 9)
    const n = intIn(rng, 2, 4)
    return {
      id: `math-g7-mc-${idx}`,
      type: 'multiple_choice',
      prompt: `${a}^${n} = ?`,
      options: uniqueOptions(
        String(Math.pow(a, n)),
        [String(a * n), String(Math.pow(a, n) + a), String(Math.pow(a, n - 1))],
        4,
        rng,
      ),
      correct: String(Math.pow(a, n)),
    }
  }
  if (variant === 1) {
    const r1 = intIn(rng, -5, 5)
    const r2 = intIn(rng, -5, 5)
    // (x - r1)(x - r2) = x² - (r1+r2)x + r1*r2
    const b = -(r1 + r2)
    const c = r1 * r2
    return {
      id: `math-g7-ti-${idx}`,
      type: 'text_input',
      prompt: `Один из корней x² + (${b})x + ${c} = 0. Введи любой.`,
      correct: String(r1),
      acceptable: [String(r2)],
      inputMode: 'numeric',
    }
  }
  if (variant === 2) {
    const a = intIn(rng, 2, 9)
    return {
      id: `math-g7-ti-${idx}`,
      type: 'text_input',
      prompt: `√${a * a} = ?`,
      correct: String(a),
      inputMode: 'numeric',
    }
  }
  const a = intIn(rng, 2, 5)
  const stated = Math.pow(a, 2) + (rng() < 0.5 ? 0 : intIn(rng, -3, 3))
  return {
    id: `math-g7-tf-${idx}`,
    type: 'true_false',
    prompt: `${a}² = ${stated}`,
    correct: stated === a * a,
  }
}

function gcd(a: number, b: number): number {
  a = Math.abs(a)
  b = Math.abs(b)
  while (b) {
    ;[a, b] = [b, a % b]
  }
  return a
}

function pickFrom<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)]
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

const GENERATORS: Record<number, (rng: () => number, idx: number) => TaskItem> = {
  1: genGrade1,
  2: genGrade2,
  3: genGrade3,
  4: genGrade4,
  5: genGrade5,
  6: genGrade6,
  7: genGrade7,
}

const ITEMS_PER_LEVEL = 10

export function generateMathLevel(grade: number, level: number): TaskItem[] {
  const g = Math.max(1, Math.min(7, Math.round(grade)))
  const lvl = Math.max(1, Math.min(20, Math.round(level)))
  const seed = g * 10_000 + lvl * 100 + 7
  const rng = mulberry32(seed)
  const gen = GENERATORS[g]
  const items: TaskItem[] = []
  for (let i = 0; i < ITEMS_PER_LEVEL; i++) {
    const item = gen(rng, i)
    // Make IDs unique across grades + levels.
    items.push({ ...item, id: `${item.id}-l${lvl}` } as TaskItem)
  }
  return items
}
