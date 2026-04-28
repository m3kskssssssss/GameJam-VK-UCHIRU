---
description: Add or replace task content (math/reading/english/PE catalog) deterministically. Delegates to db-engineer.
argument-hint: <subject> <level-or-key>
---

Add/update content for: **$1 $2**.

Steps:
1. Open `docs/GAME_DESIGN.md` and confirm the format expected for that subject.
2. Open `src/server/content/$1.ts` (or `src/server/catalog/pe.ts` for PE).
3. Invoke `db-engineer` to:
   - Append new entries with stable ids — never reuse a removed id.
   - Keep `correctAnswer` deterministic and verifiable by a human reader.
   - Update any inline tests / fixtures that depend on counts.
4. Run `pnpm test --run` to confirm nothing broke.
5. If a level was added, ensure the `SubjectProgress` cap respects the new max level.
6. Show me the diff before committing.
