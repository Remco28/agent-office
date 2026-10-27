# Plan v3 critic — DeepSeek (opencode deepseek-v4.1-flash-free, fresh). Saw: fix-plan-v3.md, LEDGER.md, repo copy r1/opencode.

I'll start by reading the plan, ledger, and the code.
## Report: fixing plan v3

Verdict: **no HIGH left in it.** The precedence change is the one Frank decided, init's file handling is safe in every case the plan names, and the two [v3] mechanisms I could test on this machine (B2's ignore pair, A3's `core.worktree`) are correct. Two items should change before code: **B6** (it introduces a crash and a false warning) and **A1's mismatch note** (as written it cannot fire where it matters). The rest are sharpenings and one dead spec.

Method: read the plan, LEDGER, v2 (so the "as v2" items are checkable), and the code; ran the git layouts in throwaway repos under `/tmp/opencode` with git 2.55.

---

## 1. Does each item fix the problem it names?

### A1 — folder beats remembered (F1, F13). Mostly, but its own safeguard is broken as specified.

- **The note can never fire on `begin`.** `/begin` calls `beginSession` (which writes) *then* `briefing` (`src/server.ts:200-214`), and `briefing` resolves scope by re-reading the rows (`src/session.ts:569`). A1.3 has `begin` store the folder, so after the write the row's project **is** the folder and "folder ≠ own row" is false. The one command where an agent moves from B to A — the one that should say so — is exactly the one that stays quiet. The note has to be computed from `previous.project`, the pre-write row `/begin` already holds. Say that in the plan; it is not implied.
- **The note is specified once, in `resolveScope`, but only `begin`/`peek` print anything.** The commands where a wrong folder really costs something are the writes: `remember`, `work open`, `issue open` post `cwd_project` (`src/cli.ts:510,627,682`) and none has a note field or a CLI printer (`printAuthorWarnings` is called only on begin, `src/cli.ts:492`). Concrete: agent's row is A, a build/test shell leaves it in `~/Projects/other`, it runs `office work open "…"` — the item is filed under `other`, invisible to every later `office work` in A, and nothing on stderr. That is a lost handoff, which is the whole stakes paragraph of the ledger. The plan needs "every response whose scope came from the folder and differs from the caller's row carries the note, and the CLI prints it on every command", plus a field name (`note` is already taken by briefing's "nothing recorded").
- **The office-checkout rule holds only for the main checkout.** A1.3's "office-checkout begin keeps the stored project" is true because `detectCwdProject` returns null at `ROOT`, but an *office worktree* returns the office root (`src/scope.ts:85-95`: `canonical` is the main checkout, `worktreeRoot !== ROOT`). So `begin` in an office worktree rewrites the row to agent-office. Fine under decision 6, but the plan's test ("begin in the office checkout keeps the stored project") will pass in the main checkout and quietly not hold in a T3 worktree. Add the worktree case or scope the sentence.
- **Not asked for, but it changes the briefing frame:** `/begin` passes `since: previous.updated_at` (`src/server.ts:210`). An agent moving B→A is told "since you were last here" using B's check-in, so A's activity before that moment is hidden and a first-ever visit to A is framed as a return visit. Peer-2 codex raised it; v3's `active_since` condition (A1.4) does not cover the watermark. LOW, but decide it rather than leave it.
- F13 is genuinely fixed by A1.4 ("folder" is its own source) — that part holds.

### A3 — holds, with one dead bullet.

I verified: submodule common dir = `super/.git/modules/sub`, `core.worktree = ../../../sub`, resolves to `super/sub` = today's key; separate-git-dir has `core.bare=false`, `core.worktree` unset, and `git worktree add` from it keeps it unset, so main checkout and linked worktree both key to `sep.gd`. Exactly as written.

But the first bullet ("bare → the key is the common dir") is **unreachable through detection**: with no `.git` entry `hasGitAncestor` is false (`src/scope.ts:22-31`) and `resolveGitProject` bails before `--git-common-dir` anyway; if `--show-toplevel` fails it returns null (`src/scope.ts:57`). So the only live bare rule is init's refusal. Delete the bullet, or say detection still gives nothing in a bare repo and only init changes. Otherwise someone writes a branch no test can reach.

Also: run the bare probe on the **nearest existing parent**, not the target, for a target that does not exist yet. `git -C /nonexistent rev-parse --git-dir` fails with 128 (verified), so `office init bare.git/newthing` would mkdir and create a nested `.git` inside the bare repo — the exact bug A3 exists to stop. B1's v3 wording already says "nearest existing parent"; A3's does not.

### A4 — fixes the repeat, not the measurement.

Per-request memo removes the duplicate normalisations inside a call (`matchingProjects` normalises each candidate twice — `src/scope.ts:218` and again via `projectKey` at 221 — and a briefing calls it ~3×: `searchDetailed`, `listWork`, `countInScope`). Good. But the F12 figure is "2.5 ms per known project path"; after the memo a request still runs one git spawn per *distinct* known path, so the 30-path ≈ 75 ms survives. If that figure is what F12 is about, the cheap complement is a pre-filter before any spawn: a stored value with no `/` cannot be a path (legacy names), and a path that does not exist cannot resolve (`hasGitAncestor` already does this, but only after `normalizeProject` has decided it's a path). Three lines, no plumbing. Also: **A4 has no test in the list** — v2's list didn't either. If tests must fail first, it needs *some* observable, even a counter.

### B1 — yes (given decision 3). One consequence worth naming, not a defect.

`office init` from anywhere but the repo root now refuses where it used to set up the root. That is what decision 3 asks for, and v2's message prints the exact `office init <root>` to rerun. Keep that text exact; it is the whole usability of the refusal. v3's nearest-parent rule for a nonexistent target is right, and it also fixes the not-yet-created target inside an enclosing repo (git on the parent, not the target).

### B2 — the pair works; the rationale is slightly too absolute.

Verified with git 2.55 in a repo with the two pairs in `.git/info/exclude`: the link is hidden; a real top-level folder is visible; a real folder in a **second worktree** is visible; a nested link is unaffected. CLAUDE.md never excluded is right.

Two gaps:
- **A user's own symlink replacing the link stays hidden.** Replace `.claude/skills` with `ln -s ~/my-skills .claude/skills` and `git status -uall` still shows nothing (verified) — `!/.claude/skills/` matches directories only. So "the pair can never hide a user's folder" is true; "never hides a user's file" is not. If rule 7 is read strictly, the only safe version is **no exclude line at all**, accepting `?? .claude/skills`; if Frank accepts the link case, keep the pair and say so in one clause instead of claiming impossibility.
- **The block is now machinery for a feature v3 removed.** With no removal logic, nothing ever parses the block; the existing Set insert (`src/init.ts:91-100`) plus a `# agent-office init` comment is the whole job. Don't write a block rewriter.
- CLAUDE.md: because v3 never removes its old line, a repo initialised by the *current* code keeps CLAUDE.md hidden forever. Peer-2 Claude grepped and found none on this machine, so there is nothing to repair — but the plan should say that out loud, so the next reader doesn't assume the claim "CLAUDE.md is committed with AGENTS.md" is retroactive.

### B3 — yes, and it is the smaller answer. Keep it.

Leaving both legacy links and warning removes F8's inconsistency without a migration, and "never read" covers F7's dangling link for AGENTS.md.

### B4, B5, B7 — fine.

B4's "real top folder = the worktree being set up" is the right boundary. B5 testing the generated file rather than the JSON is right.

### B6 — two concrete defects. This is the one item I would not ship as written.

1. **It adds a read that can crash init half-way — the F7 failure, one file over.** `CLAUDE.md` may be a dangling symlink (`ln -s ../shared/CLAUDE.md CLAUDE.md` is a normal thing to have). Today init only `lstat`s it (`src/init.ts:222-226`); B6 must `readFileSync` it to decide whether the office steps are there, and a dangling link throws after the git config and the skills links are already written. B3's "any link is never read" does not extend to CLAUDE.md. Decide: `lstat` first, warn, never read a link.
2. **It warns on init's own link.** The normal init result is `CLAUDE.md -> AGENTS.md`, and AGENTS.md (the regular file) has the section. If the check refuses to follow a link, every ordinary `office init` prints "Claude Code reads CLAUDE.md, not AGENTS.md — add `@AGENTS.md`" while saying "already set up". B6 needs to follow a relative link that stays inside the worktree, or special-case the init-made link. v2's text ("unless it already has office instructions") presumes the read; B3's absolute wording contradicts it. This contradiction is new in v3 and nobody has checked it.

### Docs — the item is narrower than decision 6.

A1.5 changes the `begin` example and the inheritance sentence. The README still says the opposite in four places: "You start every agent in this repository on purpose" (README:16), "`office begin --project ~/Projects/the-thing`" as the normal way (README:109), "Nothing is inferred from the working directory: agents are started in the office itself" (README:116), "Named reads inherit the project declared at `begin`… A command's `--project` overrides that remembered project" (README:192), "Agents are started here" (README:233). AGENTS.md line 11 ("You were started here… This is the doorway") and line 51 ("Ask the human which project you are in, declare it, and read again") also survive, and line 76 says "you were started here". Under decision 6 those are now false for the standard launch, and the README paragraph at 116 is the one a human reads before launching agents. Also `cli.ts` help (lines 138-142, 188-192) still says `--project`/`--by` "replace what the office remembers, for you alone" — rule 9 now says the folder beats the remembered project.

---

## 2. What each item breaks that works today

- **A1: the CLI test suite becomes cwd-dependent.** `tests/cli.test.ts`'s `cli()` spawns with the runner's cwd (no `cwd:`), and its fixtures are `/p/alpha`/`/p/beta` with no folder. In the main checkout `detectCwdProject` gives null, so it passes. Run the suite from an agent-office **worktree** and `ROOT` is the worktree while `repoRoot` is the main checkout (`src/scope.ts:89-94`), so every command gets `cwd_project = /home/frank/Projects/agent-office` and the folder wins over test-1111's `/p/alpha`: "named reads inherit their own project" and "anonymous … cannot borrow" fail. The plan lists only the `"folder"` label updates at `tests/cli.test.ts:60/65`. The fix is one line per helper — spawn with `cwd:` set to the test's temp dir — and it should be in the plan, because it will otherwise be "fixed" by weakening the assertions.
- **A1: `begin --project B` then working from A becomes unstable** (later commands file under A). That is decision 6, not a regression — but the *only* warning is the mismatch note, which is why the note's scope matters (above).
- **A2: copied repos with a carried `.git/config` merge into the original**, because `linkedProject` is preferred over `repoRoot` and A2 now applies that preference to explicit paths too. Nothing in this change creates it, but this machine's review copies are exactly that shape; worth knowing before someone copies a repo and can't tell why its memories moved.
- **A3: the project key for a separate-git-dir repo moves** from the checkout path to `x.git`. Any record already filed under the checkout path is no longer matched by folder detection (the basename also changes: `myrepo` → `myrepo.git`). Unreleased change, so likely empty, but say it.
- **B2: repos that followed the old README (`ln -s` by hand)** now have an untracked `?? .claude/skills`: `isSymlinkTo` is true, so "this run created a link" is false, so no lines are written, and init reports "already set up". Correct by rule 7, but README should say to commit or ignore it.
- **B6: the crash and the false warning in §1.** Both are new.
- **B4** breaks nothing I can see; a `.claude` that is a link *inside* the repo still works, and git shows `?? .claude` for the link itself either way (the ignore line never covered a symlinked `.claude`).

---

## 3. Bigger than it needs to be

- **B2's marked block**: with removal gone, nothing consumes the block. A comment line plus the existing dedupe Set is the smaller version.
- **A3's bare key bullet**: unreachable; delete it, keep init's refusal.
- **A4's request-wide map vs. a pre-filter**: the map stops repeat work but not the per-path base cost. If the goal is the measured figure, `existsSync`/no-slash filtering is smaller *and* hits the base; the map is still worth it, but the plan should not present it as answering F12's number.
- **A1 is sized right** — this is a 3-line order change plus a note, and the note is the only new machinery.
- **B3 is already the smaller version** of v2. Keep it.

---

## 4. The [v3] items, checked

| [v3] item | Holds? |
|---|---|
| A1.1 decision-6 order, no own-begin rung, mismatch note | Order holds. **Note fails as specified** (computed after the write; no home outside `/begin`). Fix before code. |
| A1.2 briefing takes the folder separately, source "folder" | Holds. Straightforward, and it is what keeps F13 fixed. |
| A2 "looks like a path" guard kept; `$HOME` real paths | Holds. Keep it literally: `looksLikePath` before any stat, or `src` resolves against the daemon's cwd. |
| A3 `core.worktree` / common-dir rule, bare probe before mkdir | Holds, verified on git 2.55 (submodule → `super/sub`, separate-git-dir → `x.git` from both worktrees, bare `--git-dir` works from the repo and its subdirs). Two amendments: nearest parent for a nonexistent target; drop the unreachable bare-key bullet. |
| A4 one memo map per request | Mechanically holds (it must not leak into `backfill`). Does not touch the per-path cost; no test named. |
| B1 nearest existing parent for a nonexistent target | Holds, and it also covers the new-folder-inside-an-enclosing-repo case. |
| B2 pair `/.claude/skills` + `!/.claude/skills/`, no worktree count, no removal | **Verified**: link hidden, real folder visible at top and in a second worktree, nested link unaffected. Residual: a user's own *symlink* at that path stays hidden. Wording should say "folder", not "anything". |
| B3 any link untouched + warning; legacy both left | Holds, and it is smaller than v2. The legacy warning should name each link's actual target — the old setup sometimes has `CLAUDE.md -> office/CLAUDE.md`, which is broken, not "still pointing at the full AGENTS.md". |
| B5 test the generated file | Holds. |
| New tests: separate-git-dir/worktree, submodule, bare init, replaced link in a worktree, legacy link, mismatch note; update cli/init "folder" | Mostly right. Two problems: (a) the **submodule test cannot fail on the current code** — it asserts today's key; keep it but label it a regression guard, or someone will "fix" it; (b) the **cli tests need a controlled cwd** (§2). Missing: A4 has no test; the user-symlink B2 case is untested; B6's dangling-CLAUDE.md and init-made-link cases are untested. |

**Where I would spend the next hour:** B6's read guarded by `lstat` and its own link exempted; A1's note taken from `previous.project` and wired into every write's response and stderr; the cli-test `cwd`; then the docs list widened to the README paragraphs decision 6 contradicts. Everything else is wording.
