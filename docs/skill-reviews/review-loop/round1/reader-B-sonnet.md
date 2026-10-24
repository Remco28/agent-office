I read SKILL.md, briefs.md, evidence.md, profiles/_template.md and profiles/explainer-public.md. I skimmed no other profiles, so code-review.md and web-app-tasks.md are unread.

## 1. What the skill is and how it works

It tests whether something you wrote works for a stranger, before a human looks at it. You hand the draft to many cheap reader agents who have never seen it, then decide carefully which of their answers to believe. It measures two things: coherence (does the draft contradict itself or its source?) and comprehension (does a stranger come away with what you meant?). It can't judge merit, meaning whether the thing was worth making or the argument is right. Only a human can, so the human review is never skipped, and you say in your report which of the three you're reporting on.

The loop:

- **Step 0: mechanical checks.** Check anything that can be checked against a source of truth with a re-runnable script, before spending any readers. Findings from this go straight to the top tier. The check proves only that the source says the thing, not that the source is right.
- **Step 1: success question.** Write one sentence a reader must satisfy. If you can't write it, stop. Its shape depends on how the thing is read: an essay gets "can they say X from memory", while a reference or procedure gets "can they complete a named task". Also write down any outside rules the artifact applies (how the group actually works) and have the person who knows confirm them before round one. Readers check against your idea of the rules and can't tell you it's wrong.
- **Step 2: profile.** A profile holds the audience cast, the materials, the house rules (each with a test attached) and what's out of scope. A new genre needs a new profile, built from the template.
- **Step 3: prepare, freeze, run.**
  - Give readers the artifact as its audience meets it, and name known quirks of your materials as deliberate.
  - Freeze a copy if they'll run it.
  - Run all readers in parallel and blind to each other, spread across more than one model if possible, and record the model beside each finding.
  - Each brief has six parts: who they are, materials by absolute path, the quoted goal, numbered questions, the "don't hunt for problems; nothing wrong is a valid answer" line, and the known artifacts.
  - Comprehension readers are asked whether it worked for them, what worked, what is confidently broken, and the one thing they'd change. Fault-hunting is left to named specialists.
- **Step 4: triage.**
  - Tier 1 is two or more independent readers, or something checkable against the artifact itself. Fix it.
  - Tier 2 is one reader, checkable outside the artifact. Have a second agent try to kill it. If it survives, treat it as tier 1.
  - Tier 3 is taste. Collect it for the human and don't act on it.
  - Tier 0 is a flaw in your harness or the copy you handed over. Reject it out loud.
- **Step 5: fix, then predict.**
  - Fix tier 1 only.
  - Read the tier-3 pile for "too long / over-hedged" signals, which are the only evidence the loop produces against itself.
  - Prove each fix by searching the whole artifact for every place the claim lives, then use the artifact the way its audience will.
  - Put choices that change outcomes to the human.
  - Write `PREDICTIONS-R<n>.md` before the next round.
- **Records.** Keep `review/loop/LEDGER.md` in the project. Each round it records the tier-1 count, false findings, the model per reader, how each finding was checked, and a mandatory "Believed, and wrong:" field. The ledger ends with a list of mistakes the next author will make, specific enough that the human would recognise one.
- **Standing readers from round two.** A fix auditor, a cost reader and an A/B reader against the earlier draft, and a disposition auditor. The disposition auditor audits your own triage and is required every round before any stop decision. The A/B reader exists because the loop only ever adds caution.
- **Stop when any of these holds:**
  - two consecutive rounds with zero tier 1
  - all tier 1 sits in one area
  - only tier 3 remains
  - coverage is complete, for fragment-read artifacts
  - the budget is spent

  Then hand it to the human.

## 2. Plan for the phone-tree guide

The guide is a procedure consulted in fragments, mid-crisis, by someone on the phone. That makes it the "complete a named task" shape, not recall. The evidence file says the cast does not transfer between genres, so I'd write a small custom profile.

**Before any reader (step 1 and rules):**

1. Write the success question: *"A new volunteer, handed only this guide on the morning an event is cancelled, can run their part of the tree: call the right people in the right order, say the right thing, and handle no-answer, with no one to ask."*
2. Write the club's real rules as one plain line each:
   - who calls whom
   - the order
   - the script and wording
   - how many attempts and when
   - how long to wait before escalating
   - what counts as "reached"
   - who to tell when someone can't be reached
   - what is never said, such as reasons for the cancellation
3. Get the club coordinator to confirm those lines before round one. This is the step most likely to find a wrong premise, because no reader can catch an idea that is wrong in the same way for all of them. The coordinator is also the domain expert to ask whether the guide matches how the tree actually runs.

**Step 0, mechanical checks, written as a re-runnable script or checklist:**

- Every name and number in the guide matches the roster.
- Every caller has exactly one list and every person is on exactly one list.
- No one is orphaned and no one is called twice.
- Each branch's "if no answer, go to X" points at a real person.
- The guide says the same thing in its two pages. For example, the attempt count or wait time stated on page one is not contradicted on page two.

Anything found here is fixed with no reader needed.

**House rules, each with a test:**

- Every step has one checkable action.
- The no-answer rule gives a number of attempts, a wait and a next step.
- Every term is explained at first use.
- Any "see below" is delivered.

**Readers (round one, around 7 to 9, across at least two models, all blind):**

I'd run these as task readers, each given only the guide, and ask each to act as the caller.

- **Comprehension readers, each given a scenario to walk through:**
  - a nervous first-timer with no club knowledge
  - a non-native English speaker at about B2 level, because these are phone scripts
  - a distracted person with a phone in one hand and ninety seconds, who skims
  - a caller whose first three contacts don't answer
  - a caller whose contact says "I'm not sure I can come anymore"
  - an older volunteer who is unsure about technology, if that matches the club

  Each gets the four standard questions, plus "write exactly what you'd say and do for scenario N". The scenario outcomes are the measurement, and every place they had to guess is a finding.
- **Specialists (nitpicking is their job):**
  - a consistency reader, to check the two pages against each other and the roster
  - a script and tone reader, who judges whether the script sounds like a person and does not over-promise
- **Adversary:** an "if everything goes wrong" reader. The tree must survive a caller who is out of town or a chain that breaks halfway. This is a bespoke reader aimed at what I'm afraid of.

The briefs stay short: one sentence of worry and no map of where I think the problems are. All of them get the six-part skeleton, including a note on any quirk of the format I hand over (e.g. "page breaks come from the PDF conversion"). I'd also give them a frozen file with a recorded version.

**Triage:**

- Findings two or more independent readers hit, or ones I can check against the guide or roster, go to tier 1 and get fixed.
- Single-reader findings that need outside facts go to tier 2. For these a second agent tries to kill the finding, and survivors are fixed.
- Style preferences and tone go to tier 3 for the coordinator.
- I reject anything caused by my own formatting as tier 0.

Fixes must be proved: search the whole guide, including headings, any wallet card or summary box, and the script text, for every instance of the claim. Then do a real dry run, with me or a volunteer actually working a sample tree from the guide.

I write `PREDICTIONS-R1.md` before round two and record the ledger with the model beside every finding, "Believed, and wrong:", and the closing list of mistakes the next author will make.

**Round two onward:**

- Add the fix auditor.
- Add the A/B reader, which compares the new draft with the old one, so I can tell whether the guide is improving or just getting longer and more hedged. For a two-page guide, bloat is the real risk.
- Add the disposition auditor, which is required every round.
- Skip the cost reader, since a two-page guide has no meaningful compute cost.

**Stopping:**

- The disposition auditor must confirm my ratings first.
- Then I stop after two consecutive rounds of zero tier-1 findings, or when the only things left are tier 3. Coverage matters here too: every branch of the tree (answered, no answer, declined, caller unreachable) must have been exercised at least once.
- Then I hand it to the club coordinator. Even better, I do a live drill with a real volunteer. What I'd report is "comprehension and coherence tested; merit not tested".

## 3. Unclear, contradictory or likely to skip

- **The skill is long and the route through it is easy to miss on a first read.** Step 0, "confirm the rules" (buried in step 1), and the disposition auditor (introduced in the cast section, required in the stop rules) are the likeliest to be skipped by an agent in a hurry. They are also the ones the evidence says matter most. A one-page checklist at the top would help.
- **"Independent" readers are weak in practice.** Tier 1 needs independent readers, but the skill admits that same-model readers aren't independent and that nothing measures the effect. The tier-2 fallback ("when in doubt, check") is sound, but it isn't spelled out what to do with a small cast of one model. I'd rely on checkability more.
- **Round-one default doesn't fit small artifacts.** "Six comprehension readers across at least two models, plus one or two specialists" is heavy for a two-page guide. It also says "run more readers than feels necessary", which conflicts a little with the warning against over-hardening. There is no guidance on scaling down.
- **Models available aren't addressed.** The skill assumes I can choose several models, but doesn't say what to do if I can only spawn one. It only says to record that fact.
- **"Fix tier 1 only" vs. the owner decides.** If a tier-3 item is cheap and obviously right (a typo), is it forbidden? The skill's logic says leave it, but it is not stated.
- **Stop conditions overlap.** "All tier-1 findings in one area — fix that area and stop" could be read as permission to stop with other areas untested. It appears to depend on the disposition auditor having checked, but that isn't explicit.
- **Peer-planning step is vague.** It says "fresh group" with no sizes, and "stop when a pass finds only details" is subjective. It's built for code that changes stored data, and is irrelevant for a phone-tree guide.
- **Missing ledger and predictions templates.** The ledger and predictions are required but there's no template, and the "end by predicting the next author's mistakes" step is easy to write generically.
- **Evidence base is thin.** Evidence.md says plainly that it comes from one author and a few artifacts, and treats every threshold as a hypothesis. So numbers like "two rounds" or "six readers" are starting points, not rules. That honesty is useful, but it means I'm making judgment calls about scale.
- **Step 0 for a procedure document.** The table has no row for a procedure with a roster, so I had to invent the checks above. The roster comparison is natural but unstated.
- **Human review is required but the loop has no step for how to run it.** The human-feedback skill is separately named elsewhere in the office. I didn't open it, so I can't say whether review-loop should point to it.
