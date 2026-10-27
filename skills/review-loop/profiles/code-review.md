# Profile: code review

For a codebase, reviewed by readers who read the code and run a copy of it,
looking for failures users would actually hit.

**A draft from two projects** (eleven rounds and six). Each rule here held
across at least two rounds; don't add one on the strength of a single round.
The *setup not in use* rule is newer than that and on trial (evidence.md,
*Fixes chasing their own edges*).

## Success question

> In the ways its users really use it, including two of them at once, does the
> code give anyone a wrong result or lose their work?

"None found" is an answer.

## Checks to run first (step 0)

- The pure logic's own rules (money adds up, counts match): unit tests.
- Each user flow: a script that drives the API against a local copy and asserts
  every response. Keep it in the repo and grow it each round.
- The types: the compiler or type checker.

## House rules

- **Every finding has a concrete failure scenario**: the steps, the state, the
  wrong outcome. One without is returned, not sorted.
- **Every finding gets a severity**, the reviewer's beside ours, with a reason
  where they differ.

The severity scale, given to every reader in the brief:

- **HIGH**: in realistic use, a wrong result, lost or corrupted data, or an action
  let through that should be blocked, without anyone noticing.
- **MEDIUM**: wrong only in a rare timing or unusual sequence, or visibly wrong
  and recoverable.
- **LOW**: abuse by someone already trusted, edge-case input, or an annoyance.

Rating rules, because your ratings drift soft:

- **The same mechanism gets the same rating in every round.** A past rating is a
  precedent; rating it lower needs a new reason.
- **"Only in a rare timing" is MEDIUM**, never LOW. That is about timing in the
  setups really in use.
- **A setup not in use is one step lower.** A failure that needs a setup the
  stakes record as not in use (a git layout nobody here has, an OS nobody runs)
  is rated one step down, HIGH to MEDIUM or MEDIUM to LOW, and labelled
  *not in use*. Only from the stakes check on: until the human has agreed, rate
  it in full and propose the step down there.
- **"Visible" or "recoverable" alone never makes a finding LOW.**
- **A reason for a rating, or for not fixing, is a claim.** Check it against the
  code like a finding.
- **The reviewer's rating is evidence, not the verdict.** A column that copies
  the reviewer's is a column nobody judged.

## Fixing

**Every HIGH or MEDIUM fix gets SKILL.md's peer step before any code**: write
the plan plainly, give it to critics, give the problem alone to blind solvers,
then a fresh group. However small and obvious the fix looks: that feeling is
what the step is for. A LOW fix doesn't need it.

## What readers get

- The repository at a named commit, **and a copy they may run**: a local server,
  a test database, a scratch folder. A reader who can run the code reproduces
  its own findings. The copy links the dependency folders rather than copying
  them, and goes when the round's reports are saved (SKILL.md step 3).
- The project's review notes, so settled points aren't re-reported.
- What is intended and not a finding (e.g. "anyone can edit anything").

## Cast

- **A whole-code reader, every round.** The whole codebase, no focus, a short
  brief: who uses it and how, *"review this code"*, the shape of the answer.
  Focused lenses miss what nobody named.
- **Specialists**, one lens each, from the code's own seams (data integrity,
  money logic, input handling). Name the lens, not the functions: a list of where
  to look is your guess, handed over.
- **A rules reader, when the rules are written down** (SKILL.md step 1): does
  the code do what they say, everywhere a user sees or pays? Where they disagree,
  the rules decide.
- **The fix auditor, from round 2**: the last round's diff, hunk by hunk. *What
  did this break that used to work?* Most later findings come from earlier fixes.
- **The disposition auditor, every round**, before any decision to stop.

Retired readers: none yet.

## When to stop

This replaces SKILL.md's stop rules for code: **stop after a round that has no
HIGH, by ratings the disposition auditor has checked, and needed no HIGH or
MEDIUM fixes.** A round that ended with such fixes has a round after it, with a
fix auditor on them: the fixes are new code.

## Out of scope

Style, naming, refactoring, test-coverage suggestions, and design choices the
brief names as intended.
