# Plan v1 (claude-9264)

Q1. Walk with no depth limit but a budget of 5000 folders; skip dot-folders and node_modules; enter
a folder link too, tracking visited real paths so a loop ends; a folder (or link) containing `.git`
is a repository (stop there, do not descend). Stop at the first 3 found. Budget exhausted with none
found: refuse, saying the folder is too large to check and is unlikely to be one project, and to run
init where the project's files are (or `git init` it first, after which the check does not apply).

Q2. Fallback (no main-checkout copy): key = `<superproject key root>/<checkout path of the
submodule relative to the superproject worktree's top>`. The worktree's top comes from
`<G>/worktrees/<n>/gitdir` (a file holding `<wt>/.git`); the submodule's checkout is its own
core.worktree resolved. For one-level `sub` this is `<root>/sub` as now; nested gives
`<root>/mid/inner`, what the main checkout gives later; `foo/modules/bar` and `foo/bar` stay apart.
Known residue: a --separate-git-dir superproject's root is its git folder, so the fallback is
`<git folder>/mid/inner` while a later main checkout gives the real checkout path: rare^3, accepted.

Q3. No project when the checkout top (`--show-toplevel`) is home, as well as when the key is home
(detection and normalizeProject; init already refuses this).

Q4. AGENTS.md (and CLAUDE.md when read) with more than one hard link: treat like a link — leave it
alone and warn that it is shared with another file.
