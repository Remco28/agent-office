---
name: review-loop
description: Review something you made by giving it to many cheap reader agents and being disciplined about which answers you believe. Use when a document, page, manual, API reference, UI or proposal is drafted and you want to know whether it works for a stranger, before a human reviews it. Not a substitute for human review.
---

# The review loop

Give a thing you made to readers who have never seen it, then be disciplined
about which of their answers you believe.

It measures an artifact against **its own stated goal**, along two axes it is
genuinely good at: **coherence** — does the thing contradict itself, or its
source — and **comprehension** — does a stranger come away with what you
intended. Both are real components of quality.

What it is blind to is **merit**: whether the thing was worth making, whether
the argument is right, whether a sentence sings. Only a human can say that, and
that review is never optional. When you report results, say which of the three
you are reporting on.

Evidence behind the rules, and the biases to correct for:
[`evidence.md`](evidence.md). Read it once, not before your first round.

---

## Step 0 — Verify what is checkable, before you spend a reader on it

**Most artifacts contain claims that can be checked mechanically against a source
of truth.** Do that first. It is cheaper than a reader, its findings are
tier 1 once you have confirmed the check itself is not the fault, and it leaves
the reader budget for the thing only readers can do: whether a stranger
understands.

| Artifact | Source of truth | The check |
|---|---|---|
| API reference | the server, the schema | run every example, diff against the spec |
| Manual | the equipment spec, the safety standard | every part named is in the parts list; every warning precedes its step |
| Explainer | the paper or source it explains | every claim traced to a verbatim quote — necessary, **not sufficient**: see below |
| Any | its own text | a quote contradicting another quote; a rule it states then breaks |

Write these as a script you can re-run each round, not a one-off pass. Check
the first few hits by hand: a checker is code, and a buggy one produces
confident false findings. Once it is trusted, what it finds goes straight to
tier 1.

**Know what the check does not reach.** Tracing a claim to its source proves the
source says it. It does not prove the source *bears the weight you put on it* —
the chain is your artifact → the source's prose → the data behind the source,
and a mechanical check only ever verifies the first link. A trace can run
clean while the source's own author still finds the artifact overstating what
was shown. **When a domain expert is reachable, that second link is the thing to
ask them about, and it is the one thing no cast and no script can do for
you.**

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
genre is usually quick, and the profile is reusable.

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

**Run.** All readers in parallel, each blind to the others. A small cheap model
has been enough for the reading itself.

**Spread the cast across models, and write the model beside each finding.**
Readers drawn from one model share its blind spots, so their agreement is worth
less than the count suggests. Two models disagreeing about what they noticed is
information; two instances of one model agreeing may only be one opinion. If
you have a single model, say so in the record and treat every convergence as a
strong hint rather than proof.

**A round-one default, if you want one:** six comprehension readers across at
least two models, plus one or two specialists. Adjust from there.

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

> **Ask whether it succeeded. Do not make fault-finding the job.** Ask an agent
> to go looking for problems and it will return problems, present or not; that
> is not evidence. Hunting is given to named **specialists** who are told that
> nitpicking is their job.
>
> This is about the *frame*, not about refusing defect reports. A comprehension
> reader is asked what it understood, and then — question 3 below — whether
> anything was broken, *limited to what it is confident about*. That is a
> reader volunteering a fault, which is worth a great deal. What you must not do
> is set someone loose to find faults and then read their list as a verdict on
> whether the thing worked.

Comprehension readers answer four questions, in this order:

1. **Did it work, for you?** Plus the success criterion met in their own terms.
2. **What worked.** *(Not a courtesy — it tells you what to protect when you cut.)*
3. **Anything actually broken or wrong** — only what they are confident about.
4. **The one thing you would change.**

## Step 4 — Triage by confidence

| Tier | Test | Do |
|---|---|---|
| **1** | Two or more **independent** readers, **or** one reader whose claim you have **checked** against the artifact itself | Fix |
| **2** | One reader, checkable against an outside source | Verify. Survives → treat as tier 1. Dies → record why |
| **3** | Taste, framing, tone | Collect. Surface to the human. Do not act |
| **0** | An artifact of how you showed it to them | Reject, out loud |

**A single reader's claim becomes tier 1 when you have checked it, not because
it could be checked.** Readers can be confident, specific and wrong; a claim
that is easy to verify is cheap to verify, so verify it before fixing.

**"Independent" is doing the work in tier 1, and a large cast makes it cheap.**
Two readers agreeing is evidence when they are different people asked different
questions on different models. Two of twelve same-model readers agreeing may be
one habit counted twice. Weigh a convergence against how many readers *could*
have said it and how differently they were asked — and when in doubt, treat it
as tier 2 and go and check.

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

**Fix tier 1 — including any tier-2 finding that survived its kill attempt —
and leave the rest.** High-confidence fixes collapse low-confidence
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

**Assert on the claim, not on the sentence.** Replacing three occurrences with
three exact-sentence checks, each requiring one match, passes three times and
still ships a fourth occurrence worded slightly differently. Instead: count the
retired phrase across the whole tree, make the change, count again, **require
zero** — and search whitespace-insensitively, because `grep` is line-based and
the same claim wrapped across two lines is invisible to it.

**And verify against the thing the audience will get.** If there is a build or
a deploy between your edit and the reader, a check that runs too early reads
the *previous* build and reports success. Wait for the published artifact to
carry the commit you just made, then look.

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

**Readers are cheap; your own context is not.** The bottleneck is usually not
the cost of running readers but your capacity to read what comes back. So
run more readers than feels necessary and spend the effort compressing their
reports, rather than rationing the cast. If the reports stop fitting, have a
separate agent group and rank them — that agent never decides.

- **Comprehension readers** — the real audience, across its range of abilities.
- **Specialists** — one lens each, told that nitpicking is the job.
- **Adversaries** — testing one claim the work makes about itself.

Four earn a standing place from round two onward. Their materials are the
non-obvious part, and [`briefs.md`](briefs.md) has each one written out:

| Reader | Materials | Asks |
|---|---|---|
| **Fix auditor** | last round's fixes, and nothing else | did each land? |
| **Disposition auditor** | the findings and what you did with each | was the triage fair? |
| **Cost reader** | a **measurement** taken on the real target, plus a control | what does this cost its user — time, money, CPU, attention, quota? An impression is not evidence here; if you cannot measure it on the thing the audience actually uses, say so rather than clearing it |
| **A/B reader** | two drafts, unlabelled, both orderings | which reads better, which do you trust, and is either over-qualified? |

Retire any other persona after two rounds with no tier-1 or tier-2 finding, and
record it so nobody re-adds it. **The four standing readers are exempt:** a
quiet round is their expected result, and the failures they exist to catch are
the ones nobody else is looking for.

## Keeping the records

In the **project**, not in this skill: a `review/loop/` folder with `LEDGER.md`
(rounds, tier-1 counts, false findings, what each round bought, **and which
model each reader ran on**) and `PREDICTIONS-R<n>.md`. The skill is reusable;
the records are not.

**Changing the method invalidates the comparison.** Tier-1 counts across rounds
run with different casts, framings or gates are not comparable. Reset the
baseline when the method settles, and say so in the ledger.

**Give the ledger a required `Believed, and wrong:` field each round** — the
claim as you held it, quoted, not its correction. A summary deletes the wrong
path by construction (see [`evidence.md`](evidence.md)), so it has to be asked
for separately or it is gone. Write `none this round` explicitly when there is
none: a blank field is invisible, a written assertion can be checked.

**End the ledger by predicting its reader.** A record of what went wrong is
read, agreed with, and changes nothing — agreement is free, and it looks
exactly like understanding. So close the ledger with a short list of the
mistakes *the next author will make*, named specifically enough that **the
human** would recognise one when it happens. They are the only reader who
persists across sessions, and therefore the only one who can ever tell you the
record failed. Without that list your lessons are unfalsifiable: nobody is in a
position to check them, including you.

## When to stop

- Two consecutive rounds with **zero tier-1 findings**.
- All tier-1 findings in one area — fix that area and stop.
- Everything left is tier 3. The question has become *is this good*.
- For an artifact read in fragments, **coverage**: every endpoint, procedure or
  section has been exercised at least once.
- The budget is spent.

Then hand it to the human. That was always the point.
