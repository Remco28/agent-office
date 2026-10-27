# Plan critic — Grok (grok-4.7). Saw: fix-plan-v1.md, LEDGER.md, repo copy r1/grok.

I'll read the fix plan, the ledger of rules and findings, and the code the plan changes, then judge each item against a concrete failure.The plan and the owner's rules are in. Next I'll check the current resolution and init paths against each item.A1's declared-project pin keeps the bug the rule is about, and B2 still hides a user's file in a second worktree. The rest either fixes what it names, or is bigger than the failure it is aimed at.

## A1. Folder beats a remembered project

The unnamed-slot part is the right fix. The second rung is not.

Rule 9 and decision 4 are: an explicit `--project` or `OFFICE_PROJECT` on this call wins; otherwise the folder wins whenever it is a repo; a remembered project is used only when this folder is not a repo. "Remembered from an earlier session" includes this numbered session's own earlier `begin --project`. Decision 4 does not care how the remembered project was stored.

`project_declared` exists only to put that remembered `--project` back above the folder. With the flag set, this still files under the old project:

1. Monday, from the office checkout: `office begin --project ~/Projects/api --by codex-4821`. The row stores `api` with the flag set.
2. Today the same agent is started in `~/Projects/web` and runs `office remember "ship the export"` (or `office begin --by codex-4821` with no `--project`).

The folder is `web`. The plan still files the memory, and the new begin's briefing, under `api`. That is the high finding, for the way agents actually declare a project.

It also removes a path that already follows the folder. Today `begin` and `peek` send the folder as `project`, so step 2's begin retargets the row to `web` and the briefing says `web`. After the pin, that begin stays on `api`.

The office-checkout workflow does not need the flag. Rule 4 makes `detectCwdProject` return nothing there, decision 4 then uses the remembered project, and `setActive` already keeps a project when this call passes none. A begin in the checkout with no `--project` must keep doing that. If "write the folder project" is implemented as "write null when there is no folder", that begin wipes `api`.

Smaller version, no new column:

- Order: this call's `--project` / `OFFICE_PROJECT`, then the folder, then the remembered row.
- `begin` and `peek` pass the folder as `cwd_project`, and `/begin` passes that into `beginSession` and `briefing`.
- A folder project is written only onto that named session's row, and only when this begin did not pass `--project`.
- The unnamed slot changes only when this call passes `--project`. One nameless begin in a repo then stops retargeting every other nameless agent. Cost, and it is the right cost: an unnamed agent who begins in a repo and later runs a command outside any repo gets no remembered folder project, because there is only one unnamed slot.

Label the folder case `project_source: "folder"`. Rewrite the server comment. In `AGENTS.md`, the line that every later command inherits the project has to match this order: inheritance is what you get in the office checkout and in a non-repo folder, and a repo folder wins over it.

## A2. Subfolder or symlinked `--project`

This fixes a normal repo. `--project ~/Projects/web/packages/app` and a symlink to `~/Projects/web` become `~/Projects/web`, and old subfolder rows follow because `matchingProjects` runs the same normalization. Do that through git's nearest repository, the one `resolveGitProject` already asks git for. The outermost `.git` above a nested repo or a submodule would glue two projects together.

The office checkout is the break. `detectCwdProject` returns null for that checkout on purpose (rule 4: inference must not treat the doorway as the target). The plan says to return "the same answer `detectCwdProject` gives". `office begin --project ~/Projects/agent-office`, which `AGENTS.md` tells agents to run when working on the office, then has no project and the write is unclaimed. Today `normalizeProject` keeps that path. Explicit `--project` has to resolve to the checkout's canonical root. The null return stays only on the inference path.

The `$HOME` exception is right. A git-tracked home must not become the project for every non-repo folder under it, and an explicit path that merely lives under that home stays as typed.

Non-git subfolders of one repo become one project. That is F6, and it is a one-way mix of memories already stored under those subfolder paths.

## A3. Bare, separate-git-dir, and submodule layouts

This item is fine. When the common dir is not named `.git`, the first real entry from `git worktree list --porcelain` is the main worktree of this repository, and every linked worktree of a separate-git-dir repo then shares it. A submodule stays its own project: that list is the submodule's worktrees, not the parent's. Rule 5 does not ask for those to be merged.

The bare key is the common dir, unchanged. Keep a trailing `.git` or `foo.git`. Stripping it collides with a different project that lives at the stripped path, and a bare repo has no single worktree to stand in as the key. If that first worktree path is missing on disk, still use the path; falling back to the worktree you happen to be in splits the project again.

`git rev-parse --show-toplevel` fails inside the bare directory itself. A failed toplevel on an existing bare repo has to stay "this is a repo", not fall through to `git init`.

B1 has to treat "the folder that would be set up" as this checkout's worktree root. After A3 the canonical key for a linked worktree is the main checkout, which is a different directory.

## A4. Cache `normalizeProject` for 60 seconds

A cache removes the repeated git calls inside one `matchingProjects` scan. Sixty seconds is the part that files wrong. `git init` a nested repo at a path that was cached as its parent, then `office remember` within the minute stores the memory under the parent. After the cache expires, later writes go to the nested repo. The memory from that minute stays on the parent.

Smaller version: memoize for the duration of one daemon request. That is the whole of F12. The next command sees the filesystem as it is.

## B1. Refuse to set up a different folder

This fixes F3 for a subfolder of a normal repo, including a subfolder of the office checkout (today `office init src` there is not the early "this is the office" return, so it rewrites the office root). The stop has to happen before `mkdir` and before `git init`. Refusing when the folder that would be written is `$HOME` covers the git-tracked home case the current `dir === home` check misses.

Stopping a subfolder init is decision 3. Today's success on `office init` from `packages/app` becomes an error. The message is enough when Y is the directory init would have written.

That directory is the worktree root, not the canonical project key. From `~/worktrees/web-feat/src`, Y has to be `~/worktrees/web-feat`. If the message names `~/Projects/web`, the user sets up the main checkout, the feature worktree never gets `AGENTS.md`, and the shared `office.project` config already says the repo is linked.

A symlink whose resolved path is that worktree root is the same folder. Comparing the raw symlink string with git's real toplevel refuses a setup that lands on the folder the user named.

## B2. Exclude only what init made, only at the top

Anchors fix the "any depth" half. `/CLAUDE.md` and `/.claude/skills` no longer hide a nested file. Adding a line only when this checkout's path is a link init created, and counting that line as an action, is right for a single checkout. A user's existing file at that path stays unexcluded.

Two holes remain, both rule 7:

- `.git/info/exclude` is shared by every worktree. Init in a feature worktree adds `/CLAUDE.md` because that worktree's `CLAUDE.md` is the new symlink. An untracked `CLAUDE.md` or `.claude/skills` at the top of the main checkout, or of another worktree, drops out of `git status`. Tracked files are unaffected; untracked ones are what F2 is about. Worktrees are a normal way agents use this.
- The line is never removed. Init creates the symlink, writes the exclude, the user replaces the symlink with their own file, and a later init leaves `/CLAUDE.md` in the shared exclude. Their file stays hidden.

Smaller version that actually holds the rule: do not write a shared exclude entry. The symlinks show as untracked. If an exclude line stays, add the anchored line only when `git worktree list` shows a single worktree, and delete that anchored line when this checkout's path is no longer an init-made link.

"A link init made" has to mean created by init. Excluding every `CLAUDE.md` that already points at `AGENTS.md` hides a link the user made themselves.

## B3. `AGENTS.md` that is a link

This item is fine. A link to the office's own `AGENTS.md` is replaced by the generated file, and a `CLAUDE.md` that points at the office's `AGENTS.md` or `CLAUDE.md` becomes a link to the project's `AGENTS.md`, same as F8. Any other symlink, including a broken one, is left unread and unwritten and produces a warning, which is F4a and F7. A regular file is still appended to once. The dangling-link check has to happen before the skills links are created, which is the look-then-write order the plan already states; today the crash is on `readFileSync` after those links exist.

## B4. `.claude` / `.agents` that are links

This item is fine. A symlink or a non-directory is skipped with a warning, so skills are not created in the directory a `.claude` link points at. A real directory still gets the skills link when that path is absent.

## B5. Generated text

This item is fine. Dropping the path removes the machine path and the bug where that path was the project's own root. The startup steps stay. The office is invoked as `office`, which does not need a path in the file.

## B6. Existing `CLAUDE.md`

This item is fine if "has the startup steps" includes Claude's `@AGENTS.md` import and the existing office marker. The warning text tells the user to add `@AGENTS.md`. A file that already has it would warn on every later init, including one that is otherwise already set up. Do not edit the file.

## B7. Help for a missing folder

The decline of F11 matches decision 2. The sentence as planned is wrong once B1 exists. A missing folder is created and git-init'd when no ancestor is a repo. When an ancestor is a repo, init refuses and names that repo. The help has to say both.

## Docs

The `AGENTS.md` wording matches decision 5. Replacing the README `ln -s` recipe with `office init` matches B3 and F8. Keep the sentences that instructions are per project and do not go in the home folder; they sit in the same paragraph as the `ln -s`.

## The four "least sure" points

1. The second rung is not what rule 9 leaves out, and the column is not a smaller mechanism. It is a way to keep a remembered `--project` above the folder. Explicit flags on this call, then the folder, then anything remembered, needs no new column. The office checkout still remembers, because the folder contributes nothing there.

2. It will merge every non-git subfolder of a repo into that repo, including memories already stored under the subfolder path. That is the F6 fix. It must not merge the office checkout into "no project", and it must not merge a nested repo or a submodule into its parent. The home-repo exception is the other merge to avoid, and the plan already has it.

3. The bare key is the common dir, suffix included. A worktree path is the wrong key for a bare repo. Submodules stay separate under the mechanism as written.

4. The stop is what decision 3 asks for, and the message is enough when Y is this worktree's top, with the `git init X` alternative kept. Naming the main checkout instead of the worktree the user is in sends the setup to the wrong tree.
