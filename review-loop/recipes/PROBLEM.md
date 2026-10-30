# The problem

The review-loop skill says every outside reader must be kept away from the
office (the shared memory the author agents use), and must be started from the
shell in a throwaway copy of the work. An agent then ran a real code review with
it, probably on a second computer, and reported four gaps.

1. **Readers cannot run the code.** The code-review profile promises "a copy they
   may run", but the known ways of starting Codex and Grok are read-only, so test
   suites fail for lack of a place to write. Measured on this repo: 10 pass, 161
   fail under Codex read-only.
2. **The ways of starting a reader do not reach the other computer.** The skill
   points at the office's tool notes. Skills travel by git; tool notes are per
   computer, in a database. The agent improvised a fake `office` on PATH, which is
   no fence, and lost a run to a CLI flag that swallowed its prompt.
3. **A reader that times out leaves nothing.** Grok ran 25 minutes and left no
   report and no sign of what it was stuck on.
4. **The light review assumes the plan comes before the build.** Asked to review
   finished work, the agent had to depart from it. It also says "commit", which
   an agent may not do unasked.

# What the human has decided (Frank, 2026-10-30)

- Fix all four. Keep edits to `SKILL.md` light: it has been debloated repeatedly.
- A reader that runs code MAY write to its own throwaway copy. It never touches
  the frozen version. Any change it makes to a file it was given makes its report
  suspect.
- Standing rules: readers never use the office, and this must not rest on the
  reader's judgement. Reviewers do not write to what they review.

# The goal, as the human set it (Frank, round 3's check-in, 2026-10-30)

"We are fencing against the agents making changes to the repo code directly. A
lesser concern is that the agent we spawn makes changes outside of the repo as
well. Or install some random tool they needed and leave them installed, running,
or whatever. Same with temp files everywhere on the machine." Readers seeing the
home folder is accepted. Gemini stays. The other laptop runs Linux. This replaces the
earlier wording "cannot reach the office whatever they decide", which was the author's.

# What is measured (this computer, 2026-10-30, this repo's 175 tests)

| Way of starting | Pass / fail | Local server | Office | Write to home |
|---|---|---|---|---|
| no sandbox, copy without AGENTS.md | 174 / 1 (the missing AGENTS.md) | yes | reachable | yes |
| `codex exec -s read-only` | 10 / 161 | no | blocked | no |
| `codex exec -s workspace-write` | 165 / 10 | no | blocked | no |
| `grok --sandbox strict` | cannot start bun | no | blocked | no |
| `grok` custom profile: extends workspace, `restrict_network = true`, in the copy's `.grok/sandbox.toml` | 163 / 12 | no | blocked | no |
| `claude -p`, named commands, `Bash(office:*)` denied | 174 / 1 | yes | refused | no write tool |

Also: `codex exec -o <file>` writes just the final message. `grok --output-format
streaming-json` and `claude -p --output-format stream-json --verbose` write as
they go, and the first was checked to keep its work when killed by `timeout`.
