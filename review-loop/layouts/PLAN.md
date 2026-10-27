# Plan: one simple rule for unusual repos; rename old project keys once

*Review-loop peer step (critics and a blind solver before code). Written 2026-10-27 by claude-9264.*

## The problem, plainly

`src/scope.ts` works out a folder's project key. For a normal repo or any of its worktrees it
uses git's common dir: `<main checkout>/.git` → the main checkout. For every other layout it has
special code: `sharedRoot` → `worktreeSubmodule` (a submodule checked out inside a worktree of its
superproject, with relative gitdir files, deinit and fallbacks) and `configuredRoot` (bare repo →
the repo folder; `core.worktree` → the submodule's checkout; separate git dir → the git folder).
That is about 80 lines, and most of the late review rounds. None of the owner's ~40 projects uses
a submodule, a bare repo or a separate git dir; one uses worktrees, and T3 Code makes more.

Separately, every scoped read calls `matchingProjects`: it lists every distinct project value
ever stored, re-normalizes each one (a git call per value, memoised per request), and also
matches old plain-name keys (`fencing-team-draft-game`, written before "the folder is the
project") by their last path segment. That exists only for old data. On this machine the old
data is 25 memories under 4 plain names, plus 12 records under a subfolder path
(`/home/frank/Projects/payal-paper/review`) that normalizes to `/home/frank/Projects/payal-paper`.

## Decisions already made by the owner (Frank, 2026-10-27)

1. Replace the unusual-layout handling with one rule: if git's common dir is a folder named
   `.git`, the project is the folder holding it (the main checkout, from any worktree);
   otherwise the project is the checkout you are in (`--show-toplevel`). Accepted: a bare repo's
   worktrees, and a separate-git-dir repo's extra worktrees, each become their own project.
2. Rename old project keys once, at daemon start, then delete the code that matched them on
   every read.
3. Keep: worktrees sharing one project; the home-folder rule (a repo whose checkout is home is
   never a project); every safety rule in `office init`.

## The plan

1. `resolveGitProject`: `repoRoot = basename(gitCommonDir) === ".git" ? dirname(gitCommonDir) :
   worktreeRoot`. Delete `sharedRoot`, `configuredRoot` and `worktreeSubmodule`. Keep
   `gitCommonDir`/`gitDir` in the result (init's worktree warning uses them).
2. Results for each layout:
   - normal repos and worktrees: unchanged;
   - a submodule: its own folder (unchanged in the main checkout; inside a superproject worktree,
     its own folder there);
   - a separate git dir: its main checkout (was: the git folder), and each extra worktree its own;
   - a bare repo: each worktree its own (was: the bare folder).
3. One-time key rename, in `openDb`'s migrate step (so it runs at daemon start and in tests),
   for `memories`, `work`, `issues` and `session_state`:
   - A value that is a path and exists: rewrite to `normalizeProject(value)` if that differs
     (subfolder → repo root, symlink → real repo).
   - A plain name (no `/`): if exactly one stored path value has that last segment
     (case-insensitive), rewrite to it; else if `~/Projects/<name>` exists, rewrite to its
     `normalizeProject`; else leave it, and log it (it was only findable by that bare name).
   - A path that does not exist (moved or removed project): leave it.
   - Idempotent; it only looks at distinct values, so it is cheap on every start.
4. `matchingProjects` becomes exact: `[normalizeProject(project)]`. Delete `projectKey`,
   `knownProjects` and the plain-name matching. `looksLikePath` stays only if `normalizeProject`
   still needs it.
5. `displayName`: keys no longer end in `.git`/`.bare` from the new rule; keep it as is (tiny,
   and old stored keys might).
6. Tests:
   - Rewrite the layout tests in `tests/project-scope.test.ts` to the new expectations (bare,
     separate git dir, submodule in a worktree, deinit, nested submodules).
   - Add migration tests: a plain name with one matching path; a plain name with none; a
     subfolder path; a missing path left alone; running it twice.
   - Prove a read no longer calls git once per known project.
7. Docs: the "folder is the project" rule in AGENTS.md and README (bare repos, submodules and
   separate git folders are no longer listed as sharing one project); the scope.ts comments; a
   short amendment in docs/sessions-and-notices.md.

## What I am least sure of

- A plain name typed today (`--project crokinole`) stays a plain key and no longer matches
  `/home/frank/Projects/crokinole` records. Should a bare name resolve to `~/Projects/<name>`
  when that exists, or be left alone?
- Running a migration that calls git inside `openDb`: tests open many temp databases; is the
  cost and the dependency on the real disk acceptable there?
- A separate git dir literally named `.git` somewhere other than its checkout would now be keyed
  by its parent folder.
- The laptop's office may hold its own old keys; the migration runs there when it updates.

## Peer step results (2026-10-27)

Critic (Codex; critic-codex.md) and blind solver (Claude Opus; blind-claude.md) agree on the core.
Taken into the plan:
- Run the rename in `serve()` after `openDb()` and before listening, not inside `migrate()` (the
  desk and tests open databases and should not call git); one transaction; if it fails, log and
  start anyway; a marker so the full pass runs once per database (blind; critic #4).
- `openWork` normalizes its project like every other write (critic #3).
- init's worktree warning only when the project differs from the checkout, so a bare repo's
  worktree is not called "a worktree of itself" (both).
- `normalizeProject` expands `~` with `homeDir()` ($HOME), like the rest of the file (blind).
- A timeout on git subprocesses, so a hung git cannot stall the daemon (blind).
- A test that a scoped read makes at most one git call (blind).
Declined:
- Critic #1 (HIGH), legacy keys under a bare repo or separate git folder path: none exist on this
  machine (checked: no stored key ends in .git/.bare or names a git folder), and the owner uses
  neither layout. They are left and logged as unmapped, which is the plan's rule for anything it
  cannot map.
- A `status` field listing unmapped keys (blind): a log line at start is enough for now.
Open for the owner: what a bare name typed today means. The critic: resolve `--project crokinole`
to `~/Projects/crokinole` when that folder exists (otherwise migrated records vanish for anyone
still typing the name). The blind solver: keep bare names exact. If bare names resolve, the
rename is simply `normalizeProject` on every stored value, plus a log of what stayed.

**Owner's decision on the open question (Frank, 2026-10-27):** the critic's way — a bare name
resolves to `~/Projects/<name>` when that folder exists, in writes, reads and the rename.

## Built, and the fix audit (fix-audit-codex.md)

Dry run on a copy of this machine's database: 5 keys renamed (4 plain names, 1 subfolder path),
none unmapped, no plain-name memory left. Fix auditor (Codex, read-only): every write path
stores the key reads look up; the rename and its marker are one transaction; no caller of the
removed functions remains.
- MEDIUM: a store from another machine holding a bare repo's shared key loses cross-worktree
  reads. Accepted and declined as before (no such layout on either machine).
- LOW: a non-text value in a project column would make the whole rename fail. Fixed: only text
  values are considered.
- LOW: this plan still showed the bare-name decision as open. Fixed (above).
165 tests pass.
