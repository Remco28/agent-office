# Plan v3 (claude-9264), after pass 2 (fresh critics Claude, DeepSeek — independent, both
reproduced: H14 half-fixed via init.templateDir; Q2 relative gitdir file; H5 dot rule too wide)

Q1 as v2. Doc line: the check is a few folders down, at setup time only.
Q2 as v2, plus: the worktree gitdir file's path is resolved against `<G>/worktrees/<n>`, then real
path. Main-copy branch keeps today's guard (its `config` must exist). Residue (accepted, stated):
a branch that moves a submodule; a separate-git-dir superproject's fallback root.
Q3 as v2. Residue: a worktree elsewhere of a separate-git-dir home repo is its own project
(`~/.dotfiles`); it swallows nothing.
Q4 as v2, and the append itself opens AGENTS.md with O_APPEND|O_NOFOLLOW, re-reads it through
that descriptor (skip if the marker is there now) and checks its link count with fstat — one
change closing the Q4/H7/H11 windows (a link swapped in after planning).
H5: parent-folder name only when the key's last part is `.bare` or `.git`; a trailing `.git`
dropped otherwise; everything else (`.config`, `.dotfiles`) shown as is.
H7: create with "wx"; on EEXIST re-read: marker there → done, else warn.
H11: link EEXIST with the intended target → done. `.claude`/`.agents` re-inspected right before
mkdir/link; changed since planning → warn and skip.
H10 as v2. H12 narrowed: refuse when `.git` is a link or a file git cannot read; when git says
"dubious ownership", refuse naming safe.directory; an unreadable plain `.git` folder is repaired
by git init as usual.
H14 replaced: no env stripping for templates; after writing, `git check-ignore` on AGENTS.md,
CLAUDE.md and the skills links; warn for each ignored (covers env, init.templateDir,
core.excludesFile, .gitignore).
New (DeepSeek #8): init reports `already_initialized` / "set up" only when AGENTS.md carries the
section (or is the office's own AGENTS.md); otherwise "not fully set up — see warnings".
LOW as v2.
Peer step: pass 3 on the built code (fresh Codex), as in round 2.
