# Refusing a memory with no project (2026-10-27, Frank's decision)

Small change at one door (the /remember route); a fix auditor after. 165 tests pass, including a
CLI test that a project-less memory is refused and nothing is saved, while --global and
--project still work.

Fix audit (Codex gpt-6-luna, read-only; fix-audit-codex.md): one MEDIUM — the route lowercased
the scope for its check but remember() only accepts exactly "global", so `scope: "GLOBAL"` slipped
through as a project-less memory. Fixed: the route checks the same exact value remember() uses.
