# Writing the briefs

The brief **is** the instrument. With the same model, the same artifact and the same cost, a bad brief returns a list of defensible nitpicks, and a good one returns a verdict you can act on. This file is the part that a summary loses, so it gives patterns and examples rather than rules.

---

## The skeleton

Every brief has six parts, in this order:

1. **Who they are**, in one or two sentences. Make it concrete, not a job title. *"You read English well as a second language, at about B2 level. You are educated but have no science background."*
2. **The materials**, each by its absolute path in the reader's copy, with what each one is.
3. **The artifact's stated goal**, quoted. The reader measures against this, not against their own taste.
4. **Their questions**, numbered. Comprehension readers get the four questions, and specialists get their lens.
5. **The honesty line**, verbatim: *"Do not hunt for problems to fill space. 'Nothing wrong' is a real and useful answer."*
6. **Known artifacts of the materials**, named as deliberate. *"The screenshots use the page's reduced-motion path, so every animation shows its finished state. That is intentional and is not a fault."*

If you leave out 6, you will spend a round sorting out faults in your own capture tools.

## What separates a brief that works

**Name the one thing you are afraid of.** The best briefs end with a question that admits a worry: *"Is the hedging now too heavy?"*, *"Did any of these changes make it worse in a way the change did not intend?"*, *"If you find nothing, say why you looked and came up empty."* A reader given a worry investigates. A reader given a checklist checks.

**Tell them what has already been checked.** *"This has run three times and the obvious cases are fixed. If a level is now clean, say so. That is the result we are testing for."* Without it you get the same easy findings every round, and you cannot tell a clean result from a lazy one.

**Ask for the good as well as the bad, and say why.** *"The three best sentences, and what makes them good. This is not a courtesy. It tells us what to protect."* Twice, a sentence survived a later cut only because a reader had named it.

**Make them distinguish kinds of gap.** *"Distinguish clearly between 'the page forgot' and 'science doesn't know yet, and the page says so.'"* Otherwise open questions arrive as defects.

**Give specialists the real thing.** The reader auditing accessibility gets the source and the scripts, not a text dump. Its brief also says *"many ARIA attributes are set by JavaScript at init; check the JS before reporting a missing attribute."* That single sentence removed the most common false finding.

## What fails

- **One persona asked both to judge success and to hunt faults.** It will hunt, every time. Split the two jobs between two personas.
- **"Find the friction / what's wrong / where it breaks down."** Rounds 1 and 2 used this and produced zero tier-1 findings across fourteen readers.
- **A vague role.** "Review this page" returns prose about the page. "You have ninety seconds and you are going to scroll fast and then leave" returns evidence.
- **No stated goal.** Then readers review against their own goal, and you learn what that model likes.
- **Materials without their caveats.** Four readers across two rounds filed an extraction marker as a visible page error.
- **A brief that grows each round.** Each addition looks reasonable, such as a scope to stop a timeout, the names of the functions you changed, or where to look hardest. Together they hand the reader your list of places where the problems are. The reader searches those places and confirms them, and never looks anywhere else. A worry is one sentence, such as *"is anything I changed now worse?"* A list of places is your hypothesis. If a brief is longer than the last one, ask what each new line takes away from the reader. See the code-review episode in [`evidence.md`](evidence.md).

---

## Five briefs that proved worth keeping

SKILL.md lists the four standing readers and what each is *for*. This section is how to write them. The fifth is not standing. It is a reader written for one review that has been worth reusing.

**The fix auditor.** It gets *last round's fixes and nothing else*, plus the artifact. For each change it answers GONE, STILL THERE or REPLACED BY A NEW PROBLEM, with a quote. Then it gets the two questions that matter: *"Did any of these changes make it worse in a way the change did not intend?"* and *"Is there any change applied in one place and missed in another?"* For each problem it reports, it says whether the fix made it or it was there before the fix. It has never run without finding a fix that did not land, including one the author had written up and never made.

**The disposition auditor.** It gets *every finding and what the author did with it*, plus the triage rules the author claims to follow. It asks which declines do not hold, whether the stated reasons are real or convenient, and whether the author treated the expensive and self-authored items more gently than the checkable ones. Also give it each round's fix commits. When you review a change, give it the version before the change. When you review a whole thing, give it the history behind each commit you named. Have it check every *where it came from* label against them, because a soft *old* takes a finding out of the count. It is the only reader that audits the instrument instead of the artifact. Tell it plainly: *"Finding nothing is a real answer, but it is the answer that should make us trust YOU less rather than the author more."*

**The cost reader.** It gets a measurement taken on the real target, plus the same measurement of a control, such as a blank page, the previous version or a competitor. It asks what the artifact costs the person using it in time, attention, money, battery, processor and quota. Say this plainly in the brief: *"An impression is not evidence here. If it was not measured on the thing the audience actually uses, answer 'unmeasured'. Do not answer 'fine'."* The processor story in [`evidence.md`](evidence.md) is what this reader exists for, and it is also the one it missed.

**The A/B reader.** It gets two unlabelled drafts, and you run *both orderings separately* to control for position. It asks four things: which is better to **read**, which do you **trust**, whether either is over-qualified, and whether either fails to state its own result plainly. It is the only reader that can detect regression, because every other reader sees one version and can only add caution.

**A targeted recall reader.** *It is not standing. It was written for one review, but it is worth reusing.* It gets the artifact, read once, with no going back. Then it answers specific questions from memory about the thing last round's fix was supposed to deliver. *"Your uncertainty is the useful data here, not your ability to find the answer."* This is how you learn whether a fix reached a reader, and not only the file.

---

## Running them

Run them in parallel, each blind to the others. Framing matters more than model tier, but **spread the cast across models anyway and record which model said what.** Readers from one model share its blind spots, so their agreement counts for less than the number suggests.

Brief them like colleagues who have one job and limited time, not like a form to fill in.
