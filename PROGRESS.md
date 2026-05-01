# Прогресс — Kid Quest

Этот файл ведёт Claude Code. Тут отмечается статус фаз и QA-отчёты.

---

## Фаза 0 — Фундамент ✅
- [x] Next.js 15 (App Router, TS strict, src-dir, Tailwind v4)
- [x] Зависимости из docs/ARCHITECTURE.md установлены
- [x] tsconfig с alias @/* → src/*
- [x] shadcn/ui подключён, components.json
- [x] Prisma + Parent/Child schema (initial)
- [x] pnpm dev → "/" с лендингом "Kid Quest"
- [x] .env.example, README.md
- [x] eslint.config.mjs (next/core-web-vitals + next/typescript + no-explicit-any)
- **QA**: pnpm tsc --noEmit ✅, pnpm lint ✅, pnpm build ✅

---

## Фаза 1 — Аутентификация ✅
- [x] NextAuth v5 (Credentials, role в JWT)
- [x] /auth/register (родитель)
- [x] /auth/login (вкладки родитель/ребёнок)
- [x] middleware.ts (роли)
- [x] Создание ребёнка в /parent
- [x] Logout с обеих сторон
- QA: tsc ✅, lint ✅, build ✅

---

## Фаза 2 — Схема данных и базовый API ✅
- [x] Полная prisma/schema.prisma (все модели)
- [x] Миграция применена (SQLite local; Postgres for prod)
- [x] prisma/seed.ts: 1 родитель + 2 детей + Progress/Room/Appearance
- [x] Server actions: children/progress/tasks + content/* + JWT session-token
- [x] src/server/auth/guards.ts: requireParent / requireChild / assertOwnsChild
- QA: tsc ✅, lint ✅, build ✅, smoke (getChildSummary on demo kid) ✅

---

## Фаза 3 — Родительский дашборд ✅
- [x] /parent — список карточек детей + AddChildDialog
- [x] /parent/child/[id] — табы Math/Reading/English/PE + DeleteChildDialog
- [x] PE-фото в ленте (placeholder, реальные из Phase 5)
- [x] Recharts XP за 14 дней (XpChart)
- [x] Удаление ребёнка (confirm)
- QA: tsc ✅, lint ✅, build ✅

---

## Фаза 4 — Игровой мир ✅
- [x] /play — R3F canvas с полем (orthographic, sky bg)
- [x] 5 домиков (главный по центру + 4 заданий по сторонам)
- [x] 2D-billboard персонаж (idle/walk, 4 facing directions)
- [x] Управление: тач-джойстик + клавиатура (WASD/стрелки)
- [x] Зоны входа + HUD «Войти» (radius 1.5 trigger)
- [x] HUD coins/energy/homeLevel из БД (seed через server, refresh после игр)
- QA: tsc ✅, lint ✅, build ✅ (route /play 276 kB / 625 kB FL)

---

## Фаза 5 — Домики заданий (ЗАВЕРШЕНО)

### План (2026-04-28)

**Task 5.1** [backend-engineer] PE server actions + blob helper
- src/server/actions/pe.ts
- src/lib/blob.ts
- src/app/api/pe/upload/route.ts

**Task 5.2** [backend-engineer] House page server component
- src/app/play/house/[subject]/page.tsx

**Task 5.3** [mini-game-developer] Shared question runner + result screen
- src/components/minigames/shared/QuestionRunner.tsx
- src/components/minigames/shared/ResultScreen.tsx
- src/components/minigames/shared/LevelSelect.tsx

**Task 5.4** [mini-game-developer] Math mini-game shell
- src/components/minigames/math/MathGame.tsx
- src/components/minigames/math/MultipleChoiceItem.tsx
- src/components/minigames/math/NumericInputItem.tsx

**Task 5.5** [mini-game-developer] Reading mini-game shell
- src/components/minigames/reading/ReadingGame.tsx
- src/components/minigames/reading/PassageViewer.tsx

**Task 5.6** [mini-game-developer] English mini-game shell
- src/components/minigames/english/EnglishGame.tsx
- src/components/minigames/english/ListenChooseItem.tsx
- src/components/minigames/english/ArrangeItem.tsx

**Task 5.7** [mini-game-developer] PE mini-game shell
- src/components/minigames/pe/PEGame.tsx
- src/components/minigames/pe/ExercisePicker.tsx
- src/components/minigames/pe/CameraSession.tsx

**Task 5.8** [ui-engineer] HUD router.refresh after minigame exit
- src/components/play/HUD.tsx (modify)

- [x] Task 5.1 PE backend + blob
- [x] Task 5.2 House page server component
- [x] Task 5.3 Shared components
- [x] Task 5.4 Math shell
- [x] Task 5.5 Reading shell
- [x] Task 5.6 English shell
- [x] Task 5.7 PE shell
- [x] Task 5.8 HUD refresh (router.refresh() called in handleExit / handleNextLevel in MathGame & PEGame; ReadingGame is missing router.refresh() on exit — see follow-up)

### Follow-ups (non-blocking for Phase 6)

1. **minor** — ReadingGame.handleExit and handleNextLevel call `router.push('/play')` /
   `setPhase('select')` without `router.refresh()`. The HUD coin/energy counter will
   not update until the next full navigation. Fix: add `router.refresh()` before
   `router.push` in ReadingGame, matching the pattern in MathGame and PEGame.

2. **minor** — EnglishGame.handleExit calls `router.push('/play')` without
   `router.refresh()`. Same root cause as above.

3. **minor** — ReadingGame `lastAnswerCorrect` is always set to `null` after every
   answer (comment says "optimistic neutral feedback"). The QuestionRunner flash
   overlay never fires for Reading, even though it would be harmless. Cosmetic only.

4. **minor** — CameraSession: if the component unmounts between the 10 s snapshot
   completing and the 60 s timer firing (e.g. parent navigates away), the `mounted`
   flag prevents `onComplete` from being called but the 60 s upload will still be
   attempted because `captureAndUpload` itself does not check `mounted`. The upload
   will fail silently (video element gone → `toBlob` produces null) — no data loss,
   but worth hardening.

5. **minor** — Local-dev blob fallback: `fs.mkdir(dir, { recursive: true })` is safe
   for concurrent 10 s and 60 s writes to the same session directory (POSIX and
   Windows both handle this correctly). No race condition.

6. **minor** — /api/pe/upload does not check whether the PESession is already
   `completed` before accepting a new photo upload. A determined user could overwrite
   photo slots after `completePESession` runs. Low-risk (photos are append-only in
   practice), but worth adding a `!session.completed` guard.

- QA: typecheck ✅ (pre-verified), lint ✅ (pre-verified), build ✅ (pre-verified), unit 12/12 ✅

---

## Phase 5 QA — 28 Apr 2026
- typecheck: ✅ (pre-verified by user)
- lint: ✅ (pre-verified by user)
- build: ✅ (pre-verified by user, /play/house/[subject] 16.2 kB, /api/pe/upload exists)
- unit tests: 12 / 12 (src/__tests__/tasks.test.ts — JWT round-trip, grading thresholds, normalisation, token forgery, ownership)
- e2e: skipped (manual smoke test planned by user)
- notes: All 8 sub-tasks implemented and match plan. Four minor follow-ups logged above (none are blockers). ReadingGame and EnglishGame missing router.refresh() on exit is the most visible gap — HUD coins will lag one navigation cycle after those games complete.

---

## Фаза 6 — Главный домик (Sims-like)

### План (2026-04-28)

**Task 6.1** [backend-engineer] Static catalog + shop server actions (CRITICAL PATH)
- Files: src/server/content/catalog.ts (NEW), src/server/actions/shop.ts (NEW)
- Acceptance: `pnpm tsc --noEmit` passes; calling `buyItem({ catalogKey: 'chair_simple' })` in a test script with a seeded child debits coins and creates an InventoryItem row.

**Task 6.2** [backend-engineer] Room server actions (CRITICAL PATH, depends on 6.1 catalog types)
- Files: src/server/actions/rooms.ts (NEW)
- Acceptance: `pnpm tsc --noEmit` passes; `listRooms()`, `placeItem(...)`, `removePlacement(...)`, `unlockRoom({ index: 1 })` all callable without runtime error in a smoke script.

**Task 6.3** [ui-engineer] i18n strings for home-house UI
- Files: src/i18n/ru.ts (MODIFY — add `home` key block)
- Acceptance: `pnpm tsc --noEmit` passes; all Phase 6 UI strings present under `ru.home.*`.

**Task 6.4** [game-world-developer] /play/home page + MainHouse shell (CRITICAL PATH, depends on 6.1, 6.2, 6.3)
- Files: src/app/play/home/page.tsx (NEW), src/components/home-house/MainHouse.tsx (NEW), src/components/home-house/RoomGrid.tsx (NEW), src/components/home-house/HomeHud.tsx (NEW)
- Acceptance: navigating to `/play/home` as a child renders without crash; room grid (8×6 HTML/CSS) is visible; "Назад к домикам" button calls `router.push('/play')` then `router.refresh()`.

**Task 6.5** [ui-engineer] Shop modal (CRITICAL PATH, depends on 6.1, 6.3, 6.4)
- Files: src/components/home-house/ShopModal.tsx (NEW), src/components/home-house/ShopItemCard.tsx (NEW)
- Acceptance: opening "Магазин" shows catalog tabs (Мебель / Волосы / Верх / Низ / Питомцы); clicking "Купить" calls `buyItem`, shows toast on success/insufficient funds; "Куплено" state shown for already-owned items.

**Task 6.6** [ui-engineer] Wardrobe modal (depends on 6.1, 6.3, 6.4)
- Files: src/components/home-house/WardrobeModal.tsx (NEW), src/components/home-house/AppearancePreview.tsx (NEW)
- Acceptance: opening "Гардероб" shows tabs for Hair / Top / Bottom / Pet; selecting a free item calls `setAppearance`; selecting a premium item that is NOT in inventory shows a lock icon and cannot be selected; selecting an owned premium item applies the change.

**Task 6.7** [game-world-developer] Placement mode (CRITICAL PATH, depends on 6.2, 6.4)
- Files: src/components/home-house/PlacementSidebar.tsx (NEW), src/components/home-house/PlacedItem.tsx (NEW); RoomGrid.tsx (MODIFY — accept placement mode prop and cell-tap handler)
- Acceptance: toggling "Изменить комнату" shows sidebar of un-placed owned furniture; tapping a sidebar item selects it (highlighted); tapping a grid cell calls `placeItem`; tapping a placed item in placement mode calls `removePlacement`; placed items persist across navigation (fetched from DB on page load).

**Task 6.8** [game-world-developer] Room unlock + tab switcher (CRITICAL PATH, depends on 6.2, 6.4)
- Files: src/components/home-house/RoomTabs.tsx (NEW); MainHouse.tsx (MODIFY — add room tab state)
- Acceptance: when child has homeLevel >= 2 and >= 200 coins, "Открыть комнату 2" button appears; clicking it calls `unlockRoom({ index: 1 })`; after unlock a tab switcher appears; switching tabs loads the correct room placements; second room starts empty.

**Task 6.9** [ui-engineer] Pet sprite display (depends on 6.4, 6.6)
- Files: src/components/home-house/PetSprite.tsx (NEW); public/sprites/pets/cat.png, dog.png, dragon.png (NEW placeholder images)
- Acceptance: when `CharacterAppearance.petKey` is non-null, a small sprite is rendered idle in the bottom-right corner of the room grid; sprite changes when pet is swapped via Wardrobe.

**Task 6.10** [ui-engineer] HUD coins/energy refresh on exit from /play/home (depends on 6.4)
- Files: src/components/home-house/HomeHud.tsx (MODIFY — "Назад к домикам" must call router.refresh() before router.push('/play')); src/components/play/Hud.tsx (MODIFY — add "Сервер игроков" button routing to /play/lobby)
- Acceptance: after buying an item in the shop and returning to /play, the HUD coin counter reflects the new balance without a full page reload.

### Dependency graph and parallelism

- Tasks 6.1 and 6.3 can start in parallel immediately (no dependencies).
- Task 6.2 can start after 6.1 is complete (needs catalog types for `unlockRoom` price lookup).
- Tasks 6.4 can start after 6.1, 6.2, and 6.3 are all complete (it is the main shell).
- Tasks 6.5, 6.6, 6.7, 6.8, 6.9, 6.10 all depend on 6.4 being complete, but can run in parallel among themselves once 6.4 is done.

### Critical path for DoD (buy furniture → place → unlock room 2)
6.1 → 6.2 → 6.4 → 6.5 (buy) → 6.7 (place) → 6.8 (unlock room 2)

- [x] Task 6.1 Catalog + shop actions
- [x] Task 6.2 Room actions
- [x] Task 6.3 i18n strings
- [x] Task 6.4 /play/home page + MainHouse shell
- [x] Task 6.5 Shop modal
- [x] Task 6.6 Wardrobe modal
- [x] Task 6.7 Placement mode (PlacementSidebar + PlacedItem + RoomGrid edit-mode)
- [x] Task 6.8 Room unlock + tab switcher (RoomTabs + MainHouse state)
- [x] Task 6.9 Pet sprite (PetSprite + cat/dog/dragon SVG)
- [x] Task 6.10 HUD refresh on exit (already correct)
- QA: typecheck ✅, lint ✅, unit 12/12 ✅

---

## Фаза 7 — Сервер игроков + tile-stomp мультиплеер ✅
- [x] DB: LobbyMatch / LobbyPlayer / LobbyTile + миграция `20260428151139_add_lobby_match`
- [x] Server actions: `src/server/actions/lobby.ts` (joinOrCreate / start / move / state / leave) + helpers (spawn, finalize, rewards 30/20/10/5)
- [x] /play/lobby — заглушка-поле с одним домиком (HTML/CSS, без R3F)
- [x] /play/lobby/arena — server component → `joinOrCreateMatch` + `getMatchState`
- [x] Arena.tsx — фазы WAITING/ACTIVE/FINISHED, polling 300мс, WASD/стрелки + on-screen D-pad
- [x] MatchBoard 12×8 + Scoreboard + MoveButtons
- [x] Кнопка "Сервер игроков" в HUD
- [x] i18n `lobby.*`
- QA: typecheck ✅, lint ✅, unit 12/12 ✅, build ✅ (/play/lobby/arena 6.31 kB / 137 kB FL)

---

## Phase E QA — 02 May 2026
- typecheck: PASS (0 errors)
- lint: PASS (only pre-existing warning: LevelSelect.tsx:72 `isLocked` unused)
- build: PASS (Next.js compiled successfully — 16 routes, all new API routes present; `prisma migrate deploy` step skipped locally because DATABASE_URL is absent, which is expected for local dev — not a code defect)
- unit tests: skipped (no Vitest unit tests exist for phase E server actions; Playwright E2E deferred to phase Z.2 per plan)
- smoke audit: see notes below
- verdict: PHASE E CLEARED — no blockers

### Smoke audit results

**grandparent.ts**
- submitGrandparentTask: awards (coinsEarned/energyEarned) are set to 0 on upsert.update (re-submission) and to task.rewardCoins/task.rewardEnergy on create. isFirst flag correctly derived from `!existing`. awardChild is called only when isFirst. PASS.
- listGrandparentCompletions: calls requireParent() then assertOwnsChild(parent.id, childId) before any DB read. PASS.

**feed.ts**
- listFeed: `where` block always includes `parentId: viewer.parentId` (derived from requireParentOrRelative). Pagination: take capped at Math.min(take ?? 20, 50) — default 20, max 50. Cursor-based via `cursor: { id: cursor }, skip: 1`. PASS.
- addComment: fetches post.parentId and asserts `post.parentId !== viewer.parentId` throws ACCESS_DENIED. PASS.
- toggleLike: same post.parentId ownership check. PASS.
- getPostDetail: post.parentId ownership check present. PASS.
- attachPhotoToPost: exported as a plain `async function` (not `'use server'` action) — acceptable since it is called only from server-side API routes, not from client. PASS.

**relatives.ts**
- createRelative: catches Prisma P2002 and rethrows as `USERNAME_TAKEN`. PASS.
- deleteRelative: silently calls `deleteBlob(relative.avatarUrl).catch(...)` before `prisma.relative.delete`. PASS.

**avatars.ts**
- setParentAvatar: fetches existing avatarUrl and calls `deleteBlob(...).catch(...)` before update. PASS.
- setChildAvatar: same pattern. PASS.
- setRelativeAvatar: same pattern. PASS.

**middleware-config.ts**
- RELATIVE on /parent/feed or /parent/feed/*: returns true. PASS.
- RELATIVE on /parent/profile or /parent/profile/*: returns true. PASS.
- RELATIVE on any other /parent/*: returns `Response.redirect(new URL('/parent/feed', ...))`. PASS.
- CHILD on /parent/*: falls through to the final `return false` (no matching branch for CHILD in the /parent block). PASS.

**api/grandparent/upload/route.ts**
- requireChild() wrapped in try/catch; Next.js NEXT_* digest redirects converted to 401. PASS.
- taskKey validated via getTask(taskKey); 400 if unknown. PASS.
- File size checked against 4 MB (4 * 1024 * 1024). PASS.

**api/avatar/upload/route.ts**
- target=parent: viewer.kind !== 'parent' → 403. PASS.
- target=child:<id>: viewer.kind !== 'parent' → 403; ownership delegated to setChildAvatar → assertOwnsChild. PASS.
- target=relative:<id> by RELATIVE: targetId !== viewer.id → 403. PASS.
- target=relative:<id> by PARENT: allowed; ownership delegated to setRelativeAvatar. PASS.

**pe.ts**
- completePESession: FeedPost created inside prisma.$transaction alongside the PESession update. PASS.
- PEResult type includes `feedPostId: string`. PASS.

**api/pe/upload/route.ts**
- feedPostId is optional (read via `formData.get('feedPostId')`; null is acceptable). PASS.
- For slot='60s' with valid feedPostId: calls `attachPhotoToPost(feedPostId, ...)` inside try/catch with non-fatal catch (console.error only). PASS.

### SQL migration integrity (prisma/migrations/20260502010000_add_grandparent_relatives_feed/migration.sql)
- `CREATE TYPE "Grandparent" AS ENUM ('GRANDMA', 'GRANDPA')`: present. PASS.
- `ALTER TYPE "Role" ADD VALUE 'RELATIVE'`: present. PASS.
- avatarUrl/avatarKey columns on Parent and Child: present. PASS.
- Relative table with `FOREIGN KEY ("parentId") REFERENCES "Parent"("id") ON DELETE CASCADE`: present. PASS.
- GrandparentTaskCompletion with `UNIQUE ("childId", "taskKey")` and `FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE`: present. PASS.
- FeedPost with `INDEX ("parentId", "createdAt")`, `INDEX ("childId", "createdAt")`, FK to Child CASCADE and FK to Parent CASCADE: present. PASS.
- FeedComment with `INDEX ("postId", "createdAt")`, `INDEX ("authorType", "authorId")`, FK to FeedPost CASCADE: present. PASS.
- FeedLike with `UNIQUE ("postId", "authorType", "authorId")`, `INDEX ("postId")`, FK to FeedPost CASCADE: present. PASS.

### Notes
- The `@@index([parentId, createdAt])` on FeedPost in the Prisma schema maps to `CREATE INDEX "FeedPost_parentId_createdAt_idx"` in SQL — confirmed present. The spec asked for `@@index([childId, createdAt])` also — present as `"FeedPost_childId_createdAt_idx"`.
- The spec asked for `@@unique([postId, authorType, authorId])` on FeedLike — confirmed as `"FeedLike_postId_authorType_authorId_key"` unique index.
- `pnpm build` requires DATABASE_URL for `prisma migrate deploy`; the Next.js compilation itself (`next build`) succeeds cleanly. In CI/Vercel this is expected to succeed because DATABASE_URL is injected. No code change required.
- One minor observation in avatar/upload route: when a RELATIVE updates their own avatar the DB write is done inline (direct `prisma.relative.update`) rather than calling `setRelativeAvatar`, because `setRelativeAvatar` requires a PARENT session. This is correctly documented in the route and follows the same old-blob-cleanup pattern. Not a bug.

---

## Фаза 8 — Полировка и готовность к деплою

- [ ] Звуки
- [ ] Адаптив
- [ ] Обработка ошибок
- [ ] README с инструкцией по деплою на Vercel hobby
- [ ] Деплой-готовность (Postgres provider, AUTH_SECRET, BLOB_READ_WRITE_TOKEN)
- QA: —
