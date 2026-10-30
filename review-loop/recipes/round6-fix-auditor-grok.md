I'll audit the last-round fix against the written procedure and the materials in `m/`, starting with the diff and the problem statement.The last commit is the fix under review. I’ll read that diff against the prior procedure and the round that produced it.The backup-mount write is still open. Docker is closed by the new flag, which I could not re-run. The new first-time check can certify a sandbox that cannot write its copy, and Claude cannot run that check as written.

## Each change

**Evidence paragraph.** The new sentence matches the measurement it describes. It does not close either hole it names: "It found Claude's script could still write to a backup mount and start Docker."

**`--tmpfs /run` on Claude's `run`.** Docker is gone, by the flag, not by a fresh run. `/var/run` is a symlink to `/run`, and the socket is `/run/docker.sock`. A tmpfs on `/run` hides it. Bubblewrap will not nest in this session (`No permissions to create new namespace`), so I did not execute the new `run` or re-run the suite under it.

The backup write is still there. The same evidence sentence says the script wrote to that mount after the system was made read-only. This diff does not remount it. `man bwrap` says `--remount-ro` "works only on the specified mount point, without changing any other mount point under the specified path." Inside this fence, `/mnt/synology-401k-backups` is a separate read-write CIFS mount owned by `frank`. `--tmpfs /run` does not cover it. The procedure still says Claude has "nothing on the computer but the copy and its own `/tmp` to write to."

**`probe.sh` in the skill.** The old gap, a short inline check that could not see this hole, is gone. The script is what a first-time run now executes. Two new problems are below.

**"All five kinds of write tried on it were refused."** The old "refuses every write" overclaim is gone. The sentence is now limited to what was tried.

**"What is left."** The false attribution is gone. Frank is cited only for readers seeing the home folder: "Readers can read the home folder (Frank accepted that, 30 Oct 2026), and what they read goes to their model's company."

**First-time section.** The six-command check is gone, replaced by `probe.sh`. The pass rule and the Claude command are new problems.

## Ordinary use

The running-code recipes are otherwise in one place. `--tmpfs /run` was added only on Claude's `run`, which is the recipe that could reach Docker. Under this Grok sandbox, `docker ps` is already denied.

I could not re-check the suite with the new `run`. `/etc/resolv.conf` points at `/run/systemd/resolve/stub-resolv.conf`. Claude's `run` already has no network except its own localhost, so I do not expect the local-server runs to change. That is unread.

## Literal problems

**HIGH. Still there. There before this fix (round 4 called it fixed; the evidence in this diff says the write still worked).**

Claude's `run` is still:

```bash
exec bwrap --die-with-parent --unshare-net --unshare-pid --ro-bind / / --dev /dev --proc /proc --tmpfs /run --tmpfs /tmp --tmpfs /var/tmp --bind <copy> <copy> -- "$@"
```

Scenario: a reader, or the probe itself, runs `touch /mnt/synology-401k-backups/PROBE` through `<round>/run`. The directory is owned by `frank` and is a separate mount, so the touch creates a file on the backup share. The repo and the home directory are a different case: round 4 measured those writes refused after `--ro-bind / /`. This computer has already used Claude. The new check is only "Before a recipe's first real use," so nothing in the procedure makes this machine run the new probe before the next review.

**MEDIUM. Made by this fix.**

The pass rule no longer requires a successful write to the copy. It says: "every line but `tmp`, `var-tmp` and, under a running-code recipe, `copy` is non-zero." The previous rule said that under a running-code recipe `./PROBE_COPY` exists too.

Scenario: Codex is started with `-s read-only`, or workspace-write does not actually grant writes. `copy` is non-zero, every other required line is non-zero, and no `PROBE` file is left outside the copy. The recipe is recorded as passed. The suite then fails for lack of a writable directory, which is the original gap.

**MEDIUM. Made by this fix.**

The brief says: "Run exactly `sh skills/review-loop/probe.sh <repo>`." Claude is allowed only `"Bash(<round>/run sh skills/review-loop/probe.sh:*)"`. The earlier rule still says to name each command with `run` in front.

Scenario: the reader runs the exact command. It is not the allowed prefix, so Claude denies it and pastes no probe output. "A line it didn't reach is a failure," so a good `run` cannot be certified by following the text. The check fails closed.

**LOW. Made by this fix.**

The command is a relative path, `skills/review-loop/probe.sh`. The old check was the commands themselves.

Scenario: the first copy is some other repository, which does not contain that file. The script never starts, no line is produced, and the recipe cannot be passed. On a copy of this repository the path exists. I ran `sh -n` on it here.

## The declined finding

The reason holds for the finding that was declined.

That finding was a home write through a permitted shell. This session is the outer fence plus Grok's `review-loop-reader` profile. `/home/frank` is mounted read-write, and `touch` of a file there returns "Permission denied." The same denial hit `/mnt/synology-401k-backups`, `/var/crash`, `/opt`, and `/usr/local/bin/spf` (that file is owned by `frank` and mode-writable). Writes that succeeded were the copy and the fence tmpfs on `/tmp` and `/var/tmp`. `docker ps`, `systemd-run --user`, `sudo -n true`, and `curl` to the office port all failed.

I did not re-test Codex, Claude's bare shell, or Gemini. The reason does not cover Claude's `<round>/run`. That is a permitted shell, and it is the backup-mount hole above, not the home-write example that was declined.

## Not checked

Bubblewrap will not nest here, so the new `run` was not executed and the suite was not re-run under it. Codex, Claude, and Gemini were not started.