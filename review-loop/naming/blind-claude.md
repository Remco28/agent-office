# Blind solver — Claude Opus subagent (problem and decisions only; told not to read the plan). Read-only.

Condensed from its report. Its plan matched PLAN.md point for point: project = declared ?? folder ?? none;
author = declared ?? none; drop the office-checkout exception (the checkout key is realPath(ROOT),
the same as `--project .` gave, so records keep their key); an unnamed caller writes no row;
remove the unnamed slot (migration deletes the '' row), getActive and /status.active (the desk
falls back to the newest session); one author warning; keep both scope notes.

Additions it proposed: a soft warning for a bare un-numbered name with no row; a begin warning
when a project is declared in a folder that is not a repository; a test that the checkout key
equals normalizeProject(ROOT); move CLI tests that spawn from ROOT to temp folders.

Risks it listed: the checkout absorbs work run from it; non-git folders lose their project
quietly; a stale OFFICE_PROJECT becomes the main workaround (the declared≠folder note must be on
every write: it already is); nested repos resolve to themselves (unchanged); a child shell
inheriting OFFICE_AUTHOR signs as the parent (not detectable server-side); tui reads `active`;
a named begin from a non-git folder keeps a stale stored project.
