# Blind solver — Claude Opus subagent (problem and decisions only; told not to read the plan). Read-only.

Condensed. Same core plan: repoRoot = `.git` common dir ? its parent : worktreeRoot; delete
sharedRoot/configuredRoot/worktreeSubmodule; matching becomes exact ([normalizeProject(p)], no db);
delete knownProjects/projectKey. Rename in a new module, run in serve() after openDb and before
listening (not in migrate(): openDb is used by the desk and tests and should not call git), one
transaction, try/catch so the daemon still starts, a meta marker so the full pass runs once and
later starts only retry leftovers (no git calls). Plain names: rename only when exactly one
stored path key has that folder name; else leave and log. Also: normalizeProject expands `~` with
homedir() instead of homeDir(); init's worktree warning must not say "X is a worktree of X" for a
bare repo's worktree; a timeout on git spawns; a test that a scoped read makes at most one git call.
Risks: plain names with no or several matches stay reachable only by that exact name; an old name
adopted by an unrelated project with the same folder name; first-start cost on many keys.
