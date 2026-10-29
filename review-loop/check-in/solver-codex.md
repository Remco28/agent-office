# Blind solver: Codex gpt-6-luna, -s read-only, given PROBLEM.md and a frozen copy of skills/review-loop (no plan). Copy checksums unchanged.

## 1. Procedure edits

### `skills/review-loop/SKILL.md` — opening, stakes paragraph

Replace:

> **The stakes are revisited, not set once** (the stakes check, step 4).

With:

> **The stakes are revisited at each human check-in** (step 4).

### `skills/review-loop/SKILL.md` — Step 4, replace both existing check paragraphs

Replace the paragraphs beginning “The stakes check” and “The direction test” with:

> **The human check-in, after rounds 3, 6, 9, ...** Put one item in the round's decision box. Include any proposed stakes change and its evidence; compare serious findings that are not *old* with the previous round for severity, frequency and *where it came from*, with counts; and recommend stopping or another round. If serious findings still come mostly *from a fix*, propose stepping back to rethink the approach, as in the peer step, rather than another round of fixes. If serious findings are still *new*, propose another round, perhaps with different readers. If both sources remain among serious findings, give their counts and recommend a round that checks both. If none remain, use the profile's stop rule for your recommendation. **After round 3, stop and wait for the human's decision; run further rounds only if they ask.** Record the decision and any agreed stakes in the ledger.

### `skills/review-loop/SKILL.md` — “When to stop”

Replace the opening paragraph of the section with:

> Judge stop rules on ratings the disposition auditor has checked, never on your own. A profile decides whether its review is finished; it cannot waive the human check-in after round 3 or the wait for the human's go-ahead before any later round. *Old* findings count toward none of them (step 4); a block ends the review, and is not a clean stop.

### `skills/review-loop/profiles/code-review.md` — rating rules

Replace:

> Only from the stakes check on: until the human has agreed, rate it in full and propose the step down there.

With:

> Only from the human check-in on: until the human has agreed, rate it in full and propose the step down there.

### `skills/review-loop/profiles/code-review.md` — “When to stop”

Append this sentence to the existing stop-rule paragraph:

> At round 3 and every third round after it, wait for the human's go-ahead before another round (SKILL.md step 4).

The Step 4 replacement is 41 words shorter. Counting the other procedure text changes above, the procedure loses **2 words overall**.

## 2. Other places to update

These references should use the merged check-in terminology so the materials stay consistent.

### `skills/review-loop/human-page.md` — “What it must show,” item 1

Change:

> updated at each stakes check

To:

> updated at each human check-in

### `skills/review-loop/evidence.md` — the paragraph beginning “The human's diagnosis”

Replace:

> Hence the stakes drafted from how the thing is really used, the *whom it reaches* split, the stakes check every two or three rounds, the direction test, and in the code profile one step down for a setup not in use.

With:

> Hence the stakes drafted from how the thing is really used, the *whom it reaches* split, the third-round human check-in combining the stakes proposal with direction evidence, and in the code profile one step down for a setup not in use.

## 3. Review situations this wording handles

- **After round 3, or another scheduled check-in:** the agent must stop and wait; it cannot treat the human’s eventual response as optional or continue automatically.
- **The review seems to be improving:** the check-in still happens on schedule. It reports the comparison and lets the profile stop rule inform the recommendation.
- **Serious findings come from fixes, new findings, or both:** the wording gives a proposal for each source pattern, including a mixed case with counts. If no serious findings remain, the profile stop rule guides the recommendation.
- **A code review’s rule suggests another round:** the profile explicitly subjects that round to the human’s go-ahead, so it cannot override the pause.
