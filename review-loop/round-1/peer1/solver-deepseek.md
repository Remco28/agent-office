# Blind solver — DeepSeek (opencode deepseek-v4.1-flash-free). Saw: problems-only.md, LEDGER rules + decisions, repo copy r1/opencode. Did not see fix-plan-v1.

I'll start by reading the materials.
## A1 — A folder-guessed project beats/doesn't match a remembered one, and is labelled "declared"

**Fix (4 small edits, one rule).**
1. `src/session.ts:373` — change the precedence to `declaredProject ?? cwdProject ?? remembered?.project ?? null`. That is rule 9 exactly; decision 4 still holds because `cwdProject` is null when the folder isn't a repo.
2. `src/session.ts:114` — add `"detected"` to `ScopeSource`, and at `session.ts:388-394` return `"detected"` (not `"declared"`) for the `cwdProject` branch. This is F13, and it must not be folded into the order change.
3. `src/cli.ts:480` — `begin`/`peek` stop sending the folder as `project`; they send `project: declaredProject(opts)` **and** `cwd_project: detectCwdProject()`, like every other command already does.
4. `src/server.ts:176-215` (`/begin`) — read `cwd_project` from the body too. Pass only the *declared* project to `beginSession`/`peekSession` unless the caller named an author; pass both declared and detected into the briefing so the banner, `project_source`, memories, open work and notices are computed from the same scope as the next write (add `cwdProject` to `briefing`'s `declared` option at `session.ts:556-570`).

The write rule, stated plainly: **a guessed project is never written into the unnamed slot.** A nameless `begin` from a repo folder writes no row at all (`beginSession` already declines to write when project/author/role are all null, `session.ts:288`), so scenario B disappears. A *named* agent still gets the folder recorded (`sessionProject = declaredProject ?? (author ? cwdProject : null)`), which is what keeps decision 4's convenience: begin in a repo, then work from a non-repo scratch folder, and the remembered project still applies. With the folder now first in precedence, that write can no longer override the folder anywhere else.

While there: `active_since` should be `null` when `project_source === "detected"` unless the remembered row's project equals the reported one — otherwise "active since" describes a different project.

Docs: `AGENTS.md` (start-here block, the `office begin --project ~/Projects/the-thing` line) must say that targeting another repo means passing `--project` on every call or `export OFFICE_PROJECT=<path>`, because with rule 9 in force the folder otherwise wins on the next command.

**Cost.** ~25 lines plus tests. Touched: `tests/init.test.ts:143` (`"declared"` → `"detected"`), plus new cases: folder beats remembered; a nameless begin in a repo leaves `session_state` untouched; `active_since` null for detected.

**Could break.** Anything parsing `project_source` must accept a new value (docs/agents read it). A direct API caller that sends `/begin` without `cwd_project` gets no folder detection — only the CLI sends it today, so this is a CLI-shaped contract, worth a comment. A named agent that begins in one repo and later runs `office begin --by X` from another repo now records the second (it already did), but every subsequent command in the first repo correctly goes back to the first.

---

## A2 — `--project` on a repo subfolder or a symlinked path splits one repo into two projects

**Fix.** In `normalizeProject` (`src/scope.ts:106-127`): (a) realpath the resolved path before any comparison, inside a `try` (nonexistent paths keep the current behaviour); (b) replace the two narrow rewrites at `scope.ts:118-123` with one rule — if the path has a git ancestor, return `git.linkedProject ?? git.repoRoot`, whatever the path was inside the worktree. Delete the `trimmed === git.worktreeRoot` and `repoRoot !== worktreeRoot` conditions; they are the bug. No new git spawns: the existing code already calls `resolveGitProject` for every path with a git ancestor and then throws the answer away.

Because `matchingProjects` (`scope.ts:213-223`) normalizes both sides, this also heals rows already stored with a subfolder or symlinked key — no migration pass needed.

**Cost.** One `realpath` syscall per normalize call (cached by A4); ~6 lines.

**Could break.** A deliberately separate key for a subfolder (monorepo package, vendored tree) is now the repo — that is the finding, but it is a visible merge: reads start returning the repo's other records. A symlink someone used to keep two identities apart collapses into one. Rows already stored under subfolder keys start answering repo-root reads. The `linkedProject` precedence is unchanged, so a repo whose `.git/config` points somewhere else still resolves there.

---

## A3 — Bare repos, `--separate-git-dir`, submodules: each worktree its own project, and init pins everyone to whoever ran last

**Fix.** `src/scope.ts:67-70`: keep `dirname(commonDir)` when `basename(commonDir) === ".git"`. In every other case, ask git for the main worktree instead of guessing: run `git -C <dir> worktree list --porcelain` and take the first `worktree <path>` line (verified format on this checkout: `worktree <path>` on the first line). `existsSync` that path; if the spawn fails or the path is gone, fall back to `worktreeRoot` as today. That covers bare repos (the bare directory itself is listed, marked `bare`), `--separate-git-dir` (the real working tree is listed), and leaves submodules alone — the submodule's own first worktree is its own directory, so a submodule stays its own project (correct; it is its own repo).

This alone fixes the second half: `init` writes `office.project = repoRoot` (`src/init.ts:170-180`), so once every worktree computes the same `repoRoot`, any worktree writes the same value and nobody gets pinned to a worktree path. No change needed to the config step beyond that.

**Cost.** One extra git spawn, only in layouts where the common dir is not named `.git` (so no regression for ordinary repos, and A4's cache covers repeats).

**Could break.** A stale entry in `worktree list` (registered worktree deleted out of band) would give a missing path — hence the `existsSync` guard and fallback. Bare repos now key by the bare directory, so the project name is `foo.git` unless the name is stripped for display. `office init` run *inside* a worktree still creates `AGENTS.md`/`CLAUDE.md` in that worktree while the config is shared (unchanged, but see B2's residual). This is the fix I could not exercise here without creating repos, so it needs a bare-repo and a `--separate-git-dir` test in the change.

---

## A4 — Every scoped read spawns git once per known project

**Fix.** Memoize in `src/scope.ts`: a module-level `Map<string, string>` keyed by the trimmed absolute input path, filled at the end of `normalizeProject`, capped at ~256 entries with oldest-first eviction. Cache **only** when `hasGitAncestor` was true; the expensive part is the git spawn, and non-repo paths cost a few `existsSync` calls already. Export `clearProjectCache()` for tests. Optionally memoize `resolveGitProject` by directory with the same map and lifetime.

**Cost.** A map plus an invalidation hook; first read after a change still pays 2.5 ms.

**Could break.** The daemon is long-lived, so a repo moved or deleted at a cached path keeps its old key until restart — accepted, and only for a path that *was* a repo. A folder that gets `git init` later is not poisoned, because non-repo answers are never cached. Tests that create repos in temp dirs must call `clearProjectCache()`.

---

## B1 — `office init <dir>` inside an enclosing repo sets up that repo's root, possibly `$HOME`

**Fix.** In `src/init.ts`, between the `officeRoot` early return (`:130-141`) and `mkdirSync` (`:143`): realpath `dir` and `home`; keep the existing `dir === home` refusal on the realpath; then find the enclosing git repo for `dir` — or, if `dir` does not exist yet, for its nearest existing ancestor, so a typo inside a repo can't quietly `git init` a nested repo — using `resolveGitProject`. If the canonical root (A3's `repoRoot`) is not `dir`, throw:

> refusing to set up `<dir>`: it is inside the git repository `<repoRoot>`, so `office init` would write AGENTS.md and the office config there. Run `office init <repoRoot>`, or make `<dir>` its own repository first (`git init <dir>`) if that is what you meant.

When `<repoRoot> === home`, add that the office never puts AGENTS.md in `$HOME` (rule 1). This is decision 3, and the check runs before `mkdirSync`, `git init`, config, links or file writes, so a refusal writes nothing.

Small companion check so A3 doesn't create a regression: if `dir` is itself a git directory (has `HEAD`, `objects/`, `refs/`), treat it as the repo root rather than `git init`-ing inside it.

**Cost.** One extra detection per init (a git spawn only when the folder or an ancestor has `.git`), plus the nearest-existing-ancestor walk; new refusal path and tests (nested folder, git-tracked `$HOME`, `$HOME` itself, subfolder of `$HOME`).

**Could break.** Nested project setups (`office init repo/sub` where `sub` is meant to be its own project) now refuse until the user runs `git init repo/sub`; scripts that relied on attaching to an ancestor fail — intentional per decision 3, and the message names the fix. `office init <bare-repo-path>` works only through the bare-repo check above.

---

## B2 — init hides the user's own CLAUDE.md and skill folders anywhere in the tree

**Fix.** In `src/init.ts`, replace the fixed list at `:229` with entries collected during the run, each anchored to the worktree root:
- `/.claude/skills` only when this run created that link (and its parent wasn't a symlink — see B4);
- `/.agents/skills`, same rule;
- `/CLAUDE.md` only when this run created the `CLAUDE.md` symlink.

Call `ensureGitExclude` only when the collected list is non-empty; keep its "add missing lines, never rewrite" behaviour (`:85-104`). Anchoring makes `/CLAUDE.md` stop matching `src/CLAUDE.md`; "only what we created" makes init stop hiding files it never made. No migration is needed (nobody has run init).

**Cost.** A `createdExcludes: string[]` and two `push` calls; repeat runs add nothing, so rule 6 still holds.

**Could break.** A stale anchored `/CLAUDE.md` remains if the user later replaces init's link with their own file at the root. Worse, `.git/info/exclude` is shared by all worktrees: if init ran in a linked worktree, `/CLAUDE.md` also hides a user's root `CLAUDE.md` in another worktree. The safe mitigation, if you want it in the same change: only write excludes when `worktreeRoot === repoRoot`, and otherwise warn that `CLAUDE.md`/`skills` will appear untracked in that worktree. I'd do that rather than leave the hole.

---

## B3 — AGENTS.md symlinks: writing outside the repo, crashing on a dangling one, migrating the legacy link inconsistently

**Fix.** Make the AGENTS.md/CLAUDE.md handling a **pre-flight classification before any write** (it currently happens after the git-config write, which is why F7 leaves a half-done init). Add two helpers: `resolveLinkTarget(path): string | null` (lstat → readlink → resolve, null when not a symlink) and an `inside(path, root)` check. Then:

- AGENTS.md missing or a regular file: as today (create stub / append section if absent).
- AGENTS.md symlink whose resolved target is `join(officeRoot, "AGENTS.md")` (the old README setup): replace it with the local stub, **and** if CLAUDE.md is a symlink resolving to that same office file, replace it with `CLAUDE.md -> AGENTS.md`. Report both as actions; this is the one symlink init is allowed to replace, because the office itself created it.
- AGENTS.md any other symlink, including a dangling one: never read or write through it. Leave it, skip the append, and add a warning naming the resolved target (or "dangling") and what to do: put the section in that file, or replace it with a regular file and rerun `office init`.
- CLAUDE.md: missing → link to AGENTS.md (today). Symlink to AGENTS.md → fine. Symlink to the office AGENTS.md → handled by the legacy case above. Regular file or any other symlink → leave, warn (B6).

Add `warnings: string[]` to `InitResult`; `cli.ts:402-412` prints each to stderr after the message and they ride along in the JSON. `already_initialized` stays actions-based.

Docs: README `:221-227` currently teaches `ln -s ~/Projects/agent-office/AGENTS.md …` — that is the legacy state this fix migrates; replace it with `office init`. Also fix the stale "nothing is inferred from the working dir" comment at `src/server.ts:189-191`.

**Cost.** ~40 lines, a new result field, a reordering of existing code (no new files, no new spawns). Tests: symlink-to-shared-file untouched + warned, dangling symlink no longer throws and writes nothing, legacy pair migrated together.

**Could break.** A repo using the office's AGENTS.md as a shared file no longer receives the section (warned instead) — deliberate, that is the rule-7 trade. The legacy migration edits symlinks the user may have made themselves; it is limited to links pointing at the office's own file and is reported. Scripts that expected `AGENTS.md` to remain the shared office file break, which is why the README has to change in the same commit.

---

## B4 — `.claude` / `.agents` symlinked outside the repo: init creates `skills` in the outside folder

**Fix.** In the skills loop (`src/init.ts:183-195`), before `mkdirSync(parent)`/`symlinkSync`: if `parent` is a symlink, resolve it. If it is dangling or resolves outside `worktreeRoot`, skip this harness and add a warning — "`.claude` is a symlink to `<target>`, which is outside this repository; not creating `.claude/skills`; link it there yourself if that is what you want." If it resolves inside the repo, or `parent` is a real directory or missing, behave as today. Only push the exclude entry (B2) when the real, non-symlinked parent got the link.

**Cost.** One lstat/realpath per harness dir, one branch, one warning string.

**Could break.** Dotfiles repos that symlink `.claude` to a shared folder no longer get `skills` automatically — but they are told, and they were previously having files created in a folder init was never asked to touch. A `.claude` symlinked to a folder inside the repo keeps working. Where `parent/skills` already exists through the outside link, `isSymlinkTo` returns true and nothing changes.

---

## B5 — Generated AGENTS.md names the project's own path as the office path, and commits a machine path

**Fix.** In `buildOfficeSection` (`src/init.ts:29-53`), change the sentence at `:33` to: "This repository (`<projectName>`) is linked to **Agent Office**." Drop `(${repoRoot})` and drop the now-unused `repoRoot` parameter at both call sites (`:205`, `:214`). Nothing else in the template embeds a machine path — the banner line uses `projectName` only, and `office` is the command, not a path.

**Cost.** Three lines, one fewer parameter. Because the marker makes the section immutable, re-init will not rewrite the old sentence; no migration is needed since nobody has run `init`, but say so in the work note.

**Could break.** Anyone grepping the generated file for the checkout path loses it — the value was wrong; `office status` and the startup banner already name the office.

---

## B6 — An existing CLAUDE.md without the startup steps is left silent

**Fix.** At the CLAUDE.md step (`src/init.ts:221-226`), when CLAUDE.md exists and is not a symlink to `AGENTS.md`, read it (guard with `existsSync` so a dangling link can't throw) and, if `hasOfficeInstructions(content)` is false, add a warning: "CLAUDE.md already exists and does not mention Agent Office. Claude Code reads CLAUDE.md, not AGENTS.md, so add the startup section there (or replace it with a symlink to AGENTS.md)." Change no file. Printed by the CLI as with B3.

Treat a Claude import line (`@AGENTS.md`, `@./AGENTS.md`) as covering it — otherwise every repo whose CLAUDE.md imports AGENTS.md gets a false warning.

**Cost.** One read, one predicate, one warning branch. It repeats on every `init` until the user acts, which is the point.

**Could break.** Nothing in the repo; it is output only. Note that it can co-occur with B3's warning about a non-legacy CLAUDE.md symlink; two warnings for one problem is acceptable but worth wording so they don't contradict.

**Decision 5 (rule 1 wording).** Replace `AGENTS.md:170` with the confirmed wording: "AGENTS.md goes in each project that uses the office, and never in the home folder itself (`$HOME`)." Add one sentence to the init paragraph (`AGENTS.md:22-25`) that init stops and names the enclosing repo when run in a subfolder of one.

---

## The fix I am least sure of, and why

**A1.** The precedence change and the `"detected"` label are not in doubt — they are rule 9 and F13 directly. What I am not sure of is the **write** half: that a *named* agent's `begin` in a repo folder should record that guess in its session row at all. Three readings are defensible and the rules don't decide between them:

- persist the guess for named authors (what I proposed) — keeps decision 4's convenience, but it means the row can hold a project the agent never declared, so the store's "what is this agent working on" is partly inferred;
- never persist a guess — strictly "only declarations are written", making every write depend on the folder or an explicit flag; an agent that leaves the repo silently loses its project (loudly, via the unclaimed warning);
- persist the guess everywhere, including the unnamed slot — which is the current bug.

I chose the first because decision 4 only has meaning if some inferred project gets remembered, and because the folder now beats the row everywhere, so a stale guess can no longer steal a read. But whether a guess may ever be written is Frank's call, not something I can derive from the nine rules, and it decides an observable behaviour (named agent, repo folder, then a non-repo folder). It is also the fix with the widest blast radius: new enum value, a server contract that now carries `cwd_project`, and `active_since` semantics.

Two runners-up: **A3**, because I verified `git worktree list --porcelain` only for an ordinary checkout and bare/`--separate-git-dir` behaviour rests on the documented "main worktree listed first, bare repo listed first" — it needs real tests before anyone trusts it; and **B2**, where anchoring plus "only what we created" fixes the reported harm but still leaves a shared exclude file that can hide a root `CLAUDE.md` in a *different* worktree.
