# Whole-code reader — GPT (codex gpt-6-luna, -s read-only). Saw: full repo copy r1/codex at c9dad28+cf1f4e8014d5. Could not write (OS sandbox).

## Finding

**`office init` overwrites the target of an existing `AGENTS.md` symlink** — [src/init.ts](/tmp/claude-1000/-home-frank-Projects-agent-office/d8dfc6bc-af51-4da5-aed3-93c0abd87a60/scratchpad/r1/codex/src/init.ts:209) — **MEDIUM**

**Scenario:** A project’s `AGENTS.md` symlinks to a shared rules file outside the repo, and that file has no Agent Office instructions. Running `office init` reads through the symlink, then `writeFileSync` follows it and appends the Office section to the shared file. Other projects using that file receive the change too.

**How I know:** Read in the code. `pathExistsOrSymlink` recognizes the symlink, but the later `readFileSync` and `writeFileSync` operate on its target. The code removes a symlink only when it points to the office checkout’s `AGENTS.md`.

## What’s done well

The worktree detection uses Git’s shared common directory to map normal worktrees back to one project, and `office init` appends instructions to existing regular `AGENTS.md` files while detecting an existing Office section to avoid adding it repeatedly.
