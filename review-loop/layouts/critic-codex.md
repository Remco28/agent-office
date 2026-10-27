## Findings

1. **Legacy bare and separate-git-dir records stay under keys that new reads won’t use — HIGH.**  
   A project previously filed under a bare repository path or a separate Git data directory. At startup, the migration sees that the path exists and calls `normalizeProject(value)`. Those paths have no `.git` ancestor, so normalization leaves the key unchanged. Later, a read from a bare-repo worktree uses that checkout’s path as its project key; a read from a separate-git-dir checkout uses its checkout path. Exact matching misses the old records.

   **Smallest plan change:** Add explicit handling for legacy bare and separate-git-dir keys before the generic path migration. Define how shared bare-repo records map to the new per-checkout projects; when a checkout cannot be identified, preserve and report the old key as unmigrated rather than claiming it was renamed. This is a case where the generic migration does not deliver the planned rename.

2. **Migrated plain names become invisible to callers who keep using those names — HIGH.**  
   A record is stored as `crokinole`. The migration finds `~/Projects/crokinole` and changes the record’s key to that path. Later, the same caller uses `--project crokinole`; `normalizeProject` keeps bare names as bare names, and exact matching looks for `crokinole`. The record no longer appears.

   **Smallest plan change:** Resolve a bare name to `~/Projects/<name>` when that path exists, using the same rule in writes and reads. That matches the migration’s fallback and answers the plan’s first “least sure” question: **yes, resolve it when the path exists**, while avoiding arbitrary basename matching.

3. **`openWork` can still file a path that exact matching won’t find — MEDIUM.**  
   A caller invokes `openWork` with a project path inside a repository, such as `/repo/sub`; `openWork` stores that value as-is. A later project read for `/repo` gets only `/repo` from exact matching, so the work item is missed. `remember` and `setActive` normalize project inputs, but `openWork` does not.

   **Smallest plan change:** Normalize the project in `openWork` before storing it, consistent with the other write paths.

4. **The rename is repeated on every database open, despite being described as one-time — MEDIUM.**  
   After migration, project keys still point to existing paths. Each later `openDb` repeats the distinct-value scan and calls normalization, which can spawn Git for each path. A CLI invocation that opens the database therefore pays the migration cost again.

   **Smallest plan change:** Add a database migration version marker and run the rename once per database. Make the rename and marker update atomic. This also answers the plan’s startup-cost question: repeated Git calls during `openDb` are avoidable; tests opening temporary databases need not make real project paths cheap by assumption.

5. **`office init` can describe a bare-repo worktree as a worktree of itself — MEDIUM.**  
   `office init` detects a linked checkout using `gitDir !== gitCommonDir`, then formats its warning using `repoRoot`. Under the new rule, a bare-repo worktree’s `repoRoot` is its own `worktreeRoot`. Initializing it can therefore produce a warning saying that the worktree is “of” the same path where the files were written.

   **Smallest plan change:** Update the `office init` warning to use wording that does not treat `repoRoot` as the shared repository identity for layouts where the new rule makes it the checkout itself. Add a test for the warning.

## Remaining “least sure” questions

- **Bare names:** Resolve them to `~/Projects/<name>` when that path exists, as described above; otherwise leave them unchanged.
- **Migration cost and real-disk dependency:** Use a migration version marker so project-path normalization runs once per database. For tests, keep exercising the migration with temporary paths, and don’t make unrelated test database opens repeatedly probe real project directories.
- **Separate Git directory named `.git`:** The new rule keys it by its parent. That matches the settled rule, but should be included in layout tests because it is an unusual edge case.
- **The laptop’s old keys:** The migration must run against that laptop’s database when updated, with the bare/separate-directory cases handled explicitly.

**With these fixes, the plan gets bigger.**
