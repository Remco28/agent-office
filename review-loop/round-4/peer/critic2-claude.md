# Pass on built code (Claude subagent, fresh): the plan holds; no regression; no HIGH
Ran: 60/60 in the three test files; layouts (plain, rerun, worktree, .claude -> inside folder, .claude -> .agents, link to repo top, new folder under link to non-repo, J1 links) all right; two inits at once 20/20.
LOW-MED: a plain/missing .claude swapped for an outside link in the instant before linking still escapes (161/4733 runs with a 15 s swapper; 6/4560 when .claude started as a link) — cannot be closed in Node (no symlinkat); fix the comment, re-check after linking and warn.
LOW: J2 key moves when a branch moved the submodule (pre-existing; better than before).
LOW: two inits on a not-yet-existing folder: one fails with git's raw error (base code too).
LOW: raw EEXIST/ENOENT when the target is a file or under a broken link (nothing written; base too).
LOW: error messages name the typed path.
Applied: comment + after-link re-check warning; friendly mkdir error; git init failure tolerated when another init made the repo. Declined: branch-moved submodule (residue since round 3); typed path in messages (it is what the user typed).
