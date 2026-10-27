# Four problems in agent-office's project detection and setup (round 3)

agent-office is a local memory/work-log daemon for coding agents. Every record is filed under a
"project" key computed from the folder an agent runs in. Rule: a repository, its subfolders and all
its git worktrees share ONE key; two repositories never share one; a repository whose checkout is
the home folder is never a project (it would swallow every folder under home). A wrong key is
silent. `office init <dir>` sets a project up (git init if needed, skills symlinks, AGENTS.md,
CLAUDE.md linked to it). It decides everything before writing; it must never write outside the
project or through a link.

Key today: `git rev-parse --show-toplevel --git-common-dir --absolute-git-dir`; common dir named
`.git` → its parent; else by the common dir's config: core.bare → the common dir; core.worktree →
that path; neither (--separate-git-dir) → the common dir. A submodule checked out in a superproject
WORKTREE has common dir `<G>/worktrees/<n>/modules/<m>`: if `<G>/modules/<m>` exists (the main
checkout's copy) its key is used; otherwise `<root of G>/<m>`. Home exception: key == $HOME → none.

Q1. init refuses a folder that holds other repositories (e.g. ~/Projects), because a CLAUDE.md
there is read by every Claude agent in every project under it. The check walks 3 levels, skips
dot-folders and node_modules, and does not enter symlinked folders. `~/Projects/client/team/api`
(4 deep) or `~/Projects/api -> ~/code/api` is missed and init proceeds. Only applies when the
target is not itself inside a repository.

Q2. Nested submodule (`mid` containing `inner`) checked out only in superproject worktrees: the
fallback key is `<root>/mid/modules/inner` (the git folder's path). If the main checkout later
initialises it, its key is `<root>/mid/inner` and everything switches; old notes are no longer
read. (An earlier draft rewrote "/modules/" to "/", which merged two distinct submodules at
`foo/modules/bar` and `foo/bar`.)

Q3. `git init --separate-git-dir=~/.dotfiles ~`: the key is `~/.dotfiles` (the git folder), so the
home exception does not fire and every non-repo folder under home is filed as one project.

Q4. A hard-linked AGENTS.md (a second name of a file outside the repo) is a regular file to lstat,
so init appends the office section to it, changing the outside file. Symlinks are already left alone.
