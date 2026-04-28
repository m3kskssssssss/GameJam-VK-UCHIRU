/**
 * prisma/seed.ts
 *
 * Dev-only seed. Creates a demo parent + two children with their initial
 * SubjectProgress, Room and CharacterAppearance rows.
 *
 * Idempotent: every write uses upsert so re-running does not duplicate data.
 * Keep this file under 5 seconds on a warm machine.
 */

import { PrismaClient, Subject } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const SUBJECTS: Subject[] = ['MATH', 'READING', 'ENGLISH', 'PE']

async function main(): Promise<void> {
  // -----------------------------------------------------------------------
  // Demo parent
  // -----------------------------------------------------------------------
  const parentPasswordHash = await bcrypt.hash('parent123', 10)

  const parent = await prisma.parent.upsert({
    where: { email: 'demo@kidquest.local' },
    update: {},
    create: {
      email: 'demo@kidquest.local',
      displayName: 'Demo Parent',
      passwordHash: parentPasswordHash,
    },
  })

  console.log(`Parent upserted: ${parent.email} (id: ${parent.id})`)

  // -----------------------------------------------------------------------
  // Demo children
  // -----------------------------------------------------------------------
  const childDefs = [
    { username: 'kid1', displayName: 'Малыш 1' },
    { username: 'kid2', displayName: 'Малыш 2' },
  ]

  const childPasswordHash = await bcrypt.hash('kid123', 10)

  for (const def of childDefs) {
    const child = await prisma.child.upsert({
      where: { username: def.username },
      update: {},
      create: {
        username: def.username,
        displayName: def.displayName,
        passwordHash: childPasswordHash,
        parentId: parent.id,
        coins: 0,
        energy: 100,
        homeLevel: 1,
      },
    })

    console.log(`  Child upserted: ${child.username} (id: ${child.id})`)

    // ---------------------------------------------------------------------
    // SubjectProgress — one row per subject
    // ---------------------------------------------------------------------
    for (const subject of SUBJECTS) {
      await prisma.subjectProgress.upsert({
        where: { childId_subject: { childId: child.id, subject } },
        update: {},
        create: {
          childId: child.id,
          subject,
          level: 1,
          completedLevels: 0,
          totalXp: 0,
        },
      })
    }

    console.log(`    SubjectProgress rows upserted for ${child.username}`)

    // ---------------------------------------------------------------------
    // Room — first room unlocked
    // ---------------------------------------------------------------------
    await prisma.room.upsert({
      where: { childId_index: { childId: child.id, index: 0 } },
      update: {},
      create: {
        childId: child.id,
        index: 0,
        unlocked: true,
      },
    })

    console.log(`    Room[0] upserted for ${child.username}`)

    // ---------------------------------------------------------------------
    // CharacterAppearance — defaults
    // ---------------------------------------------------------------------
    await prisma.characterAppearance.upsert({
      where: { childId: child.id },
      update: {},
      create: {
        childId: child.id,
        hair: 'hair_default',
        top: 'top_default',
        bottom: 'bottom_default',
        petKey: null,
      },
    })

    console.log(`    CharacterAppearance upserted for ${child.username}`)
  }

  console.log('\nSeed complete.')
}

main()
  .catch((err: unknown) => {
    console.error('Seed failed:', err)
    process.exit(1)
  })
  .finally(() => {
    void prisma.$disconnect()
  })
