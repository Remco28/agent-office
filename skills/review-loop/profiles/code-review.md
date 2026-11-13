# Profile: code review

This profile is for a codebase. Its readers read the code and run a copy of it, and look for failures that users would actually hit.

**A draft from two projects**, one of eleven rounds and one of six. Each rule here held across at least two rounds. Do not add one on the strength of a single round. The *setup not in use* rule is newer than that and still on trial. See *Fixes that kept making new findings* in evidence.md.

## Success question

> In the ways its users really use it, including two of them at once, does the
> code give anyone a wrong result or lose their work?

"None found" is an answer.

## Step 0: checks to run first

- Unit tests for the pure logic's own rules, such as money adding up and counts matching.
- For each user flow, a script that drives the API against a local copy and asserts every response. Keep it in the repo and add to it each round.
- The compiler or type checker, for the types.

## House rules

- **Every finding has a concrete failure scenario.** That means the steps, the state and the wrong outcome. Send a finding without one back to the reader instead of sorting it.
- **Every finding gets a severity.** Put the reviewer's rating beside ours, with a reason where they differ.

Every reader's brief includes this severity scale:

- **HIGH**: in realistic use, a wrong result, lost or corrupted data, or an action let through that should be blocked, without anyone noticing.
- **MEDIUM**: wrong only in a rare timing or unusual sequence, or visibly wrong and recoverable.
- **LOW**: abuse by someone already trusted, edge-case input, or an annoyance.

These rating rules exist because your own ratings tend to get softer:

- **The same mechanism gets the same rating in every round.** A past rating is a precedent, and rating it lower needs a new reason.
- **"Only in a rare timing" is MEDIUM**, never LOW. That applies to timing in the setups really in use.
- **A setup not in use is one step lower.** Some failures need a setup that the stakes record as not in use, such as a git layout nobody here has or an OS nobody runs. Rate such a failure one step down, HIGH to MEDIUM or MEDIUM to LOW, and label it *not in use*. This applies only from the check-in on. Until the human has agreed, rate it in full and propose the step down at the check-in.
- **"Visible" or "recoverable" alone never makes a finding LOW.**
- **A reason for a rating, or for not fixing, is a claim.** Check it against the code like a finding.
- **The reviewer's rating is evidence, not the verdict.** If your column copies the reviewer's, nobody judged it.

## Fixing

**Every HIGH or MEDIUM fix gets SKILL.md's peer step before any code.** Write the plan plainly, give it to critics, give the problem alone to blind solvers, and then give the result to a fresh group. Do this however small and obvious the fix looks, because that feeling is what the step is for. A LOW fix does not need it.

## What readers get

- The repository at a named commit, **and a copy they may run**, such as a local server, a test database or a scratch folder. A reader who can run the code reproduces its own findings. The copy links the dependency folders instead of copying them, and you delete it when you save the round's reports, as SKILL.md step 3 says. Start these readers with the running-code recipes in [`readers.md`](../readers.md). Only one of them can start a local server, so you reproduce what the others cannot.
- The project's review notes, including old bugs already filed, so that readers do not report settled points again.
- What is intended and not a finding, for example "anyone can edit anything".

## Cast

- **A whole-code reader, every round.** It gets the whole codebase, no focus and a short brief: who uses the code and how, *"review this code"*, and the shape of the answer. Focused lenses miss what nobody named.
- **Specialists**, one lens each, taken from the code's own boundaries, such as data integrity, money logic and input handling. Name the lens, not the functions. A list of where to look is your guess, handed to the reader.
- **A rules reader, when the rules are written down** as in SKILL.md step 1. It asks whether the code does what the rules say, everywhere a user sees or pays. Where the code and the rules disagree, the rules decide.
- **The fix auditor, from round 2.** It reads the last round's diff, hunk by hunk, and asks *what did this break that used to work?* Most later findings come from earlier fixes.
- **The disposition auditor, every round**, before any decision to stop.

No readers are retired yet.

## When to stop

This replaces SKILL.md's stop rules for code: **stop after a round that has no HIGH that is not *old*, by ratings the disposition auditor has checked, and that needed no HIGH or MEDIUM fixes.** A round that ended with such fixes gets another round after it, with a fix auditor on those fixes, because the fixes are new code and SKILL.md's check-in still applies. You file an old HIGH, and an old bug that blocks stops the review, as SKILL.md step 4 says.

## Out of scope

Readers do not report style, naming, refactoring, test-coverage suggestions, or design choices that the brief names as intended.
