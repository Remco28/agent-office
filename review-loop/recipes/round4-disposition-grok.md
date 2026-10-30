I'll audit how the findings were closed, starting with the ledger, the human's check-in, and the review procedure.The check-in closures and the recipe’s containment sentences don’t line up yet. I’ll compare them with the diffs and the round-3 reports.The check-in closes several rows in one sentence. I’ll test the ones a short command can settle: the service-manager escape, a missing bind target, and writes the fence still allows.The check-in answer was used for the home-folder reads, and past them. Several rows that are still real under Frank's wording are marked closed by a sentence. This should not merge.

This machine refuses unprivileged user namespaces, so `bwrap` could not be run here. The fence itself was not re-executed. `find -fprintf` does write a file.

## (1) The human's answer, and rows it does not reach

Frank's answer, as given: fence agents off changing the repo; then off changes outside it, tools left installed or running, and temp files. Home-folder reads are accepted. Gemini stays. The other laptop is Linux.

That answer does reach these:

- History files and `~/.grok` memory, as reads. Both sit in the home folder. Closing them as accepted reads matches the sentence.
- Gemini stays, so "remove the Gemini reader" stays Frank's.
- Linux-only matches "the other laptop is Linux."
- The probe row that Grok's `strict` `ls` is denied rather than empty. The new probe judges files on the host after the run, so a denied `ls` is no longer the pass/fail line.

It does not reach these, and they were closed anyway:

- **systemd-run.** The critic's failure was a host command that can write the repo and the home directory and outlive the fence. That is the primary fear, plus the lesser one. The ledger closes it as "the point is nothing left running," with the flags. The only recorded systemd result is still "exit 0 in both," from before the flags. "Flags tested, all four CLIs work" shows the CLIs still start. Round 4's "nothing left running" does not name `systemd-run`. Claude's `<round>/run` script still has no `--unshare-pid`, no `--proc`, and no `--tmpfs` on `/run/user`.
- **Hooks, MCP, and "the live repo readable by path," closed as accepted reads.** The same finding includes a parent hook that can write, a linked worktree whose main repo is not under `--ro-bind <repo>`, `<round>/` beside the copy, and `OFFICE_DB` outside the hidden office folder. Frank accepted reads of the home folder. He did not accept writes, and he did not accept a second repo path staying writable. The write half is waived as "not a reader's act" and "the machines have none that matter." The row's own check says "no MCP or office hook here checked." That is the same shape of reason the ledger already lists under Believed, and wrong: "Needs a reader that chooses to." The systemd row uses it again ("needs a reader that sets out to escape").
- **CLI logs and settings, attributed to Frank.** `readers.md` says "Accepted (Frank, 30 Oct 2026)" and then "Each CLI still updates its own logs and settings in its own folder. Neither is what this fence is for." Frank accepted reads. Round 4 recorded those writes left on disk. Writes outside the repo are the lesser fear he kept.
- **The office-data probe row.** Rewriting the probe dropped `ls` of the office folder. The new probe never names `OFFICE_HOME`. A fence that hides the wrong directory still passes. Curl covers `OFFICE_PORT` only.
- **The 0-byte `settings.json` row, the 128 KB brief, unquoted paths, other toolchains, editable venvs.** None of these is a home read. The check-in text does not mention them. "Stated or taken" and "leave out targets that don't exist" are the author's closes.
- **`find -fprintf` stays inside a rejected row.** `find -exec python3` was reproduced as refused. The ledger says `-fprintf` was not tried. The write is the part Frank's wording still cares about: Gemini's allow list includes `find`, and the outer fence is `--dev-bind / /`, so the home directory is writable except the few tmpfs mounts. `find -fprintf` writes a file. That was checked here, outside `agy`.

The ledger's success question is still "cannot reach the office whatever they decide." The check-in says that wording was the author's and has been replaced. `readers.md` puts "whatever the reader decides" back into the fence paragraph in the same diff.

## (2) Closed by a decision or a sentence, where a test was possible

| Row | How it was closed | Test that is missing |
|---|---|---|
| systemd-run escapes fence and run script | "Nothing left running," plus flags | Run `systemd-run --user` again inside the new fence and inside `<round>/run`, and see whether a host file appears. The pre-flag run already exited 0. |
| History files, `~/.grok` memory, hooks, MCP, live repo by path | "Accepted reads"; hook write "not chased" | The read half matches Frank. The write half does not. Look for hooks and MCP on this machine, and `touch` the main repo of a linked worktree. The ledger says the hook check was not done. |
| Probe: `ls` path vs `OFFICE_HOME` | Probe rewritten, row "removed" | Set `OFFICE_HOME` somewhere else and run the new probe. |
| 0-byte `settings.json` | "Leave out targets that don't exist" | Bind a missing path and see whether a 0-byte file remains. The ledger says "not reproduced." The Gemini extras still require `--ro-bind .../settings.json`. |
| Brief over 128 KB | "A brief over about 128 KB fails there, so keep materials in the copy" | Pass a brief of that size to Grok and Gemini. Marked "kernel fact, not reproduced." |
| Unquoted `$FENCE` and paths | Bundled into "stated or taken" | A path with a space. The diff does not quote `$FENCE` or the paths. The recipe still has `bwrap $FENCE` and an unquoted heredoc. Nothing in `readers.md` states this limit. |
| Toolchains writing `~/.cache`; editable `.venv` imports the live repo | Two sentences under the suite note | The ledger says "not reproduced; none in use here checked." The copy steps still say `ln -s` for `.venv`. |
| `timeout` without `-k` | The flag was added: `timeout -k 30s` | A child that ignores `SIGTERM`. This one is a code change, and it is unproven. |

Round 4's prediction says the disposition auditor would likely challenge "closing the history-file and hooks rows by decision rather than by test." No round-4 disposition report is in the materials.

## (3) The containment claim with no test behind it

In `readers.md`, the fence "applies to the reader's whole process, whatever the reader decides," and "Hiding the office's data and the CLIs' session logs keeps those from growing too."

No test is recorded for either sentence.

The growth sentence is the sharp one. The mounts cover `~/.claude/projects`, `~/.codex/sessions`, `~/.grok/sessions`, and two Gemini directories. The fix auditor had already read `~/.claude/history.jsonl`, `~/.codex/history.jsonl`, `~/.gemini/antigravity-cli/history.jsonl`, and `~/.grok/sessions`, and the author wrote that down as believed and wrong: hiding four folders did not hide the transcripts. Nothing in the ledger is a before-and-after size of those files across a fenced run. Round 4's "left on disk: each CLI's own logs and settings" is the residue, and the growth sentence stayed.

"The whole process" is the same gap. The recorded script is commands. The parent process, its hooks, and its network are the part the author marked "not chased." The outer fence does not pass `--unshare-net`. "The recipes below do that for the commands a reader runs" has suite and port results for Codex, Grok, and Claude. Gemini's recipe is an allow list, and no network result is recorded for it.

Round 4's comparison (repo, home, tool folder, npm/pip/bun, leftover processes, `/tmp`, `/var/tmp`, `/dev/shm`) does not cover the rest of `/`. Claude's run script is still `--dev-bind / /` with home read-only and the copy writable. A write under `/opt` or `/usr/local` is a change outside the repo, and it is not in that list.

## (4) Still open, enough to hold the merge

Yes.

- The systemd escape is the verified HIGH from a fix. It is not shown dead. The code profile stops only after a round with no HIGH that is not old, on ratings the disposition auditor has checked, and only when that round needed no HIGH or MEDIUM fixes. These fixes are that next round's material. Round 4 has measurements and predictions, and no fix-auditor report and no disposition report.
- The check-in closes were written after round 3's disposition audit. That auditor never saw them. The skill's rule is that a stop is judged on ratings the disposition auditor has checked.
- A parent hook that can write is still described as open, then set aside without the check the row says was missing. The standing rule in `PROBLEM.md` is still that readers never use the office, and that this must not rest on the reader's judgement.
- Gemini's `find` write forms were not tried. The outer fence still leaves the home directory writable.
- The 0-byte settings bind is still in the recipe that must be used as written. Unquoted paths are still in the recipe.
- The script behind "a script tried all of it" is not in the record. The suite figures in round 4 match the table in `PROBLEM.md` exactly (Codex 165/10, Grok 163/12, Claude 174/1). Whose run that is was already an open note from the round-3 disposition auditor.

What was checked here: the ledger against `PROBLEM.md`, both diffs, the three round-3 reports, `readers.md`, and the code-review scale. `find -fprintf` writes. `bwrap` could not be started on this computer, so the fence flags, the missing-file bind, and a live `systemd-run` were not re-run.