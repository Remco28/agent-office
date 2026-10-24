I read SKILL.md, briefs.md, evidence.md, and the web-app-tasks, code-review and _template profiles. I changed nothing.

1. What the skill is for and how it works

It is a loop for checking a drafted artifact (a doc, page, UI, API reference, or code) against its own stated goal, using cheap reader agents who have never seen it. It measures two things: coherence (does it contradict itself or its source) and comprehension (does a stranger take away what was intended). It cannot judge merit: whether the thing was worth making or the argument is right. A human review is always still needed, and results should say which of the three they cover.

The loop, as I understand it:
- Step 0: run mechanical checks against a source of truth first (tests on the logic, scripted API runs, rendered screenshots). Their findings are real without a reader confirming them.
- Step 1: write one success question about the reader's task. For rules that come from outside the artifact (how money is charged, how a group works), write them down and have the person who knows them confirm before any reader sees the thing.
- Step 2: pick or write a profile, which defines the audience, materials, house rules and cast.
- Step 3: freeze the artifact, brief readers in parallel with six parts, and ask comprehension readers four fixed questions (did it work, what worked, what is broken, the one change). Spread the cast across models and record which model said what.
- Step 4: triage by confidence. Tier 1 is two or more independent readers or a mechanical check; tier 2 is one reader plus an outside source, and a second agent tries to kill it; tier 3 is taste, which goes to the human; tier 0 is an artifact of the harness, which is rejected.
- Step 5: fix tier 1 only, prove each fix by using the thing, and write a PREDICTIONS file before the next round. Owner-facing choices go to the human, not into the artifact.
- Stop when two rounds in a row have zero tier-1 findings, the disposition auditor has checked the ratings, and then hand to the human.

2. My plan for the club app

Profile: web-app-tasks, because the readers are parents using it in a browser. I would add code-review's rules reviewer and money-logic specialist, since this handles real money.

First, before any reader: write the pricing rules in plain words, one per line, and get the club's treasurer (or whoever owns the rules) to confirm them. Questions to settle, without choosing defaults myself: what counts as an order for the fifth-order count (per family or per account, and whether cancelled or refunded orders count); the sibling discount threshold, size, and what it applies to; which item is free and whether it can stack with the sibling discount; and rounding to cents. Each answer changes what parents pay, so it goes to the human with my recommendation, not into code.

Step 0: write a re-runnable pricing test. Cover one child, several children, fifth and tenth orders, discount plus free item, a zero-price line, and rounding. Also script the order flow against a local copy and screenshot each screen at 390x844 and 1280x800, light and dark.

Readers (round 1, roughly six to eight, across at least two models):
- Comprehension: the impatient parent placing one order for one child (main path); a first-timer who needs to know what they will pay; the treasurer doing admin work such as checking an order or a refund; a second-language parent explaining the discount back in their own words; a phone-only user.
- Specialists: a rules reviewer (app text and totals against the confirmed rules, every place a parent sees an amount); a money-logic specialist; a visual-trust reader for totals and labels; an accessibility reader.
- Whole-code reviewer, since the code-review evidence showed that a review with no focus found what focused lenses missed.
- Each brief gets a seeded local copy with its own state, for example a family with two children and a family at order four. Briefs are short and ask whether it succeeded. They do not list where I think the bugs are.
- Name as deliberate: test payment disabled, made-up data, and headless clipboard behaviour.

Triage: any total that disagrees with the confirmed rules is tier 1 by the rule itself. Each round, the disposition auditor checks my ratings, and the fix auditor reads the previous round's diff.

Fixes: each one changes money, so it goes through the peer loop (critics, blind solvers, a fresh group) if it changes stored or computed values, and I stop if the plan keeps growing. I prove each fix by running the pricing tests, placing an order through the UI, and checking that the same total appears in the cart, the confirmation and any export. I write PREDICTIONS-R1.md before round 2 runs.

Done when: two rounds in a row have zero tier-1 findings, every screen has been exercised, and the disposition audit is clean. Then the human reviews the rules and the real look, because the loop cannot judge whether the discount is the right policy.

Records go in the project's review/loop/ folder: LEDGER.md with a "Believed, and wrong" field each round, and PREDICTIONS-R<n>.md.

3. Unclear, contradictory, or likely to be skipped

- Disposition auditor timing is inconsistent. The standing-readers table says four readers start in round two, but the auditor section says it is "required, every round, after triage". Round one is unclear.
- Two stop rules. SKILL.md says two rounds with zero tier-1 findings. The code-review profile says a round with no HIGH after the auditor checks, and that a round with all HIGHs fixed still needs another round. They are not the same, and the web-app profile does not say which applies.
- Two severity axes. Tiers (0 to 3) and HIGH/MEDIUM/LOW are both used, and the rules for mapping one to the other are not stated.
- The budget is never defined. "The budget is spent" is a stop condition, but there is no guidance on how big a round is for a small app. Six comprehension readers plus specialists, a disposition auditor and a kill pass may be far too much for a club tool, and the skill does not say how to scale down.
- Tier 1 needs independent readers, but the skill itself says that all recorded rounds ran on one model, and no measurement says how correlated readers are. In practice, most agreement will be treated as weak evidence.
- Pacing of "read evidence.md once, not before your first round": I read it before deciding, which the skill does not forbid for a planning task, but it is a small contradiction with its own instruction.
- The web-app profile's materials assume Cloudflare Workers, wrangler, and agent-browser, and I do not know this app's stack. Those parts need adapting. The profile also gives no rule for money rules being confirmed, which only the SKILL.md and code-review profile mention.
- Likely to be skipped: the rules confirmation step (the most tempting to skip because it feels like a detail), the PREDICTIONS file written before the next round, and the disposition auditor after round one. The skill tells you the auditor is the only check on your own triage, so it is the one most at risk of being dropped.
- Missing from the web-app profile: a rule that covers the cost reader. It is probably not needed for pricing, but the skill does not say when to drop it.
