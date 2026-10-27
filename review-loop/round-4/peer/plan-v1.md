# Plan v1 (claude-9264)
J1. init asks git about the real folder: `resolveGitProject(realPath(existing))` (and the other
git questions init asks — data-folder check, `.git` complaint — use the real path too). Detection
(`detectCwdProject`) and `normalizeProject` already resolve the real path first.
J2. Use the main copy's key only when its config has core.worktree; otherwise the computed
fallback (superproject root + path inside the worktree), which equals the main checkout's key
whenever the main checkout has the submodule at the same path.
J4. Plan records, per harness folder, the real folder it will write into. Just before mkdir/link,
recompute: the entry's kind, its real path, and that the real path is inside the repository's real
top must all match the plan; otherwise warn and skip.
