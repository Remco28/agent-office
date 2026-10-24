I read SKILL.md, briefs.md and profiles/code-review.md. I skimmed nothing else. evidence.md, the other profiles and _template.md were not read. The review-loop/ ledger folder in this repo does not exist (ls returned nothing).

**1. What it is and how it works**

The skill is for reviewing work you made by handing it to fresh agents who have never seen it, then being strict about which of their answers you believe. It only runs when the user asks. If the work looks important, you ask first, then size the run by judgment.

It is good at coherence (does the thing contradict itself or its source?) and comprehension (does a stranger get it?). It is blind to merit, so a human always reviews at the end.

The procedure, in order:
- **Step 0:** run every check you can run yourself first, such as tests, type checks and scripts that drive the tool. Whatever these find is verified. Re-run them each round.
- **Step 1:** write one success sentence that a reader must satisfy. If you can't write it, you don't know what the work is for. Then write down any outside rules the work applies and have the person who knows them confirm them. Readers only check the work against your idea of the rules.
- **Step 2:** pick a profile, which sets the cast, house rules, scope and sometimes the stop rule. A profile's rules override SKILL.md. If none fits, copy the template.
- **Step 3:** freeze a version and give readers the artifact as its audience meets it. For code that means the commit plus a copy they can run. Run them in parallel and blind to each other, across models where possible, and record the model beside each finding. Brief them in six parts: who they are, the materials by absolute path, the quoted goal, numbered questions, the "don't hunt for problems" line, and known quirks. Keep briefs short and avoid handing over a map of where to look.
- **Step 4:** sort findings into tiers:
  - Tier 1 is verified: two or more independent readers, or checkable against the artifact. Fix it.
  - Tier 2 is one reader plus an outside source. A second agent tries to kill the finding, and if it survives it becomes tier 1.
  - Tier 3 is taste. Collect it for the human and don't act on it.
  - Tier 0 is caused by how I showed the thing. Reject it.
  - Record how each finding was checked.
- **Step 5:**
  - Fix tier 1 only.
  - Read the tier-3 pile for complaints like "too long" or "over-hedged", the only evidence the loop produces against itself.
  - Prove each fix by counting the old wording across the whole thing before and after, then actually use the tool.
  - Anything that changes what users get goes to the human.
  - Fixes that change stored or computed data go through a peer-critique process.
  - Write predictions in the ledger before the next round.
- **Cast:** comprehension readers, specialists and adversaries. The standing readers are:
  - a disposition auditor, every round, never retired
  - a fix auditor, from round 2
  - a cost reader and an A/B reader, only when relevant
- **Ledger:** review-loop/LEDGER.md, with an explicit "Believed, and wrong" entry each round and a closing "Mistakes the next author will make" list.

**2. My situation: bank-statement importer CLI, round 2 just back, one MEDIUM already fixed, no HIGH**

This is a code review, so I assume the code-review profile, whose stop rule replaces the generic one. I don't see anything saying whether I should ask the user about a second profile, such as one for how people use the tool. I'd confirm that with the user.

1. **Sort the reports myself.** Give each finding a tier and my own severity next to the reader's, with a reason wherever we differ. I follow the rating rules: a past rating is a precedent, "rare timing" is MEDIUM and never LOW, and "visible" or "recoverable" alone never makes something LOW. Every finding needs a concrete failure scenario, and any without one gets returned to the reader.
2. **Check the MEDIUM.** It counts as fixed only if it was verified (tier 1, or tier 2 after a kill attempt). I record how it was checked (reproduced, read in source, or taken on the reader's word). Taking it on the reader's word is the weakest form.
3. **Deal with the other findings.**
   - Every verified LOW is fixed, or declined with a written reason.
   - Tier 3 goes into the pile for the human.
   - Any reason I gave for not fixing something is itself a claim, so I check it against the code.
4. **Prove the MEDIUM fix.** I grep for the old behavior everywhere, re-run the step-0 checks and the importer driver script, and run the tool on a sample statement. Because it is a bank importer, this includes duplicate imports, amounts and signs, and dates. If the fix changes what is stored or computed, it goes through the peer-critique process first. If it involved a choice that changes outcomes, such as how duplicates are treated, I ask the human in plain words with a recommendation.
5. **Run the disposition auditor.** I give it every finding, my ratings, what I did, and the triage rules. This step is mandatory, and it comes after sorting and before any stop decision.
6. **Fix whatever the auditor says was rated too soft, and re-sort.** This could turn up a HIGH. If so, I don't stop.
7. **Decide whether to stop.** The code-review profile says to stop when a round has no HIGH, after the auditor has checked the ratings. That is probably satisfied, since nobody rated HIGH, provided the auditor agrees. But the profile also says a round whose HIGHs were all fixed still needs another round after it, because the fixes are new code. No HIGH was found this round, so that clause shouldn't apply. The MEDIUM fix is new code, but the profile only exempts HIGH fixes explicitly, so I'd flag that ambiguity to the user. It would be safe to run a fix auditor on it. Round 2 is also the first round with a fix auditor, and I'm not sure whether it ran. If it didn't, I'd run it before stopping.
8. **If stopping:** update the ledger. That means this round's results against my predictions, "Believed, and wrong" (or "none"), and the mistakes list. I save the reader reports and name which of coherence, comprehension and merit I'm reporting on. Then I hand it to the human for review, with the tier-3 pile and any declined LOWs.
9. **If not stopping:** write predictions before the next round.

**3. Unclear, contradictory or likely to skip**

- **No order for the ledger.** The ledger shape puts "Predictions (written before the round)" in the round entry, but the text says to write predictions at the end of step 5 for the next round. The first round has no earlier step 5 to write them in. The ledger template also never says to write the success question and the confirmed rules before round 1 begins.
- **Unclear who counts as "independent."** "Different questions, personas and models" is clear. But a code-review cast usually has one model family, and the skill says to treat that agreement as tier 2. In practice most code findings would then need a kill attempt, which is heavy. The skill doesn't say whether a reproduced finding already counts as tier 1 without needing a second reader. I read "checkable against the artifact" as yes.
- **Stop rule and fix rule can contradict each other.** The code-review stop rule is "stop when a round has no HIGH." SKILL.md says to fix every verified HIGH and MEDIUM. The MEDIUM fix here is new code that no auditor has yet reviewed, yet the profile lets me stop. Stopping with unverified new code is likely to be skipped past, and the profile seems to want it caught only for HIGH fixes.
- **Ratings conflict.** "Only in a rare timing is MEDIUM" and "wrong, lost data, without anyone noticing is HIGH" overlap for a rare bug that silently corrupts data. The skill doesn't say which wins. For a bank importer, rare-but-silent wrong amounts is the likely case. I would rate it HIGH, but I'd want the auditor to confirm.
- **Brief growth.** "Briefs grow round by round" in SKILL.md directly conflicts with the warning in briefs.md that a growing brief hands readers your map. The briefs.md version is the better guide.
- **The ledger folder is created without anyone being told to.** The skill says "In the project, in review-loop/". That means in the importer repo, not here. This is easy to get wrong.
- **Easy to skip:** the human-confirmed rules (for an importer: sign conventions, duplicate handling, how dates are read), the record of which model said what, and the "count old wording, then count again" proof. Round 2 readers also should be told what has already been fixed, otherwise they re-report it.
- **Draft status.** The code-review profile says it's a draft from one other project, so it may not fit a CLI importer well. For example, it assumes users and a server, and the "two of them at once" clause in its success question may not apply to a single-user tool.
