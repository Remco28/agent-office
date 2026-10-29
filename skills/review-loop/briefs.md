# Writing the briefs

The brief **is** the instrument. Same model, same artifact, same cost — a bad
brief returns a list of defensible nitpicks, a good one returns a verdict you can
act on. This file is the part that does not survive being summarised, so it is
written as patterns and examples rather than rules.

---

## The skeleton

Every brief has six parts, in this order:

1. **Who they are**, in one or two sentences. Concrete, not a job title. *"You
   read English well as a second language, at about B2 level. You are educated
   but have no science background."*
2. **The materials**, by absolute path, with what each one is.
3. **The artifact's stated goal**, quoted. They are measuring against this, not
   against their taste.
4. **Their questions**, numbered. Comprehension readers get the four questions;
   specialists get their lens.
5. **The honesty line**, verbatim: *"Do not hunt for problems to fill space.
   'Nothing wrong' is a real and useful answer."*
6. **Known artifacts of the materials**, named as deliberate. *"The screenshots
   use the page's reduced-motion path, so every animation shows its finished
   state. That is intentional and is not a fault."*

Leave out 6 and you will spend a round triaging your own harness.

## What separates a brief that works

**Name the one thing you are afraid of.** The best briefs end with a question
that admits a worry: *"Is the hedging now too heavy?"*, *"Did any of these
changes make it worse in a way the change did not intend?"*, *"If you find
nothing, say why you looked and came up empty."* A reader given a worry
investigates. A reader given a checklist checks.

**Tell them what has already been checked.** *"This has run three times and the
obvious cases are fixed. If a level is now clean, say so — that is the result we
are testing for."* Without it you get the same easy findings every round, and you
cannot tell a clean result from a lazy one.

**Ask for the good as well as the bad, and say why.** *"The three best sentences,
and what makes them good. This is not a courtesy — it tells us what to protect."*
Twice a sentence survived a later cut only because a reader had named it.

**Make them distinguish kinds of gap.** *"Distinguish clearly between 'the page
forgot' and 'science doesn't know yet, and the page says so.'"* Otherwise open
questions arrive as defects.

**Give specialists the real thing.** The reader auditing accessibility gets the
source and the scripts, not a text dump — and gets told *"many ARIA attributes
are set by JavaScript at init; check the JS before reporting a missing
attribute."* That single sentence removed the most common false finding.

## What fails

- **One persona asked to judge success and hunt faults.** It will hunt, every
  time. Split them.
- **"Find the friction / what's wrong / where it breaks down."** Rounds 1 and 2
  used this and produced zero tier-1 findings across fourteen readers.
- **A vague role.** "Review this page" returns prose about the page. "You have
  ninety seconds and you are going to scroll fast and then leave" returns
  evidence.
- **No stated goal.** Then they review against their own, and you learn what that
  model likes.
- **Materials without their caveats.** Four readers across two rounds filed an
  extraction marker as a visible page error.
- **A brief that grows each round.** Each addition looks reasonable — a scope to
  stop a timeout, the names of the functions you changed, where to look hardest —
  and together they hand the reader your map of where the problems are. It
  searches the map and returns it confirmed; what lies off the map is never
  looked at. A worry is one sentence (*"is anything I changed now worse?"*); a
  map is your hypothesis. If a brief is longer than the last one, ask what each
  new line takes away from the reader. See the code-review episode in
  [`evidence.md`](evidence.md).

---

## Five briefs that earned their place

(SKILL.md lists the four standing readers and what each is *for*; this is how
to write them. The fifth is not standing — it is a bespoke reader that has
been worth reusing.)

**The fix auditor.** Materials: *last round's fixes and nothing else*, plus the
artifact. For each change: GONE / STILL THERE / REPLACED BY A NEW PROBLEM, with a
quote. Then the two questions that matter: *"Did any of these changes make it
worse in a way the change did not intend?"* and *"Is there any change applied in
one place and missed in another?"* For each problem it reports, it says whether
the fix made it or it was there before the fix. It has never run without finding a fix that
did not land, including one the author had written up and never made.

**The disposition auditor.** Materials: *every finding and what the author did
with it*, plus the triage rules the author claims to follow. Asks which declines
do not hold, whether the stated reasons are real or convenient, and whether the
expensive and self-authored items were treated more gently than the checkable
ones. Give it too the version before the change and each round's fix commits,
and have it check every *where it came from* label against them: a soft *old*
takes a finding out of the count. It is the only reader that audits the
instrument instead of the artifact.
Tell it plainly: *"Finding nothing is a real answer, but it is the answer that
should make us trust YOU less rather than the author more."*

**The cost reader.** Materials: a measurement taken on the real target, plus
the same measurement of a control — a blank page, the previous version, a
competitor. Asks what the artifact costs the person using it: time, attention,
money, battery, processor, quota. Say this plainly in the brief: *"An
impression is not evidence here. If it was not measured on the thing the
audience actually uses, answer 'unmeasured' — do not answer 'fine'."* The
processor story in [`evidence.md`](evidence.md) is what this reader exists for,
and it is also the one it missed.

**The A/B reader.** Materials: two unlabelled drafts, *both orderings run
separately* to control for position. Asks four things: which is better to
**read**; which do you **trust**; is either over-qualified; does either fail to
state its own result plainly. The only reader that can detect regression, because every other reader
sees one version and can only add caution.

**A targeted recall reader.** *Not standing — bespoke, but worth reusing.* Materials: the artifact, read once, no going back.
Then specific questions from memory about the thing last round's fix was supposed
to deliver. *"Your uncertainty is the useful data here, not your ability to find
the answer."* This is how you learn whether a fix reached a reader rather than
merely reaching the file.

---

## Running them

Parallel, blind to each other. Framing matters more than model tier — but
**spread the cast across models anyway and record which model said what.**
Readers from one model share its blind spots, so their agreement counts for
less than the number suggests.

Brief them like colleagues who have one job and limited time, not like a form to
fill in.
