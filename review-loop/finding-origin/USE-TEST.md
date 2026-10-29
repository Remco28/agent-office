# Use test: labelling rounds 3 and 4 of the six-round ledger

The plan's own check: take the agent-office review (commit `da81b5a`, review of
Gemini's `office init` change, six rounds) and label each finding from rounds 3
and 4 as *new*, *old* or *from a fix*, using only the ledger.

## Round 4 (6 findings)

| Finding | Label | From what |
|---|---|---|
| J1 init through a link plants a nested repo (HIGH) | new | the ledger already says "in round-1 code" |
| J2 deinit'd main submodule copy | from a fix (round 2/3) | worktreeSubmodule, written to fix G2 |
| J3 separate-git-dir superproject's worktree submodule | from a fix (round 2/3) | same |
| J4 `.claude` swapped during init | from a fix (round 3) | the re-check written for H11 |
| J5 wording | unclear | |
| J6 link to a folder of repos | from a fix (round 2) | the nested-repos check written for G10 |

Direction test question 3 ("mostly from a fix?"): 4 of 6, one new, one unclear.
A count, where the ledger had an impression.

## Round 3 (15 findings)

H1, H2, H3, H10 trace to named fixes (G10, G2, F5, F3) from the ledger's own
text. H4, H5, H7, H11, H12 and the LOWs do not: the ledger does not say whether
the code they are in was Gemini's or written by a fix, and it cannot be checked
now.

## What this found

1. **The label is natural.** The author was already writing it informally ("J1,
   in round-1 code"; "Believed, and wrong: ... (round 1, F5)").
2. **It can only be checked if each round's version can be recovered.** That
   review froze each round as a working-tree hash (`c9dad28+b3a4d5cf07b4`),
   because the change under review was never committed. A hash proves which
   version was read but cannot be diffed or blamed afterwards, and the readers'
   copies were deleted at the stop. So *new* against *from a fix* could not be
   settled by checking for about half of round 3. The plan says "set by checking
   against the version frozen at the start and each round's diff", which assumes
   something step 3's "commit or snapshot" does not guarantee.
   **Change to the plan:** step 3's freeze becomes "commit it, or keep a copy of
   what readers got that can be diffed (a patch in the ledger folder)", so the
   label can be checked; and the label's record says *traced* or *not traceable*
   when it cannot.
3. No finding in these two rounds was *old* (code from before Gemini's change).
   The review's scope was the change, so old bugs were rare. The *old* path is
   untested by this trial.
