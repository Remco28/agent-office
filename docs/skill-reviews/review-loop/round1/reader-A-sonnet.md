I read SKILL.md, briefs.md, evidence.md and the profiles code-review, web-app-tasks and _template. I skipped explainer-public because it is for a different genre.

## 1. What the skill is and how it works

It is a method for reviewing something you made by giving it to many cheap agents who have never seen it. The harder part is deciding which of their answers to believe. It measures two things: coherence (does the thing contradict itself or its source) and comprehension (does a stranger get what you meant). It can't measure merit, meaning whether the thing was worth making or the argument is right. Only the human can judge that, and the human review is never optional. Reports should say which of the three they cover.

The procedure:

- **Step 0: mechanical checks first.** Anything checkable against a source of truth (tests, scripts, types) is done before spending a reader. Make it a re-runnable script. Whatever it finds is a top-tier finding and needs no confirmation. It only verifies that the artifact matches the source, not that the source itself is right.
- **Step 1: one-sentence success question.** It should be about the reader's task. If you can't write it, you don't know what the work is for. If the artifact applies outside rules (how a business charges, for example), write them in plain words and have the person who knows confirm them before any reader sees the thing. Readers only check against your idea of the rules and can't tell you the idea is wrong.
- **Step 2: pick or write a profile.** A profile sets the audience, the cast, the house rules (each with a test attached) and what is out of scope. Usually none fits and you adapt the closest one.
- **Step 3: prepare, freeze, run.**
  - Give readers the artifact as its audience meets it.
  - Name known quirks of your materials as deliberate.
  - Snapshot the artifact if readers will run it.
  - Run the readers in parallel, blind to each other, spread across at least two models.
  - Record which model said what.
  - Every brief has six parts: who they are, the materials, the quoted goal, numbered questions, the "don't hunt for problems, nothing wrong is valid" line, and the known artifacts.
  - Comprehension readers are asked whether it worked for them, then what worked, then what is actually broken (only if confident), then the one thing they'd change.
  - Fault-hunting is left to named specialists.
- **Step 4: triage by confidence.**
  - Tier 1 is two or more truly independent readers, or something checkable against the artifact itself. Fix it.
  - Tier 2 is one reader. Have a second agent try to kill the finding. If it survives, treat it as tier 1.
  - Tier 3 is taste. Collect it and show it to the human without acting.
  - Tier 0 is a fault caused by how you showed the artifact. Reject it and say so.
- **Step 5: fix tier 1 only.**
  - Read the tier-3 pile for "too long / over-hedged" signals, because the loop only ever adds caution.
  - Prove each fix by counting the retired phrase across the whole tree before and after, requiring zero, and then by using the thing the way a user would.
  - Choices that change what users get or pay go to the human.
  - Fixes that change what is stored or computed go to peers first (critics on the plan, blind solvers on the problem, a fresh group each pass). If the plan grows each pass it is a design problem, so take it to the human. If it shrinks, build it.
  - Explain the design to the human in plain numbered points.
  - Write `PREDICTIONS-R<n>.md` before the next round.
- **Standing readers from round 2:** a fix auditor (did last round's fixes land or break something?), a disposition auditor (was my triage fair?), a cost reader and an A/B reader. The disposition auditor is required every round, before any stop decision, because the author's ratings drift soft. Retire a persona after two rounds with no tier-1 or tier-2 finding.
- **Records:** `review/loop/LEDGER.md` and `PREDICTIONS-R<n>.md` live in the project. The ledger has a required "Believed, and wrong:" field each round. It ends with a list of mistakes the next author will make, specific enough that the human would recognise one.
- **Stopping:** two consecutive rounds with zero tier-1 findings, or all findings in one area, or only tier 3 left, or coverage reached for fragment-read artifacts, or the budget is spent. These are judged on ratings the disposition auditor has checked. Then hand it to the human.

## 2. My plan for the club ordering app

**Before any reader:**

1. **Write the success question.** This app is used by task, so the web-app-tasks profile fits for the usability side. Draft: "Can a parent complete an order cold and see a correct price, with the sibling discount and the free fifth-order item applied exactly as the club intends, and can the treasurer trust the totals and counts?" The code-review profile's question also applies: "does the code give anyone a wrong result or lose their work, including two users at once?"
2. **Write the pricing rules in plain words, one per line, and get the club organizer to confirm them.** This is the step I would most expect to skip, and the evidence file says it is where the real errors were. The questions I would put to the organizer:
   - What counts as a sibling: same account, same surname, or same checkout?
   - Is the discount a percentage or a flat amount, which items does it apply to, and does it apply to the cheapest or the most expensive item?
   - Does the discount start at the second child or at some other number?
   - Is the "fifth order" counted per family, per child or per account?
   - Does a cancelled or refunded order count toward the five?
   - Is the free item the cheapest in the order, or one the parent picks?
   - Does the discount apply before or after the free item?
   - Do the two stack?
   - How is rounding handled?
   - Can an order be edited after it is placed?

   Choices like these change what parents pay, so they go to the human with my recommendation. I should not settle them in code.
3. **Step 0 scripts.** Unit tests of the pricing logic that assert the confirmed rules. Examples are totals that add up, discounts that never push a price below zero, and the free item landing on exactly the fifth order, not the fourth or sixth. Also a script that drives each user flow through the API against a local copy and asserts every response. This includes two concurrent orders (the fifth-order counter is a race), a double-submit, and a refresh mid-checkout. Failures from these are top-tier and get fixed before any reader is used. Then screenshots of every screen at 390x844 and 1280x800, light and dark, which I look at myself first.
4. **Freeze.** Commit at a named commit, and give each reader a private copy of the app with its own seeded state (one reader's order must not change another's count). Name the deliberate quirks, such as test payment mode and made-up data.

**Readers (round 1: about six comprehension readers across at least two models, plus specialists):**

| Reader | What it gets |
|---|---|
| Impatient parent with one child | The running app and a task in their own words: "order two items for your son". No code. |
| Parent with two or three kids | The sibling discount task. Asked what price they expected and what they saw. |
| Parent on their fifth order | The seeded account on its fifth order. Asked whether it was obvious they got something free and what it was. |
| First-time parent who only wants to see the total before paying | Is the price the first thing they see? Is every amount labelled? |
| Second-language reader | Explains the app back in their own words. |
| Treasurer or admin | The multi-step path: reconciling orders and totals. |
| Laptop user | The layout that gets the least attention while building. |
| Whole-code reviewer | The repo at the frozen commit and a runnable copy, with a short brief ("review this code, here is who uses it") and no map. |
| Money-logic specialist | The code lens, naming the lens and not the functions. Told that nitpicking is the job. |
| Concurrency and data-integrity specialist | The code lens: two tabs, double-click, lost orders. |
| Rules reviewer | The code against my confirmed rules. Where they disagree, the rules win. |
| Adversaries | "A family can't be charged twice or get the free item twice"; "a sibling can't be double-discounted". |
| Visual polish and accessibility specialists | Optional. |

Parent readers get the persona-flavoured four questions, the six-part brief, and the honesty line. They are not told to hunt for faults. Specialists are told that finding faults is their job. Every brief includes a one-sentence worry (for example "is the price ever different from what you were first shown?"). Briefs stay short, with no map of where I expect problems. The code readers may run the code.

**What I do with what comes back:**

- Triage into the tiers. Every code finding needs a concrete failure scenario (steps, state, wrong outcome) and a severity of HIGH, MEDIUM or LOW from the scale, with the reviewer's rating shown next to mine.
- Anything money-wrong that a script or test can reproduce is tier 1 and gets fixed. Single-reader findings get a kill attempt by a second agent. Taste goes to the human.
- Anything seen only in a screenshot or a text extract is tier 0 until I reproduce it in the real app.
- Check the tier-3 pile for "too heavy / too wordy" signals.
- Fix with proof: write a test that reproduces the bug, count the old phrase or behavior across the tree, then use the app myself in a browser (the evidence file says this found things readers missed).
- If a fix changes what is stored or computed (for example, how the fifth-order count is persisted), run the peer-critic procedure. If that plan grows, take the design question to the human.
- Any rule choice that changes what parents pay goes to the club organizer.
- Write `PREDICTIONS-R1.md` before round 2, both per fix and per round. Keep `LEDGER.md` with the model per finding and the "Believed, and wrong:" field.

**Round 2 onward:** add the fix auditor (the previous round's diff only) and the disposition auditor (every round, before I decide to stop). Add a targeted recall reader if I want to know a fix reached the reader.

**Deciding I'm done:**

- The code-review profile says stop when a round has no HIGH after the disposition auditor has checked the ratings, and the HIGHs fixed in the last round still get one more round (fixes are new code). The main SKILL.md says two consecutive rounds with zero tier-1 findings.
- Because real money is involved, I would require both: two clean rounds and no HIGH, judged on audited ratings.
- Coverage should be explicit: every pricing path (single order, sibling combos, the fifth-order boundary, cancellations, concurrent orders) exercised at least once.
- Then hand it to the human. The human decides on merit, signs off on the pricing rules as implemented, and does a test purchase before real use. The skill is explicit that it is not a substitute for that.
- I'd also say in the report what the loop did not measure, such as real payment-provider behavior and any property only visible on the real target.

## 3. Unclear, contradictory or likely to be skipped

- **Two different stop rules.** SKILL.md says two consecutive zero-tier-1 rounds, while code-review says stop at no HIGH after audit. They are not reconciled. Severity (HIGH, MEDIUM, LOW) and confidence tier are separate axes, which is mentioned only in the code-review profile, so someone reading SKILL.md alone has no severity scale.
- **There is no profile for "web app with money logic".** web-app-tasks covers readers who use the app and never see the code. code-review covers readers who read the code. This app needs both and I had to combine them myself. The two also disagree on running: web-app-tasks says readers use the running app but not the source, while code-review says readers should be allowed to run the code. The skill says nothing about combining them.
- **Step 1's "confirm the rules" is the easiest step to skip.** It sits in the middle of the step-1 prose, not in a checklist, and nothing enforces it. The evidence file says it was missed for ten rounds. Likewise "the owner decides what changes outcomes" is buried in step 5.
- **"Read evidence.md once, not before your first round"** is vague about when. The failure-mode stories there, such as briefs growing, seem more useful before round 1 than after.
- **Step 4's "independent readers" is loose.** There is no concrete threshold for how many readers on how many models count. It says "when in doubt, treat it as tier 2".
- **The cost reader and the A/B reader don't have clear entry conditions.** Both are listed as standing from round 2, but the A/B reader is only meaningful with two drafts. Neither is flagged as optional, and I wasn't sure whether to run them for a small app.
- **Isolation of readers is "a rule, not a sandbox".** The only guard is checking reports for signs it was broken, which is easy to forget.
- **Practical tooling gaps.** The web-app-tasks profile assumes specific tools (`agent-browser`, Cloudflare `wrangler`) that may not exist on this machine. The skill doesn't say how to get a cheap model or a second model family in a given environment.
- **Evidence base is thin.** One author, three artifacts, and the code-review and web-app profiles come from one project (efc-expenses). The skill says so and treats them as hypotheses, which is honest, but the thresholds read like rules.
- **Heavy for a small app.** Ledger, predictions, auditors, peer rounds and a long cast could be much more than a school-club app needs. The skill gives no guidance on scaling the process down while keeping the non-negotiables (rules confirmed, money logic tested, disposition auditor, human sign-off). I would pick those four.
