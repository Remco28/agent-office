# Why the rules are the way they are

**For maintaining the skill, not for running it.** `SKILL.md` is the procedure;
this is what it is built on and where it is thin. Read it before changing a rule,
so a rule isn't simplified away without knowing what it protects against.

## The evidence base, stated honestly

Everything here comes from **one author, two artifacts, nine rounds** — a
long-form public explainer (seven rounds) and a one-page diagram (two) —
reviewed by small cheap model agents. Two cold-read tests on other genres (a
lab manual, an API reference) found that the *loop structure* carried over and
the *cast and house rules* did not. Since then, one code review (efc-expenses,
eleven rounds, outside reviewers on four models for rounds 1 to 7, Claude
subagents after) has added the episodes from *Briefs drift toward the answer* to
*Running it finds what reading doesn't*, and a second (agent-office, six rounds)
*Fixes chasing their own edges*.

So: treat the procedure's steps as general and **treat every specific persona,
house rule and threshold as a hypothesis** until another genre confirms it. The
numbers below come from two artifacts by one author, which is not a law.

## The framing result

Fourteen readers briefed to *"find the friction, find what's broken"* produced
nothing load-bearing across two rounds. The same model, same artifact, briefed
*"did this succeed, for you?"* returned verdicts, a recall test showing the
structure survived one read, and a gap four readers reached independently.

That is the whole reason step 3 is written the way it is.

**Corroborated from outside this project, 2026-10-20.** Another agent, on a
different problem — summarising its own conversation history — ran the inverse
experiment as an A/B. It held the *question* fixed ("summarise this") and varied
the *writer*: once in first person as itself, once as a neutral archivist with
the identity stripped. A blind judge scored both against twelve known errors.
First person softened or dropped 8 of 12; the neutral archivist, 9 of 12. **No
difference.**

Set that beside the framing result above. Varying **who writes** changed
nothing; varying **what you ask** changed everything. Two experiments, different
authors, different domains, run in opposite directions, landing on the same
claim: **the question carries most of the weight.**

The writer's *situation* carries a little of the rest, from a third and less
controlled comparison in the same study: summaries written at the end of a long
live session dropped 11 of 12, against 8–9 for fresh writers given the same
transcripts cold. Small numbers, so treat it as a hint.

In both studies the actor is the same thing — an agent handed material and a
task — whether that study calls it a writer or this skill calls it a reader. So
the finding transfers: **who** they are matters least of the three. What you ask
them, and the state they are in when you ask, is what moves the result.

## Briefs drift toward the answer

**efc-expenses, 2026-10-22 and 23, a code review** (see
[`profiles/code-review.md`](profiles/code-review.md)). Seven rounds of outside
reviewers on four different models. Round 3's briefs were a role, a focus area
and a severity scale. By round 5 they named internal functions, said where to
look hardest, and told two reviewers to stop early to fit a time limit; and they
said *read-only, do not run the app*. The rounds found many real issues, mostly
where the briefs pointed — including a run of regressions in the author's own
fixes.

Then the human asked one reviewer, with no brief beyond "review this code", to
look at the code the seven rounds had left. It ran the server against a test
database and the PDF exporter against a real receipt, reproduced every finding,
and returned one HIGH and three MEDIUM that the rounds had missed: the most
ordinary shared-editing failure (an editor left open overwrites a newer
correction), an area no brief had named since round 2, and a severity the author
had rated LOW and it showed was not.

Two things went wrong, and they are worth separating. The **briefs**
predetermined the search: every addition was reasonable, and together they were
a map. The **materials** withheld the most useful tool: the reviewers could have
run the code and were told not to. **The human recognised the drift from other
projects**, which makes it more than a one-off.

What this does not show: that one generic review beats a structured loop. It ran
once, on code seven rounds had already cleaned. A fair comparison runs both on
the same code.

## The audit that kept moving the stop line

**efc-expenses, rounds 8 to 11.** After each round the author rated the findings
and decided whether the round was clean. Four times running, the disposition
auditor showed it wasn't: the same mechanism rated HIGH one round and LOW the
next, "only in a rare timing" rated LOW when the scale calls it MEDIUM, "visible"
given as the reason for LOW, and twice a reason for not fixing that was simply
false (a check described as covering a case it didn't). Each time the re-rating
added a HIGH and a further round. The author had written the rating rules down
after the first audit and still broke them in the next three. That is why the
auditor is required before any stop decision, rather than offered.

## Rules nobody checked

**efc-expenses, after round 10.** Ten rounds of reviewers checked the code
against the author's idea of the app: that families on a trip eat together, so
a meal is split among everyone there that day. The human, asked in plain words
how the club actually pays, said in a few minutes that this was wrong (meals
are opt-in; attendance days aren't needed at all), and the split was rebuilt.
No reader could have found it: every one was checking the code against the same
wrong idea. In the next round, a reader given the written rules found a default
the author had chosen without asking (every new fencer charged for every day),
which moved money silently. Hence step 1's *confirm the rules*, the rules
reviewer, and *the owner decides what changes outcomes*.

## A fix that grew and a design that shrank

**efc-expenses, rounds 9 and 10.** The author's fixes for duplicate saves on a
bad signal went to peers before any code: critics on the plan, others solving
the problem blind, then the improved plan to a fresh group. Pass one beat the
author's plan outright; pass two broke details the author had added between
passes; by pass three the fix touched the server, the phone's storage and every
kind of record, and was stopped as a design problem. The design that replaced it
went through the same loop with the human choosing the direction ("hold new
expenses on the phone until there's a signal"), and each pass made it smaller:
two critics independently proposed cutting the same feature. It was built after
three passes. The direction of change, not the number of passes, told the two
apart.

## Running it finds what reading doesn't

**efc-expenses, rounds 9 to 11.** Three times, the author's own run of the app
in a browser, after the peers and before the reviewers, found what no reader had:
a screen that couldn't load offline right after the app said an expense was
"waiting", so the waiting expense couldn't be seen; a button that redrew by
reloading, which needs a signal; a removed piece of dead code whose one leftover
reference broke a page. All three passed every API check, because all three
were in what the screen does, not what the server returns.

## Fixes chasing their own edges

**agent-office, 2026-10-26 and 27, a code review** (six rounds, readers on four
models). Rounds 1 and 2 found 3 HIGH and 9 MEDIUM in the original change, all
in ordinary use (a copied project filing under the original, a user's own file
hidden from git). Rounds 3 to 6 found 1 HIGH and about 10 MEDIUM, nearly all in
code written to fix the round before, and in ever rarer git setups (worktree
submodules, a git folder kept elsewhere, hard links, two setups at once) that a
read-only check of the machine showed nobody here used. The rating rules were
followed, and the auditor raised three of the author's ratings, rightly by the
rules: "rare timing is MEDIUM" kept forcing another round. The changed code
roughly tripled, mostly for those setups. About 60% of all findings were in the
original code, 40% from fixes.

The human's diagnosis: they could not have set the stakes accurately at the
start, and will usually not be able to; their job is to say what matters once
they are shown. Hence the stakes drafted from how the thing is really used, the
*whom it reaches* split, the stakes check every two or three rounds, the
direction test, and in the code profile one step down for a setup not in use.
**These are a hypothesis from one review**: the next code review should record
whether the stakes check ended it sooner without letting through a failure in
real use.

The same review copied a 1.4 GB Python environment into every reader's copy and
never deleted the copies: 29 GB, unnoticed until the human asked. Hence the
copy and clean-up rules in step 3 and at the stop.

## The harness is the unreliable component, not the readers

**Nine false findings across nine rounds, and every one was the author's
pipeline.** Not once was it a reader's judgement. All nine:

- a capture whose viewport stretched every section
- animations frozen mid-reveal, so text measured 1.6:1 against a declared 9.2:1
- a CSS reset added while fixing the above, which collapsed five labels onto one point
- text fused at line breaks in an extract, filed as fifteen spelling errors
- a scroll-triggered animation that never played, so the central chart was
  captured empty and reported as the result being broken
- extraction markers read as visible page text — filed by four readers across
  two rounds before the author recognised them
- a stale local web server still bound to the port, so a verification run tested
  the *unfixed* directory and reported six landed fixes as failures
- a watcher that counted lines containing a marker, where the document's own
  instructions quoted that marker — so it fired on the author's own writing
- a geometry probe reading element-local coordinates as page coordinates, which
  reported dozens of clipped elements, none of them real

**Every one was reported accurately by whoever hit it.** What was wrong was the
copy they had been handed, or the instrument used to check it. This is why step
4's first gate exists, and why the gate is about *the copy you handed over*,
rather than about dismissing layout faults.

**And the gate cuts both ways.** After seven clean rounds the artifact shipped,
and the owner found within hours that it burned 20–50% of a processor, parked,
with nothing visibly moving — a perpetual animation on an element the browser
could not composite, redrawing 3,072 vector paths sixty times a second. No
reader had an instrument, so no reader could see it. Worse, the author's own
instrument could not reproduce it: a headless bisect put the page at 3.9%
against a blank page's 4.6% and would have certified it clean.

So: **a tool that cannot reproduce a fault cannot clear the artifact of it**,
and the word "measured" has to carry the name of what did the measuring. Where
a property is only visible on the real target — compositing, battery, print,
latency, a screen reader's actual speech — either measure it there or record it
as unmeasured. Do not let a convenient instrument stand in for an absent one.

## The ratchet — the loop's built-in bias

Readers find faults. Faults get fixed. Fixes add caution. **No reader sees the
previous version, so none can say "this got worse."** The artifact can only
harden, round after round, and nothing inside the loop objects.

Measured: the page grew **4,243 → 4,730 words (+11.5%)** across the explainer's
**first six** rounds — the A/B below ran after the sixth — while three readers a
round asked for cuts, every one filed as taste.

Four A/B readers on two unlabelled drafts, both orderings:

| | early draft | late draft |
|---|---|---|
| better to **read** | **4/4** | 0 |
| more **trustworthy** | 0 | **4/4** |
| would **publish** | 0 | **4/4** |
| **over-qualified** | 0 | **4/4** |

One of the four read as a subject specialist, and its verdict was the important
one: *"I found no case where the later draft hides a supported result."* The cost was **shape, not truth** — limits had
migrated inside the claims until the claims could not be found. Splitting them
into separate sentences conceded nothing.

This is a general property of review, not an agent problem. Code review does it.
Editing does it. Any process where the reviewer sees only the current state does
it. The A/B reader is a cheap fix for an old flaw.

## The record format is the second weakest joint

A summary answers *what is true now*. **The wrong path is not part of what is
true now, so the task itself discards it.** Measured elsewhere on 2026-10-20:
ten episode summaries audited against the raw transcripts behind them — 7 of 10
had softened or dropped one of the author's own mistakes. Of 14 errors: **1
stated plainly, 6 softened, 5 omitted outright**, 1 omitted but trivial, and 1
lost with an episode that had been deleted. A preserve-mistakes rule was
already in force and did not stop it. The authorship A/B under *The framing
result* — same question, different writers, 8 of 12 against 9 of 12 — shows it
is not the author and not the model. It is the genre.

This is a direct threat to the ledger, which is a summary. It will read
perfectly well while having deleted the only data that could stop the next
author repeating you. The counter is not a better rule — rules lose to genres.
It is a **separate field that asks a different question of the same material**,
which is why the ledger's predictions, written before each round, are not
optional: they are the only part of the method written before the answer was known.

## The author is the weakest joint

Nothing in steps 4 and 5 is independent: the author triages findings about their
own work, and an agent that wants to feel finished will quietly tier-3 anything
expensive. The disposition auditor has caught this every time it has run,
including:

- declines justified by a reason that turned out to be false
- the same expensive items deferred two rounds running under "reserved for the
  human"
- a fix described in a commit message and never actually made
- fixes applied to one version of a passage and missed in every other place the
  same claim lived — the artifact's other reading levels, its alt text, its
  no-JavaScript fallbacks, and the strings inside the code that drew it

That last pattern is why step 5 says *prove the fix, do not describe it*. The
auditor is a mitigation, not a cure.

## Where the method is known to strain

- **Artifacts with no single stated goal** — a codebase, a design system. The
  success question has to be invented per round, which weakens everything built
  on it.
- **Artifacts read in fragments.** Recall tests the wrong thing; use a task with
  a verifiable outcome, and add coverage to the stop rule.
- **Artifacts whose success is a physical action** — a manual for work on real
  hardware. A reader can walk the procedure and check its internal consistency,
  but cannot tell you whether the bolt actually fits.
- **Large artifacts.** Readers have a finite context; give each the slice their
  lens needs, and say in the brief what you left out.
- **Specialist casts do not transfer between genres.** Tested, twice. Expect to
  write a new profile and keep only the frame.
- **Readers drawn from one model have correlated errors.** Raised by a reader,
  not by the author: *"if the readers share one underlying model, their errors
  may be correlated, and agreement between them is weaker evidence than
  agreement between people."* That is right, and it weakens tier 1 — which is
  why step 4 now says "two or more **independent** readers" and spends a
  paragraph on what independent has to mean. **Nothing here measures the size of
  the effect**, only names it. Until something does, treat
  convergence as a strong hint rather than proof, vary the personas hard so the
  readers are not asked the same question in the same words, and keep the human
  at the end — which is the only reader in the cast whose errors are
  uncorrelated with the rest. **Where more than one model is available, spread
  the cast across them and write the model beside each finding.** Every round
  recorded here ran entirely on one cheap model, so every convergence in this
  file carries that caveat.
