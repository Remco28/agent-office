# Problem: every finding should say where it came from

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

