# Plan: names are signatures; the office never decides a project from memory

*Review-loop peer step (critics and a blind solver before code). Written 2026-10-27 by claude-9264.*

## The problem, plainly

agent-office keeps one row per agent session (`session_state`: author, project, updated_at, role).
A command finds its project as: its own `--project` / `OFFICE_PROJECT` (folded in by the CLI),
else the git repository it runs in (`detectCwdProject`), else **the project its session
remembers** (`resolveScope` in `src/session.ts`). The agent-office checkout itself deliberately
infers nothing from its folder, so agents working on the office pass `--project .` and rely on
the remembered project afterwards.

Making the remembered project safe needed machinery: an "unnamed slot" row (key `''`) shared by
every caller that gave no name and able to hold a project; "with two or more named sessions and
no name, answer nothing" (ambiguity); three kinds of author warning; and the rule that a name is
never inherited. Names themselves (`--by codex` → `codex-4821`, minted by `claimIdentity`) are
now wanted only as a signature: which provider and which run wrote a record. Worktrees and
"one agent, one repository" prevent collisions; the folder decides the project.

## Decisions already made by the owner (Frank, 2026-10-27)

1. Names are a signature only, not a coordination mechanism.
2. The agent-office checkout is an ordinary project: its folder decides, like any repo.
3. The office never decides a project from a session's memory. A command's project is its
   `--project`/`OFFICE_PROJECT`, else the git repo it runs in, else none.
4. Accepted cost: a folder that is not a git repo gives no project; agents there pass
   `--project` on each command, or the folder is made a repo (`office init`).

## The plan

1. `detectCwdProject` (`src/scope.ts`): drop the office-checkout exception. Keep the home-folder
   exception.
2. `resolveScope` (`src/session.ts`):
   - project = declared ?? folder ?? null; `project_source` ∈ declared | folder | none.
   - author = declared ?? null; `author_source` ∈ declared | none. The `active` and
     `ambiguous` sources go.
   - `scope_note`: keep both notes. "Filed under X (this folder); this session began on Y" compares
     the folder project with the caller's own row's project (or `projectBefore` from begin).
     "Filed under X as named by --project; this folder is Y" is unchanged.
   - `active_since`: the caller's own row's `updated_at` when that row's project is the project.
3. Sessions:
   - `beginSession`: no name → no row is written, and `previous` is null. With a name, the row
     stores project = declared ?? folder (unchanged for named callers).
   - Remove the unnamed slot: the `''` key and its special cases in `setActive`, `getSession`
     and `sessionKey`. Startup migration deletes any `author = ''` row (none exist on this machine).
   - Remove `getActive`. `/status` `active` becomes null or is dropped.
4. `authorWarnings`: one warning when no name is declared: "no --by declared, so what you write
   is unsigned. Pass --by <agent> or export OFFICE_AUTHOR." `peek` without a name gets the same.
5. Unchanged:
   - minting (`claimIdentity`), case-insensitivity, resuming a numbered name;
   - the watermark (`previous.updated_at`) and notices;
   - pruning after 30 days, and the session list (this project's sessions);
   - roles (the manager cut is a separate, later step);
   - `OFFICE_AUTHOR`/`OFFICE_PROJECT` resolved by the CLI, never the daemon.
6. Docs and help:
   - `src/cli.ts` help: the lines about "what your session remembers" and "the agent-office
     checkout" go.
   - AGENTS.md: the "In this checkout … `--project .`" line goes, and so does "this checkout infers
     nothing" in the folder rule.
   - README and docs/sessions-and-notices.md: the unnamed-slot and remembered-project text goes.
   - Init's section is unchanged.
7. Tests:
   - The ~15 tests of the unnamed slot and ambiguity are rewritten as tests of the new rule:
     no name → unsigned, no row; a remembered project is never used.
   - The office checkout resolves to itself.
   - A non-git folder gives no project even after `begin --project X` there.

## What I am least sure of

- Callers that reach the daemon without `cwd_project` (anything other than the CLI) used to get
  the remembered project; now they get none unless they pass `project`.
- `begin` in a non-git folder with `--project X`, then later commands without `--project`: these
  now file as unclaimed. Is the warning loud enough at that moment?
- Anything else that reads `session_state.project` to decide something.

## Peer step results (2026-10-27)

- Critic (Codex gpt-6-luna, read-only; critic-codex.md): one finding, MEDIUM — `/status.active`
  stops reporting a machine's only session. Declined: the only reader is the desk (src/tui.ts),
  which already falls back to the newest session, the same row on a one-session machine. The
  desk now uses that directly. No other failures found.
- Blind solver (Claude Opus; blind-claude.md): reached the same plan independently. Taken: the
  bare-name note, the begin note for a project declared outside a repository, a named begin
  writing where it checked in this time (no stale project), the checkout-key test, and CLI tests
  that never write into a real office. Plan did not grow in parts: two notes, one simplification.
- Stopped after one pass: both found only details, and the plan got smaller where it changed.

## Fix audit (2026-10-27; fix-audit-codex.md)

Codex gpt-6-luna, read-only, the diff hunk by hunk. No behaviour finding; no remaining caller of
getActive or UNNAMED_SESSION.
- MEDIUM: docs/sessions-and-notices.md still read as current about the unnamed slot. Fixed: a
  note at the top says it is a history and that the last amendment replaces those sections.
- LOW: the bare-name note said "signs this write", but it also shows on reads. Reworded.
- LOW: a test title still named the unnamed slot. Renamed.
- LOW: a server comment still said "else what is remembered". Fixed.
169 tests pass (175 before: obsolete unnamed-slot and ambiguity tests removed, new-rule tests added).

*Later the same day: the office manager role was removed too (review-loop/manager/), so the
`role` column and "roles unchanged" above describe the state before that.*
