---
name: review-loop
description: Review something you made by giving it to fresh reader agents and being disciplined about which answers you believe. Heavy, so use it only when the user asks for it; if a piece of work looks important enough, ask the user first. Fits a document, page, manual, API reference, UI, design or codebase that should work for a stranger. Not a substitute for human review.
---

# The review loop

Give a thing you made to readers who have never seen it, then be disciplined
about which of their answers you believe.

It is good at two things: **coherence** (does the thing contradict itself or its
source?) and **comprehension** (does a stranger get what you meant?). It is blind
to **merit** (was it worth making? is the argument right?). Only a human can
judge merit, so the human always reviews at the end. When you report, say which
of the three you are reporting on.

**Only run it when the user asks.** It costs many agents and many rounds. If
something looks important enough, ask the user, with a rough size (how many
readers, how many rounds). Then size it with judgment: two paragraphs need a
reader or two and one round, not twenty readers; the budget is whatever the
user agreed to.

## Never skip these

Whatever the size of the job:

1. **Run the checks you can run yourself first** (step 0).
2. **Confirm the rules with the person who knows** (step 1).
3. **Have the disposition auditor check your ratings, and where each finding
   came from, before you stop** (the cast).
   In the light review, below, its step 5 stands in for this.
4. **Hand it to the human at the end**, and show them each round on a page they
   can see at a glance ([`human-page.md`](human-page.md)). In the light review,
   a short account in the chat is enough.

**Agree the stakes with the human first**: what the thing is, who relies on it,
what a failure would cost them. The stakes size the cast and the rounds, and set
when to stop.

The human usually can't foresee the stakes in full, so don't ask them to: draft
them yourself and have them confirm. **Check how the thing is really used**
(what is installed, which setups and data exist, who runs it) and write it down;
that evidence feeds every rating ("can this happen in the way it is actually
used?"). **The stakes are revisited, not set once** (the stakes check, step 4).

Everything else (how many readers, which specialists, how many rounds) scales
with how big and how important the thing is.

## The light review

For a small, contained change whose decisions the human has already made (a
removal they asked for, a rule they chose), the full loop is more than the
change needs. The light review is:

1. **Write the plan plainly and commit it** before anyone reads it, in
   `review-loop/<change>/PLAN.md`.
2. **If the change alters what is stored or computed**, the peer step (step 5):
   one critic to break the plan, and one blind solver given only the problem
   and the human's decisions, on different models where you can. A plain
   removal or a change of wording skips this.
3. **Build it, run the tests, and use it once** the way its audience will.
4. **One fix auditor on the diff**, as in the cast.
5. **Every finding you decline gets a second opinion.** Put the critic's and
   solver's findings you declined, with your reasons, in the fix auditor's
   brief; send any of the fix auditor's own findings you decline back to it
   once, with your reason. Record its answer. A decline is a rating, and with
   no disposition auditor this is the only check on it. Labelling a finding
   *old* (step 4) is a decline too, and goes the same way.
6. **Record it in the change's folder** (the plan, each report, what was taken
   and what was declined, and why, and where any old bug was filed) and tell the
   human in the chat what was found and what was done. No rounds, no page.

It stops being light when the human has not made the decisions, when a
critic, solver or auditor finds a HIGH that is not *old*, or when the plan grows
as the peers see it. Say so, and run the loop. An old bug that blocks (step 4)
stops the light review instead; it does not start the loop.

---

## Step 0: check what can be checked

Many claims can be checked mechanically against a source of truth: run every
example, diff against the spec, check every name against the list, run the
tests. Do that before spending a reader, as a script you can re-run each round.
What it finds is verified and gets fixed, unless it is *old* (step 4).

Know its limit: a check proves the source *says* it, not that the source is
right. Where a domain expert is reachable, that is the question to ask them.
And a number copied from a source is not checked until you do the arithmetic it
implies: a sample of two per group cannot give the p-value printed beside it.

## Step 1: the success question, and the rules

**Write one sentence a reader must satisfy.** If you can't, stop: you don't yet
know what the work is for. For something read start to finish: *can they say X
in their own words after one read?* For something consulted in pieces (a
reference, a manual): *can they complete a named task, looking things up as they
go?* Make it about the reader's task, not the document's contents.

**Confirm the rules before any reader sees the thing.** If the artifact applies
rules from outside itself (how a business charges, what a regulation requires,
how a group actually works), write them in plain words, one per line, and have
the person who knows confirm them. Readers check the artifact against *your*
idea of it; none of them can tell you the idea is wrong. For a short piece the
rules may just be its facts (times, dates, names): get them from the user. If
the person who knows can't be reached, mark the rules unconfirmed in the ledger
and tell the user. Once written, the rules
are a source of truth for step 0 and a lens for a reader.

## Step 2: choose a profile

A **profile** (in [`profiles/`](profiles/)) sets the audience: the cast, what
each reader gets, the house rules, what's out of scope, and for some genres the
stop rule. A profile's rules override this file's for its genre.

Some work needs two profiles (an app's code, and how people use it). The user
usually says; if unsure, ask. With two, take both casts. If one has its own
stop rule (code does), that one decides.

No profile fits? That's normal. Copy the closest, replace its cast, and write
house rules as *rules with a test attached* ("every step has one checkable
action", not "steps should be clear"). Start from
[`profiles/_template.md`](profiles/_template.md). If the piece has a confirmed
voice brief ([`../voice-brief/SKILL.md`](../voice-brief/SKILL.md)), its
audience is your cast and its style rules are house rules.

## Step 3: prepare, freeze, run

- **Give readers the artifact as its audience meets it**: rendered, not source
  (code readers get the code and a copy they can run). Name any quirk of your
  materials as deliberate ("the screenshots show animations finished"), or you
  will spend a round on your own harness. For a large artifact, give each reader
  the slice their lens needs. **Check they have all of it** (grep for an
  appendix's captions, count the figures): readers reason fluently around a
  part that is missing and never say so.
- **Freeze it.** Commit what readers get, or keep it as a patch in the ledger
  folder, and record the version. A hash of an uncommitted tree proves what was
  read but cannot be compared later, and step 4's *where it came from* needs the
  comparison. Reviewing a change, record the version before it too, and commit
  each round's fixes on their own, never squashed into the change.
- **Keep the copies small and short-lived.** Readers' runnable copies go in one
  scratch folder per round, never inside the project or the home folder. Link
  large dependency folders (`node_modules`, `.venv`) into each copy instead of
  copying them: one review copied a 1.4 GB `.venv` into every copy and left
  29 GB behind. Once a round's reports are saved in the ledger folder, delete
  its copies: the reports are the record, not the copies.
- **Run readers in parallel, blind to each other.** Spread them across models
  where you can and write the model beside each finding: readers from one model
  share blind spots, so their agreement is weaker than it looks.
- **Brief them in six parts**, kept short ([`briefs.md`](briefs.md) has worked
  examples): who they are; the materials, by absolute path; the artifact's goal,
  quoted; their questions, numbered; *"Do not hunt for problems to fill space.
  'Nothing wrong' is a real and useful answer"*; and the known quirks. **Don't
  let briefs grow.** The temptation is to add, each round, where to look and
  what to skip, until the brief decides the answer. Keep it to the role and the
  question.
- **Ask whether it worked, not what's wrong.** An agent sent looking for problems
  returns problems, present or not. Comprehension readers answer: did it work
  for you; what worked; anything actually broken (only what they're sure of);
  the one thing you'd change. Fault-hunting goes to named specialists, told
  that nitpicking is their job.

## Step 4: sort what comes back

| Tier | Test | Do |
|---|---|---|
| **1, verified** | Two or more **independent** readers, or checked against the artifact (including reproducing it yourself) | Fix (an *old* one is filed instead: below) |
| **2** | One reader, checkable against an outside source | Give a second agent the finding and the source, and tell it to *kill* the finding. Survives: tier 1. Dies: record why |
| **3** | Taste, framing, tone | Collect for the human. Don't act |
| **0** | Caused by how you showed it (a rendering, an extract, a screenshot) | Reject, out loud, after checking the real artifact |

Independent means different questions, personas and models. Two of twelve
same-model readers agreeing may be one habit counted twice; when in doubt,
treat it as tier 2 and check. With only one model available, reproducing a
finding yourself is the surer way to tier 1.

Where a profile adds a severity scale (code: HIGH, MEDIUM, LOW), the tier says
whether to believe a finding and the severity how much it matters. Verify first
(tier 1, or tier 2 that survived its kill), then: **fix every verified HIGH and
MEDIUM; a verified LOW is fixed or declined, with the reason written down** for
the auditor. Without a severity scale, fix tier 1. In both cases, not the *old*
ones: they are filed (below).

**Read every report before acting on any.** Two readers who agree on a defect
but disagree on its direction (too strong, too weak) mean the claim is badly
put, not that one of them is wrong. A reader that can see images is reliable
on whether something is there (a label, a marker) and unreliable on how big it
is: check a finding about magnitude against the figure yourself.

**Each finding's record says how it was checked**: reproduced, read in the
source, or taken on the reader's word.

**Each finding also says whom it reaches**: *how it is used now* (it can happen
in the setups and habits found in step 0 and the stakes), or *a setup not in
use* (it needs something nobody here does). The human decides what matters;
this split is what lets them do it at a glance.

**Each finding also says where it came from.**

- **Reviewing a change**: *new*, *old*, or *from a fix (round n)*. Test the
  failure scenario, not the line: does it happen on the version before the
  change? Yes is *old*. No is *new*, even when the line it fails on is older,
  because the change is what made it fail. A fault the change was meant to
  remove and left in place is *new*. *From a fix* is a fault an earlier round's
  fix put there or failed to remove; a fault from the original change stays
  *new* in every round.
- **Reviewing a whole thing** (a codebase, a manual), there is no before, so no
  *old* or *new*. Write the commit that made the fault when you can trace it,
  *from a fix (round n)* when a fix made it, or *untraced*. *Untraced* is a
  finished answer; don't dig.

Set it by checking (run or read the scenario on the earlier version; for code,
`git blame` is a lead, not the answer) and record how. A tier-0 finding has none.

**An old finding is rated and shown to the human, but not fixed here and not
counted toward a stop.** File it where the repository already keeps its bugs (a
`TODO.md`, an `issues` folder, GitHub issues in use), otherwise in `BUGS.md` at
the top of the repository. Not in the office's issues, which are for the office
itself, and never only in the ledger, which gets deleted. One already filed is
not filed or counted again. With no repository, ask the human where it goes.

**Unless it blocks**: the change cannot be checked, or cannot work correctly,
until the old bug is fixed. The reason names the check that can't run or the
result that is wrong, and how the old bug causes it; a serious old bug elsewhere
doesn't block. Before stopping, give the finding, the earlier version and your
reason to one fresh agent told to kill the reason (as in tier 2). If the reason
dies, file the bug and carry on. If it survives, stop without fixing it: the
ledger says *blocked by <the bug>: <why>*, and both go to the human.

**The stakes check, every two or three rounds**, and sooner when the direction
test below says the findings have moved into rare ground. Put one item in the
round's decision box, with the evidence: *"The last findings are in setups you
don't use (X, Y). I propose rating those one step lower from now on. Agree?"*
It is not a separate stop: the loop carries on with the proposal, and the
human's answer, when it comes, decides. Record the answer in the ledger as the
new stakes.

**The direction test, every round from round 3**: compared with the last round,
are the findings that are not *old* (1) less severe, (2) in rarer situations,
and (3) mostly *from a fix* (count them)? Yes to all three means the work is
converging and what is left is the cost of fixing: bring the stakes check
forward rather than chase it. Fixes causing new problems is normal; what is
tolerable is set by whom they reach, not by their count.

## Step 5: fix, then predict

**Fix what's verified, and leave the rest**: fixing forty things teaches you
nothing about which mattered. Old ones are filed, not fixed (step 4).

**Read the tier-3 pile for the opposite signal.** Several readers saying *too
long, over-hedged* is the only evidence the loop produces against itself; the
loop otherwise only ever adds caution.

**Prove each fix; don't describe it.** A claim lives in more places than the
sentence you edited (other versions, alt text, captions, the code that builds
it). Count the old wording across the whole thing, change it, count again, and
require zero. Check the published thing, not your local copy. **Then use it the
way its audience will** (run it, click through it, follow the steps): readers
who only read miss what one real use finds.

**The owner decides what changes outcomes.** When a fix or build needs a choice
that changes what users get or pay (a default, a threshold, an edge-case rule),
put it to the human in plain words with your recommendation. A choice written
into a comment is still a choice nobody made.

**Before a fix that changes what is stored or computed, think it through with
peers.** Write the problem plainly. Give your plan to one or two critics to
break, and the problem alone to one or two others to solve blind; nobody writes
code. Improve the plan and give it to a *fresh* group, never the same one: what
you added since the last pass is what nothing has checked. Stop when a pass
finds only details. **Watch which way it moves:** if each pass makes the plan
bigger (more parts, more state, more places), it's a design problem: stop and
take it to the human. If each pass makes it smaller, build it.

**Explain a design to the human before building it**, in short numbered points,
each saying what the user will see or do. Plain words show the parts that cost
users effort for rare cases.

**Before the next round, write your predictions** in the ledger, and commit or
save them before the round runs: per fix, what a reader should now say that
they couldn't before; per round, how many verified findings and of what kind. A
prediction written after the results is worth nothing. Where readers predicted
the wrong sentence a writer would reach for, turn that into a search and run it
on your next draft, before anyone reads it; count a near-miss wording as a hit.

---

## The cast

Three kinds: **comprehension readers** (the real audience, across its range),
**specialists** (one lens each), **adversaries** (testing one claim the work
makes about itself). A profile's cast is a floor; before each round ask *what
did I just change, what am I afraid of, and who would notice?* The best readers
are usually written for the job.

Standing readers ([`briefs.md`](briefs.md) has each brief):

| Reader | Gets | Asks | When |
|---|---|---|---|
| **Disposition auditor** | the findings, your ratings and what you did, and the versions behind each *where it came from* | was the sorting fair, and do those labels hold? | **Every round, after sorting, before any decision to stop.** Never retired |
| **Fix auditor** | last round's fixes and nothing else | did each land, and break anything? | From round 2 |
| **Cost reader** | a measurement on the real target, and a control | what does this cost its user? | When cost matters |
| **A/B reader** | two drafts, unlabelled, both orders | which is better? | When you have two drafts |

You rate findings about your own work, and the ratings drift soft in ways you
can't see from inside: the same mechanism rated lower the second time, a reason
that sounds right and isn't. That is why the disposition auditor is never
skipped.

Retire any other reader after two rounds with no tier-1 or tier-2 finding, and
record it so nobody re-adds it.

## The ledger

In the project, in a folder named **`review-loop/`** so it can be removed
cleanly when the work is done (no project folder, as for an email: ask the user
where to keep it; scratch space is lost when the session ends): `review-loop/LEDGER.md`, starting with this line
and following this shape:

```markdown
# Review-loop ledger: <the thing>
*Kept by the review-loop skill. Safe to delete this folder once the work is done.*

Success question: <one sentence>
Rules confirmed with: <who, when>
Reviewing: <a change, from <version before> | a whole thing>; old bugs filed in: <where>

## Round <n>, <date>, <version reviewed>
Predictions (written before the round): <per fix; per round>
Cast: <reader, model, what each got>
| Finding | Reader (their rating) | Ours | From | How checked | Done |
What happened against the predictions: <one line each>
Believed, and wrong: <the claim as you held it, quoted; or "none this round">

## Mistakes the next author will make
<specific enough that the human would recognise one when it happens>
```

Save each reader's report beside it. **Believed, and wrong** is required each
round: a summary deletes the wrong path, so it has to be asked for. The closing
list of mistakes is for the human, the only reader who persists across sessions
and can tell you the record failed.

Changing the method (cast, briefs, gates) makes rounds incomparable: say so in
the ledger and count from there.

## When to stop

Judged on ratings the disposition auditor has checked, never on your own. A
profile's stop rule replaces these for its genre. *Old* findings count toward
none of them (step 4); a block ends the review, and is not a clean stop.

- Two rounds in a row with no tier-1 finding.
- Everything verified is in one area: fix it and stop.
- All that's left is tier 3: the question has become *is it good*.
- For something read in pieces: every section has been exercised once.
- The budget is spent.

- What's left is rare-timing edge cases the stakes don't justify chasing: say so,
  in one line, and stop.

Then clean up: delete every scratch copy and temporary file the review made, and
say in the closing note what was removed and what was left. Leave the filed old
bugs: they outlive the review. Then hand it to the
human. That was always the point.

## Showing the human

After every round, rebuild the human's page: one self-contained HTML file next to
the ledger, diagrams first, every finding in their terms, the decisions in one
box. What it must do is in [`human-page.md`](human-page.md); how it looks is up to
the project. Keep the chat message to the round in one line, the decision needed,
and the path to the page.

---

Why each rule is here, and where the method is thin, is in
[`evidence.md`](evidence.md): for maintaining this skill, not for running it.
