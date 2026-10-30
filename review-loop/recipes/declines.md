What the author took and declined from the plan's critic (Codex) and blind solver (Grok), with reasons. Say which reasons do not hold.
- Critic HIGH, office routes under-specified. Taken: the probe tests the port, Claude may not be given a command that runs arbitrary code. DECLINED: fencing reads of the office's data folder; readers.md states it as a known limit. Reason: tested, sandboxes block writing there; a read needs a reader that goes looking with nothing pointing it there; a per-CLI deny list is more parts.
- Critic HIGH, a killed run leaves nothing. Taken: logs, kill-tested on Codex, Grok and Claude; brief says to state findings as you go.
- Critic MEDIUM, writes through dependency links. DECLINED, no change. Reason: tested, Codex and Grok refuse them, Claude has no write tool.
- Solver: stream directly into the ledger folder. DECLINED. Reason: streaming-json logs carry every tool output; the extracted report goes to the ledger instead.
- Solver: built work starts at the fix auditor with no plan. DECLINED. Reason: the human chose "the plan says so".
- Solver: check the project's git status after the run. DECLINED. Reason: writes to the project are refused by the sandboxes, tested.
- Solver: brief as a file on stdin or --prompt-file. Taken, tested on all four.
