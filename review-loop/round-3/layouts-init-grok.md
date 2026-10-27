I'll review project-key detection and `office init` file safety by reading the change, then building the git layouts under the temp experiment directory and running them.The detection and init code is in place. Next I’ll build the odd git layouts under the temp directory and run them against it.Project-key checks found two layouts that diverge. I’ll confirm those, then run the init file-safety cases.Two project-key bugs and one init file-safety bug are real. The ordinary layouts — plain repos, linked worktrees, bare worktrees, `--separate-git-dir`, one-level submodules, and symlinked checkouts — share one key per repository and do not collide.

## Nested submodule key changes once the main checkout is initialized

**Where:** `src/scope.ts:146` and `src/scope.ts:149`. **Severity:** MEDIUM. Worktrees of the same nested submodule agree with each other, but the key is not the checkout path. Initializing that submodule in the main checkout later switches every worktree onto a different key, so memories already filed under the old key no longer come back with the project.

**What happens:**

1. Clone a superproject that contains submodule `mid`, which itself contains submodule `inner`. Do not run `submodule update` in that main clone.
2. Add two worktrees and run `git submodule update --init --recursive` only there.
3. An agent started in `<worktree>/mid/inner` is filed under `<clone>/mid/modules/inner`. The other worktree gets the same key. That path is not the checkout. It is the git-directory path (`mid/modules/inner`) joined onto the superproject (`worktreeSubmodule` does this when `<clone>/.git/modules/mid/modules/inner/config` does not exist yet).
4. Later, someone runs `git submodule update --init --recursive` in the main clone. `configuredRoot` now reads `core.worktree` from that config, which is the relative path `../../../../../mid/inner`.
5. The same folders, including both worktrees, now file under `<clone>/mid/inner`. Notes stored in step 3 stay under the old key.

A one-level submodule does not do this: the synthetic key `<clone>/sub` is already the checkout path, and it stayed `<clone>/sub` after the main checkout was initialized. A bare superproject also stays put, because it never grows a main `modules/<m>/config`; its nested key remains `<bare>/mid/modules/inner` for every worktree.

**How I know:** reproduced. Before the main init the key was `.../deep-clone/mid/modules/inner`. After it, the main checkout and both worktrees returned `.../deep-clone/mid/inner`.

## A `--separate-git-dir` repo at `$HOME` swallows every non-repo folder

**Where:** `src/scope.ts:180` and `src/scope.ts:203`. **Severity:** MEDIUM. `isHome` only looks at the canonical key. For this layout that key is the git directory, not the home work tree, so the home exception never fires. Every folder under home that is not its own repository is filed as one project, including a linked worktree of those dotfiles checked out somewhere else.

**What happens:**

1. `git init --separate-git-dir=$HOME/.dotfiles $HOME`. On git 2.55 this writes no `core.worktree`. The config is only `repositoryformatversion`, `filemode`, `bare = false`, and `logallrefupdates`.
2. `basename` of the common dir is `.dotfiles`, not `.git`, so `configuredRoot` returns `$HOME/.dotfiles` (`src/scope.ts:130`).
3. `isHome` compares that path with `$HOME` and does not match.
4. An agent started in `$HOME`, in `$HOME/loose`, or in a linked worktree of that repo all get the project key `$HOME/.dotfiles`. A real repository at `$HOME/realproj` stays its own project.

`office init $HOME/loose` does refuse ("inside a git repository at your home folder") and writes nothing. Folder detection does not. A normal repo whose `.git` is inside `$HOME`, and a bare repo with `core.worktree=$HOME`, both correctly detect as no project.

**How I know:** reproduced with `HOME` pointed at the temp dotfiles work tree. Loose folder, home itself, and the outside worktree all returned `.../dot-home/.dotfiles`.

## A hard-linked `AGENTS.md` is appended, including outside the repo

**Where:** `src/init.ts:292` and `src/init.ts:372`. **Severity:** MEDIUM. `lstat` classifies a hard link as a normal file, so the "do not write through a link" path never runs. Init succeeds with an empty warning list and appends the office section to that inode. A symlink is left untouched; a hard link is not.

**What happens:**

1. A file outside the project holds `# Teamé\n` (latin-1 `é`). `AGENTS.md` in the repo is a second name for that same inode.
2. `office init` reports success, actions include "updated AGENTS.md", and `warnings` is empty.
3. The outside file now starts with the original bytes and continues with the Agent Office section. Nothing is truncated or re-encoded; the bytes are still changed, and any other name for that file sees it.

**How I know:** reproduced. `nlink` was 2, the outside file's prefix stayed `23 20 54 65 61 6d e9 0a`, and the office marker was appended after it. The same run left a symlinked `AGENTS.md` and `CLAUDE.md` byte-for-byte alone.

## Low

**`git init` follows a `.git` that is not a repository.** `src/init.ts:336` and `src/init.ts:349`. Low: this only happens if `.git` is already a symlink to some other directory, or a directory full of non-git files. Rev-parse fails, so init decides the folder is not a repo and runs `git init`. Git writes into the symlink target. In the run, the outside `config` kept the line `user-config` and gained a `[core]` block, `notes` and a pre-existing `HEAD` stayed, and `objects/`, `refs/`, and `hooks/` were created. Resolve then failed, init threw "could not resolve git paths", and it never wrote `AGENTS.md`. The outside directory is already modified. A plain `.git` text file is not overwritten (`fatal: invalid gitfile format`, bytes kept). A `.git` directory of user files inside the project is turned into a repo the same way: `notes` survived, `config` was appended to, and init then finished and wrote `AGENTS.md`.

**A folder of symlinked repos is treated as an empty project.** `src/init.ts:134`. Low: `nestedRepos` only enters real directories, so a child that is a symlink to a checkout is invisible. `office init` on a directory whose projects are links still runs `git init` and writes `CLAUDE.md` and `AGENTS.md` there. Claude Code walks upward from a logical path and will read that `CLAUDE.md`. The linked repos' own files were not modified. The three-level cap and the skip of hidden names are what the comment describes; a checkout at depth 4 is also accepted. That part is the stated limit, not a separate hole.

## Checked and holding

These agreed on one key per repository and disagreed across repositories: plain repo and subfolder, extra symlinks to the checkout (including a symlink that lives inside a different repo), linked worktrees and a worktree added from a worktree, bare repos and worktrees added through a symlinked bare path, `--separate-git-dir` (including a git dir whose path ends in `/.git`), one-level submodules and a worktree of a submodule, nested submodules once the main checkout already has them, submodules of a bare superproject, and two clones of the same history. A repository inside a home repo kept its own key. `GIT_DIR`, `GIT_WORK_TREE`, `GIT_CONFIG_PARAMETERS`, `GIT_CONFIG_KEY_*`, and a global config setting `core.worktree` and `core.bare` did not move the folder. A stray `GIT_TEMPLATE_DIR` can make a new repo's exclude hide `AGENTS.md`; that is git applying the template it was given, and init itself does not write `info/exclude`.

Init kept existing bytes (latin-1 prefix, a one-byte file, a file with no trailing newline, a CRLF `## Agent Office` heading), did not retarget symlinks, did not create `skills` through a `.claude` link that resolves outside, refused subfolders (including through a symlink, and named the submodule rather than the superproject), refused `$HOME` and a symlink to it, refused bare repos and separate git dirs, and accepted bare worktrees, separate-git-dir worktrees, linked worktrees, submodules, and a worktree of a submodule. Writes stayed in the checkout that was named. `GIT_DIR` during init did not touch the other repository. A broken `.git` file or an empty `.git` file inside a repo makes that folder detect as no project rather than as the parent; git will not walk past it either, so nothing is filed under the wrong repo.

A submodule path that itself contains `/worktrees/<name>/modules/` does split across superproject worktrees. That shape is the regex in `worktreeSubmodule`, and it is not a path a normal submodule has.
