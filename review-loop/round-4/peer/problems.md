# Three problems (round 4) in agent-office's project detection and `office init`

Context: every record is filed under a project key computed from the agent's folder (a repo, its
subfolders and worktrees share one key; two repos never share one). `office init <dir>` sets a
repo up; it decides everything before writing, must refuse a folder inside another repository,
and must never write outside the project or through a link.

J1. `office init <link>` where the link points below a repository's top (`src-link -> proj/src`):
init computes the target's real path for its comparisons, but asks git about the link's own path
(`resolveGitProject(existing)`); the fast pre-check walks the link's logical parents for `.git`,
finds none, so init thinks there is no repository, runs `git init`, and plants a nested repo plus
AGENTS.md/CLAUDE.md inside `proj/src`.

J2. A submodule checked out in a superproject worktree has git dir `<G>/worktrees/<n>/modules/<m>`.
Today: if `<G>/modules/<m>/config` exists (the main checkout's copy), the key is that config's
core.worktree path (the main checkout's submodule folder); else a fallback computed from the
superproject root plus the submodule's path inside the worktree. After `git submodule deinit` in
the main checkout, that config stays but loses core.worktree, so the key becomes the git folder
`<G>/modules/<m>` itself until the main checkout re-inits.

J4. init plans to create `.claude/skills` when `.claude` is a link to a folder inside the repo.
Just before writing it re-checks only that `.claude` is still the same KIND of entry (link). If,
during init, `.claude` is replaced by a link to a folder outside the repository, the check passes
and `skills` is created outside the project.
