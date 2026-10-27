# Plan v2 critic — Claude (Plan subagent, fresh, read-only; ran git in throwaway temp repos, git 2.55). Saw: fix-plan-v2.md, LEDGER.md, live repo. Not peer1/ or v1.

Report as returned (condensed; findings and git output kept):

Summary: most items hold. Three need changing before code:
- A3 is built on a wrong assumption about git: for separate-git-dir and submodule layouts the first entry of `git worktree list` is the git dir itself, not a worktree.
- A3's refusal inside a bare repo never fires as written: hasGitAncestor looks for a `.git` entry, a bare `repo.git` has none, so init runs `git init` there. Ran it: `git init bare2.git` printed "Initialized empty Git repository in …/bare2.git/.git/" — a repo nested inside the bare one. Fix: probe `git rev-parse --is-bare-repository` / `--git-dir` before any mkdir/git init; test it.
- A1 removes something that works today: after `begin --project B` (as claude-1234), `office remember --by claude-1234` from repo A with no --project goes to B today and to A under the plan, silently. Rule 9 says "a project remembered from an **earlier session**"; with numbered names a named row is almost always this session's own begin, so treating this session's explicit choice as "remembered" is not clearly what the rule says — question for Frank. Smaller fix if he confirms the strict reading: keep the order, but when the folder's project differs from the caller's own row, say so in the response and on stderr ("filed under A (this folder); your session began with B — pass --project B if B was meant"). Docs: drop "or export OFFICE_PROJECT" (agent shells don't keep env vars between commands) or limit it to the launcher. A1.2–A1.4 hold; tests/init.test.ts:143 and tests/cli.test.ts:60/65 expect "declared"/"active" and need updating.

git output:
| Layout | Common dir | First entry of `git worktree list --porcelain` |
|---|---|---|
| bare repo.git | repo.git | repo.git, marked bare |
| --separate-git-dir=sep.gd | sep.gd | sep.gd, not bare, from both main checkout and linked worktree; core.worktree unset |
| submodule super/sub | super/.git/modules/sub | super/.git/modules/sub, not bare; core.worktree = ../../../sub |
Fix: when the first entry is not bare, read core.worktree from the common dir; if set, resolve against the common dir (submodule → super/sub, unchanged from today); if unset, use the common dir.

A2 holds. Cost: a non-home repo enclosing plain project folders would merge them (neither ~/.git nor ~/Projects/.git exists here; accept). Keep the "looks like a path" guard before the "exists" check, or a bare legacy name like `src` resolves against the daemon's cwd.

A4: per-call memo barely helps (each stored value normalized ~once per call already). A briefing calls matchingProjects several times. Smaller and better: one map per HTTP request, cleared at the top of the handler.

B1 holds; depends on the bare probe, which must run before mkdir too.
B2: CLAUDE.md never excluded — right. Single-worktree rule: skip bare and prunable entries when counting. Marked block fine. No repo here has old lines or Gemini text (grepped).
B3: the old README setup linked AGENTS.md to the office's full 16 KB AGENTS.md; replacing it with the short section loses identity and scope rules. Smaller option that respects rule 7: leave both legacy links alone and warn — F8's complaint was the inconsistency, touching neither removes it. The office checkout has no CLAUDE.md, so a link to "the office's CLAUDE.md" is already broken; "any other link → warn" covers it.
B4 fine ("real top folder" = the worktree being set up). B5 fine (test the generated file, not the JSON). B6, B7 fine.
