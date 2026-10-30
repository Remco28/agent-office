I'll audit the last-round fixes against the procedure and the full change, starting with the materials and the review criteria.The last-round diff is in. Next I’ll read the procedure as written and compare it with the full change.The last round’s diff is mostly the fence and the reader recipes. I’ll check those commands against the real paths and what they do when followed as written.The live office directory is hidden and not writable from this running-code reader, and a child connect to `127.0.0.1:7701` returns `EPERM`. The transcript claim and two probe checks do not hold.

## (1) Each change in `fix.diff`

**Evidence paragraph ("both were fixed… Claude's only shell… Grok moved to strict").** Partly still there. The live database is hidden. Prior transcripts are not. Quoted below.

**Opening ("Linux-only… don't improvise").** Gone. A computer without `bwrap` is told it has no recipe.

**Fence prose and `FENCE=` (office path via `OFFICE_HOME`, plus four transcript tmpfs mounts).** The office-folder half is gone. Here, `/home/frank/.local/share/agent-office` is an empty tmpfs and `touch` there returns "Permission denied". The transcript half is still there: those four mounts are empty, and the files that actually hold text are not under them.

**Grok extras removed (`~/.grok/skills`, `~/.grok/memory-v2`).** The skills write is gone: `touch` in `~/.grok/skills` is denied. Hiding memory is replaced by a new problem. `strict` still reads `~/.grok`, and the tmpfs that covered memory is gone.

**"The fence can't take the network away… recipes below do."** Nothing wrong found. This Grok sandbox blocks the office port for a child process.

**Gemini `deny` of `office`, `curl`, and `sudo`.** Nothing wrong found in the text. `agy` was not run.

**Reading Grok: `--sandbox strict` and `-p "$(cat <brief>)"`.** The database read is gone (`strict` does not include the office path, and the tmpfs covers it). "Can read only the copy" is a new problem. Grok's sandbox guide says `strict` reads the working directory, system paths, and `~/.grok`.

**Running Grok: `extends = "strict"`, `read_only = ["<home>"]`.** The "cannot run code" failure is gone here. `bun` 1.3.13 starts, the copy and `/tmp` are writable, the home directory and the live repo are not, and the office port is blocked.

**Claude `run` script and `Bash(<round>/run bun test:*)`.** Not re-checked. Nested `bwrap` fails in this sandbox with "No permissions to create new namespace". The flags are the right shape (`--unshare-net`, `--ro-bind $HOME`, `--bind` of the copy). Bubblewrap's bind flag includes `MS_REC` (`0xd000`), so a later bind of `$HOME` keeps a tmpfs mounted under it. The new sentence about writes is wrong (below).

**"Codex and Grok… no network, not even localhost."** Holds for this Grok profile. `socket.connect_ex(("127.0.0.1", 7701))` returned errno 1 (`EPERM`).

**"What is left… Only what is hidden above is fenced."** Still there. The home-read residual is stated plainly. The "only what is hidden" clause does not match the files that are readable.

**`git status --short` after the run.** New, small problem. The checksum is recorded before and checked after. Status is not.

**Probe (owner wording, `OFFICE_PORT`, `PROBE_REPO`).** The refusal wording is gone. The port default is in the probe. The `ls` path was not updated with `OFFICE_HOME`. The expected "folder is empty" result is wrong for reading-only Grok.

**Tool-note line and "Left behind".** Nothing wrong found. Empty dirs created by `--tmpfs` are still deleted with the copy. `bwrap` has a "Can't mkdir parents" path, so a missing Gemini directory does not by itself stop the fence.

## (2) Worse, or fixed in one place only?

Yes, in three places.

- The fence uses `${OFFICE_HOME:-…}`. The probe still runs `ls -A ~/.local/share/agent-office`. `src/paths.ts` uses `OFFICE_HOME` or else that default. The curl line was updated for `OFFICE_PORT`. The `ls` line was not.
- Transcript mounts were added for Claude, Codex, and Gemini, on directories that are empty tmpfs mounts here. They were not added for `~/.grok/sessions`, `~/.claude/history.jsonl`, `~/.codex/history.jsonl`, or `~/.gemini/antigravity-cli/history.jsonl`.
- Grok's memory tmpfs was removed when Grok moved to `strict`. `strict` can still read `~/.grok`, including `memory-v2` and `sessions`.

## (3) `readers.md` followed literally

**MEDIUM. Last fix.** "Every agent's transcripts, which quote the office, look empty."

From inside this fence, those four tmpfs dirs are empty, and these are readable:

- `~/.claude/history.jsonl` (433011 bytes, 613 lines mentioning `agent-office`, 4 mentioning the office data path, 137 lines longer than 500 bytes)
- `~/.codex/history.jsonl` (the office port appears)
- `~/.gemini/antigravity-cli/history.jsonl` (75 matching lines, longest 3089 bytes)
- `~/.grok/sessions` (10 files containing the office path in the first 30MB)

A reader greps those and gets earlier office text. The live database was empty, so this is leftover text, not a live query. The fence says that channel is closed.

**MEDIUM. Last fix.** "Grok under `strict` can read only the copy, so its brief goes on the command line."

The brief-on-the-command-line part is right when the brief sits in `~/.cache` outside the copy. The "only the copy" part is false. A reading-only Grok opens `~/.grok/sessions` and `~/.grok/memory-v2` (other projects' memory, which the removed tmpfs used to hide). This running profile, which adds `read_only = ["<home>"]`, can read the history files above too. That home read is the disclosed residual. The `strict` read of `~/.grok` is not.

**MEDIUM. Last fix.** Probe: `` `ls -A ~/.local/share/agent-office` `` while the fence hides `${OFFICE_HOME:-$HOME/.local/share/agent-office}`.

If `OFFICE_HOME` is `/srv/office`, the fence covers `/srv/office` and the probe lists the default folder. An empty default folder is recorded as a pass, which is the failure the probe text warns about when the office is stopped.

**MEDIUM. Last fix.** "Codex, Grok: … the folder is empty … `./PROBE_COPY` exists under … Grok's `strict`."

`strict` cannot read `~/.local/share/agent-office`. `ls` is denied, so it does not "show empty". A first-time check of the reading recipe fails a Grok that is doing what `strict` does, and the page says a failed recipe is not a reader. Running-code Grok, with home readable, does see the empty tmpfs. That part matches.

**LOW. Last fix.** "Claude… only the copy and `/tmp` to write to."

The script is `bwrap … --dev-bind / / --ro-bind $HOME $HOME --bind <copy> <copy>`. Home is read-only and the copy is writable. Paths outside home stay on the writable `/` bind, including `/var/tmp`. A `bun test` that writes there can. Nested `bwrap` could not be run here, so this is from the script as written.

**LOW. Last fix.** "Check too that `git -C <repo> status --short` hasn't changed: a change there means the fence failed."

There is no saved "before". Step 3 allows a patch instead of a commit, so the repo is often already dirty. A literal reading treats any status output as a broken fence and throws out the report. The copy checksum above it does save a before.

Nothing else in the recipes failed a check I could run. The fence string word-splits into 17 arguments for a normal home path. `bun` runs. Office, home, skills, and the live repo are not writable. The copy and `/tmp` are.

**Not checked.** The Claude `run` script (no nested user namespace), `codex`, `claude`, and `agy` themselves, and the full suite. Local-server failures and the missing `AGENTS.md` test are the sandbox quirk you named.