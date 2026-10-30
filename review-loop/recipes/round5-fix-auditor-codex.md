## Findings

1. **MEDIUM — `STILL THERE` (pre-existing):** The outer fence leaves the host filesystem writable outside the explicitly protected paths. It says “the repository unchanged, nothing installed” but uses `--dev-bind / /`, which bind-mounts the host root read-write. If a reader has a permitted shell write, for example `touch ~/PROBE_HOME`, that file can persist. The repository itself is separately read-only bound, so this is a gap in the lesser protection against changes elsewhere on the machine.

2. **LOW — `REPLACED BY A NEW PROBLEM` (introduced by this fix):** The probe instruction changed from “Run them **one at a time**” to “Run them.” Gemini’s settings make a denied command lose that run’s answer. If the listed probes are sent together, its first refusal can prevent the remaining raw results from being reported. The later Gemini note covers only the Python and home-write probes, not the full list.

3. **LOW — `STILL THERE` (pre-existing; the new check is stronger but incomplete):** The repository snapshot uses `git status --short` and `git diff HEAD`. Those omit ignored files. In a scratch Git repo, I created a changed file matching `.gitignore`; the before/after comparison still passed. An ignored generated source file changed by an external process could therefore go undetected.

4. **LOW — `REPLACED BY A NEW PROBLEM` (the 124 ambiguity predates this fix; 137 is newly added):** The sentence says “124 or 137 in the status file means time ran out.” A reader process can exit with either code on its own, so the status alone cannot establish that the timeout fired. I verified `timeout -k 30s 20m sh -c 'exit 124'` returns 124 without timing out.

## Coverage and checks

The four gaps in `PROBLEM.md` are otherwise addressed in the current procedure:

- **Running code:** recipes are provided for Codex, Grok, and Claude; Gemini is explicitly read-only.
- **Portable reader recipes and prompt handling:** the commands are in `readers.md`, with the brief passed in the documented form.
- **Timeout evidence:** the recipes retain logs and status, with instructions for extracting partial output.
- **Light review:** the current `SKILL.md` says already-built work gets a plan and permits keeping a patch instead of committing.

The copy command worked in a scratch folder and excluded the specified directories. I couldn’t validate the bubblewrap runner’s writes: this sandbox blocked its network namespace with `NETLINK_ROUTE … Operation not permitted`.

`bun test` ran 175 tests: **165 passed, 10 failed**. The failures were the missing `AGENTS.md` and tests that start a local server, matching the stated environment limitations.