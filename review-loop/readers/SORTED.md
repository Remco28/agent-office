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
