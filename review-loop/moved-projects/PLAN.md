# Plan: notes follow a moved project; a removed one is labelled, never deleted

*Light review (review-loop SKILL.md). Written 2026-10-27 by claude-9264. Frank deferred the
choices to the author's recommendations, given in the conversation and listed below.*

## The problem, plainly

A project's key is its folder path (`src/scope.ts`: the repo folder; reads match it exactly, and
old spellings were renamed once at start by `src/rekey.ts`). If the folder is moved or renamed,
agents in the new folder start from nothing and the old notes sit under a path nobody reads. If
it is removed, its notes linger unseen. A copy is deliberately its own new project (decided in the
first review). Each machine has its own office; nothing syncs between them, so the same repo on
two machines is two records, not a move.

## Decisions (Frank deferred to these recommendations, 2026-10-27)

1. A project is recognised after a move by its git fingerprint: its first commit
   (`git rev-list --max-parents=0 HEAD`; with several roots, the lowest hash).
2. Move: a folder whose fingerprint matches exactly one known project whose folder no longer
   exists → that project's notes carry over automatically, and the check-in says so.
3. Copy: the matching project's folder still exists → nothing carries over (a new project).
4. Removed: a known project whose folder no longer exists and that nothing has replaced is
   labelled "folder gone" (in `office status`, and on the desk). Nothing is ever deleted
   automatically.
5. Checks run at check-in (`begin`, for the caller's own project) and at daemon start (for every
   stored key). Neither needs the human to run anything.

## The plan

1. New table `projects (key TEXT PRIMARY KEY NOT NULL, fingerprint TEXT, seen_at TEXT NOT NULL)`,
   created in `openDb`'s migrate step (no git there).
2. `fingerprint(key)` in `src/scope.ts`: the lowest root commit of the repo at `key`, or null (not
   a folder, not a repo, no commits). Uses the existing `git()` (environment stripped, timeout).
3. At daemon start, after `canonicalizeProjects` (`src/server.ts` `serve()`), `recordProjects(db)`:
   for every distinct stored path key whose folder exists and has no `projects` row, record its
   fingerprint. Keys already recorded cost nothing; on this machine the first run is ~40 git calls.
4. At `begin` (not `peek`, which writes nothing), for the caller's project when it came from the
   folder or a declared existing path, `followMove(db, key)`:
   - compute its fingerprint (null → stop);
   - candidates = `projects` rows with the same fingerprint, a different key, and whose folder no
     longer exists;
   - exactly one → rename that key to this one in every table (`memories`, `work`, `issues`,
     `session_state`) and in `projects`, in one transaction, reusing rekey's update; the briefing's
     `scope_note` says "<name> moved here from <old path>; its notes came with it";
   - several → rename nothing; the note names them and says to ask the human;
   - record this key's fingerprint.
5. "Folder gone": `goneProjects(db)` lists stored path keys whose folder does not exist, with a
   count of their records. `/status` gains `gone_projects`; the desk shows "N projects whose
   folder is gone" when N > 0. Nothing else reads it; no briefing shows another project's details.
6. Tests: move (notes follow, note said, old key gone from every table); copy (nothing moves);
   two gone candidates (nothing moves, note names both); a repo with no commits (nothing); peek
   detects nothing and writes nothing; `gone_projects` lists a removed folder; daemon start records
   fingerprints once and makes no git calls the second time.
7. Docs: a design rule line in AGENTS.md; README; an amendment in docs/sessions-and-notices.md.

## What I am least sure of

- A rebased or rewritten history changes the root commit; a squashed import too. Then a move is
  simply not detected (no harm, notes stay under the old key and show as "folder gone").
- Two unrelated repos created from the same template share a root commit. A move from one to the
  other's folder would need the first one's folder gone and no other candidate.
- A folder that is only temporarily missing (an unmounted drive) shows as "folder gone" and could
  be picked as a move source if a same-fingerprint folder checks in meanwhile.

## Pass 1 results: the plan grows, so the design changes (2026-10-27)

Critic (Codex; critic-codex.md): 3 HIGH, 2 MEDIUM, "the plan gets bigger". (1) a copy inherits the
original's notes once the original is deleted, and template repos share a root commit; (2) carrying
notes onto a key that already has history merges two projects, and collides in `projects`;
(3) canonicalization does not update `projects`; (4) git calls at check-in and start can stall;
(5) an unplugged drive looks gone and becomes a move source.
Blind solver (Claude Opus; blind-claude.md): the same core, and it grew too (an audit table, a
mount-point heuristic, shallow-clone rules), naming template repos as its strongest risk.

Both passes made the plan bigger to make automatic carry-over safe, and none of the fixes closes
the template or deleted-on-purpose cases. Per SKILL.md (a plan that grows is a design problem; a
HIGH means it is no longer light), the author withdraws recommendation 2 (automatic carry-over).
Frank had deferred these choices to the author; this change is reported to him.

## Plan v2: notice and say; move only on a deliberate command

1. `projects (key TEXT PRIMARY KEY NOT NULL, fingerprint TEXT, seen_at TEXT NOT NULL)` in migrate.
   Fingerprint = the sorted root commits; null for an empty repo or a shallow clone.
2. Fingerprints are recorded once per key: at `begin` for the caller's project (one git call, the
   first time only), and at daemon start for stored keys whose folder exists and have none (one
   call each, once). Keys are always written normalized, so canonicalization never has to touch
   this table (its later passes only retry plain names).
3. "Folder gone": `/status` gains `gone_projects: [{project, records}]` (a stat per key, no git);
   the desk shows "N projects whose folder is gone" when N > 0. Nothing is deleted.
4. At `begin` and `peek`: if the caller's project has no records of its own and its fingerprint
   matches recorded keys whose folders are gone, the `scope_note` says so and names the command:
   "this repository shares its history with <old path>, whose folder is gone. If it moved here,
   `office move <old path>` brings its notes over." It names only this repository's own history.
5. `office move <old> [--project <new>]` (new defaults to the folder's project): renames `old` to
   `new` in memories, work, issues, session_state and projects, in one transaction. It refuses,
   moving nothing, when: `old` has no records; `old`'s folder still exists ("that folder still
   exists, so this is a copy"); `new` already has records ("this project already has notes of its
   own"); both have fingerprints and they differ. A key from before fingerprints existed (none
   recorded) may be moved, because the move is deliberate. The CLI prints what moved.
6. Tests: the begin note appears for a moved repo and not for a copy, a different history, or a
   project with notes; `office move` moves every table and each refusal moves nothing; status lists
   a gone folder and clears when it returns; fingerprints are recorded once (no git call the second
   time); peek writes nothing.
7. Docs: a design rule in AGENTS.md (notes never move without a deliberate command), the command
   in init's section and help, README, an amendment in docs/sessions-and-notices.md.

## Pass 2 (fresh critic, Claude Sonnet) and the build

The v2 critic found no way for notes to move without the command, and no way for `move` to merge
two projects or hand a copy the original's notes. Its fixes made the plan smaller, all taken: no
fingerprinting at daemon start (begin records its own project); no note on peek; the gone list is
its own route (/projects/gone), not part of /health that every command calls; a null fingerprint
is not stored (retried next check-in); the destination must exist; histories match when their
root sets share a commit; the note tells the agent to ask the human first, before writing.

Fix audit (Codex; fix-audit-codex.md): no path moves notes without the command. MEDIUM: the
destination could be a file — fixed (must be a folder; tested). MEDIUM: a check-in scans
fingerprints — declined (runs only for a brand-new project with no notes); second opinion AGREE.
LOW: the move test moved no issue — fixed. Its second opinion on the author's two declines (no
--anyway override for rewritten history; a new repo at a removed project's exact path inherits its
notes, as before): AGREE on both. 175 tests pass.
