
**J1 — link below a repo top**
*Fix:* Resolve once, up front, and use that one real path everywhere: run `resolveGitProject` and the `.git` parent walk on the real target, not the link's logical path.
*Why:* The comparisons already trust the real path; detection was the only step still trusting the link. One canonical path removes the disagreement that lets a nested repo be planted.
*Gets wrong:* A dangling or unreadable link (realpath fails) — if the failure is treated as "no repo," init proceeds and writes through a path it never verified. It also stops honouring the link's *logical* location: a link sitting inside repo A but pointing outside it is now set up as a fresh project rather than refused as "under a repo."

**J2 — deinit'd submodule config**
*Fix:* Use the config's `core.worktree` only when that key is present and non-empty; if the file exists but the key is gone, take the same fallback as when the file is absent. Never key on the git folder.
*Why:* The config file's existence proves nothing about a checkout; `core.worktree` is the actual signal. Treating "config without worktree" identically to "no config" keeps the key stable across deinit/re-init.
*Gets wrong:* A submodule still checked out in the worktree but deinit'd in the main checkout — the fallback now files the live worktree copy under the (empty) main-checkout path. It also can't repair a stale `core.worktree` left after the submodule was moved or renamed, which yields two keys for one folder.

**J4 — `.claude` swapped mid-init**
*Fix:* Before writing, re-resolve `.claude` and require its real path to still be inside the project root — and be the same target that was planned — instead of only re-checking that it is still a link.
*Why:* The invariant is containment, not entry kind. A kind check is satisfied by any link, including one pointing out of the project.
*Gets wrong:* It checks the parent only: `.claude` may be a genuine in-repo directory while `.claude/skills` is already a link out, and containment of the parent says nothing about the child. And it is still a check-then-write race — a swap after the re-check but before creation still escapes, so only writing through an already-verified handle (or verifying after creation) actually closes it.
