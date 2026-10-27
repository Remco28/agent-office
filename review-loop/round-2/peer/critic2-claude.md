# Pass 2 critic (Claude subagent, fresh; plan v2; ran git experiments in scratch)
P2 MED: --show-superproject-working-tree prints NOTHING outside a submodule (no empty line), so positional parsing is wrong as written. P2 MED: recursion must use the raw root, not detectCwdProject/normalizeProject (home and office filters), or submodules of a dotfiles repo at ~ lose their key.
P1 holds (LOW): matchingProjects re-normalizes stored candidates at read time, so old worktree / old wt/sub keys fold onto the new key while the path exists; only moved/deleted paths orphan. Suggest listing orphaned keys on this machine to size a re-file command.
P3 holds (LOW): .claude -> missing .agents: warning says "outside this repository", which is false.
P4 holds (LOW): fixed list right; do not blanket-strip GIT_* (GIT_CONFIG_GLOBAL/SYSTEM are deliberate). Hooks calling office still work. Strip must wrap every spawn (scope git(), inGitData, init's two spawns).
