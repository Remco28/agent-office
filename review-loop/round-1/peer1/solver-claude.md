# Blind solver — Claude (Plan subagent, read-only tools). Saw: problems-only.md, LEDGER rules + decisions, live repo. Did not see fix-plan-v1.

Report as returned (lightly condensed: wording kept, repeated "Cost" lines shortened):

Build order: A3, then A2 and A1, then A4. B1–B6 independent. One structural change to initProject: run every check first, write only after all pass (fixes the half-finished-init crash in B3).

## A1
1. resolveScope order: explicit project > cwdProject > remembered > none. When detectCwdProject is null (not a repo, or the office checkout) remembered is still used (decision 4, rule 4).
2. Add "folder" to ScopeSource.
3. begin/peek send detectCwdProject() as cwd_project, not project.
4. /begin reads body.cwd_project and passes it to briefing via `declared`.
5. Only a named begin saves the folder project into the session row (`project ?? (author ? cwd : null)`); a nameless begin saves it nowhere, so it cannot rewrite the shared unnamed row. peek stays write-free.
6. AGENTS.md: replace "`office begin --project ~/Projects/x` to target another repo" with: inside a repo the folder wins over a remembered project; to work on a different repo, run commands from inside it or pass --project / export OFFICE_PROJECT on every command. Do decision 5 in the same edit.
Could break: checks of project_source === "declared" (only tests); an agent that ran `begin --project Y` and keeps working inside repo X now files under X ("rule 9 asks for that, but it is a change in behaviour"); a nameless agent that begins in X then works outside any repo gets the unnamed row's older project.

## A2
normalizeProject: realpath existing paths; anywhere inside a checkout -> that checkout's project (linkedProject ?? repoRoot). Non-existent paths and plain names as today. Guard: if the project found would be $HOME, act as if no repo (normalizeProject keeps the path, detectCwdProject returns null). Realpath ROOT before the office-checkout comparison.
Could break: deliberate monorepo-package projects lose their split (rule 5 points this way); symlinked-spelling rows match only while the path exists.

## A3
When common dir is not `.git`: `git worktree list --porcelain -z`, first entry; bare -> that path; else the main worktree (correct for separate-git-dir and submodules via core.worktree). Fall back to worktreeRoot if the command fails. In init: if office.project is set and differs from the computed root, stop and name both (rule 6).
Could break: bare key is the *.git folder (display name repo.git); a repo moved after init trips the mismatch stop. Alternative: drop linkedProject entirely once roots are consistent (bigger change).

## A4
Per-process cache path -> resolveGitProject result (incl. "not a repo"), ~60 s. Tests may need clearGitCache().

## B1
Before any write (incl. mkdirSync), resolve the nearest existing folder at or above dir; if inside a checkout whose worktreeRoot differs from realpath(dir), stop: "`<dir>` is inside the git repository at `<worktreeRoot>`; `office init` would set up that folder. Rerun `office init <worktreeRoot>` if that is the project, or `git init <dir>` first if `<dir>` is its own project." Refuse when worktreeRoot or repoRoot is $HOME; compare after realpath.

## B2 (HIGH)
Exclude only links init created in this run, anchored (/.claude/skills, /.agents/skills). **Never add CLAUDE.md**: the CLAUDE.md -> AGENTS.md link is relative, works on any machine, and should be committed with AGENTS.md; only the skills links (absolute local paths) belong in exclude. README/AGENTS.md should say to commit CLAUDE.md.
Could break: CLAUDE.md shows as untracked after init (on purpose); a later real folder at .claude/skills stays hidden.

## B3
lstat AGENTS.md; if it is a symlink of any kind (shared, dangling, or to the office's own AGENTS.md) or not a regular file: do not read, append, unlink or replace; note "AGENTS.md is a link to <target>; left unchanged — Agent Office steps not added"; carry on. Delete the unlinkSync branch. Old README setup: both files keep pointing at the office's AGENTS.md, so Claude and Codex read the same thing.

## B4
If .claude/.agents exists and realpath(parent) is not inside realpath(worktreeRoot), skip linking skills there; note it. Missing folders still created.

## B5
Drop the path: "This repository (`<name>`) uses **Agent Office** (the `office` command)."

## B6
If CLAUDE.md exists and is not a link to AGENTS.md: read without writing; if it has no office instructions and no `@AGENTS.md` line, note: "CLAUDE.md does not include the Agent Office steps; Claude Code reads CLAUDE.md, not AGENTS.md — add a line `@AGENTS.md` to it." Alternative: append `@AGENTS.md` automatically.

## Least sure
1. A1 what begin saves (named only).
2. A2 subfolder rule and the $HOME guard (needs owner agreement).
3. A3 submodule worktree-list output unverified on git 2.55; needs a real test per layout; mismatch stop is a policy choice.
4. B6 warn vs edit.
5. B2 committing CLAUDE.md is a change of intent; fallback is anchored /CLAUDE.md added only when init made the link.
