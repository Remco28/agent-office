# Review-loop ledger: reader recipes
*Kept by the review-loop skill. Safe to delete this folder once the work is done.*

Success question: can an agent on any computer start readers that run code, that cannot reach the office whatever they decide, and that leave a usable report even when they fail?
Rules confirmed with: Frank, 2026-10-30 (PROBLEM.md).
Reviewing: a change, from d86cd1e; old bugs filed in: BUGS.md if any (none so far: the change's goal is that the recipes hold, so a fault they leave in place is new, step 4)

Started as a light review. Round 1's auditors found HIGHs that are not old, so per the skill it became the loop.

## Round 1, 2026-10-30, 16210b3
Predictions: not written; this began as a light review.
Cast: critic Codex and blind solver Grok (read-only, on the plan); fix auditor Grok (running-code recipe, copy written with the first readers.md); reader Gemini (reading recipe).

| Finding | Reader (their rating) | Ours | From | How checked | Done |
|---|---|---|---|---|---|
| Gemini ran python3: session settings add to saved ones; tool note and author's claim false | author, following Gemini's lead | HIGH | new (meant to be removed; there since the 29 Oct note) | reproduced: printed 42 | fixed: saved settings hidden; refused after |
| Saved Gemini rule makes it run a script, loses the whole answer | Gemini (MEDIUM) | MEDIUM | new (meant to be removed) | reproduced before and after hiding | fixed |
| Every recipe could read the office's data | Grok (HIGH), Gemini (LOW) | HIGH | new (meant to be removed) | reproduced | fixed: fence hides the folder. Author had declined this; both auditors rejected the reason |
| Grok could write its skills and memory folders | Grok (HIGH) | MEDIUM: needs a reader that chooses to, and affects later Grok sessions | new (meant to be removed) | reproduced by auditor | fixed; other ~/.grok writes stated as a limit |
| Claude read user settings, not fenced to named commands | Grok (HIGH), Gemini (MEDIUM) | HIGH | new (meant to be removed) | tested --restricted: office, full path, curl, python3, bun -e, touch refused | fixed |
| Claude given the user's mail and drive connectors | author, from a reader's report | HIGH | new (meant to be removed) | tools list before and after --strict-mcp-config | fixed |
| Blind solver on built work gets the built code; ledger copied to readers | Gemini (HIGH) | HIGH | new | read; archive tested | fixed: copy from version before; /review-loop excluded |
| Claude could write through the dependency link | Grok (MEDIUM) | MEDIUM | new | reproduced for sandboxes; fence read-only on repo | fixed |
| Probe false-passes with office stopped; contradicts reading recipes; never tests Gemini's allow list | Gemini (MEDIUM) | MEDIUM | new | read | fixed: per-recipe passes, host check first |
| Linked worktree: rsync copies a .git pointer into the live repo | Gemini (MEDIUM) | MEDIUM | new | read | fixed: exclude when it is a file |
| Project .grok and like copied | Grok (MEDIUM) | MEDIUM | new | read | fixed |
| Killed Gemini left nothing | Grok (MEDIUM) | MEDIUM | new | stream-json finished run read; kill showed no text at 40s | partly: stream-json, extractor; untested with text before kill |
| Claude --model left blank; bun run ban ambiguous; pipes for Gemini | Gemini (guesses) | LOW | new | read | fixed |

Declines: critic's and solver's, in declines (see below). Stand after round 1: stream into ledger; built work with no plan (Frank chose a plan); project git status check (now covered by the fence).
What happened against the predictions: none written.
Believed, and wrong: "Session settings replace the saved allow list" (the agy tool note, stated as verified). "What keeps it from looking is that nothing it is given points there." "--disallowedTools plus allowedTools fences Claude."

## Round 2, 2026-10-30, df873bf
Predictions (written before the round): fix auditor: no HIGH, one to three MEDIUM, in the probe's wording or the fence's paths on another computer; all of round 1's fixes land. Disposition auditor: raises at least one rating, most likely Grok's ~/.grok writes (we lowered it to MEDIUM), and questions the skipped page.
Cast: fix auditor Codex (running-code recipe, fenced), disposition auditor Claude (reading recipe, fenced).

| Finding | Reader (their rating) | Ours | From | How checked | Done |
|---|---|---|---|---|---|
| Code Claude runs reaches the office and writes home; author called it a limit | Codex (HIGH), Claude (HIGH) | HIGH, how it is used now | from a fix (1): fence claimed; underlying new | reproduced: REACHED 200, WROTE | fixed: `<round>/run`; refused, server still starts |
| Grok writes in ~/.grok; lowered to MEDIUM by "needs a reader that chooses to" | Claude (raise to HIGH) | HIGH, same mechanism and reason as office-data row; author's rating was soft | new (this change's profile) | reproduced | fixed: strict + read-only home; all ~/.grok touches denied |
| Agents' transcripts quote the office, and were readable | Claude (open) | HIGH, how it is used now | new (meant to be removed) | grep: 228 Claude, 158 Codex, 118 Gemini files | fixed: hidden by the fence |
| OFFICE_HOME not honoured by the fence | Codex (HIGH) | LOW, not set anywhere here; setup not in use, and not yet agreed at a check-in so rated in full: MEDIUM | from a fix (1) | read src/paths.ts | fixed: one token |
| No check of the live repo after a run; decline's reason changed | Claude (F3) | LOW | new | read | fixed: taken |
| Dependency-link decline overturned without recording; "no write tool" believed | Claude (F4: HIGH) | HIGH for round 1's count, fixed | new | reproduced with the probe test | fixed; recorded here and below |
| Killed Gemini "partly" | Claude (open) | MEDIUM | new | kill test kept FINDING-ONE | fixed, tested |
| Suite claim stale; reading recipes can't be suite-tested | Claude (F12) | MEDIUM | from a fix (1) | Codex 165/10 and Grok 164/12 and Claude 175/1 in final form, with one added probe test | fixed: sentence narrowed |
| Linux-only not stated; second computer's OS unrecorded | Claude (F11) | MEDIUM | from a fix (1) | hostname on record is a ThinkPad; not confirmed Linux | stated; for Frank |
| Custom port in probe; where a pass is recorded; Gemini deny removed silently; solver's sandbox.toml warning | Claude (F13, F14) | LOW | mixed | read; sandbox.toml touch denied | fixed |
| Bwrap added with no peer step | Claude (F18) | process | from a fix (1) | true | fresh critic on the fence in round 3 |
| Page skipped, a never-skip | Claude | process | author | true | page built with round 3 |

Corrected in the record: "Frank chose a plan" is his "we'll go with your fixes", which included "the plan says so". The connector row's source is the author's own Claude test report, not a saved reader's. The office-data decline's "nothing pointing there" was false when written; readers.md named the path. "Both auditors rejected the reason" was Grok only.
Whom each reaches: every row is how it is used now, on this computer, except OFFICE_HOME. The second computer has run nothing yet.
What happened against the predictions: fix auditor found 2 HIGH, not 0; "all of round 1's fixes land" was false for Gemini's kill. Disposition auditor raised the predicted rating and questioned the page, and found far more: a prediction that a rating is soft and keeping it earned nothing.
Believed, and wrong: "Code Claude runs is unfenced" as an acceptable note. "Needs a reader that chooses to" as a reason, against a goal that says whatever they decide. "One small procedure file."

## Round 3, 2026-10-30, the commit after this ledger line
Predictions (written before the round): critic: at least one MEDIUM in the run script or in hiding folders on another computer; no HIGH. Fix auditor: no HIGH, one or two MEDIUM. Disposition auditor: raises one rating or label, finds the ledger's OFFICE_HOME rating muddled.
Cast: critic Gemini (reading recipe, on the fence), fix auditor Grok (running-code recipe), disposition auditor Codex (reading recipe). Then the check-in: stop for Frank before fixing.

## Mistakes the next author will make
Testing a fence only with the command it names. Saying *verified* about a thing tried once, with the variable you meant to test held fixed.
