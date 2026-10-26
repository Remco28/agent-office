I read SKILL.md, briefs.md, profiles/web-app-tasks.md, profiles/code-review.md, and the start of profiles/_template.md. I did not read evidence.md (the skill says it's for maintenance) or explainer-public.md. I changed nothing.

## 1. What it is and how it works

The skill reviews something you made by handing it to fresh agents who have never seen it. Then you are strict about which of their answers you believe.

- **What it can see.** It is good at coherence (does the thing contradict itself or its source) and comprehension (does a stranger get what you meant). It is blind to merit, meaning whether the thing was worth making or the argument is right. A human always reviews at the end, and your report should say which of the three you are reporting on.
- **When to run it.** Only when the user asks. If the work looks important, ask first. Size it by judgment.
- **Four steps never skipped:**
  1. Run mechanical checks yourself first.
  2. Confirm the rules with the person who knows them.
  3. Have the disposition auditor check your ratings before you stop.
  4. Hand the result to the human.
- **Step 0.** Check everything you can by script against a source of truth: tests, diffs, the spec. A check proves the source says it, not that the source is right.
- **Step 1.** Write one sentence a reader must satisfy, about the reader's task. If you can't write it, stop. If the artifact applies outside rules (business pricing, regulations), write them in plain lines and have the person who knows them confirm them before any reader sees the thing. Readers only check against your idea of the rules.
- **Step 2.** Pick a profile from `profiles/`, which sets the cast, house rules, scope and sometimes the stop rule. Two profiles can apply. In that case take both casts and the stricter stop rule. A profile's stop rule overrides the SKILL.md one.
- **Step 3.**
  - Show readers the artifact as its audience meets it, rendered, and give code readers a copy they can run.
  - Freeze and record the version.
  - Run readers in parallel and blind to each other, across different models, and record the model beside each finding.
  - Each brief has six parts:
    1. Who the reader is.
    2. The materials, by absolute path.
    3. The goal, quoted.
    4. Numbered questions.
    5. The honesty line: "Do not hunt for problems to fill space. 'Nothing wrong' is a real and useful answer."
    6. Known quirks of the materials, named as deliberate.
  - Comprehension readers are asked whether it worked, not what's wrong. Fault-hunting goes to named specialists.
- **Step 4, sorting what comes back:**
  - Tier 1: two or more independent readers, or checkable. Fix it.
  - Tier 2: one reader, checkable against an outside source. A second agent tries to kill the finding. If it survives, it becomes tier 1.
  - Tier 3: taste or tone. Collect for the human and don't act.
  - Tier 0: caused by how you showed it. Reject it, after checking the real artifact.
  - "Independent" means different questions, personas and models.
  - Code findings also get a severity (HIGH, MEDIUM, LOW). Fix every verified HIGH and MEDIUM. A verified LOW is fixed or declined with a written reason.
  - Every finding records how it was checked: reproduced, read in source, or taken on the reader's word.
- **Step 5:**
  - Fix tier 1 only.
  - Read the tier-3 pile for "too long, over-hedged" signals.
  - Prove each fix by counting the old wording across everything before and after. Then use the thing as its audience would.
  - Choices that change what users get or pay go to the human, with your recommendation.
  - Before a fix that changes stored or computed data, run a peer design pass. Critics try to break the plan, and blind solvers get only the problem. Take the result to a fresh group each pass.
  - If each pass makes the plan bigger, stop and take it to the human. If each pass makes it smaller, build it.
  - Explain the design to the human in short numbered user-facing points before building.
  - Write predictions in the ledger before the next round.
- **The cast.** Comprehension readers, specialists and adversaries. The standing readers are:
  - Disposition auditor: every round, after sorting and before any stop decision.
  - Fix auditor: from round 2.
  - Cost reader: when cost matters.
  - A/B reader: when you have two drafts.
  - Other readers are retired after two rounds with no tier-1 or tier-2 finding.
- **Ledger.** `review-loop/LEDGER.md` in the project, in the given shape. Save each reader's report beside it. Each round needs a "Believed, and wrong" entry. The file ends with "Mistakes the next author will make".
- **Stop.** The skill's own rules are:
  - Two rounds in a row with no tier-1 finding.
  - All verified findings in one area, so fix it and stop.
  - Only tier 3 left.
  - Every section exercised once.
  - Budget spent.

  A profile's rule replaces these. The disposition auditor must have checked the ratings before you stop.

## 2. Plan for the dance studio booking app

I'd check with the user first that they want the full loop and roughly what budget. A booking-and-payment app is clearly important enough to ask about. Two profiles apply: `web-app-tasks` (people using it) and `code-review` (money logic and concurrency). I'd use the stricter stop rule, which is code-review's: no HIGH in a round, after the auditor has checked the ratings.

**Before any reader:**
1. Write the success question. For example: "Can a parent who has never seen the app book two classes for their child, see exactly what they will pay and what happens if they cancel, and complete payment, without guessing?"
2. Write the rules in plain lines and get them confirmed by the studio owner. Frank may not be the person who knows them, and the studio owner is the one who does. The rules cover:
   - The multi-class discount: how many classes qualify, whether it applies per child or per family, what it is (a percentage or a flat amount), and whether it covers one term or one order.
   - The cancellation policy: the notice window, refund percentage, credit versus refund, and what happens to the discount if one class is cancelled.
   - Class capacity and waitlist behaviour.
   - The payment currency and rounding.
   - Whether a failed payment releases the spot.

   These are the rules the skill most wants confirmed, since a reader can't tell me they are wrong.
3. Step 0 checks, written as re-runnable scripts:
   - Unit tests on the pricing and discount logic. Totals should equal the sum of the lines, the discount should match the confirmed rules, and refunds should match the cancellation rules at the boundary times.
   - A scripted run of the booking, pay and cancel flows against a local copy, with a test payment mode, asserting every response.
   - Type check.
   - Screenshots of every screen on a phone and a laptop, light and dark, which I look at myself.
   - Fix what these find before spending a reader.
4. Freeze at a commit and record it.

**Readers.** Each gets a private copy of the app seeded by API script, a headless browser session and a screenshot-viewing rule. Each brief states an isolation rule: no source, no repo, no direct API calls. Briefs name as deliberate: payment in test mode, made-up data, and no real emails sent. I would spread readers across models and record which.

Comprehension readers (asked whether it worked):
- Impatient parent booking one class on a phone.
- Parent booking several siblings or classes, who must understand the discount from what's on screen.
- Parent cancelling and understanding the refund before confirming.
- Second-language reader who explains the booking and cancellation policy back.
- Studio admin or owner managing classes and seeing bookings.
- Laptop user.

Specialists (told nitpicking is their job):
- Visual polish and trust, especially at the payment screen.
- Accessibility, keyboard only.
- Money logic reader, who gets the code and the confirmed rules.
- Whole-code reader with a short brief and no focus.
- Data integrity and concurrency reader.

Adversaries, each testing one claim:
- "A parent can't be charged twice" (double-click or retry on pay).
- "The discount can't be gamed" (book, cancel, rebook).
- "Two parents can't both take the last spot."
- A rules reader who checks the code against the confirmed rules.

Later rounds:
- Fix auditor from round 2.
- Disposition auditor every round.
- Cost reader only if load or cost matters, which is probably not needed here.

**What I do with what comes back:**
1. Sort into tiers. Reproduce code findings against the running copy. Kill-test any tier-2 finding. Reject tier-0 findings, such as test-mode artifacts, out loud.
2. Rate HIGH/MEDIUM/LOW with the code-review rating rules and the same rating for the same mechanism each round.
3. Fix tier 1 only, and prove each fix by counting the old wording or behaviour across the app (emails, receipts, confirmation text) and re-running the scripts.
4. Any choice that changes what a parent pays goes to Frank or the studio owner in plain words with my recommendation. Examples are what the discount does when one class is cancelled, or partial refunds near the notice boundary. I don't decide those in a code comment.
5. If a fix changes stored or computed data, such as a discount recalculation on cancel, run the peer critics/solvers design pass first. Explain the design to the human in short numbered user-facing points.
6. Write predictions in the ledger before the next round. Keep reader reports beside it. Record "Believed, and wrong" and the cast with models.
7. Collect tier 3 for the human, and read it for "too long" signals.

**Done when:**
- A round has no HIGH after the disposition auditor has checked my ratings. A round whose HIGHs were all fixed still gets another round, because the fixes are new code.
- For the task side, every flow (book, multi-class discount, pay, cancel, admin) has been exercised at least once.
- The budget is spent.
- Then I hand it to the human, with a test guide in the human-feedback style, and say which of coherence, comprehension and merit I am reporting on. The merit questions are whether the discount and policy are good business and whether the app is the right thing.

## 3. Unclear, contradictory, or likely to skip

- **Two stop rules.** SKILL.md has five and code-review has one that overrides them. The two-profile case says "the stricter stop rule", but it doesn't say how to compare "no HIGH" with the SKILL.md rules. "Two rounds with no tier-1" and "all that's left is tier 3" can end the loop sooner than "no HIGH". I assumed code-review's wins.
- **"Fix tier 1 only" versus "fix every verified HIGH and MEDIUM".** These conflict for a MEDIUM that is tier 2 until it survives a kill. The sequence is implied rather than stated. Also, a single HIGH from one reader that I can reproduce is "checkable" and so tier 1, but the tier table doesn't say reproducing it myself counts.
- **Blind readers versus growing briefs.** SKILL.md says briefs "grow round by round (where to look, what to skip)". briefs.md warns that growing briefs hand over your map. The two pull in opposite directions, and briefs.md is the more careful one.
- **Browser tooling.** The web-app profile assumes `agent-browser`, `wrangler` and Cloudflare D1 from a prior project. I don't know what stack the dance app uses or whether `agent-browser` exists here, and the profile doesn't say what to do otherwise. `office tools` would be the place to check.
- **Test-mode payments.** Neither profile says how to test real payment flows safely. Stripe-style test mode would need to be named as deliberate in the briefs.
- **Cost and model spreading.** The skill says to spread readers across models "where you can", but not how to do that with the available agent tools, and it gives no reader count or budget guidance beyond "size it with judgment". A web-app cast of 6 to 11 readers per round for several rounds is a lot, so the "ask the user first" step needs to include rough size.
- **Easy to skip:**
  - The ledger predictions written before results.
  - "Believed, and wrong" each round.
  - Recording the model per finding.
  - Recording how each finding was checked.
  - The "Mistakes the next author will make" list.
  - The explicit rating column that doesn't just copy the reviewer's.
  - Using the thing myself after fixes.
- **Who confirms the rules.** The skill says "the person who knows", which here is the studio owner, not necessarily the user I'm talking to. The skill doesn't say what to do if that person is unreachable. I'd mark the rules as unconfirmed in the ledger and tell the user.
- **Peer design pass.** "One or two critics" and "one or two blind solvers" is vague on when a fix counts as one that "changes what is stored or computed". I'd treat anything touching price, discount, refund or booking state as such.
