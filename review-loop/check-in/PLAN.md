# Plan: a review that runs on without the human

*Light review, kept by the review-loop skill. Safe to delete this folder once the work is done.*

Author: claude-9877, 2026-10-29. Decisions: Frank, same day.

## The problem

The review loop has no point at which it waits for the human, and no answer for
a review that is not settling down.

- **The stakes check** (step 4, "every two or three rounds") puts a proposal in
  the round's decision box, but "it is not a separate stop: the loop carries
  on", and the human's answer decides only when it comes.
- **The direction test** (step 4, every round from round 3) asks whether the
  findings that are not *old* are less severe, rarer, and mostly *from a fix*.
  Yes to all three: the work is converging, bring the stakes check forward. It
  says nothing when the answer is no: the review simply goes on.

Two reviews here went 11 rounds (efc-expenses) and 6 (agent-office), the later
rounds mostly chasing their own fixes into rarer setups (evidence.md, *Fixes
chasing their own edges*). Anthropic's account of how the Claude Code team
reviews code (October 2026) describes one PR that went through more than fifty
rounds of review and fixes overnight before its author stopped it; their answer
was a cap: after three rounds the reviewer asks the author to step back and
reconsider the approach.

## Frank's decisions

1. **After round 3 the review stops and waits for the human.** Further rounds
   run only if the human says so.
2. **It is one check-in, merged with the stakes check**, every third round,
   bringing both the stakes proposal and the direction evidence. Not two
   mechanisms.
3. **The check-in says what to propose when the review is not settling down**,
   from the *where it came from* labels:
   - serious findings still *from a fix*: the fixes are the problem; propose
     stepping back to rethink the approach (as the peer step already does when
     a plan keeps growing), not another round of fixes;
   - serious findings still *new*: the change has faults the early rounds
     missed; propose another round, perhaps with different readers.
4. **Keep the edits light and focused.** The skill has been cut down several
   times. Replace text rather than add it; nothing that is not needed to carry
   out 1 to 3.

## The edits

**SKILL.md step 4**: the two paragraphs *The stakes check* and *The direction
test* are replaced by one, about the same length:

> **The check-in, after every third round: stop and wait for the human.** The
> next round runs only if they say so, whatever a profile's stop rule says (a
> profile decides when a review is clean; the human decides whether it goes on).
> The decision box brings two things. **The direction test**: compared with the
> last round, are the findings that are not *old* (1) less severe, (2) in rarer
> situations, and (3) mostly *from a fix* (count them)? Yes to all three: it is
> converging, and what is left is the cost of fixing; propose stopping. Serious
> findings still *from a fix*: the fixes are the problem; propose stepping back
> to rethink the approach, as the peer step does when a plan grows. Serious
> findings still *new*: earlier rounds missed them; propose another round,
> perhaps with different readers. **The stakes**, with the evidence: *"The last
> findings are in setups you don't use (X, Y). I propose rating those one step
> lower from now on. Agree?"* Record the answer in the ledger as the new stakes.
> Fixes causing new problems is normal; what is tolerable is set by whom they
> reach, not by their count.

**Renames**, "the stakes check" to "the check-in": SKILL.md line 44,
profiles/code-review.md line 49, human-page.md line 26. evidence.md's history
stays as written (it says what was done then).

**SKILL.md, when to stop**: nothing added; the check-in itself is where a review
can end, and the stop rules still apply within it.

## What is not changing

The light review (no rounds), the cast, the stop rules, the ledger, the page
layout.

## How I will check it

- Use it once: replay the agent-office six-round ledger (commit `da81b5a`)
  through the new rule. Where would it have paused, and with what proposal?
- Count every mention of the stakes check and the direction test, and require
  each to be replaced or deliberately left (evidence.md).
- Word count of SKILL.md before and after.
- One fix auditor on the diff.
