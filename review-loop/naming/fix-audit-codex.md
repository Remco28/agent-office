**Findings**

- **MEDIUM — [docs/sessions-and-notices.md](/home/frank/Projects/agent-office/docs/sessions-and-notices.md:37):** The document still describes the unnamed slot and remembered-project fallback as current behavior, including that an unnamed caller keeps a project and that the slot cannot be removed. The new amendment at the end contradicts those sections, but does not replace them. A reader following the earlier guidance could expect nameless commands outside a repository to retain their project; they now have none.

- **LOW — [src/session.ts](/home/frank/Projects/agent-office/src/session.ts:316):** The bare-name note says the name “signs this write,” but `resolveScope` also runs for reads and `peek`. For example, `office peek --by codex` with no `codex` session can report that it signed a write, even though peek writes nothing. The plan limits this note to writes.

- **LOW — [tests/project-scope.test.ts](/home/frank/Projects/agent-office/tests/project-scope.test.ts:63):** The test title says it checks that an unnamed caller avoids the shared slot, but its nameless `beginSession` now writes no row. It only verifies that a supplied folder wins; it does not exercise slot behavior. The no-row rule is covered elsewhere, so this is a misleading test claim rather than an uncovered core behavior.

- **LOW — [src/server.ts](/home/frank/Projects/agent-office/src/server.ts:190):** The `/begin` comment still says the project falls back to “what is remembered,” contrary to the new resolution rule.

**Other checks:** I found no remaining in-repository callers of `getActive` or references to `UNNAMED_SESSION`. The TUI now reads the newest session from `sessions`; removing `/status.active` follows the plan, with no remaining in-repo reader. I did not run tests or modify files.
