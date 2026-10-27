# Round 4 sorting (claude-9264), before the disposition audit

Version c9dad28+8a99de66db06 (round-3 fixes). Readers: Codex = fix auditor (fixes diff only,
read only, did not run office this time), Grok = git-layout / init specialist (built layouts).

| # | Finding | Readers (their rating, how) | Tier | Ours | Reason | Recommend |
|---|---|---|---|---|---|---|
| J1 | `office init <link>` where the link points BELOW a repository's top (`src-link -> proj/src`): init asks git about the link's own path, git finds nothing above it, and init plants a nested repository plus AGENTS.md/CLAUDE.md inside `proj/src`. Same for `<link>/newapp`. | Grok HIGH repro; reproduced by me | 1 | MEDIUM | Unusual input (init on a link into a repo's subfolder); the message says "initialized git repository", so it is visible, and recoverable by removing the new .git. Grok's HIGH rests on "easy to miss"; the parent shows only untracked files. Auditor to judge. | fix: init asks git about the real folder (`realPath`), as detection already does |
| J2 | Main checkout `git submodule deinit` while a superproject worktree keeps the submodule: the main copy's config remains without core.worktree, so the worktree's key becomes the git folder (`dsup/.git/modules/sub`) until the main checkout re-inits. | Grok MED repro; reproduced by me | 1 | MEDIUM | Silent split for the gap; unusual sequence. | fix: use the main copy's key only when its config has core.worktree; otherwise the computed fallback (`dsup/sub`) |
| J3 | Separate-git-dir superproject: a submodule checked out only in a worktree is keyed `<git dir>/sub`; once the main checkout inits it, `swork/sub`. | Grok MED repro | 1 (the residue recorded in round 3, now reproduced) | MEDIUM | Silent split; needs separate-git-dir + submodules + worktrees + that order. Git keeps no record of a separate-git-dir repo's main checkout, so there is nothing to compute it from. No project on this machine uses a separate git dir (checked). | decision for Frank: accept as a known limit (recommended), or key every submodule of such a superproject by its git folder (changes existing keys for that layout) |
| J4 | `.claude` re-check before linking compares only the kind: a link inside the repo swapped for a link outside during init passes, and skills is created outside. | Codex MED read | 1 (read in source) | MEDIUM | Rare timing (profile: MEDIUM). | fix: re-check the real folder equals the planned one and is inside the repository |
| J5 | "AGENTS.md changed into a link while init ran" also covers a hard link appearing. | Codex LOW read | 1 | LOW | Wording. | fix |
| J6 | A link to a folder that holds repositories is not searched. | Grok LOW repro | 1 | LOW | Frank's decision (round 3): the check is shallow; links are not searched. | decline: owner's decision |

Against the predictions: 0 HIGH — held if the auditor agrees on J1 (reader said HIGH). 0–2 MEDIUM
"in appendSection, the .git refusal, worktreeSubmodule's guards" — count wrong (4), place partly
right (J2 worktreeSubmodule; J4 the re-check); J1 is in old code (init's enclosing lookup since
round 1). 1–4 LOW — right (2).
Per-fix: every round-3 fix held under Grok's runs and Codex's read (H1–H14), including relative
worktree paths, hard links, templates, `.git` links, dotfiles at home.
Believed, and wrong: "init compares real folders" (round 1, F3) — the target is compared as a real
path, but the repository lookup still used the path as typed (J1). And "the main copy's config
exists → its key" (round 2) assumed a config always has core.worktree (J2).
