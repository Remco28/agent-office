I'll audit the procedure change against the problem, the diff, and the declined findings, then check each reader step against the real CLIs.The four gaps are in the diff. Next I’ll read the recipes as written and check each CLI flag against `--help`.The four original gaps are fixed in the text. Three new holes are not: a Grok reader can read the office database and write the author’s Grok home, a Claude reader is not limited to the commands the recipe names, and a killed Gemini reader still leaves nothing.

## (1) Did each gap land?

**1. Readers cannot run code.** GONE for Codex and Grok. The running-code rows are `codex exec … -s workspace-write` and `grok … --sandbox review-loop-reader` after writing this profile to the copy:

```toml
[profiles.review-loop-reader]
extends = "workspace"
restrict_network = true
```

Those flags match `codex exec --help` and `grok --help`. In this sandbox, `bind` and `connect` return `EPERM`, which matches “no local server.” Claude’s running row is an allow entry, covered below. Gemini is stated as read-only.

**2. The start method does not travel to another computer.** GONE. The skill now says: “Use the recipes in `readers.md` … don’t improvise one.” Codex’s prompt is the `-` argument, not a value swallowed by `-o`. Claude’s `--disallowedTools` does not swallow a later flag: `claude -p --disallowedTools Edit Write --not-a-real-flag` prints `unknown option '--not-a-real-flag'`.

**3. A reader that times out leaves nothing.** GONE for Codex, Grok, and Claude. The wrapper is `timeout 20m <recipe> > <round>/<reader>.log 2>&1; echo $? > <round>/<reader>.status`, and GNU timeout 9.4 uses 124 for a kill. Grok’s extractor `select(.type=="text").data` matches the documented `streaming-json` event. Claude’s `result` / `assistant` filters match that CLI’s stream. **STILL THERE for Gemini:** “Gemini: the log. It has nothing if killed.” `agy --help` has `--output-format stream-json`, and the recipe does not use it.

**4. Light review assumes a plan before the build, and says commit.** GONE. It now says: “Work already built gets a plan too, saying so and describing what was built,” and step 3 says “Commit what readers get, or keep it as a patch.”

## (2) Following `readers.md` literally

Checked against `--help` and, where noted, run.

Codex’s reading and running commands match `codex exec --help` (`-m`, `-s read-only`, `-s workspace-write`, `--skip-git-repo-check`, `-C`, `-o`, `-` for stdin). `gpt-6-luna` is in the local model cache. I did not start Codex.

Grok’s flags match `grok --help`. `read-only` is a built-in profile. The checksum and the blind-solver `rsync` excludes do what they say: a new file stays quiet, a changed or missing file fails `sha256sum -c`, and `--exclude=.git --exclude=/review-loop/chg/PLAN.md` still works when placed after the paths.

**The Grok profile does not do what the paragraph under it says.** “They can write to the copy and `/tmp`, not to the home folder” and “These fences stop a reader running the office.” From this running-code sandbox: `touch ~/PROBE_HOME` was denied, and `touch` through a symlink into `~/.local/share/agent-office` was denied. `touch ~/.grok/skills/…`, `~/.grok/sessions/…`, and `~/.grok/memory-v2/…` succeeded (those probe files are removed). `open()` on `memory.db` succeeded. `office status` ran and printed `{"ok": false, "error": "daemon not running"}` with exit 0. `office list` failed with `EACCES` on `office.log` (a write). The network block holds: `connect` to `127.0.0.1:7701` and to `1.1.1.1:443` is `EPERM`.

**Claude’s recipe does not limit the shell.** Reading is `claude -p … --disallowedTools Edit Write NotebookEdit "Bash(office:*)"`. Running is that plus `--allowedTools`, for example `"Bash(bun test:*)"`. `--help` describes `--allowedTools` as tools to allow, and a different flag, `--tools`, as the list that exists. `--restricted` and `--permission-prompts none` exist and are not in the recipe. Nothing denies `cat` of the office folder or `curl` to port 7701. I could not start `claude -p` here (child network is blocked).

**Gemini’s kill path is empty**, as written. `agy --settings '{"allowNonWorkspaceAccess":false,…}' --model gemini-4-argon-high` got as far as “Model ID gemini-4-argon-high not in local config, defaulting to CCPA” and then died on `listen tcp 127.0.0.1:0: bind: operation not permitted`. That bind failure is this sandbox. I could not see whether a live server would keep that model or accept the settings keys.

The copy step excludes `AGENTS.md`, `CLAUDE.md`, `.claude`, and `.agents`. It does not exclude `.grok`. This repo contains `.grok/sandbox.toml`.

## (3) Worse, or fixed in one place only

The home-write sentence is new, and it is false for `~/.grok`. Cleanup now follows `readers.md`, which only names `~/.claude/projects/<path, with / and . as ->`. That encoding matches directories on this machine (`-home-frank--cache-…`). Nothing there tells the author to look at `~/.grok/skills` or `memory-v2`.

Streaming was applied to Grok and Claude and not to Gemini, which has the flag.

`.claude` is stripped and `.grok` is not, so a project skill or hook under `.grok/` still arrives in the copy.

## (4) Declines

**Office data-folder reads, declined.** The reason does not hold. Writes are blocked (reproduced, including through a symlink). The rest does not: this change puts `~/.local/share/agent-office` in `readers.md`, which the copy includes when this repo is the work, and the profile already being written accepts `deny = ["~/.local/share/agent-office"]` (kernel read and write denial in Grok’s sandbox doc). A per-CLI list is not required for Grok. The read was already possible under `read-only` and `workspace`. This change kept it and wrote the path down.

**Writes through dependency links, declined.** Holds for Grok (reproduced). “Claude has no write tool” does not hold after this change: the running recipe grants `Bash`. There before for Codex and Grok. This change made it for Claude.

**Stream into the ledger, declined.** Holds. The log is the tool stream; the ledger gets the extracted reply.

**Built work starts at the fix auditor, declined.** Holds. The human asked for a plan, and the light review writes one.

**Git status after the run, declined.** Holds for the live tree under Grok. Does not cover Claude, same as the link finding.

**Brief as a file, taken.** Holds for Codex (`-`), Grok (`--prompt-file`), and Claude (stdin). Gemini is `--print="$(cat <brief>)"`. `agy` accepted that form far enough to start.

## Findings

**HIGH. A Grok reader can read the office database. The probe still passes.** There before for read-everywhere profiles; this change kept it and documented it as closed. Scenario: the daemon is stopped. The reader runs `office status`, sees `daemon not running`, and `curl` fails because `connect` is blocked. The recipe calls that a pass. The same reader opens `~/.local/share/agent-office/memory.db` and puts it in the reply, which is saved to the ledger. Nothing in the checksum looks at that path.

**HIGH. A Grok reader can write the author’s Grok home.** This change’s profile and its “not to the home folder” sentence. Scenario: with `--always-approve`, the reader writes `~/.grok/skills/…/SKILL.md` or a file under `~/.grok/memory-v2`. The round cleanup deletes the copy and the Claude project directory and leaves the skill. A later session loads it. `~/PROBE_HOME` and `~/.grok/config.toml` stay denied, so the probe’s home `touch` still passes.

**HIGH. Claude is not fenced to the named commands.** This change wrote the recipe; the measured line was “named commands, `Bash(office:*)` denied.” Scenario: the reading command is copied as written. The user’s `~/.claude/settings.json` has no `permissionMode` and an `autoMode` environment that calls the office CLI, `localhost:7701`, and `memory.db` routine. Deny list is only `Bash(office:*)`. The model uses the absolute path of `office`, or `curl` to port 7701, or reads `memory.db`. A refusal on the probe is defined as a pass, so the first-computer check does not catch a Claude that declines the probe and later obeys.

**MEDIUM. Claude can write the live dependency folder, and the checksum will not see it.** This change. Scenario: the copy has `node_modules` symlinked at the real repo. The running recipe allows `Bash(bun test:*)` and does not apply an OS sandbox. The test runner writes `node_modules/.cache`. `find . -type f` does not follow the symlink, so `sha256sum -c` stays quiet.

**MEDIUM. A killed Gemini reader leaves no report.** This change, stated in the file. Scenario: the wrapper hits 20 minutes, status is 124, and the log has no partial answer. Codex, Grok, and Claude keep one.

**MEDIUM. Project `.grok` is copied.** This change’s `rsync` line. Scenario: the project has a skill or hook under `.grok/`. `AGENTS.md` and `.claude` are excluded. The Grok reader still loads `.grok`.

## Checked and fine

Codex and Grok flag names, Grok’s jq shape, GNU timeout’s 124, the checksum’s new-versus-changed behavior, the `rsync` excludes, the network and bind block, office-data writes denied, and the light-review wording. I did not re-run the suite. I did not start Codex, Claude, or a finished `agy` turn.