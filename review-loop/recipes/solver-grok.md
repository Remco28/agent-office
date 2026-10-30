I'll read the problem statement and the review-loop skill so the design stays tied to the four gaps and what is measured.The measurements name specific starters. I'll check those commands' help text so the design uses flags that exist, then answer.The smallest fix that still travels with the skill is a new `skills/review-loop/readers.md` for the start commands, three short edits in `SKILL.md`, and one paragraph in `profiles/code-review.md`. No other file needs to change.

## 1. Readers can run the code

In `profiles/code-review.md`, under "What readers get", the runnable copy is a scratch directory under `~/.cache`. That directory is writable. The frozen tree is a different directory and stays untouched.

In `SKILL.md` step 3, on the copy bullet, add one check after the reader exits. Diff the copy against the freeze, and confirm `git status` in the project is unchanged. A change to a file the brief gave the reader makes the report suspect. A change in the project means the freeze was touched. The sandbox profile the author placed in the copy is harness, so it does not count. Keep linking `node_modules` and `.venv`. The project-status check is what shows a write that followed a link.

`readers.md` starts code readers in the measured writable sandboxes:

- Codex, with `-C` set to the copy: `codex exec -s workspace-write`. On this machine that was 165 pass / 10 fail, office blocked, no write to home.
- Grok, not `--sandbox strict` (that row cannot start bun). The author writes this into the copy's `.grok/sandbox.toml` before the run:

```toml
[profiles.review-loop]
extends = "workspace"
restrict_network = true
```

Then `grok --cwd <copy> --sandbox review-loop`. On this machine that was 163 / 12, office blocked, no write to home.

- Claude: `claude -p` with the measured deny of `Bash(office:*)`. That row was 174 / 1, and the one failure is the stripped `AGENTS.md`. It can bind a local server.

Codex `workspace-write` and this Grok profile did not bind a local server. `readers.md` says those checks are unmeasured for that reader. Step 0 on the author's machine remains the run that has a server.

## 2. Any computer, and the office stays unreachable

In `SKILL.md` step 3, the office bullet should point at `readers.md` instead of the office's tool notes. The fence is the sandbox or the deny rule in that command. Stripping `AGENTS.md`, `CLAUDE.md`, `.claude`, and `.agents` stays as it is.

`readers.md` is in the skill, so git carries it. The prompt is a file, because a flag that takes the next token will swallow a brief placed after it. Current help shows three of those: Claude's `--disallowedTools` takes every following argument, Grok's `-p` / `--single` takes the next token, and Grok's `-s` is a session id, not a sandbox. Codex's prompt is the positional argument, or stdin if the prompt is `-` or omitted.

- Codex reads the brief on stdin: `codex exec -C <copy> -s workspace-write --json -o <ledger>/<reader>.final - < <brief>`.
- Grok uses `--prompt-file`, which the headless docs say is enough to run tools and exit. Sandbox is the long flag `--sandbox`.
- Claude takes the brief on stdin with `-p`. The office deny is one `--settings` value, so it is not a variadic tool list sitting in front of the brief.

Grok reads that profile from the copy, so a second computer does not need the author's tool-notes database. The Grok docs say a different profile of the same name in `~/.grok/sandbox.toml` wins. `readers.md` should say a startup warning that the user profile won voids the run.

## 3. A timeout still leaves a report

The host shell writes the stream straight into the ledger folder. The redirect belongs to the shell, so the sandbox rule about home does not apply to it. The copy can still be deleted later. The skill already treats saved reports as the record.

```bash
timeout <limit> <reader> > review-loop/<round>/<reader>.jsonl
echo $? > review-loop/<round>/<reader>.status
```

The author chooses the limit. Exit code 124 is the timeout. The jsonl plus that status line is the report when there is no final answer.

- Grok: `--output-format streaming-json`. The problem's measurement already saw this survive `timeout`.
- Claude: `--output-format stream-json --verbose`. It writes as it goes. Survival across a kill was not in the measurement.
- Codex: keep `-o` for the final message when the run finishes. Add `--json`, which current help describes as JSONL events on stdout. `-o` alone is only the final message, so a killed run would leave nothing. I have not kill-tested `--json`.

## 4. Light review of work that is already built

In `SKILL.md`, only "The light review":

- Step 1 writes the plan in `review-loop/<change>/PLAN.md` before anyone reads it. Commit only when the user asked.
- One sentence after the list: work that is already built starts at the fix auditor, on the diff that exists, saved into the change folder. Do not write a plan afterwards.

The full loop already says to commit what readers get, or keep a patch in the ledger folder. Leave that.

## Unsure

I checked current `--help` for Codex, Grok, and Claude, and the installed Grok pages for sandbox profiles and headless mode. I did not start a reader, kill one, or re-run the 175 tests. The pass/fail counts and the Grok `timeout` result are the problem's measurements.

I do not know whether the 10 and 12 failures are the local-server tests. The table only pairs them with "local server: no".

Claude's `Bash(office:*)` deny was measured as a refusal of the `office` command. I do not know whether another client or a socket still reaches the office. The exact `--settings` JSON and what "named commands" were is not in the materials, so I would not invent that argv. Codex `workspace-write` and Grok `restrict_network` are the rows that report the office blocked with the network closed.

The Grok docs say child-network blocking is Linux-only and a no-op on macOS. The Grok recipe is not a fence there. Codex was measured on this Linux machine only.

I did not run `grok --sandbox review-loop --prompt-file …`. The shape comes from the current help and those docs. "Single" there means one user prompt, then tools, then exit. I did not confirm that a headless run waits on an approval prompt. If it does, the stream should show the wait and the status file should record the timeout. `--yolo` is the docs' auto-approve flag. I did not check that it leaves the sandbox in place, so it stays out of the recipe until someone does.

Those same docs say a profile that extends `workspace` can still write `~/.grok/` and `/tmp`. The table says "Write to home: no" for that row. Both can be true if the probe was a file outside `~/.grok`. I am not treating `~/.grok` as sealed.

I have not shown whether a sandbox write follows a symlink from the copy into a linked `node_modules`. The project `git status` check catches that afterwards. It does not prevent it. Codex's `--worktree` and a git worktree share the project's git directory, so the copy should stay its own directory under `~/.cache`. I did not prove a worktree would move a ref.