# Blind solver — Claude Opus subagent (problem and decisions only). Read-only. Condensed.

Same core as PLAN.md (fingerprint = root commits; a projects table; carry over at begin only when
exactly one same-fingerprint key's folder is gone and the new key has no records; peek reports
only). Its additions grew the plan: an append-only project_moves audit table, shallow-clone and
empty-repo exclusions, a re-check inside the transaction for two check-ins at once, a mount-point
heuristic for unplugged drives, status and desk blocks for gone projects and recent moves,
fingerprinting after the server starts listening. Its own strongest risks: template or forked repos
share a root commit, so a new project from the same template takes a deleted project's notes;
an unmounted drive looks gone; delete-then-reclone brings notes back when the human meant to start
over; a write before the first check-in blocks a carry-over for good.
