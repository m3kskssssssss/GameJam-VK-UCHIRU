---
description: Plan and execute a phase from docs/ROADMAP.md end-to-end with the right agents and a final QA pass.
argument-hint: <phase-number>
---

We are starting Phase $1 of Kid Quest.

Do this **in order, without skipping steps**:

1. Read `CLAUDE.md`, `docs/ROADMAP.md`, and any `docs/*.md` referenced by the phase.
2. Read `PROGRESS.md` if it exists.
3. Invoke the **architect** subagent with the phase number. It will produce a written plan with task ownership.
4. Show me the plan and pause for my confirmation. Do not start coding yet.
5. After I confirm, dispatch tasks **one by one** to the named agents using the Task tool. Each task = one subagent invocation. Wait for completion before the next.
6. After all feature tasks are done, invoke **qa-engineer** to run typecheck, lint, tests, build, and write E2E for this phase's DoD.
7. If anything is red, route the failing test back to the relevant agent and re-run QA. Loop until green.
8. Update `PROGRESS.md` checking off the phase and noting any deviations.
9. Report back with: ✅ phase complete, summary of what was built, follow-ups for next phase.

If at any step a doc is contradictory or missing critical info, stop and ask me before proceeding.
