# Fix plan v3 (claude-9264) — after peer pass 2, no code yet

Pass 2: fresh critics GPT (codex) and Claude (round-1/peer2/). Changes from v2 marked [v3].
Direction: smaller again (B2 lost the worktree count and line removal; B3 lost the migration;
A3 replaced a wrong assumption with git's own answer). One question is open for Frank (A1).

## Part A — which project a request is filed under

### A1. Folder beats a remembered project (F1 HIGH, F13 LOW; rule 9)
1. Order in `resolveScope`: this call's `--project`/`OFFICE_PROJECT` > the folder (`cwd_project`) >
   the remembered row (own row; for an unnamed caller the unnamed slot, else the machine's only
   session). In the office checkout and non-repo folders the folder gives nothing → remembered.
   **[v3] Decided by Frank (decision 6): one agent, one repository.** Agents start inside the repo
   they work on and never switch, so a session's own earlier `begin --project` does not beat the
   folder. [v3, Claude] When the folder's project differs from the caller's own row, the response
   carries a note and the CLI prints on stderr: "filed under A (this folder); this session began on
   B. One agent works in one repository — to work on B, start a new agent there."
2. `begin`/`peek` send the folder as `cwd_project`. [v3, Codex] `briefing` takes the folder as its
   own input (not inside `declared.project`), so its `project_source` is `"folder"`.
3. What `begin` stores: this call's `--project`; else for a named session the folder project; else
   nothing. The unnamed slot changes only on an explicit `--project`. Office-checkout `begin` with
   no `--project` keeps the stored project.
4. `project_source` gains `"folder"`; `active_since` only when the project in use is the row's.
5. Docs (decision 6): AGENTS.md drops "or targeting another repo" from the `begin --project`
   example; `--project` is for working on agent-office itself and for launchers
   (`OFFICE_PROJECT` only in a launcher — agent shells don't keep env vars between commands). New
   convention in AGENTS.md and in init's generated section: work only in the repository you were
   started in; if asked to work in another, suggest starting a new agent there. The inheritance
   sentence says the project comes from the folder, and is remembered only for the office
   checkout and non-repo folders.

### A2. Subfolder or symlinked `--project` (F6 MEDIUM)
Unchanged from v2, plus [v3, Claude] keep the "looks like a path" guard before touching the disk,
so a bare legacy name like `src` is never resolved against the daemon's folder; [v3, Codex] the
`$HOME` check compares real paths.

### A3. Bare, separate-git-dir, submodule layouts (F5 MEDIUM; rule 5)
[v3, Claude — git 2.55 output checked] When the common dir is not named `.git`:
- `git rev-parse --is-bare-repository` true, or `core.bare` → the key is the common dir (`repo.git`).
- else `core.worktree` set in the common dir's config → resolve it against the common dir; that is
  the main checkout (a submodule gives `super/sub`, exactly today's key).
- else (separate-git-dir: git keeps no record of the main checkout) → the common dir path. Same
  from every worktree. The banner names it.
[v3, Claude, Codex] Bare detection does not depend on a `.git` entry: when `hasGitAncestor` finds
nothing, or `--show-toplevel` fails, `init` (and only init) asks `git rev-parse --git-dir` before
any `mkdir`/`git init`, and refuses inside a bare repository ("run init inside a worktree").

### A4. Fewer git calls on reads (F12 LOW)
[v3, Claude] One memo map per HTTP request in the daemon (created at the top of the handler,
dropped at the end), shared by every `matchingProjects` call in that request. Never stale.

## Part B — what `office init` does to files
Look at everything first (including [v3, Codex] both AGENTS.md and CLAUDE.md links, the bare probe,
`.claude`/`.agents`), then decide, then write. Things init will not do are `warnings`.

### B1. Never set up a different folder (F3 MEDIUM; rule 1; decision 3)
As v2. [v3, Codex] For a target that does not exist yet, compare using its nearest existing
parent's real path plus the remaining name.

### B2. Hide from git only init's links, only at the top (F2 HIGH; rule 7)
- `CLAUDE.md` never excluded (commit it with AGENTS.md).
- [v3, Codex found the gap; pattern tested with git 2.55] Each skills link gets a pair of lines:
  `/.claude/skills` then `!/.claude/skills/` (same for `.agents`). git hides the link (a link is not
  a folder) but the second line un-hides it whenever it is a real folder — so a user who replaces
  the link with their own skills folder, in this or any other worktree, at any time later, sees it
  in `git status`. Tested: link hidden; real folder with a new SKILL.md visible; a nested
  `sub/.claude/skills` link visible.
- Lines go in a marked block (`# agent-office init`), added only when this run created a link.
  [v3] No worktree count and no removal logic needed: the pair can never hide a user's folder.

### B3. AGENTS.md that is a link (F4a MEDIUM, F7 LOW, F8 LOW)
[v3, Claude ×2: smaller, keeps rule 7] **Any** link — to a shared file, broken, or the old README
setup's link to the office's own AGENTS.md — is never read, written, replaced or removed. Warning
names the target. For the old setup the warning says both files still point at the office's full
AGENTS.md (so Claude and Codex read the same thing) and how to switch to a project file if wanted.
F8's complaint was the inconsistency; touching neither link removes it.
Regular file: append the section if missing.

### B4. `.claude` / `.agents` that are links (F4b MEDIUM)
As v2; "the repository's real top folder" = the worktree being set up.

### B5. Generated text (F9 MEDIUM)
As v2. Test the generated file (the JSON result rightly carries paths).

### B6, B7, Docs: as v2. README: drop the `ln -s` recipe; set up with `office init`; commit AGENTS.md
and CLAUDE.md.

## Tests (each must fail on the current code first)
As v2, plus: [v3] separate-git-dir + worktree share a key; submodule key unchanged from today;
`office init` inside a bare repo refuses and writes nothing; user replaces an init-made skills link
with a real folder → visible in `git status`, also from a second worktree; legacy AGENTS.md link
left untouched + warned; mismatch note when folder ≠ own row. Update tests/init.test.ts:143 and
tests/cli.test.ts:60/65 for "folder".
