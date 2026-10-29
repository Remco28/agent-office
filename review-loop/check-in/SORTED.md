# What the peers found, and what was done

Critic: Grok grok-4.7 (plan in hand). Blind solver: Codex gpt-6-luna (problem
only). Use test: mine (USE-TEST.md). Skill and solver copy checksums unchanged
after both runs.

## Taken

| # | Finding | Who | Change to the plan |
|---|---|---|---|
| 1 | A profile's stop rule still "decides" and still opens the next round; the override sat only in a parenthetical | Grok HIGH; Codex put it in *When to stop* | The override goes in *When to stop* ("but not the check-in") and the code profile's stop rule; the parenthetical goes. A yes runs to the next check-in |
| 2 | "Stop and wait" placed mid-sorting: unclear whether the round's fixes come before or after; fixing first defeats "step back" | Grok HIGH | The check-in comes after sorting and the disposition audit, before the round's fixes |
| 3 | Branches overlap (converging and "serious from a fix" can both hold); "serious" undefined; whole-thing reviews have no *new*, so an untraced HIGH matched nothing | Grok HIGH; Codex the mixed case | One proposal, the first that fits. Serious = a verified HIGH that is not *old* (the human page's "serious" already means HIGH). Order: serious from a fix, then other serious (covers *new*, *untraced* and a traced commit alike), then the direction test |
| 4 | The rate-it-lower question asked at every check-in, even for findings in real use | Grok MED | Asked only when the findings are in setups not in use |
| 5 | The answer to go on / stop is not recorded, only the stakes | Grok | "Record the answer, and any new stakes" |
| 6 | Converging should offer the stakes item or stopping, not "propose stopping" | Use test (round 4's J1, a HIGH in the original change); Grok the same | Taken |
| 7 | evidence.md's "Hence ... the stakes check every two or three rounds" describes the skill, not the past | Codex | Renamed in place ("the check-in every third round"); the history around it unchanged |

## Declined

| Finding | Who | Why |
|---|---|---|
| Step back on any HIGH **or MEDIUM** from a fix | Grok | Then nearly every converging round (MEDIUMs, rarer, mostly from fixes: agent-office round 3) would propose stepping back, and the direction test's converging case would never be reached. Frank's word was "serious"; on the human page that is HIGH |
| A separate sentence in the code profile's rating rules and the opening stakes line reworded | Codex | Plain renames carry it (stakes check to check-in) |
| "If none remain, use the profile's stop rule for the recommendation" | Codex | The converging branch already proposes stopping; the profile still decides when a review is clean |

The declines go to the fix auditor with the diff (light review, step 5).
