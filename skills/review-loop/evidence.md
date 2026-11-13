# Why the rules are the way they are

**For maintaining the skill, not for running it.** `SKILL.md` is the procedure. This file is what the procedure is built on, and where it is thin. Read it before changing a rule, so that nobody simplifies a rule away without knowing what it protects against.

## The evidence base, stated honestly

Everything here comes from **one author, two artifacts, nine rounds**: a long-form public explainer over seven rounds and a one-page diagram over two. Small cheap model agents reviewed both. Two cold-read tests on other genres, a lab manual and an API reference, found that the *loop structure* carried over and the *cast and house rules* did not. Since then, two code reviews have added episodes. The first, of efc-expenses, ran eleven rounds, with outside reviewers on four models for rounds 1 to 7 and Claude subagents after that. It added the episodes from *Briefs drift toward the answer* to *Running it finds what reading doesn't*. The second, of agent-office, ran six rounds and added *Fixes that kept making new findings*.

So treat the procedure's steps as general, and **treat every specific persona, house rule and threshold as a hypothesis** until another genre confirms it. The numbers below come from two artifacts by one author, and that is not a law.

## The framing result

Fourteen readers briefed to *"find the friction, find what's broken"* produced nothing important across two rounds. The same model on the same artifact, briefed with *"did this succeed, for you?"*, returned verdicts, a recall test showing the structure survived one read, and a gap that four readers reached independently.

That is the whole reason for the wording of step 3.

**Corroborated from outside this project, 2026-10-20.** Another agent, working on a different problem, ran the inverse experiment as an A/B. Its problem was summarising its own conversation history. It held the *question* fixed, "summarise this", and varied the *writer*. One version wrote in first person as itself, and the other as a neutral archivist with the identity stripped. A blind judge scored both against twelve known errors. First person softened or dropped 8 of 12, and the neutral archivist 9 of 12. **There was no difference.**

Set that beside the framing result above. Varying **who writes** changed nothing, and varying **what you ask** changed everything. Two experiments by different authors, in different domains, run in opposite directions, reached the same claim: **the question carries most of the weight.**

A third, less controlled comparison in the same study suggests that the writer's *situation* carries a little of the rest. Summaries written at the end of a long live session dropped 11 of 12, against 8 to 9 for fresh writers given the same transcripts cold. The numbers are small, so treat it as a hint.

In both studies the actor is the same thing, an agent handed material and a task, whether that study calls it a writer or this skill calls it a reader. So the finding transfers: **who** they are matters least of the three. What you ask them, and the state they are in when you ask, is what changes the result.

## Briefs drift toward the answer

**efc-expenses, 2026-10-22 and 23, a code review.** See [`profiles/code-review.md`](profiles/code-review.md). Outside reviewers on four different models ran seven rounds. Round 3's briefs were a role, a focus area and a severity scale. By round 5 they named internal functions, said where to look hardest and told two reviewers to stop early to fit a time limit. They also said *read-only, do not run the app*. The rounds found many real issues, mostly where the briefs pointed, including a run of regressions in the author's own fixes.

Then the human asked one reviewer, with no brief beyond "review this code", to look at the code the seven rounds had left. It ran the server against a test database and the PDF exporter against a real receipt, reproduced every finding, and returned one HIGH and three MEDIUM that the rounds had missed. The first was the most ordinary shared-editing failure, where an editor left open overwrites a newer correction. The second was in an area no brief had named since round 2. The third was a severity the author had rated LOW, which the reviewer showed was not LOW.

Two things went wrong, and they are worth separating. The **briefs** decided the search in advance. Every addition was reasonable, and together they became a list of where to look. The **materials** withheld the most useful tool. The reviewers could have run the code and were told not to. **The human recognised the drift from other projects**, which makes it more than a one-off.

What this does not show is that one generic review beats a structured loop. It ran once, on code that seven rounds had already cleaned. A fair comparison runs both on the same code.

## The audit that kept postponing the stop

**efc-expenses, rounds 8 to 11.** After each round the author rated the findings and decided whether the round was clean. Four times running, the disposition auditor showed it was not. The author rated the same mechanism HIGH one round and LOW the next. The author rated "only in a rare timing" LOW when the scale calls it MEDIUM, and gave "visible" as the reason for LOW. Twice, a reason for not fixing was simply false, because it described a check as covering a case the check did not cover. Each time, the re-rating added a HIGH and another round. The author had written the rating rules down after the first audit and still broke them in the next three. That is why the auditor is required before any stop decision, and not just offered.

## Rules nobody checked

**efc-expenses, after round 10.** Ten rounds of reviewers checked the code against the author's idea of the app: that families on a trip eat together, so a meal is split among everyone there that day. The human, asked in plain words how the club actually pays, said within a few minutes that this was wrong. Meals are opt-in, and attendance days are not needed at all. The author rebuilt the split. No reader could have found it, because every one was checking the code against the same wrong idea. In the next round, a reader given the written rules found a default the author had chosen without asking: every new fencer was charged for every day. That default moved money silently. Hence step 1's *confirm the rules*, the rules reviewer, and *the owner decides what changes outcomes*.

## A fix that grew and a design that shrank

**efc-expenses, rounds 9 and 10.** The author sent the fixes for duplicate saves on a bad signal to peers before writing any code. Critics reviewed the plan, others solved the problem blind, and then a fresh group got the improved plan. Pass one beat the author's plan outright. Pass two broke details the author had added between passes. By pass three the fix touched the server, the phone's storage and every kind of record, and the author stopped it as a design problem. The design that replaced it went through the same loop, with the human choosing the direction: "hold new expenses on the phone until there's a signal". Each pass made it smaller, and two critics independently proposed cutting the same feature. It was built after three passes. The direction of change, not the number of passes, told the two apart.

## Running it finds what reading doesn't

**efc-expenses, rounds 9 to 11.** Three times, the author's own run of the app in a browser, after the peers and before the reviewers, found something no reader had. The first was a screen that could not load offline right after the app said an expense was "waiting", so nobody could see the waiting expense. The second was a button that redrew by reloading, which needs a signal. The third was a removed piece of dead code whose one leftover reference broke a page. All three passed every API check, because all three were in what the screen does, not what the server returns.

## Fixes that kept making new findings

**agent-office, 2026-10-26 and 27, a code review** of six rounds, with readers on four models. Rounds 1 and 2 found 3 HIGH and 9 MEDIUM in the original change, all in ordinary use, such as a copied project filing under the original and a user's own file hidden from git. Rounds 3 to 6 found 1 HIGH and about 10 MEDIUM. Nearly all were in code written to fix the round before, and in ever rarer git setups: worktree submodules, a git folder kept elsewhere, hard links, and two setups at once. A read-only check of the machine showed that nobody here used those setups. The author followed the rating rules, and the auditor raised three of the author's ratings, correctly by the rules. "Rare timing is MEDIUM" kept forcing another round. The changed code roughly tripled, mostly for those setups. About 60% of all findings were in the original code, and 40% came from fixes.

That split was counted by hand afterwards, and only partly. Each round was frozen as a hash of an uncommitted tree, so for about half of round 3 nobody can now tell a fault in the original change from one a fix wrote. Anthropic's account of how the Claude Code team reviews code, from October 2026, reports the same shape from the other side. About 59% of what its reviewer kept flagging across rounds was code older than the reviewer's first pass, and it tags such findings *pre-existing* so they are not charged to the change. Hence *where it came from* in step 4, the commit-per-round freeze in step 3, and the rule that old bugs are filed in the repository rather than fixed inside the review, which Frank set on 2026-10-29. **This is a hypothesis.** The next review should record whether the label made the direction test a count, and whether any filed old bug turned out to matter to the change.

The human's diagnosis was that they could not have set the stakes accurately at the start, and usually will not be able to. Their job is to say what matters once someone shows them. Hence the stakes drafted from how the thing is really used, the *whom it reaches* split, the check-in every third round, then "the stakes check" every two or three rounds and the direction test, and in the code profile one step down for a setup not in use. **These are a hypothesis from one review.** The next code review should record whether the check-in ended it sooner without letting through a failure in real use.

The same review copied a 1.4 GB Python environment into every reader's copy and never deleted the copies. They came to 29 GB, and nobody noticed until the human asked. Hence the copy and clean-up rules in step 3 and at the stop.

## Readers that checked in

**agent-office, 26 Oct to 29 Oct 2026.** A Codex reader ran `office peek` against the live office despite its brief. Another reader's check-in pointed the office at a throwaway copy under `/tmp`, which the office counted as a project. The only thing telling them to do it was the project's `AGENTS.md`. A test on 29 Oct showed four things. Codex and Grok in their read-only sandboxes could not reach the office, and Gemini could. A Claude subagent of the author's session carried the author's project instructions wherever it worked. A headless `claude -p` in a scratch folder had neither the instruction nor the author's memory, and the office refused every way of running `office` it tried. Hence step 3's rule: a stripped copy, every reader started from the shell, and only recipes that block the command. Both halves were Frank's idea.

**The next day, the first real review with that rule broke on it**, probably on the second computer. The fences had been tested only for what they kept out, and nobody had run a test suite through one. Readers' test runs failed because they had nowhere to write. Read-only Codex, measured afterwards, fails 161 tests of this repository's suite and passes 10. The skill pointed at tool notes, which stay on the computer they were written on, so the agent improvised a fake `office` and lost a run to a flag that consumed its prompt. Grok ran 25 minutes and left nothing. Hence `readers.md`: recipes in git, tested with a real suite; a throwaway copy that a code reader may write to; and output that survives a kill. On the copy, Frank's point was that the frozen version is what must not change, checked by checksum. Whether the probe catches a bad computer is untested, because only one computer has run it so far.

**Then the first readers started from those recipes broke them.** Gemini's auditor was fenced by a profile the author had called proven the day before. It showed that a saved rule made it run a script, and re-testing showed that `python3` ran too, because session settings add to saved ones. The author's note saying *replace* had never been tested with a command outside the deny list. Grok's auditor showed that it could write its own skills folder, and that Claude's recipe still read the user's settings. Claude was also being handed the user's mail and drive connectors. And every recipe could read the office's database. The author had declined to fence it because nothing pointed there, in a file that named the path. A fence per CLI kept failing at its edges, so `bwrap` now goes around each reader's whole process. **Test a fence by what it is meant to refuse, and also by what no list thought to name.** The disposition auditor then named the author's *limits* for what they were. Code that a Claude reader ran reached the office and wrote to the home folder, and 228 Claude transcripts quoted the office. The author fixed both by tightening a layer rather than adding one. Claude's only shell became a script with no network, and Grok moved to `strict`. The design got smaller.

**Round 3's check-in showed the wrong target.** The author had turned "readers never use the office" into a goal of "cannot reach the office whatever they decide" and put that goal in every brief, and a critic duly found an escape through the service manager. Asked, the human named a plainer fear: agents changing the repository, and after that, changing other things, installing tools, leaving things running and leaving temporary files. That is measurable. A script, now `probe.sh`, tried all of it under every recipe that runs code. The author also tried Gemini's file tool, and compared the machine before and after. The check found that Claude's script could still write to a backup mount and start Docker. The human accepted read access. **Three rounds went to a goal the human hadn't set. Ask what the fence is for first.**

## The author's tooling is the unreliable part, not the readers

**Nine false findings across nine rounds, and every one came from the author's pipeline.** Not once was it a reader's judgement. Here are all nine.

- a capture whose viewport stretched every section
- animations frozen mid-reveal, so text measured 1.6:1 against a declared 9.2:1
- a CSS reset added while fixing the above, which collapsed five labels onto one point
- text fused at line breaks in an extract, filed as fifteen spelling errors
- a scroll-triggered animation that never played, so the capture showed the central chart empty and a reader reported the result as broken
- extraction markers read as visible page text, filed by four readers across two rounds before the author recognised them
- a stale local web server still bound to the port, so a verification run tested the *unfixed* directory and reported six landed fixes as failures
- a watcher that counted lines containing a marker, where the document's own instructions quoted that marker, so it fired on the author's own writing
- a geometry probe that read element-local coordinates as page coordinates and reported dozens of clipped elements, none of them real

**Whoever hit each one reported it accurately.** What was wrong was the copy they had been handed, or the instrument used to check it. This is why step 4's first gate exists, and why the gate is about *the copy you handed over*, rather than about dismissing layout faults.

**The gate also works in the other direction.** After seven clean rounds the artifact shipped, and within hours the owner found that it used 20 to 50% of a processor while parked, with nothing visibly moving. The cause was a perpetual animation on an element the browser could not composite, which redrew 3,072 vector paths sixty times a second. No reader had an instrument, so no reader could see it. Worse, the author's own instrument could not reproduce it. A headless bisect put the page at 3.9% against a blank page's 4.6%, and would have certified it clean.

So **a tool that cannot reproduce a fault cannot clear the artifact of it**, and the word "measured" has to carry the name of what did the measuring. Some properties are only visible on the real target, such as compositing, battery, print, latency and a screen reader's actual speech. Either measure those there or record them as unmeasured. Do not let a convenient instrument stand in for an absent one.

## The loop's built-in bias toward caution

Readers find faults. The author fixes them. Fixes add caution. **No reader sees the previous version, so none can say "this got worse."** The artifact can only become more cautious, round after round, and nothing inside the loop objects.

Across the explainer's **first six** rounds, the page grew **from 4,243 to 4,730 words, 11.5% more**. The A/B below ran after the sixth round. Meanwhile three readers a round asked for cuts, and the author filed every one as taste.

Four A/B readers compared two unlabelled drafts, in both orderings:

| | early draft | late draft |
|---|---|---|
| better to **read** | **4/4** | 0 |
| more **trustworthy** | 0 | **4/4** |
| would **publish** | 0 | **4/4** |
| **over-qualified** | 0 | **4/4** |

One of the four read as a subject specialist, and its verdict was the important one: *"I found no case where the later draft hides a supported result."* The cost was **shape, not truth**. Limits had moved inside the claims until a reader could not find the claims. Splitting them into separate sentences conceded nothing.

This is a general property of review, not an agent problem. Code review does it. Editing does it. Any process where the reviewer sees only the current state does it. The A/B reader is a cheap fix for an old flaw.

## The record format is the second weakest part

A summary answers *what is true now*. **The wrong path is not part of what is true now, so the task itself discards it.** A measurement elsewhere on 2026-10-20 audited ten episode summaries against the raw transcripts behind them. 7 of 10 had softened or dropped one of the author's own mistakes. Of 14 errors, **1 was stated plainly, 6 were softened and 5 were omitted outright**, 1 was omitted but trivial, and 1 was lost with an episode that had been deleted. A preserve-mistakes rule was already in force and did not stop it. The authorship A/B under *The framing result*, with the same question, different writers, and 8 of 12 against 9 of 12, shows that the cause is not the author and not the model. It is the genre.

This is a direct threat to the ledger, which is a summary. The ledger can read perfectly well while it has deleted the only data that could stop the next author repeating you. The counter is not a better rule, because rules lose to genres. It is a **separate field that asks a different question of the same material**. That is why the ledger's predictions, written before each round, are not optional. They are the only part of the method written before the answer was known.

## The author is the weakest part

Nothing in steps 4 and 5 is independent. The author triages findings about their own work, and an agent that wants to feel finished will quietly put anything expensive in tier 3. The disposition auditor has caught this every time it has run, including:

- declines justified by a reason that turned out to be false
- the same expensive items deferred two rounds running under "reserved for the human"
- a fix described in a commit message and never actually made
- fixes applied to one version of a passage and missed in every other place the same claim lived: the artifact's other reading levels, its alt text, its no-JavaScript fallbacks, and the strings inside the code that drew it

That last pattern is why step 5 says *prove the fix, do not describe it*. The auditor reduces the problem but does not cure it.

## Where the method is known to be weak

- **Artifacts with no single stated goal**, such as a codebase or a design system. You have to invent the success question each round, which weakens everything built on it.
- **Artifacts read in fragments.** Recall tests the wrong thing. Use a task with a verifiable outcome, and add coverage to the stop rule.
- **Artifacts whose success is a physical action**, such as a manual for work on real hardware. A reader can walk through the procedure and check its internal consistency, but cannot tell you whether the bolt actually fits.
- **Large artifacts.** Readers have a finite context. Give each the slice their lens needs, and say in the brief what you left out.
- **Specialist casts do not transfer between genres.** This was tested twice. Expect to write a new profile and keep only the frame.
- **Readers drawn from one model have correlated errors.** A reader raised this, not the author: *"if the readers share one underlying model, their errors may be correlated, and agreement between them is weaker evidence than agreement between people."* That is right, and it weakens tier 1. That is why step 4 now says "two or more **independent** readers" and spends a paragraph on what independent has to mean. **Nothing here measures the size of the effect.** It only names it. Until something does, treat convergence as a strong hint rather than proof. Vary the personas hard so that the readers are not asked the same question in the same words. Keep the human at the end, because the human is the only reader in the cast whose errors are uncorrelated with the rest. **Where more than one model is available, spread the cast across them and write the model beside each finding.** Every round recorded here ran entirely on one cheap model, so every convergence in this file carries that caveat.

## The light review, and the decline nobody checked

**agent-office, 27 Oct 2026, six small changes**: the briefing trim, AGENTS.md, names as signatures, removing the manager role, refusing a memory with no project, and one rule for unusual repositories. Each ran the same way. The author committed the plan first. A critic and a blind solver ran where the change altered what is computed, and then a fix auditor ran. Twice the blind solver reached the same plan as the author without seeing it, which was the strongest evidence of the day. The critics and fix auditors found real defects every time: a write path that stored a key that reads did not look up, a capitalised flag slipping past a refusal, and a false claim in the docs carried over unchecked. What was missing was a check on the declines. The author declined findings and nobody checked the reasons, which is exactly the weakness the disposition auditor exists for. The human agreed to write the mode down, with declines going back to the fix auditor. This is one episode, so treat it as a draft.
