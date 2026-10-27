# Plan v2 (claude-9264), after pass 1 (critic Codex; blind solvers Claude, DeepSeek; Grok pending)

Pass 1: both blind solvers reached plan v1's P2 and P3 on their own. P4: Codex (MED) and the
Claude solver: four-to-seven variables is not enough, injected config (GIT_CONFIG_COUNT /
GIT_CONFIG_PARAMETERS) can flip core.bare. P1: everyone agrees on dropping the key; Codex (HIGH)
and DeepSeek: a MOVED repo becomes a new project and its old rows are no longer read.

P1. As v1: never write, never read `office.project`. Init does not touch git config. Moves: the
committed office (before Gemini's change) already worked this way — a key is the path — so a
move starting fresh is not new; it is NOT fixed here. The old rows stay reachable by naming the
old path (`--project <old path>`; a path that no longer exists is kept as typed). Decision for
Frank: a separate `office` command to re-file a moved project's rows, as its own work item.
(Rejected: the Claude solver's stored-path copy/move detection — it adds state, guesses intent,
and is exactly the kind of growing plan the method says to take to the human.)

P2. As v1 (key = key(superproject worktree) + relative path, recursive), parsing the combined
rev-parse output by position so the empty superproject line for a non-submodule is kept.
Known, accepted: a branch that moves a submodule to another path gives a new key (same as moving
a repo); a different submodule reused at one path shares a key (same as a repo replaced in place).

P3. As v1, plus: the planned link's real path is computed from the real path of its parent;
dedupe; the second harness dir is simply satisfied (no warning). No write-time backstop: planning
already sees the same path.

P4. Strip, for every git subprocess office starts (detection and init): every variable in git's
own `git rev-parse --local-env-vars` list (GIT_DIR, GIT_WORK_TREE, GIT_COMMON_DIR,
GIT_INDEX_FILE, GIT_OBJECT_DIRECTORY, GIT_ALTERNATE_OBJECT_DIRECTORIES, GIT_CONFIG,
GIT_CONFIG_PARAMETERS, GIT_CONFIG_COUNT, GIT_IMPLICIT_WORK_TREE, GIT_GRAFT_FILE,
GIT_NO_REPLACE_OBJECTS, GIT_REPLACE_REF_BASE, GIT_PREFIX, GIT_SHALLOW_FILE) plus
GIT_CONFIG_KEY_<n>/GIT_CONFIG_VALUE_<n> and GIT_NAMESPACE, written as a fixed list in one helper
(no extra subprocess). GIT_CEILING_DIRECTORIES stays honoured (it can only make detection find
less, never another repo). No warning when a variable is ignored: the folder decides, and the
banner already shows which project that is.
