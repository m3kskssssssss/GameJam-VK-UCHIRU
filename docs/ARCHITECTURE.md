# Архитектура — Kid Quest

## Стек

| Слой | Технология | Зачем |
|---|---|---|
| Фреймворк | Next.js 15 (App Router) | RSC, server actions, Vercel-нативный |
| Язык | TypeScript strict | Безопасность типов |
| Стили | TailwindCSS v4 + shadcn/ui | Скорость, консистентность |
| Аутентификация | Auth.js (NextAuth v5) Credentials | Контроль логики двух ролей |
| БД | Vercel Postgres (Neon под капотом) | Бесплатный тариф, нативная интеграция |
| ORM | Prisma | Типизация, миграции |
| 3D | React Three Fiber + drei | Декларативный Three.js |
| Game state | Zustand | Простое, без бойлерплейта |
| Формы | React Hook Form + Zod | Валидация на клиенте и сервере |
| Хранилище фото | Vercel Blob | Бесплатные 1 ГБ, подписанные URL |
| Графики | Recharts | Лёгкий, в стиле shadcn |
| Тесты | Vitest (юнит) + Playwright (E2E) | Стандарт |
| Линтинг | ESLint + Prettier + Husky + lint-staged | Чистота |

## Зависимости (для package.json — поставить ровно эти)

### dependencies
```
next, react, react-dom, typescript,
@prisma/client, prisma,
next-auth@beta (v5), @auth/prisma-adapter,
bcryptjs,
zod, react-hook-form, @hookform/resolvers,
zustand,
three, @react-three/fiber, @react-three/drei,
@vercel/blob,
recharts,
clsx, tailwind-merge, class-variance-authority,
lucide-react,
sonner (toasts)
```

### devDependencies
```
@types/node, @types/react, @types/react-dom, @types/bcryptjs, @types/three,
tailwindcss@next, @tailwindcss/postcss, postcss, autoprefixer,
eslint, eslint-config-next, prettier, prettier-plugin-tailwindcss,
husky, lint-staged,
vitest, @testing-library/react, @testing-library/jest-dom, jsdom,
@playwright/test
```

## Структура каталогов

```
src/
├── app/
│   ├── (marketing)/
│   │   └── page.tsx              # лендинг "Kid Quest"
│   ├── auth/
│   │   ├── login/page.tsx        # вход (родитель/ребёнок)
│   │   └── register/page.tsx     # регистрация родителя
│   ├── parent/
│   │   ├── layout.tsx            # требует роль PARENT
│   │   ├── page.tsx              # список детей
│   │   ├── child/[id]/page.tsx   # детальный экран
│   │   └── settings/page.tsx
│   ├── play/
│   │   ├── layout.tsx            # требует роль CHILD
│   │   ├── page.tsx              # главный мир (R3F сцена)
│   │   ├── house/[subject]/page.tsx  # домик задания
│   │   ├── home/page.tsx         # главный домик (Sims)
│   │   └── lobby/page.tsx        # сервер игроков (заглушка)
│   ├── api/
│   │   └── auth/[...nextauth]/route.ts
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                       # shadcn-компоненты
│   ├── auth/                     # формы логина/регистрации
│   ├── parent/                   # дашборд-виджеты
│   ├── play/                     # HUD, джойстик, диалоги
│   ├── world/                    # R3F: Field, House, Character, Camera
│   ├── minigames/                # math/, reading/, english/, pe/
│   └── home-house/               # мебель, гардероб, питомец
├── server/
│   ├── auth/
│   │   ├── config.ts             # auth.ts (NextAuth v5)
│   │   ├── guards.ts             # requireParent / requireChild
│   │   └── password.ts           # bcrypt хелперы
│   ├── actions/                  # server actions (по доменам)
│   │   ├── auth.ts
│   │   ├── children.ts
│   │   ├── progress.ts
│   │   ├── tasks.ts              # фиксация прохождения уровня
│   │   ├── pe.ts                 # загрузка фото, создание сессии
│   │   ├── shop.ts               # покупка мебели/одежды/питомца
│   │   └── rooms.ts
│   └── content/                  # детерминированный контент заданий
│       ├── math.ts
│       ├── reading.ts
│       ├── english.ts
│       └── pe.ts
├── lib/
│   ├── db.ts                     # prisma client singleton
│   ├── blob.ts                   # вспом. для Vercel Blob
│   └── utils.ts                  # cn(), форматтеры
├── hooks/
│   ├── useGameStore.ts           # zustand: позиция персонажа, активная зона
│   └── useChildSummary.ts
├── i18n/
│   └── ru.ts                     # все строки UI
└── middleware.ts                 # маршрутизация по ролям

prisma/
├── schema.prisma
├── migrations/
└── seed.ts

public/
├── sprites/                      # 2D-спрайты персонажа
├── textures/                     # текстуры земли, домиков
├── sounds/                       # короткие звуки
└── images/                       # иллюстрации к упражнениям

tests/
├── unit/
└── e2e/
```

## Авторизация и сессии

- NextAuth Credentials provider. Один общий, но в `authorize()` различаем по полю `role` из формы:
  - `role=parent` → ищем в `parent` по email.
  - `role=child` → ищем в `child` по username.
- В JWT/сессию пишем `{ id, role, parentId? }`.
- `middleware.ts` смотрит на cookie сессии и редиректит:
  - `/parent/*` без PARENT → `/auth/login`
  - `/play/*` без CHILD → `/auth/login`
  - `/auth/*` с активной сессией → редирект в свой кабинет.

## Отношение хранилища фото

- При снимке клиент шлёт `multipart/form-data` в API-роут `POST /api/pe/upload`.
- Сервер: проверяет роль CHILD, валидирует размер (≤ 4 МБ) и mime, кладёт в Blob с приватным доступом, обновляет `PESession`.
- Родитель смотрит фото через server component, который генерирует подписанную ссылку на лету (Blob `head` + signed URL) — рендерит `<img src={signedUrl}/>`.

## Контент заданий

- Фиксированный набор уровней по 10 заданий в каждом. Заведён в `src/server/content/*.ts` как чистые TS-объекты — детерминированные ответы, никакой генерации в рантайме.
- Каждое задание: `{ id, type, prompt, options?, correctAnswer, hint? }`.
- Проверка: `correctAnswer === userAnswer` (с нормализацией строк/чисел). Никаких внешних вызовов.

## Деплой

1. GitHub repo → Vercel Import.
2. Vercel Postgres подключить через интеграцию (DATABASE_URL пробрасывается).
3. Vercel Blob включить. `BLOB_READ_WRITE_TOKEN` пробрасывается.
4. `AUTH_SECRET` сгенерировать, прописать.
5. На push в `main` — авто-деплой. Перед первым деплоем: `pnpm prisma migrate deploy && pnpm prisma db seed` (через Vercel `vercel.json` `buildCommand` либо вручную через `vercel cli`).
