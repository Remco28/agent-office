# Fix plan v2 (claude-9264) — after peer pass 1, no code yet

Pass 1: critics GPT (codex) and Grok on v1; blind solvers DeepSeek and Claude on the problems
alone (round-1/peer1/). Changes from v1 are marked [v2] with where they came from.
Direction: smaller (A1 lost a column and a precedence rung, A4 lost a timed cache).

## Part A — which project a request is filed under

### A1. Folder beats a remembered project (F1 HIGH, F13 LOW; rule 9)
1. [v2, all four] Order in `resolveScope`: this call's `--project`/`OFFICE_PROJECT` > the folder
   (`cwd_project`) > the remembered row (this session's row; for an unnamed caller the unnamed
   slot, else the machine's only session — unchanged). No `project_declared` column: a project
   from an earlier `begin --project` is "remembered" and loses to a repo folder, as rule 9 says.
   In the office checkout and in non-repo folders the folder gives nothing, so the remembered
   project is used (rule 4, decision 4).
2. `begin`/`peek` send the folder as `cwd_project`, never as `project`. `/begin` passes it to
   `beginSession` and to `briefing` (via `declared`), so the briefing and the next write agree.
3. What `begin` stores: this call's `--project` if given; else, for a **named** session only, the
   folder project; else nothing (the row keeps its project — `setActive` already keeps a field not
   passed). The unnamed slot changes only on an explicit `--project`. A `begin` in the office
   checkout with no `--project` keeps the stored project, never wipes it.
4. `project_source`: add `"folder"`. [v2, DeepSeek] `active_since` is reported only when the
   project in use is the remembered row's project.
5. Rewrite the server.ts comment. [v2, Grok, Claude, DeepSeek] AGENTS.md: "every later command
   inherits the project" becomes: inherited in the office checkout and in non-repo folders; inside
   a repo the folder wins; to work on another repo from elsewhere, pass `--project` on each call or
   `export OFFICE_PROJECT`.

### A2. A subfolder or symlinked `--project` is the same project (F6 MEDIUM)
`normalizeProject`: for a path that exists, take its real path; if git reports it is inside a
checkout (git's nearest repo — a nested repo or submodule stays its own), return
`linkedProject ?? repoRoot`. Not existing / not in a repo: as typed (today).
[v2, Grok] The office checkout is **not** special here: an explicit `--project <office path>` (or
a subfolder of it) resolves to the office root. Only folder *inference* returns nothing there.
`$HOME` exception: a repo whose root is `$HOME` is never a project — for `normalizeProject` the
path stays as typed, for inference it gives nothing.

### A3. Bare, separate-git-dir, submodule layouts (F5 MEDIUM; rule 5)
When the common dir is not named `.git`: `git worktree list --porcelain`, first entry. A real
worktree → that path is the canonical root. `bare` → the common dir path, suffix kept (`repo.git`).
[v2, Grok] If that first path is missing on disk, still use it (falling back to the current
worktree would split the project again). Fall back to the current worktree only if the command
fails. [v2, Grok] Inside a bare repo directory itself (`--show-toplevel` fails), it is still a
repo: `init` refuses there ("run init inside a worktree") instead of running `git init`.
`init` writes this canonical value; it is the same from every worktree, so it no longer flips.

### A4. Fewer git calls on reads (F12 LOW)
[v2, Grok] Memoize within one `matchingProjects` call (a local map), not across requests. That
removes the repeated per-candidate git calls inside one read, and nothing is ever stale.

## Part B — what `office init` does to files
Shape: look at everything first, then decide, then write. Anything init will not do is a
`warnings` entry (JSON + stderr), never a crash half-way (F7).

### B1. Never set up a different folder (F3 MEDIUM; rule 1; decision 3)
Before any write (including `mkdir` and `git init`): find the nearest existing folder at or above
the target; if git puts it inside a checkout whose top folder (real path) is not the target's real
path, stop and name [v2, Grok] **that checkout's own top folder** (the worktree, not the main
checkout): "X is inside the git repository Y. To set up Y, run `office init Y`. To make X its own
project, run `git init X` first." Refuse always when the folder that would be set up is `$HOME`.

### B2. Hide from git only what init made, only at the top (F2 HIGH; rule 7)
- [v2, Claude, DeepSeek] **`CLAUDE.md` is never excluded.** The `CLAUDE.md -> AGENTS.md` link is
  relative and works on any machine; it is meant to be committed with AGENTS.md. README says so.
- The two skills links hold an absolute machine path, so they are excluded, anchored
  (`/.claude/skills`, `/.agents/skills`), only when this run created that link.
- [v2, Codex, Grok, DeepSeek] `.git/info/exclude` is shared by every worktree. So the entries are
  written only when the repository has a single worktree; otherwise init adds a warning that the
  skills links will show as untracked here.
- [v2, Grok] init's lines go in a marked block (`# agent-office init`) and init removes its own
  line when that path is no longer an init-made link; lines outside the block are never touched.
- Adding or removing a line is an action, so `already_initialized` stays honest.

### B3. AGENTS.md that is a link (F4a MEDIUM, F7 LOW, F8 LOW)
- Link to the office's own `AGENTS.md` (old README setup): replaced by the generated file, and a
  `CLAUDE.md` that links to the office's `AGENTS.md`/`CLAUDE.md` is re-pointed to the project's
  `AGENTS.md`. Both are actions. (Claude's solver preferred leaving these alone; the other three
  reviewers accept the migration because the office made those links.)
- Any other link, including a broken one: never read or written through; warning names the target.
- Regular file: append the section if missing (today).

### B4. `.claude` / `.agents` that are links (F4b MEDIUM)
[v2, Claude, DeepSeek] If it exists and its real path is outside the repository's real top folder
(or it is not a folder, or it is a broken link), init creates nothing in it; warning names it. A
link that stays inside the repo is fine. Absent → created (today).

### B5. Generated text (F9 MEDIUM)
"This repository (`<name>`) uses **Agent Office**, the shared working memory for agents on this
machine." No path anywhere in generated text.

### B6. Existing CLAUDE.md without the startup steps (F10 LOW)
Not edited. Warning unless it already has office instructions **or** [v2, all] imports AGENTS.md
(`@AGENTS.md`, `@./AGENTS.md`): "Claude Code reads CLAUDE.md, not AGENTS.md — add a line
`@AGENTS.md` to it."

### B7. F11 declined
[v2, Grok] Help text: a missing folder is created and set up, unless it is inside an existing
repository, in which case init stops and names that repository.

## Docs
AGENTS.md: rule 1 rewording (decision 5) and the A1 inheritance wording. README: setup via
`office init`, commit AGENTS.md and CLAUDE.md. server.ts comment.

## Tests (each must fail on the current code first)
A1: folder beats remembered (named and unnamed); begin and the next write agree; nameless begin in
a repo leaves the unnamed slot alone; begin in the office checkout keeps the stored project;
`project_source` "folder". A2: subfolder and symlink `--project` → repo root; explicit office path
resolves; git-tracked `$HOME` not a project. A3: bare + 2 worktrees, separate-git-dir + worktree,
submodule stays separate; init from either worktree writes the same value. B1: nested folder,
git-tracked `$HOME`, worktree subfolder message names the worktree. B2: user's CLAUDE.md (root and
nested) and real skills folder stay visible; second worktree → no entries + warning; replaced link
→ line removed. B3: shared link untouched + warned; dangling → no crash, nothing written; legacy
pair migrated. B4: outside link → nothing created. B5: no absolute path in output. B6: warning,
none when `@AGENTS.md` present.
