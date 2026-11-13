# Starting a reader

Use these recipes as written. Only a model name may change, if the computer doesn't offer it. They were tested on 30 Oct 2026 on Linux, and the ones that run code were tested with this repository's own test suite. `bwrap` runs only on Linux, so another operating system has no recipe. Don't improvise one. A fake `office` on `PATH` stops nothing, and some flags take a brief placed after them as their own value. A CLI not listed here, such as OpenCode, is not a reader until it has a recipe that passes the probe below. The office's tools list says which CLIs this computer has.

Use absolute paths throughout. `<copy>` is the reader's copy, `<brief>` is a file outside it, and `<round>` is the round's scratch folder, which holds the copies.

## The copy

```bash
rsync -a --exclude=AGENTS.md --exclude=CLAUDE.md --exclude=GEMINI.md --exclude=.claude \
  --exclude=.agents --exclude=.grok --exclude=.gemini --exclude=.codex --exclude=/review-loop \
  --exclude=node_modules --exclude=.venv <repo>/ <copy>/
ln -s <repo>/node_modules <copy>/node_modules   # if it exists and the reader runs code; .venv the same, unless editable (below)
```

Then copy the reader's materials in. If a file the excludes drop is part of the work, keep it. If `<repo>/.git` is a file, which means the repository is a linked worktree, exclude it too, because it points back into the live repository. Readers then have no history, so give them the diff. Put the copies and `<round>` under `~/.cache`, because the fence replaces `/tmp` and folders like it. Never use a git worktree of the live repository, because the office counts it as the same project. Paths with spaces break the commands below.

**A blind solver's copy comes from the version before the change**, so it holds no plan and no built work. Make it with `git -C <repo> archive <version before> | tar -x -C <tmp>`, then run the rsync above from `<tmp>/`, and copy the problem in.

## The fence

Every reader runs inside this fence, so that when it finishes the machine is as it was. The repository is unchanged, nothing is installed, nothing is left running, and no temporary files remain. `/tmp` and folders like it vanish with the fence, as does anything the reader left running, and the reader can't write to the live repository. Hiding the office's data and the CLIs' session logs also keeps those from growing.

```bash
FENCE="--die-with-parent --unshare-pid --dev-bind / / --proc /proc --tmpfs /run/user/$(id -u) \
  --tmpfs /tmp --tmpfs /var/tmp --tmpfs /dev/shm --tmpfs ${OFFICE_HOME:-$HOME/.local/share/agent-office} \
  --ro-bind <repo> <repo> --tmpfs $HOME/.claude/projects --tmpfs $HOME/.codex/sessions --tmpfs $HOME/.grok/sessions \
  --tmpfs $HOME/.gemini/antigravity-cli/conversations --tmpfs $HOME/.gemini/antigravity-cli/brain"
cd <copy> && timeout -k 30s 20m bwrap $FENCE <extras> <recipe> > <round>/<reader>.log 2>&1; echo $? > <round>/<reader>.status
```

Leave out any `--tmpfs` or `--ro-bind` whose target doesn't exist on this computer, because `bwrap` would create it on the real disk. In a linked worktree, `--ro-bind` the main checkout too. Twenty minutes is a starting point. A 124 or 137 in the status file means time ran out. The fence can't take the network away, because the CLI needs to reach its model, so the recipes below take it away for the commands a reader runs.

Only **Gemini** has `<extras>`. They are `--tmpfs $HOME/.gemini/config/rules --ro-bind <round>/empty.json $HOME/.gemini/antigravity-cli/settings.json`, after `echo '{}' > <round>/empty.json`. Its saved settings allow `python3`, `sh` and `office`, and `--settings` adds to them instead of replacing them. A saved rule also tells it to run a script on its first turn, which loses the whole answer.

## Reading, or running code

| Reader | Reading only |
|---|---|
| Codex | `codex exec -m gpt-6-luna -s read-only --skip-git-repo-check -C <copy> -o <round>/<reader>.report - < <brief>` |
| Grok | `grok -m grok-4.7 --sandbox strict --always-approve --no-subagents --disable-web-search --output-format streaming-json -p "$(cat <brief>)" < /dev/null` |
| Claude | `claude -p --restricted --strict-mcp-config --tools Read Grep Glob --permission-prompts none --model claude-opus-5-5 --no-session-persistence --output-format stream-json --verbose < <brief>` |
| Gemini | `agy --model gemini-4-argon-high --settings '{"permissions":{"allow":["command(ls)","command(cat)","command(grep)","command(head)","command(tail)","command(wc)"],"deny":["command(find)","command(office)","command(curl)","command(sudo)"]}}' --output-format stream-json --print="$(cat <brief>)" < /dev/null` |

| Reader | Running code |
|---|---|
| Codex | as above, with `-s workspace-write` |
| Grok | as above, with `--sandbox review-loop-reader`, after writing the profile below to `<copy>/.grok/sandbox.toml`, with `<home>` spelled out |
| Claude | as above, with `--tools Read Grep Glob Bash --allowedTools "Bash(<round>/run bun test:*)"`, after writing the script below |
| Gemini | none, because it only reads |

```toml
[profiles.review-loop-reader]
extends = "strict"
read_only = ["<home>"]
```

```bash
cat > <round>/run <<EOF
#!/bin/sh
export XDG_CACHE_HOME=/tmp/cache
exec bwrap --die-with-parent --unshare-net --unshare-pid --ro-bind / / --dev /dev --proc /proc --tmpfs /run --tmpfs /tmp --tmpfs /var/tmp --bind <copy> <copy> -- "\$@"
EOF
chmod +x <round>/run
```

**Gemini's brief must say** *"You may use only ls, cat, grep, head, tail and wc, one at a time, with no pipes."* Any other command, even `echo`, loses the whole answer, and the output is `no output produced`. Never widen that list, because `find` can write.

**Claude** runs code only through `<round>/run`. There it has no network except its own `localhost`, nothing on the computer to write to except the copy and its own `/tmp`, and no Docker. So Claude is the only reader that can start a local server. Its bare shell can still read, and all five kinds of write tried on it failed. Name each command with `run` in front, for example `"Bash(<round>/run bun test:*)"` and `"Bash(<round>/run bun run typecheck)"`. Never allow `Bash` wholesale. Its file tools reach only the working directory, so its materials must be in the copy.

**Codex and Grok** run under the operating system's sandbox. They can write to the copy and the fence's `/tmp`, and they have no network, not even `localhost`. So **no local server starts in them**, and tests that start one fail. Grok's `strict` sandbox can't read a brief kept outside the copy, so its brief goes on the command line, as Gemini's does. A brief over about 128 KB fails there, so keep the materials in the copy.

Run the suite yourself first, in a copy, and put the result in the brief along with those quirks, so that a reader does not report a sandbox failure as a finding. The home folder is read-only, so point any tool that caches there at `/tmp`. For Codex and Grok, say `XDG_CACHE_HOME=/tmp/cache` in the brief. `run` already sets it. A linked `.venv` with an editable install imports the live repository, not the copy, so make one in the copy yourself before the reader starts. Whatever a reader can't run, reproduce yourself.

**What is left.** Readers can read the home folder, which Frank accepted on 30 Oct 2026, and what they read goes to their model's company. Each CLI still updates its own logs and settings in its own folder.

## Every brief also says

*"Print your report as your reply; write no report file. Keep any command under
two minutes. Say each finding as soon as you have it, not only at the end. If
something fails or time runs short, report what you have and what you could not
check."*

## If the reader may write

Before the run, record the state of the copy and the repository, and check both after it. A changed or missing file in the copy means you look at what changed before believing the report, because a reader may have edited what it was judging. New files in the copy are fine. Check the repository after every reader has finished and before you save anything there. A change you can't account for means the fence failed. Stop and tell the human.

```bash
cd <copy> && find . -path ./.git -prune -o -type f -print0 | xargs -0 sha256sum > <round>/<reader>.sha
(git -C <repo> rev-parse HEAD; git -C <repo> status --short; git -C <repo> diff HEAD | sha256sum) > <round>/repo.before
cd <copy> && sha256sum -c --quiet <round>/<reader>.sha
(git -C <repo> rev-parse HEAD; git -C <repo> status --short; git -C <repo> diff HEAD | sha256sum) | diff <round>/repo.before -
```

## Getting the report

- **Codex**: `<round>/<reader>.report`. If it was killed, the log holds its messages and commands so far.
- **Grok**: `jq -Rrj 'fromjson? | select(.type=="text").data' <round>/<reader>.log`
- **Claude**: `jq -Rr 'fromjson? | select(.type=="result").result' <round>/<reader>.log`.
  If it was killed, use `jq -Rrj 'fromjson? | select(.type=="assistant").message.content[]? | select(.type=="text").text' <round>/<reader>.log`
- **Gemini**: `jq -Rr 'fromjson? | select(.event=="result").result.response' <round>/<reader>.log`.
  If it was killed, use `jq -Rrj 'fromjson? | .step_update.text_delta? // empty' <round>/<reader>.log`

Save the report in the ledger folder, with the status if time ran out. A killed run's partial report counts for what it is, so say what it didn't reach.

## On a computer for the first time

The sandboxes depend on the computer. Before a recipe's first real use, check on the computer itself that `office status` says `ok`. Then copy [`probe.sh`](probe.sh) into a throwaway copy, have the reader run it inside the fence, and check the disk yourself. Tell the reader that this is the owner's check, or it may refuse the whole thing:

*"The owner is checking that this sandbox contains a reader, so most lines are
expected to show a failure. Run exactly `sh <copy>/probe.sh <repo>` and paste its raw
output."*

**Claude**'s command has `<round>/run` in front, allowed as `"Bash(<round>/run sh <copy>/probe.sh:*)"`. **Gemini** can't run the probe, so give it one command per run instead. `python3 -c "print(1)"` and `touch ~/PROBE` must each give `no output produced`.

Afterwards, check on the computer itself. A pass means three things. No `PROBE` file is left outside the copy, in the repository, home, `~/.local`, `/usr/local/bin`, `/opt`, `/var/crash`, `/mnt/*`, `/tmp` or `/var/tmp`. No `sleep 3001` or `sleep 3002` is running. And nothing new shows in `npm ls -g` or `pip list --user`. In the probe's output, every line except `tmp`, `var-tmp` and `copy` is non-zero, and under a running-code recipe `copy` is zero. A line the probe didn't reach counts as a failure unless the disk shows the same result.

Record in that CLI's tool note on this computer that it passed, and when. A recipe that fails does not make a reader on this computer. Say so and use another. Ubuntu may block `bwrap` until `/etc/apparmor.d/bwrap` allows it, and adding that is the human's job. Delete what the probe made.
