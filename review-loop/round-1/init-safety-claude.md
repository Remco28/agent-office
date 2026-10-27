# Init file-safety specialist — Claude (general-purpose subagent). Saw: runnable repo copy r1/claude at c9dad28+cf1f4e8014d5, throwaway HOME/OFFICE_HOME/OFFICE_PORT, GIT_CONFIG_GLOBAL=/dev/null. Could write (harness), checked after: copy unchanged except .git/index; real ~/AGENTS.md and ~/CLAUDE.md absent.

Report as returned (verbatim):

## Report: what `office init` does to folders and files

I read src/init.ts, the init branch of src/cli.ts (lines 402-412) and `resolveGitProject`/`hasGitAncestor` in src/scope.ts. Init never contacts the daemon. I reproduced every finding below with `bun <copy>/src/index.ts init <dir>`, each in a fresh `mktemp -d` under my scratchpad, with throwaway HOME, OFFICE_HOME and OFFICE_PORT, and `GIT_CONFIG_GLOBAL=/dev/null`. I did not edit the repo copy.

### 1. HIGH: init writes into whatever enclosing repo it finds, including a git-tracked $HOME
**Where:** src/init.ts:126 (the `$HOME` guard checks only `dir`) together with :148-166 (everything is written at `worktreeRoot`).

**Why HIGH:** the $HOME guard only refuses when the folder you name is exactly `$HOME`. If the folder sits inside any existing repo (a dotfiles repo at `~/.git`, a `~/Projects` that is itself a repo, or a new folder inside a monorepo), init silently sets up that repo's root instead.

**Scenario:** `~` is a dotfiles repo. The user runs `office init ~/Projects/newthing` to start a new project. Reproduced; the actions were "linked git config to agent-office, linked .claude/skills, linked .agents/skills, created AGENTS.md, linked CLAUDE.md -> AGENTS.md", project=`$HOME`, and:
- `~/AGENTS.md` and `~/CLAUDE.md -> AGENTS.md` are created. Claude Code loads CLAUDE.md from parent directories, so every Claude session under home now reads "This repository (`home`) is linked…".
- `~/.claude/skills` becomes a symlink to the office skills folder, which turns them into user-level skills everywhere.
- `office.project=$HOME` is written into the dotfiles repo's config. Any folder under `~` that is not its own repo now resolves to project `$HOME`.
- `~/Projects/newthing` gets an empty folder and no git repo.

All of this contradicts AGENTS.md ("Never in $HOME"). The output does show `project: …/home`, but nothing stops or warns.

**Fix direction:** refuse (or ask for `--force`) when `worktreeRoot` differs from the folder given and was not chosen explicitly. At minimum, also check `worktreeRoot === home`.

### 2. HIGH: the `.git/info/exclude` entries hide the user's own files, including CLAUDE.md files in every subfolder
**Where:** src/init.ts:229.

**Why HIGH:** the entries `.claude/skills`, `.agents/skills` and `CLAUDE.md` are added every time, whether or not init created them. `CLAUDE.md` has no leading slash, so it matches at every depth. Untracked files covered by these entries disappear from `git status` and `git add .` with no message.

**Reproduced, fresh folder:** a folder with no git repo yet, holding the user's own `CLAUDE.md` and `.claude/skills/mine/SKILL.md`. After init, `git status --untracked-files=all` shows only `AGENTS.md` and `main.py`. `git add CLAUDE.md` then fails with "The following paths are ignored…". `git check-ignore -v` shows `.git/info/exclude:9:CLAUDE.md` matching both `CLAUDE.md` and a later-added `pkg/api/CLAUDE.md`, and `:7:.claude/skills` matching the user's skill.

**Reproduced, existing repo:** a repo with a committed `.claude/skills/deploy/` and a committed CLAUDE.md. After init, a newly added `.claude/skills/release/SKILL.md` is invisible to `git status`. Edits to tracked files still show.

**Outcome:** a user's CLAUDE.md, per-package CLAUDE.md files and new team skills never get committed, and the user can lose them.

**Fix direction:** exclude only paths init itself created as symlinks, and anchor them: `/CLAUDE.md`, `/.claude/skills`, `/.agents/skills`.

### 3. MEDIUM: an AGENTS.md that is a symlink gets its target edited outside the repo
**Where:** src/init.ts:204-218 (`writeFileSync` follows the symlink).

**Reproduced:** `a/AGENTS.md` and `b/AGENTS.md` both link to `~/dotfiles/AGENTS.md`. `office init a`, then `office init b`. The shared file now contains "This repository (`a`) is linked to **agent-office** (`…/home/a`)". On repo b, init sees the section is already there and skips it, so b's agents are told they are in `a`. The office files correctly by git config, but the instructions name the wrong project, and a file outside the repo was changed.

**Related, LOW:** a dangling AGENTS.md symlink crashes init with ENOENT after `.claude`/`.agents` are already created, leaving a half-done setup (reproduced).

**Fix direction:** when AGENTS.md is a symlink (other than the old link to the office's own AGENTS.md), do not write through it; report it.

### 4. MEDIUM: in a bare-repo worktree layout, whoever ran init last decides the project for every worktree
**Where:** src/init.ts:170-180, with `repoRoot` from scope.ts:67-70.

**Why:** with a bare-repo layout (`proj/.bare` plus `proj/.git` saying `gitdir: ./.bare`), the common dir is not named `.git`, so each worktree counts as its own `repoRoot`. `office.project` lives in the shared config, so each init overwrites it.

**Reproduced:** init in `main` sets the config to `…/bproj/main`. Init in `feat` sets it to `…/bproj/feat`. Running init in `main` again resets it to `main` and reports `already_initialized: false`.

**Outcome:** between runs, every worktree, `main` included, files under whichever path was written last. That can also be a worktree that has since been deleted.

**Fix direction:** if `linkedProject` is already set and still exists, keep it rather than overwriting.

### 5. LOW: smaller things (read in the code; the first one reproduced as part of #2's second scenario)
- If the user already has CLAUDE.md (and/or a real `.claude/skills`), init only creates AGENTS.md. Claude Code does not read AGENTS.md, so Claude agents in that repo never see the startup steps, and nothing in the output says so. In the #2 repo the actions listed only `.agents/skills` and `created AGENTS.md`.
- The generated section says "linked to **agent-office** (`<repoRoot>`)", but the path shown is the project's own root, not the office's. AGENTS.md is meant to be committed, so this machine's absolute path goes into a shared repo, wrong for collaborators.
- A target that does not exist is created (`mkdirSync` recursive) and `git init`'d, so a typo silently creates a new repo. A quoted `"~/x"` is not expanded.
- If `.claude` is itself a symlink to a shared folder, the `skills` link is created inside that shared folder.

### Done well, worth keeping
- Never overwrites an existing `.claude/skills`, `.agents/skills`, AGENTS.md or CLAUDE.md. It only appends a marked section, and only when no office instructions are found.
- Repeat runs settle down in an ordinary repo (a second run reports `already_initialized`).
- The git exclude is written once to the shared git folder, which is right for ordinary worktrees.
- In an ordinary repo plus worktree, init in the worktree resolves to the main repo and does not flip the config. This is unlike the bare layout in #4.
- The refusal for an exact `$HOME` and the special case for the office checkout itself both work.
- The only thing it removes is a symlink that points at the office's own AGENTS.md.
