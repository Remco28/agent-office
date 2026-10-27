# Whole-code reader — Grok (grok-4.7). Saw: repo copy r2/grok at c9dad28+0a0f3cd577e8.

I'll review the uncommitted change against how agents actually use the office: project identity, worktrees, and whether `office init` can damage or hide files. I'll start from the diff and the new init/scope code.The working tree includes the init and project-scope work plus unrelated deletions. I'll read the scope, session, and init logic next, and ignore the retired review-loop files.The scope and init rules look careful on paper. I'll reproduce the worktree, copy, and symlink cases that would file under the wrong project or write through a link.## Findings

### Worktree checkouts of a submodule are a second project

**File:** `src/scope.ts:123` (decision uses `sharedRoot` at `src/scope.ts:92`)

**Severity:** MEDIUM. Two agents in the same submodule, one in the main checkout and one in a linked worktree, file memories and work under different paths. Nothing warns. Scoped reads on one side do not show the other. Removing the worktree leaves the worktree-side rows under a path that no longer canonicalizes.

**Scenario:** Superproject `~/src/super` has a submodule at `sub`. An agent in `~/src/super/sub` records a decision; it is stored as `~/src/super/sub`. Another agent is in a git worktree `~/src/super-wt` with that submodule checked out and runs `office begin` and `office remember` from `~/src/super-wt/sub`. Those rows are stored as `~/src/super-wt/sub`. Each banner names `sub` and a different path, and neither mentions the other checkout. `git rev-parse --git-common-dir` inside the worktree submodule is `super/.git/worktrees/<name>/modules/sub`, whose `core.worktree` points at the worktree checkout, so `repoRoot` is not `super/.git/modules/sub`.

**How I know:** Reproduced. With git 2.55, `detectCwdProject("…/super/sub")` and `detectCwdProject("…/wt/sub")` returned those two different paths. A subdirectory of the worktree submodule stayed on the worktree path.

### A copied repository keeps filing into the original

**File:** `src/scope.ts:143`

**Severity:** MEDIUM. A full copy that includes `.git` is a normal way to try something beside a repo. After `office init`, that copy silently writes into the original project. The banner looks like the legitimate worktree case (same project name, the original path), so it does not read as a failure.

**Scenario:** `office init` in `~/src/app` sets `office.project` to `~/src/app`. Memories are stored under that path. `cp -a ~/src/app ~/src/app-experiment`. An agent started in the copy runs `office begin --by claude` and `office remember`. `detectCwdProject` returns `~/src/app` because the copied config still has that absolute `office.project`, while `repoRoot` for the copy is `~/src/app-experiment`. Notes and work-log entries from the experiment show up as the original project's records.

**How I know:** Reproduced. After `initProject` and a recursive copy, `detectCwdProject(copy)` was the original path and `resolveGitProject(copy).repoRoot` was the copy.

### `office init` again after a move retargets the project and hides old rows

**File:** `src/init.ts:298`

**Severity:** MEDIUM. The data stays in the database, and `office list` can still show it. Project-scoped reads and briefings stop returning it. Recoverable by putting the old path back in `office.project`. Easy to miss: the command is documented as confirming that a project is already linked, and the success line only says the git config was linked.

**Scenario:** `office init` in `~/src/moveme` pins `office.project` to that path. Agents file memories there. The directory is renamed to `~/src/moveme-renamed`. Detection still returns `~/src/moveme`, so existing rows stay visible. `office init` in the renamed directory sees `linkedProject !== repoRoot` and sets `office.project` to `~/src/moveme-renamed`. The next `office begin` and `office context` in that repo search the new path and report nothing recorded.

**How I know:** Reproduced. After `mv` and a second `initProject`, the only action was `linked git config to agent-office`, and `detectCwdProject` changed from the old path to the new one.

### `GIT_DIR` files the cwd under another repo, and `office init` rewrites that repo's pin

**File:** `src/scope.ts:53` and `src/scope.ts:123`; the write is `src/init.ts:299`

**Severity:** MEDIUM. It only happens when `GIT_DIR` is already set in the environment, which is uncommon for an agent shell. When it is set, the wrong project is chosen with no warning, and init can change another repository's config.

**Scenario:** Repo `~/src/a` has `office.project=/stable/pin/a`. Repo `~/src/b` is a different project. The shell has `GIT_DIR=~/src/a/.git`. `office remember` run in `~/src/b` stores the memory under `~/src/a`, because `git -C ~/src/b rev-parse` prints `~/src/b` as the toplevel and `~/src/a/.git` as the common dir, and the common dir's parent wins. `office init` in `~/src/b` reports success, writes `AGENTS.md` into `b`, and sets `office.project` in `a`'s config from `/stable/pin/a` to `~/src/a`. `b`'s config is unchanged.

**How I know:** Reproduced with `GIT_DIR` set to the other repository. The same `git -C` invocation showed the split toplevel and common dir. Without `GIT_DIR`, `~/src/b` detected as itself.

## What is solid and should stay

Ordinary linked worktrees share the main checkout's path, including `office init` run from the worktree: the pin and later detection both stay on the main root. The same holds for a subdirectory of that worktree. Bare-repo worktrees and `--separate-git-dir` checkouts are covered by the tests and follow the same rule.

A named session that runs a command in a different repository files that command under the folder it is in and says so on stderr. A begin with no `--by` does not retarget the shared unnamed slot. Author is still only what this call declared.

`office init` looks before it writes. It refuses `$HOME`, a folder inside another repository (including through a symlink into that repository), the office checkout's subfolders, a bare repo, and a `.git` directory. It does not write through an `AGENTS.md` symlink, does not create `.claude/skills` when `.claude` points outside the repo, does not replace a `skills` file reached through an in-repo link, and does not add ignore rules that would hide a user's `CLAUDE.md`.
