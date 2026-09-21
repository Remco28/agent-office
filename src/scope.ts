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

/** `AND (scope = 'global' OR project IN (...))`, or nothing when unscoped. */
export function scopeClause(matches: string[]): { sql: string; params: string[] } {
  if (!matches.length) return { sql: " AND scope = 'global'", params: [] };
  const placeholders = matches.map(() => "?").join(",");
  return {
    sql: ` AND (scope = 'global' OR project IN (${placeholders}))`,
    params: matches,
  };
}
