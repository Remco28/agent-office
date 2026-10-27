# Fix plan v1 (claude-9264), for the peer step — no code yet

Context: review-loop round 1 of Gemini's uncommitted `office init` / project-from-folder change
in /home/frank/Projects/agent-office. Findings and audited ratings: review-loop/LEDGER.md.
The owner's decisions are at the end of the ledger. Nobody on this machine has run `office init`
yet (checked every repo under ~/Projects), so nothing already written needs migrating.

## Part A — which project a request is filed under

### A1. Folder beats a remembered project (F1 HIGH, F13 LOW; rule 9)
Problem: `resolveScope` picks `--project` > remembered session row > folder. `begin`/`peek` send
the folder *as if declared*, every other command sends it as `cwd_project`, so the briefing and
the next write can disagree. Unnamed agents share one slot, and `begin` from a folder now
rewrites it.

Plan:
1. New order in `resolveScope`: explicit `--project`/`OFFICE_PROJECT` > **this named session's
   own `begin --project`** > the folder (`cwd_project`) > anything else remembered (this session's
   folder-detected project from an earlier begin, the unnamed slot, the machine's only session).
   Reason for the second rung: AGENTS.md tells agents to `office begin --project ~/Projects/x`
   when targeting another repo; that is a declaration this session made, not "a project
   remembered from an earlier session". Without it, an agent started in repo Y that declared X
   at begin would silently file into Y.
2. To tell the two apart, add a column `project_declared INTEGER` to `session_state`
   (migration like the existing `role` column). `begin` sets it to 1 when the project came from
   `--project`/`OFFICE_PROJECT`, 0 when from the folder.
3. `begin`/`peek` send the folder as `cwd_project`, never as `project`. Server `/begin` passes it
   to `beginSession` and `briefing` the same way other routes do.
4. `beginSession` writes a folder-detected project into a **named** session's row (so a later
   command from a non-repo folder still has something, decision 4), but **never into the unnamed
   slot**: only an explicit `--project` changes the shared unnamed slot. That stops one nameless
   `begin` from retargeting another nameless agent.
5. `project_source` gains `"folder"` for a project taken from the folder (F13).
6. The old `server.ts` comment "nothing is inferred from the working dir" is rewritten.

### A2. A subfolder or symlinked `--project` is the same project (F6 MEDIUM)
Plan: in `normalizeProject`, for a path that exists: take its real path (symlinks resolved), and if
it is inside a git repository, return that repository's canonical project (the same answer
`detectCwdProject` gives for that folder). A path that does not exist, or is not in a repo, stays
as typed (today's behaviour). Exception, both here and in `detectCwdProject`: a repository whose
root is `$HOME` is never treated as a project (a git-tracked home must not swallow every
non-repo folder under it); such a path stays as typed / gives no folder project.
Old rows stored with a subfolder path still match, because `matchingProjects` normalizes stored
candidates the same way.

### A3. Bare, separate-git-dir and submodule layouts (F5 MEDIUM; rule 5)
Problem: the canonical root is `dirname(common dir)` only when the common dir is named `.git`;
otherwise each worktree is its own project, and `init` then pins every worktree to the one it ran in.
Plan: when the common dir is not named `.git`, ask git for the main worktree
(`git worktree list --porcelain`, first entry). If that entry is a real worktree, it is the canonical
root. If it is `bare`, use the bare repository's own path (the common dir) as the key, with its
trailing `/.git` or `.git` suffix kept — it is the one path every worktree shares. `init` writes
this canonical value, which is now the same from every worktree, so re-running init anywhere no
longer flips it.

### A4. Fewer git calls on reads (F12 LOW)
Plan: cache `normalizeProject` results in the daemon per input string for 60 seconds. Cheap and
local; stale for at most a minute after a repo is created or moved.

## Part B — what `office init` does to files

General shape change: init first **looks** at everything, then decides, then writes. Anything it
will not do becomes a `warnings` entry (returned in JSON, printed on stderr) instead of an action
or a crash. This also fixes the half-done setup on a crash (F7).

### B1. Never set up a different folder from the one named (F3 MEDIUM; rule 1; decision 3)
Plan: find the nearest existing folder at or above the target. If it is inside a git repository
whose top folder is not the target itself, stop with an error that names that repository: "X is
inside the git repository Y. To set up Y, run `office init Y`. To make X its own project, run
`git init X` first." This also covers running `office init` from a project's subfolder. Refuse
always when the folder that would be set up is `$HOME` (today only the named folder is checked).
A worktree's own top folder counts as "the target itself".

### B2. Hide from git only what init made, only at the top (F2 HIGH; rule 7)
Plan: exclude entries become anchored (`/CLAUDE.md`, `/.claude/skills`, `/.agents/skills`), and an
entry is added only when that path is, after init, a link init made (skills links to the office
skills folder; `CLAUDE.md` link to `AGENTS.md`). A user's own file or folder at that path is never
excluded. Adding an exclude entry counts as an action, so `already_initialized` stays honest.

### B3. AGENTS.md that is a link (F4a MEDIUM, F7 LOW, F8 LOW)
- A link to the office's own `AGENTS.md` (the old README setup): replaced by the generated file
  (today's behaviour), **and** a `CLAUDE.md` that links to the office's `AGENTS.md` or `CLAUDE.md`
  is replaced by a link to the project's `AGENTS.md`, so Claude and Codex read the same thing.
  Both reported as actions.
- Any other link, including a broken one: never read or written through. Warning: "AGENTS.md is a
  link to <target>; init did not change it. Add the Agent Office section there yourself, or
  replace the link with a file and rerun."
- A regular file: append the section if missing (today's behaviour).

### B4. `.claude` / `.agents` that are links (F4b MEDIUM)
Plan: if `.claude` or `.agents` is a link, or not a folder, init does not create anything inside
it; warning names it. If absent, it is created (today's behaviour).

### B5. The generated text (F9 MEDIUM)
Plan: drop the path. The line becomes "This repository (`<name>`) uses **Agent Office**, the
shared working memory for agents on this machine." No absolute path anywhere in generated text.

### B6. An existing CLAUDE.md without the startup steps (F10 LOW)
Plan: do not edit it; warning: "CLAUDE.md exists and has no Agent Office startup steps, so Claude
agents here will not see them. Add `@AGENTS.md` to it, or the section itself." (`@AGENTS.md` is
Claude Code's import syntax.)

### B7. F11 declined: the help text says a missing folder is created and set up.

## Docs
- AGENTS.md: "This file belongs only in folders that should use the office. Never in `$HOME`." →
  "AGENTS.md goes in each project that uses the office, and never in the home folder itself."
- README setup section: replace the `ln -s` instructions with `office init`.

## Tests
One test per item above, each failing on the current code first.

## What I am least sure of
- A1's second rung (own `begin --project` beats the folder). Is that what "remembered from an
  earlier session" should exclude, and is a new column the smallest way?
- A2: realpath + "anything inside a repo is that repo" — could it merge things that should stay apart?
- A3: the bare-repo key.
- B1: stopping when run from a project's own subfolder may annoy; is the message enough?
