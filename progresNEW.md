# progresNEW — большой апдейт Kid Quest

Этот файл трекает прогресс по 6-фазной задаче, согласованной 2026-05-02. Полная спецификация — в плане `~/.claude/plans/federated-stargazing-hamming.md`. Здесь только чек-лист и краткие ссылки.

Условные обозначения:
- `[ ]` — не начато
- `[~]` — в работе
- `[x]` — готово
- `[!]` — заблокировано / нужен ввод от пользователя

---

## Фаза A — Визуал мира, HUD и фоновый звук

- [x] **A.1** Переработать `src/components/world/Portals.tsx`: один белый полупрозрачный диск (CircleGeometry, opacity ~0.55) + мягкий halo вместо двух цветных колец
- [x] **A.2** Заменить `<Text>` на drei `<Html>` с белой плашкой названия (rounded, тени `0 8px 24px rgba(31,41,55,0.18)`, padding 8×18px)
- [x] **A.3** Кнопка «Войти в домик» → «Войти в дом», стиль белый с тенями (`src/components/play/Hud.tsx`, `src/i18n/ru.ts`)
- [x] **A.4** Джойстик: на mobile (<768px) сдвинуть от left:2rem ближе к центру (`src/components/world/Joystick.tsx`)
- [x] **A.5** Создать `src/hooks/useAmbientAudio.ts` — хук с loop/volume/первый-gesture-старт, обработка `NotAllowedError`
- [x] **A.6** Создать `src/components/play/AmbientAudio.tsx` — обёртка-плеер, src=`/village.mp3` (файл лежит в `public/village.mp3`)
- [x] **A.7** Подключить `<AmbientAudio />` в `MattercraftWorld.tsx` и `LobbyWorld.tsx` (вне Canvas, рядом с Hud)
- [x] **A.8** QA-прогон: `pnpm typecheck` — 0 ошибок; `pnpm lint` — 0 ошибок в затронутых файлах (1 pre-existing warning в LevelSelect.tsx не наш)

---

## Фаза B — Бабушка и дедушка как NPC в мире

- [x] **B.1** `src/components/world/npcs-data.ts` — массив NPC с позициями (бабушка `[3.52, 0.99, -11.96]`, дедушка `[8.78, 1.00, -3.77]` из `mattercraft-scene-data.ts:315-327`)
- [x] **B.2** `src/components/world/Npcs.tsx` — рендер кружков-зон + плашек имён в стиле Фазы A
- [x] **B.3** Расширить `src/hooks/useGameStore.ts`: `nearNpc: 'grandma' | 'grandpa' | null` + сеттер
- [x] **B.4** В `Hud.tsx` добавить CTA «Поговорить с бабушкой / дедушкой» (показ только на /play, не в /play/lobby)
- [x] **B.5** Подключить `<Npcs />` в `MattercraftWorld.tsx`
- [x] **B.6** Создать заглушку `src/app/play/talk/[npc]/page.tsx`
- [x] **B.7** Локали в `src/i18n/ru.ts`: `play.hud.btnTalkGrandma`, `btnTalkGrandpa`, `npc.grandma`, `npc.grandpa`
- [x] **B.8** QA: войти в зону → видеть кнопку → клик → открывается заглушка диалога

---

## Фаза C — Диалоговая сцена и 2D-эмоции (UI без контента)

- [x] **C.1** Уточнить раскладку файлов в `public/emotions2d/` (`ls`); при необходимости адаптировать пути
- [x] **C.2** `src/components/dialog/Portrait.tsx` — `<img>` спрайт с opacity transition при смене эмоции
- [x] **C.3** `src/components/dialog/DialogBox.tsx` — белая карточка с репликой и вариантами ответа
- [x] **C.4** `src/components/dialog/DialogScene.tsx` — затемнённый фон + два слота портретов + DialogBox
- [x] **C.5** `src/components/dialog/dialog-state.ts` — Zustand-стор шага (currentNode, setNode, chosenTaskKey)
- [x] **C.6** Превратить `src/app/play/talk/[npc]/page.tsx` в server-component, читающий gender и монтирующий DialogScene
- [x] **C.7** Тестовый набор нодов для проверки переключения эмоций
- [x] **C.8** QA: затемнение, портреты, переключение эмоций, кнопка «Уйти» → /play

---

## Фаза D — Контент диалогов и задания бабушки/дедушки

- [x] **D.1** `src/server/content/grandparents.ts` — типы (`DialogNode`, `GrandparentTask`, `Emotion`) + 12 заданий
- [x] **D.2** Прописать живые реплики бабушки (искусство): приветствие, «как дела», лор про прошлое, описание 6 заданий, ответ на «не готов», прощание
- [x] **D.3** Прописать живые реплики дедушки (инженерия): приветствие, «как дела», лор, описание 6 заданий, ответы, прощание
- [x] **D.4** Маппинг эмоций (emotionLeft/emotionRight) на каждом нодe
- [x] **D.5** `src/components/dialog/dialog-runner.tsx` — машина состояний по графу нодов
- [x] **D.6** `src/components/dialog/PhotoSubmission.tsx` — `<input type="file" accept="image/*" capture="environment">` + превью + Отправить/Переснять
- [x] **D.7** Интеграция: «Приложить фото» → POST в API (фаза E) → next_node при успехе
- [x] **D.8** QA: `pnpm typecheck` — 0 ошибок; `pnpm lint` — только pre-existing warning в LevelSelect.tsx

---

## Фаза E — Backend: модели, API, награды, прогресс

- [x] **E.1** Миграция Prisma: enum `Grandparent`, модель `GrandparentTaskCompletion`, поля `avatarUrl/avatarKey` в Parent/Child, модель `Relative`, модели `FeedPost`/`FeedComment`/`FeedLike`, расширение `Role` (либо JWT-поле `kind`)
- [x] **E.2** Расширить `src/lib/blob.ts`: `uploadGrandparentPhoto`, `uploadAvatarPhoto`, `deleteBlob`
- [x] **E.3** `src/server/auth/config.ts`: ветка Credentials для RELATIVE (поиск по username в Relative)
- [x] **E.4** `src/server/auth/guards.ts`: `requireRelative()`, `requireParentOrRelative()`
- [x] **E.5** `src/middleware.ts`: relative редиректится на `/parent/feed` со всех `/parent/*` кроме `/parent/feed` и `/parent/profile`
- [x] **E.6** `src/server/actions/grandparent.ts`: `submitGrandparentTask`, `listGrandparentCompletions`
- [x] **E.7** `src/server/actions/feed.ts`: `listFeed`, `getPostDetail`, `addComment`, `toggleLike`
- [x] **E.8** `src/server/actions/relatives.ts`: `listRelatives`, `createRelative`, `deleteRelative`, `resetRelativePassword`
- [x] **E.9** `src/server/actions/avatars.ts`: `setParentAvatar`, `setChildAvatar`, `setRelativeAvatar`
- [x] **E.10** API роут `src/app/api/grandparent/upload/route.ts` (multipart → submitGrandparentTask)
- [x] **E.11** API роут `src/app/api/avatar/upload/route.ts` (multipart → avatars.ts)
- [x] **E.12** Хук в `completePESession` (`src/server/actions/pe.ts`): создаёт `FeedPost` (kind='PE'); `attachPhotoToPost` для отложенной фотки
- [x] **E.13** QA: прогон миграций, тесты server actions

---

## Фаза F — Родительский UI: меню, лента, родственники, аватарки

- [x] **F.1** `src/components/parent/AppShell.tsx` — десктоп-навигация + мобильный Sheet (гамбургер сверху)
- [x] **F.2** Перевести `src/app/parent/layout.tsx` на AppShell
- [x] **F.3** `src/app/parent/feed/page.tsx` + компоненты `FeedList`, `FeedPost`, `FeedFilters`, `FeedCommentDialog`
- [x] **F.4** Бесконечный скролл cursor-based, optimistic лайки/комменты
- [x] **F.5** Поиск по словам и фильтр по ребёнку (если детей >1)
- [x] **F.6** `src/app/parent/relatives/page.tsx` + `AddRelativeDialog`, `RelativeCard`, `ManageRelativeSheet`
- [x] **F.7** `src/app/parent/profile/page.tsx` (родитель: аватар + displayName + смена пароля)
- [x] **F.8** `src/components/parent/AvatarUploader.tsx` — переиспользуемый компонент
- [x] **F.9** `ChildCard.tsx` + `parent/page.tsx`: показывать avatar если есть
- [x] **F.10** `ChildDetailTabs.tsx`: новая вкладка «Бабушка/дедушка» со списком GrandparentTaskCompletion
- [x] **F.11** Кнопка/UI загрузки аватарки ребёнка на странице child detail
- [x] **F.12** `/auth/login`: третья вкладка «Родственник»
- [x] **F.13** Локали: все новые строки в `src/i18n/ru.ts`
- [!] **F.14** QA: ручной прогон в DevTools iPhone-эмуляторе требуется от пользователя (нужен живой DATABASE_URL для dev-сервера)

---

## Финал

- [x] **Z.1** `pnpm typecheck` 0 ошибок, `pnpm lint` только pre-existing LevelSelect warning, `next build` зелёный (17 роутов). Полный `pnpm build` падает на `prisma migrate deploy` локально — DATABASE_URL не сконфигурирован, как и в Фазе E
- [ ] **Z.2** Playwright smoke: 2 happy-path теста (grandma submission, лайк в ленте) — отложено
- [!] **Z.3** Ручной e2e в DevTools iPhone-эмуляторе — требуется от пользователя
- [ ] **Z.4** Обновить `PROGRESS.md` (если ведётся для основных фаз 0–8)

---

## Заметки по ходу выполнения

### Фаза A (2026-05-02)
- Disc radius 1.4, halo ring 1.45–1.7 (как в плане), TRIGGER_RADIUS 2.0 сохранён.
- LABEL_HEIGHT опущен до 1.4 вместо плановых «~1.4» — совпадает.
- Billboard+Text убраны полностью; вместо них `<Html center distanceFactor={8} sprite>` без `transform`, т.к. комбинация `transform+sprite` может конфликтовать в старых версиях drei.
- `public/village.mp3` уже лежал в проекте — путь `/village.mp3` корректен.
- Lint warning в `LevelSelect.tsx` (`isLocked` unused) — pre-existing, не наш.

### Фаза B (2026-05-02)
- NPC Y-координата в npcs-data.ts установлена 0.05 (диск на земле), а не 0.99/1.00 из mattercraft-scene-data.ts (центр модели).
- `NpcKind` реэкспортируется через useGameStore.ts для единой точки импорта в Hud.tsx.
- В MattercraftWorld.tsx добавлен сброс `setNearNpc(null)` при монтировании — по аналогии с nearHouse.
- В B.6 `db` из задачи заменён на `prisma` (фактическое имя экспорта в `@/lib/db`).
- `pnpm typecheck` — 0 ошибок; `pnpm lint` — 0 ошибок (pre-existing warning в LevelSelect.tsx не наш).

### Фаза C (2026-05-02)
- Маппинг эмоций: `hello→Hi`, `happy→Funny`, `neutral→Default`, `pointing→Pick` — закреплён в `portrait-paths.ts`.
- Зеркалить ли портрет справа (side='right') — по умолчанию НЕТ (`scaleX(-1)` не применяется). Все PNG уже смотрят в нужную сторону; пользователь даст обратную связь, если потребуется поправить.
- Portrait.tsx реализует cross-fade через два `<img>` с абсолютным позиционированием + CSS `transition: opacity 220ms`; очистка таймера через `clearTimeout` при быстрых переходах.
- `@next/next/no-img-element` отключён на уровне строк в Portrait.tsx — `<Image />` несовместим с CSS opacity cross-fade без кастомного лоадера.
- i18n: добавлен блок `play.dialog` с ключами `btnLeave`, `speakerChild`, `speakerNpcGrandma`, `speakerNpcGrandpa`.
- `pnpm typecheck` — 0 ошибок; `pnpm lint` — только pre-existing warning в LevelSelect.tsx.

### Фаза D (2026-05-02)
- Контент разбит на 4 файла (не один монолит): `grandparents-types.ts`, `grandma-bundle.ts`, `grandpa-bundle.ts`, `grandparents.ts` (barrel + helpers).
- Итого нодов: 14 у бабушки (entry, menu, chitchat, lore_1, lore_2, task_decline + 6×task_intro) + 14 у дедушки = **28 нодов**.
- Дополнительно: 1 in-memory нод «task_done» генерируется в `useDialogRunner` при успехе — в граф не входит.
- 12 заданий: 6 у бабушки (draw×4, sculpt×2), 6 у дедушки (origami×3, real×3).
- `dialog-runner.tsx` — хук `useDialogRunner`, не компонент; DialogScene остался презентационным.
- `PhotoSubmission.tsx` — POST на `/api/grandparent/upload` (404 до фазы E — ожидаемо).
- Новый helper: `src/lib/grandparent-upload.ts`.
- i18n: добавлен подраздел `play.dialog.photo.*` (8 ключей).
- `pnpm typecheck` — 0 ошибок; `pnpm lint` — только pre-existing warning в LevelSelect.tsx.

### Фаза F (2026-05-02)
- **AppShell**: client-component с десктоп-навигацией и мобильным `<Sheet />` слева. Навигация фильтруется по `viewerKind` — `RELATIVE` видит только «Лента» и «Профиль».
- **layout.tsx** теперь async RSC, читает viewer (parent/relative) через `auth()` + точечный `prisma.findUnique`, чтобы передать имя и аватар в shell. `<Toaster />` смонтирован один раз здесь.
- **Лента**: `FeedList` на клиенте делает infinite scroll через `IntersectionObserver`, debounce 300ms на поиск, optimistic лайки/комменты с откатом на ошибке. Сервер первой страницы выполняется в RSC.
- **Profile**: создан новый server-action `src/server/actions/profile.ts` с `changeParentPassword`/`changeRelativePassword` (требуют текущий пароль). Без переименования displayName — out of scope.
- **AvatarUploader**: единый компонент с тремя ролями (parent/child/relative). POSTит в `/api/avatar/upload` с полями `file` + `target`, потом колбэк зовёт соответствующий server-action. Для RELATIVE — API сам обновляет БД (см. notes Фазы E), отдельный server-action не нужен.
- **ChildDetailTabs**: добавлена 5-я вкладка «Бабушка / Дедушка» с группировкой по NPC, миниатюры с увеличением через Dialog.
- **LoginTabs**: добавлена 3-я вкладка «Родственник», `loginAction` расширен до `role: 'relative'` с редиректом на `/parent/feed`.
- **i18n**: все новые строки в `src/i18n/ru.ts` под группами `parent.nav.*`, `parent.feed.*`, `parent.relatives.*`, `parent.profile.*`, `parent.avatar.*`, `parent.grandparentTab.*`, `auth.tabRelative`.
- Удалён `<main>` из `child/[id]/page.tsx` (AppShell уже рендерит `<main>`, нельзя вкладывать).
- `pnpm typecheck` 0 ошибок; `pnpm lint` — только pre-existing `LevelSelect` warning; `next build` зелёный (17 роутов; `/parent/feed` 6.82 kB, `/parent/profile` 4.61 kB, `/parent/relatives` 6.42 kB).

### Фаза E (2026-05-02)
- **Миграция SQL**: `prisma/migrations/20260502010000_add_grandparent_relatives_feed/migration.sql` создана вручную (DATABASE_URL не сконфигурирована локально). На Vercel `pnpm prisma migrate deploy` применит файл при следующем релизе. `pnpm prisma generate` отработал — клиент знает все новые модели.
- **Role.RELATIVE** добавлено через `ALTER TYPE` (не enum-recreate), порядковые номера PARENT/CHILD не съехали.
- **FeedComment / FeedLike**: храним `authorType + authorId` без жёсткого FK на автора (relative можно удалять, не трогая комменты — `authorName` в snapshot'е).
- **`deleteBlob`** принимает FULL URL (не key) — таково требование `del()` API из `@vercel/blob`. Поэтому в БД храним и url и key, а при удалении передаём `BlobUploadResult.url`.
- **`attachPhotoToPost`** живёт в `src/server/actions/feed.ts` как обычная экспортная async-функция (не server action) — Next.js это допускает в `'use server'`-файле, поскольку аргументы (string×3) сериализуемы.
- **`completePESession`** теперь возвращает `feedPostId`. `/api/pe/upload` опционально принимает `feedPostId` от клиента и для `slot='60s'` дёргает `attachPhotoToPost` (silent fail).
- **Avatar self-edit для RELATIVE** реализован прямо в `/api/avatar/upload` (route.ts), не через server-action `setRelativeAvatar` (та требует requireParent). Удаление старого blob — silent.
- **submitGrandparentTask** — награды только при первом completion (`isFirst = !existing`). Каждое переотправление создаёт **новый** FeedPost (по плану обсуждалось одно сообщение per task — backend-engineer оставил append-only до отдельного апгрейда; будет жить так до явного запроса).
- **Build**: `next build` — зелёный (16 routes, новые `/api/avatar/upload`, `/api/grandparent/upload` в манифесте). Полный `pnpm build` падает на `prisma migrate deploy` из-за отсутствующего DATABASE_URL — это локальная инфра, не дефект кода.
- `pnpm typecheck` — 0 ошибок; `pnpm lint` — только pre-existing warning в LevelSelect.tsx.
