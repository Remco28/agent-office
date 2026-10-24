# Reviewing the review-loop skill itself

Readers play a fresh agent: they read the skill cold, explain it in their own words, and plan a review for a scenario the skill was never written around. The question is whether they would act on it as intended, not whether they can repeat it.

## Round 1 (skill at 7f74e9f)

Readers: A (a school club's order form with discounts) on Sonnet and Haiku; B (a volunteer phone-tree guide) on Sonnet; C (mid-review: round 3 in, own ratings show no HIGH, one fix changes stored records) on Haiku. Reports in round1/.

### What came across (predictions in PREDICTIONS-R1.md)

- **The disposition auditor before stopping: all four.** C would not stop until the auditor had run; B made it required every round. Predicted.
- **Confirm the rules with the human first: all four**, unprompted. Both A readers listed the pricing questions to put to the club before choosing anything themselves (what counts as a sibling, whether discounts stack, rounding) and said those choices go to the human. B wrote the club's real call procedure as rules for the coordinator. Predicted three of four.
- **Peers before a stored-data fix: right in all three readers who used it** (fresh group each pass, no code, stop and go to the human if it grows). Predicted one would garble it: wrong.
- **No reader carried code-review ideas into the guide**: B used comprehension readers and tiers, no severity. Predicted one would: wrong.
- **Run it yourself**: all four (B: a live drill with a real volunteer).
- **The skill is long, with no way to scale it down: all four.** Predicted "someone".

### Where they converged (tier 1)

| # | Finding | Readers |
|---|---|---|
| 1 | Two stop rules that don't agree: SKILL.md's "two rounds with zero tier-1" and the code-review profile's "no HIGH after the audit". Which governs for code? | A-Sonnet, A-Haiku, C |
| 2 | How tiers and severity combine is unstated: is a tier-1 MEDIUM fixed? | A-Haiku, C |
| 3 | The disposition auditor is listed among readers "from round two" but required "every round" | A-Haiku, B (read it as round two) |
| 4 | No guidance for a small artifact: which parts are non-negotiable, how small a cast can be | all four |
| 5 | The steps that matter most (confirm the rules, the owner decides, the auditor) sit inside long prose; a short list at the top would help | A-Sonnet, B |
| 6 | An artifact can need two profiles (a web app with money: the task profile and the code profile), and the skill doesn't say how to combine them | A-Sonnet, A-Haiku |
| 7 | "Read evidence.md once, not before your first round" reads as an instruction not to; three of four read it first anyway | A-Sonnet, A-Haiku |
| 8 | No skeleton for LEDGER.md, so the required fields are easy to drop | B, C |

Single readers, not acted on: the peer step's threshold ("stored or computed") and group sizes (B, C); C read *the owner decides* as covering every stored-data fix, which is broader than meant; no guidance when only one model is available (B).

**Believed, and wrong:** that the peer step was the hardest to explain. It came across intact; the stop rules, which I thought were settled, were the confusion.
