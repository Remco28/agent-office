# Review-loop ledger: the brand-kit skill
*Kept by the review-loop skill. Safe to delete this folder once the work is done.*

Thing: `skills/brand-kit/` (SKILL.md, prompts.md, checklist.md, evidence.md), drafted by claude-1816
from the Team Remco brand kit (`~/Dev/teamremco-style`), reviewed by claude-6803.

Success question: Can an agent with no memory, asked by a human to make a new brand (or refine an
existing design), follow this skill to a finished kit, knowing at each phase what to show the
human, what to ask, what to build and when it is done, without contradictions between the files?

Profile: none fits; skill document read in pieces. House rules (with tests):
- Every phase has a goal or an output the agent can check. Test: name it for each phase.
- The four files agree (phase numbers, deliverables, file names, claims in evidence.md).
- No project-specific content outside evidence.md, except the one pointer to teamremco-style.
- Fits beside the other office skills (voice-brief, review-loop, human-feedback, desktop-polish)
  without contradicting them.

Rules confirmed with: Frank, 2026-10-28, in chat:
1. Mostly brand-new brands; it may also take an existing design and refine it. (Changed from the
   draft's "brand-new only".)
2. `teamremco-style` is named, not described.
3. No Team Remco details outside evidence.md; the kids' names nowhere.
4. Phase 2 (generated mock sheets) stays marked untested.
5. Installed as `skills/brand-kit/` without README-FIRST; Documents draft folder deleted.
6. American spelling, as drafted (Frank's call; other office skills are British).
7. Team Remco-derived fill-in examples in prompts.md replaced with neutral ones.

Stakes: agents on this machine will follow it for a long, interactive job with Frank (many rounds).
A failure costs Frank's time: rounds wasted on a wrong order, a deliverable missed, or an agent
copying one brand's taste. Nothing is lost irreversibly. Used: on this machine (codex-image tool
exists for image generation). Stop when no reader finds a contradiction or a step an agent could
not act on.

## Step 0 (own checks), 2026-10-28, on draft v0 (81d14b4)
| Finding | How checked | Done |
|---|---|---|
| evidence.md says "the print sizes in the checklist"; checklist has none | grep | Reworded: no print deliverables yet |
| Team Remco look used as fill-in examples in prompts.md (wooden blocks, coral, prism roof, warm off-white, "building blocks") | grep | Replaced with neutral examples (Frank) |
| evidence.md calls the human "he" | grep | Changed to "they" |
| One British spelling ("labelled") in an American draft | grep | Fixed |
| Scope said brand-new only | Frank | Description and intro now include refining an existing design; evidence.md lists it as untried |
| Kids' names: cannot grep for them without knowing them; draft names no person | read | Left; readers asked to flag any personal name |
| Links between the files resolve; frontmatter name matches folder | read | OK |

## Round 1, 2026-10-28, v1 (c6eec54)
Predictions (written before the round):
- 4-8 verified findings, mostly coherence: SKILL phase 7 vs checklist deliverables (items in one
  and not the other), and the new "refine an existing design" path being too thin to act on.
- Someone flags phase 10 "commit, push" (pushing may be the human's call).
- Overlap reader finds no real contradiction with voice-brief/desktop-polish; maybe a suggestion to
  use human-feedback for review pages (tier 3).
- No personal names found.
Cast:
- A: comprehension, new brand from scratch (Claude Sonnet, Agent tool)
- B: comprehension, refining an existing design (Codex gpt-6-luna, read-only)
- C: coherence specialist, do the four files agree (Grok 4.7, read-only)
- D: overlap specialist vs the other office skills (Claude Opus, Agent tool)
