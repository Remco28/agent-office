# Review-loop ledger: reader recipes
*Kept by the review-loop skill. Safe to delete this folder once the work is done.*

Success question: can an agent on any computer start readers that run code, that cannot reach the office whatever they decide, and that leave a usable report even when they fail?
Rules confirmed with: Frank, 2026-10-30 (PROBLEM.md).
Reviewing: a change, from d86cd1e; old bugs filed in: fixed here, by Frank's request that the recipes work (see below)

Started as a light review. Round 1's auditors found HIGHs that are not old, so per the skill it became the loop. Departure, said to Frank: no HTML page, a short account in the chat, because the change is one small procedure file.

## Round 1, 2026-10-30, 16210b3
Predictions: not written; this began as a light review.
Cast: critic Codex and blind solver Grok (read-only, on the plan); fix auditor Grok (running-code recipe, copy written with the first readers.md); reader Gemini (reading recipe).

| Finding | Reader (their rating) | Ours | From | How checked | Done |
|---|---|---|---|---|---|
| Gemini ran python3: session settings add to saved ones; tool note and author's claim false | author, following Gemini's lead | HIGH | old (29 Oct note) | reproduced: printed 42 | fixed: saved settings hidden; refused after |
| Saved Gemini rule makes it run a script, loses the whole answer | Gemini (MEDIUM) | MEDIUM | old | reproduced before and after hiding | fixed |
| Every recipe could read the office's data | Grok (HIGH), Gemini (LOW) | HIGH | old | reproduced | fixed: fence hides the folder. Author had declined this; both auditors rejected the reason |
| Grok could write its skills and memory folders | Grok (HIGH) | MEDIUM: needs a reader that chooses to, and affects later Grok sessions | old, profile new | reproduced by auditor | fixed; other ~/.grok writes stated as a limit |
| Claude read user settings, not fenced to named commands | Grok (HIGH), Gemini (MEDIUM) | HIGH | old | tested --restricted: office, full path, curl, python3, bun -e, touch refused | fixed |
| Claude given the user's mail and drive connectors | author, from a reader's report | HIGH | old | tools list before and after --strict-mcp-config | fixed |
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

## Mistakes the next author will make
Testing a fence only with the command it names. Saying *verified* about a thing tried once, with the variable you meant to test held fixed.
