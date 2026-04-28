#!/usr/bin/env bash
# scripts/bootstrap.sh
# Используется Claude Code в Фазе 0. Не запускай вручную — лучше пусть Claude.
set -euo pipefail

echo "→ Проверка Node.js (нужен 20+)..."
node -v

echo "→ Активация pnpm..."
corepack enable
corepack prepare pnpm@latest --activate

echo "→ Создание Next.js приложения внутри текущей папки..."
# Аккуратно: create-next-app создаёт папку. Делаем во временной и переносим содержимое.
TMPDIR="$(mktemp -d)"
pnpm create next-app@latest "$TMPDIR/app" \
  --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" \
  --use-pnpm --turbopack --no-git

# Переносим всё, не затирая наши конфиги (.claude, docs, CLAUDE.md, и т.д.)
rsync -a --ignore-existing "$TMPDIR/app/" ./

# Копируем package.json, tsconfig.json, next.config.* — этим override-им
cp -f "$TMPDIR/app/package.json" ./package.json
cp -f "$TMPDIR/app/tsconfig.json" ./tsconfig.json
[ -f "$TMPDIR/app/next.config.ts" ] && cp -f "$TMPDIR/app/next.config.ts" ./next.config.ts
[ -f "$TMPDIR/app/next.config.mjs" ] && cp -f "$TMPDIR/app/next.config.mjs" ./next.config.mjs

rm -rf "$TMPDIR"

echo "→ Установка дополнительных зависимостей..."
pnpm add \
  next-auth@beta @auth/prisma-adapter \
  @prisma/client bcryptjs jose \
  zod react-hook-form @hookform/resolvers \
  zustand \
  three @react-three/fiber @react-three/drei \
  @vercel/blob \
  recharts \
  clsx tailwind-merge class-variance-authority \
  lucide-react sonner

pnpm add -D \
  prisma tsx \
  @types/bcryptjs @types/three \
  vitest @testing-library/react @testing-library/jest-dom jsdom \
  @playwright/test \
  husky lint-staged prettier prettier-plugin-tailwindcss

echo "→ Инициализация shadcn/ui..."
pnpm dlx shadcn@latest init --yes --base-color stone || echo "(shadcn init может попросить подтверждение — проверь логи)"

echo "→ Установка базовых компонентов shadcn..."
pnpm dlx shadcn@latest add button card dialog tabs input label form toast avatar badge progress separator scroll-area dropdown-menu sheet alert-dialog || true

echo "→ Инициализация Prisma..."
pnpm prisma init --datasource-provider postgresql

echo "→ Готово. Дальше — db-engineer заполняет schema.prisma и делает миграцию."
