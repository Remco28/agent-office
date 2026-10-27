## Finding

### Init can follow a `.claude` or `.agents` link changed after planning

[src/init.ts:503](/tmp/claude-1000/-home-frank-Projects-agent-office/d8dfc6bc-af51-4da5-aed3-93c0abd87a60/scratchpad/r4/codex/src/init.ts:503) — **MEDIUM**. The fix rechecks the harness directory before linking skills, but records only its entry *kind*. If a valid internal symlink is replaced with a symlink to an outside directory while `office init` is running, the check still passes. `mkdirSync` and `linkOnce` then operate through that new symlink.

**Scenario:** `.claude` initially links to an in-repository directory, and `.claude/skills` is missing. Init plans a link. While it runs, another process replaces `.claude` with a symlink to an outside directory. Init creates `skills` there, writing outside the project.

**How I know:** Read in the code; I did not reproduce it. This is a timing window in the new recheck logic.

## Hunk-by-hunk review

| Hunk | Change | Did it break something that used to work? |
|---|---|---|
| `AGENTS.md` and `README.md` | Clarify that nested repositories a few folders down cause `init` to stop, and that a home-folder checkout is not a project. | No apparent regression; these document the new behavior. |
| `src/cli.ts` | Refine `init` and `begin` help text for nested repos and when `--project` is needed. | No apparent regression. |
| `src/init.ts`: nested repo scan | Detect repository symlinks when checking whether a directory holds projects. | No apparent regression; this closes a case where `init` could treat a project container as a project. |
| `src/init.ts`: Git errors and `.git` checks | Handle missing Git, catch Git subprocess errors, and refuse unreadable `.git` files or links and dubious ownership before writing. | No apparent regression; the refusals are safer. |
| `src/init.ts`: hard links and append | Avoid appending through an external hard link; open without following a symlink and account for another init reaching the file first. | No apparent regression. The “changed into a link” warning can also cover a hard-link refusal, so its wording may be inaccurate. |
| `src/init.ts`: skill links | Recheck harness directories and make link creation tolerate another init creating the same link. | Mostly sound; the incomplete recheck is the finding above. |
| `src/init.ts`: `AGENTS.md` and `CLAUDE.md` | Create `AGENTS.md` exclusively, recognize when another init created it, track whether the section is present, and treat hard-linked `AGENTS.md`/`CLAUDE.md` as one file. | No apparent regression. |
| `src/init.ts`: ignored instructions and completion status | Warn when Git ignores the instruction files, and report incomplete setup if no Agent Office section is present. | No apparent regression. |
| `src/scope.ts`: Git spawn handling | Treat inability to start Git as “not a repository.” | No apparent regression; callers can now handle Git being absent. |
| `src/scope.ts`: nested submodules in worktrees | Use the worktree’s `gitdir` metadata to derive a stable key for nested submodules, including before the main checkout initializes them. | No apparent regression found by inspection. |
| `src/scope.ts`: home-folder checks | Exclude a home-folder checkout whether its Git data is in the home directory or elsewhere, including when normalizing explicit paths. | No apparent regression; this avoids attributing loose home folders to a dotfiles project. |
| `src/scope.ts`: `displayName` | Use a human-facing name for bare-clone layouts and strip `.git` from displayed names. | No apparent regression in display paths; project keys remain unchanged. |
| `src/session.ts`: scope notes and banner | Explain when a declared project differs from the current folder, and use the display name in the session banner. | No apparent regression. The updated tests cover the changed note behavior. |
| Test hunks | Add coverage for symlinked nested repos, hard links, concurrent init, home-folder worktrees, ignored files, submodules, and missing Git. | Test-only changes; no runtime effect. |

## Overall

I found **one unintended risk**: the harness-directory recheck can still follow a link whose target changed after planning. I found no other change that makes behavior worse.

I found no missed route or caller for the scope note: it is included in the server responses and surfaced by the CLI. The submodule and display-name changes are used through the existing project-resolution and session paths. I did not run tests or office commands; the review is based on reading the diff and code. The Agent Office session number is unavailable because the instructions prohibited office commands.
