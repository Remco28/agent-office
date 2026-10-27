
> build · deepseek-v4.1-flash-free
**P1 — Stop persisting the key**
- **Fix:** Never write `office.project` in `init`; ignore any value already in `.git/config` (and remove it on the next init). Always derive the key from the current folder.
- **Why:** The stored value is just a cached path. Copies, restores, and moves make it stale, and it can force two repositories to share a key. Recomputing makes copied folders new projects automatically.
- **Wrong case:** A deliberately pinned stable key is lost, and a moved/renamed repo becomes a new project with no automatic migration of its old rows.

**P2 — Key a submodule by superproject identity plus relative path**
- **Fix:** When `--show-superproject-working-tree` is non-empty, compute the superproject’s key, then append the submodule’s path relative to that superproject worktree. Recurse if the superproject is itself a submodule.
- **Why:** Main gives `sup/sub`; the worktree’s superproject key is also `sup`, and its relative path is still `sub`, so both become `sup/sub`. This preserves existing main-checkout keys and keeps sibling submodules separate.
- **Wrong case:** If the same superproject path `sub` is populated by a different submodule repository on another branch, both get `sup/sub`. A submodule moved to a different path also gets a new key.

**P3 — Resolve aliases, dedupe, then preflight**
- **Fix:** Before writing, resolve each planned destination’s parent through existing symlinks and dedupe by real path. Plan one `skills` link when `.claude` and `.agents` alias each other. Validate all planned paths first, then write; an existing correct link counts as success.
- **Why:** There is only one physical `skills` path, so two write actions are wrong. Preflighting keeps the “decide everything before writing” promise.
- **Wrong case:** Bind-mount aliases or a dangling symlink may not collapse, and an unexpected failure after the first write still leaves partial state unless writes are staged or rolled back.

**P4 — Ignore ambient Git repository variables**
- **Fix:** Run every git call used for key computation and `init` with `GIT_DIR`, `GIT_WORK_TREE`, `GIT_COMMON_DIR`, and `GIT_INDEX_FILE` removed, and clear other repository-discovery variables too. Let `-C <dir>` discover from the folder alone.
- **Why:** The folder, not the agent’s shell, must choose the repository. Otherwise reads and config writes silently target another repo.
- **Wrong case:** A setup that legitimately relies only on `GIT_DIR`/`GIT_WORK_TREE` because the folder has no `.git` stops resolving. Scrubbing only the four listed variables still leaves variables such as `GIT_CEILING_DIRECTORIES` able to redirect discovery.
