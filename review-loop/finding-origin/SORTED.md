# What the peers found, and what was done

Critic: Codex gpt-6-luna (plan in hand). Blind solver: Grok grok-4.7 (problem
only). Use test: mine, on the six-round ledger (USE-TEST.md).

The plan grew in coverage, not in design: no new reader, no new mechanism; the
same label, carried into the places it touches. So it stays a light review
(issue #4's distinction).

## Taken

| # | Finding | Who | Change to the plan |
|---|---|---|---|
| 1 | Whole-thing mode is in the decisions but not in the edits | Codex HIGH; Grok wrote it out | Both modes written explicitly in step 4 |
| 2 | The *blocks* check has no auditor at the moment it is needed (a block can come before any diff, and in a light review before any fix auditor) | Codex HIGH | One rule for both modes: before stopping, a fresh agent is told to kill the *blocks* reason (as tier 2). Dies: file and carry on. Survives: stop, both go to the human |
| 3 | "Fix every verified HIGH and MEDIUM" and the stop rules still say to fix and count old ones | Codex HIGH; Grok the same | The exception goes into the fix rule, the tier table, step 0, step 5's opening, the stop rules and the code profile's stop rule |
| 4 | The disposition auditor is asked to check the labels without the evidence | Codex MED; Grok the same | It gets the version before the change and each round's fix commits, and checks every label, not only *old* |
| 5 | `git blame` dates the line, not the fault; a change can make an old line fail | Codex MED; Grok the same, as "new lines wrong because old code is wrong" | The test is the failure scenario on the earlier version, not the line. Blame is a lead |
| 6 | A round frozen as a hash cannot be compared later | Use test; Grok the same, unprompted | Step 3: freeze as a commit or a patch kept in the ledger folder; each round's fixes committed on their own |
| 7 | A fault the change (or a fix) was meant to remove and left in place | Grok | Counts as *new* (or *from a fix*), not *old* |
| 8 | *Untraced* as a finished answer in a whole-thing review | Grok | Taken |
| 9 | One old bug filed once, not re-filed or re-counted each round | Grok | Taken |
| 10 | No repository: nowhere to file | Grok | Ask the human |
| 11 | An old HIGH should not turn a light review into the full loop | Grok | "finds a HIGH that is not old" |
| 12 | Human page: old ones out of the trend; a block leads the decisions box | Grok | Taken, in two short lines |
| 13 | The fix auditor can say whether a problem was made by the fix or was there before | Grok | One line in its brief |
| 14 | evidence.md addition could be smaller; the 60/40 is already there | Codex | A short paragraph inside *Fixes chasing their own edges*, not a new section |

## Declined

| Finding | Who | Why |
|---|---|---|
| File old bugs as office issues when the office is the repository under review | Grok | AGENTS.md: office issues are for the office getting in an agent's way, "not a bug in this repository". A bug in agent-office's code goes where any repository's bugs go |
| Name the fallback file `open-bugs.md` | Grok | Frank and I agreed `BUGS.md` |
| Rewrite of the fix auditor's row in the cast table, human page item 7, and a ledger "Old bugs live in" line plus a separate notes block | Grok | Covered by smaller edits elsewhere; the skill only gets longer otherwise (the ratchet) |
| The "Reviewing:" / "Previous version:" header lines as three separate lines | Grok | Kept as one line |

The declines go to the fix auditor with the diff (light review, step 5).

## Fix audit (Codex, fresh run, on commit 3eab0f3)

All 14 taken items landed. All four declines: AGREE.

One MEDIUM, made by this change, taken: the ledger template's "old bugs filed
in", the disposition auditor's "version before the change" and the human page's
three labels assumed a change review. Fixed: the ledger line puts "old bugs
filed in" inside the change branch; the auditor gets the history behind each
named commit for a whole-thing review; the human page says only *from a fix*
applies to a whole thing. Nothing of the auditor's was declined, so there was
nothing to send back.

## Outcome

Built and merged to main. Tests: 175 pass; `office skills` reports no problems.
Cost: two Codex gpt-6-luna runs (critic, fix auditor) and one Grok grok-4.7 run (solver).
