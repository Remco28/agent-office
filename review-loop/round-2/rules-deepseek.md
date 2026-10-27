# Rules reader — DeepSeek (opencode deepseek-v4.1-flash-free). Saw: repo copy r2/opencode + 10 rules, at c9dad28+0a0f3cd577e8.

I'll start by getting oriented in the repo and reading the change.
Now let me probe some specific scenarios in a sandbox outside the repo.
I have everything I need. The suite passes (140 tests, run with a temp `HOME`), and I reproduced the edge behaviours in `/tmp` without touching the repo.

# Review: folder-based project detection + `office init`

Scope read: `REVIEW-CHANGE.diff` / `git diff` for `AGENTS.md`, `README.md`, `docs/sessions-and-notices.md`, `src/{scope,session,cli,server,init}.ts`, `tests/*`. `bun test` → **140 pass, 0 fail**. All probes below were run against a copy in `/tmp` with `OFFICE_HOME`/`OFFICE_PORT`/`HOME` redirected; the repo was not modified.

## Findings

### 1. `office.project` recorded in `.git/config` outranks the repo root, so a copied/renamed/restored repo files under the original project

**`src/scope.ts:125,143`** (`readGitConfigProject` → `const linkedProject = …`; `const canonical = info.linkedProject ?? info.repoRoot`), written by **`src/init.ts:298-308`**.

**Severity: MEDIUM.** Nothing is lost, but in realistic use (duplicate a project folder, restore it from a backup, rename it) work and memories are silently filed under a different folder's key, and two live projects share one memory and one work log — the exact "wrong project, nobody notices" outcome. It is recoverable (`office init` in the copy re-links it), which is why it is not HIGH. Rule 5 is what it breaks: the canonical root of the *folder* is not what gets detected.

**Scenario (reproduced):**
1. `office init ~/work/app` → `.git/config` gets `office.project=/home/u/work/app`.
2. `cp -a ~/work/app ~/work/app2` (or `mv app app-old` and recreate `app`, or restore a tarball).
3. An agent starts in `app2` and runs `office begin --by claude` → banner says `working on app (/home/u/work/app)` and the session row is stored under `/home/u/work/app`.
4. `office remember "…"` in `app2` stores `memory.project = /home/u/work/app`; `office context` in `app2` returns `app`'s memories; `office work` in `app2` lists `app`'s unfinished items. No `scope_note`, no warning — the folder did decide, it just decided the wrong path.
5. If the original path now holds a *different* project, that project inherits the copy's records.

**How I know:** reproduced. `detectCwdProject(copy)` and `normalizeProject(copy)` both returned the original path; `init` in the copy then reported `linked git config` and switched it to the copy. Note the value is always written as `repoRoot`, so the link buys nothing at write time (it equals the detected root for normal, bare, `--separate-git-dir` and submodule layouts) — it only adds staleness. Dropping `info.linkedProject ??`, or only trusting it when it equals `repoRoot`, would remove the failure.

### 2. `office init` silently skips AGENTS.md when a user's file merely *mentions* `office begin`

**`src/init.ts:58-65`** (`hasOfficeInstructions`: `/\boffice\s+(begin|peek)\b/` and `includes("## agent office")`) with **`src/init.ts:232-236`**.

**Severity: LOW.** No file is damaged; the project simply never receives the startup procedure while init reports success, and `CLAUDE.md` is then linked to an AGENTS.md that says nothing about the office.

**Scenario (reproduced):** a repo's `AGENTS.md` contains `We used to \`office begin\` here but now we do not.` → `office init` prints `set up … — linked git config …, linked .claude/skills, linked .agents/skills, linked CLAUDE.md -> AGENTS.md`, leaving AGENTS.md byte-identical. An agent started there gets no startup steps, and nothing on stderr says AGENTS.md was left alone. The same happens for a stale copy of the *old* instructions ("`office begin --project ~/Projects/the-thing --by …`"), which under the new precedence would override the folder and file work under the placeholder path. README.md and AGENTS.md both claim init "adds the startup section to AGENTS.md".

**How I know:** reproduced (probe above), and read in code.

### 3. `office init` does not expand `~`, so a quoted tilde path creates a literal `~` project tree

**`src/init.ts:145`** (`const dir = resolve(targetDir)…`), reached from **`src/cli.ts:420`** without `normalizeProject` (every other command expands `~` via `decideProject`/`normalizeProject`).

**Severity: LOW** (edge input, annoyance, reported as success).

**Scenario (reproduced):** from `/tmp/x`, `office init "~/Projects/thing"` (quoted, so the shell does not expand) creates `/tmp/x/~/Projects/thing`, runs `git init` there, writes AGENTS.md/links, and prints `Agent Office · set up thing (/tmp/x/~/Projects/thing)`. The user believes the project in their home folder was set up; a stray `~` directory tree is left in the cwd.

**How I know:** reproduced at the function level (`initProject("~/Projects/thing")` → `/tmp/opencode/w2/cwd/~/Projects/thing`); the CLI passes `opts.project`/`rest[0]` through unchanged, so the CLI path is the same code.

## Rule-by-rule

1. **AGENTS.md in every project, never in $HOME — KEPT.** `if (target === home) throw new Error("refusing to initialize $HOME …")` (`src/init.ts:154-156`), plus the `enclosing.worktreeRoot === home` refusal (`init.ts:186-192`), plus `isHome()` (`scope.ts:37-39`) used by detection (`scope.ts:147`). Verified: `$HOME` and a folder under a git-tracked home are refused with nothing created. (The generated AGENTS.md never contains an absolute path — asserted in `init-safety.test.ts:175-182`.)
2. **A name is never inherited — KEPT.** `const author = declaredAuthor ?? null;` and `author_source` in `resolveScope` (`src/session.ts:418-425`); `beginSession` only takes the declared name (`session.ts:296`); `claimIdentity` mints a number per run. The diff adds no author fallback — `cwdProject` is used only for the *project* (`session.ts:303-305`).
3. **A project-scoped read never returns another project's rows — KEPT** in the read machinery: `if (!matches.length) return { sql: " AND scope = 'global'", params: [] };` (`scope.ts:300-302`), `if (!matches.length) return [];` (`work.ts:165-170`, `work.ts:236-241`), and the server picks `project` or `unclaimed`, never "all" (`server.ts:336-338`). Two paths with the same folder name stay apart (`looksLikePath(candidate) && looksLikePath(wanted) → false`, `scope.ts:287`). *Caveat, pre-existing and deliberate:* a legacy bare slug still matches any project with that basename (`scope.ts:284-289`, asserted in `scope.test.ts:17-28`); the read machinery is sound, but finding 1 can hand a read the wrong key.
4. **Office checkout infers nothing — KEPT.** `if (canonical === officeRoot && info.worktreeRoot === officeRoot) return null;` (`scope.ts:144-146`), and `if (isHome(canonical)) return null;` (line 147). `detectCwdProject(ROOT)` is null (tested) and this checkout has no `office.project` key, so the guard is not undermined by finding 1 here. A separate worktree or an explicit `--project .` still resolves to the office, as documented.
5. **Canonical repo root for any repo/worktree — BROKEN in the copied/renamed-repo case** (finding 1): `const canonical = info.linkedProject ?? info.repoRoot;` (`scope.ts:143`). For ordinary use it is correct and well done: `--git-common-dir` (`scope.ts:107-114`) + `sharedRoot()` (`scope.ts:88-95`) give one key for normal worktrees, bare-repo worktrees, `--separate-git-dir` checkouts and submodules (all covered by tests, and I re-ran the bare one).
6. **`office init` again changes nothing and says so — KEPT.** `const alreadyInitialized = actions.length === 0;` and the message `… is already set up and linked.` (`init.ts:334-344`); every action is guarded by a look-first test (`linkedProject !== repoRoot`, `inspect(linkPath).kind === "missing"`, `agentsWrite`). Reproduced: second run returns `actions: []`, `already_initialized: true`.
7. **`office init` never deletes, overwrites or hides a user file — KEPT.** Links are only created at a path `inspect()` calls `missing` (`init.ts:206-226`, `311-316`, `329-332`); AGENTS.md is only created or appended, never rewritten (`init.ts:319-326`); `.git/info/exclude` and `.gitignore` are never written, and the comment at `init.ts:335-337` says why. Probes: AGENTS.md as a symlink (incl. broken, and to the office file), `.claude` as a link outside the repo, a `.git` *file* with garbage, a bare repo, and a `.git` subfolder all left intact or refused before any write; created files show as `??` in `git status`.
8. **Plain reads never write — KEPT.** `readonly` skips `claimIdentity`/`pruneSessions` and `peekSession` only reads (`server.ts:189-210`, `session.ts:332-338`); `briefing` writes nothing, `/health` and the list endpoints are pure reads. End-to-end: `session_state` was byte-identical before/after `office peek --by alpha-1111` and after `office context`.
9. **Precedence — KEPT.** `const project = declaredProject ?? cwdProject ?? remembered?.project ?? null;` with `project_source = declared | folder | active | none` (`session.ts:407-414`). End-to-end: in a repo the folder decided for `begin`, `remember`, `search`, `context`, `work` and `work open`; one request's `--project` still won. `begin` only records a folder for the *named* slot (`session.ts:303-305`), so a nameless `begin` in a repo does not retarget the shared unnamed row (tested).
10. **One agent, one repository — KEPT.** The generated section says it verbatim (`init.ts:36`), as do AGENTS.md, README and the notice; and an agent that strays is told: `projectSource === "folder" && declaredAuthor && before && before !== project` (`session.ts:427-431`), printed by `printScopeNote` (`cli.ts:395-398`) on `begin`, `remember`, `context`/`search`, `peek`, `work`, `work open` and `issue open`. End-to-end stderr: `warn: filed under …/projB (this folder); this session began on …/projA. One agent works in one repository — to work on that one, start a new agent there`.

## Do the texts agree?

Mostly, and the substance (resolution order, worktree rule, "one agent, one repository", what init may touch) matches the code. Three small disagreements:

- **`src/tui.ts:111`** still tells the human "agents name their target with: `office begin --project <path> --by <agent>`" — the old invocation, in the only screen a human sees. (LOW)
- The init-generated first reply is `Working on <project> within Agent Office (<name>).` (`init.ts:46-47`), while AGENTS.md asks for "the active project and your numbered session ID" and quotes the banner `Agent Office · working on <project> (<path>) as <author>`. Two different prescribed sentences.
- README (`office init` "…and links `CLAUDE.md` to it") and the help text ("sets up `AGENTS.md`") omit the "only if missing / otherwise warn and leave it alone" behaviour, and finding 2 shows "adds the startup section" is not always true.

## What is done well and should be kept

The refusal-before-write structure in `initProject` (every decision made before `mkdirSync`/`git init`, so a refusal leaves the folder untouched) and the deliberate refusal to touch `.git/info/exclude` are the heart of rule 7 and are right. Leaving links alone and *naming* them on stderr, including the old office-link setup, is better than silently repairing. The worktree canonicalisation is careful and correct in every layout I tried (normal, bare, `--separate-git-dir`, submodule, symlinked paths), and the per-request `AsyncLocalStorage` memo keeps a briefing to one git call without any cross-request staleness. Protecting the unnamed slot from folder retargeting (`init.test.ts`/`project-scope.test.ts:80-86`) and the `scope_note` on a stray write are exactly the right shape for rules 9 and 10 — the warning arrives at the moment of the write, not in a report afterwards. The banner, `project_source: "folder"`, and the new tests (140 passing) make the behaviour checkable rather than implicit.
