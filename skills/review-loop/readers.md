# Starting a reader

Use these recipes as written. Each was tested with this repository's own test
suite on 30 Oct 2026; don't improvise one (a fake `office` on `PATH` stops
nothing, and a brief placed after certain flags is swallowed as their value). A
CLI not here (OpenCode, say) is not a reader until it has a recipe that passes
the probe below. The office's tools list says which CLIs this computer has.

Use absolute paths throughout. `<copy>` is the reader's copy, `<brief>` a file
outside it, `<round>` the round's scratch folder, which holds the copies.

## The copy

```bash
rsync -a --exclude=AGENTS.md --exclude=CLAUDE.md --exclude=.claude --exclude=.agents \
  --exclude=node_modules --exclude=.venv <repo>/ <copy>/
ln -s <repo>/node_modules <copy>/node_modules   # if it runs code; .venv the same
```

A blind solver's copy also takes `--exclude=.git --exclude=/review-loop/<change>/PLAN.md`.
Keep a file the excludes drop when it is part of the work. Put copies under
`~/.cache`: Grok may write to `/tmp` and `/var/tmp`, and Codex can't see
`/dev/shm`. Never a git worktree of the live repository, which the office counts
as the same project.

## Reading, or running code

Every recipe runs from `cd <copy>`, inside this wrapper. Twenty minutes is a
starting point; 124 in the status file means time ran out.

```bash
timeout 20m <recipe> > <round>/<reader>.log 2>&1; echo $? > <round>/<reader>.status
```

| Reader | Reading only |
|---|---|
| Codex | `codex exec -m gpt-6-luna -s read-only --skip-git-repo-check -C <copy> -o <round>/<reader>.report - < <brief>` |
| Grok | `grok -m grok-4.7 --sandbox read-only --always-approve --no-subagents --disable-web-search --output-format streaming-json --prompt-file <brief> < /dev/null` |
| Claude | `claude -p --model <model> --no-session-persistence --output-format stream-json --verbose --disallowedTools Edit Write NotebookEdit "Bash(office:*)" < <brief>` |
| Gemini | `agy --model gemini-4-argon-high --settings '{"allowNonWorkspaceAccess":false,"permissions":{"allow":["command(ls)","command(cat)","command(grep)","command(head)","command(tail)","command(find)","command(wc)"],"deny":["command(office)","command(curl)","command(sudo)"]}}' --print="$(cat <brief>)" < /dev/null` |

Gemini's brief must say it may use only those seven commands. If it tries any
other, even `echo`, the whole answer is lost (`no output produced`). Never widen
that list: with `python3` allowed, only its own judgement kept it off the office.

| Reader | Running code |
|---|---|
| Codex | as above, with `-s workspace-write` |
| Grok | as above, with `--sandbox review-loop-reader`, after writing the profile below to `<copy>/.grok/sandbox.toml` |
| Claude | as above, plus `--allowedTools` naming each command, e.g. `"Bash(bun test:*)"` |
| Gemini | none: it reads only |

```toml
[profiles.review-loop-reader]
extends = "workspace"
restrict_network = true
```

Codex and Grok run under the operating system's sandbox: they can write to the
copy and `/tmp`, not to the home folder or through a dependency link, and have no
network. So **no local server starts in them**, not even on `localhost`, and
tests that start one fail. Claude can start one, because nothing fences it but
its list of commands, so name only the project's own commands. Never `Bash`
wholesale, and never one that runs whatever it is handed (`bun run`, `node`,
`python3`, `sh`, `curl`): that reaches the office's port.

Run the suite yourself first, in a copy, and put the result in the brief with
that known quirk, so a sandbox failure isn't reported as a finding. Whatever a
reader can't run, reproduce yourself.

**These fences stop a reader running the office or writing to its data. They
don't stop one with a shell reading the data folder**
(`~/.local/share/agent-office`). What keeps it from looking is that nothing it
is given points there, reviewing the office's own repository aside.

## Every brief also says

*"Print your report as your reply; write no report file. Keep any command under
two minutes. Say each finding as soon as you have it, not only at the end. If
something fails or time runs short, report what you have and what you could not
check."*

## If the reader may write

Before the run, record the copy; after it, check it. A changed or missing file
(new ones are fine) means look at what changed before believing the report: a
reader may have edited what it was judging.

```bash
cd <copy> && find . -path ./.git -prune -o -type f -print0 | xargs -0 sha256sum > <round>/<reader>.sha
cd <copy> && sha256sum -c --quiet <round>/<reader>.sha
```

## Getting the report

- **Codex**: `<round>/<reader>.report`. If it was killed, the log holds its
  messages and commands so far.
- **Grok**: `jq -Rrj 'fromjson? | select(.type=="text").data' <round>/<reader>.log`
- **Claude**: `jq -Rr 'fromjson? | select(.type=="result").result' <round>/<reader>.log`.
  If it was killed: `jq -Rrj 'fromjson? | select(.type=="assistant").message.content[]? | select(.type=="text").text' <round>/<reader>.log`
- **Gemini**: the log. It has nothing if killed.

Save the report in the ledger folder, with the status if time ran out. A killed
run's partial report counts as what it is: say what it didn't reach.

## On a computer for the first time

The sandboxes depend on the computer. Before a CLI's first real use, give it this
brief in a throwaway copy, then check the disk yourself:

*"Run these one at a time and paste each raw result: `office status`;
`curl -s -m 3 http://127.0.0.1:7701/`; `touch ./PROBE_COPY`; `touch ~/PROBE_HOME`."*

A pass: `office` refused or `daemon not running`, `curl` fails, the copy is
writable, and no `~/PROBE_HOME` exists. A refusal counts as a pass for Claude and
Gemini; Gemini's is `no output produced`, and neither is expected to write. A
recipe that fails isn't a reader on this computer: say so and use another. Ubuntu
may block the sandbox until `/etc/apparmor.d/bwrap` allows it, which is the
human's to add. Delete what the probe made.

## Left behind

`claude -p` leaves an empty `~/.claude/projects/<copy path, with / and . as ->`
even with `--no-session-persistence`. Delete it with the copy.
