- **`src/scope.ts:233` — MEDIUM.** If the office checkout is installed somewhere other than beside the project folders, bare names stop resolving there. For example, a checkout under `~/.local/share/agent-office` no longer finds `~/Projects/crokinole` unless `OFFICE_PROJECTS_DIR` is set.

- **`src/scope.ts:233` — MEDIUM.** If the CLI and an already-running daemon come from different checkouts, they can resolve the same bare name against different parent folders. When the CLI leaves a name unresolved but the daemon finds a same-named folder beside its own checkout, the daemon can scope the request to that other project.

- **`src/scope.ts:233` / `src/rekey.ts:49–57` — MEDIUM.** On startup, rekeying uses the daemon’s current project folder to turn stored bare names into paths. If that folder contains a same-named project different from the one the records meant, the database rows are rewritten to that project’s path and won’t match the intended project’s scope.

I found no import cycle: `scope.ts` imports `ROOT` from `paths.ts`, and `paths.ts` does not import `scope.ts`. The updated tests set `OFFICE_PROJECTS_DIR` for lookups involving temporary project folders; I found no new dependency on the machine’s project folders.
1. **AGREE** — No such install exists; `OFFICE_PROJECTS_DIR` covers other layouts, and an unresolved name retains the old behavior.
2. **AGREE** — The CLI and daemon use the same checkout on each machine, so this setup does not produce differing resolutions.
3. **AGREE** — Resolving a bare name to the same-named project folder is the owner’s chosen rule.
