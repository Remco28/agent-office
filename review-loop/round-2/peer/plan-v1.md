# Plan v1 (claude-9264)

P1. Stop writing and stop reading `office.project`. Remove `linkedProject` from GitProjectInfo;
the key is always the computed one. Init's step "record office.project" goes. Repos that already
carry the key from an earlier init: the key becomes inert; init does not remove it (it does not
touch git config at all any more). Existing rows: init always wrote the computed root, so for any
repo not copied or moved the key is unchanged; nothing migrates.

P2. Add `--show-superproject-working-tree` to the same rev-parse call (no extra subprocess). If it
prints a path S (we are in a submodule's checkout): key = key(S) + "/" + relative(S, toplevel),
where key(S) is computed the same way, recursively (nested submodules). Main checkout: key(sup) +
"sub" = sup/sub, which is today's key, so no stored row changes. Worktree: key(wt) = sup (shared
worktree key), + "sub" = sup/sub. Same key.

P3. Plan the skills links by REAL path: compute realPath(parent)+"/skills" for each harness dir,
skip one whose real path was already planned (record a note that it is the same folder as the
other). Nothing else changes.

P4. Every git subprocess office starts for detection and init gets an environment with GIT_DIR,
GIT_WORK_TREE, GIT_COMMON_DIR, GIT_INDEX_FILE, GIT_OBJECT_DIRECTORY,
GIT_ALTERNATE_OBJECT_DIRECTORIES and GIT_NAMESPACE removed (one helper `gitEnv()` used by
scope.ts's `git()` and by init's spawns). The folder decides, as everywhere else.

Tests first, each failing on today's code: a copied repo gets its own key; a moved repo gets its
new path; submodule in a superproject worktree = main checkout's submodule key; init with .claude →
.agents completes and makes exactly one link; GIT_DIR=<other repo> in the environment does not
change the folder's key and init writes nothing in the other repo.
