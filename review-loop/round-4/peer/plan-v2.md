# Plan v2 (after critic Claude + blind solver DeepSeek; they agree on the approach)
J1: hasGitAncestor resolves the real path first (one place, every caller incl. init's post-git-init
lookup); init's mkdir and `git init` use the real target it checked.
J2: main copy used only when its config has core.worktree; otherwise the fallback. Known gap (same
root as J3): a separate-git-dir superproject's fallback root is its git folder.
J4: plan records each harness folder's real path. At write time: a planned-missing folder is made
without `recursive` (EEXIST → changed, skip, warn); an existing one must still have the planned
real path (else skip, warn); the skills link is made at `<recorded real folder>/skills`.
J5: wording "changed into a link or gained another name".
Disposition audit: J1 raised to HIGH.
