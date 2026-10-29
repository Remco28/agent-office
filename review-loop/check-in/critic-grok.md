# Critic: Grok grok-4.7, --sandbox read-only, read PLAN.md and the skill in the repo. Skill checksums unchanged.

I'll read the plan and the current review procedure, then judge the plan against the human's decisions and how an agent would actually follow it.The plan does carry out the merge: one check-in, every third round, with the direction counts and the stakes question in a single paragraph, plus the three renames. It does not yet carry out decision 1, and the new paragraph's proposals fight each other. Briefs, the light review, the ledger shape, and leaving `evidence.md` as history are fine.

## 1. HIGH — The pause does not cover the rounds where a review keeps going

Decision 1 says that after round 3 further rounds run only if the human says so. The new paragraph says that only at the check-in, and only for "the next round". The check-in is after rounds 3, 6, and 9. The plan also says the stop rules stay as they are, and those rules still open the next round on their own.

After round 3 the human says yes. Round 4 fixes a HIGH or a MEDIUM. Round 4 is not a check-in, so the code profile opens round 5, and round 6 starts the same way. That is the agent-office chase (rounds 3–6, almost all from fixes) with a single pause at round 3. A later session is in the same spot: the paragraph says to record the stakes answer, and says nothing about recording the yes or no, so the permission exists only in the chat.

The plan states both of these:

> The next round runs only if they say so, whatever a profile's stop rule says

> What is not changing: … the stop rules

and the procedure still says:

> A profile's rules override this file's for its genre. … If one has its own stop rule (code does), that one decides.

> A profile's stop rule replaces these for its genre.

> This replaces SKILL.md's stop rules for code: **stop after a round that has no HIGH that is not *old* … and needed no HIGH or MEDIUM fixes.** A round that ended with such fixes has a round after it

Replace those stop sentences. A profile still ends the review early when its clean-stop is met. After rounds 3, 6, and 9, nothing starts until the human answers. A yes runs only up to the next check-in. Write that yes or no in the ledger beside the stakes answer. The parenthetical can go once those sentences say this. That is still a replacement, so decision 4 allows it.

## 2. HIGH — "Stop and wait" is inside step 4, before the fixes and before the audit

The new paragraph sits where the old stakes check sat, and that place is in the middle of sorting. It now says stop. Step 5 still says to fix every verified HIGH and MEDIUM. The cast still says the disposition auditor runs after sorting, before any decision to stop.

Round 3 verifies a new HIGH in ordinary use. Read in order, step 4 says stop and ask for another round, so the fix is unwritten and the auditor has not checked the rating. The human says yes, and round 4 reviews the same bug. Or the human agrees to stop, and the HIGH is still in the tree. The other reading — finish every fix, then wait — is also wrong for decision 3: the round-3 fixes are the "another round of fixes" you were supposed to propose not making.

Say the check-in comes after sorting and the disposition audit, and before those fixes. Another round means fix, then run it. Step back or stop means do not start them. A HIGH the human still wants fixed is a separate recommendation in the box ("fix these and stop").

## 3. HIGH — The proposals overlap, and "serious" is not a rating this procedure uses

The branches are not exclusive. "Yes to all three" says propose stopping. "Serious findings still *from a fix*" says propose stepping back. The same round can be both: less severe, rarer, and mostly from a fix, while a serious from-a-fix finding remains. "Propose stopping" is also more than decision 3 asks. Decision 3 says what to propose when the review is not settling. The old "yes" action was to bring the stakes question forward, which is now this same meeting.

"Serious" is not defined. On the human page, serious and medium are separate counts. In the code profile the scale is HIGH, MEDIUM, LOW.

Replay the ledger the plan already names (agent-office, commit `da81b5a`). At round 3 the later findings were rarer and mostly from a fix: one HIGH and about ten MEDIUM. The paragraph proposes stopping and stepping back, and then always asks for the rating drop. If the agent takes "serious" from the page as the top bucket only, a later round that is MEDIUM-only and from a fix gets no step-back proposal, and the chase continues.

A whole-thing review has the same hole. Step 4 says there is no *old* and no *new*, only a commit, *from a fix*, or *untraced*. "Serious findings still *new*" never matches, so an *untraced* HIGH gets no proposal.

Make one branch win, in the words the rating rules already use. Any verified HIGH or MEDIUM that is not *old* and is *from a fix*: propose stepping back. Otherwise any verified HIGH or MEDIUM that is *new* (a change) or *untraced* (a whole thing): propose another round. Otherwise propose stopping. Keep the three counts as evidence in the box.

## 4. MEDIUM — Every check-in asks to rate the findings down, including findings in real use

The paragraph always ends with:

> The last findings are in setups you don't use (X, Y). I propose rating those one step lower from now on. Agree?

Decision 3's other case is serious *new* findings: faults the early rounds missed, in setups that are in use. The code profile still says:

> A setup not in use is one step lower. … Only from the stakes check on: until the human has agreed, rate it in full and propose the step down there.

Round 3, a HIGH labelled *new* and *how it is used now* (two people editing the same record). The agent asks the human to agree that this setup is not in use and to rate it down. A yes becomes the stakes for every later round, including rounds that run under finding 1 with nobody looking. "The answer" is also ambiguous once the box holds a go / step-back / stop question and a rating question.

Use that wording only for findings labelled *a setup not in use*. Otherwise the stakes part of the box is the current stakes and no rating change. Record the two answers separately.

## Shorter

The parenthetical in the new paragraph is the extra length. It restates a rule the plan refuses to put in the stop sections, so an agent still has both versions. Replacing the two stop sentences is shorter. The closing line about fixes causing new problems still belongs. The replay, the mention count, and the word count are the right checks. Add the disposition audit and the step-5 timing to that replay, or a round-3 pause on the old ledger will look fine while findings 1 and 2 stay in the procedure.
