# Blind solver: Claude claude-opus-5-5 via claude -p --no-session-persistence --disallowedTools Edit Write NotebookEdit 'Bash(office:*)', started in a reader-copy of the repo (no AGENTS.md/CLAUDE.md/.claude/.agents/review-loop/.git) plus PROBLEM.md. Copy checksums unchanged. It left ~/.claude/projects/-home-frank--cache-claude-9877-solver-oWf5 (deleted at clean-up).

Five edits, all in `SKILL.md`. The procedure gains about **185 words**. `briefs.md`, `human-page.md`, `evidence.md` and `profiles/code-review.md` don't change.

## 1. Edits to the procedure

**Edit A. `SKILL.md`, *Never skip these*: add item 5** (+6 words)

```markdown
5. **Readers never use the office** (step 3).
```

This list applies "whatever the size of the job". So the new rule reaches the light review's critic, solver and fix auditor, and the peer step's critics, without repeating it in each place.

**Edit B. `SKILL.md`, step 3: a new bullet after *Keep the copies small and short-lived*** (+118 words)

```markdown
- **Readers never use the office.** Start each one from the shell in its scratch
  folder, Claude too (as `claude -p`, never a subagent of your session, which
  carries your instructions wherever it works), with everything it reads copied
  in and the files that point an agent at the office left out: the project's
  `AGENTS.md` and `CLAUDE.md`, at every level. Quote in the brief anything a
  reader needs from them. When those files are the artifact (the office's own
  repository, or a change to them), they stay, and only readers whose sandbox or
  permissions block the `office` command are used. The office's tool notes say
  how to start each reader, which can reach the office, and what each leaves
  behind.
```

The existing bullet already says scratch copies go "never inside the project or the home folder", and that they are deleted once the round's reports are saved. The rule at the stop to delete "every scratch copy and temporary file the review made" also covers the folder `claude -p` leaves behind, once the tool notes name it.

**Edit C. `SKILL.md`, *The light review*: replace the closing paragraph** (from about 58 to about 120 words, so about +62)

The old paragraph:

> It stops being light when the human has not made the decisions, when a critic, solver or auditor finds a HIGH that is not *old*, or when the plan grows as the peers see it. Say so, and run the loop. An old bug that blocks (step 4) stops the light review instead; it does not start the loop.

The new paragraph:

```markdown
It stops being light when a critic, solver or auditor finds a HIGH that is not
*old*. Say so, and run the loop. An old bug that blocks (step 4) stops the light
review instead; it does not start the loop. **When the plan grows as the peers
see it, ask what grew.** Places it forgot to update, for parts it already has,
are coverage: fold them in and stay light. A new part or new state is design:
stop and take it to the human, who says whether it stays light. A decision the
human never made, however a peer frames it, goes to them too, with your
recommendation (step 5, *the owner decides*). Unsure which it is? Ask.
```

I dropped the clause "when the human has not made the decisions". The light review's entry condition already requires the decisions to be made. A decision that turns up later now goes to the human (decision 5) instead of starting the loop by itself.

## 2. What goes in the office's tool notes (decision 6)

- **Every reader:**
  - Start it from the scratch folder: a clone or export, not a worktree of the live repository.
  - Remove `AGENTS.md` and `CLAUDE.md` at every level.
  - Re-check now and then that no global instruction file (`~/.claude/CLAUDE.md`, `~/.codex/AGENTS.md`, Gemini's) mentions the office. The 2026-10-29 test found none, and that finding can go stale.
- **Codex:**
  - Run as `codex exec -s read-only`, from the scratch folder.
  - From that sandbox it cannot reach the office ("daemon not running", 2026-10-29). Without the sandbox it can: it ran `office peek` on 26 Oct.
  - It prints its whole transcript. The report is everything after the last line reading `codex`, and only that part is saved to the ledger.
  - It can be used when the office's files are the artifact.
- **Grok:**
  - Run with `--sandbox read-only`.
  - It cannot reach the office, so it can be used when the office's files are the artifact.
- **Gemini (`agy`):**
  - It **can reach the live office** (it read it on 2026-10-29).
  - Use it only from a scratch copy with the office's files removed.
  - Never use it when those files are the artifact.
- **Claude (`claude -p`):**
  - The recipe: `cd` to the scratch folder, then `claude -p --no-session-persistence --allowedTools <the named read tools and commands> --disallowedTools "Bash(office:*)" "<brief>"`.
  - Never start it from inside the project, or it loads the project's `CLAUDE.md`.
  - It has neither the office instruction nor the author's memory, so the brief must carry everything.
  - With those flags it was refused `office status`, `env office status`, `sh -c "office status"`, the full path to `office`, and a shell redirect. It has no file-writing tool, so its report comes from stdout.
  - It can be used when the office's files are the artifact.
  - Clean-up: even with `--no-session-persistence` it leaves an empty folder under `~/.claude/projects/` named after the scratch path. Delete it along with the copy.
- **Claude subagents** (such as `general-purpose`): never use them as readers. They carry the author's project instructions, the office's included, whatever folder they work in.

## 3. Where a reader could still use the office, or the author get stuck

**Where a reader could still use the office:**

1. **Using a subagent because it is easier.** Edit B forbids it by name and gives the reason: it carries the author's instructions wherever it works. Without the reason, the scratch folder would look like enough.
2. **Materials given as absolute paths into the live project.** A reader browsing there, or Gemini, can find `AGENTS.md` or reach the office. "Everything it reads copied in" closes this.
3. **A nested `AGENTS.md`, or a `CLAUDE.md` that imports it.** "At every level" covers both.
4. **The office's own repository, or a change to `AGENTS.md` in any project.** The instruction is part of the artifact and can't be removed. Edit B then lets in only readers whose sandbox or permissions block `office`, so the result doesn't rest on the reader's judgement (decision 1). "Or a change to them" extends decision 3 to this case; otherwise the rule has no answer for it. `claude -p` with the deny rule is always available, so the author is never left without a reader.
5. **The fix auditor's diff touches `AGENTS.md`.** That is "a change to them", so the same rule as point 4 applies.

**Where the author could get stuck:**

6. **`AGENTS.md` holds conventions a reader needs**, such as the project's review notes. "Quote in the brief anything a reader needs" is a short quote, not a whole file.
7. **Peers find a missed place, and the author can't tell coverage from design.** Edit C gives a test: is it a place for a part the plan already has, or a new part or state? If still unsure, ask the human. The test matches the two light reviews on 2026-10-29, which grew in coverage only.
8. **A peer presents a missing decision as a flaw in the plan.** "However a peer frames it" sends it to the human with a recommendation. After the human answers, the review stays light unless they say otherwise, so it no longer turns into the full loop by default.
