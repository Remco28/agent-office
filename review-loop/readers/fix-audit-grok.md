# Fix auditor: Grok grok-4.7, --sandbox read-only (blocks office), in the repo, on git diff 00f4e5b 7cff469 -- skills/ plus tools-after.json, PLAN.md, SORTED.md. Skill checksums unchanged.

I'll audit the procedure change hunk by hunk against the plan and the sorted decisions, without running office commands or editing anything.The office rule is in the full procedure's step 3, and the light review never sends the author there. A light-review reader can still be a Claude subagent of the author's session, and that subagent uses the office.

## 1. Taken

| # | Verdict | Quote |
|---|---|---|
| 1 | LANDED WITH A NEW PROBLEM | Skill: "every reader's recipe blocks the `office` command". Agy note: "NOT A REVIEW-LOOP READER for now … its recipe does not block office". The same note still says "As a reviewer, run it in a frozen copy outside ~/Projects". That recipe reached the live office on 29 Oct. |
| 2 | LANDED | "Unless they are part of the work, the copy leaves out `AGENTS.md`, `CLAUDE.md`, `.claude` and `.agents`". |
| 3 | LANDED | "when the design grows as the peers see it (more parts, more state)… Places the plan forgot to bring in line with its own change are coverage, not design: fold them in; unsure which, ask the human." |
| 4 | LANDED WITH A NEW PROBLEM | "from the shell in its copy, materials included". The brief skeleton still says "the materials, by absolute path" and does not say the path has to be inside the copy. |
| 5 | LANDED | Skill: "at every level". Reader-copy note: "Unanchored excludes drop AGENTS.md/CLAUDE.md/.claude/.agents at every level". |
| 6 | LANDED | "quote in the brief what a reader needs from them". |
| 7 | LANDED | "Copy, clone or export: never a git worktree of the live repo, which the office counts as the same project." |
| 8 | LANDED | "re-check if a reader starts checking in again." |

## 2. Can a reader still use the office? Can the author get stuck?

Yes, on the light-review path. The light review's peers are "the peer step (step 5)" and its auditor is "as in the cast". Neither section says how to start them. Step 3 is the only place that forbids a subagent and requires a stripped copy and a blocking recipe. The evidence in this change says a subagent of the author's session carries the office instructions in whatever folder it works. That is a real check-in, and the author has missed one before.

If the author does follow step 3 and the tool notes:

- Codex `-s read-only`, Grok `--sandbox read-only` or `--tools read_file,list_dir,grep`, and `claude -p` with `Bash(office:*)` denied do not reach the office, including when `AGENTS.md` stays because it is the work.
- OpenCode is the exception. Its note says the bash deny "cannot run office at all" and, in the same sentence, that this is "untested live". If that deny does not hold, and the copy still has `AGENTS.md`, the reader runs `office`.
- Agy can reach the office. The note forbids it as a review-loop reader, after telling you to use it as a reviewer.

The author is not left with zero readers. Codex, Grok and Claude remain. They are stuck for figures only a PDF reader can see: the agy note says it is the only one, and then rules it out. Screenshot readers (Codex `-i`, Claude's Read) are still allowed. That stuck case is visible in the note. It is the cost recorded in taken item 1.

There is no copy location that satisfies every instruction at once. Step 3 says the scratch folder is never inside the project or the home folder. The new reader-copy note says `~/.cache`, and not `/tmp`, `/var/tmp` or `/dev/shm`. Grok's sandbox can write `/tmp` and `/var/tmp`. `~/.cache` is inside the home folder.

## 3. Same rule, missed somewhere else

**Light review, peer step, fix auditor.** The office rule says "peers and auditors too", but those words sit in step 3. The light review never points at step 3. The peer step and the cast say what those readers are for, not how they are started. The code profile is fine: "What readers get" points at step 3.

**Briefs.** Step 3 says materials are included in the copy. `briefs.md`, the six-part brief in `SKILL.md`, `profiles/_template.md` and the web-app profile still hand materials over by absolute path. A path into the live tree gives the reader the live `AGENTS.md`. With a blocking recipe the check-in fails. The stripped copy is still undone. `briefs.md` was left unchanged on purpose (the plan). The new rule never reached it.

**Clean-up.** No miss. The Claude note says to delete `~/.claude/projects/<copy path>` with the copy, and the stop section repeats it. An author who uses the recipe sees that.

**Peer step's "more places".** Covered under the third decline below.

## 4. Declined

**A fifth item in Never skip these — DISAGREE.** "Peers and auditors too" only helps an author who is already in step 3. Never skip these is the list that applies whatever the size, and the light review is the short path. The peer step is step 5, and it does not contain that phrase. I would not add a fifth never-skip item. I would add one pointer on light-review items 2 and 4: start them as in step 3.

**Drop "when the human has not made the decisions" — AGREE.** The opening line only covers a review that was light at the start. The exit covers decisions that turn out unmade once it is underway. The new sentence is a different case: one decision the peers found goes to the human, and the review stays light.

**Leave the full loop's "more places" — AGREE.** In the peer step, "more places" is the fix spreading (more parts of the system), which that section tells you to take to the human. The light review now defines forgotten call sites as coverage. A full-loop author who confuses the two asks the human. That is the slow safe outcome, and rewriting it is outside this change.

## 5. Added and not needed

Nothing in `SKILL.md` or `evidence.md` is padding. Each added sentence is a decision or a taken finding, and the office-repo exception got shorter ("unless they are part of the work").

The reader-copy recipe's `--exclude=/review-loop` is not in the plan or the taken table. Light-review materials live under `review-loop/<change>/`. The recipe drops them. The author then either reviews without the plan, or passes the live path, which is the hole in item 4.

## Problems

**1. Light review never starts readers the new way.** HIGH. An author follows the light review, launches the critic or the fix auditor as a subagent, and the subagent runs `office begin`. The check-in is the bug this change exists to stop, and it is easy to miss. The ability was there before. This change put the remedy in a section that path does not read. Point the light review at step 3.

**2. Agy's note recommends the recipe it then bans.** MEDIUM. An author who follows "As a reviewer, run it in a frozen copy" gets a Gemini reader that can read the live office. The ban is the last sentence of a long note. This change added the ban and left the recipe. Put the ban first, and say the frozen copy is not a review-loop recipe.

**3. Absolute paths still point at the live tree.** MEDIUM. The brief gives `/home/frank/Projects/<project>/…` while the copy is elsewhere. The reader reads the live `AGENTS.md`. Codex, Grok and Claude still cannot complete the check-in. OpenCode might. The absolute-path habit was already in `briefs.md`. This change added "materials included" and did not say that the path is inside the copy. Say that in the six-part brief.

**4. OpenCode's block is untested, and the skill treats it as blocking.** MEDIUM. Unusual: only if that reader is chosen, the deny does not work, and `AGENTS.md` is in what they read. This change wrote "cannot run office at all". Until it is tried, the note should say not to use OpenCode as a review-loop reader, as it does for agy.

**5. No legal place to put the copy.** MEDIUM. The instructions disagree, so the author can see it. Following the skill and using `/tmp` lets Grok write into the frozen copy (Grok's `/tmp` write is older). Following the new note and using `~/.cache` breaks step 3's home-folder rule. Name one location in both places.

**6. `--exclude=/review-loop` drops the plan.** MEDIUM. Unusual: only when the materials are under `review-loop/`. A reader missing the plan can return "nothing wrong". This change added the exclude. Drop it, or say to add back any materials that live there.

The figure-reader gap is real and already flagged for Frank. I would leave it, with the agy ban moved to the front of the note so nobody uses agy anyway.
