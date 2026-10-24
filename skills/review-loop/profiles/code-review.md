# Profile: code review

For a codebase reviewed by outside reviewers who read the code (not the running
app), each with one lens, looking for failures users would actually hit.

**Draft, from one project.** First used on efc-expenses (eleven rounds of its
code review, 2026-10-22 and 23). Kept deliberately small until a second project
tests it. The rules added after round 7 each held across at least two rounds;
do not add more on the strength of a single one.

---

## Success question

> In the ways its users really use it, including two of them at once, does the
> code give anyone a wrong result or lose their work?

The answer is a list of concrete failures, or "none found". A reviewer who finds
nothing has answered the question.

## Checkable against a source of truth

| Source of truth | The check |
|---|---|
| The pure logic's own rules (e.g. money adds up) | Unit tests |
| Each user flow | A script that drives the API (or CLI) against a local copy and asserts every response; keep it in the repo and grow it each round |
| The types | The compiler or type checker |

## House rules

| Rule | How to test it |
|---|---|
| Every finding has a concrete failure scenario: the steps, the state, the wrong outcome | A finding without one is returned, not triaged |
| Every finding is checked against the code, or reproduced, before it is fixed | The record says how each was checked |
| Every finding gets a severity, and **the reviewer's own rating is shown next to ours**, with a reason wherever they differ | The round's table has both columns |

The severity scale, given to every reviewer in the brief:

- **HIGH**: in realistic use, gives a wrong result, loses or corrupts data, or lets
  through an action that should be blocked, without anyone noticing.
- **MEDIUM**: wrong only in a rare timing or unusual sequence, or visibly wrong
  and recoverable.
- **LOW**: abuse by someone already trusted, edge-case input, or an annoyance.

Severity is a second axis beside SKILL.md's confidence tiers, not a replacement
for them: the tiers say whether to believe a finding, severity says how much it
matters.

Rating rules, because the author's ratings drift soft:

- **The same mechanism gets the same rating in every round.** A past rating is a
  precedent; rating it lower the second time needs a reason that is new.
- **"Only in a rare timing" is MEDIUM**, never LOW: the scale says so.
- **"Visible" or "recoverable" alone never makes a finding LOW.** The scale
  already counts visible and recoverable as MEDIUM.
- **A reason you give for a rating or for not fixing is a claim.** Check it
  against the code like a finding; false reasons are the most common thing the
  disposition auditor finds.
- **The reviewer's rating is evidence, not the verdict.** Rate on the scale's
  words; a column that copies the reviewer's is a column nobody judged.

## Materials bundle

- The repository at a named commit, not to be changed, **and a copy of the app
  they may run**: a local server, a test database, a scratch folder. A reviewer
  who can run the code reproduces its own findings; one who can only read hands
  that work back to you, and only for what it already suspected.
- The project's review notes, so reviewers don't re-report what was settled.
- What is intended and not a finding (e.g. "anyone can edit anything"), named in
  the brief.

## Cast

### A whole-code reviewer (every round)
The whole codebase, no focus, a short brief: who uses the app and how, *"review
this code"*, and the shape of the answer. On efc-expenses, after seven rounds of
focused lenses, one such review found a HIGH and three MEDIUM the lenses had
missed (see [`../evidence.md`](../evidence.md)).

### Specialists
One lens each, taken from the codebase's own seams. On efc-expenses those were
server data integrity, money logic, and browser input handling. Name the lens,
not the functions: a list of where to look is your hypothesis, handed over.

### Rules reviewer (when the rules are written down)
The code against the rules confirmed with the human (SKILL.md step 1): does the
app do what they say, everywhere a user sees or pays? Where the two disagree,
the rules decide. See *Rules nobody checked* in [`../evidence.md`](../evidence.md).

### Disposition auditor (required, every round)
Our ratings and decisions, after triage and before any decision to stop: which
don't hold up against the scale, which reasons are convenient, which mechanism
is rated differently in different places. See *The audit that kept moving the
stop line* in [`../evidence.md`](../evidence.md).

### Fix auditor (required from round 2)
The previous round's diff and nothing else, read hunk by hunk: *what did this
change break that used to work?* SKILL.md lists the fix auditor as a standing
reader; for code it is required here, because on first use most findings after
round 4 came from the previous round's fixes.

### Retired
| Persona | Rounds run | Why retired |
|---|---|---|

## Records

Per round, in the project: a table of finding, reviewer (their rating), ours
(with the reason if different), how it was checked, and what was done. Save each
reviewer's report beside it.

## When to stop

When a round has no HIGH **after the disposition auditor has checked the
ratings**. A round whose HIGHs are all fixed still has a round after it: the
fixes are new code.

## Out of scope

Style, naming, refactoring, test-coverage suggestions, and design choices the
brief names as intended.
