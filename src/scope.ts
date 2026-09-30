import type { Database } from "bun:sqlite";
import { homedir } from "node:os";
import { basename, join, resolve } from "node:path";

/**
 * Turn a user-supplied project reference into a stable key. A path stays a
 * path (expanded, absolute, no trailing slash); anything else is kept as a
 * plain name so the slug-style values written before the split still work.
 */
export function normalizeProject(raw: string): string {
  let value = raw.trim();
  if (!value) return "";
  if (value === "~") value = homedir();
  else if (value.startsWith("~/")) value = join(homedir(), value.slice(2));
  if (value.includes("/")) value = resolve(value);
  const trimmed = value.replace(/\/+$/, "");
  return trimmed || "/";
}

function looksLikePath(value: string): boolean {
  return value.includes("/");
}

/** The part of a project key two different spellings can agree on. */
/**
 * What to tell a session that never named a project.
 *
 * Reads in that state resolve to the everywhere notes and nothing else, so the
 * honest answer to "what do you know about this?" is "nothing yet" — never a
 * list of other projects' notes. The note is what turns that silence into
 * something an agent can act on instead of concluding the office is empty.
 */
export const NO_PROJECT_NOTE =
  "no project declared — only the memories that apply everywhere are in scope; " +
  "name one with `office begin --project <path> --by <agent>`";

/**
 * What to tell a session with no project that asks for unfinished work.
 *
 * The answer used to be every project's loose ends, which is the read the
 * scope rule exists to refuse. It is not silence either, because the items
 * filed with no project at all belong to nobody — showing those cannot hand
 * anyone the wrong project's work, and it is the only way such a handoff is
 * ever found again.
 */
export const UNCLAIMED_WORK_NOTE =
  "no project declared — showing only the work filed with no project of its own; " +
  "nothing filed under a project is included. Name one with " +
  "`office begin --project <path> --by <agent>`";

/**
 * What to say at the moment a write lands with no project. The agent can fix
 * this for free right now, by naming one; later it is a handoff nobody looks
 * for. Said on the way in, not read out of a report afterwards.
 */
export const UNCLAIMED_WRITE_NOTE =
  "this has no project, so it is filed as unclaimed: only a reader who asks " +
  "for the unclaimed will see it. Pass --project <path>, or it will keep " +
  "filing that way";

/**
 * What to say at the moment a memory lands with no project and no `--global`.
 * It is the sibling of the note above: the same trap, one record over.
 */
export const UNATTRIBUTED_MEMORY_NOTE =
  "this memory has no project and is not marked --global, so no project-scoped " +
  "read will find it. Pass --project <path>, or --global if it applies everywhere";

/**
 * What to tell a session that has never been here before and is being handed
 * the recent trail. Its own visit cannot be the watermark — it does not have
 * one — so the frame is stated rather than implied, and every event names the
 * project it came from.
 */
export const RECENT_ACTIVITY_NOTE =
  "you have no previous visit of your own, so this is the office's most recent " +
  "activity rather than what changed since you were last here; each item names " +
  "the project it belongs to";

export function projectKey(raw: string): string {
  return basename(normalizeProject(raw)).toLowerCase();
}

/** Every distinct project value already recorded, in memories and in the log. */
export function knownProjects(db: Database): string[] {
  const out = new Set<string>();
  for (const table of ["memories", "work"]) {
    const rows = db
      .query(`SELECT DISTINCT project AS p FROM ${table} WHERE project IS NOT NULL`)
      .all() as { p: string }[];
    for (const row of rows) out.add(row.p);
  }
  return [...out];
}

/**
 * Project values that refer to the same project as `project`.
 *
 * Two real paths must match exactly — `~/work/api` and `~/personal/api` are
 * different projects. A bare name (what the old `source` column held, e.g.
 * `fencing-team-draft-game`) is matched on its last segment, so a legacy row
 * still answers when you name the folder it lives in.
 */
export function matchingProjects(db: Database, project: string): string[] {
  const wanted = normalizeProject(project);
  if (!wanted) return [];
  const key = projectKey(wanted);
  return knownProjects(db).filter((candidate) => {
    const normalized = normalizeProject(candidate);
    if (normalized === wanted) return true;
    if (looksLikePath(candidate) && looksLikePath(wanted)) return false;
    return key.length > 0 && projectKey(candidate) === key;
  });
}

/**
 * `AND (scope = 'global' OR project IN (...))`.
 *
 * An empty match list is the everywhere notes, not "no filter": the only way
 * to reach the whole store is to ask for it by name (`listMemories`), never by
 * leaving the project out. Keeping that rule here means scope is decided in
 * exactly one place.
 */
export function scopeClause(matches: string[]): { sql: string; params: string[] } {
  if (!matches.length) return { sql: " AND scope = 'global'", params: [] };
  const placeholders = matches.map(() => "?").join(",");
  return {
    sql: ` AND (scope = 'global' OR project IN (${placeholders}))`,
    params: matches,
  };
}
