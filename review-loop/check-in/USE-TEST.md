# Use test: the six-round agent-office review, replayed through the check-in

Commit `da81b5a`. Audited totals per round (HIGH / MEDIUM / LOW): R1 2/6/6,
R2 1/3/12, R3 0/9/6, R4 1/3/2, R5 0/1/0, R6 0/0/1. Frank was asked after round 1
and again after round 3 (both by the review's own scope agreement, not by the
skill), and the loop otherwise ran on.

## Check-in after round 3, as the plan writes it

Direction test, round 3 against round 2, on findings not *old* (none were old):

1. Less severe: yes (1 HIGH to 0).
2. Rarer situations: yes (worktree submodules, git folders kept elsewhere, hard
   links; a read-only check showed nobody here used them).
3. Mostly *from a fix*: H1, H2, H3 and H10 trace to the fixes for G10, G2, F5
   and F3; the rest could not be traced (the rounds were frozen as hashes). Four
   of nine MEDIUM traced to fixes, five unknown. Under today's freeze rule each
   would be traceable.

So: converging. The plan's wording says "propose stopping".

## What the replay found

**Round 4 found a HIGH in the original change** (J1: `init` through a link into
a repository's subfolder plants a nested repository; the ledger says "in
round-1 code"). A check-in that proposed stopping at round 3 would have stopped
before it, on a proposal the human would likely have taken.

That does not make the check-in wrong: J1 needs a link into a subfolder (an
unusual setup), and the human decides at the check-in. But "converging, propose
stopping" is stronger than the skill says today ("bring the stakes check forward
rather than chase it"), and stronger than Frank's decisions, which say nothing
about the converging case. **Change to the plan:** converging proposes the
stakes item (rate the rare setups lower) or stopping, the human's choice, as
before; it does not propose stopping alone.

The check-in after round 6 would have been the close Frank actually gave.
