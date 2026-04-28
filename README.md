# Kid Quest 🎮📚

Образовательная игра для детей 6–11 с родительским контролем. Деплой на Vercel.

> **Статус**: скаффолд. Сам код пишет Claude Code по плану из `docs/ROADMAP.md`. Стартовый промпт — в [`PROMPT.md`](./PROMPT.md).

## TL;DR — как стартануть

```bash
# 0) убедись, что у тебя есть Node 20+ и pnpm
node -v        # >= 20
corepack enable
corepack prepare pnpm@latest --activate

# 1) распакуй архив, зайди в папку
cd kid-quest

# 2) (опционально) git init для нормальной работы Claude Code с историей
git init && git add -A && git commit -m "chore: initial scaffold"

# 3) запусти Claude Code
claude

# 4) внутри Claude Code — вставь промпт из PROMPT.md и нажми Enter
```

Дальше Claude Code сам читает `CLAUDE.md`, `docs/`, поднимает агентов, и идёт фаза за фазой. После Фазы 0 у тебя уже будет рабочий `pnpm dev`.

## Что внутри

- `CLAUDE.md` — стартовая память для Claude Code.
- `docs/` — продуктовые и технические документы (PRD, архитектура, БД, геймдизайн, API, дизайн-система, дорожная карта).
- `.claude/agents/*.md` — 8 специализированных subagent-ов (architect, db-engineer, auth-engineer, backend-engineer, dashboard-developer, game-world-developer, mini-game-developer, ui-engineer, qa-engineer).
- `.claude/commands/*.md` — slash-команды (`/start-phase`, `/review`, `/add-content`).
- `.claude/settings.json` — разрешения и переменные.
- `PROMPT.md` — промпт, который ты вставляешь в Claude Code на старте.

## Стек

Next.js 15 (App Router) · TypeScript · TailwindCSS v4 · shadcn/ui · NextAuth v5 · Prisma + Vercel Postgres · React Three Fiber · Zustand · Vercel Blob · Playwright

См. `docs/ARCHITECTURE.md` для полного списка зависимостей.

## Деплой на Vercel

После того как Claude Code дошёл до Фазы 8:

1. Создай репозиторий на GitHub и пуш.
2. На Vercel — Add New Project → Import.
3. Storage tab → Create Database → Postgres. Подключи к проекту (DATABASE_URL пробрасывается).
4. Storage tab → Create Store → Blob. Подключи (`BLOB_READ_WRITE_TOKEN`).
5. Environment Variables → добавь `AUTH_SECRET` (`openssl rand -base64 32`).
6. Deploy. После первого деплоя в Project → Functions → Run `pnpm prisma migrate deploy && pnpm prisma db seed` (или собственный CI-шаг — Claude Code настроит в Фазе 8).

## Команды (после Фазы 0)

```bash
pnpm dev              # локальная разработка
pnpm build            # продакшен-сборка
pnpm tsc --noEmit     # типы
pnpm lint             # линт
pnpm test             # юнит-тесты (Vitest)
pnpm exec playwright test   # E2E
pnpm prisma migrate dev --name <descriptive>
pnpm prisma db seed
pnpm prisma studio    # веб-просмотр БД
```

## Лицензия

MIT (на твоё усмотрение, поправь после форка).
