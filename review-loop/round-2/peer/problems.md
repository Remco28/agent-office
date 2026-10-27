# Four problems in agent-office's project detection and setup (round 2)

agent-office is a local memory/work-log daemon for coding agents. Every record is filed under a
"project", a key computed from the folder the agent runs in. The rule: the folder is the project;
a repository, its subfolders and all its git worktrees must share ONE key; two different
repositories must NEVER share a key. A wrong key is silent: an agent reads another project's notes
or files its work where nobody will find it. Agents run `office` commands in their own shell; the
CLI computes the folder's key and sends it to the daemon. `office init <dir>` sets a project up
(git init if needed, skills symlinks `.claude/skills` and `.agents/skills`, AGENTS.md, CLAUDE.md).

Current key computation (src/scope.ts): one call
`git -C <dir> rev-parse --path-format=absolute --show-toplevel --git-common-dir`; if the common
dir's basename is `.git`, key = its parent; otherwise read the common dir's config: `core.bare`
true → the common dir; `core.worktree` set (a submodule) → that path resolved against the common
dir; else (`--separate-git-dir`) → the common dir. Then, if `.git/config` has `office.project`,
THAT value wins over the computed key.

P1 (serious). `office init` writes `office.project = <computed key>` into `.git/config`. A repo
copied (`cp -a api api-experiment`), restored from backup to another path, or moved/renamed keeps
the old value, so every agent in the copy files under the original project. Rerunning init after a
move rewrites it, and the rows filed under the old key vanish from scoped reads.

P2. A submodule checked out inside a WORKTREE of its superproject gets a different key from the
same submodule in the superproject's main checkout. Measured:
  main:     toplevel sup/sub,  common dir sup/.git/modules/sub,              core.worktree → sup/sub
  worktree: toplevel wt/sub,   common dir sup/.git/worktrees/wt/modules/sub, core.worktree → wt/sub
  (`rev-parse --show-superproject-working-tree` prints sup and wt respectively; empty outside a
  submodule.) These are two separate git repositories on disk (separate object stores).

P3. If `.claude` is a symlink to `.agents` (or the reverse), init plans to create both
`.claude/skills` and `.agents/skills`, which are the same path; the second symlink throws EEXIST
after git init and the first link were written, and AGENTS.md/CLAUDE.md are never written. Init
promises it decides everything before writing, so a failure leaves the folder as it was.

P4. With `GIT_DIR` (or GIT_WORK_TREE / GIT_COMMON_DIR / GIT_INDEX_FILE) set in the agent's shell
to another repository, git answers for that repository, so the folder is filed under it, and init
writes into that other repository's config.
