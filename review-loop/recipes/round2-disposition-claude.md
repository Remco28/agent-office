# Disposition audit: reader recipes, rounds 0–1

**Verdict:** the sorting of what readers reported is mostly fair, and the "where it came from" labels don't lean soft. The softness is elsewhere: in what never became a row. The goal's hardest clauses are met by a section called "What is left" and by a Done column that says "fixed". I would raise 3 ratings, reopen 2 "fixed" rows and add 4 rows. One of those rows is a likely open HIGH, and a second could become HIGH after one check.

**How this was checked:** I only had read and search tools, so I ran nothing, including git and the CLIs. Everything below comes from the materials and the repo files, and anything I couldn't confirm is marked unverified.

## 1. Declines and lowered ratings that don't hold

**F1. Grok writing to `~/.grok`: MEDIUM should be HIGH.**
- The stated reason, "needs a reader that chooses to", contradicts the goal ("whatever they decide") and Frank's rule ("must not rest on the reader's judgement").
- It is also the reason already rejected for office-data reads, which sit one row up at HIGH. The same mechanism needs the same rating unless there is a new reason.
- The second reason, "affects later Grok sessions", makes it worse, not better. The effect persists, cleanup misses it, and nothing looks there afterwards, which fits the scale's "without anyone noticing".
- The ledger's round 2 prediction names this as the likely raise. Predicting that a rating is soft and keeping it is not a correction, so that prediction earns no credit.

**F2. The same row's "fixed" should be "partly".**
- The fence hides two folders, and writes elsewhere in `~/.grok` remain. Grok's report showed `~/.grok/sessions` was writable too.
- The solver warned that a same-named profile in `~/.grok/sandbox.toml` wins over the copy's.
- Unverified chain: if that file is writable, a reader could weaken the next Grok reader's sandbox, including `restrict_network`, and so reach the office. Grok showed `config.toml` denied but never tested `sandbox.toml`. One `touch` settles it.
- This is a two-folder deny list, which is what the author's new `evidence.md` lesson warns against.

**F3. Project git status check: the decline does not hold, and its reason changed.**
- First reason: "refused by the sandboxes, tested". Grok rejected that for Claude.
- Current reason: "now covered by the fence". But the probe never tests the fence's read-only bind, since it has no write to `<repo>` or through a dependency link.
- So a one-line, independent check is declined in favour of a mechanism nobody re-verifies on a new computer. It is cheap and checkable, and should be taken.

**F4. The dependency-link decline was overturned without being recorded as such.**
- The office-data row says "Author had declined this". This row doesn't, although declines.md shows the same reversal.
- "Claude has no write tool" is missing from "Believed, and wrong".
- The row also omits critic Codex, who raised it first.
- "How checked: reproduced for sandboxes" doesn't test the Claude scenario the finding is about.
- On the scale's words (let through, unnoticed, every `bun test` that writes a cache), I would rate it HIGH. It is fixed, so this only changes round 1's count.

**F5. The office-data decline was never a real reason.**
- It is now fixed, but the record should say why it failed.
- "Nothing pointing it there" was false when written: `readers.md` itself named the path, and "reviewing the office's own repository aside" is this very repo.
- It also ran against Frank's rule when written.
- "A per-CLI deny list is more parts" was refuted by Grok, who pointed to one line in a profile already being written. So this reason was convenient.

**F6. "Frank chose a plan" cannot be checked.**
- PROBLEM.md's decisions don't include it. The only source in the materials is the author's PLAN.md.
- It may have been said in chat, but it needs Frank's line in the record.
- It also wasn't cost-free: Gemini's HIGH (the blind solver gets the built code) follows directly from "the steps below still run".

**F7. Three findings are bundled into one LOW row, and one is under-rated.**
- A pipe in Gemini's brief loses the whole answer, the same mechanism as the saved-rule row rated MEDIUM. It should be MEDIUM.
- The fix did land, so this only affects the count.

**F8. Killed Gemini: MEDIUM is fine, but "partly" should read "open".**
- The only kill test recorded left no text at 40s. That is the original failure, not evidence of a fix.
- The event names came from a finished run.
- `readers.md` gives the kill extractor with no warning, under a header saying each recipe was tested.
- The round 2 prediction says "all of round 1's fixes land", which conflicts with the author's own row.
- This clause of the goal is unproven for one of the four CLIs. A longer kill test is cheap.

**These hold:**
- Stream into the ledger: logs carry all tool output, and Grok agreed.
- Taking the higher rating when readers disagree.
- Rating the author's own discoveries HIGH (python3, connectors).

## 2. Dropped or missing from the ledger

**F9. Likely open HIGH, with no row: running-code Claude can reach the office.**
- `readers.md` says "Code Claude runs is unfenced, so a project's own test that calls the office would reach it." The fence doesn't isolate the network, so port 7701 stays reachable.
- This recipe is the only one that can start a local server, so it is the one projects with server tests will need.
- It is a stated failure of the goal's central clause, written as a note with no rating.
- `Bash(bun test:*)` is also a prefix that runs what it is handed, which the same section forbids. The tested refusals (office, full path, curl, python3, `bun -e`, touch) include no `bun test` arguments, such as `--preload` or a path outside the copy.
- That matches the author's own listed mistake: testing a fence only with the command it names.
- Limit on this finding: the two test files I sampled, `tests/cli.test.ts` and `tests/paths.test.ts`, point `OFFICE_HOME` at temporary folders, and `cli.test.ts` also sets its own `OFFICE_PORT`. I did not check the rest, so this repo's suite may not trigger it. Other projects could.

**F10. No row: readers can read "the rest of the home folder".**
- The author hid Grok's memory because it "holds other projects' topics".
- The same reasoning applies to `~/.claude/projects` transcripts, which may contain office output, and to credentials in the home folder. These are stated as a limit with no rating.
- If transcripts contain office output, this is the office-data HIGH by another route. One `grep` by the author settles it. I did not look.

**F11. No row: "any computer".**
- The solver said Grok's network block is a no-op on macOS. This appears nowhere: not in declines.md, the ledger or `readers.md`.
- The round 1 fix then made Linux-only `bwrap` mandatory for every reader, and on Ubuntu it may need the human to change AppArmor.
- So on a Mac there is no recipe at all.
- A failed probe is visible, so MEDIUM applies, and "not in use" can't be claimed before the check-in. The second computer's OS isn't recorded anywhere.
- The rewritten probe has no recorded run on any computer, and `evidence.md` says only one computer has run the probe so far. Frank was not asked to accept this dependency.

**F12. "Each was tested with this repository's own test suite" is kept in the round 2 rewrite.**
- Every recipe has since been wrapped in the fence, and Claude's flags were replaced.
- PROBLEM.md's table measures the recipes before the fence, and the ledger records no suite run afterwards.
- A reading-only recipe also can't have been tested with a suite. Either re-measure or remove the sentence.

**F13. Solver and reader items that were silently dropped:**
- `~/.grok/sandbox.toml` overriding the profile: the solver's "voids the run" warning is neither taken nor declined.
- Where a passing probe is recorded (Gemini's guess 2): still unanswered.
- Custom `OFFICE_PORT` false-passes (Gemini's finding 2): the probe still hard-codes 7701, and `src/paths.ts:50` honours the variable.

**F14. Changes made with no row:**
- Gemini's `deny` list and `allowNonWorkspaceAccess` were removed. The `deny` list was the kind of backstop you'd want once "session settings add to saved ones" was known.
- Missing dependency folders were handled ("if it exists").
- `GEMINI.md`, `.gemini` and `.codex` were added to the excludes.

**F15. A row with no source:** the connectors finding says "from a reader's report", but none of the four saved reports mentions connectors. Name the source.

**F16. Fixed for two of the four CLIs:** saved user settings are neutralised for Claude and Gemini. Nothing records checking Codex's or Grok's user-level instructions and config. Gemini's report named `network_access = true` in `~/.codex/config.toml` as one example.

**F17. Record-keeping:**
- The ledger says "declines (see below)", but nothing follows it.
- `declines.md` is not among the tracked files in `review-loop/recipes/` in the status snapshot.
- No row has the required "whom it reaches" field.
- "Both auditors rejected the reason" overstates it. Grok did. Gemini reported the read at LOW and doesn't address the decline.

## 3. Where-it-came-from labels

**They don't lean soft.** Every error I found marks as *new* something that could be argued as *old*. That keeps the count up and triggered the move to the full loop. No finding was moved out of the count by a soft *old*.

**They don't follow the rule's method, though.**
- Step 4 says to set the label by checking the earlier version and to record how. No row does this. The "How checked" column covers the fault, not the earlier version.
- Ledger line 6 is a blanket argument used in place of per-finding checks.
- The earlier recipes were in tool notes outside git, so `d86cd1e` alone may not allow the comparison. The ledger should say so.

**Labels that fail on the evidence available:**

| Row | Label | Should be |
|---|---|---|
| Project `.grok` copied | *new* | The earlier SKILL.md excluded the same four names, so this happens on the earlier version: *old*, or at least "meant to be removed" |
| Connectors | "meant to be removed" | Neither PLAN nor PROBLEM mentions them, so probably *old* (unverified), rated and shown to Frank. Fixing it instead of filing it is an undeclared departure |
| Ledger copied to readers; linked worktree | plain *new* | Probably there before as well (unverified), since the tool notes are not available. The blind-solver half of that row is correctly *new* |
| `~/.grok` writes | "meant to be removed" | Plain *new*. Grok attributes it to this change's profile, so the label makes it sound inherited rather than introduced |

## 4. Were expensive or self-authored items treated more gently?

**Yes, but through limits rather than ratings.** Self-reported findings were rated honestly. The gentle treatment sorts by cost:
- **Flags and excludes:** fixed and tested.
- **Stated as limits, or left unrecorded:** Claude's network, reads of the home folder, the rest of `~/.grok`, other operating systems, the second computer, and re-running the suite.

**F18. The biggest case is a skipped step.**
- `code-review.md` requires the peer step before every HIGH or MEDIUM fix, "however small and obvious". The `bwrap` fence is a new design, added with no recorded critic or solver.
- The ledger declares only the missing page as a departure, not this.
- Step 5 says a plan that grows is a design problem to take to the human. `evidence.md` describes `bwrap` as replacing per-CLI fences that kept failing, but it was added on top: per-CLI sandboxes, per-CLI extras, an `empty.json`, and per-CLI probe passes.
- The peer step's job now falls to a single fix auditor reading the diff.

**F19. A rating column that mostly copies.** Where readers gave a rating, Ours matches the highest one in every row but the `~/.grok` row, and only that row gives a reason. Those matches aren't soft, but they show little independent judgment, which the profile warns about.

## 5. Is continuing without the human's page fair?

**Continuing to round 2 is fine. The reason given isn't, and the page can't be waived this way before the review stops.**
- Nothing requires waiting for Frank before round 2, since the check-in comes at round 3. So running the round was legitimate.
- The page is on the "Never skip" list, and the chat exception belongs to the light review. The ledger itself says this stopped being light.
- "One small procedure file" is inaccurate. The change touches four repo files, including a new 124-line one, plus tool notes and memories outside the repo (PLAN §5). Round 1's fixes then added a new sandbox layer.
- The ledger says "said to Frank", with no answer recorded. An author telling the human about a departure from a never-skip rule is not the human agreeing to it.
- The cost is real: F9, F10 and F11 are exactly what the page's decision box is for. Frank decided readers must not reach the office whatever they decide, and the limits now conceding that have not been recorded as put to Frank. The chat account isn't in my materials, so I can't say what Frank saw.
- **Before any stop:** Frank gets those decisions, on a page or in chat, and the answer goes in the ledger.

## Effect on stopping

| | Ledger | After this audit |
|---|---|---|
| Round 1 HIGHs | 5 | 7 (F1, F4), plus F9 open |
| Open items | "partly": 1 | F2, F8, F9, F11 and F12, plus F10 if the `grep` finds office output |

The code profile's stop rule can't be met yet. Whatever round 2's fix auditor reports, F9 is an unfixed HIGH that isn't *old*, unless Frank explicitly accepts it as a limit.

## Not checked

- Anything needing execution: the scenarios on `d86cd1e`, the CLIs, the fence, and whether `bun test` arguments escape the allow list.
- The earlier tool notes, the chat with Frank, and round 2's fix auditor report, none of which are in my materials.
- Whether `declines.md` exists uncommitted in the real repo. I only know it isn't tracked, from the status snapshot.
- The full test suite's isolation from the live office. I sampled `tests/setup.ts`, `tests/cli.test.ts` and `tests/paths.test.ts`, the last two only through a search.
