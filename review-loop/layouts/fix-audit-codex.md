## Findings

- **MEDIUM — [src/scope.ts:153](/home/frank/Projects/agent-office/src/scope.ts:153), [src/rekey.ts:44](/home/frank/Projects/agent-office/src/rekey.ts:44).** The new rule breaks retrieval across worktrees for records previously filed under a bare repository’s shared key or a submodule’s main-checkout key. Rekeying normalizes the *stored path* in place; it cannot map that one old key to each new worktree-specific key. If a database from another machine contains those records, reads in the affected worktrees become empty. This is the regression the plan acknowledges and declines because the current machine has no such keys; it is intentional, but still affects databases with those layouts.

- **LOW — [src/rekey.ts:37](/home/frank/Projects/agent-office/src/rekey.ts:37), [src/rekey.ts:45](/home/frank/Projects/agent-office/src/rekey.ts:45).** Rows are cast to strings without checking their SQLite type. A BLOB in any `project` column survives SQLite’s `TEXT` affinity and makes `normalizeProject(value)` throw at `raw.trim()`. The catch in `serve()` then starts the daemon with the entire rename unapplied, leaving ordinary legacy keys inaccessible to exact-match reads too. This requires malformed or externally written data, but one such value blocks migration of all tables.

- **LOW — [review-loop/layouts/PLAN.md:98](/home/frank/Projects/agent-office/review-loop/layouts/PLAN.md:98).** The plan still presents bare-name resolution as an open owner decision, although the supplied outcome says the owner chose `~/Projects/<name>` when present and the implementation follows that choice. The plan’s closing status is stale and leaves the decision unclear to the next implementer.

## Checks

The memory, work, issue, and session write paths normalize project values before storing them; `begin` reaches the normalized session write. `serve()` runs rekeying after `openDb()` and before listening. The updates and marker are in one SQLite transaction, so a failure during those writes rolls them back. On a fresh database, the pass creates `meta` and writes the marker even when there are no project values; the table creation itself is outside that transaction.

I found no remaining source callers of `matchingProjects`, `projectKey`, `knownProjects`, `sharedRoot`, `configuredRoot`, or `worktreeSubmodule`. The changed init warning condition is consistent with the selected rule for bare-repository worktrees. I did not run tests or any `office` command.
