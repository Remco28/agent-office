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
