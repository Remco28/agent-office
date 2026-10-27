**MED — Q1 is still reproducible through a symlink to a folder containing repos.** `nestedRepos` checks whether a linked folder itself has `.git`, then skips it; it never searches inside the linked folder as plan v3 calls for ([init.ts](/home/frank/Projects/agent-office/src/init.ts:128)).

In an isolated `exp` fixture, `Projects/shared` pointed to a folder containing `team/api/.git`. `initProject(Projects)` succeeded and created `.git` and `AGENTS.md` in `Projects`, instead of refusing. That `AGENTS.md` can affect agents in the contained repositories.

The depth limit is documented; this reproduction is specifically the missed linked-folder traversal.
