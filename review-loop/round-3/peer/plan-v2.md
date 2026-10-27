# Plan v2 (claude-9264), after pass 1 and Frank's answer (2026-10-27)

Frank: the only folder of projects is ~/Projects; projects are not buried deep. So Q1 does not grow.

Q1 (H1). Keep the 3-level look (dot-folders and node_modules skipped). Add one thing: a child that
is a LINK to a folder counts as a repository if its target holds `.git`; links are never
descended (Claude critic: descending walks ancestors, /usr, mounts). No budget, no refusal for
size. Bare repositories are not counted (no agent works inside one; its worktrees are elsewhere).
Docs and help say "a few folders down". Only applies when the target is not itself in a repo.

Q2 (H2). Recognise `<G>/worktrees/<n>/modules/<m>` ONLY if `<G>/worktrees/<n>/gitdir` exists
(else: not this case; key as for any git folder). Then: if `<G>/modules/<m>` exists → its key (main
checkout's), as now. Else key = `<superproject root>/<the submodule's checkout relative to the
superproject worktree's top>` (top = dirname of the path in that gitdir file; checkout = the
submodule's core.worktree resolved; real paths both sides). If that relative path is empty or
escapes the top (stale core.worktree after a manual move), fall back to `<superproject root>/<m>`.
Residue, accepted: a branch that moves the submodule gives two keys; a separate-git-dir
superproject's fallback root is its git folder.

Q3 (H3). No project when the checkout top (`--show-toplevel`) is home, as well as when the key is
(detectCwdProject and normalizeProject).

Q4 (H4). AGENTS.md with more than one hard link is left alone with a warning, like a symlink —
except exactly 2 links where CLAUDE.md is the same file (same dev+ino): append, as for a plain
file. CLAUDE.md's link count is not checked (init never writes it).

H5. One display-name helper used by init (AGENTS.md text, message) and the begin banner: the key's
last folder name; if it starts with "." (`.bare`, `.dotfiles`, `.git`), the parent folder's name;
a trailing ".git" dropped (`proj.git` → `proj`). Keys unchanged.
H7. AGENTS.md is created with flag "wx"; if it appeared since planning, leave it and warn ("AGENTS.md
appeared while init ran; rerun office init").
H11. Two inits at once: a skills link or CLAUDE.md link that already exists by write time and
points where init meant counts as done (EEXIST + same target); otherwise warn, never throw. Before
appending, re-read AGENTS.md and skip if the marker is now there (narrows the double-append window;
the remaining microsecond window is accepted).
H10. init refuses a folder whose repository's key is home (a worktree of a home-rooted repo), with
the same message as a folder inside a home repo.
H12. init refuses when the target has a `.git` (any kind) but git does not see a repository there.
H14 (reproduced: GIT_TEMPLATE_DIR with an info/exclude listing AGENTS.md hides it). Add
GIT_TEMPLATE_DIR to the stripped variables.
LOW: H6 scope_note when a project named by --project/OFFICE_PROJECT differs from the folder's
project ("filed under X as named; this folder is Y"); H8a/H8b help wording; H9 a failed git spawn
(no git) = not a repository; H13 "no project linked" → current wording.
