# Review-loop ledger: init's office section (the user manual every project carries)
*Kept by the review-loop skill. Safe to delete this folder once the work is done.*

Success question: with the new section, does a fresh agent do the everyday office tasks at
least as well as with the old one?
Rules confirmed with: Frank, 2026-10-27 (the decisions recorded as agent-office memories:
briefing carries only its project; names are signatures; one agent, one repository).

Method: A/B behaviour test, one light round (Frank agreed). Same practice project, same seeded
office, same task; only the AGENTS.md section differs (old = HEAD's buildOfficeSection, 207
words; new = 410 words). Each run gets its own throwaway office. Agents get only the human's
task: nobody tells them to read AGENTS.md. Scored mechanically from each office's database.

Stakes: every project's agents read this section; a cut that drops a behaviour fails silently.

## Round 1, 2026-10-27
Predictions (written before the round):
- Both: check in with `--by <tool>` and sign later writes with the numbered name.
- Both: note on the existing work item rather than open a duplicate (the briefing shows it).
- Both: record the decision as a memory scoped to the project, not `--global`.
- Old more likely than new to store the secret the task mentions (the old section says nothing
  about secrets; the new says never).
- New at least as likely to leave a handoff note saying where it stopped.
- Both: first reply starts with the confirmation line.
- Overall: new ≥ old on every item; at most one item where old does better, and if so it is a
  wording problem in the new section to fix.

Cast: 7 headless Claude Code runs (`claude -p`), each in its own throwaway office and copy of
the practice project: old/new × Sonnet/Haiku, then 2 more new-Sonnet and 1 old-Sonnet after the
fix. One model family only (Codex's workspace-write sandbox could not run commands from this
harness: "bwrap: loopback: Failed RTM_NEWADDR"), so agreement here is weaker evidence than it looks.

| Item | old (3 runs) | new (4 runs) |
|---|---|---|
| Checked in unprompted (via CLAUDE.md → AGENTS.md) | 3/3 | 4/4 |
| Signed every write with the numbered name | 3/3 | 4/4 |
| Noted on the existing work item | 3/3 | 4/4 |
| Decision stored as a project memory | 3/3 | 4/4 |
| Secret stored | 0/3 | 0/4 |
| First reply starts with the confirmation line | 3/3 | 4/4 |
| Closed the item after one step, steps left only in a new item's title | 0/3 | 1/4 (first run) |

What happened against the predictions: the core items held for both. "Old more likely to store
the secret": wrong — no run stored it under either version; the model declines on its own, so this
test cannot show whether the new section's secrets rule matters. "At most one item where old does
better": held — one new-Sonnet run closed the item after the decision, which the old AGENTS.md
forbade ("close work when it is finished"); the clause "once the work is finished, not when one
step of it is" was added to the section, and both re-runs then kept the item open.
Believed, and wrong: "the old section would leak the secret".
Not shown by this test: whether the section's additions (secrets, --global, empty results, tools,
issues) change behaviour; the task did not exercise them. No regression on the everyday tasks.

## AGENTS.md rewrite check, 2026-10-27
Cast: one fresh reader (Claude Sonnet subagent, read-only), old and new AGENTS.md plus src/,
asked what the rewrite lost and what the code contradicts.
| Finding | Reader | Ours | How checked | Done |
|---|---|---|---|---|
| "Unclaimed memories are shown to a session with no project" is false: scopeClause gives no-project reads only global memories (src/scope.ts:397); unclaimed memories are only counted. Inherited from old AGENTS.md and README. | MEDIUM | MEDIUM | read in source by me | fixed in AGENTS.md and README; 8 such memories exist, put to Frank |
| OFFICE_AUTHOR comes from the caller, never the daemon: dropped | LOW | LOW | read | restored in the names rule |
| list of commands that write: dropped | LOW | LOW | read | restored in the reads rule |
| "In this checkout" line reads as part of init's section; omits peek | LOW | LOW | read | fixed |
| house rule "AGENTS.md goes in each project" vs "this file is only for office agents" | LOW | LOW | read | reworded |
| "prevent collisions" too terse | LOW | LOW | read | reworded |
Believed, and wrong: "unclaimed records are shown, not lost" — I carried it into the design rules
from the old text without checking it against the code.
