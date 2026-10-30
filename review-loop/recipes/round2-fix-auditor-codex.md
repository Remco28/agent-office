## Findings

**HIGH — The fence still allows access to the office over the network.** The recipe says, “Every reader runs inside this” ([readers.md](/home/frank/.cache/rl-recipes/r2/codex/skills/review-loop/readers.md:35)), but its `bwrap` flags omit `--unshare-net`. `bwrap --help` lists that as a separate option. **Scenario:** a reader runs a command that connects to `127.0.0.1:7701`; the wrapper shares the host network, so the connection can reach the office daemon. The risk existed before for Claude: the old procedure allowed named commands such as `Bash(bun test:*)`, and the new text itself says a test that calls the office can reach it. For the other readers, the wrapper is new but does not provide the isolation it claims. This leaves the stated goal unmet.

**HIGH — A custom `OFFICE_HOME` bypasses the data-directory overlay.** The procedure says the office folder looks empty “(`$OFFICE_HOME`, if that is set)” ([readers.md](/home/frank/.cache/rl-recipes/r2/codex/skills/review-loop/readers.md:35)), but the command overlays only `$HOME/.local/share/agent-office` ([readers.md](/home/frank/.cache/rl-recipes/r2/codex/skills/review-loop/readers.md:40)). This copy’s `src/paths.ts` confirms that `OFFICE_HOME` selects a different data directory. **Scenario:** a user has `OFFICE_HOME=/some/other/path`; a reader inherits it and reads that directory, while the recipe hides the default path. The exposure predates this fix; the fix adds a claim that does not hold for that setup.

## Change-by-change assessment

| Change | Assessment |
|---|---|
| Add code-running recipes for Codex, Grok, and Claude | **GONE** for those readers: the table now has a “Running code” recipe, including Codex `workspace-write` and Claude’s named Bash command. Gemini remains explicitly reading-only. |
| Put reader recipes in the skill and add a first-use probe | **GONE** as a portability gap in the written procedure: the commands are in `readers.md`, with a check for the local CLI and `bwrap`. This does not make the office fence work on every setup; see the HIGH findings. |
| Save output during a run and extract partial reports | **GONE in the procedure.** It documents log/status capture and partial-output extraction for Grok, Claude, and Gemini; Codex writes its final message separately. I checked the `jq` expressions against representative JSON lines, but could not verify them against live CLI streams. |
| Make blind-solver material from the prior version | **GONE** for excluding the plan and built work: the diff now directs the operator to archive the version before the change. The separate concern about requiring a commit is not present in this copy of `SKILL.md`; it says “Commit what readers get, **or** keep it as a patch.” |

## What I tried

- **CLI help:** The listed options were present in local help for Codex, Grok, Claude, and Gemini; `bwrap --help` confirmed that network isolation has its own flag.
- **`rsync`:** Ran the documented excludes on a scratch tree under `/tmp`; it copied the ordinary file and excluded `.grok`, `node_modules`, and `review-loop` as directed.
- **`git archive`:** Archived `HEAD` into an existing scratch directory and extracted it successfully. I did not test the missing-directory case for `<tmp>`.
- **`jq`:** All four report-extraction expressions produced the expected text from representative fixtures. Actual CLI event shapes remain unverified.
- **`bun test`:** 165 passed, 10 failed. The failures included the known missing `AGENTS.md` and local-server tests that cannot pass in this sandbox, so I treated them as the stated environment quirk, not a fix finding.