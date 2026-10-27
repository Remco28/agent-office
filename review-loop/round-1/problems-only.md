# Problems to solve (no plan given) — Gemini's uncommitted office init / project-from-folder change

Repo: /home/frank/Projects/agent-office (`git diff` + untracked src/init.ts, tests/init.test.ts).
Owner's rules and decisions: the 'Rules confirmed' list and the 'Decisions' section of /home/frank/Projects/agent-office/review-loop/LEDGER.md (read those two parts only).
Nobody on this machine has run `office init` yet, so nothing already written needs migrating.

## A1
Without `--project`, `resolveScope` (src/session.ts) picks: explicit project > the remembered session row > the folder. `begin`/`peek` send the folder as if it were declared; every other command sends it as `cwd_project`, so a briefing and the next write can disagree. Agents with no name share one 'unnamed' session row, and a nameless `begin` from a folder now rewrites it. A project guessed from the folder is labelled `project_source: "declared"`. Rule 9 says the folder must beat a project remembered from an earlier session. AGENTS.md also tells agents `office begin --project ~/Projects/x` to target another repo.

## A2
An explicit `--project` naming a subfolder of a repo (e.g. `--project .` from repo/src) or a symlinked path to it is stored as its own project, while detection from the same folder gives the repo root, so one repo splits into two projects.

## A3
Bare-repo, `--separate-git-dir` and submodule layouts: src/scope.ts takes the canonical root as dirname(git common dir) only when the common dir is named `.git`; otherwise each worktree is its own project, and `office init` in one worktree writes that worktree's path into the shared git config, so every worktree is filed under whichever ran init last.

## A4
(LOW) Every scoped read calls normalizeProject on every known project, which spawns git synchronously: ~2.5 ms per git-repo path, blocking the daemon.

## B1
`office init <dir>` when <dir> is inside an enclosing repo sets up that repo's root (e.g. a git-tracked $HOME gets ~/AGENTS.md, ~/CLAUDE.md, ~/.claude/skills, office.project=$HOME). The $HOME guard checks only the folder named. Owner's decision: stop and say which folder it would have set up.

## B2
(HIGH) init always adds `.claude/skills`, `.agents/skills`, `CLAUDE.md` (unanchored) to .git/info/exclude, whether or not init created them, so the user's own untracked CLAUDE.md files at any depth (also ones added later) and skill folders vanish from git status.

## B3
AGENTS.md that is a symlink: to a shared file -> init appends this project's section through it, editing a file outside the repo; dangling -> init crashes with ENOENT after already writing git config and links; to the office's own AGENTS.md (the README's old setup) -> replaced with a stub while a matching CLAUDE.md symlink is left alone, so Claude and Codex read different instructions.

## B4
If `.claude` (or `.agents`) is a symlink to a folder outside the repo, init creates the `skills` link inside that outside folder.

## B5
The generated AGENTS.md says 'linked to agent-office (<path>)' with the project's own path, and puts a machine-specific absolute path into a file meant to be committed.

## B6
(LOW) If the repo already has its own CLAUDE.md without the startup steps, init writes them only to AGENTS.md, which Claude Code does not read, and says nothing.
