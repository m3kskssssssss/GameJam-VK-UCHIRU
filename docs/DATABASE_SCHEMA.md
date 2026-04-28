# Схема БД — Kid Quest

Драфт `prisma/schema.prisma`. `db-engineer` приведёт это в финальный синтаксис, добавит индексы, проверит каскады.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  PARENT
  CHILD
}

enum Subject {
  MATH
  READING
  ENGLISH
  PE
}

enum ItemCategory {
  FURNITURE
  OUTFIT_HAIR
  OUTFIT_TOP
  OUTFIT_BOTTOM
  PET
}

model Parent {
  id           String    @id @default(cuid())
  email        String    @unique
  passwordHash String
  displayName  String
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  children     Child[]
}

model Child {
  id           String    @id @default(cuid())
  username     String    @unique
  passwordHash String
  displayName  String
  parentId     String
  parent       Parent    @relation(fields: [parentId], references: [id], onDelete: Cascade)

  coins        Int       @default(0)
  energy       Int       @default(100)
  homeLevel    Int       @default(1)

  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  progress     SubjectProgress[]
  attempts     TaskAttempt[]
  peSessions   PESession[]
  inventory    InventoryItem[]
  rooms        Room[]
  appearance   CharacterAppearance?

  @@index([parentId])
}

model SubjectProgress {
  id        String   @id @default(cuid())
  childId   String
  subject   Subject
  level     Int      @default(1)   // текущий доступный
  completedLevels Int @default(0)   // сколько пройдено
  totalXp   Int      @default(0)
  child     Child    @relation(fields: [childId], references: [id], onDelete: Cascade)

  @@unique([childId, subject])
}

model TaskAttempt {
  id            String   @id @default(cuid())
  childId       String
  subject       Subject
  level         Int
  correctCount  Int
  totalCount    Int
  passed        Boolean
  coinsEarned   Int      @default(0)
  energyEarned  Int      @default(0)
  xpEarned      Int      @default(0)
  durationMs    Int      @default(0)
  createdAt     DateTime @default(now())
  child         Child    @relation(fields: [childId], references: [id], onDelete: Cascade)

  @@index([childId, subject, createdAt])
}

model PESession {
  id            String   @id @default(cuid())
  childId       String
  exerciseKey   String              // ключ из каталога ('squats', 'jumps', ...)
  exerciseName  String              // снапшот названия (если каталог поменяется)
  photo10sUrl   String?             // полный URL в Vercel Blob
  photo10sKey   String?             // ключ объекта (для удаления)
  photo60sUrl   String?
  photo60sKey   String?
  completed     Boolean  @default(false)
  coinsEarned   Int      @default(0)
  energyEarned  Int      @default(0)
  createdAt     DateTime @default(now())
  child         Child    @relation(fields: [childId], references: [id], onDelete: Cascade)

  @@index([childId, createdAt])
}

model Room {
  id        String   @id @default(cuid())
  childId   String
  index     Int                          // 0 = первая, 1 = вторая
  unlocked  Boolean  @default(false)
  child     Child    @relation(fields: [childId], references: [id], onDelete: Cascade)

  placements RoomPlacement[]

  @@unique([childId, index])
}

model RoomPlacement {
  id          String   @id @default(cuid())
  roomId      String
  itemId      String                     // ссылка на InventoryItem
  x           Int                        // координата в сетке
  y           Int
  rotation    Int      @default(0)
  room        Room     @relation(fields: [roomId], references: [id], onDelete: Cascade)
  item        InventoryItem @relation(fields: [itemId], references: [id], onDelete: Cascade)

  @@unique([itemId])  // один предмет — одно место
  @@index([roomId])
}

model InventoryItem {
  id         String   @id @default(cuid())
  childId    String
  catalogKey String                       // 'chair_red', 'lamp_classic', ...
  category   ItemCategory
  ownedAt    DateTime @default(now())
  child      Child    @relation(fields: [childId], references: [id], onDelete: Cascade)

  placement  RoomPlacement?

  @@index([childId, category])
}

model CharacterAppearance {
  id      String  @id @default(cuid())
  childId String  @unique
  hair    String  @default("hair_default")
  top     String  @default("top_default")
  bottom  String  @default("bottom_default")
  petKey  String?                            // если куплен питомец
  child   Child   @relation(fields: [childId], references: [id], onDelete: Cascade)
}
```

## Каталог (НЕ в БД)

Каталог мебели/одежды/питомцев и заданий — это статические TS-файлы в `src/server/content/` и `src/server/catalog/`. Это:
- проще для git diff
- не требует миграций
- быстрее для сидов

В БД хранятся только **ключи** (`catalogKey`, `exerciseKey`, `hair`, ...), которые соответствуют записям в каталоге.

## Сид

`prisma/seed.ts` создаёт:
- одного demo-родителя `demo@kidquest.local` / `parent123`
- двух demo-детей: `kid1` / `kid123`, `kid2` / `kid123`
- начальные `SubjectProgress` для каждого ребёнка на все 4 предмета (level=1, completed=0)
- начальную `Room` (index=0, unlocked=true) для каждого ребёнка
- начальную `CharacterAppearance` со значениями по умолчанию

Использовать только в dev. В прод-сборке — не запускать.
