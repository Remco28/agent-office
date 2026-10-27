## Findings

- **[src/server.ts](/home/frank/Projects/agent-office/src/server.ts:232) — MEDIUM.** The route accepts `"GLOBAL"` as global because it lowercases the value for the check, then passes the original string to `remember()`. [src/memory.ts](/home/frank/Projects/agent-office/src/memory.ts:124) recognizes only the exact `"global"` value; otherwise it stores project scope. **Scenario:** an HTTP caller sends `scope: "GLOBAL"` with no project. The request succeeds but saves a project-scoped memory with no project—the case this change is meant to refuse.

The CLI spells `--global` as `"global"` and sends it in `scope`; its error handling displays the server’s 400 message. The only production caller of `remember()` is the server route. I found no active help or documentation that still says projectless memories are stored; the remaining “unattributed” wording I checked concerns unsigned authors or historical records.
