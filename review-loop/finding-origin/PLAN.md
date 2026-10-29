# Plan: every finding says where it came from

*Light review, kept by the review-loop skill. Safe to delete this folder once the work is done.*

Author: claude-9877, 2026-10-29. Decisions: Frank, same day (office memory 193).

## The problem

The review loop cannot tell three kinds of finding apart, and treats them all as
the review's own:

- a fault **the change under review** put there;
- a fault that **was there before** the change (an old bug the reader happened to
  walk past);
- a fault that **a fix made earlier in this review** put there.

So old bugs count toward "is this round clean?", get fixed inside the review, and
make a review look as if it is not converging. The agent-office review (six
rounds) measured about 60% of findings in the original code and 40% from fixes,
but only afterwards and by hand. Anthropic's post on how the Claude Code team
reviews code (Oct 2026) reports that about 59% of what its reviewer kept flagging
across rounds was code from before the reviewer's first pass, and tags such
findings *Pre-existing*. The direction test's third question ("mostly in code or
text written to fix the last round?") is answered today by the author's
impression.

## Frank's decisions

1. Every finding records where it came from.
2. **Reviewing a change**: *new* (the change put it there), *old* (there before
   the change), or *from a fix* (an earlier round's fix).
3. **Reviewing a whole thing** (a codebase, a manual): no old versus new. When a
   finding can be traced to the commit that made it, write the commit down. A
   fault from an earlier round's fix can always be traced, since the review made
   that commit.
4. **An old bug does not stop the review and is not fixed inside it.** It is
   recorded in the repository's own bug tracker if it uses one, otherwise in a
   markdown file in the repository, to be revisited later. Not in the office's
   issues (those are for the office itself), and never only in the ledger, which
   is deleted when the review is done.
5. **Unless it blocks.** It blocks when the change cannot be checked, or cannot
   work correctly, until the old bug is fixed. Then the review stops, the ledger
   says *blocked by <the bug>*, and it goes to the human. The author writes why it
   blocks; the disposition auditor checks that reason like a rating.

## The edits

All in `skills/review-loop/`.

**SKILL.md, step 4**, a new paragraph after *whom it reaches*: **each finding
also says where it came from**, with decisions 2 to 5 in short form:

- set by checking, not on the reader's word: against the version frozen at the
  start and each round's diff (for code, `git blame` on the line); the record
  says how;
- "uses a tracker" means one already in use (a `TODO.md`, an `issues` folder,
  GitHub issues already open or closed), not merely a GitHub remote; otherwise
  `BUGS.md` at the top of the repository;
- the old finding is still rated and shown to the human, and what the author
  rated it is checked by the disposition auditor like any other.

**SKILL.md, the direction test**: question (3) becomes "mostly marked *from a
fix*?", counted from the new column.

**SKILL.md, the ledger**: a *From* column in the findings table, between *Ours*
and *How checked*.

**SKILL.md, the light review**: one sentence: findings carry the same label; an
old one is filed, not fixed; a blocking one ends the light review and goes to the
human. With no disposition auditor, the fix auditor checks the *blocks* reason
(step 5 already sends declines there; filing an old bug is a kind of decline).

**SKILL.md, when to stop**: one line: old findings do not count toward a stop;
a blocking one ends the review (step 4).

**profiles/code-review.md, when to stop**: "no HIGH" becomes "no HIGH that is new
or from a fix"; an old HIGH is filed (SKILL.md step 4).

**briefs.md, the disposition auditor**: it also checks each *old* and *blocks*
label: is the old one really older than the change, and does the blocking reason
hold?

**human-page.md, item 5**: each finding also shows *new*, *old* or *from a fix*;
old ones are grouped separately with where they were filed.

**evidence.md**: a short section, *Old bugs counted as the review's own*: the
60/40 measurement, the post's 59% and its tag, Frank's decisions, marked as a
hypothesis until a review records whether it ended sooner without losing a real
failure.

## What is not changing

The tier table, severity scale, rating rules and cast stay as they are. No new
reader. The label is one more field on findings that already exist.

## How I will check it

- Use it once: apply the new rule to findings from rounds 3 and 4 of the
  agent-office six-round ledger (commit `da81b5a`) and see whether each can be
  labelled in a minute and whether the direction test gets easier.
- Count every place the skill names the ledger's columns or the stop rule, and
  confirm each one is updated.
- One fix auditor on the diff.
