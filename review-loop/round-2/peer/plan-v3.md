# Plan v3 (claude-9264), after pass 2 (critics: Grok on v1, Claude on v2; DeepSeek gave no verdict —
its run ended in tool calls; it did reproduce the GIT_CEILING_DIRECTORIES case)

Direction: smaller than v2 (P2 loses the new flag and the recursion).

P1. As v2. Moves stay as before Gemini's change (a key is the path); the old rows are read by
naming the old path. Decision for Frank: a re-file command for moved projects (own work item).
Leftover `office.project` lines are inert; not cleaned.

P2. Replaced (Grok MED: the v1/v2 formula changed existing keys for submodules of bare and
separate-git-dir superprojects and anchored on the current directory; Claude MED: the flag prints
nothing, not an empty line). New rule, touching ONLY a submodule checked out in a superproject's
worktree, recognised by its common dir having the shape `<G>/worktrees/<name>/modules/<m>`:
  - if `<G>/modules/<m>` exists (the main checkout's copy of the same submodule), the key is what
    that git dir gives today (its core.worktree): the main checkout's submodule key;
  - otherwise (bare superproject, or the main checkout never initialised it) the key is the
    worktree-independent `<root of G>/<m with "/modules/" read as "/">`, so every worktree of the
    superproject agrees.
Every other layout, including every main-checkout submodule, computes exactly what it does today.
Known, accepted: the worktree's submodule is a separate clone (its own objects) and shares the
main checkout's key — the same logical project, as worktrees do (Claude solver: carve-out).

P3. As v2 (dedupe by real path, no note). Plus: a broken `.claude`/`.agents` link whose target
is inside the repository gets a warning that says broken, not "outside this repository".

P4. As v2's fixed list, plus GIT_CEILING_DIRECTORIES (Grok, reproduced by DeepSeek: a ceiling at
the repo root makes a subfolder look repo-less, and init would then `git init` inside the repo).
GIT_CONFIG_GLOBAL / GIT_CONFIG_SYSTEM stay (users set them on purpose; they cannot set
core.worktree/core.bare for a repo's own config read with --file). One helper wraps every spawn:
scope.ts git(), init's inGitData and git init.

## Pass 3 (fresh Codex critic, on the built code): one detail, fixed by deleting code
The fallback's rewrite of "/modules/" to "/" gave two distinct submodules (`foo/modules/bar`,
`foo/bar`) one key. Now the fallback uses the git folder's path `<m>` unchanged (unique per
submodule). Accepted cost: a NESTED submodule in a worktree whose main checkout never initialised it
gets `<root>/mid/modules/leaf`, which differs from the main checkout's key if it is initialised
there later. P4 holds. Peer step stops: the last pass found only a detail, and the plan shrank
each pass (v1 → v3 lost the new flag and the recursion).
Machine check (read-only): no stored project path on this machine is missing, and no repo under
~/Projects carries an office.project line — nothing is orphaned by P1 today.
