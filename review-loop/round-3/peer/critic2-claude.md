# Pass 2 critic (Claude subagent, fresh; plan v2; git 2.55 experiments in scratch)
MED H14 half: init.templateDir in global config still hides AGENTS.md (reproduced); `--template=` drops wanted hooks. Better: after writing, `git check-ignore` the written files and warn.
MED Q2: with worktree.useRelativePaths the worktree gitdir file holds a relative path (reproduced); resolve it against <G>/worktrees/<n>, then real path. Q2 otherwise held, including name≠path nested submodules (better than today).
LOW-MED Q3/H10: a worktree elsewhere of a separate-git-dir home repo becomes project ~/.dotfiles (swallows nothing; state as residue).
MED H5: the dot rule names ~/.config, ~/.emacs.d as the login name, committed into AGENTS.md; apply the parent rule only when the key is the git folder itself.
LOW: append/re-read follow a link swapped in during the window (milliseconds: includes git init); use O_APPEND|O_NOFOLLOW + fstat link count; mkdir of .claude swapped for a link similar.
LOW H7: the loser of two creates should re-read and count the marker as done. LOW H12: name "dubious ownership" (safe.directory) when that is the cause.
Q1, Q4 hold.
