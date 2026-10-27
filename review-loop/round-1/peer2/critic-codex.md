# Plan v2 critic — GPT (codex gpt-6-luna, read-only, fresh session). Saw: fix-plan-v2.md, LEDGER.md, live repo.

# Fix plan v2 review

**The plan fixes the main project-precedence and init-safety failures, but B2 still cannot guarantee rule 7 while it writes persistent ignore rules.** A3 also needs a specific check for running `init` inside a bare repository, and A1 should spell out how the folder source reaches the briefing.

## Part A — project attribution

- **A1 — Folder beats a remembered project: fixes F1 and F13, with a briefing detail to pin down.** Explicit project, then folder, then remembered project matches rule 9. Leaving the unnamed slot alone on a folder-only `begin` also avoids retargeting shared unnamed state. One ambiguity: `/begin` is meant to pass the folder to `briefing` “via `declared`,” but `briefing` currently accepts only `declared.project` and `declared.author`. If the folder is passed as `declared.project`, the result can still be labeled `"declared"`—the F13 defect. Make the briefing receive the folder separately so its source is `"folder"`.

  Also check the “begin and next write agree” case when a named session moves from repo A to repo B: the briefing’s project should be B, but its `since` timestamp must not make B’s activity appear to be measured from the session’s previous visit to A. The plan’s `active_since` condition helps only if it also governs the briefing watermark.

- **A2 — Normalize explicit paths: fixes F6.** Canonicalizing existing subfolders and symlinks to the repo root prevents a single repo from splitting into multiple project keys. Preserving explicit `--project` use for the office checkout is consistent with rule 4. The `$HOME` special case is sensible; ensure it compares real paths so a symlink to the home directory cannot bypass the exception.

- **A3 — Bare and separate-git-dir layouts: likely fixes F5, but the bare-repo `init` case needs an explicit safeguard.** A bare repository itself usually has no `.git` entry, while `hasGitAncestor` currently relies on finding one. If `init` does not detect that case before its normal “no repo found” path, it may run `git init` inside the bare repository and create a nested `.git`. The plan says to refuse there, but the tests listed do not explicitly cover running `init` on the bare repository directory itself. Add that case and require detection before any write. The first-entry-missing behavior is reasonable for avoiding project splits.

- **A4 — Cache within one `matchingProjects` call: fine.** A local map avoids repeated Git calls during a read without risking stale cross-request results. No material break identified.

## Part B — `office init`

- **B1 — Refuse setup inside an enclosing repository: fixes F3 and follows decision 3.** Checking before `mkdir` or `git init`, and naming the actual enclosing checkout, addresses the reported wrong-root setup. For a nonexistent target, make “target real path” mean a resolved future path based on its nearest existing parent; otherwise the comparison is undefined. Also ensure the bare-repo case from A3 is caught before writes.

- **B2 — Exclude only init-made links: still violates rule 7 in a concrete lifecycle.** `.git/info/exclude` is persistent and shared across worktrees. Even if init adds an anchored entry only for a link it created, a user can later replace that symlink with a real `.claude/skills` directory or `.agents/skills` directory. Until `init` runs again to remove the entry, Git still hides the user’s path. A second worktree created later inherits the same exclude file too. The “single worktree” check does not protect either case.

  **Smaller safe version:** do not add these paths to `.git/info/exclude`; accept that the machine-specific links show as untracked, or use a mechanism that cannot continue hiding a user replacement. A marked block protects unrelated exclude-file lines, but it does not solve the stale-ignore window.

  The `CLAUDE.md` change is good: never excluding it avoids hiding user files at any depth or files added later.

- **B3 — Handle AGENTS.md links: fixes F4a and F7 if preflight is complete.** Migrating the known legacy link is consistent with the old setup; warning and leaving other or broken links untouched protects shared files and avoids the dangling-link crash. Since the plan promises “look at everything first,” inspect both `AGENTS.md` and `CLAUDE.md` links before any write, including Git config and skills setup. That makes a warned, unsupported link a deliberate outcome rather than a partial setup caused by discovering it late.

- **B4 — Protect linked `.claude` and `.agents` directories: fixes F4b.** Refusing to create links through an outside or broken parent link addresses the reported external write. Checking the resolved destination against the repository’s real root is the right boundary.

- **B5 — Remove the machine path from generated text: fixes F9.** The replacement wording avoids committing a machine-specific path and stops claiming the project’s own path is the office path. Fine.

- **B6 — Warn when Claude lacks startup instructions: fixes F10 as narrowed.** Leaving an existing user `CLAUDE.md` alone and warning when it neither contains Office instructions nor imports `AGENTS.md` respects the file-safety rule. The check should recognize only the import forms the plan names; broad substring matching could incorrectly suppress the warning on an unrelated mention of `AGENTS.md`.

- **B7 — Clarify help text for missing paths: fine.** It documents the intended behavior and the enclosing-repository refusal without changing setup behavior. No material break identified.

## Docs and test coverage

The AGENTS.md wording change is consistent with rule 9 and decision 5. The listed tests cover most named scenarios. Add explicit tests for **`office init` run on the bare repository directory** and for **a user replacing an init-made skills link while its exclude entry remains**. The latter is the concrete rule 7 gap in B2.

I did not run tests or modify files.
