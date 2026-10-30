# Disposition audit, round 4

**This may not stop now.** One MEDIUM is open and verified, and it needs a fix. Three more containment claims have no test behind them, and if any of them fails it is HIGH by the ledger's own precedent. None of this makes the fence look fundamentally broken: most of the failures are holes the tests never looked at. Several of round 4's ratings and reasons also don't hold.

I could only read files. I ran nothing, and `/etc/group`, `/run` and `~/.grok` were refused, so anything about the machine is untested.

## 1. Ratings and reasons that don't hold

| Row | Their rating | Mine | Why |
|---|---|---|---|
| Claude's bare shell, in the LOW x4 bundle (`m/LEDGER.md:100`) | LOW | **MEDIUM** | This is the same mechanism as Gemini's `find`, rated MEDIUM at `:96`: a read command approved under an outer fence that leaves home writable. The rating rule requires the same rating. Five untested-by-name forms don't support "refuses every write". |
| Editable `.venv`, same bundle | LOW | **MEDIUM** | Round 3 rated it MEDIUM (`:73`), and round 4 lowered it with no new reason. The scenario is a silent review of the wrong code, and "not in use" was never agreed at a check-in. The fix is also partial: `SKILL.md:147-148` and `code-review.md:68` still say to link. This is a review-quality fault, not a containment one. |
| Live repo by worktree path (`:102`) | LOW | **MEDIUM until tested** | This touches Frank's main fear. "Inner sandboxes hold home" doesn't cover a main checkout outside home or a write by the CLI's parent process. Grok asked for a `touch` on the main checkout, and none is recorded. |
| Hooks and plug-ins (`:101`) | not a fault | **MEDIUM on the other laptop, unverified** | The look was real, but it covers this computer only. A global Grok hook runs in the parent process and only "that folder" was compared, once. `readers.md` never mentions hooks, so the limit doesn't travel with the skill. |
| "Accepted" covering CLI logs (`:106`) | no severity | **unrated, needs Frank** | The attribution was corrected, but the writes themselves were never rated or listed. "Told to Frank" records no answer. The success question at `:4` says "nothing else changed", and `:88` says things were left on disk. |
| Session history growth (`:104`) | none | **no evidence either way** | `history.jsonl` isn't the session logs the sentence is about. It also sat unchanged through 30 Oct's runs, which suggests headless runs never touch it (my inference), so the check can't show the fence did anything. |
| Claude's run script (`:95`) | HIGH, *new* | HIGH holds; **from a fix (2)** | Round 2's fix created `run` (`:40`) and claimed containment for it. The label matters because the next check-in proposes "the fixes are the problem" first when the serious findings came from fixes. |
| Repo check (`:99`) | LOW, "fixed" | LOW; **partly fixed** | `git diff HEAD` leaves out untracked files, so a further edit to an untracked file is still invisible. Ignored files are missed too. |

**Reasons that are convenient, though the rating may survive:**
- **Office not in the probe (`:107`):** "The probe tests what Frank fears" skips the standing rule at `PROBLEM.md:28`, which Frank's answer didn't revoke. "Tested once on this computer" is the ledger's own closing mistake (`:118`). `OFFICE_DB` (`README.md:162`), which Grok raised, got no row. LOW probably stands, because a stray write is held by the other layers.
- **`find` (`:96`):** "Removal is cheap" describes the cost of the fix, not the severity. `readers.md:96` then says flatly "`find` can write", while the ledger says not proven under `agy`.
- **128 KB and `-k` (`:108`), unquoted paths (`:105`):** These were MEDIUM in round 3 (`:72`). "Not reproduced" is no new reason for lowering them. LOW is defensible as edge-case input, but nobody argued that.
- **"Frank accepted" (`readers.md:121`):** It says he accepted that what readers see goes to their model's company. His recorded words only accept readers seeing the home folder. This is the overreach `:106` corrected, one clause smaller.

**An overclaim in the permanent record:** `:88` says "run by every recipe" and `evidence.md` says "under every reader". The probe's own header says running-code recipes only (`m/containment-probe.sh:1`), and Gemini can't run a script at all. The reading recipes aren't recorded as having run it either.

## 2. HIGH or MEDIUM still open, by Frank's goal

**One is verified: MEDIUM, the first-run check that travels is weaker than the one that was measured.**
- **Gap:** `readers.md:167-170` has six commands, while `containment-probe.sh` has thirteen. The travelling version has no `systemd-run`, no installs, no `/var/tmp` or `/dev/shm`, and no write outside home.
- **Consequence:** it wouldn't catch round 3's HIGH or round 4's HIGH. The fuller script lives in a ledger folder marked safe to delete.
- **Scenario:** the other laptop has run nothing yet (`:54`). Its sandbox differs, the short check passes, "passed" goes in the tool note, and a reader leaves a tool or service behind unnoticed.
- **Rating:** it needs a machine that behaves differently, so it is rare, which is MEDIUM. A false-passing probe was also rated MEDIUM in round 1 (`:24`).

**Three are unverified, and each is HIGH by the `:95` precedent if it fails:**
- **Writes outside home under Codex and Grok:** see the first item in section 3.
- **Shell redirection under Gemini's allow list:** see the second item in section 3.
- **Local sockets:** a read-only mount doesn't stop a daemon writing on a reader's behalf (from memory of the kernel, not run). The fence hides only `/run/user/<uid>`, so `/var/run/docker.sock` and the system bus would stay visible if present. A reader wanting a test database could plausibly run `docker run -d postgres`, leaving something running. That matches Frank's words and needs no bad intent. Whether Codex's and Grok's sandboxes block it is unknown, and I couldn't check whether Docker is installed.

No HIGH is verified open.

## 3. Containment claims in `readers.md` with no test in the ledger

- **"they can write to the copy and the fence's `/tmp`" (`:105-106`):** Yes, this is the sharpest gap. The outer fence is `--dev-bind / /`, the round 4 fix changed only Claude's `run`, and the probe never tries the outside-home paths under Codex or Grok.
- **Gemini's containment (`:94-96`):** Only `python3` and `touch` are named as refused. `cat x > ~/PROBE_HOME` isn't recorded. The allow list is the only guard on home for this reader, and `:102` uses "Gemini doesn't write" as a reason.
- **"refuses every write" (`:100`):** Five forms were tried, and they aren't listed. The fix auditor did get a bare command past `run`.
- **"nothing on the computer but the copy and its own `/tmp` to write to" (`:99`):** This was tested against three paths, not against sockets. The ledger also records no `systemd-run` result under the final `run`. The script's `systemd=$?` is `head`'s exit status, so it's always 0, and only the message text carries any information.
- **"keeps those from growing too" (`:39-40`):** No before-and-after comparison of the session folders exists. The fix auditor also couldn't confirm the `~/.grok/sessions` path.
- **"`--ro-bind` the main checkout too" (`:51`):** There's no linked-worktree run on record.

## 4. May this stop now?

**No.** The code profile's rule needs a round with no HIGH that is not old, on audited ratings, and with no HIGH or MEDIUM fixes needed. Round 4 had a HIGH and three MEDIUMs, so it can't be that round. Round 5 can only be that round if all of these are true:

1. Codex's round 5 fix audit shows no HIGH and no MEDIUM needing a fix. I haven't seen that report.
2. These tests come back refused or clean, on both computers where it applies:
   - `touch` on `/mnt/synology-401k-backups`, `/usr/local/bin` and `/var/crash` under the Codex and Grok recipes.
   - `cat <file> > ~/PROBE_HOME` under Gemini.
   - A list of the sockets and group memberships, then a `docker` attempt under each reader if it's present.
   - A `touch` on the main checkout from a linked worktree.
   - The full probe re-run under the final `run`.
3. The probe MEDIUM has a recorded decline that survives checking. I don't expect it to: my rating rests on `:24`, and the fix is a few lines.

So expect the probe fix to force a round 6. Round 6 is also the next check-in, so it stops for Frank anyway. That fits, because two things need him:
- **His answer on CLI logs and settings:** the writes need listing first.
- **The peer step:** the profile requires it for every HIGH or MEDIUM fix, and round 4's cast and round 5's list no critic or solver. The same fault was logged as a process finding at `:50`. Run it, or have him waive it on the record.

The profile's "whole-code reader, every round" is also absent from both casts.

## What I couldn't check

- **Round 5:** I didn't see the fix auditor's report.
- **The real scripts and hooks:** I couldn't read the actual `run` script or Grok's hook.
- **Round 4's page:** it isn't in the materials, so I can't say whether it was built.
- **Partly read:** I read the `SKILL.md`, `evidence.md` and profile hunks of `all.diff`, but compared `readers.md` only through `fix.diff` and its final text.
- **My independence:** the ledger's round 5 prediction was in my materials and foresaw part of this, including a disputed LOW and thin closes. Treat that overlap as weak evidence. It predicted no new HIGH, and I can't confirm that until the tests in point 2 are run.
