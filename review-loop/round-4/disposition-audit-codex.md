# Disposition audit

I checked all six entries in [sorted.md](/home/frank/Projects/agent-office/review-loop/round-4/sorted.md) against the two reader reports, the ledger, the triage rules, and the relevant source. **J1 should be HIGH, not MEDIUM.** The other five ratings and all six tier-1 classifications hold.

| Finding | Audit |
|---|---|
| **J1 — init through a symlink into a repository** | **Tier 1 is right:** Grok reproduced it and the reviewer reproduced it. **Raise MEDIUM to HIGH.** The source confirms that init resolves the target’s real path but asks Git about `existing`, the path as typed. A symlink into a repository subfolder can therefore bypass the refusal and create a nested repository. The reviewer’s “visible” reason overstates what the message reveals: “initialized git repository” reports the action, not that init has wrongly split an existing project. Recovery also becomes harder if work is done under the new repository. This is an action that should have been blocked and can silently redirect project work. The user’s symlink input may be unusual, but the consequence fits HIGH’s blocked-action criterion. |
| **J2 — submodule key after `deinit`** | **Tier 1, MEDIUM hold.** The code uses the main module config whenever it exists; `configuredRoot` falls back to the git directory when `core.worktree` is absent. The reported sequence can therefore produce a different key while the worktree copy still exists. It is an unusual sequence, matching MEDIUM. |
| **J3 — separate-git-dir submodule key changes after main-checkout init** | **Tier 1, MEDIUM hold.** The source takes a fallback key before the main module config exists, then uses `core.worktree` from that config once it does. The resulting key changes as reported. The “no project on this machine uses a separate git dir” fact is true per the ledger, but does not establish that the issue is unimportant to users generally. It supports asking the owner about the tradeoff; it does not justify treating a verified MEDIUM as resolved. |
| **J4 — harness symlink target changes during init** | **Tier 1, MEDIUM hold.** The recheck compares only entry kind, so a directory link can still point outside when init creates `skills`. This is a rare timing window, which the rules rate MEDIUM. |
| **J5 — hard link covered by “changed into a link” warning** | **Tier 1, LOW hold.** The concern is wording, not a data-safety failure: the code’s hard-link refusal can reach the same warning. That is an annoyance. |
| **J6 — symlink to a directory containing repositories** | **Tier 1, LOW hold.** The report reproduced the shallow-scan behavior, and the ledger records the owner’s decision that links are not searched. Declining this LOW with that decision recorded is consistent with the rules. |

## Reasons and sorting

J2’s “unusual sequence” and J4’s “rare timing” are valid MEDIUM reasons. J5’s wording concern supports LOW. J6’s owner-confirmed shallow-check decision supports declining that LOW.

J1’s reason is **partly real, but too reassuring**: the command does report that it initialized a repository, and the result is technically recoverable. But that output does not make the *misclassification* apparent, and cleanup is not necessarily simple after work has been done. The ledger says the reviewer previously believed init compared real folders; the code shows the repository lookup still uses the typed path. Because J1 concerns that earlier belief, the MEDIUM rating deserves particular scrutiny. I can’t establish motive, but the stated reason understates the failure.

J3’s machine-specific absence is also not a severity argument. The review correctly leaves J3 at MEDIUM, but its recommendation to accept the limitation needs the owner’s decision; the local machine’s layouts alone cannot settle user impact.

The findings are **not improperly merged or split**. J2 and J3 both involve key changes in `worktreeSubmodule`, but their triggers differ: J2’s existing main config lacks `core.worktree`; J3’s main config appears later and supplies it. The suggested J2 guard would not resolve J3’s before/after change. J4 and J5 also describe distinct issues.

**No reader finding was dropped or softened out of the table.** All six findings from the two reports appear in sorted.md with their reported ratings. The disposition error is J1’s reviewer rating: it should be HIGH.

## Stop decision

**This review may not stop after this round.** Under the audited ratings, J1 is HIGH, and J2 and J4 are verified MEDIUM findings that require fixes under the profile. J3 also remains an unresolved MEDIUM unless the owner explicitly accepts the limitation. The code stop rule is not met.
