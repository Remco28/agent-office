## Findings

No unintended regressions found in the supplied fixes. I found no change applied in one place but missed in a relevant caller or route.

## Hunk audit

- **`src/init.ts:383–412` — Record the checked real folder for skill links.** Each planned link now remembers the resolved `.claude` or `.agents` directory. This supports creating the skills link in the folder init actually inspected. I found no regression in the path handling.

- **`src/init.ts:475–507` — Create and initialize the resolved target; handle a concurrent `git init`.** Directory creation and `git init` now use the resolved target path. If another init creates the repository first, the code tries to resolve and use it. I found no data-loss or wrong-project scenario. In that race, the result may still describe an already-created repository as initialized; that appears to affect reporting, not project selection or files.

- **`src/init.ts:512–545` — Create skill links in the checked folder and report changes during init.** For an existing directory or an internal directory symlink, init links inside the resolved folder and checks whether the parent changed while it ran. For a previously missing parent, it creates that real path and avoids following a symlink substituted at the typed path. This addresses the relevant race without breaking the existing internal-symlink case.

- **`src/scope.ts:105–114` — Check Git ancestry through the real path.** `hasGitAncestor` now walks the resolved directory’s parents, matching Git’s behavior when the starting path is a symlink into a repository. The callers in `resolveGitProject` and cwd project detection use this check. I found no regression for ordinary paths.

- **`src/scope.ts:161–175` — Handle a deinitialized submodule in a linked worktree.** The main checkout’s submodule config is used only if it still has `core.worktree`; otherwise the code falls back to the worktree-derived path. This avoids treating stale config left by `git submodule deinit` as the submodule’s project location. The project-scope caller still goes through `sharedRoot` and `resolveGitProject`; I found no missed caller.

- **`tests/init-safety.test.ts` — Add coverage for a symlink into a repository.** The test checks that init refuses both the linked subfolder and a new child beneath it, and creates neither. This is coverage only; it changes no runtime behavior.

- **`tests/project-scope.test.ts` — Add coverage for a deinitialized submodule.** The test checks that project detection from a submodule in a linked worktree still returns the main checkout’s submodule path after deinit. This is coverage only.

## What should be kept

The fixes make init’s writes follow the resolved paths that its checks examined, and make project detection account for Git following symlinks. The submodule change also handles the stale-config case directly. The added tests preserve coverage for both behaviors.
