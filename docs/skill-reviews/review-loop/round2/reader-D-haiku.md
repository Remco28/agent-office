Read-only pass over the review-loop skill. I changed nothing. I read SKILL.md in full, then profiles/explainer-public.md, profiles/_template.md, profiles/code-review.md (head), profiles/web-app-tasks.md (head), and briefs.md. I did not read evidence.md, which the skill says is for maintaining the skill, not running it.

1. What it is and how it works

It is a loop for checking a thing you made by giving it to fresh readers who have never seen it. It is good at coherence (does it contradict itself or its source?) and comprehension (does a stranger get what you meant?). It is blind to merit (was it worth making, is the argument right). The human always reviews at the end, and the report should say which of the three it is speaking to.

The mechanics: state one success question a reader must satisfy. Confirm any outside rules with the person who knows them. Pick a profile, which sets the cast and house rules. Run checks you can script first. Freeze the version. Send readers in parallel, blind to each other, spread across models, with a six-part brief. Ask them whether it worked, not what is wrong. Sort findings into tiers: tier 1 is verified by two independent readers or checked against the source, tier 2 is one reader checked by a second agent trying to kill it, tier 3 is taste and goes to the human, tier 0 is a rendering artifact and gets rejected. Fix tier 1 only (plus HIGH and MEDIUM for code). Write predictions before the next round. Keep a ledger in review-loop/LEDGER.md, including a "Believed, and wrong" line each round. A disposition auditor checks the sorting every round before any decision to stop. Stop after two rounds with no tier 1, or when everything verified is in one area, or when only taste is left.

It is expensive by design and runs only when asked. Its cost is many agents and many rounds.

2. My plan for "Use the review loop on this announcement before I send it"

- Size it. Two paragraphs do not need twenty readers. I would tell you the plan in a line and proceed unless you object. The skill says to ask first for important work, and a parent email is a real send, so this is the one place a question is cheap.
- Get the facts from you first. The old and new practice times, the first date the change applies, the venue if it moved, what parents must do or bring, who to contact, and any reason you want given. These are the source of truth. Without them the check in step 0 has nothing to check against.
- Success question, in the skill's terms: "A parent who reads this once can say the new time, the day it starts, and what they need to do, and knows who to ask." I'd show you this sentence and get your yes before any reader runs.
- Step 0, mechanical checks I can run myself: every time and date against your facts, including weekdays for the date (today is 2026-10-23, so a weekday mismatch is a real check); subject line matches the body; a single unit for times (am/pm or 24h, not both); any "more details on Friday" promise is kept (this is the promise rule from the explainer profile, which I'd borrow).
- Profile: no existing profile fits. explainer-public is for public science pages and its house rules (non-detection, association) do not apply to an announcement, and its cast (accessibility, JavaScript-off, idle CPU) is far too heavy. I would copy profiles/_template.md and write about three rules with tests: one time and one date throughout; every change stated with its effective date; each request tied to a named action.
- Snapshot the email text into the scratchpad, with a hash, as the frozen version. The ledger goes in a review-loop/ folder beside it, or in the scratchpad if there is no project folder. You would delete it afterwards.
- Cast, kept small: about three comprehension readers on different models, given only the email and the goal: a parent with no knowledge of the practice schedule; a parent who skims on a phone and reads the subject plus first line; a reader who learned English as a second language and may misread "not" or "until". Plus one specialist given the facts sheet and told to check coherence against it. Plus the disposition auditor after sorting. In round 2, a fix auditor that sees only the changes.
- Brief each reader in six parts, asking "did this work for you, what would you change", with the honesty line verbatim and a note that the plain-text form is deliberate, so no rendering faults.
- Sort: a finding that a parent misreads the time, confirmed by the facts sheet, is tier 1 and gets fixed. A single reader's misreading is tier 2, so a second agent tries to kill it. Tone and warmth go to you as tier 3.
- Prove each fix: count the old time across the subject, body and any calendar text before and after, and require zero. Then read the final once as a parent would, in a mail preview, since no reader saw the email the way a phone shows it.
- Hand back to you: the tier 1 changes made, the tier 3 list with my recommendation, what the review cannot judge (whether the change is wise or parents will like it), and the ledger location. I would not send anything myself.

Expected: two rounds, a few readers each, and a short ledger.

3. What is unclear, contradictory, or likely to be skipped

- The skill says never skip the four steps, but step 1 assumes an outside rule-set. For an announcement the facts are the rules, and the skill never says that a facts sheet from the user should be the source of truth for step 0.
- Two rounds of 3 to 4 readers plus the auditor each round is not clearly "sized" for two paragraphs. "The budget is spent" is a stop rule with no budget defined anywhere I read.
- The fix rule ("fix every verified HIGH and MEDIUM") depends on the code profile's severity scale. For non-code profiles the tiers alone must decide, and the skill does not say that plainly.
- Step 3 says "commit or snapshot" and the ledger lives in the project folder. For an email, there may be no repository, and the skill says nothing about where the ledger goes when there is no project.
- The "explainer-public" house rules (non-detection, association) read as general principles but are specific to science writing, and the skill does not say which parts of a profile carry over when you copy one.
- The skill tells me to spread readers across models but does not say how to do that in this environment; the Agent tool's model override is the only mechanism I can see.
- The ledger is a markdown file the skill requires. Our general instructions discourage agent-written .md files, so that tension should be noted, though the skill asks for it explicitly.
- Stop rule and tier 3 ("read it for the opposite signal: too long, over-hedged") are good, but the skill never says whether tier 3 findings count toward "no tier 1 this round". I'd assume they do not.
- evidence.md (the rationale) is not read by me, so anything it justifies is unverified in this pass.
