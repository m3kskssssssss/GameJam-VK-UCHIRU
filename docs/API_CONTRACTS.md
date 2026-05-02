# API Contracts — Деревня Знаний

Все мутации — через **server actions** в `src/server/actions/`. Загрузка фото — единственный API-роут (multipart). Каждое действие проверяет роль и владение через `requireParent()` / `requireChild()`.

## Auth

```ts
// src/server/actions/auth.ts

registerParent(input: { email: string; password: string; displayName: string }): Promise<{ ok: true } | { ok: false; error: string }>

createChild(input: { username: string; password: string; displayName: string }): Promise<{ ok: true; childId: string } | { ok: false; error: string }>
// requireParent. parentId берётся из сессии.

resetChildPassword(input: { childId: string; newPassword: string }): Promise<{ ok: true } | { ok: false; error: string }>
// requireParent + проверить, что child.parentId === session.userId

deleteChild(input: { childId: string }): Promise<{ ok: true } | { ok: false; error: string }>
// requireParent + ownership
```

## Children (родительский дашборд)

```ts
// src/server/actions/children.ts

listChildren(): Promise<ChildSummary[]>
// requireParent. ChildSummary = { id, username, displayName, coins, energy, homeLevel, perSubject: { math: { level, completed, totalXp }, reading: ..., english: ..., pe: { sessionsCount } } }

getChildDetail(childId: string): Promise<ChildDetail>
// requireParent + ownership

listAttempts(childId: string, subject: Subject, take = 50): Promise<TaskAttempt[]>
listPESessions(childId: string, take = 50): Promise<PESessionWithSignedUrls[]>
// PESessionWithSignedUrls — фото отдаются как подписанные URL, валидные 10 минут
```

## Tasks (детский поток заданий)

```ts
// src/server/actions/tasks.ts

startTask(input: { subject: Subject; level: number }): Promise<TaskBundle>
// requireChild. TaskBundle = { sessionToken, items: TaskItem[] }
// sessionToken — короткоживущий JWT (HS256), payload: { childId, subject, level, iat, items: [{id, correct}] }
// items в клиенте показываются БЕЗ `correct`. Серверная валидация — по токену.

submitTask(input: { sessionToken: string; answers: { itemId: string; answer: string }[] }): Promise<TaskResult>
// requireChild. Сервер расшифровывает токен, сравнивает ответы, считает баллы и награды,
// записывает TaskAttempt и обновляет SubjectProgress / coins / energy / xp.
```

> Зачем sessionToken: чтобы клиент не знал правильных ответов и нельзя было отвечать на «угадайку», глядя в network tab.

## PE (физкультура)

```ts
// src/server/actions/pe.ts

startPESession(input: { exerciseKey: string }): Promise<{ sessionId: string }>
// requireChild. Создаёт PESession (completed=false).

completePESession(input: { sessionId: string }): Promise<PEResult>
// requireChild + ownership. Помечает completed=true, начисляет монеты/энергию.
```

```ts
// API route — единственный (нужен multipart)
// POST /api/pe/upload
// FormData: { sessionId: string, slot: '10s' | '60s', file: Blob }
// requireChild + ownership.
// Возвращает { url, key }, обновляет PESession[photoXsUrl/Key].
```

## Shop / Inventory / Rooms (главный домик)

```ts
// src/server/actions/shop.ts

buyItem(input: { catalogKey: string }): Promise<BuyResult>
// requireChild. Проверяет каталог, проверяет монетки/энергию, списывает, создаёт InventoryItem.

setAppearance(input: { hair?: string; top?: string; bottom?: string; pet?: string | null }): Promise<{ ok: true }>
// requireChild. Обновляет CharacterAppearance. Платные элементы — только если они в InventoryItem.
```

```ts
// src/server/actions/rooms.ts

listInventory(): Promise<InventoryItem[]>
listRooms(): Promise<RoomWithPlacements[]>
unlockRoom(input: { index: number }): Promise<{ ok: true } | { ok: false; error: string }>
placeItem(input: { itemId: string; roomId: string; x: number; y: number; rotation?: number }): Promise<{ ok: true }>
removePlacement(input: { itemId: string }): Promise<{ ok: true }>
```

## Валидация

Все входы валидируются через Zod. Пример:

```ts
const StartTaskSchema = z.object({
  subject: z.enum(['MATH','READING','ENGLISH','PE']),
  level: z.number().int().min(1).max(20),
});
```

Любые ошибки бросаем как `Error('USER_FRIENDLY_KEY')`, на клиенте мапим ключи в человеческие сообщения через `src/i18n/ru.ts`.

## Безопасность (чек-лист на каждый action)

1. `await auth()` или эквивалент — есть ли сессия?
2. Роль соответствует?
3. Если действие касается ресурса — проверка владения (childId принадлежит этому parentId; childId === session.childId)?
4. Zod-валидация входа?
5. Никогда не доверять клиенту в части цен / правильных ответов / суммы наград?
