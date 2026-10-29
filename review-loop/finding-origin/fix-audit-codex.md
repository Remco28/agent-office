# Fix auditor: Codex gpt-6-luna, -s read-only, fresh run, on git diff 2a2e2fd 3eab0f3 -- skills/ with PLAN.md and SORTED.md. Skill checksums unchanged after the run.

## Taken

All 14 items landed in the changed procedure, with one cross-document problem noted below.

| # | Result | Quote from the changed text |
|---|---|---|
| 1 | **LANDED** | “**Reviewing a whole thing** … there is no before, so no *old* or *new*.” |
| 2 | **LANDED** | “Before stopping, give the finding, the earlier version and your reason to one fresh agent told to kill the reason.” |
| 3 | **LANDED** | “In both cases, not the *old* ones: they are filed (below).” |
| 4 | **LANDED** | The auditor gets “the versions behind each *where it came from*” and checks “do those labels hold?” |
| 5 | **LANDED** | “Test the failure scenario, not the line” and “`git blame` is a lead, not the answer.” |
| 6 | **LANDED** | “Commit what readers get, or keep it as a patch in the ledger folder” and “commit each round's fixes on their own.” |
| 7 | **LANDED** | “A fault the change was meant to remove and left in place is *new*.” |
| 8 | **LANDED** | “*Untraced* is a finished answer; don't dig.” |
| 9 | **LANDED** | “One already filed is not filed or counted again.” |
| 10 | **LANDED** | “With no repository, ask the human where it goes.” |
| 11 | **LANDED** | A HIGH that “is not *old*” makes the review stop being light. |
| 12 | **LANDED** | The human page says “Old bugs are their own line, not part of the trend” and a block “comes first.” |
| 13 | **LANDED** | The fix auditor says “whether the fix made it or it was there before the fix.” |
| 14 | **LANDED** | The added evidence is inside **“Fixes chasing their own edges”** and calls the conclusion “A hypothesis.” |

## Problems

**MEDIUM — Whole-thing reviews don’t fit the ledger, auditor brief, or human-page labels. Made by this change.** In a review of a whole codebase, the procedure says to record the commit that introduced a fault or mark it *untraced*; there is no “old” bug category. But the ledger template still requires “old bugs filed in: `<where>`,” the disposition-auditor brief asks for “the version before the change,” and the human page only offers “in this change,” “already there,” or “from a fix.” An agent reviewing a whole codebase has no accurate value for those fields and may force findings into change-review labels or leave the page incomplete.

I’d make those instructions conditional: for a change, record its baseline and any old-bug destination; for a whole thing, record the introducing commit, a fix round, or *untraced*, and give the auditor the history needed to check that label. The human page should show those whole-thing labels too.

I found no other case where the new rules make an agent get stuck, contradict another rule, or misrate a finding. The code profile’s stop rule, step 0, the tier table, step 5, and the general stop rules all account for old findings.

## Declined

- **File office bugs as office issues:** **AGREE.** The stated reason holds: office issues are for problems with the office, not bugs in its code.
- **Call the fallback `open-bugs.md`:** **AGREE.** The agreed fallback is `BUGS.md`.
- **Add the larger rewrite to the fix-auditor row, human page item 7, and ledger:** **AGREE.** Those broader additions are unnecessary; the short edits cover the intended change. The whole-thing label gap above is a specific consistency issue, not a reason the larger rewrite was needed.
- **Split the ledger’s “Reviewing” header into three lines:** **AGREE.** Keeping it on one line preserves the needed information.
