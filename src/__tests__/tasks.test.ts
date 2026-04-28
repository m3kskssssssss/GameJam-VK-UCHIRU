/**
 * Unit tests for src/server/actions/tasks.ts — JWT round-trip and grading logic.
 *
 * Strategy: mock only the two external dependencies (prisma + requireChild).
 * The JWT signing/verifying and grade arithmetic are tested against real logic.
 *
 * AUTH_SECRET is set in-process so jose can sign tokens without any env file.
 */

import { describe, it, expect, vi, beforeAll } from 'vitest'

// ---------------------------------------------------------------------------
// Env must be set before the module under test is imported
// ---------------------------------------------------------------------------
beforeAll(() => {
  process.env.AUTH_SECRET = 'test-secret-at-least-32-chars-long!!'
})

// ---------------------------------------------------------------------------
// Fixed child ID used across tests
// ---------------------------------------------------------------------------
const CHILD_ID = 'child-unit-test-id'

// ---------------------------------------------------------------------------
// Mock: requireChild — inline factory avoids top-level variable hoisting issue
// ---------------------------------------------------------------------------
vi.mock('@/server/auth/guards', () => ({
  requireChild: vi.fn().mockResolvedValue({
    id: 'child-unit-test-id',
    displayName: 'TestKid',
    parentId: 'parent-id',
  }),
}))

// ---------------------------------------------------------------------------
// Mock: prisma — inline factory avoids hoisting issue with top-level vi.fn() vars
// The mock transaction client must expose every table touched by progress.ts
// (tx.child.findUnique is called by addEnergy inside $transaction).
// ---------------------------------------------------------------------------
vi.mock('@/lib/db', () => ({
  prisma: {
    $transaction: vi.fn().mockImplementation((fn: (tx: unknown) => unknown) =>
      fn({
        taskAttempt: {
          create: vi.fn().mockResolvedValue({}),
        },
        subjectProgress: {
          findUnique: vi.fn().mockResolvedValue(null),
          upsert: vi.fn().mockResolvedValue({}),
        },
        child: {
          findUnique: vi.fn().mockResolvedValue({ energy: 50 }),
          update: vi.fn().mockResolvedValue({}),
        },
      })
    ),
    child: {
      update: vi.fn().mockResolvedValue({}),
    },
    subjectProgress: {
      findMany: vi.fn().mockResolvedValue([]),
    },
  },
}))

// ---------------------------------------------------------------------------
// Import module under test (AFTER mocks are declared)
// ---------------------------------------------------------------------------
import { startTask, submitTask } from '@/server/actions/tasks'
import { loadLevel } from '@/server/content'

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('startTask', () => {
  it('returns a sessionToken and items without correct answers', async () => {
    const bundle = await startTask({ subject: 'MATH', level: 1 })

    expect(typeof bundle.sessionToken).toBe('string')
    expect(bundle.sessionToken.split('.').length).toBe(3) // JWT: header.payload.sig

    expect(Array.isArray(bundle.items)).toBe(true)
    expect(bundle.items.length).toBe(10)

    // No item should expose the 'correct' field to the client
    for (const item of bundle.items) {
      expect((item as Record<string, unknown>).correct).toBeUndefined()
    }
  })

  it('throws INVALID_INPUT for out-of-range level', async () => {
    await expect(startTask({ subject: 'MATH', level: 0 })).rejects.toThrow('INVALID_INPUT')
    await expect(startTask({ subject: 'MATH', level: 25 })).rejects.toThrow('INVALID_INPUT')
  })

  it('throws for PE subject (loadLevel("PE") throws LEVEL_NOT_FOUND)', async () => {
    await expect(startTask({ subject: 'PE', level: 1 })).rejects.toThrow()
  })
})

describe('submitTask — grading', () => {
  it('grades a perfect run as passed with full rewards', async () => {
    const bundle = await startTask({ subject: 'MATH', level: 1 })

    // Produce correct answers from the source-of-truth content (not from the token)
    const items = loadLevel('MATH', 1)
    const answers = items.map((it) => ({ itemId: it.id, answer: it.correct }))

    const result = await submitTask({ sessionToken: bundle.sessionToken, answers })

    expect(result.passed).toBe(true)
    expect(result.correctCount).toBe(10)
    expect(result.totalCount).toBe(10)
    // Perfect bonus: MATH base 20c + 10 bonus = 30 coins
    expect(result.coinsEarned).toBe(30)
    expect(result.energyEarned).toBe(10)
    expect(result.xpEarned).toBe(50)
    // Level advances by 1 (from 1 to 2, since mock returns null for existing progress)
    expect(result.newLevel).toBe(2)
  })

  it('grades a run with 6 / 10 correct as failed (threshold is 7)', async () => {
    const bundle = await startTask({ subject: 'MATH', level: 1 })
    const items = loadLevel('MATH', 1)

    // Answer first 6 correctly, rest wrong
    const answers = items.map((it, idx) => ({
      itemId: it.id,
      answer: idx < 6 ? it.correct : 'wrong',
    }))

    const result = await submitTask({ sessionToken: bundle.sessionToken, answers })

    expect(result.passed).toBe(false)
    expect(result.correctCount).toBe(6)
    expect(result.coinsEarned).toBe(0)
    expect(result.energyEarned).toBe(0)
    expect(result.xpEarned).toBe(0)
  })

  it('grades a run with exactly 7 / 10 as passed (boundary)', async () => {
    const bundle = await startTask({ subject: 'MATH', level: 1 })
    const items = loadLevel('MATH', 1)

    const answers = items.map((it, idx) => ({
      itemId: it.id,
      answer: idx < 7 ? it.correct : 'wrong',
    }))

    const result = await submitTask({ sessionToken: bundle.sessionToken, answers })

    expect(result.passed).toBe(true)
    expect(result.correctCount).toBe(7)
    // Not perfect — no bonus coins; base MATH = 20
    expect(result.coinsEarned).toBe(20)
  })

  it('normalises whitespace and case in answer comparison', async () => {
    const bundle = await startTask({ subject: 'MATH', level: 1 })
    const items = loadLevel('MATH', 1)

    // Correct answers with extra spaces and uppercase
    const answers = items.map((it) => ({
      itemId: it.id,
      answer: `  ${it.correct.toUpperCase()}  `,
    }))

    const result = await submitTask({ sessionToken: bundle.sessionToken, answers })
    expect(result.correctCount).toBe(10)
  })

  it('rejects a tampered token', async () => {
    await expect(
      submitTask({
        sessionToken: 'bad.token.here',
        answers: [{ itemId: 'x', answer: 'y' }],
      })
    ).rejects.toThrow('INVALID_TOKEN')
  })

  it('rejects a token signed by a different secret', async () => {
    const { SignJWT } = await import('jose')
    const otherSecret = new TextEncoder().encode('different-secret-value-minimum-32!!')
    const fakeToken = await new SignJWT({
      childId: CHILD_ID,
      subject: 'MATH',
      level: 1,
      items: [{ id: 'x', correct: '1' }],
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('30m')
      .sign(otherSecret)

    await expect(
      submitTask({
        sessionToken: fakeToken,
        answers: [{ itemId: 'x', answer: '1' }],
      })
    ).rejects.toThrow('INVALID_TOKEN')
  })

  it('rejects when token childId does not match the session child', async () => {
    // startTask signed for CHILD_ID (mock returns CHILD_ID by default)
    const bundle = await startTask({ subject: 'MATH', level: 1 })
    const items = loadLevel('MATH', 1)
    const answers = items.map((it) => ({ itemId: it.id, answer: it.correct }))

    // Override requireChild to return a DIFFERENT child for the submitTask call
    const { requireChild } = await import('@/server/auth/guards')
    vi.mocked(requireChild).mockResolvedValueOnce({
      id: 'different-child-id',
      displayName: 'Other',
      parentId: 'p',
    })

    await expect(
      submitTask({ sessionToken: bundle.sessionToken, answers })
    ).rejects.toThrow('ACCESS_DENIED')

    // Restore default mock for subsequent tests
    vi.mocked(requireChild).mockResolvedValue({
      id: CHILD_ID,
      displayName: 'TestKid',
      parentId: 'parent-id',
    })
  })
})

describe('submitTask — READING and ENGLISH subjects', () => {
  it('grades READING level 1 with all correct answers as passed', async () => {
    const bundle = await startTask({ subject: 'READING', level: 1 })
    const items = loadLevel('READING', 1)

    const answers = items.map((it) => ({ itemId: it.id, answer: it.correct }))
    const result = await submitTask({ sessionToken: bundle.sessionToken, answers })

    expect(result.passed).toBe(true)
    expect(result.correctCount).toBe(items.length)
  })

  it('grades ENGLISH level 1 with all correct answers as passed', async () => {
    const bundle = await startTask({ subject: 'ENGLISH', level: 1 })
    const items = loadLevel('ENGLISH', 1)

    const answers = items.map((it) => ({ itemId: it.id, answer: it.correct }))
    const result = await submitTask({ sessionToken: bundle.sessionToken, answers })

    expect(result.passed).toBe(true)
    expect(result.correctCount).toBe(items.length)
  })
})
