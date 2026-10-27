# Rules reader — DeepSeek (opencode deepseek-v4.1-flash-free). Saw: repo copy r1/opencode + the 9 rules, at c9dad28+cf1f4e8014d5. Could write (harness); copy unchanged after except .git/index; it put scratch scripts in /tmp/opencode.

I'll start by examining the repository state and the change under review.
I have enough evidence. Here is the review.

# Review: `office init` + cwd/worktree project detection (uncommitted on c9dad28)

All 114 tests pass (`bun test`, 7.6 s). Findings below were reproduced against a temp `OFFICE_HOME`/`HOME`/port with two temp git repos; nothing in the repo was modified (scratch scripts live in `/tmp/opencode`).

---

## Findings

### 1. The folder loses to the remembered project on every command except `begin`

**`src/session.ts:373`** (with `src/cli.ts:480`)

```ts
const project = declaredProject ?? remembered?.project ?? cwdProject ?? null;
```

**Severity: HIGH.** Every read and write except `begin` resolves the project from the session row *before* looking at `cwd_project`, which is exactly the opposite of rule 9. `begin` is the only command that passes the folder as `project` (`declaredProject(opts) ?? detectCwdProject()`), so `begin` and the very next `work open` in the same folder can disagree, and the disagreement leaves no error — only a `project` field buried in the JSON.

**Scenario (reproduced):**
1. `claude-5835` runs `office begin --by claude` in `project-x` → session row has project `project-x`.
2. The same session runs `office peek --by claude-5835` in `project-y` (a separate git repo). The banner says `Agent Office · working on project-y (...)`, `project: project-y`, because `peek` goes through the `begin` path.
3. Still in `project-y`, it runs `office work open "fix login in Y" --by claude-5835` → `"project": ".../project-x", "project_source": "active"`.
4. `office remember "login uses passkeys in Y"` → also `project-x`.
5. `office work` in `project-y` → `project-x`'s work (`fix login in Y`); `office work` in `project-x` → the same item. `office context` in Y also resolves to X.

So `peek` shows Y's records, and the next write goes into X; the next agent working in Y sees nothing. A same-name session that merely `cd`s into a second repo (or a resumed session that writes before re-running `begin`) has the same outcome. The rule 3 variant is just as real with no session at all: with one named (or one unnamed) session recorded for X, a *nameless* caller in Y is shown X's unfinished work — `office work` in Y returned `{"project": ".../project-x", "items": ["X work"]}`.

**How I know:** reproduced end-to-end against a live `serve()` instance under a temp `OFFICE_HOME`. The existing test `tests/init.test.ts:153` passes only because exactly one session row exists, so the `rows.length === 1` fallback happens to supply the same project; a second session breaks it.

*Mitigation worth weighing:* `work open` does print the project in its JSON, so a careful agent can see the misfiling; but the briefing text for `office work` shows only the project path, not the source, and nothing warns that the folder disagrees.

---

### 2. `office init` excludes the user's own `CLAUDE.md` and `.claude/skills` from git

**`src/init.ts:229`**

```ts
ensureGitExclude(gitCommonDir, [".claude/skills", ".agents/skills", "CLAUDE.md"]);
```

**Severity: MEDIUM.** The comment says this keeps the *symlinks init creates* out of `git status`, but the three paths are written to `.git/info/exclude` unconditionally. If the user already had a real (untracked) `CLAUDE.md`, init still excludes it.

**Scenario (reproduced):** a new repo containing the user's own uncommitted `CLAUDE.md` and `app.ts`; before init `git status` shows `?? CLAUDE.md` and `?? app.ts`. After `office init`, `git status` shows only `?? AGENTS.md` and `?? app.ts`; `git check-ignore -v CLAUDE.md` → `.git/info/exclude:9:CLAUDE.md`. The file is still a regular file, but it is now invisible to `git status` and `git add .`, so those instructions are silently never committed. Same for a real `.claude/skills/` directory the user already had: init correctly skips creating the symlink (`if (!pathExistsOrSymlink(linkPath))`) and then hides the user's directory anyway — after init, `?? .claude/skills/my-skill/SKILL.md` vanished from `git status` while remaining a real directory.

**How I know:** reproduced with `git status` / `git check-ignore` before and after `initProject`.

---

### 3. The `$HOME` guard only matches the folder exactly, so a home-level git repo still gets `AGENTS.md` in `$HOME`

**`src/init.ts:126`**, writing at **`src/init.ts:198`**

```ts
if (dir === home) { throw new Error("refusing to initialize $HOME ...") }
...
const agentsPath = join(worktreeRoot, "AGENTS.md");
```

**Severity: MEDIUM.** `dir` is the path the user named; `worktreeRoot` is the git root that init actually writes into. When `$HOME` is itself a git repository (a common way to keep dotfiles) and `office init` is run in a subfolder, the guard passes, `resolveGitProject` climbs to `$HOME`, and everything is written there.

**Scenario (reproduced):** `HOME=/tmp/.../home`, `git init` in it, then `office init /tmp/.../home/notes-app`. Result: `reported project: /tmp/.../home`, `AGENTS.md in HOME: true`, `CLAUDE.md in HOME: true`, `.claude/skills` in HOME: true; message `Agent Office · set up home (...)`. This is precisely what `install.sh` had to clean up after in the past (`for home_file in "$HOME/.knowledge.md" "$HOME/.AGENTS.md"` … `rm -f`), so it is a configuration the project has already met. It is recoverable and the message names the path, hence MEDIUM rather than HIGH.

**How I know:** reproduced with `HOME` set at process start so `homedir()` returned the repo root.

---

### 4. `office init` writes through — and deletes — user-made `AGENTS.md` symlinks

**`src/init.ts:200-215`**

```ts
if (isSymlinkTo(agentsPath, officeAgentsPath)) { unlinkSync(agentsPath); }
...
const existing = readFileSync(agentsPath, "utf8");
...
writeFileSync(agentsPath, `${existing}${sep}${buildOfficeSection(projectName, repoRoot)}`, "utf8");
```

**Severity: LOW.** A symlinked `AGENTS.md` is not a regular file, but `pathExistsOrSymlink` treats it as one, so `readFileSync` follows it and the append lands in the *target*, which may be outside the repo. Separately, the one symlink init does recognise — the project → office `AGENTS.md` link that `README.md:224` still tells users to create — is `unlink`ed.

**Scenario (reproduced):** `AGENTS.md -> ../shared-agents.md` (a rules file used by several repos). After `office init`, `shared-agents.md` contains `<!-- agent-office --> ## Agent Office …`, i.e. a section naming this one project, in a file the user keeps for all of them; the message says `updated AGENTS.md`. With `AGENTS.md -> .../agent-office/AGENTS.md` (the documented setup), init reports `created AGENTS.md` and the symlink is gone (`isSymbolicLink: false`).

**How I know:** both reproduced; the unlink branch read in code and triggered with the documented symlink.

---

### 5. Canonicalisation is exact-match, so a subdirectory `--project` and a `--separate-git-dir` repo split one repo into two projects

**`src/scope.ts:115-122`** and **`src/scope.ts:67-70`**

```ts
if (git.linkedProject && (trimmed === git.worktreeRoot || trimmed === git.repoRoot)) return git.linkedProject;
if (trimmed === git.worktreeRoot && git.repoRoot !== git.worktreeRoot) return git.repoRoot;
...
const repoRoot = basename(gitCommonDir) === ".git" ? dirname(gitCommonDir)... : worktreeRoot;
```

**Severity: LOW.** (a) `office begin --project .` from `/repo/packages/app` resolves to `/repo/packages/app`, while `office begin` in the same folder detects `/repo`; the two sets of memories and work never meet. `AGENTS.md` tells agents to pass `--project .`. (b) In a repo created with `git init --separate-git-dir=…` (the common dotfiles layout), `basename(gitCommonDir) !== ".git"`, so `repoRoot` falls back to `worktreeRoot`: the main checkout and each worktree become different projects.

**Scenario (reproduced):** `detectCwdProject('/repo/src')` → `/repo`; `normalizeProject('/repo/src')` → `/repo/src`. For `--separate-git-dir`, `detectCwdProject(sep-repo)` → `/…/sep-repo` while `detectCwdProject(sep-wt)` → `/…/sep-wt`.

**How I know:** both reproduced directly against `detectCwdProject`/`normalizeProject`.

---

## Rule-by-rule

| Rule | Verdict | Relied-on code |
|---|---|---|
| 1. `AGENTS.md` per project, never `$HOME` | **BROKEN** (finding 3; exact-path guard only) | `if (dir === home) { throw … }` `src/init.ts:126`; `const agentsPath = join(worktreeRoot, "AGENTS.md")` `src/init.ts:198` |
| 2. A name is never inherited | **KEPT** — the author path is untouched by this diff | `const author = declaredAuthor ?? null;` `src/session.ts:377` (and `mine` is only used for `remembered`, never as `author`) |
| 3. A project-scoped read never returns another project's records | **BROKEN** (finding 1) | `const project = declaredProject ?? remembered?.project ?? cwdProject ?? null;` `src/session.ts:373` — with `remembered` set, the supplied `cwdProject` is discarded |
| 4. Office checkout, no `--project`, infers nothing | **KEPT** | `if (canonical === officeRoot && git.worktreeRoot === officeRoot) { return null; }` `src/scope.ts:91`; verified `detectCwdProject(ROOT)` and `detectCwdProject(ROOT/src)` both `null` |
| 5. All worktrees of one repo are one project | **KEPT** (one LOW edge: finding 5b) | `basename(gitCommonDir) === ".git" ? dirname(gitCommonDir)… : worktreeRoot` `src/scope.ts:67-70`; verified main repo + two worktrees all resolve to `/…/repo`, and `office init` in a worktree records `office.project` in the shared config |
| 6. `office init` again changes nothing and says so | **KEPT** | `const alreadyInitialized = actions.length === 0;` `src/init.ts:231`; second run: `actions: []`, `"… is already set up and linked."` (also verified with a pre-existing `AGENTS.md`) |
| 7. `office init` never deletes/overwrites/hides a user file | **BROKEN** (findings 2 and 4) | `ensureGitExclude(gitCommonDir, [".claude/skills", ".agents/skills", "CLAUDE.md"])` `src/init.ts:229`; `unlinkSync(agentsPath)` / `readFileSync(agentsPath)` + `writeFileSync` `src/init.ts:200-215` |
| 8. Plain reads never write | **KEPT** | `resolveScope` (`src/session.ts:356-398`) only reads `storedSessions`/`normalizeProject`; `peek` stayed read-only (session `active_since` unchanged after `peek`, `context`, `work`, `issues`, `tools`, `skills`, `list`). `detectCwdProject` only spawns `rev-parse`/`config --get`. |
| 9. Explicit `--project` wins; folder beats remembered | **BROKEN** (finding 1) | same line, `src/session.ts:373`; contrast `begin` at `src/cli.ts:480` |

---

## Done well, worth keeping

- **Worktree canonicalisation via `--git-common-dir`** (`src/scope.ts:44-72`) is the right mechanism and works for the T3 Code case, including subdirectories and `office init` run inside a worktree; the shared `.git/config` link is a neat way to make every worktree agree.
- **The office-checkout exclusion** (`src/scope.ts:88-93`) and `initProject`'s early return for the office root are both precise: `begin` from the checkout, or from `src/`, still infers nothing, and `--project .` remains the explicit way in.
- **Idempotency is real**, not just claimed: the action list drives both the message and `already_initialized`, and each step re-checks state (symlink target, marker, git config) before acting. Re-running on a project with a hand-written `AGENTS.md` appends once and then leaves the file byte-identical.
- **`AGENTS.md` is appended, not replaced**, and the "already has office instructions" detection includes the marker and the `office begin|peek` prose, so the pre-existing README symlink workflow is at least recognised rather than double-written.
- **Read-only reads stayed read-only.** Passing `cwd_project` through `resolveScope` is clean; nothing in the read paths updates a session or touches the DB.
- **Naming was left alone.** `author = declaredAuthor ?? null` is untouched, and `cwd_project` never feeds the author or the `project_source` "declared" label in a way that would sign anyone's work to someone else.
- The `office init` CLI path is small and doesn't require the daemon, which is right — a repo has to be set up before `begin` can work in it.
