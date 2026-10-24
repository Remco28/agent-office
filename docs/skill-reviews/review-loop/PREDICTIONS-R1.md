# Predictions for the review-loop skill's own review, round 1 (written before it ran)

Skill at 7f74e9f. Success question: **after one read of the skill, does a fresh agent plan a review that does what the skill intends, in its own words?** Four readers (two Sonnet, two Haiku), each with one scenario, asked to explain the skill without quoting it and plan the first rounds. None has seen this conversation.

A correct plan for each scenario contains:

| | A (code review: a school club's online order form with prices and discounts) | B (a volunteer guide: how to run the club's phone tree) | C (mid-loop: round 3 of a code review, own ratings show no HIGH, one fix changes how records are stored) |
|---|---|---|---|
| Mechanical checks first (step 0) | yes: tests, a script against the API | yes, if the guide has checkable claims | — |
| A success question about the user's task | yes | yes | — |
| The rules written down and confirmed with the human before readers | **yes: pricing and discounts** | **yes: the club's actual call procedure** | — |
| Profile: code-review / copy the closest and write house rules | code-review | copy closest, own house rules | code-review |
| Cast | a whole-code reviewer, specialists by lens, a rules reviewer, a fix auditor from round 2 | comprehension readers across the audience's range, a fix auditor from round 2 | — |
| Readers may run it | yes | (not applicable) | — |
| Disposition auditor every round before deciding to stop | yes | yes | **yes: not stopping on its own ratings** |
| Triage by tiers; severity beside tiers (code) | yes | tiers | — |
| Prediction file before each round | yes | yes | yes |
| A choice that changes what users pay or get goes to the human | **yes: a discount edge case or default** | maybe | — |
| Peers before a fix that changes stored data; fresh group each pass; stop and go to the human if the plan grows | — | — | **yes** |
| Run it themselves before the next round | yes | walk the procedure | yes |
| Stop rule judged on audited ratings | yes | yes | yes |

Shape of the answers:
- **All four mention the disposition auditor as required before stopping.** That's the most-repeated new rule; if a reader misses it, the wording isn't working.
- **At least three of four mention confirming the rules with the human** without being prompted by the scenario's wording.
- **The peer step is the most likely to come back garbled**: a reader may reuse the same peers, count passes instead of watching the plan's size, or let peers write code. Prediction: one of the four gets it partly wrong.
- **At least one reader over-applies the code-review profile to the guide** (scenario B), or carries a code-only idea (severity HIGH/MEDIUM/LOW) into a document review.
- **Someone will find the skill long** and say which part they'd skip; the most likely is evidence.md.
