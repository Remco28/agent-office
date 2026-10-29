# Critic: Codex gpt-6-luna, -s read-only, read PLAN.md and the skill in the repo. Report as printed (after the last 'codex' line).

## Findings

1. **HIGH — The whole-thing rule is not carried through.**  
   **What’s wrong:** Decision 3 says a review of a whole codebase or manual has no *old* versus *new* labels; when a finding can be traced to a commit, record that commit. The planned edit never says this. A new *From* column with only *new*, *old*, and *from a fix* leaves agents without a valid label or recording rule for a whole-thing review.  
   **Where it bites:** An agent reviews an entire manual, finds a defect in a paragraph added in commit `abc123`, and cannot tell whether to call it *new* or *old*. It may label it *new* simply because the paragraph is recent, contrary to the human’s decision.  
   **Instead:** State the two review modes explicitly. For a change review, use *new*, *old*, or *from a fix*. For a whole-thing review, do not use old/new; record the commit when traceable, including the commit for a prior review fix.

2. **HIGH — The blocking path has no workable audit sequence, especially in a light review.**  
   **What’s wrong:** The plan says a blocking old bug ends the review and goes to the human, but also says the light review’s fix auditor checks the blocking reason. In the existing procedure, the fix auditor runs on the diff after the build; a blocking bug can stop the review before there is a diff or a fix auditor run. The plan does not explain how that auditor gets used in this case.  
   **Where it bites:** A critic finds an old defect that makes the requested change impossible to check. The agent stops and reports to the human, but the prescribed second opinion on the blocking reason has not happened—and the planned auditor may have no fix diff to inspect.  
   **Instead:** Specify the blocking sequence and auditor brief: what evidence the author supplies, which auditor checks it, and whether review pauses for that check before it goes to the human. Make the light-review path explicit.

3. **HIGH — “Fix every verified HIGH and MEDIUM” still conflicts with “old bugs are not fixed inside the review.”**  
   **What’s wrong:** The plan adds that old findings are filed, but does not amend the general fix rule or explicitly say old findings are an exception to it. It also says old findings “do not count toward a stop” without saying how source labels interact with tiers in each stop condition.  
   **Where it bites:** An agent verifies an old HIGH as tier 1. Step 4 tells it to fix verified HIGH findings; the new paragraph says to file old ones; the general stop rules count tier-1 findings, while the new line says old ones do not count. An agent can follow one instruction and violate another without noticing.  
   **Instead:** Add the exception directly to the fix and stop rules: verified old findings are recorded and filed, not fixed in this review; specify how they count for each applicable stop condition. Align the code profile’s “no HIGH” rule with that same wording.

4. **MEDIUM — The disposition auditor is asked to verify age without being given the evidence.**  
   **What’s wrong:** The plan says the auditor checks whether an *old* finding really predates the change. But the existing brief gives the auditor findings, author actions, and triage rules—not the frozen baseline, diffs, or other provenance evidence.  
   **Where it bites:** The author labels a finding *old* because the affected code predates the review, but the defect itself was introduced by the change. The auditor cannot distinguish those cases from the brief’s materials.  
   **Instead:** Require the author to include the relevant baseline and change evidence for each origin judgment, and give that evidence to the disposition auditor. Specify that the auditor checks *new* and *from a fix* labels too, not just *old* and *blocks*.

5. **MEDIUM — The proposed provenance check can confuse line history with fault origin.**  
   **What’s wrong:** For code, the plan names `git blame` on the line as a way to check origin, but a line’s last editing commit does not necessarily establish when the defect began. A fault can arise from an interaction between old and changed code, and non-code findings may not have a useful line or commit.  
   **Where it bites:** A change alters validation in one function and exposes a pre-existing failure in another. Blame on the failing line points to an older commit, so an agent may label the finding *old* even though the change created the failure scenario.  
   **Instead:** Treat blame as evidence, not the classification rule. Require a comparison with the frozen baseline that establishes whether the reviewed change caused the fault; define how to record uncertain or mixed provenance, including for documents and other non-code artifacts.

## Requested questions

**1. Human decisions:** Decisions 1, 2, and 4 are reflected in the plan in broad terms: findings get an origin label; change reviews use three labels; and old findings are filed instead of being fixed, with a blocker exception. Decision 3 is omitted as described above. Decision 5 is only partly specified: the plan says to stop on a blocker, record *blocked by <the bug>*, and send it to the human, but does not make the blocking audit operational. The planned tracker examples and `BUGS.md` fallback are implementation choices consistent with decision 4.

**2. Where an agent could get stuck or mislabel a finding:** Findings 1, 2, and 5 give concrete cases: whole-thing reviews lack a label; a blocker can stop the light review before the assigned auditor runs; and blame can misidentify a defect’s cause.

**3. Contradictions or missing updates:**

- Current SKILL.md step 4 says: “**fix every verified HIGH and MEDIUM**.” The plan says: “**An old bug does not stop the review and is not fixed inside it**.” The exception needs to be stated in the fix rule.
- Current SKILL.md says: “**Two rounds in a row with no tier-1 finding**.” The plan says: “**old findings do not count toward a stop**.” Clarify how a verified old tier-1 finding affects this specific condition.
- Current light review says: “**One fix auditor on the diff**.” The plan says: “**a blocking one ends the light review and goes to the human**,” while also assigning the fix auditor the blocking-reason check. The auditor’s timing and materials need to be reconciled.
- Current disposition-auditor brief gives it “**every finding and what the author did with it**” plus the triage rules. The plan asks it to judge whether an old finding is really older than the change, but does not add the baseline or diff to its materials.

**4. Scope:** The evidence addition may be larger than necessary. The existing *Fixes chasing their own edges* section already gives the 60/40 measurement and frames the related code-review result as a hypothesis. A short pointer or a narrowly stated addition about what the provenance labels will let a future review measure may avoid duplicating evidence.
