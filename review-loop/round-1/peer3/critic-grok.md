# Plan v3 critic — Grok (grok-4.7, fresh). Saw: fix-plan-v3.md, LEDGER.md, repo copy r1/grok.

I'll read the fix plan, the ledger, and the code the plan changes, then check each item against a concrete failure.The plan and ledger are in. Next I’ll read the scope, session, init, and CLI paths each item depends on.The v3 changes hang on git’s real answers for bare repos, separate git dirs, and exclude rules. I’ll check those against git 2.55.The precedence change in A1 fixes the mis-filing. The new mismatch note does not. It tells the agent the write went to the folder in the case where an explicit project flag sent it somewhere else. The git-key rules in A3 and the directory exclude pair in B2 match git 2.55. Two of the new claims do not.

## A1. Folder beats the remembered project

The order fixes F1 and F13. This call's `--project` or `OFFICE_PROJECT`, then the folder, then the remembered row, with the folder passed to `briefing` separately so `project_source` is `"folder"`. A named `begin` stores the folder. An unnamed `begin` does not, so two unnamed agents in two repos stop retargeting the shared slot. In the office checkout and in a non-repo folder the folder is empty, so the remembered project still applies (rule 4, decision 4).

The [v3] note does not. It fires when the folder differs from the caller's own row, and the text says the write was filed under the folder. Explicit project wins, so that sentence is false whenever `--project` or `OFFICE_PROJECT` is set.

`claude-1` began on repo B, so the row is B. From repo A the agent runs `office remember --project /repo/B "decision"`. The memory is stored on B. The note says it was filed under A and that the session began on B. The agent then "corrects" a write that was already on B.

Same lie if a launcher exported `OFFICE_PROJECT` to the row's project while the shell is sitting in another repo. Compare the project actually used, and only after it came from the folder. On `begin`, compare to the row from before this call writes. A named `begin` stores the folder, so a comparison after `setActive` never sees the switch. The retargeting command is the one that stays silent.

The test note is wrong. `tests/init.test.ts:143` (begin inside a worktree, no `--project`) should expect `"folder"`. `tests/cli.test.ts:60` should stay `"active"`: that read runs with no `--project` from the office checkout, where the folder contributes nothing. Line 65 is an explicit `--project` and must stay `"declared"`. Turning the checkout into a folder project to satisfy that note would break rule 4.

What this changes on purpose: a later command in repo A no longer stays on B after `begin --project B`. Decision 6 asks for that, and the note is what makes it visible. It does not break ordinary single-repo use.

Docs are short of decision 6. The plan rewrites the inheritance sentence and drops "targeting another repo", and leaves both of these in place:

- `AGENTS.md` still says "You were started here on purpose. This is the doorway, not the destination."
- `README.md` still says "You start every agent in this repository on purpose" and "Nothing is inferred from the working directory."

Those are the sentences that contradict decision 6. The README edit list only drops the `ln -s` recipe.

The rest of A1 is the right size. `active_since` is not the notices watermark. `begin` still passes the previous check-in time. That is the same as today when a session changes project. Not a new break.

## A2. Subfolder or symlinked `--project`

This fixes F6. A path inside a checkout becomes `linkedProject` or the repo root. A nested repo or submodule stays itself. The office checkout is special only for inference. The [v3] guards hold: a bare legacy name such as `src` must not be resolved against the daemon's cwd, and the `$HOME` check has to use real paths or a symlink to the home directory bypasses it.

What it breaks: today `--project ~/proj/pkg` is its own key, before this change and in it. After A2 that path reads and writes the repo root, and rows already stored under `~/proj/pkg` match neither the root nor the subfolder. No reconnect is described. That is inherent in the fix, not a reason to add a migration.

## A3. Bare, separate-git-dir, submodule

The key rules hold. Checked on git 2.55:

- A bare repo and a worktree of it share the bare directory. From the worktree, `--is-bare-repository` is false and `core.bare` is true, so the `core.bare` arm is required.
- `--separate-git-dir` leaves `core.worktree` unset. The common dir is the same from the main checkout and a linked worktree. `git worktree list` is the wrong tool here. Its first entry is the git dir, not the checkout. v3 was right to drop it.
- A submodule's `core.worktree` is `../../../sub`. Resolved against the common dir, that is `super/sub`, today's key. Read that from the common dir's config file, not `git config` inside a linked worktree.

The bare refusal does not. The probe runs when `hasGitAncestor` finds nothing or `--show-toplevel` fails, and refuses only a bare repo. `--show-toplevel` also fails in any git directory, where `--is-bare-repository` is false: a normal `repo/.git` (including `repo/.git/objects`) and a separate git dir. `hasGitAncestor` is true for `repo/.git` because the parent contains `.git`, and false for a bare repo and for a separate git dir. `git init` in a bare repo succeeds and creates a nested `repo.git/.git`. The same call inside `repo/.git` or the separate git dir nests a repository in the user's git directory and then writes `AGENTS.md` there. Refuse when `git rev-parse --is-inside-git-dir` is true, before `mkdir` or `git init`.

What the new key breaks: a separate-git-dir checkout is stored today as the checkout path (`repoRoot` falls through to the worktree). After this, the same folder files under the git dir. Old rows stay on the checkout path and no longer match. Normal repos and normal worktrees keep today's key.

## A4. Fewer git calls on reads

This is fine, and it is the right size. One map for the request covers every `matchingProjects` call in a briefing. A map that lives only inside one `matchingProjects` call does not. The handler is async and two agents call at once, so the map has to be request-local (an argument or async context). A module-level map created at the start of the handler and cleared at the end is shared, and the other request can clear it mid-read.

## B1. Never set up a different folder

This is fine. Stopping before `mkdir` and `git init`, naming the worktree rather than the main checkout, and refusing `$HOME` fixes F3 and matches decision 3. The [v3] rule for a target that does not exist yet (real path of the nearest existing parent, plus the remaining name) is what makes the comparison defined. Nothing that works today is lost except the bad outcome: `office init` in a subfolder creating that folder and then editing the enclosing repo.

## B2. Hide from git only init's links

`CLAUDE.md` never excluded fixes that half of F2. The [v3] pair does what the plan says for directories. On git 2.55, `/.claude/skills` then `!/.claude/skills/` hides the symlink, shows a real folder's new `SKILL.md`, and does not hide `sub/.claude/skills`. The same exclude file is the one a linked worktree reads (`git rev-parse --git-path info/exclude` points at the common dir). Dropping the worktree count and the removal logic is fair for a real folder.

It is not fair for a symlink, which is how a skills entry is usually made. The pair hides any non-directory at that path, in every worktree, and nothing ever removes the lines.

Worktree B already has an untracked `.claude/skills` symlink to the user's own skills. `office init` in worktree A creates the office link and appends the shared pair. B's symlink disappears from `git status`. Replacing the office link in the same checkout with the user's own symlink does the same. Rule 7 still breaks. A real directory is the case that was tested. A symlink is the case people have.

Smaller rule-7 version: do not exclude. The links show as untracked. There is no per-worktree `info/exclude` to hide them in only the worktree init just set up.

One leftover: this build already appends unanchored `.claude/skills`, `.agents/skills`, and `CLAUDE.md`. The new block does not match those strings, so it does not cancel them. Any repo already inited with this build keeps F2 until those lines are removed.

## B3. `AGENTS.md` that is a link

This is fine, and smaller than v2. Not reading, writing, replacing, or removing any link fixes F4a (no append through a shared file), F7 (a dangling link is not `readFileSync`'d), and F8 (the office link is no longer replaced while `CLAUDE.md` is left behind). Touching neither link is the consistent outcome. The old-setup warning is the right text, provided "the office's AGENTS.md" is the resolved target, not the raw `readlink` string. A regular file is still appended to only when the section is missing.

## B4. `.claude` / `.agents` that are links

This is fine. Creating nothing when the real path is outside the worktree being set up, or the path is not a directory, or the link is broken, fixes F4b. A link that stays inside that worktree can still receive `skills`. Absent directories are still created.

## B5. Generated text

This is fine. Dropping both paths fixes F9, including the machine path that would have been committed. The JSON result still carries paths. The test belongs on the generated file. The one-repo sentence from A1.5 has to land in this same text. v2's wording alone does not include it.

## B6. Existing `CLAUDE.md` without the startup steps

This is fine. The file is not edited. A warning unless it already has office instructions or an `@AGENTS.md` / `@./AGENTS.md` import fixes F10 as narrowed. Matching a looser substring would suppress the warning for an unrelated mention. The preflight has to stat a dangling `CLAUDE.md` before reading it, which the [v3] "look at both links first" line already requires.

## B7. F11 declined

This is fine. Help text only: a missing folder is created and set up, unless it is inside an existing repository, in which case init stops and names that repository.

## Docs

AGENTS.md's rule 1 reword and the inheritance sentence are required and right. README dropping `ln -s`, telling people to run `office init`, and committing `AGENTS.md` and `CLAUDE.md` fixes the stale setup. The doorway paragraphs cited under A1 are the part decision 6 still does not have an edit for.

## What does not hold

Three [v3] claims should change before code:

1. A1's mismatch note must describe the project actually used, and only when that project came from the folder. The test update should be `init.test.ts:143` to `"folder"`, not `cli.test.ts:60` or `:65`.
2. A3's refusal should be "inside a git dir", not only "bare".
3. B2's pair does not make removal or a worktree check unnecessary. It still hides a user's skills symlink in every worktree.
