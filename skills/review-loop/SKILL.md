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
something looks important enough, ask the user. Then size it with judgment: two
paragraphs don't need twenty readers.

## Never skip these

Whatever the size of the job:

1. **Run the checks you can run yourself first** (step 0).
2. **Confirm the rules with the person who knows** (step 1).
3. **Have the disposition auditor check your ratings before you stop** (the cast).
4. **Hand it to the human at the end.**

Everything else (how many readers, which specialists, how many rounds) scales
with how big and how important the thing is.

---

## Step 0: check what can be checked

Many claims can be checked mechanically against a source of truth: run every
example, diff against the spec, check every name against the list, run the
tests. Do that before spending a reader, as a script you can re-run each round.
What it finds is verified and gets fixed.

Know its limit: a check proves the source *says* it, not that the source is
right. Where a domain expert is reachable, that is the question to ask them.

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
idea of it; none of them can tell you the idea is wrong. Once written, the rules
are a source of truth for step 0 and a lens for a reader.

## Step 2: choose a profile

A **profile** (in [`profiles/`](profiles/)) sets the audience: the cast, what
each reader gets, the house rules, what's out of scope, and for some genres the
stop rule. A profile's rules override this file's for its genre.

Some work needs two profiles (an app's code, and how people use it). The user
usually says; if unsure, ask. With two, take both casts, and the stricter stop
rule.

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
  the slice their lens needs.
- **Freeze it.** Commit or snapshot what readers get, and record the version.
- **Run readers in parallel, blind to each other.** Spread them across models
  where you can and write the model beside each finding: readers from one model
  share blind spots, so their agreement is weaker than it looks.
- **Brief them in six parts**, kept short ([`briefs.md`](briefs.md) has worked
  examples): who they are; the materials, by absolute path; the artifact's goal,
  quoted; their questions, numbered; *"Do not hunt for problems to fill space.
  'Nothing wrong' is a real and useful answer"*; and the known quirks. **Briefs
  grow** round by round (where to look, what to skip) until they decide the
  answer. Keep them to the role and the question.
- **Ask whether it worked, not what's wrong.** An agent sent looking for problems
  returns problems, present or not. Comprehension readers answer: did it work
  for you; what worked; anything actually broken (only what they're sure of);
  the one thing you'd change. Fault-hunting goes to named specialists, told
  that nitpicking is their job.

## Step 4: sort what comes back

| Tier | Test | Do |
|---|---|---|
| **1, verified** | Two or more **independent** readers, or checkable against the artifact | Fix |
| **2** | One reader, checkable against an outside source | Give a second agent the finding and the source, and tell it to *kill* the finding. Survives: tier 1. Dies: record why |
| **3** | Taste, framing, tone | Collect for the human. Don't act |
| **0** | Caused by how you showed it (a rendering, an extract, a screenshot) | Reject, out loud, after checking the real artifact |

Independent means different questions, personas and models. Two of twelve
same-model readers agreeing may be one habit counted twice; when in doubt,
treat it as tier 2 and check.

Where a profile adds a severity scale (code: HIGH, MEDIUM, LOW), the tier says
whether to believe a finding and the severity how much it matters. **Fix every
verified HIGH and MEDIUM. A verified LOW is fixed or declined, with the reason
written down** for the auditor.

**Each finding's record says how it was checked**: reproduced, read in the
source, or taken on the reader's word.

## Step 5: fix, then predict

**Fix tier 1 only, and leave the rest**: fixing forty things teaches you nothing
about which mattered.

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

**Before the next round, write your predictions** in the ledger: per fix, what a
reader should now say that they couldn't before; per round, how many verified
findings and of what kind. A prediction written after the results is worth
nothing.

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
| **Disposition auditor** | the findings, your ratings and what you did | was the sorting fair? | **Every round, after sorting, before any decision to stop.** Never retired |
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
cleanly when the work is done: `review-loop/LEDGER.md`, starting with this line
and following this shape:

```markdown
# Review-loop ledger: <the thing>
*Kept by the review-loop skill. Safe to delete this folder once the work is done.*

Success question: <one sentence>
Rules confirmed with: <who, when>

## Round <n>, <date>, <version reviewed>
Predictions (written before the round): <per fix; per round>
Cast: <reader, model, what each got>
| Finding | Reader (their rating) | Ours | How checked | Done |
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
profile's stop rule replaces these for its genre.

- Two rounds in a row with no tier-1 finding.
- Everything verified is in one area: fix it and stop.
- All that's left is tier 3: the question has become *is it good*.
- For something read in pieces: every section has been exercised once.
- The budget is spent.

Then hand it to the human. That was always the point.

---

Why each rule is here, and where the method is thin, is in
[`evidence.md`](evidence.md): for maintaining this skill, not for running it.
