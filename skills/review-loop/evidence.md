# Why the rules are the way they are

**Read once, not before your first round.** `SKILL.md` is the procedure; this is
what it is built on and where it is thin.

## The evidence base, stated honestly

Everything here comes from **one author, two artifacts, nine rounds** — a
long-form public explainer (seven rounds) and a one-page diagram (two) —
reviewed by small cheap model agents on a single model.

Separately, three **cold-pickup tests** asked agents to read the skill and
describe how they would apply it to a lab manual, an API reference and a
product manual. These were hypothetical: no such artifact existed and none was
reviewed. They tested whether the skill can be picked up and run cold, and they
shaped step 0 and the profile template. They did **not** test whether the
method works on those genres.

So: treat the procedure's steps as the general part and **treat every specific
persona, house rule and threshold as a hypothesis** until it has been used on a
real artifact of another genre. The numbers below come from two artifacts by
one author.

## The framing result

Fourteen readers briefed to *"find the friction, find what's broken"* produced
nothing load-bearing across two rounds. The same model, same artifact, briefed
*"did this succeed, for you?"* returned verdicts, a recall test showing the
structure survived one read, and a gap four readers reached independently.

That is the whole reason step 3 is written the way it is.

**A related result from outside this skill.** A separate experiment on a
different task — an agent summarising its own conversation history — held the
question fixed and varied only the writer's persona: first person, or a
neutral archivist. Scored blind against twelve known errors, the two dropped or
softened 8 and 9 of them. No meaningful difference.

That is a null result about persona, on a different task, with small numbers.
It is **consistent** with the framing result above but does not test it: the
question was never varied. Read the two together as a hint that what you ask
moves the result more than the persona you give, not as proof.

## Check the pipeline before you blame the reader

**Nine false findings across nine rounds, and all nine traced to the author's
pipeline rather than a reader's judgement.** That makes the pipeline the first
place to look. It does not make readers reliable: a reader can also be
confident, specific and wrong, which is why a single reader's claim must be
checked before it is fixed (step 4). The nine:

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

This is very likely a general property of review rather than an agent
problem: any process in which the reviewer sees only the current state is
exposed to it. The A/B reader is a cheap fix.

## The record format is the second weakest joint

A summary answers *what is true now*. **The wrong path is not part of what is
true now, so the task itself discards it.** Measured elsewhere on 2026-10-20:
ten episode summaries audited against the raw transcripts behind them — 7 of 10
had softened or dropped one of the author's own mistakes. Of 14 errors: **1
stated plainly, 6 softened, 5 omitted outright**, 1 omitted but trivial, and 1
lost with an episode that had been deleted. A preserve-mistakes rule was
already in force and did not stop it. The persona A/B under *The framing
result* — same question, different personas, 8 of 12 against 9 of 12 —
suggests the cause is not who writes. The likelier cause is the genre: a
summary is asked what is true now, and the wrong path is not.

This is a direct threat to `LEDGER.md`, which is a summary. It will read
perfectly well while having deleted the only data that could stop the next
author repeating you. The counter is not a better rule — rules lose to genres.
It is a **separate field that asks a different question of the same material**,
which is why `PREDICTIONS-R<n>.md` is not optional: it is the only artifact in
this method written before the answer was known.

## The author is the weakest joint

Nothing in steps 4 and 5 is independent: the author triages findings about their
own work, and an agent that wants to feel finished will quietly tier-3 anything
expensive. In every run recorded so far, the disposition auditor caught at
least one instance, including:

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
- **Specialist casts probably do not transfer between genres.** Expected rather
  than shown: the cold-pickup tests were hypothetical. Plan to write a new
  profile and keep only the frame.
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
