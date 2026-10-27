# Fix plan v4 (final, claude-9264) — after peer pass 3

Pass 3: fresh critics Grok and DeepSeek on v3 (round-1/peer3/). Both: no HIGH left; corrections to
mechanics only. Changes from v3 marked [v4]. Direction across passes: smaller every time
(v1 → v4 lost a column, a precedence rung, a timed cache, a worktree count, removal logic, a
legacy migration, and now all exclude lines). Peer step stops here: pass 3 found only details.

## A — which project a request is filed under
A1 (F1 HIGH, F13 LOW; rule 9; decision 6)
1. Order: this call's `--project`/`OFFICE_PROJECT` > folder > remembered row.
2. `begin`/`peek` send the folder as `cwd_project`; `briefing` takes it as its own input; source "folder".
3. `begin` stores: explicit `--project`; else for a named session the folder project; else nothing.
   Unnamed slot changes only on explicit `--project`.
4. [v4, Grok, DeepSeek] Mismatch note: only when the project used **came from the folder** and differs
   from the caller's row **as it was before this call** (for `begin`, the pre-write row). Returned as
   `scope_note` on every scoped response (begin/peek, remember, search/context, work, work open,
   issue open), and the CLI prints it on stderr for every command. Text: "filed under A (this
   folder); this session began on B. One agent works in one repository — to work on B, start a new
   agent there."
5. `active_since` only when the project in use is the row's.
6. [v4, DeepSeek] Tests spawn the CLI with `cwd` set to a temp folder, so they never depend on where
   the suite runs. Expectations: `tests/init.test.ts:143` → "folder"; `tests/cli.test.ts:60` stays
   "active", `:65` stays "declared" (Grok).

A2 (F6 MEDIUM): existing path → real path; inside a checkout (git's nearest) → `linkedProject ??
repoRoot`; office checkout not special for explicit paths; `looksLikePath` guard before any disk
access; a repo rooted at `$HOME` (real paths) is never a project.

A3 (F5 MEDIUM): common dir not named `.git` → `core.bare` true: the common dir; else `core.worktree`
in the common dir's config: resolved against it (submodule → today's key); else the common dir.
[v4, DeepSeek] Detection in a bare repo itself still gives nothing (no `.git` entry); only init acts.
[v4, Grok] init refuses before any write when, at the target or its nearest existing parent,
`git rev-parse --is-inside-git-dir` is true or it is a bare repository: "X is inside a git
repository's own data folder (or a bare repository); run office init in a working folder."

A4 (F12 LOW): [v4, Grok] a memo map created per request and **passed down as an argument** to
`matchingProjects` (not module state — two requests run at once). [v4, DeepSeek] Before any git call,
skip candidates that are not paths or do not exist. Test: a counter on git calls for one briefing.

## B — `office init`
Look first (target, nearest parent, git-dir/bare probe, enclosing repo, AGENTS.md, CLAUDE.md,
`.claude`, `.agents` — all with lstat, nothing read through a link), then write. Refusals throw
before any write; everything else init will not do is a `warnings` entry.

B1 (F3 MEDIUM): refuse when the target (or nearest existing parent + rest) is inside a checkout whose
top folder is not the target; the message names that worktree's top folder and gives both commands
exactly. Refuse when the folder to be set up is `$HOME`.

B2 (F2 HIGH): [v4, Grok, DeepSeek] **init writes nothing to `.git/info/exclude`.** `CLAUDE.md ->
AGENTS.md` is meant to be committed; the two skills links show as untracked (`?? .claude/skills`),
and the init message says so: "add .claude/skills and .agents/skills to your .gitignore if you do
not want to see them". Rule 7 holds absolutely: init can hide nothing. (No repo on this machine was
ever set up by the current build — checked twice — so no old lines to clean.)

B3 (F4a, F7, F8): any AGENTS.md link — shared, broken, or to the office's own AGENTS.md — is left
alone; warning names its resolved target. Regular file: append if missing.

B4 (F4b): `.claude`/`.agents` that is a link outside the worktree being set up, broken, or not a
folder: nothing created in it; warning.

B5 (F9): generated text has no path; [v4, Grok] it carries the one-repository rule (decision 6).

B6 (F10): [v4, DeepSeek] `CLAUDE.md` is checked with lstat first. A link to `AGENTS.md` (init's own,
or the user's) counts as covered. Any other link: warning, never read. Regular file: read; warning
unless it has office instructions or an exact `@AGENTS.md`/`@./AGENTS.md` line.

B7 (F11 declined): help text — a missing folder is created and set up unless it is inside an
existing repository, in which case init stops and names it.

## Docs (decision 5, decision 6) [v4, Grok, DeepSeek: wider than v3 listed]
- AGENTS.md: rule 1 reword; "Start here" and begin examples: agents start in the project repo; drop
  "targeting another repo"; inheritance sentence; the "started here… doorway" and "Ask the human
  which project you are in" passages reworded for the project-repo launch; one-agent-one-repo rule.
- README: drop `ln -s` recipe; `office init`; commit AGENTS.md and CLAUDE.md; the "start every
  agent in this repository" / "nothing is inferred from the working directory" / "inherit the
  project declared at begin" passages.
- `cli.ts` help: begin/`--project` text; init's missing-folder sentence. `server.ts` comment.

## Residuals accepted (say them, don't fix)
- A separate-git-dir checkout's key moves from the checkout path to the git dir (unreleased, no rows).
- A repo copied with its `.git/config` merges into the original via `office.project` (known; not new).
- `begin` watermark after a project change is the previous check-in, same as today.
