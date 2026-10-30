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

Every reader runs inside this, so that when it finishes the machine is as it was:
the repository unchanged, nothing installed, nothing left running, no temporary
files about. It applies to the reader's whole process, whatever the reader
decides. `/tmp` and its like vanish with it, as does anything it left running, and
the live repository can't be written. Hiding the office's data and the CLIs'
session logs keeps those from growing too.

```bash
FENCE="--die-with-parent --unshare-pid --dev-bind / / --proc /proc --tmpfs /run/user/$(id -u) \
  --tmpfs /tmp --tmpfs /var/tmp --tmpfs /dev/shm --tmpfs ${OFFICE_HOME:-$HOME/.local/share/agent-office} \
  --ro-bind <repo> <repo> --tmpfs $HOME/.claude/projects --tmpfs $HOME/.codex/sessions --tmpfs $HOME/.grok/sessions \
  --tmpfs $HOME/.gemini/antigravity-cli/conversations --tmpfs $HOME/.gemini/antigravity-cli/brain"
cd <copy> && timeout -k 30s 20m bwrap $FENCE <extras> <recipe> > <round>/<reader>.log 2>&1; echo $? > <round>/<reader>.status
```

Leave out any `--tmpfs` or `--ro-bind` whose target doesn't exist on this computer:
`bwrap` would create it on the real disk. Twenty minutes is a starting point; 124
in the status file means time ran out. The fence can't take the network away,
because the CLI needs its model, so the recipes below do that for the commands a
reader runs.

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
and nothing in the home folder but the copy to write to. So it alone can start a
local server.
Name each command with `run` in front: `"Bash(<round>/run bun test:*)"`,
`"Bash(<round>/run bun run typecheck)"`. Never `Bash` wholesale. Its file tools
reach only the working directory, so its materials must be in the copy.

**Codex and Grok** run under the operating system's sandbox: they can write to
the copy and the fence's `/tmp`, and have no network, not even `localhost`. So **no
local server starts in them**, and tests that start one fail. Grok's `strict`
can't read a brief kept outside the copy, so its brief goes on the command line,
as Gemini's does; a brief over about 128 KB fails there, so keep materials in
the copy.

Run the suite yourself first, in a copy, and put the result in the brief with
those quirks, so a sandbox failure isn't reported as a finding. The home folder
is read-only, so a tool that caches there needs pointing at `/tmp` (say
`XDG_CACHE_HOME=/tmp/cache` in the brief). A linked `.venv` with an editable install
imports the live repository, not the copy: install into the copy instead. Whatever
a reader can't run, reproduce yourself.

**Accepted (Frank, 30 Oct 2026).** Readers can read the home folder, and what they
read goes to their model's company. Each CLI still updates its own logs and
settings in its own folder. Neither is what this fence is for.

## Every brief also says

*"Print your report as your reply; write no report file. Keep any command under
two minutes. Say each finding as soon as you have it, not only at the end. If
something fails or time runs short, report what you have and what you could not
check."*

## If the reader may write

Before the run, record the copy and the repository; after it, check them. A changed
or missing file in the copy (new ones are fine) means look at what changed before
believing the report: a reader may have edited what it was judging. A changed
repository means the fence failed: stop and tell the human.

```bash
cd <copy> && find . -path ./.git -prune -o -type f -print0 | xargs -0 sha256sum > <round>/<reader>.sha
git -C <repo> status --short > <round>/<reader>.repo
cd <copy> && sha256sum -c --quiet <round>/<reader>.sha
git -C <repo> status --short | diff <round>/<reader>.repo -
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
`office status` says `ok` on the computer itself. Then give the reader this brief,
fenced, in a throwaway copy, and check the disk yourself. Say it is the owner's
check, or a reader may refuse the whole thing:

*"The owner is checking that this sandbox contains a reader, so several of these
are expected to fail. Run them one at a time and paste each raw result:
`touch <repo>/PROBE_REPO`; `touch ~/PROBE_HOME`; `touch /tmp/PROBE_TMP`;
`nohup sleep 3001 > /dev/null 2>&1 &`; `curl -s -m 3 http://127.0.0.1:${OFFICE_PORT:-7701}/`;
`touch ./PROBE_COPY`."*

Afterwards, on the computer itself, a pass is: none of the three `PROBE` files
outside the copy exist, no `sleep 3001` is running, and `curl` failed. Under a
running-code recipe `./PROBE_COPY` exists too. **Claude** refuses each bare, so give
it `<round>/run sh <script of those commands>` as its named command. **Gemini** loses
its answer on the first refusal, so one command per run: `python3 -c "print(1)"` and
`touch ~/PROBE_HOME` must each give `no output produced`.

Say in that CLI's tool note on this computer that it passed, and when. A recipe that
fails isn't a reader on this computer: say so and use another. Ubuntu may block
`bwrap` until `/etc/apparmor.d/bwrap` allows it, which is the human's to add.
Delete what the probe made.
