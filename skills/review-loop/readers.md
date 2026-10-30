# Starting a reader

Use these recipes as written; only a model name may change, if the computer
doesn't offer it. Tested on 30 Oct 2026 on Linux, the running-code ones with this
repository's own test suite. `bwrap` is Linux-only, so another operating system
has no recipe. Don't improvise one: a fake `office` on `PATH` stops nothing, and a
brief placed after certain flags is swallowed as their value. A CLI not here
(OpenCode, say) is not a reader until it has a recipe that passes the probe
below. The office's tools list says which CLIs this computer has.

Use absolute paths throughout. `<copy>` is the reader's copy, `<brief>` a file
outside it, `<round>` the round's scratch folder, which holds the copies.

## The copy

```bash
rsync -a --exclude=AGENTS.md --exclude=CLAUDE.md --exclude=GEMINI.md --exclude=.claude \
  --exclude=.agents --exclude=.grok --exclude=.gemini --exclude=.codex --exclude=/review-loop \
  --exclude=node_modules --exclude=.venv <repo>/ <copy>/
ln -s <repo>/node_modules <copy>/node_modules   # if it exists and the reader runs code; .venv the same
```

Then copy the reader's materials in. Keep a file the excludes drop when it is
part of the work. If `<repo>/.git` is a file (a linked worktree), exclude it too:
it points back into the live repository. Readers then have no history, so give
them the diff. Put copies under `~/.cache`: Grok may write to `/tmp` and
`/var/tmp`, and Codex can't see `/dev/shm`. Never a git worktree of the live
repository, which the office counts as the same project.

**A blind solver's copy comes from the version before the change**, so it holds
no plan and no built work. Make it with `git -C <repo> archive <version before> |
tar -x -C <tmp>`, then the rsync above from `<tmp>/`, and copy the problem in.

## The fence

Every reader runs inside this, which applies to its whole process whatever it
decides. The office's data folder and every agent's transcripts, which quote the
office, look empty; the live repository can't be written, even through a
dependency link.

```bash
FENCE="--die-with-parent --dev-bind / / --tmpfs ${OFFICE_HOME:-$HOME/.local/share/agent-office} --ro-bind <repo> <repo> \
  --tmpfs $HOME/.claude/projects --tmpfs $HOME/.codex/sessions \
  --tmpfs $HOME/.gemini/antigravity-cli/conversations --tmpfs $HOME/.gemini/antigravity-cli/brain"
cd <copy> && timeout 20m bwrap $FENCE <extras> <recipe> > <round>/<reader>.log 2>&1; echo $? > <round>/<reader>.status
```

Twenty minutes is a starting point; 124 in the status file means time ran out.
The fence can't take the network away, because the CLI needs its model, so the
recipes below do that for the commands a reader runs.

Only **Gemini** has `<extras>`: `--tmpfs $HOME/.gemini/config/rules --ro-bind
<round>/empty.json $HOME/.gemini/antigravity-cli/settings.json`, after
`echo '{}' > <round>/empty.json`. Its saved settings allow `python3`, `sh` and
`office`, and `--settings` adds to them rather than replacing them. A saved rule
also tells it to run a script on its first turn, which loses the whole answer.

## Reading, or running code

| Reader | Reading only |
|---|---|
| Codex | `codex exec -m gpt-6-luna -s read-only --skip-git-repo-check -C <copy> -o <round>/<reader>.report - < <brief>` |
| Grok | `grok -m grok-4.7 --sandbox strict --always-approve --no-subagents --disable-web-search --output-format streaming-json -p "$(cat <brief>)" < /dev/null` |
| Claude | `claude -p --restricted --strict-mcp-config --tools Read Grep Glob --permission-prompts none --model claude-opus-5-5 --no-session-persistence --output-format stream-json --verbose < <brief>` |
| Gemini | `agy --model gemini-4-argon-high --settings '{"permissions":{"allow":["command(ls)","command(cat)","command(grep)","command(head)","command(tail)","command(find)","command(wc)"],"deny":["command(office)","command(curl)","command(sudo)"]}}' --output-format stream-json --print="$(cat <brief>)" < /dev/null` |

| Reader | Running code |
|---|---|
| Codex | as above, with `-s workspace-write` |
| Grok | as above, with `--sandbox review-loop-reader`, after writing the profile below to `<copy>/.grok/sandbox.toml`, with `<home>` spelled out |
| Claude | as above, with `--tools Read Grep Glob Bash --allowedTools "Bash(<round>/run bun test:*)"`, after writing the script below |
| Gemini | none: it reads only |

```toml
[profiles.review-loop-reader]
extends = "strict"
read_only = ["<home>"]
```

```bash
cat > <round>/run <<EOF
#!/bin/sh
exec bwrap --die-with-parent --unshare-net --dev-bind / / --ro-bind $HOME $HOME --bind <copy> <copy> -- "\$@"
EOF
chmod +x <round>/run
```

**Gemini's brief must say**: *"You may use only ls, cat, grep, head, tail, find and
wc, one at a time, with no pipes."* Any other command, even `echo`, loses the whole
answer (`no output produced`). Never widen that list.

**Claude** has no shell but `<round>/run`: no network but its own `localhost`,
and only the copy and `/tmp` to write to. So it alone can start a local server.
Name each command with `run` in front: `"Bash(<round>/run bun test:*)"`,
`"Bash(<round>/run bun run typecheck)"`. Never `Bash` wholesale. Its file tools
reach only the working directory, so its materials must be in the copy.

**Codex and Grok** run under the operating system's sandbox: they can write to
the copy and `/tmp`, and have no network, not even `localhost`. So **no local
server starts in them**, and tests that start one fail. Grok under `strict` can
read only the copy, so its brief goes on the command line.

Run the suite yourself first, in a copy, and put the result in the brief with
that known quirk, so a sandbox failure isn't reported as a finding. Whatever a
reader can't run, reproduce yourself.

**What is left.** Codex, Gemini and a running-code Grok can read the rest of the
home folder, credentials included, and what they read goes to their model's
provider. Only what is hidden above is fenced; nothing else points them there.

## Every brief also says

*"Print your report as your reply; write no report file. Keep any command under
two minutes. Say each finding as soon as you have it, not only at the end. If
something fails or time runs short, report what you have and what you could not
check."*

## If the reader may write

Before the run, record the copy; after it, check it. A changed or missing file
(new ones are fine) means look at what changed before believing the report: a
reader may have edited what it was judging. Check too that `git -C <repo> status
--short` hasn't changed: a change there means the fence failed.

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
- **Gemini**: `jq -Rr 'fromjson? | select(.event=="result").result.response' <round>/<reader>.log`.
  If it was killed: `jq -Rrj 'fromjson? | .step_update.text_delta? // empty' <round>/<reader>.log`

Save the report in the ledger folder, with the status if time ran out. A killed
run's partial report counts as what it is: say what it didn't reach.

## On a computer for the first time

The sandboxes depend on the computer. Before a recipe's first real use, check
`office status` says `ok` on the computer itself: with the office stopped, the
probe passes for the wrong reason. Then give the reader this brief, fenced, in a
throwaway copy, and check the disk yourself. Say it is the owner's check, or a
reader may refuse the whole thing:

*"The owner is checking that this sandbox refuses what it should, so several of
these are expected to fail. Run them one at a time and paste each raw result:
`office status`; `curl -s -m 3 http://127.0.0.1:${OFFICE_PORT:-7701}/`;
`ls -A ~/.local/share/agent-office`; `touch ./PROBE_COPY`; `touch ~/PROBE_HOME`;
`touch <repo>/PROBE_REPO`."*

- **Codex, Grok**: `daemon not running`, `curl` fails, the folder is empty, and
  neither `~/PROBE_HOME` nor `<repo>/PROBE_REPO` exists. `./PROBE_COPY` exists under
  a running-code recipe (and under Grok's `strict`).
- **Claude**: reading, each refused; running, each refused bare, then `<round>/run`
  on a named command works and cannot reach the port.
- **Gemini**: it loses its answer on the first refusal, so one command per run:
  `office status` and `python3 -c "print(1)"` must each give `no output produced`,
  and `ls -A` of the folder must show it empty.

Say in that CLI's tool note on this computer that it passed, and when. A recipe that
fails isn't a reader on this computer: say so and use another. Ubuntu may block
`bwrap` until `/etc/apparmor.d/bwrap` allows it, which is the human's to add.
Delete what the probe made.

## Left behind

A `--tmpfs` over a folder that didn't exist leaves it, empty. Delete it with the
copy.
