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

Grok hung twice (no output past one line; the second run hit an 8-minute timeout), so C ran on Claude Haiku.
The Claude reports (A, C, D) are saved condensed by claude-6803; Codex's (B) is verbatim.

| # | Finding | Reader (their rating) | Ours | How checked | Done |
|---|---|---|---|---|---|
| 1 | Phase 0 creates a new repo and keeps working: breaks one agent, one repository | D (HIGH) | Tier 1, HIGH | Read AGENTS.md quote | Fixed (Frank: create, office init, new agent) |
| 2 | Refine-an-existing-design path too thin; no intake of the original files | B; predicted by me | Tier 1, MEDIUM | Read: 3 lines only | Fixed: phase 2 procedure |
| 3 | No fallback when image generation fails | A (sure) | Tier 1, MEDIUM | Read phases 0, 2, 9 | Fixed (Frank chose) |
| 4 | Print asked about, nothing to build | A, C (LOW) | Tier 1, LOW | Read | Declined by Frank; recorded in evidence.md |
| 5 | Rule 3 "three to nine" vs "two or three" sheets/options | C (MEDIUM) | Tier 1, MEDIUM | Read | Fixed: two to nine |
| 6 | Voice: order (guide/BRAND.md written before brief) and no scope; BRIEF.md not passed | D (MEDIUM) | Tier 1, MEDIUM | Read voice-brief lines 13, 83 | Fixed (Frank: public copy only); guide prose waits for phase 8 |
| 7 | Fixed copy-check list duplicates voice-brief step 6 | D (LOW), C (LOW, exclamation marks missing in checklist) | Tier 1, LOW | Read voice-brief 125-130 | Fixed: check the brief's rules |
| 8 | Push without asking | D (MEDIUM) | Tier 1, LOW (AGENTS.md rule is scoped to skills) | Read | Fixed (Frank) |
| 9 | Description doesn't say when to use desktop-polish / voice-brief instead | D (MEDIUM) | Tier 2 → checked against both descriptions, LOW | Read | Fixed: one sentence |
| 10 | No pointer from USING.md to desktop-polish's one design file | D (MEDIUM) | Tier 1, MEDIUM | Read desktop-polish line 14 | Fixed |
| 11 | Decisions recorded in office and docs drift | D (LOW) | Tier 2, LOW | Read AGENTS "progress chatter" | Fixed: docs are the source, office says where |
| 12 | Scratch work has no stated home | D (LOW) | Tier 1, LOW | Read | Fixed: two places name the scratch folder |
| 13 | "retry about a third" vs 6 of 14 | C (LOW) | Tier 1, LOW | Arithmetic | Fixed: nearly half (also in evidence.md) |
| 14 | evidence: fixes "now in the prompt patterns", but they aren't | C (MEDIUM) | Tier 1, LOW (the generic patterns were there; the "what is happening" kind was missing) | Read | Fixed: evidence reworded; prompt gains "what must visibly be happening" |
| 15 | `photography/PROMPTS.md` vs `PROMPTS.md` | C (LOW) | Tier 1, LOW | Read | Fixed |
| 16 | Sheet contents in SKILL vs template | C (LOW) | Tier 1, LOW | Read | Fixed |
| 17 | Build script / folder layout missing from checklist | C (LOW) | Tier 1, LOW | Read | Declined: "Done means" requires one build command; layout is a phase-3 plan item, not a deliverable |
| 18 | Base prompt hard-codes "no people, no hands", "calm, minimal" | A | Tier 2, LOW (single reader, but checkable: a food brand needs hands) | Read | Fixed: bracketed |
| 19 | Human loses track over phases 4-7 | A | Tier 3 | — | Put to Frank: added as rule 9 |
| 20 | "deep teal" example may be copied as a palette | C (LOW) | Tier 3 | — | Declined: it is an e.g. inside a bracket |
| 21 | Checklist "decisions recorded in the office" vs new rule 5 | me, while counting | Tier 1, LOW | grep | Fixed |

What happened against the predictions:
- 4-8 verified findings: wrong, 18 verified (most LOW). Coherence SKILL vs checklist: right (5, 7, 15, 16, 17).
- Refine path thin: right. Push flagged: right.
- Overlap reader finds no real contradiction: wrong. It found the round's only HIGH.
- No personal names: right.
Believed, and wrong: "brand-kit fits the office's rules; it is a procedure inside one project." It
starts by making a second repository, which is exactly what one agent, one repository forbids.

### Round 1 audits
Disposition auditor (Claude Sonnet): #4 print still live where the skill asks about print → fixed (say
it isn't covered, note needs in the brief). #9 relabelled tier 1 (checked against both descriptions
by me). #20 relabelled tier 2, still declined (an e.g. in a bracket). Dropped: A's "phase 7 packs ten
deliverables" (A said checklist covers it; no action); Codex's failed `office peek` (tier 0: the
sandbox). Refine procedure unreviewed and not joined to the no-generator fallback or phases 4-5 →
fixed. #11 (decisions in docs, office says where) was my call → to Frank at the end.
Fix auditor (Codex gpt-6-luna): all hunks GONE except one new MEDIUM: "mock-up of their own, skip
generation" clashed with the refine procedure → fixed (a new look made elsewhere vs a design in use).
Also "throwaway folder" in checklist → aligned.

## Round 2, 2026-10-28, v3 (8ea513d)
Predictions (written before the round): 0-2 verified findings, LOW, in the new refine text or the
phase 0 handoff (most likely: what the first agent tells the new one). No HIGH.
Cast: E, fresh comprehension reader on the refine path and phase 0 (Codex gpt-6.1-sol); disposition
auditor after.
| # | Finding | Reader (their rating) | Ours | How checked | Done |
|---|---|---|---|---|---|
| 22 | Phase 0 still has the first agent create, init and commit in a second repo: contradicts "Work only in this repository"; and the request/answers don't reach the new agent's briefing | E (broken) | Tier 1, MEDIUM (round 1's #1 fix, half landed) | Read AGENTS.md; `office help`: `office init [path]` creates the repo and is meant to be run on another folder | Fixed within Frank's decision: only `office init <folder>`, nothing else there; a paste-in paragraph for the new agent |
| 23 | Refine path, phase 5: if the lettering stays, is the font sweep still required? | E | Tier 2 → checked by reading phase 5, LOW | Read | Fixed: skip rounds 1-2 when lettering stays |
What happened against the predictions: 2 findings, as predicted; one in the phase 0 handoff, as
predicted. But #22 is MEDIUM, not LOW: my round-1 fix kept the very act (working in a second repo)
that #1 was about.
Believed, and wrong: "Create it, run office init in it, make a first commit, then stop" counted as
not working there. A first commit is work there; only `office init <folder>` is the office's own setup.
