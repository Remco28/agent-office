# K1 peer check, run after the fix (Claude subagent, fresh; git 2.55 experiments in scratch)
Holds: both "Reinitialized existing" wordings match; LC_ALL=C affects only messages; a non-zero reinit takes the old path; no new throw.
LOW: repairing a broken .git (HEAD only) was reported as no git action. LOW: in 300 racing double inits the loser always exited 128 (never reinit); in 4/300 the immediate resolve failed because the winner was still writing. LOW: the `m` flag lets a newline in a folder name fake a match.
Applied: "repaired git repository" action (with a test); resolve retried briefly (10 × 50 ms) after a failed git init; `m` dropped. 173 pass.
