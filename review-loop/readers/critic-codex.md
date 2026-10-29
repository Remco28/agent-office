# Critic: Codex gpt-6-luna, -s read-only, in the repo (its sandbox blocks office). Report after the last 'codex' line.

## Assessment

The plan carries out decisions 4 and 5 in principle, and its tool notes respect decision 6. Decision 7 is a judgment call: the edits are short, but the new reader rule is operationally dense. Decisions 1–3 are not reliably enforced for every listed reader.

## Findings

1. **Gemini can still use the office. — HIGH**

   The plan says Gemini “can reach it” and permits it for a “stripped copy” when reviewing other repositories. But removing project instructions does not block the office command; the plan’s own test says Gemini read the live office. An agent following this rule could still have a reader access the office without noticing the procedure failed.

   **Instead:** Don’t use Gemini unless its tool permissions block `office`; a stripped copy alone does not meet the stated rule.

2. **The exception for office files covers only this repository. — HIGH**

   The new rule says to remove `AGENTS.md`, `CLAUDE.md`, `.claude`, and `.agents` from reader copies, then makes an exception when “the office’s own repository is the work.” That misses other reviews where those files are the artifact—for example, reviewing a project’s agent instructions. A reader would get an incomplete artifact and could report a clean result without seeing the material under review.

   The procedure also says code readers get “the code and a copy they can run” ([SKILL.md](/home/frank/Projects/agent-office/skills/review-loop/SKILL.md:129)); the proposed rule does not say how to preserve instruction files that are part of the target.

   **Instead:** Preserve target files and block office access through tool permissions; strip instruction files only when they are not part of the artifact and the reader’s tool cannot otherwise be made safe.

3. **The coverage/design boundary may conflict with the full-loop rule. — MEDIUM**

   The plan says coverage gaps in a light review are folded in, while design growth stops the review. But the full-loop peer rule currently calls growth in “more places” a design problem ([SKILL.md](/home/frank/Projects/agent-office/skills/review-loop/SKILL.md:277)). For example, a peer may point out a missing path through an existing feature: that sounds like coverage, but it may add a “place” to the plan. The two rules do not tell an agent how to classify that case.

   **Instead:** Define coverage as adding cases or paths within the existing design, and design growth as adding components or state; align the full-loop wording, or clearly limit the new distinction to light reviews.

## No further findings

The new sentence about undecided choices points to the existing owner-decision rule in step 5. The reference could be clearer because the light-review section also has a step 5, but the intended action is recoverable from context. I don’t see a necessary change to briefs.md or human-page.md.
