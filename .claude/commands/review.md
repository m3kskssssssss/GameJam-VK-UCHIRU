---
description: Cross-review recent changes against docs and conventions. Useful before merging a phase or after a long coding session.
argument-hint: [optional area, e.g. auth, world, dashboard]
---

Review the recent work$1 with these checks:

1. Run `git status` and `git diff --stat HEAD~5..HEAD` to see what changed.
2. For each modified file, verify it follows conventions in `CLAUDE.md`:
   - imports use `@/`
   - no `any`
   - server actions begin with `'use server'` and use Zod + auth guards
   - components ≤ 250 lines
3. Check that any new dependency is documented in `docs/ARCHITECTURE.md`.
4. Spot-check security: do parent-only actions actually call `requireParent`? Do child-only actions call `requireChild` AND ownership where needed?
5. Spot-check the PE flow if touched: are there ANY user-visible timers? (There must not be.)
6. Run `pnpm tsc --noEmit && pnpm lint && pnpm test --run`.
7. Produce a short report:
   - ✅ what looks good
   - ⚠️ what needs work, with file paths and line ranges
   - 🔧 suggested follow-up tasks

Do not edit code in this command. Reviews are read-only.
