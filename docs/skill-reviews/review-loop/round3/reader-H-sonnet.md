I read SKILL.md, briefs.md, profiles/code-review.md and the start of evidence.md. I skimmed the other profiles' existence only.

**1. What the skill is and how it works**

It is a way to review something you made by handing it to fresh agents who have never seen it, then being strict about which of their answers you believe. It is good at coherence (does the thing contradict itself or its source?) and comprehension (does a stranger get it?). It is blind to merit, so a human always reviews at the end. Only run it when the user asks. If the work looks important, ask first and give a rough size in readers and rounds.

The flow:
- **Step 0:** run every mechanical check yourself first (tests, scripts that drive the app, type checks) and fix what they find.
- **Step 1:** write one success sentence about the reader's task. If the work applies outside rules, write them out and have the person who knows confirm them.
- **Step 2:** pick a profile. A profile sets the cast, house rules and sometimes a stop rule, and it overrides SKILL.md for its genre.
- **Step 3:** freeze a commit. Run readers in parallel and blind to each other, across different models, and record which model said what. Each gets a short six-part brief. Ask "did it work for you?" rather than "what's wrong?". Fault-hunting goes to named specialists.
- **Step 4:** sort the findings into tiers:
  - Tier 1: two or more independent readers agree, or you reproduced it. Fix it.
  - Tier 2: one reader. Give a second agent the finding and tell it to try to kill it.
  - Tier 3: taste. Collect it for the human.
  - Tier 0: caused by how you showed the thing. Reject it.
  - Code adds HIGH/MEDIUM/LOW. Verify first, then fix every verified HIGH and MEDIUM. A verified LOW is fixed or declined with the reason written down.
- **Step 5:** fix only what is verified. Prove each fix by counting old wording before and after and by using the thing for real. Put outcome-changing choices to the human. Write predictions in the ledger before the next round.
- **Ledger and standing readers:**
  - The ledger lives in `review-loop/LEDGER.md`. Each round records "Believed, and wrong".
  - The disposition auditor runs every round and checks my ratings, because my ratings drift soft.
  - The fix auditor runs from round 2 and checks last round's fixes.
- **Stop:** a profile's stop rule wins. Then hand it to the human.

**2. My situation (food bank inventory app, end of round 4)**

1. Check the MEDIUM. Two readers agreeing is tier 1 only if they are really independent. If both are the same model, I treat it as closer to tier 2. I have fixed it, so I confirm it was reproduced or read in the source, and I record how it was checked.
2. For the LOW I decline, I write the concrete reason in the ledger. A reason is itself a claim. I check it against the code and against past ratings of the same mechanism.
3. Run the disposition auditor now, before any decision to stop. It gets all findings, my ratings, what I did, and the rating rules. I check it for these traps:
   - "Rare timing only" must be MEDIUM.
   - "Visible" or "recoverable" alone does not make something LOW.
   - The same mechanism gets the same rating as before.
   If it downgrades or upgrades anything, I act on that.
4. Prove the MEDIUM fix. I add or extend a script that exercises it, rerun the step 0 checks (unit tests, flow script, type check), and then use the app the way a food bank volunteer would, including two people at once.
5. Fill in the ledger for round 4: the findings table with how each was checked, results against predictions, and "Believed, and wrong". Then write predictions for round 5: what readers should now see, and roughly how many verified findings of what kind.
6. If the fix changed stored or computed data, I think it through with critics and blind solvers first. If it changed a user-visible rule (for example an inventory count or a threshold), I take it to Frank in plain words.
7. Freeze the new commit.

**Decision:** I do not stop. Literally, the code stop rule ("no HIGH, after the auditor checks ratings") is met. But the same paragraph says a round that ended with HIGH or MEDIUM fixes still has a round after it, with a fix auditor on those fixes, because the fixes are new code. So round 5 runs: whole-code reader, the fix auditor on the round-4 diff, the disposition auditor again, and specialists and a rules reader as the profile says. I would stop after round 5 if it has no HIGH and ends with no new MEDIUM fixes, with the auditor having checked the ratings. I would then hand it to Frank with an honest statement of what the loop covered: coherence and comprehension, not merit.

**3. Brief for the whole-code reader (round 5)**

Paths are placeholders, since I wasn't given the real ones.

```
You are an experienced developer seeing this code for the first time. You have no history with it.

Materials:
- The repository, frozen at commit <HASH>: /abs/path/to/foodbank-inventory
- A copy you may run and break freely (local server, test database, scratch folder): /abs/path/to/foodbank-inventory-sandbox, started with <command>.
- Settled points, so you don't re-report them: /abs/path/to/foodbank-inventory/review-loop/NOTES.md

What it is for: a small inventory app for a food bank. Volunteers use it on shared devices, sometimes several at once, to record what comes in and goes out. Goal, quoted: "In the ways its users really use it, including two of them at once, does the code give anyone a wrong result or lose their work?"

Intended, not findings: <e.g. anyone may edit anything>.

Questions:
1. Review this whole codebase.
2. For each finding, give the steps, the state and the wrong outcome, and say how you confirmed it (ran it or read it). A finding without a concrete failure scenario will be returned.
3. Rate each finding using this scale and give a reason for the rating:
   HIGH: in realistic use, a wrong result, lost or corrupted data, or an action let through that should be blocked, without anyone noticing.
   MEDIUM: wrong only in a rare timing or unusual sequence, or visibly wrong and recoverable.
   LOW: abuse by someone already trusted, edge-case input, or an annoyance.
4. Report back with your findings, their ratings, and your model name.

Do not hunt for problems to fill space. "Nothing wrong" is a real and useful answer. Out of scope: style, naming, refactoring, test-coverage suggestions.

Known quirks of the materials: <e.g. the sandbox is seeded with sample data>.
```

**4. Unclear, contradictory or likely to skip**

- **Stop rule against its own next sentence.** "Stop when a round has no HIGH" followed by "a MEDIUM-fix round still has a round after it" reads as a contradiction on first pass. It is a precedence rule, and a hurried agent would stop at the first sentence.
- **When the fix auditor and disposition auditor run in a non-stopping round.** The disposition auditor runs "after sorting, before any decision to stop", but it is also needed to rate the fixes. The wording doesn't say whether the disposition auditor must be rerun if I revise ratings after its pass.
- **Independence of the two readers.** "Independent means different questions, personas and models" is easy to wave through. The skill never says what to do when the reader pool is all one model (for example, all Claude subagents). It only says to treat agreement as weaker.
- **Brief vs. map.** The brief for the whole-code reader should carry no hints about where I changed code. That is consistent, but it tempts me to add "check the MEDIUM fix area". The fix auditor covers that instead, and the skill does not say so in the brief section.
- **Sizing is vague.** "Size it with judgment" and "ask the user with a rough size" give no number for a small app. The cast floor (whole-code reader plus specialists plus rules reader plus two auditors) can feel heavy for a small app. That's likely to be skipped or over-scoped.
- **Step 1 rules confirmation** is likely to be skipped for a food bank app. The rules for stock counts and distribution limits should come from the food bank staff, and that person may not be reachable. The skill says to mark rules unconfirmed in the ledger and tell the user, which is easy to forget.
- **"Believed, and wrong", the predictions and the closing "Mistakes the next author will make" list** are required writing that is easy to skip under time pressure. The predictions in particular must be written before the results, but nothing enforces that.
- **Profile caveats.** The code profile calls itself "a draft from one project", and evidence.md says all the specifics are hypotheses. The skill states that, but it then also says rules are binding, so how strictly to follow them is unclear.
- **"Tier 1 with two independent readers"** and **"fix every verified MEDIUM"** can conflict when the readers are same-model. I resolved this by reproducing the issue myself, but the skill doesn't state that explicitly as the way out.
