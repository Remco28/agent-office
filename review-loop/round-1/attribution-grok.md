# Attribution specialist — Grok (grok-4.7). Saw: repo copy r1/grok at c9dad28+cf1f4e8014d5. Could write (harness); copy unchanged after except .git/index.

I'll review attribution only: for every read and write this change touches, which project and agent the office assigns, and whether that can be the wrong one. I'll start from the diff and the new init/scope paths.The scope order is the risky part: declared project, remembered session, then the folder. I'll read how each command supplies those and how sessions stick.The priority between the folder, the remembered session, and `begin` looks like the place a write can land on the wrong project. I'll reproduce that with a temp office home, and check `init` against real git layouts.`office begin` and `office peek` treat the folder you are standing in as the declared project. Every later read and write does not. A session remembered from another folder wins, and an agent who never names themselves shares one project slot with everyone else who did not name themselves. `office init` also hides untracked `CLAUDE.md` files and follows symlinks out of the repo.

## Remembered session beats the folder you are in

**Where:** `src/session.ts:370` and `src/session.ts:373`, with the split in `src/cli.ts:480` versus `src/cli.ts:509`.

**Severity:** HIGH. In ordinary multi-agent use the office stores and returns one project's notes for a different folder, and nothing says the folder and the project disagree.

**What the office decides:** The author is whoever this call passed as `--by` (or nobody). The project is the first of: an explicit `--project` / `OFFICE_PROJECT`, then the remembered session, then the git checkout this process was started in. `begin` and `peek` skip that order. They send the checkout as if the user had passed `--project`, so a check-in adopts the folder and a peek reads it. `remember`, `context`, `search`, `work`, and `issue open` send the checkout only as `cwd_project`, which is used after the remembered session.

The remembered session for a caller who did not pass `--by` is the single unnamed slot if any `begin` has ever run without a name, otherwise the only named session on the machine (`src/session.ts:370`).

**Scenario A.** Alpha and Beta are two git repos. Claude runs `office begin --by claude` in Alpha and gets `claude-4821`; that row's project is Alpha. Gemini does not name itself (the new `AGENTS.md` says a missing name is the unnamed slot) and, from Beta, runs `office context` and `office remember "beta uses tokens"`. No unnamed row exists, and Claude's row is the only session, so both calls resolve to Alpha. The memory is stored with `project` Alpha and `author` null. Claude's next project read in Alpha includes "beta uses tokens". Gemini's context in Beta is Alpha's notes. `project_source` is `active`. There is no warning that the folder is Beta.

**Scenario B.** Neither agent passes `--by`. The first `office begin` in Alpha sets the unnamed slot to Alpha. The second `office begin` in Beta overwrites that same slot to Beta (begin treats the folder as a declaration). The agent still working in Alpha then runs `office remember` or `office work open` with no `--project`. Those land in Beta. Before this change, `begin` did not take a project from the folder, so simply starting in a repo did not retarget the shared slot.

**Scenario C.** `claude-4821` was begun in Alpha and the row still says Alpha. The same numbered name is now used in Beta. `office peek` shows Beta, because peek sends the folder as the declared project and does not update the row. `office remember` and `office context` still use Alpha. The briefing and the write disagree. `office begin --by claude-4821` in Beta does the opposite: it rewrites the shared row to Beta, so a second terminal that still has Alpha open and keeps using `claude-4821` starts filing into Beta.

A new name with no row does get the folder: a first `gemini-1000` in Beta is Beta. Two or more named sessions and no `--by` also fall through to the folder. Author is still only the name this call declared; these writes are not signed as the other agent.

**How I know:** Reproduced by running `beginSession` / `resolveScope` on temp repos (unnamed begin in Alpha, then a Beta `cwdProject`, stored the memory under Alpha; peek-style declared Beta versus remember-style cwd Beta returned different projects; a brand-new author got Beta). The CLI split is the code in `src/cli.ts`.

## A path that is not the worktree root stays a different project

**Where:** `src/scope.ts:115` (the rewrite is only when the path is exactly `worktreeRoot` or `repoRoot`). `detectCwdProject` (`src/scope.ts:85`) already maps any subdirectory to the main checkout.

**Severity:** MEDIUM. The no-flag path is consistent. An explicit path agents already pass, or a symlink to the same repo, files beside the canonical project so the other agent never sees it.

**Scenario:** The repo is `/proj/alpha`, and one agent is started in `/proj/alpha/src`. `office begin --by claude` with no `--project` stores `/proj/alpha`. Another agent, or a launcher, passes `--project .` or `OFFICE_PROJECT` set to that subdirectory (or to `/proj/alpha-wt/src` in a worktree). `normalizeProject` leaves the subdirectory as its own project key. Memories and open work under `/proj/alpha/src` do not show up for the agent whose key is `/proj/alpha`. The same split happens for a symlink: detection uses git's physical root (`/proj/alpha`); `--project /links/alpha` is stored as `/links/alpha`. Once a session has remembered the subdirectory, later commands with no `--project` keep it, because of the priority above, even when detection would now say `/proj/alpha`.

On a normal clone, the worktree root itself does collapse: `/proj/alpha-wt` and `/proj/alpha-wt/src` with no `--project` both become `/proj/alpha`.

**How I know:** Reproduced with `detectCwdProject` and `normalizeProject` on a temp repo, a linked worktree, and a symlink to that repo.

## Bare (and separate-git-dir) worktrees do not share a root, and `office init` then glues them to whichever worktree ran it

**Where:** `src/scope.ts:67`. `src/init.ts:170` writes that value into shared `office.project`.

**Severity:** MEDIUM. A normal `git worktree add` from a non-bare clone is fine. A bare repo, or `git init --separate-git-dir`, is a real worktree layout, and the canonical key comes out wrong.

**Scenario:** `repo.git` is bare. Agents have `/work/wt1` and `/work/wt2`. Git's common dir is `repo.git`, whose basename is not `.git`, so the code treats each worktree as its own project: detection of `wt1` is `wt1`, detection of `wt2` is `wt2`. They never see each other's notes. Then someone runs `office init` in `wt1`. That sets shared `office.project` to `wt1`. After that, both worktrees detect and normalize to `wt1`. `wt2`'s memories and work log are filed under the other worktree's path. Deleting `wt1` leaves the key pointing at a folder that is gone.

**How I know:** Reproduced. A normal linked worktree resolved to the main checkout. A `--separate-git-dir` repo and a bare clone with two worktrees did not, and `initProject` on one worktree made the other worktree report the first worktree's path.

## `office init` local-ignores existing `CLAUDE.md` files and an existing skills directory

**Where:** `src/init.ts:229` (`ensureGitExclude` of `.claude/skills`, `.agents/skills`, and `CLAUDE.md`).

**Severity:** MEDIUM. The bytes stay on disk. `git status` and `git add` stop seeing them, in every worktree, because the pattern is written to the shared `.git/info/exclude`. The init message does not mention it. A later `git clean -xd` would delete them.

**Scenario:** A repo already has an untracked `CLAUDE.md` ("real claude notes"), an untracked `docs/CLAUDE.md`, and a real `.claude/skills/local-skill/SKILL.md`. `office init` leaves those contents in place (it does not replace an existing skills directory or an existing `CLAUDE.md`). It still appends `CLAUDE.md` and `.claude/skills` to `info/exclude`. `git check-ignore` matches all three. `CLAUDE.md` has no slash, so it matches every directory, not only the root. `git status` shows only the new `AGENTS.md`. The same exclude applies in other worktrees of that repo. Running init again still rewrites the exclude even when the result says the project is already set up, because that write is not one of the `actions`.

**How I know:** Reproduced by running `initProject` and then `git status` / `git check-ignore`.

## `office init` writes through symlinks that leave the repo

**Where:** `src/init.ts:208` (read and write of `AGENTS.md`) and `src/init.ts:190` (creating `.claude/skills` and `.agents/skills`).

**Severity:** MEDIUM. It only happens when those paths are already symlinks, and then it changes a file outside the directory you named.

**Scenario:** `AGENTS.md` in the project is a symlink to `~/shared/AGENTS.md`, which holds rules used by several repos. `office init` does not replace that link (it only unlinks a link that points at the office checkout's own `AGENTS.md`). `writeFileSync` follows the link and appends this project's Agent Office section, including this repo's path, to the shared file. Separately, if the project's `.claude` is a symlink to a directory outside the repo (for example a shared Claude config folder) and that folder has no `skills` entry yet, init creates `skills` there as a symlink to the office skills directory. That changes the directory the link points at, not a folder inside the project.

**How I know:** Reproduced. A symlinked `AGENTS.md` stayed a symlink and the target file gained the office section. A `.claude` symlink to an outside directory gained a `skills` symlink.

## What is done well and should be kept

A normal clone's worktrees share one project. Detection from the worktree root and from a subdirectory, and `normalizeProject` of the worktree root, all return the main checkout, including before `office init`. The included test that begins, remembers, and reads context inside a worktree with no `--project` matches that.

The office checkout itself is still not inferred, including its subdirectories, so the doorway is not stored as somebody's project. A worktree of that checkout still resolves to it.

The author is still never taken from a remembered session. A caller who passes a new name and has no row gets the folder they are in, not someone else's project. An explicit `--project` still wins over both the remembered session and the folder.

`office init` refuses `$HOME`, leaves the office checkout untouched, appends to an existing `AGENTS.md` instead of replacing it, does not overwrite an existing `CLAUDE.md` file or an existing skills directory, and a second run does not append the office section again. On a normal clone, `office.project` in the shared git config is the main checkout, so every worktree agrees.
