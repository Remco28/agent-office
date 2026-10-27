Read `src/scope.ts`, `src/init.ts`, `src/paths.ts`, `src/session.ts` and the existing tests, and reproduced the layout claims with git 2.55 under the scratchpad (bare/separate-git-dir, nested submodules in worktrees, relative worktrees, `.git` symlinks, templates).

**Verdict: the plan holds on Q1–Q4 and on every ordinary layout I tried. The holes are in the new safeguards, not the keys.** No HIGH.

## MED

1. **H14 is half a fix (verified).** Stripping `GIT_TEMPLATE_DIR` leaves the config route open: with `init.templateDir` in the user's global config (or any `-c`), `git init` still copies `info/exclude` containing `AGENTS.md`, with the env var unset. The stated goal ("init never hides anything from git") fails. `git init --template=` makes `.git/info/exclude` not exist at all — that covers both routes. The test only exercises the env var, so it will pass while the bug survives.

2. **Q2 + relative worktrees (verified, splits one repo).** With `git worktree add --relative-paths` (or `worktree.useRelativePaths=true`), `<G>/worktrees/<n>/gitdir` contains `../../../../wt1/.git`. "top = dirname of the path in that file" is then a relative path, resolved against the *daemon's* cwd: with cwd = the exp dir it yields `…/wt1` outside the tree → escape → fallback `<R>/mid/modules/inner`, which is exactly the old bug (`<R>/mid/inner` after the main checkout initialises); from another cwd the relative path can land somewhere else, so the key depends on where office runs. Resolve the gitdir path against `<G>/worktrees/<n>/`. The rest of the Q2 math I verified end to end: nested `mid/inner` in a worktree gives `<R>/mid/inner`, matching the main checkout, with and without the main copy present, and the `<n>/gitdir` guard exists in exactly that case.

3. **H12 refuses a folder it should accept (verified).** A plain `.git` directory that git does not recognise (interrupted `git init`/`clone`, a stray `mkdir .git`) is refused, but `git init` repairs it in place, writing nothing outside. The harm H12 targets only exists for a `.git` *symlink*: there `git init` really does write HEAD/config into the linked folder (verified). Narrow the refusal to a `.git` symlink (and a `.git` file whose gitdir is missing); let a real `.git` directory be repaired.

4. **Q2's main-copy branch dropped the `config` test.** The plan says "`<G>/modules/<m>` exists → its key". The current code requires `config`; a leftover empty `<G>/modules/<m>` (failed `submodule update`) makes `configuredRoot` return the git folder itself — a key no checkout ever has — and it *overrides* the otherwise-correct computed path. Keep `config` + a `core.worktree` that resolves to an existing checkout; else compute.

## LOW

5. **H5 names the user.** Q3 leaves `--separate-git-dir` repos valid (I made `~/.x-git` for `~/code/x`; core.worktree is empty). Key `~/.dotfiles`/`~/.x-git` → "leading dot → parent's name" gives the home folder's name ("frank") in every message and in `# …` in AGENTS.md. Limit the parent rule to `.bare`/`.git`; otherwise strip the dot.
6. **H3's `normalizeProject` half is not specified to do anything.** It returns a string and falls back to the typed path, so `--project ~` still files under home. Also: rows already filed under the old wrong keys (`~/.dotfiles`) silently vanish from detection after H3 — worth one sentence saying that's deliberate.
7. **Q1 still misses shapes, and adds one false refusal.** A dot-folder project (`~/Projects/.private/api`) is skipped; a link to a *folder of* repositories (`client -> ~/code/client`) is not descended (link-to-repo is caught). And a child whose `.git` exists but git can't read it counts as a repository, so the whole container is refused — H12's own distinction should apply to the walk. The one-shot nature also deserves a doc line: init an empty `~/Projects`, clone projects in later, and the CLAUDE.md stays with no later refusal possible (the check is skipped once the target is itself a repo — necessary for superprojects).
8. **Warned paths still report success.** H4/H7/H11 leave AGENTS.md without the section and return `already_initialized: true` / "is already set up and linked" — the same silent success this review exists to remove. Also H4 refuses an AGENTS.md hard-linked to another file *inside* the repo (no outside write); that is fine, but it must not read as "set up". One result state, "not set up: <why>".
9. **H11 leaves one outside write.** `.claude` is inspected at planning; if it becomes a symlink to `/outside` in the window, `mkdirSync` follows it and the skills link is created outside the project. Re-inspect the parent immediately before linking.
10. **H5 collisions:** dropping `.git` makes `proj` and `proj.git` display identically; a key of `/` yields an empty name (keep session's `|| project` fallback).

## Bigger / smaller than needed

- H12 is wider than the harm (see 3); H5's parent rule is wider than `.bare`/`.git` needs.
- Q2's main-copy-first branch is only needed when the computed relative path is unusable; computing relative first would delete the stale-config class in 4 — but keep main-copy-first if you want worktrees to follow a moved-submodule branch, and say which of the two "residues" you are accepting.
- Q1's size is right (no budget, links not descended, bare not counted). H7/H11's tolerance is right.

**Verified correct, for the record:** `<n>/gitdir` guard; rel-based `<R>/mid/inner` in the two- and three-level cases; the `.git`-symlink premise of H12; Q3 (`--show-toplevel` = home, key `~/.dotfiles` today); the nlink=2 + CLAUDE.md-same-inode exception (any second link outside would make nlink 3).
