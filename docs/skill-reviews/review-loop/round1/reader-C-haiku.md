REPORT: review-loop skill (read-only; nothing changed)

Read: skills/review-loop/SKILL.md, profiles/code-review.md, briefs.md, evidence.md. Did not read the other profiles, which do not apply to code.

1. WHAT IT IS AND HOW IT WORKS

It is a loop for checking a made artifact against its own stated goal before a human reviews it. You give it to cheap reader agents who have never seen it, then judge their answers with discipline. It measures two things well, coherence (does it contradict itself or its source) and comprehension (does a stranger get what was intended). It is blind to merit: whether it was worth making or is right. Only a human can judge that, and that review is never optional.

The steps: (0) mechanically check what can be checked against a source of truth (tests, scripts, the compiler), since those findings need no reader to confirm them. (1) write one success question the reader must satisfy, and confirm any rules the artifact applies with the person who knows them. (2) pick or write a profile, which holds the cast, materials, house rules and out-of-scope list. (3) prepare, freeze, and run readers in parallel and blind, ideally across more than one model, with a six-part brief. (4) triage by confidence: tier 1 (two independent readers, or checkable against the artifact) is fixed; tier 2 (one reader, checkable outside) is verified and then given to a second agent whose only job is to kill it; tier 3 (taste) is surfaced to the human and not acted on; tier 0 is an artifact of the harness and is rejected. (5) fix tier 1 only, prove each fix by using the thing the way its audience will, and predict the next round in PREDICTIONS-R<n>.md before running it. A disposition auditor is required every round before any decision to stop. Records go in the project's review/loop/ folder (LEDGER.md and the predictions), not in the skill.

The code-review profile adapts this to code. Success question: in the ways users really use it, including two at once, does anyone get a wrong result or lose their work? Readers must run the app, not just read it. Each finding needs a concrete failure scenario. Severity (HIGH/MEDIUM/LOW) is a second axis beside the tiers, and the reviewer's rating appears next to ours. The cast is a whole-code reviewer every round, specialists, a rules reviewer if the rules are written down, a fix auditor from round 2, and a disposition auditor every round.

2. MY SITUATION: ROUND 3 IN, NO HIGH, ONE MEDIUM NEEDS A STORAGE CHANGE

Plan, in order:

a. Build the round table first: each finding, the reviewer's rating, my rating and reason where they differ, how it was checked (reproduced, read in source, or taken on the reader's word), and the disposition. Save each reviewer report beside it.

b. Re-test every rating against the scale's words before trusting it. The MEDIUM is the one to look hardest at. If its failure is ordinary use that loses or overwrites someone's data, the scale says HIGH, and I must not have rated it down. If it is a rare timing, MEDIUM is correct and I must not rate it LOW because it is "visible" or "recoverable". Check every reason I gave against the code, because a false reason is the most common thing the auditor catches.

c. Triage. Anything reproduced by the flow script or unit tests is tier 1. Anything that is one reader's claim gets checked against the source, then a second agent gets the finding and the source with the instruction to kill it. Record the result either way.

d. Run the disposition auditor now, as a fresh agent. Give it the findings, my ratings and reasons, the triage rules and the severity rating rules. Do not give it my conclusion. It answers whether the ratings and declines hold up. I may not decide to stop before it reports. Also check whether the fix auditor has run on round 2's fixes; for code it is required.

e. Check the rules before designing anything. If the storage rules (who may overwrite what, and when a record counts as saved) were never written down and confirmed with the human, the rules reviewer and the fix both rest on my unconfirmed idea of the app. Write the rules in plain words, one per line, and get them confirmed.

f. Decide the storage fix with peers, not alone. Write the problem plainly, with no solution. Give the problem to one or two blind solvers and a plan to one or two critics, with no code. Take the best plan, improve it, and give it to a fresh group for the next pass. Watch the direction: if each pass adds tables, state or code paths, it is a design problem, so stop and take it to the human. If each pass shrinks it, build it.

g. Because the fix changes what is stored and so what users get, it is an owner decision. Put it to the human in numbered plain points, each saying what the user will see or do differently, with my recommendation. Do not build it before the answer.

h. Build it in one place: both code paths that write the record call one function. Write the reproduction as a flow-script assertion first and watch it fail on the current code. Then run the real app copy, not only the unit tests, and make the fix pass. Confirm the old behaviour is gone across the tree, not only where I edited.

i. Write PREDICTIONS-R4.md before running round 4. Per fix: will the reproduction now pass, and what could break next to it. Per round: the expected tier-1 count and what kind of findings should come back.

j. Update LEDGER.md: the round 3 row, the reviewer models for each reader, and the required "Believed, and wrong:" field, written as the claim I held, quoted (or "none this round" written out). End the ledger with the mistakes the next author is likely to make, specific enough that the human would recognise them.

k. Round 4: fresh briefs, not the round 3 briefs with additions. The whole-code reviewer runs the app copy and is not told to stay read-only. Include a fix auditor on the round 3 diff, and a disposition auditor after triage.

Stop decision: I do not stop. The MEDIUM fix is unbuilt and unverified, a storage change is new code that needs its own round, the disposition audit has not run, and the owner has not decided. The profile's rule (stop when a round has no HIGH after the auditor checks) is satisfied only on paper here. I would stop only when the fix is in and verified, the round's ratings have passed the auditor, and the next round produces no HIGH. Even then the result goes to the human, because the loop cannot judge merit.

3. UNCLEAR, CONTRADICTORY, OR LIKELY TO BE SKIPPED

- Stop rules conflict. SKILL.md says stop after two consecutive rounds with zero tier-1 findings, or when everything left is tier 3. The code profile says stop when a round has no HIGH after the auditor. These can disagree: a round with a MEDIUM tier-1 finding passes the profile and fails SKILL. The file never says which governs for code. I took the stricter reading.
- Tiers and severity are two axes, but the rules do not say how they combine. Does a tier-1 MEDIUM get fixed, or only a HIGH? Does a tier-3 HIGH get surfaced? SKILL.md says fix tier 1 only; the profile's "fix every finding with a scenario" is not stated.
- "Storage or computation changes" has no threshold. Is a new column a storage change? A changed validation rule? Step 5 requires the peer loop for it, but a model applying this will guess.
- The peer loop assumes a cast I can call cheaply. It does not say how many passes, or what to do when a "fresh group" is the same model with the same blind spots. The independence concern in evidence.md applies here and is not connected to this step.
- The code profile's stop rule ignores the rules reviewer, the Believed-and-wrong field and the predictions. These are required by SKILL.md but the profile does not mention them, so they are easy to drop.
- The profile says every finding gets a rating from the reviewer and from us, but the disposition auditor is the only check on our side. Nothing says what to do if the auditor and I disagree after a second pass.
- "Prove each fix, do not describe it" says to use the thing the way its audience will, but for code that means running the app flows. The profile says to grow a flow script in the repo each round, without saying which repo or who owns it.
- The "Believed, and wrong" and "predict the next author's mistakes" rules are the easiest to skip because they feel like paperwork. SKILL.md says the ledger is the only record a future agent can check, so the skip costs the most. No template is given for LEDGER.md.
- The disposition auditor is required before stopping, but nothing says what happens if the auditor is skipped because the round looks clean. The rule is only as strong as the agent's discipline, and the evidence file says that discipline has failed before.
- The skill reads as heavy for a small web app. It is written around prose and a single generic reviewer; the code profile has been used on one project. The method note says not to add rules on one round's evidence, which I would respect here by reporting the conflicts rather than fixing them myself.
- Nothing in the skill tells the agent to confirm with the human before spawning a reviewer cast, or how much it costs. The cost reader exists for the user's time and money, but no code profile reader is assigned to cost.
