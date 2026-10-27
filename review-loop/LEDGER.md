# Review-loop ledger: Gemini's `office init` + project-from-folder change
*Kept by the review-loop skill. Safe to delete this folder once the work is done.*

Profile: code-review (skills/review-loop/profiles/code-review.md)
Kept by: claude-9264 (office work item #105)

## Stakes (agreed with Frank, 2026-10-26)
- What: Gemini's uncommitted change on main (c9dad28 + working tree): new `office init`
  (src/init.ts), project detection from the working directory / git worktree
  (src/scope.ts, src/session.ts, src/cli.ts, src/server.ts), AGENTS.md wording.
- Who relies on it: every agent on this machine, and on Frank's other machines once pushed.
  `init` writes into other project repos.
- Cost of failure: memories or work filed under the wrong project or agent, silently, so later
  agents get wrong briefings; `init` writing, overwriting or hiding files where it should not.
- Stop: the code profile's rule (a round with no HIGH, by audited ratings, that needed no
  HIGH/MEDIUM fixes).
- Scope agreed for round 1: **review only**, no fixes. Frank decides on fixes after the page.

Success question: In the ways agents really use the office (several at once, in project repos
and their worktrees), does this change file anything under the wrong project or agent, or make
`office init` damage, overwrite or hide a user's files?

Rules confirmed with: Frank, 2026-10-26, in conversation.
1. AGENTS.md goes in each project that uses the office, and never in the home folder itself
   (`$HOME`). (Reworded at Frank's request; the AGENTS.md text itself is not yet changed.)
2. A name is never inherited: no agent's work is signed with another agent's name.
3. A project-scoped read never returns another project's memories or work.
4. Started in the agent-office checkout with no `--project`, nothing is inferred from the folder.
5. In any other git repo or any of its worktrees, the canonical repo root is detected, so all
   worktrees of one repo are one project.
6. Running `office init` again changes nothing and says it is already set up.
7. `office init` never deletes, overwrites or hides from git a file the user made.
8. Plain reads never write (`context`, `search`, `work`, `issues`, `tools`, `skills`, `list`,
   `status`, `peek`).
9. Project precedence: an explicit `--project` wins; otherwise the folder the agent was started
   in beats a project remembered from an earlier session. (Frank, 2026-10-26.)

## Prior notes (not shown to readers)
Before this loop, one built-in `/code-review` pass (Claude, same session) reported 10 findings.
Kept here so round-1 results can be compared, deliberately withheld from readers so they start
fresh (Frank's instruction):
P1 init attaches to an ancestor git repo (e.g. dotfiles $HOME) and writes AGENTS.md/CLAUDE.md there.
P2 generated AGENTS.md names the project's own path as the agent-office path (init.ts:33). Confirmed by reading.
P3 remembered session project outranks cwd project (session.ts:373). Confirmed by reading; now breaks rule 9.
P4 normalizeProject spawns git synchronously per path on every scoped read (scope.ts:115).
P5 init excludes pre-existing user files from git (init.ts:249).
P6 legacy AGENTS.md symlink replaced by stub; CLAUDE.md symlink left alone (init.ts:216).
P7 AGENTS.md symlink to a shared file edited through; dangling symlink crashes init (init.ts:227).
P8 cwd-detected project reported as project_source "declared" (session.ts:388).
P9 submodules / separate git dir not merged; needs git >= 2.31 (scope.ts:69). (This machine: git 2.55.)
P10 README and server.ts comment stale about setup and cwd inference.

## Round 1, 2026-10-26, c9dad28+cf1f4e8014d5
Step 0: `bun test` 114 pass / 0 fail (incl. tests/init.test.ts); `tsc --noEmit` clean.
Frozen: each reader gets its own copy of the working tree under the session scratchpad
(r1/<reader>/), with a checksum manifest of the pristine copy (r1/base.sha256).

Predictions (written before the round):
- No fixes this round, so no per-fix predictions.
- Per round: 4–8 verified findings. Expect at least one HIGH in init's file handling (writing
  outside the intended project), at least one MEDIUM/HIGH in project attribution (rule 9
  precedence, already known), and one or more MEDIUM on performance of detection on reads.
  Expect readers to independently hit P1, P3 and P5; expect P2 to be missed by most (it is in
  generated text, not logic).

Cast:
- Whole-code reader — GPT (codex gpt-6-luna, -s read-only) — whole repo copy, short brief.
- Attribution specialist — Grok (grok-4.7) — repo copy; lens: which project/agent a record is filed under.
- Init file-safety specialist — Claude (subagent) — runnable repo copy, HOME and OFFICE_HOME pointed at temp dirs; lens: what init does to a user's folders and files.
  (Planned as Gemini; swapped because Gemini wrote the change and would share its blind spots.)
- Rules reader — DeepSeek (opencode deepseek-v4.1-flash-free) — repo copy + the 9 rules.
- Disposition auditor — after sorting.

Reports: round-1/whole-code-codex.md, attribution-grok.md, init-safety-claude.md, rules-deepseek.md;
first sorting round-1/sorted.md; audit round-1/disposition-audit-codex.md. Every reader copy checked
against the pristine checksum after its run: unchanged except git's own .git/index cache.

Final ratings, after the disposition audit (changes from sorted.md marked *):

| Finding | Reader (their rating) | Ours | How checked | Done |
|---|---|---|---|---|
| F1 Remembered session project beats the folder for every command but begin/peek; unnamed agents share and retarget one slot. Rules 9, 3. | Grok HIGH, DeepSeek HIGH | HIGH | reproduced by 2 readers (2 models) | fix recommended |
| F2 init hides the user's own CLAUDE.md (any depth, any time later) and skill folders from git via an unconditional, unanchored exclude. Rule 7. | Claude HIGH, DeepSeek MED, Grok MED | HIGH | reproduced by 3 readers | fix recommended |
| F3* init inside an enclosing repo sets up that repo's root; a git-tracked $HOME gets AGENTS.md/CLAUDE.md/config. Rule 1. | Claude HIGH, DeepSeek MED | MEDIUM* (was HIGH; auditor: needs an unusual setup, output names the path; impact had been substituted for likelihood) | reproduced by 2 readers | fix recommended |
| F4a* AGENTS.md symlink to a shared file: init appends through it, outside the repo. Rule 7. | GPT MED, Claude MED, Grok MED, DeepSeek LOW | MEDIUM | reproduced by 3 readers | fix recommended |
| F4b* `.claude` symlinked outside the repo: init creates `skills` in the outside folder. (Split from F4 by the auditor: different write path, different safeguard.) | Claude LOW, Grok MED | MEDIUM | reproduced by 2 readers | fix recommended |
| F5 Bare / separate-git-dir worktrees split; init then pins every worktree to the one that ran it. Rule 5. | Claude MED, Grok MED, DeepSeek LOW | MEDIUM | reproduced by 3 readers | fix recommended |
| F6 Explicit `--project` subfolder or symlinked path becomes a separate project. | Grok MED, DeepSeek LOW | MEDIUM | reproduced by 2 readers | fix recommended |
| F9* Generated AGENTS.md names the project's own path as the office path, and commits a machine path. | Claude LOW | MEDIUM* (was LOW; auditor: happens on every ordinary init, visibly wrong = MEDIUM) | read in source (me), reported by Claude | fix recommended |
| F7 Dangling AGENTS.md symlink crashes init half-way. | Claude LOW | LOW | reproduced by 1 reader | fix recommended |
| F8 Legacy AGENTS.md→office symlink replaced by a stub, CLAUDE.md link left; README/server comment stale. | DeepSeek LOW | LOW | reproduced by 1 reader | fix recommended, with docs |
| F10* Existing CLAUDE.md without office steps: Claude agents never see them, output silent. (Narrowed: the `.claude/skills`-only case was wrong; init still links CLAUDE.md then.) | Claude LOW | LOW | reproduced by 1 reader; narrowing checked in source | fix recommended (say so in output) |
| F11 Typo path is created and git-init'd silently. | Claude LOW | LOW | read in source by me (mkdirSync recursive + git init) — tier 1, so no kill check needed | decline: expected for a setup command; mention in help |
| F12 Scoped reads run git synchronously per known project path. | prior pass only | LOW | measured by me: 2.5 ms per git-repo path (one path measured; 30-path figure is an extrapolation) | fix recommended (cache) |
| F13* cwd-guessed project labelled `project_source: "declared"`. (Restored as its own finding: changing F1's order does not change the label.) | inside Grok/DeepSeek F1 | LOW | read in source | fix recommended |

Rules 2, 4, 6, 8: no reader found a break (DeepSeek KEPT with code quoted; Grok, Claude agree on 2, 4).
Audited counts: HIGH 2, MEDIUM 6, LOW 6. Stop rule not met (auditor agrees): HIGH findings need fixes.

What happened against the predictions:
- "4–8 verified findings": wrong, 14 (the change is larger in effect than its line count).
- "At least one HIGH in init's file handling": right (F2), though not the one I expected (F3, now MEDIUM).
- "MEDIUM/HIGH in attribution, rule 9": right, HIGH (F1), and wider than the prior note.
- "Readers independently hit P1, P3, P5": right, all three, each by 2–3 readers.
- "P2 missed by most": right, one reader of four.
- "Performance finding from readers": wrong, no reader raised it; only the prior pass did.

Believed, and wrong:
- "F3 is HIGH: effects reach every agent on the machine" — that is impact, not likelihood; it needs a git-tracked home or an enclosing repo, and the output names the path. MEDIUM.
- "F13 goes away if F1's fix gives the folder its own source" — an assumption about a fix not yet designed, used to fold away a real finding.
- "F10 covers an existing .claude/skills" — wrong: with no CLAUDE.md, init still links one.
- "F9 is LOW: wrong text, no wrong filing" — visible-and-wrong on every init is MEDIUM under the profile.

## Mistakes the next author will make
- Rating by how bad it would be if it happened, without saying how often it happens. Write both.
- Folding a finding into another on the strength of a fix nobody has designed yet.
- Running `codex exec` from a background shell without `< /dev/null`: it waits on stdin forever and returns nothing.
- Fixing F1 by only swapping the order on one line: `begin`/`peek` send the folder as a declared project, so the label (F13) and the shared unnamed slot (F1 scenario B) need the same thought.

## Decisions (Frank, 2026-10-26, after round 1)
All five accepted as recommended:
1. Fix all HIGH and MEDIUM (F1, F2, F3, F4a, F4b, F5, F6, F9), each through the peer step before code; round 2 with a fix auditor.
2. Fix LOW F7, F8, F10, F12, F13; decline F11 (mention in help text).
3. F3: when init would set up a different folder than the one named (an enclosing repo), stop and say which folder, so the user reruns it on the right one.
4. When the agent's folder is not a repo, the remembered project is still used (rule 9 has nothing to go by).
5. Reword rule 1 in AGENTS.md in the same change.
6. (Frank, 2026-10-26) One agent, one repository. Agents are now started inside the project repo,
   not in the office checkout, so an agent never switches to another repo. If asked to, it suggests
   starting a new agent in that repo instead. Consequence for A1: strict rule 9 (this call's
   --project > folder > remembered); no own-begin rung; a mismatch note tells the agent to start
   another agent there. AGENTS.md and the init-generated section say so; the "targeting another
   repo" begin line goes.

## Build after round 1 (claude-9264, 2026-10-26)
Peer step: 3 passes (round-1/peer1-3), plan v1 → v4 (round-1/fix-plan-v4.md), smaller each pass.
Built v4. `bun test` 140 pass / 0 fail; `tsc` clean. New tests: tests/project-scope.test.ts (12),
tests/init-safety.test.ts (12), 2 in tests/cli.test.ts. Run against Gemini's original code
(r1/base copy): 24 of 26 fail as intended; the 2 that pass there are "a submodule is its own
project" (meant to be unchanged) and the session-layer half of "nameless begin leaves the unnamed
slot alone" (the old bug was in the CLI layer; the new CLI-level test of it fails on the old code).
End-to-end smoke in a throwaway office: init, refusal in a subfolder, begin from the folder, a write
from another repo filed there with the stderr note — all as designed.
Not done: the live daemon on this machine (pid 2950385) still runs the pre-fix code; Frank restarts
it (`office stop && office serve --detach`). With an old daemon, the new CLI's begin sends the
folder as cwd_project, which the old daemon ignores.

## Round 2, 2026-10-26, c9dad28+0a0f3cd577e8 — predictions (written before the round)
Per fix — what a reader should now say that they could not before:
- F1: a write from repo B by a session that began in A lands in B and warns; nameless begins no
  longer retarget each other. Readers should find no wrong-project filing in normal use.
- F2: no reader finds init hiding any user file from git (init no longer writes the exclude file).
- F3: init inside another repo / a git-tracked home refuses before writing anything.
- F4a/F4b/F7/F8: no write through any link; no crash on a broken one.
- F5: bare / separate-git-dir worktrees share a key; submodules unchanged.
- F6: subfolder/symlink --project = repo root.
- F9/F10/F13: generated text has no path; CLAUDE.md warning; "folder" label.
- F12: one git call per distinct path per request.
Per round: 0 HIGH; 1–3 MEDIUM, most likely in what is new and unreviewed: the mismatch note
(when it fires / stays silent), init's preflight ordering (something still written before a
refusal), and the doc rewrites contradicting each other or AGENTS.md elsewhere. 2–5 LOW.

## Round 2 results (after the disposition audit)
Reports: round-2/fix-audit-codex.md, whole-code-grok.md, init-safety-claude.md, rules-deepseek.md;
sorting round-2/sorted.md; audit round-2/disposition-audit-codex.md. Reader copies unchanged after
their runs except git's .git/index cache. Note: the codex fix auditor ran `office peek` against the
live daemon despite the brief (read-only, wrote nothing).
Fix auditor: no findings (every round-1 fix landed; nothing missed elsewhere).

Audited ratings (changes from sorted.md marked *):
| Finding | Readers | Ours | How checked | Done |
|---|---|---|---|---|
| G1 office.project pin: copied/restored/moved repo files under the original; re-init after a move hides old rows | Claude MED+, DeepSeek MED, Grok MED | HIGH | reproduced by 3 readers | fix: drop office.project |
| G2 submodule inside a superproject worktree splits from the main checkout's submodule | Grok MED | MEDIUM | reproduced by Grok and me | fix |
| G3 `.claude`→`.agents` link: init crashes half-way (EEXIST) | Claude MED | MEDIUM | reproduced by Claude and me | fix |
| G4* GIT_DIR in the environment pointing at another repo: cwd filed under that repo; init rewrites its config | Grok MED | MEDIUM* (was LOW; auditor: silent cross-repo misfiling, an unusual sequence = MEDIUM) | reproduced by Grok and me (tier 1) | fix: office's git calls ignore GIT_* repo variables |
| G5 loose "has office instructions" match skips the section | Claude, DeepSeek LOW | LOW (reason corrected: no file damage, but init reports success while the project has no startup steps; a stale old-style example can misdirect) | reproduced by 2 | fix |
| G6 quoted `~` not expanded | DeepSeek LOW | LOW | repro | fix |
| G7 non-UTF-8 AGENTS.md re-encoded | Claude LOW | LOW | repro | fix: append bytes |
| G8 AGENTS.md is a directory → CLAUDE.md linked to it | Claude LOW | LOW | repro | fix |
| G9 worktree init: message names the main repo | Claude LOW | LOW | repro | fix |
| G10 init on a folder holding other repos | Claude LOW | LOW (reason corrected: explicit target, but its CLAUDE.md reaches every nested project's Claude agents) | repro | decision for Frank (recommend refuse) |
| G11 user's own .claude/skills: silently no link | Claude LOW | LOW | read in source | fix: warning |
| G12a* AGENTS.md read at planning, rewritten later: an edit in between is lost | Claude LOW | LOW, tier 1* (checked in source) | read in source | fix: append bytes (same change as G7) |
| G12b* a failed git init leaves the newly made folder | Claude LOW | LOW | read in source | decline: empty folder, visible, the error says what failed |
| G13 tui.ts old begin text | DeepSeek LOW | LOW | read | fix |
| G14 generated first-reply sentence ≠ AGENTS.md's | DeepSeek LOW | LOW | read | fix |
| G15 README/help omit "only if missing" | DeepSeek LOW | LOW | read | fix |
Audited counts: HIGH 1, MEDIUM 3, LOW 12 (one declined). Stop rule not met (auditor agrees).

What happened against the predictions:
- "0 HIGH": wrong — G1, in a mechanism kept from the original design, not in new code.
- "1–3 MEDIUM in the mismatch note / preflight ordering / docs": wrong on place, right on count
  (3): the MEDIUMs are in git layouts (G2), link handling (G3) and the environment (G4).
- "2–5 LOW": wrong, 12 — init's edge cases were not exhausted by round 1.
- Per-fix predictions F1–F13: held — every round-1 fix was confirmed by the fix auditor and by the
  rules reader (rules 1–10 KEPT except rule 5 via G1/G2).
Believed, and wrong:
- "A repo copied with its `.git/config` merges into the original via `office.project` (known; not
  new)" — accepted as a residual in plan v4 without a rating; it is the round's HIGH.
- "G4 is LOW: git itself treats GIT_DIR as this repo" — that explains git, not the cross-repo result.

## Round 2 decisions (Frank, 2026-10-27): yes to all four
1. Fix G1–G4 through the peer step, then round 3. 2. Stop writing and reading `office.project`.
3. G10: init refuses a folder that holds other git repositories. 4. Fix 11 LOW; G12b declined.
Peer step: round-2/peer/ (problems.md, plan-v1.md, critic and solver reports).

## Round 2 fixes (built 2026-10-27)
Peer step: round-2/peer/ — pass 1 (critics Codex, Grok; blind solvers Claude, DeepSeek), pass 2
(critic Claude, fresh; DeepSeek gave no verdict), pass 3 on the built code (Codex, fresh): one
detail, fixed by deleting a rewrite. The plan shrank each pass (plan-v1 → v3).
- G1: office.project neither written nor read; init writes nothing to git config.
- G2: a submodule in a superproject worktree takes the main checkout's submodule key
  (fallback, no main copy: <superproject root>/<module git path>); every other layout unchanged.
- G3: skills links deduped by real path. G4: every office git spawn drops git's repo-selecting
  variables (incl. injected config and GIT_CEILING_DIRECTORIES).
- LOW: G5 heading/marker only; G6 ~; G7/G12a append bytes; G8 no CLAUDE.md to a folder; G9
  worktree message + branch warning; G10 refuse a folder holding repos (only when it is not itself
  a repo; 3 levels, no dot/node_modules); G11 warn on own skills folder; G13 tui text; G14 first-
  reply sentence; G15 README/help/AGENTS.md. G12b declined.
Tests: 156 pass; each new test failed on the round-2 code (the collision test also on the v3 draft).
Smoke (throwaway office): init, copy → its own project, init ~/P refused, GIT_DIR ignored, no git
config line. Read-only check of the live DB: no stored project path is missing; no repo carries
office.project — P1's move cost is zero on this machine today.
Open decision for Frank: a command to re-file a moved project's notes (not built).

## Round 3, 2026-10-27, c9dad28+b3a4d5cf07b4 — predictions (written before the round)
Per fix: G1 — no reader finds a copied/moved/restored repo filed under another path; G2 — the
worktree submodule shares the main key and no reader finds a changed key for a main-checkout,
bare or separate-git-dir layout; G3 — init with aliased harness folders completes; G4 — no git
variable redirects detection or init; LOWs — each reader who looks finds the stated behaviour.
Per round: 0 HIGH. 0–2 MEDIUM, most likely in the new pieces: nestedRepos (a real project refused,
e.g. one holding a nested non-submodule clone before git init, or slow on a big tree) and
worktreeSubmodule (a layout the regex mis-shapes). 2–6 LOW, mostly wording and edge inputs.

## Round 3 results (after the disposition audit), 2026-10-27, c9dad28+b3a4d5cf07b4
Reports: round-3/fix-audit-codex.md, whole-code-claude.md, layouts-init-grok.md, rules-deepseek.md;
sorting round-3/sorted.md; audit round-3/disposition-audit-codex.md. Codex fix auditor again
tried `office peek` (sandbox blocked it). Rules reader: all 10 rules KEPT.
Audited: HIGH 0; MEDIUM 9 — H1 nested-repos check (depth, links; auditor: track as two cases),
H2 nested worktree submodule key, H3 separate-git-dir home, H4 hard-linked AGENTS.md, and raised
by the auditor from LOW: H5* name `.bare` (visible, committed file), H7* "w" create race and
H11* concurrent init (profile: rare timing = MEDIUM, never LOW; H11 can also append twice),
H10* init on a worktree of a home repo, H12* `.git` link to a non-repo. LOW 6 — H6, H8a, H8b (H8
split by the auditor), H9, H13, H14 (tier 2: needs its kill check before any fix).
Stop rule not met (auditor agrees).
What happened against the predictions: 0 HIGH held; MEDIUM 0–2 wrong (9 audited; 4 before the
audit); place right for H1/H2; LOW 2–6 right (6 after re-rating).
Believed, and wrong:
- "Accepted cost: a nested submodule ... differs from the main checkout's key if it is initialised
  there later" — H2, MEDIUM.
- "Rare timing → LOW" (H7, H11) — the profile rates rare timing MEDIUM; I applied a looser rule.
- "separate-git-dir: the git folder is the key" (round 1, F5) — misses a checkout at home (H3).
Round-3 peer pass 1 (plan in round-3/peer): critics Codex, Claude; blind solver DeepSeek. Q1 (H1)
grows each pass (budget refusals, links to ancestors, bare repos, skip lists) → taken to Frank as
a design question, as the method says. Q2–Q4 converge with details (gitdir must exist; stale
core.worktree fallback; allow AGENTS.md hard-linked to CLAUDE.md only).
Decisions put to Frank (round 3): fix 9 MED via one plan check + short round 4; how to detect a
folder of projects (recommend: short scan + the office's known projects); moved/removed projects
as a separate piece after the review; fix 6 LOW after H14's kill check.

## Round 3 decisions (Frank, 2026-10-27)
Yes to all. On the folder-of-projects check: "a folder that holds other projects is really just
~/Projects ... projects won't be buried very deep" — so the short look stays (3 levels), links to
repositories count, links are not searched further; docs say "a few folders down".
Moved/removed projects: Frank's idea (note removed, carry moved); my proposal (identity = first
commit, kept in the office DB) — a separate piece after this review.

## Round 3 fixes (built 2026-10-27)
Peer step round-3/peer: pass 1 (critics Codex, Claude; solver DeepSeek), Frank's answer on Q1,
pass 2 (fresh critics Claude, DeepSeek — independently found H14 half-fixed, Q2's relative gitdir
file, H5's dot rule too wide), pass 3 on built code (Codex): a link to a folder of repositories
is not searched — the deliberate limit from Frank's answer; recorded, not changed.
- H1 links to repositories count; H2 worktree-submodule fallback from the checkout path (gitdir
  file resolved against its own folder; guards: gitdir must exist, path must not escape); H3 no
  project when the checkout top is home; H4 hard links left alone (except AGENTS.md≡CLAUDE.md);
  H5 displayName (.bare/.git → parent, .git suffix dropped) for banner and init; H7 "wx" + re-read;
  H11 links made once (EEXIST with same target = done), parents re-inspected, append through one
  O_NOFOLLOW descriptor with a marker re-check; H10 refuse a worktree of a home repo; H12 refuse a
  .git link/file git cannot read, and name dubious ownership; H14 replaced: warn when git ignores
  AGENTS.md/CLAUDE.md (check-ignore); "not fully set up" when AGENTS.md lacks the section.
- LOW: H6 note for a named project ≠ folder; H8a/b help; H9 no git = not a repository; H13 banner.
- Known limits (accepted): a link to a folder of repositories; projects deeper than 3; a branch
  that moves a submodule; a separate-git-dir superproject's fallback root; a worktree elsewhere of
  a separate-git-dir home repo is its own project; the double-append window between the
  descriptor's read and write (microseconds; 20/20 concurrent runs clean).
Tests: 170 pass; each new test failed on the round-3 code. Smoke: .bare named proj; stale
OFFICE_PROJECT warns; hard-linked AGENTS.md untouched and "not fully set up".

## Round 4, 2026-10-27, c9dad28+8a99de66db06 — predictions (written before the round)
Cast (as agreed with Frank): fix auditor (Codex, fixes diff only), git-layout / init specialist
(Grok), disposition auditor.
Per fix: each H-finding's scenario now gives the stated result; no reader finds a write outside
the project or through a link, or a changed key for any layout round 3 found clean.
Per round: 0 HIGH. 0–2 MEDIUM, most likely in the newest code: appendSection (descriptor / link
count), the .git refusal (a folder git can repair being refused, or the reverse), and
worktreeSubmodule's guards. 1–4 LOW (wording, warnings).

## Round 4 results (after the disposition audit), 2026-10-27, c9dad28+8a99de66db06
Reports: round-4/fix-audit-codex.md, layouts-init-grok.md; sorting round-4/sorted.md; audit
round-4/disposition-audit-codex.md. Every round-3 fix held (Codex hunk by hunk; Grok's runs).
Audited: HIGH 1 — J1* (raised by the auditor from my MEDIUM: init through a link into a repo's
subfolder plants a nested repository; the message reports the action, not the wrong split).
MEDIUM 3 — J2 deinit'd main submodule copy, J3 separate-git-dir superproject's worktree submodule
(decision for Frank), J4 `.claude` swapped during init. LOW 2 — J5 wording (fix), J6 link to a
folder of repos (declined: Frank's decision). Stop rule not met.
What happened against the predictions: 0 HIGH wrong (J1, in round-1 code); MEDIUM count 3 within
"0–2"? no — wrong by one; place partly right (J2 worktreeSubmodule, J4 the re-check). LOW right.
Believed, and wrong: "init compares real folders" (round 1) — the repository lookup used the typed
path (J1); "the main copy's config exists → its key" — deinit keeps the config (J2); my MEDIUM for
J1 — "visible" described the action, not the harm (auditor).
Round-4 peer (round-4/peer): critic Claude + blind solver DeepSeek agreed on the approach; plan v2
smaller for J1 (one place: hasGitAncestor), J4 made at the recorded real folder. J4 has no test
(a timing race); checked by reading. Pass on built code: fresh Claude critic.
Built: J1 (hasGitAncestor real path; init writes at the real target), J2 (main copy only with
core.worktree), J4 (link at the recorded real folder; re-check after, warn), J5 wording; from the
built-code pass: friendly error for a file/broken-link target, git init race tolerated. 172 tests.
J3 open for Frank (recommend: accept as a known limit).

## Round 5, 2026-10-27, c9dad28+02caab5c9c22 — predictions (written before the round)
Cast: fix auditor (Codex, round-4 fixes diff only); disposition auditor.
Per fix: J1 refusal holds for links into subfolders; J2 key stable across deinit; J4 no write
through a swapped link when .claude started as a link, warning otherwise.
Per round: 0 HIGH, 0 MEDIUM, 0–2 LOW (wording). If that holds, the code stop rule is met.

## Round 5 results (after the disposition audit)
Fix auditor (Codex): no regression, nothing missed; one note, K1. Audit raised K1 from LOW to
MEDIUM (profile: rare timing = MEDIUM, even for a message) and required confirmation: confirmed —
`git init` on an existing repository exits 0 with "Reinitialized existing" (checked by running it).
Stop rule not met (K1 needed a MEDIUM fix; J3 open with Frank).
Against the predictions: 0 HIGH held; 0 MEDIUM wrong (K1, by the rule); LOW right.
Believed, and wrong: "wording in a rare race → LOW" — the same softening the round-3 audit caught.
K1 fix: git init's output read in English (LC_ALL=C); a "Reinitialized" reply counts as an
existing repository. Deviation, said plainly: no peer step for K1 — a message-only change (nothing
stored or computed); the round-6 fix auditor is its check.

## Round 6, 2026-10-27, c9dad28+62065420e760 — predictions (written before the round)
Cast: fix auditor (Codex, K1 diff only); disposition auditor. Per round: 0 HIGH, 0 MEDIUM, 0 LOW.

## Round 6 results (after the disposition audit)
Fix auditor (Codex): K1 holds; no behavioural finding. L1 (LOW, test-only): the legacy-slug test
named a real repo under ~/Projects, so it ran git on the user's folder (timed out in the sandbox);
fixed to paths that cannot exist. 172 pass. Audit: L1 rating holds; the K1 peer-step skip's reason
("message-only, nothing computed") is wrong — it changes the returned result — so the peer check
was run afterwards (round-6, Claude critic). Stop: met for round 6, provided Frank accepts J3.
Against the predictions: 0 HIGH, 0 MEDIUM held; 0 LOW wrong (L1).
Believed, and wrong: "K1 is message-only, so it needs no peer step" (auditor).
K1 peer check (afterwards): holds; three LOWs applied (repair reported, brief resolve retry after a
failed racing git init, no multiline match). 173 pass. These LOW fixes came after round 6's fix
audit; the stop rule concerns HIGH/MEDIUM, so they do not reopen it, but no reader has seen them.

## Where it stands (2026-10-27)
Six rounds. Audited totals — R1: 2 HIGH / 6 MED / 6 LOW; R2: 1/3/12; R3: 0/9/6; R4: 1/3/2; R5:
0/1/0; R6: 0/0/1. Stop rule met at round 6 if Frank accepts J3 as a known limit.
Not done by the loop: merit (is "the folder is the project" the right design?) — Frank's call;
commit; daemon restart; the moved/removed-projects follow-up.

## Mistakes the next author will make
- Rating a rare-timing or "only a message" failure LOW: the profile says MEDIUM (rounds 3 and 5).
- Accepting a residue in a plan without rating it: it came back as a finding (G1, H2).
- Comparing real paths in one place and asking git about the typed path in another (J1).
- Trusting that a git config file exists ⇒ the key it would give (J2: deinit).
- Unquoted heredocs in ledger notes: backticks run as commands and drop words.
- Copying the repo with `--exclude review-loop` also drops skills/review-loop; anchor it (/review-loop).
- Briefing Codex without "--skip-git-repo-check" outside a repo, or without `< /dev/null`.

## Close (2026-10-27, Frank)
J3 accepted as a known limit ("we can skip it for now"; design for `--separate-git-dir` only if it is
ever needed); noted in the comment on `worktreeSubmodule` in src/scope.ts. Stop rule met at round 6.
Merit: Frank confirms "the folder is the project" is how the office has operated. Daemon restarted
by Frank (pid 3983771, 08:41, from this checkout). Committed at Frank's request.
Left over: one reviewer's session row in the live office points at
/tmp/opencode/repro4-u2eHqi/project-x (claude-5835); harmless, drops after a month unseen.
