I'll review project-key detection and `office init` file safety by reading the change, then building git layouts under the temp experiment directory and running them.The project-key and init code is in place. Next I’ll build the git layouts under the temp directory and compare the keys and writes.Two project-key bugs and one init bug showed up when the layouts were built and run. Ordinary repos, linked worktrees, and submodules in a normal superproject stay on one key.

## `office init` plants a second repository through a symlink

**Severity: HIGH.** `office init` is supposed to refuse a directory that already belongs to a repository. Given a symlink that points below a repository root, it does not ask git, prints success, and creates a nested `.git` in that tree. Later git commands and office records in that directory use the new repository. The parent status only shows the new office files as untracked, so the extra repository is easy to miss.

**Where:** `src/init.ts:301` calls `resolveGitProject(existing)` on the path as given. `src/scope.ts:105` (`hasGitAncestor`) walks that path’s logical parents and returns before git runs. `existsSync` on `<symlink>/.git` does not see a `.git` that sits above the symlink’s target.

**Scenario:** `proj` is a git checkout with a tracked `src/keep`. `src-link` is a symlink to `proj/src`. `office init src-link` (skills path set, `HOME` and `GIT_CONFIG_GLOBAL` pointed at temp dirs).

**What happened:** Init succeeded: “set up src (…) — initialized git repository…”. `proj/src/.git`, `AGENTS.md`, `CLAUDE.md`, and the skills links were created. `src/keep` was still `hello`. `git -C proj/src rev-parse --show-toplevel` was `proj/src`. `git -C src-link rev-parse` before init had already reported the parent, `proj`. The same thing happens for a new folder under that symlink (`office init src-link/newapp` created `proj/src/newapp` as its own repo). A symlink to the repository root is handled correctly, because `<link>/.git` exists. `cd` into the real directory is also fine, because the process cwd is physical.

**How I know:** Reproduced by running `initProject` on those symlinks.

## A submodule’s key changes when `core.worktree` disappears

**Severity: MEDIUM.** Unusual, and the banner’s project name stays `sub`, but notes filed in the gap stay under the other key after the submodule is restored.

**Where:** `src/scope.ts:160-161`. If `<super>/.git/modules/<name>/config` exists, the key is `configuredRoot` of that file (`src/scope.ts:134-136`). With no `core.worktree`, that returns the git directory itself. The worktree copy’s own `core.worktree` is not used.

**Scenario:** Superproject `dsup` with submodule `sub`, and a linked worktree `dwt` where `sub` is checked out. Both `detectCwdProject` results are `dsup/sub`. In the main checkout, `git submodule deinit -f sub`. The worktree checkout stays.

**What happened:** `detectCwdProject(dwt/sub)` became `dsup/.git/modules/sub`. The module config was still there, without `core.worktree`. The worktree config still had `worktree = …/dwt/sub`. `displayName` is still `sub`. After `git submodule update --init` in the main checkout, both checkouts returned to `dsup/sub`. Anything written during the gap stays under `dsup/.git/modules/sub`.

**How I know:** Reproduced. The same layout without `deinit` keeps `dsup/sub` for the main checkout and the worktree, including when the submodule is initialized in the worktrees before the main checkout.

## `--separate-git-dir`: a worktree submodule’s key does not survive main-checkout init

**Severity: MEDIUM.** This is the ordering the code comments say they handle (no main-checkout copy yet, then the main copy catches up). For a normal `.git` it does. For a separate git dir the two keys differ, and both display as `sub`.

**Where:** `src/scope.ts:162`. The superproject git dir’s basename is not `.git`, and its config has no `core.worktree`, so `configuredRoot` returns the git dir. The fallback key is `<git-dir>/<submodule-path>`.

**Scenario:** `git clone --separate-git-dir=sgd origin swork` (submodule `sub` not initialized). `git worktree add swt`, then `git -C swt submodule update --init`. Later, `git -C swork submodule update --init`.

**What happened:** Before the main init, `detectCwdProject(swt/sub)` was `sgd/sub`. After it, both `swork/sub` and `swt/sub` were `swork/sub` (`core.worktree = ../../../swork/sub` in `sgd/modules/sub/config`). Notes taken from the worktree in between stay under `sgd/sub`. The superproject checkouts themselves already share one key (`sgd`) for `swork` and `swt`.

**How I know:** Reproduced. A bare superproject’s worktrees did stay on one submodule key (`<bare>/mid/inner` from both worktrees).

## A directory symlink hides the repos under it

**Severity: LOW.** One extra symlink beyond the case the tests cover. Init’s own comment stops at the link. The effect is the one that check exists to prevent: a parent `CLAUDE.md` above several projects.

**Where:** `src/init.ts:141-143`. A symlink is counted only when that path itself has a `.git`. The walk does not enter it.

**Scenario:** `Projects/bundle` → a directory that contains checkouts `api` and `web`. `office init Projects`.

**What happened:** Init succeeded and created `Projects/.git` and `Projects/CLAUDE.md`. Direct children that are repos, and a symlink that points at a repo, are still refused.

**How I know:** Reproduced.

## What held up

Project detection matched across the layouts agents actually use. A normal checkout, its subfolders, and a symlink to the checkout share one key. Linked worktrees share it, including when the worktree path goes through a symlink and when `worktree.useRelativePaths` is set. Bare-repo worktrees share the bare path. A `.git` that is a symlink to a directory with another name shares that git directory. Two clones stay two keys. A submodule and its superproject stay different keys, including `foo/modules/bar` versus `foo/bar`, a submodule’s own linked worktree, and a submodule checked out only in worktrees of a normal superproject (the key stays `<main>/sub` after the main checkout inits it). Nested submodules in bare worktrees agree. A repo at `$HOME`, including one whose git dir lives elsewhere and a worktree of that repo, is not a project. `~` tracks `$HOME` when the process is started with that `HOME`.

These environment variables did not move the key: `GIT_DIR`, `GIT_WORK_TREE`, `GIT_COMMON_DIR`, `GIT_INDEX_FILE`, `GIT_OBJECT_DIRECTORY`, `GIT_NAMESPACE`, `GIT_CEILING_DIRECTORIES`, `GIT_CONFIG_PARAMETERS`, `GIT_CONFIG_KEY_*` / `GIT_CONFIG_VALUE_*`, and a `GIT_CONFIG_GLOBAL` that sets `core.worktree`.

Init left user files alone in the cases that are easy to get wrong. A symlinked or hardlinked `AGENTS.md` was not written through. An append kept a non-UTF8 prefix. A `.git` symlink to a directory of notes was refused and those notes stayed put. A `.claude` symlink pointing outside the tree did not get a `skills` directory. `CLAUDE.md` symlinks were left as they were. `info/exclude` was unchanged. A global exclude and `core.excludesFile` produced a warning that git will hide `AGENTS.md`. A bare directory, a separate git dir, and the office data folder were refused. A linked worktree, a separate-git-dir work tree, and a submodule checkout were accepted, and the files landed in that work tree.
