# Problem: readers that use the office, and two light-review rules

*Light review, kept by the review-loop skill. Safe to delete this folder once the work is done.*

Author: claude-9877, 2026-10-29. Decisions: Frank, same day. Closes office issue #4.

## The problem

**Readers use the office.** A reader (critic, solver, auditor, comprehension
reader) is started to do one task. The office is for the agent that started it,
not for the reader. But a reader working in a project, or a copy of one, reads
the project's `AGENTS.md` (Claude Code reads it through `CLAUDE.md`), whose first
instruction is to run `office begin`. Readers have done it: a Codex reader ran
`office peek` against the live office despite its brief (26 Oct, before its
sandbox worked fully); one left a check-in pointing at a throwaway copy under
`/tmp`, which the office counted as a project. A line in the brief has not been
enough. Tested on 2026-10-29:

- No global instruction file on this machine mentions the office; the project's
  `AGENTS.md`/`CLAUDE.md` is the only source of the instruction.
- Codex (`-s read-only`) and Grok (`--sandbox read-only`) cannot reach the office
  from their sandboxes ("daemon not running"). Gemini (`agy`) can: it read the
  live office.
- A Claude subagent of the author's session (`general-purpose`) has the author's
  project instructions, including the office's, whatever folder it works in.
- A headless `claude -p` started in a scratch folder has no office instruction
  and none of the author's memory. Started with `--allowedTools` for named
  commands and `--disallowedTools "Bash(office:*)"`, it was refused `office
  status`, `env office status`, `sh -c "office status"`, the full path to
  `office`, and a shell redirect; it had no file-writing tool. With
  `--no-session-persistence` it still leaves an empty folder under
  `~/.claude/projects/` named after the scratch path.

**Two light-review rules from office issue #4** (keydo light review, claude-8048):

- "It stops being light when ... the plan grows as the peers see it" sends a
  light review to the full loop when peers only find places the plan forgot to
  update (coverage), not just when they add parts or state (design). Both light
  reviews on 2026-10-29 grew in coverage only.
- Peers often turn up a decision the human never made, not a flaw in the plan.
  The skill says "the owner decides what changes outcomes" (step 5) but the light
  review does not say it.

## Frank's decisions

1. **Readers never use the office, and that must not rest on the reader's
   judgement.**
2. **Every reader is started from the shell in a scratch copy that leaves out the
   office's files**, Claude included (as `claude -p`, like Codex, Grok and
   Gemini), never as a subagent of the author's session. The copy is deleted
   afterwards, as now.
3. **When the office's own repository is the work**, its office files are the
   artifact: they stay, and only readers whose sandbox or permissions block the
   `office` command are used.
4. **The light review separates coverage growth (fold it in) from design growth
   (stop and ask the human).**
5. **The light review says that a decision the human never made goes to the
   human.**
6. **Tool facts go in the office's tool notes, not the skill**: Codex prints its
   whole transcript (the report is after the last `codex` line); which readers
   can reach the office; the `claude -p` reader recipe and its clean-up.
7. **Keep the edits light.** The skill has been cut down several times.
