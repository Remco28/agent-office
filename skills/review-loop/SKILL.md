---
name: review-loop
description: Review something you made by giving it to many cheap reader agents and being disciplined about which answers you believe. Use when a document, page, manual, API reference, UI or proposal is drafted and you want to know whether it works for a stranger, before a human reviews it. Not a substitute for human review.
---

# The review loop

Give a thing you made to readers who have never seen it, then be disciplined
about which of their answers you believe.

It measures an artifact against **its own stated goal**. It cannot tell you
whether the work is *good* — only a human can, and that review is never
optional. Say so when you report results.

Evidence behind the rules, and the biases to correct for:
[`evidence.md`](evidence.md). Read it once, not before your first round.

---

## Step 0 — Verify what is checkable, before you spend a reader on it

**Most artifacts contain claims that can be checked mechanically against a source
of truth.** Do that first. It is cheaper than a reader, it returns tier-1
findings directly, and it leaves the reader budget for the thing only readers can
do: whether a stranger understands.

| Artifact | Source of truth | The check |
|---|---|---|
| API reference | the server, the schema | run every example, diff against the spec |
| Manual | the equipment spec, the safety standard | every part named is in the parts list; every warning precedes its step |
| Explainer | the paper or source it explains | every claim traced to a verbatim quote |
| Any | its own text | a quote contradicting another quote; a rule it states then breaks |

Write these as a script you can re-run each round, not a one-off pass. Findings
go straight to tier 1.

## Step 1 — Write the success question

One sentence a reader must satisfy. **If you cannot write it, stop — you do not
yet know what the work is for.** It is the single most important input, and its
*shape* depends on how the artifact is read:

- **Read start to finish** (explainer, essay, report) → *can they say X in their
  own words, from memory, after one pass?*
- **Consulted in fragments** (reference, manual, API docs) → *can they complete
  a named task with a verifiable outcome, looking things up as they go?* Recall
  is the wrong test here; the task passing or failing is the measurement, and
  every lookup that failed is a finding.

Make it about the reader's task, not the document's contents.

## Step 2 — Choose or write a profile

A **profile** supplies the audience: the cast, the materials each reader gets,
the house rules the artifact must obey, and what is out of scope. See
[`profiles/`](profiles/).

**No profile fits? That is the normal case.** Copy the closest one, throw away
its cast, and write your house rules as *rules with a test attached* — "every
step has one checkable action", not "steps should be clear". Start from
[`profiles/_template.md`](profiles/_template.md). Writing a profile for a new
genre takes about twenty minutes and is reusable forever.

## Step 3 — Prepare, freeze, and run the cast

**Prepare.** Give readers the artifact as its audience meets it — rendered, not
source. Mark your own annotations so a stranger cannot mistake them for content,
and **name any known artifact of your materials as deliberate** ("the
screenshots show animations finished; that is intentional"). Skip that and you
will spend a round triaging your own harness. For a large artifact, give each
reader the slice their lens needs rather than the whole thing.

**Freeze.** If readers will *run* the artifact, commit or snapshot first and hand
them the frozen copy — otherwise a reader tests a state no version contains. For
a static document, give every reader the identical file and record its version.

**Run.** All readers in parallel, each blind to the others — convergence is only
evidence if it is independent. You need a way to spawn parallel subagents; a
cheap model tier is sufficient and has been enough in practice.

**Every brief has six parts.** This skeleton is the minimum;
[`briefs.md`](briefs.md) is how to make them good, and is worth reading before
you write the first one.

1. **Who they are** — concrete, one or two sentences, not a job title.
2. **The materials**, by absolute path, with what each one is.
3. **The artifact's stated goal**, quoted.
4. **Their questions**, numbered.
5. *"Do not hunt for problems to fill space. 'Nothing wrong' is a real and
   useful answer."*
6. **Known artifacts of the materials**, named as deliberate.

> **Ask whether it succeeded. Do not ask what is wrong with it.** Ask an agent to
> find problems and it will find problems; that is not evidence. Nitpicking goes
> to named **specialists** told that nitpicking is the job. Never ask one persona
> to both judge success and hunt faults.

Comprehension readers answer four questions, in this order:

1. **Did it work, for you?** Plus the success criterion met in their own terms.
2. **What worked.** *(Not a courtesy — it tells you what to protect when you cut.)*
3. **Anything actually broken or wrong** — only what they are confident about.
4. **The one thing you would change.**

## Step 4 — Triage by confidence

| Tier | Test | Do |
|---|---|---|
| **1** | Two or more independent readers, **or** checkable against the artifact itself | Fix |
| **2** | One reader, checkable against an outside source | Verify, then fix or decline |
| **3** | Taste, framing, tone | Collect. Surface to the human. Do not act |
| **0** | An artifact of how you showed it to them | Reject, out loud |

Two gates before you believe anything:

- **Anything a reader could only have seen through your pipeline is tier 0 until
  you reproduce it against the real artifact** — a rendering, a screenshot, a
  text extract, a conversion. This is not a licence to dismiss layout faults: if
  page breaks, figure placement or cross-references are how your audience meets
  the thing, they are real findings. The test is whether the fault is in the
  artifact or in the copy you handed over.
- **For every tier-2 finding, give a second cheap agent the finding and the
  source and tell it to *kill* the finding.** Not assess — kill. It returns
  confirmed or dead, with the evidence it used.

## Step 5 — Fix tier 1 only, check the counterweight, then predict

**Fix tier 1. Leave the rest.** High-confidence fixes collapse low-confidence
ones, and if you change forty things and the next round is clean you have learned
nothing about which thirty-nine mattered.

**Read the tier-3 pile for the opposite signal before acting.** Several readers
saying *over-corrected, over-hedged, too long* is convergence too, and it is the
only evidence the loop generates against itself. See the ratchet in
[`evidence.md`](evidence.md).

**Prove each fix, do not describe it.** Your own account is not evidence.
A claim lives in more places than the sentence you are editing: every content
variant, every alternative representation (alt text, captions, transcripts,
fallbacks), and every string in the code that builds the artifact. Where two code
paths produce the same thing, make them call one function.

**Then write `PREDICTIONS-R<n>.md` before the next round**, at two levels.
*Per fix:* what should a reader now say that they could not have said last round?
Outcomes: landed / didn't land / landed and broke something adjacent — the last
is the most valuable, because you have mapped a dependency.
*Per round:* the tier-1 count and the shape of what will come back.

A prediction written after the results is worth nothing.

---

## The cast

Three kinds. A profile's list is a **floor, not a ceiling** — before each round
ask *what did I just change, what am I afraid of, and who would notice?* and
write a reader for each answer. The best readers are usually bespoke.

- **Comprehension readers** — the real audience, across its range of abilities.
- **Specialists** — one lens each, told that nitpicking is the job.
- **Adversaries** — testing one claim the work makes about itself.

Four earn a standing place from round two onward. Their materials are the
non-obvious part, and [`briefs.md`](briefs.md) has each one written out:

| Reader | Materials | Asks |
|---|---|---|
| **Fix auditor** | last round's fixes, and nothing else | did each land? |
| **Disposition auditor** | the findings and what you did with each | was the triage fair? |
| **Cost reader** | the artifact, plus a control | what does this cost its user — time, money, CPU, attention, quota? |
| **A/B reader** | two drafts, unlabelled, both orderings | which is better? |

Retire a persona after two rounds with no tier-1 or tier-2 finding, and record it
so nobody re-adds it.

## Keeping the records

In the **project**, not in this skill: a `review/loop/` folder with `LEDGER.md`
(rounds, tier-1 counts, false findings, what each round bought) and
`PREDICTIONS-R<n>.md`. The skill is reusable; the records are not.

**Changing the method invalidates the comparison.** Tier-1 counts across rounds
run with different casts, framings or gates are not comparable. Reset the
baseline when the method settles, and say so in the ledger.

## When to stop

- Two consecutive rounds with **zero tier-1 findings**.
- All tier-1 findings in one area — fix that area and stop.
- Everything left is tier 3. The question has become *is this good*.
- For an artifact read in fragments, **coverage**: every endpoint, procedure or
  section has been exercised at least once.
- The budget is spent.

Then hand it to the human. That was always the point.
