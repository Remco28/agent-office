# Why the rules are the way they are

**Read once, not before your first round.** `SKILL.md` is the procedure; this is
what it is built on and where it is thin.

## The evidence base, stated honestly

Everything here comes from **one author, two artifacts, nine rounds** — a
long-form public explainer (seven rounds) and a one-page diagram (two) —
reviewed by small cheap model agents. Two cold-read tests on other genres (a
lab manual, an API reference) found that the *loop structure* carried over and
the *cast and house rules* did not.

So: treat the procedure's steps as general and **treat every specific persona,
house rule and threshold as a hypothesis** until another genre confirms it. The
numbers below come from two artifacts by one author, which is not a law.

## The framing result

Fourteen readers briefed to *"find the friction, find what's broken"* produced
nothing load-bearing across two rounds. The same model, same artifact, briefed
*"did this succeed, for you?"* returned verdicts, a recall test showing the
structure survived one read, and a gap four readers reached independently.

That is the whole reason step 3 is written the way it is.

## The harness is the unreliable component, not the readers

Across those rounds, **every false finding was the author's pipeline** —
not the readers' judgement:

- a capture whose viewport stretched every section
- animations frozen mid-reveal, so text measured 1.6:1 against a declared 9.2:1
- a CSS reset added while fixing the above, which collapsed five labels onto one point
- text fused at line breaks in an extract, filed as fifteen spelling errors
- a scroll-triggered animation that never played, so the central chart was
  captured empty and reported as the result being broken
- extraction markers read as visible page text — filed by four readers across
  two rounds before the author recognised them

— nine of them across nine rounds, and not one was a reader's judgement.
**Every one was reported accurately by the reader who hit it**; what was wrong
was the copy they had been handed, or the instrument used to check it. This is why step 4's first gate exists, and
why the gate is about *the copy you handed over*, not about dismissing layout.

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
six rounds while
three readers a round asked for cuts, every one filed as taste.

Four A/B readers on two unlabelled drafts, both orderings:

| | early draft | late draft |
|---|---|---|
| better to **read** | **4/4** | 0 |
| more **trustworthy** | 0 | **4/4** |
| would **publish** | 0 | **4/4** |
| **over-qualified** | 0 | **4/4** |

The specialist's verdict was the important one: *"I found no case where the later
draft hides a supported result."* The cost was **shape, not truth** — limits had
migrated inside the claims until the claims could not be found. Splitting them
into separate sentences conceded nothing.

This is a general property of review, not an agent problem. Code review does it.
Editing does it. Any process where the reviewer sees only the current state does
it. The A/B reader is a cheap fix for an old flaw.

## The author is the weakest joint

Nothing in steps 4 and 5 is independent: the author triages findings about their
own work, and an agent that wants to feel finished will quietly tier-3 anything
expensive. The disposition auditor has caught this every time it has run,
including:

- declines justified by a reason that turned out to be false
- the same expensive items deferred two rounds running under "reserved for the
  human"
- a fix described in a commit message and never actually made
- fixes applied to the reading level being edited and missed in the other two,
  and in alt text, fallbacks and code strings

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
  agreement between people."* That is right, and it weakens the single load-
  bearing rule in step 4. Nothing here measures it. Until something does, treat
  convergence as a strong hint rather than proof, vary the personas hard so the
  readers are not asked the same question in the same words, and keep the human
  at the end — which is the only reader in the cast whose errors are
  uncorrelated with the rest. **Where more than one model is available, spread
  the cast across them and write the model beside each finding.** Every round
  recorded here ran entirely on one cheap model, so every convergence in this
  file carries that caveat.
