- **P1 — HIGH:** The new key is correct for a moved folder, but its existing records stay under the old path-based key. Those records disappear from scoped reads. The plan explicitly leaves this unmigrated, so it fixes misfiling while leaving a data-loss problem for moves.

- **P2 — LOW: the plan holds for the stated case.** Using the parent’s key plus the submodule’s relative path gives the same key in the main checkout and its worktree, and recursion covers nested submodules. The implementation must preserve the empty `--show-superproject-working-tree` result for non-submodules when parsing the combined output.

- **P3 — LOW: the plan holds for the stated alias.** Resolving both harness directories and deduplicating their `skills` destinations avoids the second `EEXIST`. This assumes the resolved harness paths are computed before planning the links.

- **P4 — MED:** The listed Git variables address the stated `GIT_DIR` case, but the helper may still let injected Git configuration affect detection. For example, `GIT_CONFIG_COUNT` with `GIT_CONFIG_KEY_0=core.bare` and `GIT_CONFIG_VALUE_0=true` can change which key branch is selected. The plan’s environment cleanup and test don’t cover that.

I couldn’t inspect `scope.ts` or `init.ts`: the read attempt failed because the shell sandbox could not start (`RTM_NEWADDR: Operation not permitted`). This critique is based on the behavior and plan described in your prompt.
