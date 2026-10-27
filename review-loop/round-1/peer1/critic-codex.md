# Plan critic — GPT (codex gpt-6-luna, read-only). Saw: fix-plan-v1.md, LEDGER.md, live repo.

## Findings

### A1 — Project precedence and session state

This fixes the current mismatch where `begin` treats a folder-detected project as declared, while later calls treat the folder separately. Keeping folder-detected projects on a named session row also supports the owner’s decision to use remembered scope when the current folder is not a repo. Avoiding folder writes to the unnamed row prevents one unnamed agent from retargeting another.

There’s a policy conflict in the proposed precedence: **a project remembered from an earlier `begin --project` would beat the current folder**. Rule 9 says the folder beats a project remembered from an earlier session. The plan should either get an explicit owner decision that `begin --project` pins that named session across later calls, or use the simpler order **current explicit project → current folder → remembered project**. Under the latter, `project_declared` is unnecessary.

There’s also a migration gap. Existing session rows have no record of whether their project was supplied with `--project` or inferred from the folder. The plan must say how migrated rows are treated; otherwise the new column’s default can silently change precedence for existing sessions.

### A2 — Normalize subfolder and symlink paths

This addresses the finding if the rule is that a repository is one project: an existing subfolder or symlink inside that repo resolves to the same canonical project.

The tradeoff is that an existing directory inside a repo can no longer be used as a separate project key, even if someone intentionally chose it that way. A nested directory with its own Git repository remains separate. This is consistent with rule 5 for ordinary subfolders, but should be treated as a deliberate consequence of that rule.

### A3 — Bare and separate Git directories

This addresses the split-worktree case if `git worktree list --porcelain` reliably identifies the same main worktree or bare repository path for every checkout. The bare path is a reasonable shared key when there is no main working tree.

The plan needs coverage for all three layouts: separate Git directory, submodule, and a bare repository with linked worktrees. It also needs to confirm that the chosen worktree-list entry is stable across those layouts. I see no specific break to expected behavior under rule 5.

### A4 — Cache normalized projects

This reduces repeated Git subprocesses. The stated “stale for at most a minute after a repo is created or moved” omits changes to `office.project` and symlink targets. For example, after retargeting `office.project`, a write using a cached path could still be filed under the old project for up to 60 seconds.

Given the ledger’s modest performance measurement, consider skipping the cache or using a shorter cache with explicit invalidation for changed configuration and paths.

### B1 — Refuse to initialize a different folder

This implements the owner’s decision: when a named target is inside an enclosing repository, stop rather than silently set up that repository’s root. Refusing `$HOME` also closes the case where it is itself a Git repository.

Running `office init` from a project subfolder will now error where it previously set up the enclosing repository. That is an intentional behavior change under the owner’s decision. The proposed message explains how to set up the enclosing repo or make the target its own repo.

### B2 — Git excludes

Anchoring the patterns and avoiding excludes for user-owned files address the finding for a single worktree, but the plan misses two ways it can still hide user files:

- **Worktrees share the common Git directory.** If init adds `/.claude/skills`, `/.agents/skills`, or `/CLAUDE.md` to the common exclude file from one worktree, the pattern can also hide a user-created file at that path in a sibling worktree.
- A pre-existing symlink that already points to the exact office skills target is indistinguishable by target alone from a symlink init created. Excluding it would hide a user-made link despite the plan’s stated rule.

A smaller safe approach is to add an exclude only in the branch that creates the link, and store it in a worktree-specific exclude file. Also decide whether upgrading should remove old, unanchored entries written by the current init; otherwise they can continue matching nested paths after the change.

### B3 — `AGENTS.md` and `CLAUDE.md` links

This fixes the shared-file write-through case by leaving unrelated links untouched, and handles broken links without reading through them. Replacing recognized legacy office links is consistent with the plan’s stated legacy behavior. No new break stands out.

### B4 — `.claude` and `.agents` links

This prevents init from creating `skills` inside a user’s linked or non-directory path. The behavior change is a warning instead of adding a link in those cases; that is appropriate for the file-safety goal. No specific break stands out.

### B5 — Generated text

Dropping the absolute path fixes the misleading, machine-specific text. No specific break stands out.

### B6 — Existing `CLAUDE.md`

This surfaces cases where Claude may not see the startup instructions. The warning check should recognize an existing `@AGENTS.md` import: that file can already provide the startup steps, so warning that they are absent would be a false positive. The practical downside is warning noise; it does not appear to change files.

### B7 — F11

Declining the change matches the owner’s decision to mention missing-folder creation in help. No issue with the plan item.

### Docs and tests

The proposed AGENTS wording matches the owner’s rewording, and replacing README symlink instructions with `office init` is aligned with the change.

“One test per item” is too vague to ensure the risky cases are covered. In particular, tests should cover A1’s precedence and migration behavior, and B2’s sibling-worktree excludes and pre-existing matching symlink. Those scenarios determine whether the fixes meet the owner’s rules.

## Answers to the author’s four least-sure points

1. **A1’s second rung:** As written, it conflicts with rule 9 unless the owner means `begin --project` to pin a named session across later calls. Otherwise, explicit scope should win for the current call, then the current folder, then remembered scope. In that version, the new column is unnecessary.
2. **A2:** Canonicalizing paths inside a repository fits rule 5. It merges intentionally chosen subdirectory keys, but that is consistent with treating each repository as one project. A nested Git repository remains its own project.
3. **A3:** The bare-repository path is a defensible shared key. The plan should verify stable worktree-list results for bare repos, separate Git directories, and submodules before relying on the first entry.
4. **B1:** The refusal follows the owner’s explicit decision. It will inconvenience someone running init from a project subfolder, but the proposed message tells them to rerun it at the intended root.
