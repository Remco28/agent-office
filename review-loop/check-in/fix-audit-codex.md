# Fix auditor: Codex gpt-6-luna, -s read-only, fresh run, on git diff f9ffd37 1d1c43e -- skills/ with PLAN.md, SORTED.md, USE-TEST.md. Skill checksums unchanged.

## Taken

| # | Status | Quote from the procedure |
|---|---|---|
| 1 | **LANDED WITH A NEW PROBLEM** | “A profile's stop rule replaces these for its genre, but not the check-in (step 4).” The check-in also says “a yes runs to the next check-in.” The override is present, but the check-in’s recommendation can conflict with a profile’s clean-stop rule; see below. |
| 2 | **LANDED** | “It comes after the round's sorting and disposition audit, before its fixes.” |
| 3 | **LANDED** | “Serious means a verified HIGH that is not *old*”; “Other serious findings” covers serious findings that are not from a fix, including untraced findings. |
| 4 | **LANDED** | The lower-rating proposal is offered “for findings in setups not in use.” |
| 5 | **LANDED** | “Record the answer, and any new stakes, in the ledger.” |
| 6 | **LANDED** | For converging reviews, “offer stopping, or, for findings in setups not in use” propose the lower rating. |
| 7 | **LANDED** | Evidence now refers to “the check-in every third round,” while retaining the prior two-to-three-round stakes check as history. |

## Problem found

**MEDIUM — A third-round check-in can recommend another round when the code profile says to stop. Introduced by this change.**

Concrete case: a code review reaches round 3, has no verified non-old HIGH, and needs no HIGH or MEDIUM fixes. The code profile says to stop after that round. But if the direction test is false—or cannot be evaluated because there are no findings—the new check-in says, “If not, propose fixing and another round.” The procedure does not say which instruction governs that recommendation. An agent could ask the human to authorize an unnecessary round despite meeting the profile’s stop rule.

I would make the check-in recommendation respect the profile’s clean-stop result: when its stop condition is met, offer stopping; the human can still decide whether to continue. The conflict does not exist in the prior text: the old direction test applied only to findings and did not prescribe another round when its conditions failed.

## Rounds 1–7 under the new text

The exact path depends on findings and the human’s answers:

- **Rounds 1 and 2:** Sort findings and run the disposition audit. There is no check-in yet. The code profile can stop the review after either round if its stop condition is met; otherwise the review proceeds.
- **Round 3:** If the review is still running, the fix auditor covers the prior round’s fixes, then the findings are sorted and disposition-audited. The check-in happens before round 3’s fixes. A serious finding from a fix triggers a proposal to rethink the approach; another serious finding triggers a proposal to fix it and run another round. Otherwise, the direction test applies.
- **At that round-3 check-in:** If the review meets the code profile’s clean-stop condition but the direction test is false or unevaluable, the conflicting recommendations above leave the agent without a clear rule.
- **Rounds 4 and 5:** They run only if the human authorizes continuation at the check-in. The code profile can still stop the review after either round if its condition is met.
- **Round 6:** If the review is still running, the same check-in sequence repeats.
- **Round 7:** It runs only if the human authorizes continuation after round 6. The code profile can again stop the review after that round.

I don’t see a separate problem with the sequencing of the auditors: the disposition auditor runs before the check-in, and the check-in runs before fixes. The light review has no rounds, so this new check-in does not apply to it.

## Declined

I **agree** with each decline:

- **Step back on any HIGH or MEDIUM finding from a fix:** Restricting that response to serious findings fits the settled decision. Treating every MEDIUM from a fix as grounds to rethink could preempt the convergence branch.
- **Add a separate code-profile sentence and reword the opening stakes line:** The code profile now explicitly says the check-in still applies, and the opening line uses the new term.
- **Add “If none remain, use the profile’s stop rule”:** The converging branch already offers stopping. This omission does expose the specific conflict identified above when that branch does not apply; I’d resolve it by aligning the check-in recommendation with a profile’s clean-stop result, rather than adding that sentence in isolation.

## Decision 4: keep the edits light

I don’t see an unnecessary rule added to the procedure. The branch order, definition of “serious,” timing, and recorded answer address the settled decisions. The one additional clarification I’d make is the narrow profile-stop case described above.
