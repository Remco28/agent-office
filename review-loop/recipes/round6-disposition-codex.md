## Audit report

### 1. Round 5 ratings and declines

- **Docker: HIGH holds.** The reported test showed the reader could reach Docker and leave a container running. That matches the human’s concern about agents leaving things running. The `/run` masking is a plausible fix, and the ledger reports Docker access failed afterward.
- **The traveling probe: MEDIUM holds.** A first-run check that misses failures found by the fuller probe could falsely bless a reader setup. Moving `probe.sh` into the skill addresses portability, but the round 5 reports do not establish that the final probe ran successfully under every recipe.
- **Outer fence writes: the “none/refused” disposition does not hold.** The fix auditor reported that its bubblewrap run was blocked, so it could not validate writes through the fence. That conflicts with the ledger’s claim that the probe was tested under each recipe. The finding is an **unresolved MEDIUM risk**, not a verified leak: the repo has a read-only bind, but the broader write protection was not demonstrated.
- **Other laptop hooks: the scope decline does not hold.** “Not a reader’s act” is not a good reason to dismiss hooks in the CLI’s parent process: they can run when an agent is spawned and could affect the repo or leave processes running. The disposition report says that laptop’s hooks were not checked. This is unverified, not a demonstrated failure.
- **Gemini redirect: “none” is not established by a run that timed out.** The report says no file was found, but a timed-out run does not show that the redirect was safely refused. Keep this as unverified; the materials do not establish a concrete failure or severity.
- **Editable `.venv`: MEDIUM is the consistent rating.** The same review-quality risk was previously rated MEDIUM, and the ledger gives no new reason to lower it. The round 5 disposition correctly restores that rating.

The LOW declines about timeout codes, ignored or untracked repo files, and Gemini probe wording do not, on the evidence here, establish another HIGH or MEDIUM risk under the human’s stated goal. The repo’s read-only bind is relevant protection, though it does not validate the broader outer fence.

### 2. Is a HIGH or MEDIUM still open?

**Yes: at least one MEDIUM is unresolved.** The outer fence’s ability to prevent writes outside the repo was not successfully tested, despite the ledger recording it as refused. The other laptop’s parent-process hooks are also unchecked and should not be closed on the stated scope rationale.

I found **no verified HIGH still open** in the round 5 materials. The Docker HIGH is reported fixed. That does not make the review ready to stop.

### 3. What to ask the human

In plain words:

- **May the readers’ CLIs keep or update their own logs and settings, or do those writes need to be prevented or cleaned up?** The materials list them, but do not record Frank’s decision.
- **Should the other laptop’s hooks and plug-ins be checked and treated as part of the fence?** The report leaves them unverified.
- **Should the missing peer review and whole-code reader be completed before closure?** The ledger records both as process departures; the code-review profile requires a whole-code reader every round, and the review-loop procedure requires a peer step before HIGH or MEDIUM fixes.

### 4. What prevents stopping under the profile rule?

The code-review profile allows stopping only after a round with no non-old HIGH and **no HIGH or MEDIUM fixes needed**. Round 5 had a HIGH Docker fix and a MEDIUM probe fix, so it cannot be the stopping round. The ledger’s round 6 entry gives predictions and names auditors, but provides no round 6 results. The unresolved outer-fence MEDIUM also needs a valid check or a justified disposition.

I reviewed the supplied ledger, round 5 reports, diffs, problem statement, procedure, probe, and profile. I did not run the recipes or check the other laptop.