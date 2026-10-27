# Init file-safety specialist — Claude (fresh general-purpose subagent). Saw: runnable copy r2/claude at c9dad28+0a0f3cd577e8, throwaway HOME/OFFICE_HOME/OFFICE_PORT, GIT_CONFIG_GLOBAL=/dev/null. Could write (harness); checked after: copy unchanged except .git/index; real ~/AGENTS.md, ~/CLAUDE.md absent.

Report as returned (condensed; findings, commands and outputs kept):

Overall: refusal and placement logic sound. Every refusal fires before any write ($HOME, inside a home-rooted repo, subfolder of a repo, bare repo or .git folder, subfolder of the office checkout). Writes land in the real worktree root. One MEDIUM half-done write, one MEDIUM wrong-project problem from office.project, a few LOWs.

1. MEDIUM, reproduced — `.claude` linked to `.agents` (or the reverse): init crashes partway. src/init.ts:207-226 (plan) and 311-316 (write). Planning queues both `.claude/skills` and `.agents/skills` (both missing) but they are the same path; the second symlinkSync fails EEXIST after office.project is written and one link exists; AGENTS.md and CLAUDE.md never written. Contradicts "a refusal leaves the folder as it was".
   mkdir -p a/.agents; git -C a init -q; ln -s .agents a/.claude; init → EEXIST ... exit=1. Rerun finishes.
   Fix: dedupe by real path of parent/skills before writing.

2. MEDIUM, possibly HIGH, reproduced — a copied repo files under the original project. init writes office.project (init.ts:298-308); detectCwdProject / normalizeProject prefer it over git's repoRoot. `cp -r ~/P/api ~/P/api-experiment` copies .git/config, so agents in the copy resolve to ~/P/api until init is rerun there; memories/work mix. `mv api api2` → api2 still resolves to .../api; a new repo later at api shares the key. office.project adds nothing for worktrees (repoRoot already from --git-common-dir); its only effect is these copy/move cases; no doc or test gives it another purpose (init.test.ts:39 only checks it is set).
   detectCwdProject(api-experiment) → .../P/api; after mv, detectCwdProject(P/api2) → .../P/api.
   Fix: drop the key, or ignore it unless it equals the computed repoRoot.

3. LOW, reproduced — a non-UTF-8 AGENTS.md (Latin-1, UTF-16 BOM) is re-encoded on append; invalid bytes become U+FFFD (init.ts:235, 324). `66e9` → `66ef bfbd`. Fix: append bytes (appendFileSync) or warn.

4. LOW, reproduced — hasOfficeInstructions' `\boffice\s+(begin|peek)\b` matches "Run the back-office begin script": no section, no warning, CLAUDE.md linked, reported set up.

5. LOW:
- AGENTS.md is a directory: warns, but still creates CLAUDE.md -> AGENTS.md (link to a directory). Reproduced.
- Run in a linked worktree: files go into the worktree only, uncommitted; vanish with throwaway (T3) worktrees; the message names the main repo although nothing was written there. Reproduced.
- `office init ~/Projects` (a parent of many repos) is not refused: git init there, AGENTS.md/CLAUDE.md "This repository (`Projects`)"; Claude Code reads parent CLAUDE.md files, so nested repos' agents see the wrong name; non-repo subfolders resolve to "Projects". User's choice, LOW; a warning when the target contains git repos would be cheap. Reproduced.
- User's own .claude/skills folder or broken link there: left alone silently, no warning that office skills were not linked. Read.
- Read/write not atomic: AGENTS.md read at planning, rewritten after git init/config; an edit between is lost; if git init fails the mkdir stays. Tiny windows. Read.

Done well: plan-before-write with all refusals in planning (all reproduced, nothing written); real-path comparison; links never edited (each gets a specific warning); existing CLAUDE.md never overwritten; no .git/info/exclude writes.
