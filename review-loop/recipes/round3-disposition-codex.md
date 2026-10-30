## Audit report

### 1. Round 1 and 2 ratings and declines that do not hold

- **Round 1: Grok writing to `~/.grok` was under-rated.** The ledger rates it MEDIUM because “a reader that chooses to” write there could affect later sessions. That reason conflicts with the goal’s “whatever they decide” requirement. The round‑2 disposition auditor’s HIGH rating is better supported: persistent changes could affect later sessions without being noticed. The later fix addresses writes, but the audit’s warning about user-level `sandbox.toml` overriding the copy’s profile needed a specific check; the ledger’s note that a touch was denied does not establish that override behavior is harmless.

- **Round 1: the dependency-link finding was under-rated and poorly checked.** The author declined it partly because “Claude has no write tool,” but the running-code recipe granted Claude `Bash`. That rationale was already false in the recipe under review. The round‑2 auditor’s HIGH rating is plausible for writes to a live dependency directory; the round‑1 “reproduced for sandboxes” check did not establish the Claude case. The later fence change is a real fix, but the original decline and its reversal were not cleanly recorded.

- **Round 1: the bundled LOW row hides a MEDIUM issue.** Gemini’s brief could lose its entire answer on a pipe, the same visible failure mechanism as the saved-rule finding rated MEDIUM. Grouping it with unrelated guesses and rating the bundle LOW obscures that severity. The fix may have landed; the rating still needs correction in the record.

- **The office-data read decline had a convenient, false reason.** “Nothing pointing there” conflicts with `readers.md` naming the data path, and the materials were about this repository itself. “A per-CLI deny list is more parts” was not a tested reason. The finding was later fixed, but the ledger should say that the original rationale failed. “Both auditors rejected the reason” also overstates the evidence: the ledger corrects this to Grok only.

- **Round 2: the first-time probe’s portability is not established.** The custom-port issue and the question of where probe passes are recorded were bundled into a LOW disposition. The report says the probe still hard-codes the default port in its instructions and leaves pass-recording unclear. Reading the recipe is not evidence that the probe works on other machines.

The HIGH ratings for office-data access, Claude’s access to user settings/connectors, and the timeout problem are consistent with the stated severity scale when the scenarios are established. The main softness is in the lowered ratings, the reasons for declines, and what was left as an unrated “limit.”

### 2. Round‑2 disposition auditor: dropped items and reworded answers

There were real fixes: the Claude run wrapper blocks network access for its command, transcript folders are hidden, the live-repository status check was added, and Gemini’s partial-output path was later kill-tested. The stale suite sentence was narrowed to running-code recipes.

Other findings were not resolved as fully as the ledger’s “fixed” or “stated” labels suggest:

- **Grok’s `sandbox.toml` override warning** was raised by the disposition auditor. The ledger later records a denied touch, but that alone does not answer whether a same-named user profile can override the copy’s profile.
- **The custom `OFFICE_PORT` and probe-recording concerns** were grouped with other LOW items. The materials show a wording change for the port, but no recorded test that the probe works with a custom port or a clear place where a passing result is recorded.
- **“Any computer” became “Linux only.”** That documents a limitation; it does not satisfy the quoted goal. No second computer has run the recipes.
- **The Gemini deny-list removal** was surfaced as an undocumented change. The ledger marks it handled, but gives no rationale showing why removing the backstop was safe.
- **Home-folder access remains an acknowledged exposure.** The final recipe text says several readers can read the rest of the home folder and send it to their model provider. That narrows the claim from “office is unreachable” to “nothing else points them there,” which is a reader-behavior assumption. It does not meet “whatever they decide.”

### 3. “Where it came from” labels

The labels do not appear to have been used to lower the count, but they do **not meet step 4’s method**. Step 4 requires checking the failure scenario against the earlier version and recording how. The ledger’s “How checked” entries generally describe reproducing or reading the fault, not checking it on the prior version; its blanket statement about the change does not substitute for row-by-row comparisons.

Specific labels needing review, as the round‑2 disposition auditor identified:

- **Project `.grok` copied:** likely old, or a fault meant to be removed, because the earlier copy procedure appears to have included it. The earlier-version check is not recorded.
- **Connectors:** labeled “meant to be removed,” though neither `PLAN.md` nor `PROBLEM.md` establishes that intent. The ledger later says this came from the author’s own test report, not a saved reader report. Its origin should be checked against the earlier version and the label corrected or marked unverified.
- **Ledger copied / linked-worktree behavior:** the blind-solver leak may be new, but the ledger-copy and worktree behavior is not separately traced to the earlier version.
- **Grok home writes:** “new (meant to be removed)” blurs two labels. If the profile introduced the write path, it is new; “meant to be removed” does not replace that provenance.
- **Round‑2 Claude network access:** “from a fix (1)” is plausible if round 1’s fence introduced the failure. The record should still distinguish the fault the fix introduced from the underlying recipe gap, as the ledger itself attempts to do.

### 4. What the human should decide

Ask Frank to decide whether the success question still requires **a usable reader on any computer**, including non‑Linux systems. The current procedure explicitly has no recipe on other operating systems; accepting that changes the agreed goal.

Also put the remaining home-folder exposure plainly to Frank: some recipes can read files outside the hidden folders and send them to their model provider. The ledger has not recorded the human accepting that limit. If “cannot reach the office whatever they decide” remains binding, that exposure and the custom-office-path/probe gaps need resolution rather than a prose caveat.

The “plan” choice does not need to be asked again: the ledger records Frank’s “we’ll go with your fixes,” including the plan.

### 5. Claims versus tests recorded in the ledger

The ledger records final-form suite results for the running-code recipes: Codex, Grok, and Claude. Those figures support the narrowed suite claim for those recipes, though the round‑2 fix auditor says it did not rerun the suite itself, so the ledger should make clear whose test run those numbers represent. Gemini is explicitly read-only and is not covered by that suite claim.

**The portability claim has no second-computer test behind it.** The ledger says the second computer has run nothing, and the evidence note says only one computer has run the probe. So “an agent on any computer can start readers” is not supported by the recorded tests. Likewise, there is no recorded end-to-end first-use probe run on a second computer; local tests of individual commands or paths do not establish that probe.

This audit was based on the supplied files; I ran no readers, CLIs, or tests.