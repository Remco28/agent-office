# Rule-by-rule

### 1. AGENTS.md goes in each project, never in `$HOME` — **KEPT**

`src/init.ts:196-198` refuses the home folder outright, and `src/init.ts:219-224` refuses a folder inside a repo rooted at home:

```ts
if (target === home) {
  throw new Error("refusing to initialize $HOME — run `office init` inside a project folder");
...
if (enclosing.worktreeRoot === home) {
  throw new Error(`${dir} is inside a git repository at your home folder (${home}); Agent Office never sets up the home folder...`);
```

`target` is compared after `realPath` of the nearest existing ancestor (`src/init.ts:186-188`), so `~`, `$HOME/`, a symlinked home and `.` from `$HOME` all land on the same check. Writes go to `worktreeRoot` (`src/init.ts:243`, `:296`, `:313`), which cannot be `$HOME` without `target === $HOME`. Reproduced: `office init ~/newapp` with `$HOME` a git repo refuses and creates nothing; `office init ~` refuses. (Two non-home placements of AGENTS.md are in findings 1 and 4 — they are not `$HOME`.)

### 2. A name is never inherited — **KEPT**

`src/session.ts:418`:

```ts
// Only ever declared — the remembered name is not borrowed. ...
const author = declaredAuthor ?? null;
```

and the folder may only populate a *named* session's row (`src/session.ts:302-305`):

```ts
const declaredProject = input.project?.trim() ? normalizeProject(input.project) : null;
const folderProject = author && input.cwdProject?.trim() ? normalizeProject(input.cwdProject) : null;
```

So the new folder rung cannot put an unnamed caller's folder into the shared unnamed slot, and cannot lend a remembered author to anyone. Verified end to end: `begin` with no `--by` in a repo writes no session row and its later write carries `"author": null`.

### 3. A project-scoped read never returns another project's memories or work — **KEPT**

Precedence is decided in one place (`src/session.ts:407`) and the filter is the same one used before this change (`scopeClause`/`matchingProjects`), so a folder project is just another value going through it. Two repos, two named agents, plus a stray write, then reads:

- `work` in repoY → only repoY's items (`"read": "project"`, no x-item);
- `context "x-fact"` in repoY → returns only repoY's hits, not `x-fact`.

`scopeClause([])` still means "everywhere notes only" (`src/scope.ts:341-343`), so a folder that resolves to nothing cannot widen a read.

### 4. Started in the agent-office checkout with no `--project`, nothing is inferred — **KEPT**

`src/scope.ts:198-201`:

```ts
const officeRoot = realPath(ROOT);
const canonical = info.repoRoot;
if (canonical === officeRoot && info.worktreeRoot === officeRoot) {
  return null;
}
```

Reproduced in the checkout: `begin --by carol` → `"project": null, "project_source": "none"`, banner "no project linked"; `begin --project .` → the checkout. A subfolder of the checkout also gives `null` (worktreeRoot is the checkout).

### 5. Any other git repo or worktree → canonical repo root — **KEPT** (one deliberate, under-documented exception: finding 4)

`src/scope.ts:172-181` resolves `--git-common-dir`/`--absolute-git-dir` and `src/scope.ts:113-170` covers bare repos, `--separate-git-dir`, submodules, and submodules checked out in a worktree. The test suite exercises all of these (`tests/project-scope.test.ts`), including two submodule paths that differ only by a `modules` segment, and a worktree submodule mapping back to the main checkout. `gitEnv()` (`src/scope.ts:71-87`) strips `GIT_DIR`, `GIT_WORK_TREE`, `GIT_CEILING_DIRECTORIES` and `GIT_CONFIG_*`, so an agent's inherited shell cannot move the project; I reproduced that with `GIT_DIR` pointing at another repo.

### 6. Running `office init` again changes nothing and says it is already set up — **KEPT**

`src/init.ts:390-392`:

```ts
const alreadyInitialized = actions.length === 0;
...
const message = alreadyInitialized
  ? `Agent Office · ${projectName} (${where}) is already set up and linked.`
```

Second run in a repo, in a fresh folder, and in a worktree all return `actions: []`, `already_initialized: true`, and the AGENTS.md bytes are identical. (A concurrent double run is finding 5.)

### 7. init never deletes, overwrites or hides a file the user made — **KEPT**

No `.git/info/exclude`, no `.gitignore`, no `.git/config` write (asserted in `tests/init-safety.test.ts`, and the config is checked for the word "office"). Links are inspected with `lstatSync` and never replaced (`src/init.ts:99-111`, `:255-295`); a link `AGENTS.md` is warned about, never written through; an existing `AGENTS.md` is only ever **appended** (`src/init.ts:368-372`), with the existing bytes preserved (`tail`-based gap calculation, byte-preservation test). CLAUDE.md is only created when missing. The only claim that disagrees with this is in the CLI help — finding 2.

### 8. Plain reads never write — **KEPT**

New read plumbing is `withProjectMemo` (an `AsyncLocalStorage` map, no DB access) and `cwd_project` on `resolveScope`, which only reads. Snapshotting `session_state` around `office peek --by alice-3388` and around an anonymous `office context` showed identical rows and timestamps; `peekSession` returns `current: null` and `claimIdentity`/`pruneSessions` are skipped for `readonly` (`src/server.ts:169-181`).

### 9. `--project` > folder > remembered, remembered only where the folder says nothing — **KEPT**

`src/session.ts:407-414`:

```ts
const project = declaredProject ?? cwdProject ?? remembered?.project ?? null;
const projectSource: ScopeSource = declaredProject ? "declared" : cwdProject ? "folder" : remembered?.project ? "active" : "none";
```

and `beginSession` stores `declaredProject ?? folderProject` (`src/session.ts:305`). Verified: `--project` from inside another repo reports `declared` and no note; a repo beats a remembered project and reports `folder`; the office checkout and a non-repo folder fall back to `active`. `active_since` was correctly tied to the row actually used (`src/session.ts:439-440`), which avoids claiming a check-in time for a project the row does not hold.

### 10. One agent, one repository — **KEPT**

The generated section says it (`src/init.ts:29`), AGENTS.md and README say it, and a stray is told at the moment it writes (`src/session.ts:427-431`):

```ts
const scopeNote = projectSource === "folder" && declaredAuthor && before && before !== project
  ? `filed under ${project} (this folder); this session began on ${before}. ` +
    "One agent works in one repository — to work on that one, start a new agent there"
  : null;
```

printed on stderr by every scoped CLI call (`src/cli.ts:392-398`). Reproduced: alice (began in repoX) writing from repoY → filed under repoY, with exactly that warning.

---

# Findings

## 1. `office init`'s "folder of projects" guard is a three-level, non-symlink scan, but the docs promise it unconditionally — **MEDIUM**

**Where:** `src/init.ts:122-140` (`nestedRepos`, `depth = 3`), called at `src/init.ts:233-240`.

```ts
function nestedRepos(dir: string, depth = 3): string[] {
...
      if (name.startsWith(".") || name === "node_modules") continue;
      const child = join(current, name);
      if (inspect(child).kind !== "dir") continue;      // lstat: symlinked project folders are skipped
      if (existsSync(join(child, ".git"))) found.push(child);
      else if (left > 1) walk(child, left - 1);          // repos deeper than 3 are never seen
```

**Scenario (reproduced).** `~/Projects` holds a project at `~/Projects/work/clients/acme/api` (four levels — e.g. `~/Projects/<client>/<team>/<repo>`), or holds projects as symlinks (`~/Projects/api -> ~/code/api`). Start: no `.git` in `~/Projects`. Run `office init ~/Projects`. The guard finds nothing and init answers:

```
Agent Office · set up Projects (/…/Projects) — initialized git repository, linked .claude/skills,
linked .agents/skills, created AGENTS.md, linked CLAUDE.md -> AGENTS.md.
```

Now `~/Projects/CLAUDE.md -> AGENTS.md` sits above every project under it, so an agent started in `~/Projects/work/clients/acme/api` reads "This repository (`Projects`) uses Agent Office … **One agent, one repository. Work only in this repository**" — office instructions in a project that never opted in, naming the wrong repository. That is the exact harm the check exists to prevent, in the code's own words (`src/init.ts:120`: "its CLAUDE.md would reach every agent under it"). Second consequence: a *new*, not-yet-git project under it can no longer be set up — `office init ~/Projects/newapp` refuses with "inside the git repository /…/Projects … To make it its own project, run `git init /…/Projects/newapp` first". Recovering means `rm -rf ~/Projects/.git AGENTS.md CLAUDE.md .claude .agents`.

**How I know:** reproduced both blind spots (four-deep and symlinked) in a temp tree, and reproduced the follow-on refusal.

**Why MEDIUM not HIGH:** init prints what it did, and the tree is recoverable; the silent part is only the instruction leak to later agents.

**Docs that overclaim:** `README.md:228` ("a folder that holds other repositories (such as `~/Projects`) [is refused]"), `src/cli.ts:139-141`, `AGENTS.md:22`.

## 2. The CLI help says init "never edits a link or file it finds", but it appends to an existing AGENTS.md — **LOW**

**Where:** `src/cli.ts:141-142` vs `src/init.ts:368-372`:

```
                              names it) or holds other repositories. It never
                              edits a link or file it finds, never writes to
```
```ts
} else if (agentsWrite === "append") {
  // Appended, never rewritten: the bytes already there stay exactly as they are.
  ...
  appendFileSync(agentsPath, `${gap}${buildOfficeSection(projectName)}`, "utf8");
```

**Scenario.** A user with a hand-written `AGENTS.md` reads `office help` before running anything, concludes init leaves files it finds alone, and runs `office init`. Twenty-odd lines are appended to their file (bytes preserved, but the file is changed). The help contradicts itself two lines earlier ("adds the startup section to AGENTS.md unless it has one"), so a careful reader is left unsure which is true — and the true rule (append to `AGENTS.md`, never touch a *link*) is the one the other docs state correctly (`AGENTS.md:22`, `README.md:228`).

**How I know:** read in the code; the append is exercised by `tests/init-safety.test.ts`.

Same paragraph, smaller: "Use `--project` only for the agent-office checkout itself or from a launcher" (`src/cli.ts:147-149`) is stricter than the behaviour and than AGENTS.md, which tells an agent started outside any repo to "declare it" with `--project <path>`.

## 3. Without `git` on PATH, every project-aware command dies instead of degrading to "no folder project" — **LOW**

**Where:** `src/scope.ts:89-93` — `Bun.spawnSync` is unguarded:

```ts
function git(args: string[]): { ok: boolean; out: string } {
  gitCalls += 1;
  const proc = Bun.spawnSync(["git", ...args], { stdout: "pipe", stderr: "pipe", env: gitEnv() });
```

**Scenario (reproduced).** An agent launched from a non-interactive service with a PATH that has bun but not git (the exact class of problem `bin/office` already works around for bun, see its `find_bun`). In a repo, `office context "x"` — a plain read — exits 1 with only:

```
Executable not found in $PATH: "git"
```

The same happens for `begin`, `peek`, `remember`, `search`, `work`, `issues open`, and `office init` (which would rather say "install git"). Before this change no CLI command needed git at all. A graceful `null` here (`catch { return { ok: false, out: "" } }`) would leave the command working, scoped to the remembered project or to the everywhere notes.

**How I know:** ran `office context` with a PATH containing only bun, from inside a git repo.

## 4. `office init` will set up a worktree of a home-rooted repo that `begin` can never detect — **LOW**

**Where:** `src/init.ts:219-224` only refuses when `enclosing.worktreeRoot === home`, and `worktreeRoot` is then the *worktree* (`src/init.ts:243`), while `src/scope.ts:203` (`if (isHome(canonical)) return null;`) drops any project whose canonical root is home.

**Scenario (reproduced).** `$HOME` is a dotfiles git repo; `git worktree add ~/dotfiles-wt`. `office init ~/dotfiles-wt` succeeds, writes `AGENTS.md`/`CLAUDE.md`/skills links into the worktree, and reports `project: /home/<user>` ("set up home"). An agent started there runs `office begin --by x` and gets `"project": null, "project_source": "none"`, banner "no project linked … pass --project <path>"; its memories and work are filed unclaimed, not under the project init just claimed to set up. `detectCwdProject(~/dotfiles-wt) === null`.

The code's choice is the safe one (filing under "home" would swallow every untracked folder beneath it), but no doc says so: `AGENTS.md:49` and `README.md:117` promise "Inside any other git repository or git worktree, the canonical repository root is detected automatically", with no home-repo exception, and the help says nothing. A dotfiles repo at `~` is common, so the promise is the part that should change.

**How I know:** reproduced with a home-rooted repo plus one worktree.

## 5. Two `office init` runs at once: one exits with an `EEXIST` error halfway through — **LOW**

**Where:** `src/init.ts:255-295` decides what to create, then `src/init.ts:355-375` creates it, with no lock; `symlinkSync`/`writeFileSync` are unconditional once planned.

**Scenario (reproduced).** Two (or three) processes run `office init` in the same already-git repo with an `AGENTS.md` that has no office section. The winner reports success; the others die with

```
EEXIST: file already exists, symlink '/…/skills' -> '/…/.claude/skills'
```

after `AGENTS.md`/`CLAUDE.md` may already have been written. The project ends up correct and no user file is touched, but a second agent sees an error instead of rule 6's "already set up", and a duplicate office section is possible in the append window (I could not make the duplicate land, only the error).

**How I know:** reproduced with 2 and 3 concurrent processes on the same folder.

---

# What is done well and should be kept

- **Scope is still decided in exactly one place.** `resolveScope` gained one rung and one source value; every endpoint (`begin`, `remember`, `search`/`context`, `work`, `work/open`, `issues/open`) passes `cwd_project` and returns the same `scope_note`. There is no second copy of the precedence rule in `server.ts`.
- **The two asymmetries are deliberate and documented in code:** the project may come from a folder, the author never may (`src/session.ts:340-378`), and the folder never touches the shared unnamed slot (`src/session.ts:297-305`). Both are the right calls and both have tests.
- **Saying it at the moment of the slip.** `scope_note` plus `printScopeNote` on every scoped call is the difference between "a wrong-looking record later" and "an agent told while it can still start a new agent"; `active_since` being suppressed when the row is not the project in use is a nice detail.
- **The git plumbing is careful:** `--git-common-dir` for worktrees, `core.bare`/`core.worktree`/`worktrees/.../modules/...` for bare/separate-dir/submodule layouts, `realPath` before resolution, a `hasGitAncestor` fast path, a per-request memo, and `gitEnv()` stripping every variable that could point git at another repo — with a subprocess test that proves it.
- **`init` looks before it writes**, distinguishes `lstat` link/dir/file/other, never writes through a link, never writes `.git/config` or `.git/info/exclude`, preserves the existing AGENTS.md bytes exactly, refuses `$HOME`, a home-rooted repo, `.git`/bare folders, a folder inside another repo, and a folder holding repos — and prints what it left alone on stderr instead of silently skipping.
- **Docs and generated text agree with the code** on everything except findings 1, 2 and 4: `AGENTS.md`, `README.md`, the CLI help, the generated section and the `docs/sessions-and-notices.md` amendment all state the same precedence, the same one-agent-one-repository rule, the same `--project .` escape for the office checkout, and the same "init again just confirms" promise.
- `bun test` is green: 157 pass, 0 fail.
