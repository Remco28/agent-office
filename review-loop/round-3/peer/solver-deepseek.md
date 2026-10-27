
## Q1 — Depth-capped, symlink-blind scan

**Fix:** Replace "3 levels" with a full descent of the target (no cap), and when a directory entry is a symlink, resolve it and keep walking from the real path, carrying a visited set of `(device, inode)` to stop cycles. Keep the existing skips.

**Why:** The hazard isn't depth 4 or link-ness; it's "does any checkout live below this folder," and that question has no natural depth bound. Init is rare and runs before any write, so an exhaustive walk is affordable, and one traversal rule covers both misses.

**Gets wrong:** Permission-denied or unreadable subdirectory — must fail closed (refuse) or you silently pass again. Repos under `node_modules` or dot-folders still missed (accepted: an agent working there does inherit the CLAUDE.md). And symlinks pointing *out* of the tree now cause refusal even when the agent's cwd resolves to the real path outside and never reads the target's CLAUDE.md — over-refusal, but the safe direction. Very large trees / network mounts get slow.

## Q2 — Fallback key derived from where the git dir happens to be

**Fix:** Delete the "does `<G>/modules/<m>` exist" branch. Key a submodule as `<enclosing repo's key>/<submodule path in that repo's tree>`, taking the path from the recorded gitlink/`gitdir:` link (and recurse for nested submodules), never from the location of its git directory.

**Why:** Presence of the main checkout's copy is not part of a submodule's identity; the path in the superproject is. Same repo, same key in the worktree-only case and after main-checkout init — no flip, no orphaned notes. It also avoids the earlier `/modules/` string rewrite, so `foo/modules/bar` and `foo/bar` stay distinct.

**Gets wrong:** Submodule renamed or moved in `.gitmodules` → key changes, notes orphaned (needs an explicit rename map to fix). Same module checked out twice at different paths gets two keys though git considers it one repo. Pre-1.7.8 submodules with a real `.git` directory, or a custom `submodule.<name>.gitdir`, need the superproject found by walking up the checkout path instead of from the link.

## Q3 — Home rule tested against the key instead of the checkout

**Fix:** Test the home exception against the checkout root (`--show-toplevel`, or `core.worktree` when there's no working copy), not against the computed key. Keep the key rule otherwise: `init --separate-git-dir=~/.dotfiles ~` yields key `~/.dotfiles` but toplevel `$HOME` → no project.

**Why:** The stated rule is about a *checkout* at home, and Q3 is exactly the case where key and checkout diverge. One extra value in the decision, no change to key derivation, so no existing non-home keys move.

**Gets wrong:** A worktree of that home repo added elsewhere (`git worktree add /tmp/w`) has toplevel `/tmp/w` and becomes a project — one repo, two keys. Needs `$HOME` and the toplevel compared after realpath normalization (symlinked home, `/home/u/../u`). And records already filed under `~/.dotfiles` are orphaned; they need a one-time move or they're lost.

## Q4 — Hard link looks like a regular file

**Fix:** Add `st_nlink > 1` to the "not ours, leave alone" test alongside symlinks, so init skips the file (and says so) rather than appending.

**Why:** A hard link is a name for the outside file; `lstat` can't tell it from a normal one but the link count can, and refusing costs nothing since init already decides everything before writing. Same conservative rule as symlinks, one condition.

**Gets wrong:** Legitimate multi-named files (dedup/backup tooling, hardlink farms, a link whose other name is *inside* the same repo) are skipped though appending was harmless — setup silently incomplete. It also misses a bind-mounted file (nlink 1, writes pass through to outside) and a symlinked parent directory. And it's TOCTOU: a link made between check and append still leaks; a temp-file-plus-rename would close that window but silently breaks the user's link and diverges the two names, and drops ownership/permissions unless copied.
