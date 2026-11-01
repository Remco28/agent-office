# Review-loop ledger: reader recipes
*Kept by the review-loop skill. Safe to delete this folder once the work is done.*

Success question (rewritten at round 3's check-in; the earlier wording was the author's): when a reader finishes, is the machine as it was: repository unchanged, nothing else changed, nothing installed or left running, no temporary files? And can it run code and leave a usable report?
Rules confirmed with: Frank, 2026-10-30 (PROBLEM.md).
Reviewing: a change, from d86cd1e; old bugs filed in: BUGS.md if any (none so far: the change's goal is that the recipes hold, so a fault they leave in place is new, step 4)

Started as a light review. Round 1's auditors found HIGHs that are not old, so per the skill it became the loop.

## Round 1, 2026-10-30, 16210b3
Predictions: not written; this began as a light review.
Cast: critic Codex and blind solver Grok (read-only, on the plan); fix auditor Grok (running-code recipe, copy written with the first readers.md); reader Gemini (reading recipe).

| Finding | Reader (their rating) | Ours | From | How checked | Done |
|---|---|---|---|---|---|
| Gemini ran python3: session settings add to saved ones; tool note and author's claim false | author, following Gemini's lead | HIGH | new (meant to be removed; there since the 29 Oct note) | reproduced: printed 42 | fixed: saved settings hidden; refused after |
| Saved Gemini rule makes it run a script, loses the whole answer | Gemini (MEDIUM) | MEDIUM | new (meant to be removed) | reproduced before and after hiding | fixed |
| Every recipe could read the office's data | Grok (HIGH), Gemini (LOW) | HIGH | new (meant to be removed) | reproduced | fixed: fence hides the folder. Author had declined this; both auditors rejected the reason |
| Grok could write its skills and memory folders | Grok (HIGH) | MEDIUM: needs a reader that chooses to, and affects later Grok sessions | new (meant to be removed) | reproduced by auditor | fixed; other ~/.grok writes stated as a limit |
| Claude read user settings, not fenced to named commands | Grok (HIGH), Gemini (MEDIUM) | HIGH | new (meant to be removed) | tested --restricted: office, full path, curl, python3, bun -e, touch refused | fixed |
| Claude given the user's mail and drive connectors | author, from a reader's report | HIGH | new (meant to be removed) | tools list before and after --strict-mcp-config | fixed |
| Blind solver on built work gets the built code; ledger copied to readers | Gemini (HIGH) | HIGH | new | read; archive tested | fixed: copy from version before; /review-loop excluded |
| Claude could write through the dependency link | Grok (MEDIUM) | MEDIUM | new | reproduced for sandboxes; fence read-only on repo | fixed |
| Probe false-passes with office stopped; contradicts reading recipes; never tests Gemini's allow list | Gemini (MEDIUM) | MEDIUM | new | read | fixed: per-recipe passes, host check first |
| Linked worktree: rsync copies a .git pointer into the live repo | Gemini (MEDIUM) | MEDIUM | new | read | fixed: exclude when it is a file |
| Project .grok and like copied | Grok (MEDIUM) | MEDIUM | new | read | fixed |
| Killed Gemini left nothing | Grok (MEDIUM) | MEDIUM | new | stream-json finished run read; kill showed no text at 40s | partly: stream-json, extractor; untested with text before kill |
| Claude --model left blank; bun run ban ambiguous; pipes for Gemini | Gemini (guesses) | LOW | new | read | fixed |

Declines: critic's and solver's, in declines (see below). Stand after round 1: stream into ledger; built work with no plan (Frank chose a plan); project git status check (now covered by the fence).
What happened against the predictions: none written.
Believed, and wrong: "Session settings replace the saved allow list" (the agy tool note, stated as verified). "What keeps it from looking is that nothing it is given points there." "--disallowedTools plus allowedTools fences Claude."

## Round 2, 2026-10-30, df873bf
Predictions (written before the round): fix auditor: no HIGH, one to three MEDIUM, in the probe's wording or the fence's paths on another computer; all of round 1's fixes land. Disposition auditor: raises at least one rating, most likely Grok's ~/.grok writes (we lowered it to MEDIUM), and questions the skipped page.
Cast: fix auditor Codex (running-code recipe, fenced), disposition auditor Claude (reading recipe, fenced).

| Finding | Reader (their rating) | Ours | From | How checked | Done |
|---|---|---|---|---|---|
| Code Claude runs reaches the office and writes home; author called it a limit | Codex (HIGH), Claude (HIGH) | HIGH, how it is used now | from a fix (1): fence claimed; underlying new | reproduced: REACHED 200, WROTE | fixed: `<round>/run`; refused, server still starts |
| Grok writes in ~/.grok; lowered to MEDIUM by "needs a reader that chooses to" | Claude (raise to HIGH) | HIGH, same mechanism and reason as office-data row; author's rating was soft | new (this change's profile) | reproduced | fixed: strict + read-only home; all ~/.grok touches denied |
| Agents' transcripts quote the office, and were readable | Claude (open) | HIGH, how it is used now | new (meant to be removed) | grep: 228 Claude, 158 Codex, 118 Gemini files | fixed: hidden by the fence |
| OFFICE_HOME not honoured by the fence | Codex (HIGH) | LOW, not set anywhere here; setup not in use, and not yet agreed at a check-in so rated in full: MEDIUM | from a fix (1) | read src/paths.ts | fixed: one token |
| No check of the live repo after a run; decline's reason changed | Claude (F3) | LOW | new | read | fixed: taken |
| Dependency-link decline overturned without recording; "no write tool" believed | Claude (F4: HIGH) | HIGH for round 1's count, fixed | new | reproduced with the probe test | fixed; recorded here and below |
| Killed Gemini "partly" | Claude (open) | MEDIUM | new | kill test kept FINDING-ONE | fixed, tested |
| Suite claim stale; reading recipes can't be suite-tested | Claude (F12) | MEDIUM | from a fix (1) | Codex 165/10 and Grok 164/12 and Claude 175/1 in final form, with one added probe test | fixed: sentence narrowed |
| Linux-only not stated; second computer's OS unrecorded | Claude (F11) | MEDIUM | from a fix (1) | hostname on record is a ThinkPad; not confirmed Linux | stated; for Frank |
| Custom port in probe; where a pass is recorded; Gemini deny removed silently; solver's sandbox.toml warning | Claude (F13, F14) | LOW | mixed | read; sandbox.toml touch denied | fixed |
| Bwrap added with no peer step | Claude (F18) | process | from a fix (1) | true | fresh critic on the fence in round 3 |
| Page skipped, a never-skip | Claude | process | author | true | page built with round 3 |

Corrected in the record: "Frank chose a plan" is his "we'll go with your fixes", which included "the plan says so". The connector row's source is the author's own Claude test report, not a saved reader's. The office-data decline's "nothing pointing there" was false when written; readers.md named the path. "Both auditors rejected the reason" was Grok only.
Whom each reaches: every row is how it is used now, on this computer, except OFFICE_HOME. The second computer has run nothing yet.
What happened against the predictions: fix auditor found 2 HIGH, not 0; "all of round 1's fixes land" was false for Gemini's kill. Disposition auditor raised the predicted rating and questioned the page, and found far more: a prediction that a rating is soft and keeping it earned nothing.
Believed, and wrong: "Code Claude runs is unfenced" as an acceptable note. "Needs a reader that chooses to" as a reason, against a goal that says whatever they decide. "One small procedure file."

## Round 3, 2026-10-30, the commit after this ledger line
Predictions (written before the round): critic: at least one MEDIUM in the run script or in hiding folders on another computer; no HIGH. Fix auditor: no HIGH, one or two MEDIUM. Disposition auditor: raises one rating or label, finds the ledger's OFFICE_HOME rating muddled.
Cast: critic Gemini (reading recipe, on the fence), fix auditor Grok (running-code recipe), disposition auditor Codex (reading recipe). Then the check-in: stop for Frank before fixing.

Critic's claims:
| Finding | Reader (their rating) | Ours | From | How checked | Done |
|---|---|---|---|---|---|
| systemd-run --user escapes fence and run script | Gemini (HIGH) | HIGH, how it is used now; needs a reader that sets out to escape | from a fix (1): the fence claims what it can't do | reproduced: exit 0 in both | open; flags tested, all four CLIs work: --unshare-pid --proc /proc --tmpfs /run/user/UID |
| /proc/pid/root reads hidden data | Gemini (HIGH) | rejected | - | reproduced: permission denied | none |
| find -exec python3 under Gemini's allow list | Gemini (HIGH) | rejected | - | reproduced: refused. -fprintf not tried | none |
| ~/.claude, ~/.codex, ~/.gemini history.jsonl readable, quote the office | Grok (MEDIUM), Gemini (HIGH) | MEDIUM | from a fix (2): fence says transcripts are hidden | ls here; Grok grepped them | open |
| "Grok under strict can read only the copy" false; memory reads back | Grok (MEDIUM) | MEDIUM | from a fix (2) | Grok reproduced; docs | open |
| Probe: ls uses wrong path with OFFICE_HOME; Grok strict's ls is denied, not empty | Grok (MEDIUM x2) | MEDIUM, one row | from a fix (2) | read | open |
| 0-byte settings.json where Gemini never ran | Gemini (HIGH) | MEDIUM, unverified; a visible failure | from a fix (1) | not reproduced | open |
| Brief over 128 KB in argv; timeout without -k; unquoted paths | Gemini (MEDIUM) | MEDIUM, unverified | from a fix (2) | kernel fact, not reproduced | open |
| Other toolchains write ~/.cache; editable venvs import the repo | Gemini (MEDIUM) | MEDIUM, unverified; none in use here checked | old in part | not reproduced | open |
| Hooks, MCP, global instructions in Codex and Gemini; live repo readable by path | Gemini (HIGH) | MEDIUM, unverified; depends on Decision 1 | new | read; no MCP or office hook here checked | open, for Frank |
| Remove Gemini; remove .git from copies; one Grok profile | Gemini (HIGH, MEDIUM, LOW) | design suggestions, not faults; .git removal likely taken | - | read | for Frank / next fixes |
| Claude note omits /var/tmp; git status has no before | Grok (LOW x2) | LOW | from a fix (2) | read | open |

Disposition (Codex): repeated round 2's points; right that origin labels are argued, not checked per row. Left as is: the earlier recipes are in tool notes, outside git, so step 4's comparison isn't available; said on the page. Right that "any computer" became "Linux only" and home reads are a behaviour assumption: both for Frank. Its "whose test run" note answered: the author's, in final form, one added probe test.
What happened against the predictions: critic claimed five HIGH; I'd predicted none and one held. Fix auditor: no HIGH as predicted, four MEDIUM against one or two. Disposition: raised no new rating, which I hadn't predicted; OFFICE_HOME went unremarked.
Believed, and wrong: that hiding four folders hid the transcripts; history.jsonl sits beside them. That the goal's "whatever they decide" was Frank's: it was the author's wording, and it steered the briefs.

## Check-in, round 3 (stop for the human, before fixes)
Counts, serious = verified HIGH not old: round 1, 7; round 2, 2; round 3, 1, from a fix. Proposed: step back on what the fence is for (the page's decision 1), since each round's serious finding has come from the last fix and each is rarer. Answer (Frank): fence against agents changing the repo, then against changes outside it, tools left installed or running, and temp files. Home reads accepted. Gemini stays. Other laptop is Linux. Goal rewritten in PROBLEM.md.

By that goal: systemd-run closed (the point is nothing left running; fence flags). History files, reads of ~/.grok memory, hooks and MCP in the CLI's parent, the live repo readable by path: closed as accepted reads, except that a parent-process hook can write. Not chased: it isn't a reader's act, and the machines have none that matter here; said on the page. Probe rewritten around the goal, which removes both probe rows. 0-byte settings file and missing folders: leave out targets that don't exist. Long briefs, -k, toolchains, editable venvs: stated or taken. Two earlier claims rejected stay rejected.

## Round 4, 2026-10-30
Measured first, by a script run by every running-code recipe, then the machine compared: repository, home and tool folder refused; npm, pip and bun installs failed; nothing left running; /tmp, /var/tmp and /dev/shm gone with the fence. Suite: Codex 165/10, Grok 163/12, Claude 174/1. Gemini's file tool refused everywhere but the fence's /tmp. Left on disk: each CLI's own logs and settings, and unrelated services.
Predictions (written before the round): fix auditor: no HIGH by the new goal; one or two MEDIUM, in wording about which flags to leave out or the probe's Claude case. Disposition auditor: one rating or label challenged, likely closing the history-file and hooks rows by decision rather than by test.
Cast: fix auditor Claude (running-code recipe, Opus), disposition auditor Grok (reading recipe).
The script is now skills/review-loop/probe.sh. The suite figures above are the author's runs, each in that recipe's final form then; systemd-run under them: "Failed to connect to bus", and no unit listed.

| Finding | Reader (their rating) | Ours | From | How checked | Done |
|---|---|---|---|---|---|
| Claude's run script could write anything else the user owns: /mnt/synology-401k-backups, /usr/local/bin/spf, /var/crash | Grok (a general claim; author found the paths) | HIGH, how it is used now | new | find across /, then writes refused after | fixed: whole system read-only in run; suite 174/1, server ok |
| Gemini's find can write (-fprintf, -delete) | Grok (open) | MEDIUM: two tries hung until the timeout and wrote nothing, so not proven; removal is cheap | new | two runs: no file, nothing deleted; both "Terminated" | fixed: find removed, denied; grep -r still reads |
| XDG_CACHE_HOME prefix refused for Claude | Claude (MEDIUM) | MEDIUM | from a fix (3) | Claude reproduced | fixed: set in run |
| "Stop" on any repo change: false alarm during parallel runs | Claude (MEDIUM) | MEDIUM | from a fix (3) | read | fixed: account for it, check after all readers, before saving |
| Repo check misses further edits to a dirty file, and commits | Claude (LOW) | LOW | new | read | fixed: HEAD, status, diff hash |
| 137 not mentioned; .venv warning in one place; Claude "no shell"; stale reason for ~/.cache | Claude (LOW x4) | LOW | from a fix (3) | read; bare writes refused, five forms tested | fixed |
| Hooks and plug-ins, closed without looking | Grok | not a fault here; the author's close was unjustified when written | - | looked: Gemini's hook off, its plug-in list empty, Codex's only in one project. Grok's global Callum hook: nothing in that folder changed with it visible, control quiet | none |
| Live repo by worktree path | Grok | LOW | new | inner sandboxes hold home; Gemini doesn't write | stated: ro-bind main checkout |
| 0-byte file on a missing bind | Gemini earlier | MEDIUM | from a fix (1) | reproduced: 0 bytes | "leave out" stands |
| Session history growth claim | Grok | none | - | history.jsonl for all three unchanged since 22 to 27 Oct | none |
| Unquoted paths | Grok | LOW | new | read | stated |
| "Accepted (Frank)" covered CLI logs, which he did not say | Grok | correct: the author overreached | from a fix (3) | read his words | reworded; told to Frank |
| Office data not named in the probe | Grok | LOW: the probe tests what Frank fears; other routes tested once on this computer | from a fix (3) | read | none |
| 128 KB brief; -k with a child ignoring TERM | Grok | LOW, kernel fact and a flag; not reproduced | new | - | stated, flag kept |

What happened against the predictions: fix auditor: right on no HIGH and on one or two MEDIUM; both elsewhere than predicted. Disposition auditor: challenged closes by decision, as predicted, and pointed at the one real hole: writes outside home.
Believed, and wrong: "Nothing but the copy to write to" for Claude's script (it had every path the user owns). "The machines have none that matter" about hooks, written without looking.

## Round 5, 2026-10-30
Predictions (written before the round): fix auditor: no HIGH, no MEDIUM; LOWs in wording. Disposition auditor: no new HIGH, disputes at least one LOW, says Round 3's unverified MEDIUMs are thinly closed. If no HIGH or MEDIUM: stop.
Cast: fix auditor Codex (running-code recipe), disposition auditor Claude (reading recipe).

| Finding | Reader (their rating) | Ours | From | How checked | Done |
|---|---|---|---|---|---|
| Claude's run reaches Docker: a test could start a container and leave it running | Claude (unverified; asked for the test) | HIGH, how it is used now: Frank is in the docker group | from a fix (2) | reproduced: docker=0; docker=1 after | fixed: --tmpfs /run inside run |
| The check that travels is weaker than the one measured | Claude (MEDIUM) | MEDIUM | from a fix (3) | counted | fixed: probe.sh in the skill, run under all recipes |
| Writes outside home untested for Codex and Grok | Claude (HIGH if it fails) | none: refused | - | probe.sh, disk checked | none |
| Gemini redirect | Claude | none: nothing written; run hung until the timeout | - | one run | none |
| Fix auditor: outer fence writable, permitted shell write persists | Codex (MEDIUM) | none as stated: its example needs a shell the recipes don't give; tested under each | - | probe.sh under each; bare Claude refused | none; put back to its reader in round 6 |
| Status 124/137 can be the reader's own; ignored or untracked files in the repo check; Gemini probe wording | Codex and Claude (LOW) | LOW | from a fix (4) | read; Codex ran the first two | declined: backstops, ro-bind is the guard. Probe section rewritten |
| Claude's bare shell rated LOW | Claude (MEDIUM) | MEDIUM, same mechanism as find; fixed: named five forms in ledger: find -delete, find -fprintf, redirect, git init, sed -i | from a fix (3) | reproduced | wording narrowed |
| Editable .venv rated LOW; was MEDIUM | Claude | MEDIUM, restored; a review-quality fault. SKILL and profile link in general; readers.md carries the exception | new | read, not run | stated |
| Worktree main checkout | Claude | LOW holds: main checkout in home is refused by the inner layers, tested as repo and home | new | probe | stated |
| Hooks on the other laptop | Claude | unverified; probe.sh would not show them. Accepted: not a reader's act | - | - | told to Frank |
| CLI logs and settings | Claude | not rated; for Frank | - | listed: each CLI's own folder, ~/.claude.json and backups | Frank |
| Peer step and whole-code reader absent | Claude | true; departure, put to Frank | - | - | Frank |
| Label on run script should be from a fix (2) | Claude | taken, here | - | - | - |

What happened against the predictions: fix auditor: one MEDIUM against none, not held up. Disposition auditor: no new verified HIGH, as predicted, but it asked for the test that found one.
Believed, and wrong: "nothing on the computer but the copy" (Docker's socket isn't a file write). That Docker was out of scope because no one had named it.

## Round 6, 2026-10-30
Predictions (written before the round): fix auditor: no HIGH or MEDIUM; LOW on probe.sh wording. Disposition auditor: no HIGH, says this could stop if Frank answers on CLI logs. Then the check-in: stop for Frank.
Cast: fix auditor Grok (running-code recipe), disposition auditor Codex (reading recipe).

| Finding | Reader (their rating) | Ours | From | How checked | Done |
|---|---|---|---|---|---|
| Backup mount still writable through run | Grok (HIGH) | rejected: it read an evidence sentence about the earlier script, and bwrap's man page on --remount-ro | - | live CIFS mount; inside run it is ro and touch gives EROFS | none |
| First-time pass rule doesn't require `copy` to succeed under a running-code recipe | Grok (MEDIUM) | MEDIUM | from a fix (5) | read | open: wording |
| Brief's command isn't Claude's allowed prefix, so the check can't be run as written | Grok (MEDIUM) | MEDIUM; fails closed | from a fix (5) | read | open: wording |
| probe.sh's relative path doesn't exist in another project's copy | Grok (LOW) | MEDIUM: other projects leave skills out, so the check can't start | from a fix (5) | read | open: copy it in |
| Outer fence writes "not validated" | Codex (MEDIUM) | rejected: that is the fix auditor's own run; the author's runs under each recipe and the disk are in round 5 | - | ledger; re-read | none |
| Hooks on the other laptop | Codex (unverified) | LOW; probe.sh would not show one; Frank's | - | - | Frank |
| Gemini redirect | Codex (unverified) | unverified: a third run was blocked by Gemini's own filter; nothing written in any | - | three runs | stated |
| CLI logs and settings; peer step and whole-code reader absent | Codex, Claude | for Frank | - | - | Frank |

The declined "permitted shell write" was put back to Grok: it holds for that finding (Grok reproduced denial for home, the mount, /var/crash, /opt, /usr/local/bin/spf).
What happened against the predictions: fix auditor found one claimed HIGH, rejected, and three MEDIUM against none; all in one section. Disposition auditor: no verified HIGH as predicted; it did not say this could stop.
Believed, and wrong: none this round; the author's measured claim held against the auditor's reading.

## Check-in, round 6 (stop for the human, before fixes)
Serious, verified, not old, per round: 7, 2, 1, 1, 1, 0. What is left is the wording of one section. Proposed: offer stopping: fix that wording, run the check once as written on this computer, merge, push. Departures to accept: no peer step for fixes, no whole-code reader, stop rule not literally met (the wording fixes are MEDIUM). Answer, Frank, 1 Nov 2026: stop here; accept the CLIs' own logs and settings; accept the two skipped steps.

## Closing, 2026-11-01
Round 6's three wording faults fixed (f10cc81). No further audit, by Frank's answer. Instead the first-time check was run once as the section now reads, on this computer, under seven recipes side by side: Codex reading and running, Grok reading and running, Claude running, and Gemini's two commands.

- Output: every line but `tmp`, `var-tmp` and `copy` non-zero under all five. `copy` zero under all three running-code recipes (and Grok strict; refused under Codex read-only). Grok's sandbox hides `/mnt`, so it printed no line for the backup mount; the disk shows nothing there.
- Gemini: both commands gave `no output produced`, with the command in `denied_actions`.
- Disk, checked outside the fence: no PROBE outside the copies; no `sleep 3001` or `3002`; `npm ls -g` and `pip list --user` unchanged; repository unchanged.
- Not tested: the other laptop. Its first review runs this check first.

## Mistakes the next author will make
Testing a fence only with the command it names. Saying *verified* about a thing tried once, with the variable you meant to test held fixed.
