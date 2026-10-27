**HIGH — P2 does not hold.** If a superproject worktree has two distinct submodules at `foo/modules/bar` and `foo/bar`, and neither is initialized in the main checkout, the fallback maps both module paths to `foo/bar`: `module.split("/modules/").join("/")` removes the literal `modules` path segment too. Those separate repositories get the same project key.

**P4 holds in the inspected code:** `gitEnv()` removes `GIT_DIR`, `GIT_WORK_TREE`, `GIT_COMMON_DIR`, `GIT_INDEX_FILE`, and `GIT_CEILING_DIRECTORIES`, and init’s Git subprocesses use that environment.
