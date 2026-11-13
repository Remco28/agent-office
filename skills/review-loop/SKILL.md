---
name: review-loop
description: Review something you made by giving it to fresh reader agents, and be strict about which of their answers you believe. It is heavy, so use it only when the user asks for it. If a piece of work looks important enough, ask the user first. It fits a document, page, manual, API reference, UI, design or codebase that should work for a stranger. It does not replace human review.
---

# The review loop

Give a thing you made to readers who have never seen it. Then be strict about which of their answers you believe.

It is good at two things. It checks **coherence**, meaning whether the thing contradicts itself or its source. It checks **comprehension**, meaning whether a stranger gets what you meant. It cannot judge **merit**, meaning whether the thing was worth making and whether its argument is right. Only a human can judge merit, so the human always reviews at the end. When you report, say which of the three you are reporting on.

**Only run it when the user asks.** It costs many agents and many rounds. If something looks important enough, ask the user, and give a rough size: how many readers and how many rounds. Then size the review with judgment. Two paragraphs need a reader or two and one round, not twenty readers. The budget is whatever the user agreed to.

## Never skip these

Whatever the size of the job:

1. **Run the checks you can run yourself first.** This is step 0.
2. **Confirm the rules with the person who knows.** This is step 1.
3. **Before you stop, have the disposition auditor check your ratings and where each finding came from.** The cast describes it. In the light review, below, its step 5 takes the place of this.
4. **Hand it to the human at the end**, and show them each round on a page they can take in at a glance, as [`human-page.md`](human-page.md) describes. In the light review, a short account in the chat is enough.

**Agree the stakes with the human first.** The stakes are what the thing is, who relies on it, and what a failure would cost them. They set the size of the cast and the number of rounds, and they decide when to stop.

The human usually can't foresee the stakes in full, so don't ask them to. Draft the stakes yourself and have the human confirm them. **Check how the thing is really used** and write it down: what is installed, which setups and data exist, and who runs it. That evidence feeds every rating, through the question "can this happen in the way it is actually used?". **Revisit the stakes instead of setting them once.** The check-in in step 4 is where you do it.

How many readers, which specialists and how many rounds all depend on how big and how important the thing is.

## The light review

For a small, contained change whose decisions the human has already made, the full loop is more than the change needs. Examples are a removal the human asked for, or a rule they chose. The light review has the steps below, and you start every reader in it as in step 3.

1. **Write the plan plainly and freeze it** before anyone reads it, as in step 3, in `review-loop/<change>/PLAN.md`. Work already built gets a plan too. That plan says the work is already built and describes what was built, and the steps below still run.
2. **If the change alters what is stored or computed**, run the peer step from step 5. Give the plan to one critic to break, and give one blind solver only the problem and the human's decisions. Use different models for the two where you can. A plain removal or a change of wording skips this. Peers often find a decision the human never made, and that decision goes to the human, as in step 5.
3. **Build it, run the tests, and use it once** the way its audience will.
4. **Put one fix auditor on the diff**, as in the cast.
5. **Every finding you decline gets a second opinion.** Put the critic's and solver's findings that you declined, with your reasons, in the fix auditor's brief. Send any of the fix auditor's own findings that you decline back to it once, with your reason. Record its answer. A decline is a rating, and with no disposition auditor this is the only check on it. Labelling a finding *old*, as in step 4, is a decline too, and goes the same way.
6. **Record it in the change's folder** and tell the human in the chat what was found and what was done. The record holds the plan, each report, what you took and what you declined and why, and where you filed any old bug. There are no rounds and no page.

It stops being light in three cases: when the human has not made the decisions, when a critic, solver or auditor finds a HIGH that is not *old*, or when the design grows as the peers see it, with more parts or more state. Say so, and run the loop. Places the plan forgot to update to match its own change are coverage, not design. Fold them in, and if you are unsure which kind a place is, ask the human. An old bug that blocks, as step 4 describes, stops the light review instead. It does not start the loop.

---

## Step 0: check what can be checked

You can check many claims mechanically against a source of truth. Run every example, diff against the spec, check every name against the list, and run the tests. Do that before spending a reader, as a script you can re-run each round. What the script finds is verified and gets fixed, unless it is *old*, as step 4 defines.

Know its limit. A check proves that the source *says* something, not that the source is right. Where a domain expert is reachable, that is the question to ask them. And a number copied from a source is not checked until you do the arithmetic it implies. For example, a sample of two per group cannot give the p-value printed beside it.

## Step 1: the success question, and the rules

**Write one sentence a reader must satisfy.** If you can't, stop, because you don't yet know what the work is for. For something read from start to finish, ask *can they say X in their own words after one read?* For something consulted in pieces, such as a reference or a manual, ask *can they complete a named task, looking things up as they go?* Make it about the reader's task, not the document's contents.

**Confirm the rules before any reader sees the thing.** Sometimes the artifact applies rules from outside itself, such as how a business charges, what a regulation requires, or how a group actually works. Then write those rules in plain words, one per line, and have the person who knows confirm them. Readers check the artifact against *your* idea of it, and none of them can tell you the idea is wrong. For a short piece, the rules may just be its facts, such as times, dates and names. Get them from the user. If you can't reach the person who knows, mark the rules unconfirmed in the ledger and tell the user. Once written, the rules are a source of truth for step 0 and a lens for a reader.

## Step 2: choose a profile

A **profile**, kept in [`profiles/`](profiles/), sets the audience. It gives the cast, what each reader gets, the house rules and what is out of scope, and for some genres the stop rule. A profile's rules override this file's rules for its genre.

Some work needs two profiles, for example an app's code and how people use the app. The user usually says which. If you are unsure, ask. With two profiles, take both casts. If one of them has its own stop rule, as code does, that rule decides.

If no profile fits, that is normal. Copy the closest one, replace its cast, and write house rules as *rules with a test attached*: "every step has one checkable action", not "steps should be clear". Start from [`profiles/_template.md`](profiles/_template.md). If the piece has a confirmed voice brief from [`../voice-brief/SKILL.md`](../voice-brief/SKILL.md), its audience is your cast and its style rules are your house rules.

## Step 3: prepare, freeze, run

- **Give readers the artifact as its audience meets it.** That means rendered, not source, except that code readers get the code and a copy they can run. Name any quirk of your materials as deliberate, for example "the screenshots show animations finished". Otherwise you will spend a round on problems your own setup caused. For a large artifact, give each reader the part their lens needs. **Check that they have all of it**, for example by grepping for an appendix's captions or counting the figures. Readers reason fluently around a missing part and never say it is missing.
- **Freeze it.** Commit what readers get, or keep it as a patch in the ledger folder, and record the version. A hash of an uncommitted tree proves what was read, but you cannot compare it later, and step 4's *where it came from* needs that comparison. When you review a change, record the version before the change too. Keep each round's fixes separate, as commits or patches, and never squash them into the change.
- **Keep the copies small and short-lived.** Readers' runnable copies go in one scratch folder per round under `~/.cache`, never inside the project. Link large dependency folders such as `node_modules` and `.venv` into each copy instead of copying them. One review copied a 1.4 GB `.venv` into every copy and left 29 GB behind. Once you have saved a round's reports in the ledger folder, delete its copies. The reports are the record, not the copies.
- **Readers never use the office, and you do not leave that to them.** Start every reader from the shell in its copy, with its materials in the copy. That includes peers and auditors. Start Claude as `claude -p`, since a subagent of your session carries your instructions and memory. Unless they are part of the work, leave `AGENTS.md`, `CLAUDE.md`, `.claude` and `.agents` out of the copy at every level, and quote in the brief whatever a reader needs from them. Use the recipes in [`readers.md`](readers.md), and don't improvise one. The recipes hold the reader to its copy, keep it out of the office, let it run code where it must, and leave a report if it fails.
- **Run readers in parallel, blind to each other.** Spread them across models where you can, and write the model beside each finding. Readers from one model share blind spots, so their agreement is weaker than it looks.
- **Brief them in six parts**, and keep the brief short. [`briefs.md`](briefs.md) has worked examples. The six parts are: who they are; the materials, by absolute path in its copy; the artifact's goal, quoted; their questions, numbered; *"Do not hunt for problems to fill space. 'Nothing wrong' is a real and useful answer"*; and the known quirks. **Don't let briefs grow.** Each round you will want to add where to look and what to skip, until the brief decides the answer. Keep it to the role and the question.
- **Ask whether it worked, not what's wrong.** An agent sent looking for problems returns problems, whether or not they exist. Comprehension readers answer four things: whether it worked for them, what worked, anything actually broken that they are sure of, and the one thing they would change. Named specialists do the fault-hunting, and their brief tells them that nitpicking is their job.

## Step 4: sort what comes back

| Tier | Test | Do |
|---|---|---|
| **1, verified** | Two or more **independent** readers, or checked against the artifact, including by reproducing it yourself | Fix it. File an *old* one instead, as described below |
| **2** | One reader, and checkable against an outside source | Give a second agent the finding and the source, and tell it to *kill* the finding. If the finding survives, it is tier 1. If it dies, record why |
| **3** | Taste, framing, tone | Collect it for the human. Don't act on it |
| **0** | Caused by how you showed it, such as a rendering, an extract or a screenshot | Reject it, out loud, after checking the real artifact |

Independent means different questions, personas and models. Two of twelve readers from the same model agreeing may be one habit counted twice. When in doubt, treat the finding as tier 2 and check it. With only one model available, reproducing a finding yourself is the surer way to tier 1.

Where a profile adds a severity scale, such as HIGH, MEDIUM and LOW for code, the tier says whether to believe a finding and the severity says how much it matters. Verify first, which means tier 1, or tier 2 that survived its kill. Then **fix every verified HIGH and MEDIUM, and fix or decline a verified LOW, with the reason written down** for the auditor. Without a severity scale, fix tier 1. In both cases, leave out the *old* ones, which you file as described below.

**Read every report before acting on any.** Sometimes two readers agree on a defect but disagree on its direction, one saying it is too strong and the other too weak. That means the claim is badly put, not that one of them is wrong. A reader that can see images is reliable on whether something is there, such as a label or a marker, and unreliable on how big it is. Check a finding about size against the figure yourself.

**Each finding's record says how it was checked**: reproduced, read in the source, or taken on the reader's word.

**Each finding also says whom it reaches.** The label is *how it is used now* when the finding can happen in the setups and habits found in step 0 and the stakes. It is *a setup not in use* when the finding needs something nobody here does. The human decides what matters, and this split lets them do it at a glance.

**Each finding also says where it came from.**

- **Reviewing a change**, the label is *new*, *old* or *from a fix in round n*. Test the failure scenario, not the line. Does it happen on the version before the change? If yes, it is *old*. If no, it is *new*, even when the line it fails on is older, because the change is what made it fail. A fault the change was meant to remove and left in place is *new*. *From a fix* is a fault that an earlier round's fix put there or failed to remove. A fault from the original change stays *new* in every round.
- **Reviewing a whole thing**, such as a codebase or a manual, there is no before, so there is no *old* or *new*. Write the commit that made the fault when you can trace it, *from a fix in round n* when a fix made it, or *untraced*. *Untraced* is a finished answer, so don't dig further.

Set the label by checking, and record how you checked. Run or read the scenario on the earlier version. For code, `git blame` is a lead, not the answer. A tier-0 finding has no label.

**Rate an old finding and show it to the human, but do not fix it here or count it toward a stop.** File it where the repository already keeps its bugs, such as a `TODO.md`, an `issues` folder, or GitHub issues if the repository uses them. Otherwise file it in `BUGS.md` at the top of the repository. Do not file it in the office's issues, which are for the office itself, and never only in the ledger, which gets deleted. Do not file or count again a bug that is already filed. With no repository, ask the human where it goes.

**Unless it blocks.** An old bug blocks when the change cannot be checked, or cannot work correctly, until the old bug is fixed. The reason names the check that can't run or the result that is wrong, and how the old bug causes it. A serious old bug elsewhere doesn't block. Before stopping, give the finding, the earlier version and your reason to one fresh agent told to kill the reason, as in tier 2. If the reason dies, file the bug and carry on. If it survives, stop without fixing it. The ledger then says *blocked by <the bug>: <why>*, and both go to the human.

**Every third round, stop for a check-in and wait for the human.** The check-in comes after the round's sorting and disposition audit, and before its fixes. Nothing runs until the human answers, and a yes runs the review to the next check-in. Propose the first of these that fits, with the counts. Here serious means a verified HIGH that is not *old*.

- **Serious findings *from a fix*.** The fixes are the problem. Propose stepping back to rethink the approach, as the peer step does when a plan grows.
- **Other serious findings.** Earlier rounds missed them. Propose fixing them and another round, perhaps with different readers.
- **The direction test.** Compared with the last round, are the findings that are not *old* less severe, in rarer situations, and mostly *from a fix*? Then the review is converging, and what is left is the cost of fixing. Offer to stop. Or, for findings in setups not in use, say *"The last findings are in setups you don't use, X and Y. I propose rating those one step lower from now on. Agree?"* If the findings are not converging, propose fixing and another round, unless the stop rule is met. In that case, offer to stop.

Record the answer, and any new stakes, in the ledger. Fixes that cause new problems are normal. Whom those problems reach decides what is tolerable, not how many there are.

## Step 5: fix, then predict

**Fix what's verified, and leave the rest.** Fixing forty things teaches you nothing about which of them mattered. You file old ones instead of fixing them, as step 4 says.

**Read the tier-3 pile for the opposite signal.** Several readers saying *too long, over-hedged* is the only evidence the loop produces against itself. Otherwise the loop only ever adds caution.

**Prove each fix instead of describing it.** A claim lives in more places than the sentence you edited, such as other versions, alt text, captions and the code that builds it. Count the old wording across the whole thing, change it, count again, and require zero. Check the published thing, not your local copy. **Then use it the way its audience will**: run it, click through it, follow the steps. Readers who only read miss what one real use finds.

**The owner decides what changes outcomes.** Sometimes a fix or build needs a choice that changes what users get or pay, such as a default, a threshold or an edge-case rule. Put that choice to the human in plain words, with your recommendation. A choice written into a comment is still a choice nobody made.

**Before a fix that changes what is stored or computed, think it through with peers.** Write the problem plainly. Give your plan to one or two critics to break, and give the problem alone to one or two others to solve blind. Nobody writes code. Improve the plan and give it to a *fresh* group, never the same one, because nothing has checked what you added since the last pass. Stop when a pass finds only details. **Watch which way it moves.** If each pass makes the plan bigger, with more parts, more state or more places, it is a design problem. Stop and take it to the human. If each pass makes it smaller, build it.

**Explain a design to the human before building it**, in short numbered points, each saying what the user will see or do. Plain words show which parts cost users effort for rare cases.

**Before the next round, write your predictions** in the ledger, and commit or save them before the round runs. Per fix, write what a reader should now say that they couldn't before. Per round, write how many verified findings you expect and of what kind. A prediction written after the results is worth nothing. When readers predicted the wrong sentence that a writer would reach for, turn that prediction into a search and run it on your next draft, before anyone reads it. Count a wording that nearly matches as a hit.

---

## The cast

There are three kinds of reader. **Comprehension readers** are the real audience, across its range. **Specialists** each have one lens. **Adversaries** test one claim the work makes about itself. A profile's cast is a minimum. Before each round ask *what did I just change, what am I afraid of, and who would notice?* The best readers are usually written for the job.

These are the standing readers, and [`briefs.md`](briefs.md) has each one's brief.

| Reader | Gets | Asks | When |
|---|---|---|---|
| **Disposition auditor** | the findings, your ratings and what you did, and the versions behind each *where it came from* | was the sorting fair, and do those labels hold? | **Every round, after sorting, before any decision to stop.** Never retired |
| **Fix auditor** | last round's fixes and nothing else | did each fix land, and did it break anything? | From round 2 |
| **Cost reader** | a measurement on the real target, and a control | what does this cost its user? | When cost matters |
| **A/B reader** | two drafts, unlabelled, in both orders | which is better? | When you have two drafts |

You rate findings about your own work, and the ratings drift softer in ways you can't see from inside. The same mechanism gets rated lower the second time, or a reason sounds right and isn't. That is why you never skip the disposition auditor.

Retire any other reader after two rounds with no tier-1 or tier-2 finding, and record the retirement so nobody adds that reader back.

## The ledger

Keep the ledger in the project, in a folder named **`review-loop/`**, so it can be removed cleanly when the work is done. If there is no project folder, as for an email, ask the user where to keep it, because scratch space is lost when the session ends. The ledger is `review-loop/LEDGER.md`. It starts with this line and follows this shape:

```markdown
# Review-loop ledger: <the thing>
*Kept by the review-loop skill. Safe to delete this folder once the work is done.*

Success question: <one sentence>
Rules confirmed with: <who, when>
Reviewing: <a change, from <version before>; old bugs filed in: <where> | a whole thing>

## Round <n>, <date>, <version reviewed>
Predictions (written before the round): <per fix; per round>
Cast: <reader, model, what each got>
| Finding | Reader (their rating) | Ours | From | How checked | Done |
What happened against the predictions: <one line each>
Believed, and wrong: <the claim as you held it, quoted; or "none this round">

## Mistakes the next author will make
<specific enough that the human would recognise one when it happens>
```

Save each reader's report beside it. **Believed, and wrong** is required each round, because a summary deletes the wrong path, so you have to ask for it. The closing list of mistakes is for the human. The human is the only reader who persists across sessions and can tell you the record failed.

Changing the method, meaning the cast, the briefs or the gates, makes rounds incomparable. Say so in the ledger and count from there.

## When to stop

Judge on ratings the disposition auditor has checked, never on your own. A profile's stop rule replaces these for its genre, but it does not replace the check-in in step 4. *Old* findings count toward none of them, as step 4 says. A block ends the review, and it is not a clean stop.

- Two rounds in a row have no tier-1 finding.
- Everything verified is in one area. Fix it and stop.
- All that is left is tier 3. The question has become *is it good*.
- For something read in pieces, every section has been exercised once.
- The budget is spent.

- What is left is edge cases of rare timing that the stakes don't justify chasing. Say so in one line, and stop.

Then clean up. Delete every scratch copy and temporary file the review made, and say in the closing note what was removed and what was left. Leave the filed old bugs, because they outlive the review. Then hand it to the human. That was always the point.

## Showing the human

After every round, rebuild the human's page. It is one self-contained HTML file next to the ledger, with diagrams first, every finding in the human's terms, and the decisions in one box. [`human-page.md`](human-page.md) says what the page must do, and the project decides how it looks. Keep the chat message to the round in one line, the decision needed, and the path to the page.

---

[`evidence.md`](evidence.md) explains why each rule is here and where the method is thin. It is for maintaining this skill, not for running it.
