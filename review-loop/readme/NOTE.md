# README trim (2026-10-27)

The README is for a human (the owner, or whoever sets up a machine); agents get init's section
and, in this repo, AGENTS.md. 4,003 → ~2,170 words: the agent-facing usage (sessions, names,
peek, records, issues, tools, retrieval detail, desk's init paragraph, skills list) became one
"Using it" section; the model-floor measurements moved to docs/retrieval-floor.md.

Check: one fresh reader (Claude Sonnet, read-only), old and new README plus AGENTS.md and init's
section. A human can install, update, set up a project and understand the agents from the new one;
nothing a human needs was lost; nothing false. MEDIUM (also in the old README): updating did not
say to stop the running daemon — fixed. LOW: nobody said the daemon starts itself — fixed. Other
LOWs (old linked-AGENTS.md projects, the removed role, the two named skills) are reported by the
tools themselves or covered in AGENTS.md; left out deliberately.
