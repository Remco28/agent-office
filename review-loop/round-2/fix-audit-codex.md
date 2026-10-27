# Fix auditor — GPT (codex gpt-6-luna, -s read-only). Saw: REVIEW-FIXES.diff + repo copy r2/codex at c9dad28+0a0f3cd577e8. Could not write.

**Active audit target:** the Agent Office snapshot at `/tmp/claude-1000/-home-frank-Projects-agent-office/d8dfc6bc-af51-4da5-aed3-93c0abd87a60/scratchpad/r2/codex`. `office peek` reported `keydo` as project and `codex` as author; it did not provide a numbered session ID. I kept the audit to the supplied snapshot and diff.

## Findings

**None.** I found no concrete unintended breakage or missed scope change among the fixes. The exceptions `office list` and `office work log` remain whole-store reads, and the README explicitly describes them that way.

## Fix hunks

- **[src/cli.ts](/tmp/claude-1000/-home-frank-Projects-agent-office/d8dfc6bc-af51-4da5-aed3-93c0abd87a60/scratchpad/r2/codex/src/cli.ts:135):** Clarifies `init` and folder-based startup, sends the detected folder project to `begin`, scoped reads and writes, and prints scope warnings and init warnings. I found no break: explicit `--project` still reaches the server, and the updated CLI calls line up with the corresponding scoped server routes.

- **[src/scope.ts](/tmp/claude-1000/-home-frank-Projects-agent-office/d8dfc6bc-af51-4da5-aed3-93c0abd87a60/scratchpad/r2/codex/src/scope.ts:23):** Adds symlink-resolved paths and home-repository exclusion, derives shared project roots for less common Git layouts, and normalizes existing paths inside checkouts to their project. Adds request-local memoization. I found no concrete regression in these changes; the new scope tests cover symlinks, subfolders, bare repositories, separate Git directories, submodules, and memoization.

- **[src/server.ts](/tmp/claude-1000/-home-frank-Projects-agent-office/d8dfc6bc-af51-4da5-aed3-93c0abd87a60/scratchpad/r2/codex/src/server.ts:120):** Wraps each request in the project memo and passes `cwd_project` through project-scoped handlers; adds `scope_note` to their responses. I found no affected scoped caller or route left using only the old project source in this diff.

- **[src/session.ts](/tmp/claude-1000/-home-frank-Projects-agent-office/d8dfc6bc-af51-4da5-aed3-93c0abd87a60/scratchpad/r2/codex/src/session.ts:282):** A named session records its repository; folder scope outranks remembered scope unless the call explicitly declares a project. The unnamed session is not retargeted by a folder, and author identity remains declaration-only. A mismatch with a named session’s previous project produces a warning. I found no unintended break; the added tests cover those distinctions.

- **[src/init.ts](/tmp/claude-1000/-home-frank-Projects-agent-office/d8dfc6bc-af51-4da5-aed3-93c0abd87a60/scratchpad/r2/codex/src/init.ts:141):** Adds preflight checks for home, enclosing repositories, Git data directories, and existing links/files. It leaves existing links alone, warns about cases it cannot set up, and stops adding ignore rules. I found no concrete break to prior behavior; the safety tests exercise refusals, external links, existing Claude files, and Git visibility.

- **Tests:** [tests/cli.test.ts](/tmp/claude-1000/-home-frank-Projects-agent-office/d8dfc6bc-af51-4da5-aed3-93c0abd87a60/scratchpad/r2/codex/tests/cli.test.ts:1) adds CLI scope cases; [tests/init.test.ts](/tmp/claude-1000/-home-frank-Projects-agent-office/d8dfc6bc-af51-4da5-aed3-93c0abd87a60/scratchpad/r2/codex/tests/init.test.ts:140) updates the expected scope source; `tests/init-safety.test.ts` and `tests/project-scope.test.ts` add safety and resolution coverage. These test changes do not alter runtime behavior.

- **[AGENTS.md](/tmp/claude-1000/-home-frank-Projects-agent-office/d8dfc6bc-af51-4da5-aed3-93c0abd87a60/scratchpad/r2/codex/AGENTS.md:11), [README.md](/tmp/claude-1000/-home-frank-Projects-agent-office/d8dfc6bc-af51-4da5-aed3-93c0abd87a60/scratchpad/r2/codex/README.md:16), and [docs/sessions-and-notices.md](/tmp/claude-1000/-home-frank-Projects-agent-office/d8dfc6bc-af51-4da5-aed3-93c0abd87a60/scratchpad/r2/codex/docs/sessions-and-notices.md:392):** Update setup and scope guidance to match the implementation. I found no conflicting instruction in these hunks; the docs retain the explicit whole-store behavior for `list` and `work log`.

**Verification:** This was a read-only code and diff inspection; I did not run tests. The added tests provide coverage, but their passing status was not verified here.

**Keep:** The named-versus-unnamed session distinction, explicit project override, scope mismatch warning, and `init`’s preflight-and-preserve behavior all address the stated failure risks.
