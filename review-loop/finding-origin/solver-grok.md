# Blind solver: Grok grok-4.7, --sandbox read-only, given PROBLEM.md and a frozen copy of skills/review-loop (no plan). Checksums of the copy unchanged after the run.

I'll read the problem and the current review procedure, then say exactly how the procedure should change.The procedure gains one origin field on every finding, and the stop, fix, and audit rules then follow that field. On a change the field is *new*, *old*, or *from a fix*. On a whole thing it is a commit, or *from a fix* plus that commit.

## 1. The rule

**`skills/review-loop/SKILL.md`, Step 4**, after the paragraph that starts "Each finding also says whom it reaches":

**Each finding records where it came from.** Origin is its own column. It is not whom it reaches, and it is not *in use* or *not in use*.

Before round 1, write in the ledger which review this is. **A change:** the human pointed at a difference, and the previous version is still readable. **A whole thing:** the artifact as it stands is the work. If you cannot read a previous version, it is a whole thing, and you do not write *old*.

**On a change**, write one of these:

- *new* — that fault is not in the previous version. This change put it there. A fault this change was meant to remove, and left in place, is *new*.
- *old* — that same fault is already in the previous version. A line the change touched, that was already wrong in the same way, is still *old*. A fault in lines the change added is *new*, even when the same bug sits in older code nearby.
- *from a fix* — an earlier round of this review put it there, or was meant to remove it and left it in place. Name the round. The change under review is not "a fix": a fault in it is *new*, including in round 1 and including a light review's first build.

**On a whole thing**, do not write *old* or *new*. Write the commit that made the fault when you can trace it. When you cannot, write *untraced* and carry on. A fault an earlier round's fix put there, or was meant to remove and left in place, is *from a fix* and that fix's commit.

**Counts** means *new*, *from a fix*, and, on a whole thing, every finding, including *untraced*. An *old* finding does not count toward a clean round, the stop rules, or the direction test.

**An *old* finding is not fixed in this review.** Verify it first, as now. Once it is verified, file it and leave the artifact alone. Tier 3 stays for the human. File it in the repository's bug tracker if the repository uses one. If it does not, or you cannot tell, do not open a tracker: use the repository's existing open-bugs markdown if it has one, otherwise `open-bugs.md` at the repository root. One place for the whole review, named in the ledger, outside `review-loop/`. Not in the office's issues, unless the repository under review is the office itself. The ledger only points at that place. One already filed is a settled point: do not file it again and do not count it again. If there is no repository, ask the human where the file goes before you finish, and do not leave it only in the ledger or in `review-loop/`. A tier 0 harness fault has no origin and is not filed.

**Unless it blocks.** It blocks when this change cannot be checked, or cannot work correctly, until that old bug is fixed. The reason names the check that cannot be run, or the result of this change that is wrong, and how this bug causes it. A serious old bug elsewhere does not block. A *new* fault you can fix in the change, while an old one sits underneath, does not block: fix the *new* one and file the *old* one. If that *new* fault cannot be made right without fixing the *old* one, the *old* one blocks. Then stop. Do not fix it. The author writes why it blocks. The disposition auditor checks that reason, and every *old* label, the way it checks a rating, against the previous version and this review's fix commits. A reason that does not hold does not block: file it and continue. A label that does not hold is *new* or *from a fix*, and it counts. Only then does the ledger say *Blocked by <the bug>: <why>*, and it goes to the human.

## 2. Everywhere that would otherwise contradict it

**`SKILL.md`, Never skip these, item 3.** Replace the sentence with:

**Have the disposition auditor check your ratings, the origins, and any blocks reason before you stop** (the cast). In the light review, below, its step 5 stands in for this.

**`SKILL.md`, The light review, item 5.** Add:

An *old* label and a blocks reason are declines. They take this same second opinion, once. If it holds and the bug blocks, write *Blocked by <the bug>: <why>* in the change's record, tell the human, and stop. Do not start the full loop.

**Item 6.** Add: name where each finding came from, and where any old bug was filed.

**The paragraph that starts "It stops being light".** Replace with:

It stops being light when the human has not made the decisions, when a critic, solver or auditor finds a HIGH that counts, or when the plan grows as the peers see it. Say so, and run the loop. An *old* finding does not do this: file it, and if it blocks, stop as in step 5.

**`SKILL.md`, Step 0.** Replace "What it finds is verified and gets fixed." with:

What it finds is verified and gets an origin. Fix it when it counts. An *old* one is filed and not fixed. If it is why the check cannot run, it blocks.

**`SKILL.md`, Step 3**, a bullet after "Freeze it.":

**Keep the baseline, and keep the fix commits.** On a change, name the previous version in the ledger and keep it readable. On any review, commit each round's fixes on their own, and do not squash them into the change or into an earlier round. A later finding is traced to that commit.

**`SKILL.md`, Step 4, the tier table.** Tier 1, Do cell:

Fix if it counts. *Old*: file it, don't fix it

**The severity paragraph** ("then: fix every verified HIGH and MEDIUM…"). Replace with:

then: **fix every verified HIGH and MEDIUM that counts; a verified LOW that counts is fixed or declined, with the reason written down** for the auditor. Without a severity scale, fix tier 1 that counts. *Old* is filed, not fixed, even at HIGH.

**The direction test.** Replace its first two sentences with:

**The direction test, every round from round 3**, on the findings that count. Compared with the last round, are those findings (1) less severe, (2) in rarer situations, and (3) mostly *from a fix*? Read (3) off the origins. Yes to all three means the work is converging and what is left is the cost of fixing: bring the stakes check forward rather than chase it.

Leave the rest of that paragraph as it is.

**`SKILL.md`, Step 5**, the opening sentence. Replace with:

**Fix what is verified and counts, and leave the rest**: fixing forty things teaches you nothing about which mattered. An *old* finding is filed, not fixed here. A blocking one has already stopped the review.

**`SKILL.md`, The cast, standing-readers table.**

Disposition auditor, Gets, add: "the previous version and this review's fix commits". Asks, replace with: "was the sorting fair, do the origins hold, and does a blocks reason hold?"

Fix auditor, Asks, replace with: "did each land, and did it break anything that used to work?"

**`SKILL.md`, The ledger**, the template. Add under "Rules confirmed with":

```markdown
Reviewing: <a change | a whole thing>
Previous version: <what you compared, if a change; otherwise "—">
Old bugs live in: <tracker or file outside this folder, or "—">
```

Change the table header to:

```markdown
| Finding | Where from | Reader (their rating) | Ours | How checked | Done |
```

Under the template, add:

Where from, on a change: *new*, *old*, or *from a fix* and the round. On a whole thing: a commit, *from a fix* and its commit, or *untraced*. Done, for *old*, is `filed`. A block ends the round with *Blocked by <the bug>: <why>*.

**`SKILL.md`, When to stop**, after "A profile's stop rule replaces these for its genre.":

Apply these lines to findings that count. An *old* finding does not meet them, and it is not the fix in "fix it and stop". A block has already ended the review. The ledger says *Blocked by <the bug>*. That is not a clean stop.

**The cleanup sentence.** Add:

Leave the tracker entries, and `open-bugs.md` if you made one, and say so in the closing note. They outlive `review-loop/`.

**`briefs.md`, The disposition auditor.** Materials, add the previous version or the diff, and this review's fix commits. Before the "trust YOU less" line:

It checks each origin, and any reason an old bug blocks, the way it checks a rating: against those materials, not against the author's word. A blocks reason that does not hold does not block. An *old* label that does not hold is *new* or *from a fix*, and it counts.

**`briefs.md`, The fix auditor.** Add:

Separate a fault this fix created, or was meant to remove and left in place, from a fault already in the previous version that the fix did not touch. Say which. The author sets the origin; you supply this split.

**`human-page.md`, item 2.** Replace with:

2. **The trend across rounds**: serious and medium counts per round, after the disposition audit, split by origin. *New* and *from a fix* are the trend (progress, a plateau, or a slide). *Old* is its own count, and it is not a slide. A whole-thing review has no *old*; still split out *from a fix*.

**Item 5.** Add at the end:

Say where it came from, in plain words: "in this change", "already there", or "from a fix made earlier in this review". On a whole-thing review, only the last of those, or nothing. Keep it beside "how you use it now", not in place of it. Leave the commit in the ledger, off this page.

**Item 6.** Add:

A block leads this box: *blocked by <the bug>*, the reason, and your recommendation. An old bug that does not block is a finding, not a decision in this box.

**Item 7.** Replace with:

7. **Low findings folded away**, one line each, including where it came from.

**`profiles/code-review.md`, Fixing.** Add after "A LOW fix doesn't need it.":

An *old* finding is not a fix and does not come here.

**What readers get.** Extend the review-notes bullet:

The project's review notes, so settled points aren't re-reported, including old bugs already filed.

**When to stop.** Replace that short section with:

This replaces SKILL.md's stop rules for code: **stop after a round that has no HIGH that counts, by ratings the disposition auditor has checked, and needed no HIGH or MEDIUM fixes of findings that count.** A round that ended with such fixes has a round after it, with a fix auditor on them. A fault in that fix is *from a fix* next round.

On a review of a change, *old* is not a HIGH for this test and is not a fix. A blocking *old* bug stops the review as SKILL.md says, instead of this rule.

`explainer-public.md`, `web-app-tasks.md`, and `profiles/_template.md` have no stop rule and no "fix everything" line of their own, so they stay as they are. `evidence.md` is not part of a review, and nothing in it tells the reviewer to fix an old bug, so it stays as it is.

## 3. Where a reviewer would get stuck, and the sentence that stops it

**The diff touches a line that was already wrong.** It looks *new* because it is in the diff, the review fixes a pre-existing bug, and the round stays open. The rule says the same fault in the previous version is *old*, including a line the change touched.

**The change is a bugfix and the bug is still there.** Labeling it *old* makes a failed change look clean. "A fault this change was meant to remove, and left in place, is *new*" keeps it counting. The same sentence, with "an earlier round", stops a failed later fix being filed as *old* and dropped.

**New code is wrong only because old code is wrong.** One label does both jobs badly: *old* ships a broken change, *new* pulls the old code into the review. The finding in the new lines is *new* when the previous version did not have that fault. The pre-existing fault stays *old*. If the new fault can be fixed in the change, fix that and file the old one. If it cannot, the old one blocks and the human gets it. The review does not patch the old code on its own.

**A late round, and a bug from the original change that no fix has touched.** It gets called *from a fix* because the review is old. *from a fix* is only a fault an earlier round of this review put there, or failed to remove. Anything the original change put there stays *new*.

**The fix auditor reports an old bug beside the hunk as "this broke".** The brief tells that auditor to split "created or meant to remove" from "already there, untouched". The author sets the label from the previous version. The disposition auditor checks the label against that version, so a soft *old* does not excuse a fault the change or a fix actually introduced.

**A whole codebase, and ancient code.** Writing *old* would drop real findings out of the stop rule. On a whole thing there is no *old*. *untraced* is a finished cell: the finding still counts and is still fixed, and the reviewer does not stop to dig for a commit. *from a fix* still has a commit, because step 3 now requires each round's fixes to be their own commit and forbids squashing them away.

**Every serious old bug "blocks" because the product is wrong.** The reason has to name a check this change cannot run, or a result of this change that is wrong, and how this bug causes it. The auditor treats a reason that does not hold as not blocking. The review files the bug and continues. The mirror image is the same check: an *old* label that does not hold counts.

**The blocking bug is small, so the reviewer fixes it "to unblock".** The rule says stop, do not fix it, and write the ledger line only after the auditor has agreed. In a light review that agreement is step 5's second opinion, and an old HIGH does not promote the job into the full loop.

**The old bug is written only in the ledger, in `review-loop/`, or as an office issue.** The durable place is the repo tracker, or `open-bugs.md` outside `review-loop/`. Office issues are allowed only when the office is the repository under review. Cleanup says to leave that file. The next round treats what is already filed as a settled point, so the same old bug is not counted again.

**Origin gets mixed up with "how you use it now".** They are two fields. An old fault in ordinary use is still "already there" and still filed. The human page keeps both labels, keeps old counts out of the convergence trend, and puts only a block in the decision box, so a list of old bugs does not wait on the human as if the review had stopped.

## 4. What the decisions ask that the procedure cannot do as written

**A previous version nobody kept.** *Old* and *new* are a comparison with that version. The procedure freezes what readers are about to see, and it allows a snapshot instead of a commit. If the previous version is already gone, no wording recovers it, and a label would be the impression these decisions are replacing. The new line tells the reviewer to keep that version and, if they cannot read it, to run a whole-thing review and not write *old*. That is a refusal to guess, not a reconstruction.

**"The commit" when the review never made one.** Decision 3 says a fault from a fix can always be traced because the review made that commit. The procedure, as it stands, allows a snapshot, a dirty tree, and several fixes in one commit. Blame then cannot name the round. Requiring a commit per round, and forbidding a squash into the original change, makes later reviews traceable. It does not recover a review that has already squashed or never committed.

**No repository.** Decision 4's only durable places are the repo's tracker or a markdown file in the repository. The procedure also covers work with no project folder, and it deletes the review folder at the end. For those, the decision leaves nowhere the bug is allowed to live. The new line asks the human where to put the file. Until they answer, the reviewer cannot both finish and obey "never only in the ledger".
