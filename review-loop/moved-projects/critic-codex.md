## Findings

1. **A copy can inherit the original project’s notes after the original folder disappears.**  
   **Scenario:** Project A is recorded. Someone copies it to B, then removes A. B checks in; both have the same first-commit fingerprint, and A is now the only known matching project whose folder is gone.  
   **Wrong outcome:** `followMove` treats B as A’s move and carries A’s memories, work, issues, and sessions into B. This violates the settled decision that a copy is its own project. A shared template commit creates the same failure even without a literal copy.  
   **Severity: HIGH.**  
   **Smallest fix:** State that a first-commit fingerprint cannot distinguish a move from a copy in this case. Require an additional identity check or human confirmation before adopting notes when that distinction matters. As written, the plan does not deliver the copy decision for this scenario.

2. **Moving notes onto a path that already has project history can merge projects or prevent the move.**  
   **Scenario:** B has records at `/work/repo`. B is removed or moved away, then A is moved into `/work/repo`. At startup, `recordProjects` can register `/work/repo` with B’s old fingerprint. At A’s check-in, A’s old path is the unique gone candidate.  
   **Wrong outcome:** Updating all tables merges B’s records into A’s. Also, `projects.key` is a primary key: renaming A’s row to `/work/repo` conflicts with the existing row and can abort the transaction. The plan does not define either outcome.  
   **Severity: HIGH.**  
   **Smallest fix:** Before rekeying, detect an existing target key. If its recorded fingerprint differs, leave both histories untouched and report a conflict for human resolution; specify how the conflict is surfaced in `/begin`.

3. **Startup key canonicalization can leave stale project-registry rows.**  
   **Scenario:** `canonicalizeProjects` changes a stored key in `memories`, `work`, `issues`, or `session_state` because it now normalizes to a different path. The new `projects` table is not among the tables that function updates. `recordProjects` then sees the new key without a registry row and records it separately, leaving the old row behind.  
   **Wrong outcome:** The registry can retain a stale move candidate alongside the canonical project, causing false ambiguity or a primary-key conflict during a later move. The plan says to run registry recording after canonicalization but does not reconcile the registry itself.  
   **Severity: MEDIUM.**  
   **Smallest fix:** Include `projects` in canonicalization, with the same target-key conflict handling, or explicitly reconcile its rows after canonicalization before recording fingerprints.

4. **Check-in and startup can block on synchronous Git calls.**  
   **Scenario:** A normal `begin` computes the caller’s fingerprint with `git rev-list`; an unresponsive mount or Git process reaches the existing 10-second timeout. At startup, `recordProjects` does this for each previously unregistered existing project, serially. The plan estimates about 40 Git calls on first run.  
   **Wrong outcome:** A check-in can stall for up to the Git timeout, while startup can delay the daemon by many timeout periods before it serves requests. A timeout also makes fingerprint recording fail or incomplete, but the plan does not specify retry behavior.  
   **Severity: MEDIUM.**  
   **Smallest fix:** Put a strict total time budget on startup fingerprinting and make incomplete work retryable; avoid making every check-in wait synchronously on Git where a known fingerprint can be reused.

5. **A temporarily unavailable folder can be mistaken for a move source.**  
   **Scenario:** A’s folder is on an unmounted drive. While it is unavailable, a same-fingerprint copy checks in elsewhere. A’s recorded path appears nonexistent, and it is the only matching gone candidate.  
   **Wrong outcome:** The copy adopts A’s notes and sessions. The plan identifies this risk but leaves the automatic move behavior unchanged.  
   **Severity: HIGH.**  
   **Smallest fix:** Require a gone-path grace period or explicit confirmation before moving notes from a path that has only just become unavailable.

## Plan size

The plan gets **bigger** with these fixes: it needs conflict handling, a way to distinguish or confirm ambiguous moves, registry reconciliation, and bounded/retryable fingerprint checks.
