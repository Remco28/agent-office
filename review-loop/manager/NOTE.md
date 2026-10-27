# Removing the office manager role (2026-10-27, Frank's decision)

A removal, not a change to what is computed for anyone who never used the role (one session
ever held it), so no peer step before code; a fix auditor after. 163 tests pass, plus a new CLI
test that `--role` and `OFFICE_ROLE` are refused with a message.

Fix audit (Codex gpt-6-luna, read-only; fix-audit-codex.md): no runtime breakage; one LOW (the
naming plan still described roles as current) — fixed with a note at its end.
