# What the peers found, and what was done

Critic: Codex gpt-6-luna (plan in hand). Blind solver: Claude opus via
`claude -p` in a reader-copy (the new recipe, used once). Neither ran an office
command; skill and copy checksums unchanged.

## Taken

| # | Finding | Who | Change |
|---|---|---|---|
| 1 | Gemini's sandbox reaches the office; a stripped copy alone does not meet decision 1 | Codex HIGH | The rule says every reader's recipe blocks `office`; agy's tool note says it is not a reader for now. **For Frank**: this leaves no figure-reading reader |
| 2 | The office's files can be the work outside agent-office too (reviewing a project's agent instructions, a change to `AGENTS.md`) | Codex HIGH; Claude the same ("or a change to them") | "Unless they are part of the work" replaces the agent-office-only exception; the recipe is the fence either way |
| 3 | Coverage vs design needs a test that does not clash with the peer step's "more places" | Codex MED; Claude a test of its own | Design = more parts, more state; coverage = places the plan forgot to bring in line with its own change; unsure, ask the human |
| 4 | Materials by absolute path into the live project undo the copy | Claude | "materials included" |
| 5 | A nested `AGENTS.md`, or a `CLAUDE.md` importing it | Claude | "at every level"; the reader-copy recipe's excludes are unanchored |
| 6 | Readers may need conventions from the files left out | Claude | "quote in the brief what a reader needs from them" |
| 7 | A git worktree as the copy is counted as the real project | Claude | reader-copy tool note: copy, clone or export, never a worktree |
| 8 | Global instruction files could start mentioning the office later | Claude | reader-copy tool note: re-check if a reader starts checking in |

## Declined

| Finding | Who | Why |
|---|---|---|
| A fifth item in *Never skip these* | Claude | "peers and auditors too" in the rule itself covers the peer step; the list stays short |
| Drop "when the human has not made the decisions" from the light review's exit | Claude | Beyond the decisions: Frank did not ask for it, and the entry condition alone does not cover a review whose decisions turn out unmade at the start |
| Align the full loop's peer step wording ("more places") | Codex (one of its options) | The light-review test now says what coverage is; the peer step is about a fix spreading through the system, which is design. Rewording it is outside this change |

The declines go to the fix auditor with the diff (light review, step 5).

## Fix audit (Grok, on commit 7cff469 and the tool notes)

Items 2, 3 and 5 to 8 landed; 1 and 4 with problems. Declines: AGREE on two;
DISAGREE on the *Never skip these* item, its alternative taken (problem 1).
All six problems taken:

| # | Problem | Sev | Done |
|---|---|---|---|
| 1 | The light review never sends its readers to step 3, so a light-review peer can still be a subagent | HIGH | "The light review is (every reader started as in step 3):" |
| 2 | agy's note opens with a reviewer recipe it then bans | MED | Ban first; the frozen-copy recipe is "for one-off reading outside review-loop" |
| 3 | Briefs hand materials over by absolute path into the live tree | MED | SKILL.md and briefs.md: "by absolute path in its copy" |
| 4 | OpenCode's block is untested but treated as blocking | MED | Its note now says not a review-loop reader until the deny config is tested, first |
| 5 | Step 3 forbids the home folder; the tool note says `~/.cache` | MED | Step 3: "under `~/.cache`, never inside the project" (the copies sat there all day; `/tmp` and `/var/tmp` are writable to Grok, `/dev/shm` invisible to Codex) |
| 6 | `--exclude=/review-loop` drops the change folder's materials | MED | Dropped from the recipe; the note says a blind solver's copy deletes the plan |

Nothing of the auditor's was declined.
