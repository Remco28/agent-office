**Project:** Agent Office. I couldn’t obtain a numbered session ID: the read-only `office peek` command failed before running with a sandbox network-namespace error.

## Finding

### `office init` can miss repositories nested more than three directories down

**File:** [src/init.ts](/tmp/claude-1000/-home-frank-Projects-agent-office/d8dfc6bc-af51-4da5-aed3-93c0abd87a60/scratchpad/r3/codex/src/init.ts:122)  
**Severity:** MEDIUM

`nestedRepos` stops walking after three directory levels. If the target is not itself inside a repository and a project is deeper than that, the new guard at line 233 does not refuse initialization.

**Scenario:** `~/Projects/clients/acme/services/api/.git` exists. Someone runs `office init ~/Projects`. The scan does not reach `api`, so init creates a repository and `AGENTS.md`/`CLAUDE.md` in `~/Projects`. The new `CLAUDE.md` can then give agents working in descendant repositories the parent folder’s Agent Office instructions.

**How I know:** Read in the code; I did not run it.

## Hunk review

- **AGENTS.md, README.md, CLI help, and TUI:** These update the guidance to describe folder-based project detection, the revised `office init` behavior, and starting agents inside their project. I found no regression in this wording. One older message remains in [src/session.ts](/tmp/claude-1000/-home-frank-Projects-agent-office/d8dfc6bc-af51-4da5-aed3-93c0abd87a60/scratchpad/r3/codex/src/session.ts:455): “no project linked.” It is confusing now that projects are inferred from the folder, but does not change where data is filed.

- **`src/init.ts`:** The fixes tighten recognition of an existing Agent Office section, guard against initializing a folder of projects, ignore repository-redirection Git environment variables, handle quoted `~` paths, avoid duplicate skill links through aliased harness folders, preserve existing `AGENTS.md` bytes when appending, avoid linking `CLAUDE.md` to an `AGENTS.md` directory, and report when setup writes into a worktree. Removing the `.git/config` write also means copied repositories resolve as their own projects. I found no regression in these changes beyond the incomplete nested-repository scan above.

- **`src/scope.ts`:** The resolver now filters Git environment overrides, identifies the current Git directory, drops the old `office.project` override, and maps submodules checked out in superproject worktrees back to the same submodule project. I found no break in the ordinary repository, worktree, or tested submodule paths in the code.

- **Tests:** The added cases cover the new safeguards and project-resolution behavior. The scan-depth gap is not covered. I did not run tests.

## Missed counterparts

The CLI passes the detected folder project through to the relevant routes, and the init, scope, session, and TUI guidance I traced is consistent with the new behavior, except for the stale “no project linked” message noted above. The depth-limited guard is the only consequential gap I found.

The fixes do well at avoiding Git-config side effects, protecting existing files and links, preserving existing file bytes, and handling worktrees and submodules. Those changes should be kept.
