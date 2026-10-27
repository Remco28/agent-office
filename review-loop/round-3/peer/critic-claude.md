# Pass 1 critic (Claude subagent; ran git experiments in scratch)
Q1 MED: a 5000-folder budget refusal falsely refuses ordinary not-yet-git projects (venv, vendor, datasets, build); pip -e git+ clones in venv/src count as nested repos. Q1 MED: descending into folder links walks ancestors (`up -> ../..`), /usr, network mounts; simpler: test a link's target for .git, never descend. Unclear whether a harness started via ~/Projects/api -> ~/code/api reads ~/Projects/CLAUDE.md (Node's cwd is the real path).
Q2 LOW-MED confirmed: checkout-path fallback gives one submodule two keys when a branch moves it (mid vs libs/mid); name-based gives one. Accept as residue. Q2 LOW: require <G>/worktrees/<n>/gitdir to exist (a real folder named worktrees matches the regex); stale core.worktree after a manual worktree move → relative path escapes → fall back to the name key.
Q3 holds.
Q4 MED: `ln AGENTS.md CLAUDE.md` (hard link, for Windows-safe identical names) would be refused; allow nlink 2 when CLAUDE.md is the same inode. Checking CLAUDE.md's link count is unneeded (never written).
Outside the plan, LOW: a git-tracked folder of projects skips the nested check (accepted: superprojects must pass).
